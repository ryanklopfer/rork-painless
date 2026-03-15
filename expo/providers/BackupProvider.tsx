import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { saveBackup, restoreBackup, getBackupStatus } from '@/lib/backupApi';
import type { BackupPayload } from '@/lib/backupApi';

const DEVICE_ID_KEY = 'rehabflow_device_id';
const LAST_BACKUP_KEY = 'rehabflow_last_backup';
const AUTO_BACKUP_KEY = 'rehabflow_auto_backup';

const STORAGE_KEYS = {
  PROFILE: 'rehabflow_profile',
  CHECK_INS: 'rehabflow_checkins',
  PAIN_ENTRIES: 'rehabflow_pain_entries',
  MUSCLE_GROUPS: 'rehabflow_muscle_groups',
  STREAK: 'rehabflow_streak',
  PROGRAM: 'rehabflow_program',
};

function generateDeviceId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 12);
  const platform = Platform.OS.substring(0, 3);
  return `${platform}_${timestamp}_${random}`;
}

export const [BackupProvider, useBackup] = createContextHook(() => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [lastBackupAt, setLastBackupAt] = useState<string | null>(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(true);
  const queryClient = useQueryClient();
  const autoBackupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const deviceIdQuery = useQuery({
    queryKey: ['deviceId'],
    queryFn: async () => {
      let stored = await AsyncStorage.getItem(DEVICE_ID_KEY);
      if (!stored) {
        stored = generateDeviceId();
        await AsyncStorage.setItem(DEVICE_ID_KEY, stored);
        console.log('[BackupProvider] Generated new device ID:', stored);
      } else {
        console.log('[BackupProvider] Loaded device ID:', stored);
      }
      return stored;
    },
  });

  const lastBackupQuery = useQuery({
    queryKey: ['lastBackup'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(LAST_BACKUP_KEY);
      return stored;
    },
  });

  const autoBackupQuery = useQuery({
    queryKey: ['autoBackup'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(AUTO_BACKUP_KEY);
      return stored !== 'false';
    },
  });

  useEffect(() => {
    if (deviceIdQuery.data) setDeviceId(deviceIdQuery.data);
  }, [deviceIdQuery.data]);

  useEffect(() => {
    if (lastBackupQuery.data !== undefined) setLastBackupAt(lastBackupQuery.data);
  }, [lastBackupQuery.data]);

  useEffect(() => {
    if (autoBackupQuery.data !== undefined) setAutoBackupEnabled(autoBackupQuery.data);
  }, [autoBackupQuery.data]);

  const backupStatusQuery = useQuery({
    queryKey: ['backupStatus', deviceId],
    queryFn: async () => {
      if (!deviceId) return { hasBackup: false, backedUpAt: null };
      return getBackupStatus(deviceId);
    },
    enabled: !!deviceId,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  const collectAllData = useCallback(async (): Promise<Omit<BackupPayload, 'deviceId'>> => {
    console.log('[BackupProvider] Collecting all local data for backup...');
    const [profile, checkIns, painEntries, muscleGroups, streak, program] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.PROFILE),
      AsyncStorage.getItem(STORAGE_KEYS.CHECK_INS),
      AsyncStorage.getItem(STORAGE_KEYS.PAIN_ENTRIES),
      AsyncStorage.getItem(STORAGE_KEYS.MUSCLE_GROUPS),
      AsyncStorage.getItem(STORAGE_KEYS.STREAK),
      AsyncStorage.getItem(STORAGE_KEYS.PROGRAM),
    ]);

    return {
      profile: profile ? JSON.parse(profile) : null,
      checkIns: checkIns ? JSON.parse(checkIns) : [],
      painEntries: painEntries ? JSON.parse(painEntries) : [],
      muscleGroups: muscleGroups ? JSON.parse(muscleGroups) : [],
      streak: streak ? parseInt(streak, 10) : 0,
      program: program ? JSON.parse(program) : null,
    };
  }, []);

  const backupMutation = useMutation({
    mutationFn: async () => {
      if (!deviceId) {
        console.log('[BackupProvider] Skipping backup - device ID not ready');
        return { success: false, backedUpAt: new Date().toISOString() };
      }
      try {
        const data = await collectAllData();
        const result = await saveBackup({ deviceId, ...data });
        if (result.success) {
          await AsyncStorage.setItem(LAST_BACKUP_KEY, result.backedUpAt);
          setLastBackupAt(result.backedUpAt);
        }
        return result;
      } catch {
        console.log('[BackupProvider] Backup failed gracefully - data is safe locally');
        return { success: false, backedUpAt: new Date().toISOString() };
      }
    },
    retry: false,
    onSuccess: (result) => {
      if (result.success) {
        console.log('[BackupProvider] Backup completed successfully');
        void queryClient.invalidateQueries({ queryKey: ['backupStatus'] });
        void queryClient.invalidateQueries({ queryKey: ['lastBackup'] });
      }
    },
  });

  const restoreMutation = useMutation({
    mutationFn: async () => {
      if (!deviceId) {
        console.log('[BackupProvider] Skipping restore - device ID not ready');
        return null;
      }
      try {
        const result = await restoreBackup(deviceId);

        if (!result.found || !result.data) {
          console.log('[BackupProvider] No backup found for this device');
          return null;
        }

        console.log('[BackupProvider] Restoring data from backup at:', result.data.backedUpAt);

        const writes: [string, string][] = [];

        if (result.data.profile) {
          writes.push([STORAGE_KEYS.PROFILE, JSON.stringify(result.data.profile)]);
        }
        if (result.data.checkIns) {
          writes.push([STORAGE_KEYS.CHECK_INS, JSON.stringify(result.data.checkIns)]);
        }
        if (result.data.painEntries) {
          writes.push([STORAGE_KEYS.PAIN_ENTRIES, JSON.stringify(result.data.painEntries)]);
        }
        if (result.data.muscleGroups) {
          writes.push([STORAGE_KEYS.MUSCLE_GROUPS, JSON.stringify(result.data.muscleGroups)]);
        }
        if (result.data.streak !== undefined) {
          writes.push([STORAGE_KEYS.STREAK, result.data.streak.toString()]);
        }
        if (result.data.program) {
          writes.push([STORAGE_KEYS.PROGRAM, JSON.stringify(result.data.program)]);
        }

        if (writes.length > 0) {
          await AsyncStorage.multiSet(writes);
        }

        void queryClient.invalidateQueries({ queryKey: ['profile'] });
        void queryClient.invalidateQueries({ queryKey: ['checkins'] });
        void queryClient.invalidateQueries({ queryKey: ['painEntries'] });
        void queryClient.invalidateQueries({ queryKey: ['muscleGroups'] });
        void queryClient.invalidateQueries({ queryKey: ['streak'] });
        void queryClient.invalidateQueries({ queryKey: ['program'] });

        return result.data;
      } catch {
        console.log('[BackupProvider] Restore failed gracefully');
        return null;
      }
    },
    retry: false,
    onSuccess: (data) => {
      if (data) {
        console.log('[BackupProvider] Restore completed successfully');
      }
    },
  });

  const scheduleAutoBackup = useCallback(() => {
    if (autoBackupTimerRef.current) {
      clearTimeout(autoBackupTimerRef.current);
    }

    if (!autoBackupEnabled || !deviceId) return;

    autoBackupTimerRef.current = setTimeout(() => {
      console.log('[BackupProvider] Running auto-backup...');
      backupMutation.mutate();
    }, 5000);
  }, [autoBackupEnabled, deviceId, backupMutation]);

  const toggleAutoBackup = useCallback(async (enabled: boolean) => {
    setAutoBackupEnabled(enabled);
    await AsyncStorage.setItem(AUTO_BACKUP_KEY, enabled.toString());
    void queryClient.invalidateQueries({ queryKey: ['autoBackup'] });
  }, [queryClient]);

  useEffect(() => {
    if (autoBackupEnabled && deviceId) {
      const interval = setInterval(() => {
        if (!backupMutation.isPending) {
          console.log('[BackupProvider] Periodic auto-backup check');
          backupMutation.mutate();
        }
      }, 15 * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [autoBackupEnabled, deviceId, backupMutation]);

  return useMemo(() => ({
    deviceId,
    lastBackupAt,
    autoBackupEnabled,
    cloudBackupAt: backupStatusQuery.data?.backedUpAt ?? null,
    hasCloudBackup: backupStatusQuery.data?.hasBackup ?? false,
    isBackingUp: backupMutation.isPending,
    isRestoring: restoreMutation.isPending,
    backupError: backupMutation.error?.message ?? null,
    restoreError: restoreMutation.error?.message ?? null,
    backupNow: backupMutation.mutate,
    restoreFromCloud: restoreMutation.mutate,
    toggleAutoBackup,
    scheduleAutoBackup,
    isLoading: deviceIdQuery.isLoading,
  }), [
    deviceId,
    lastBackupAt,
    autoBackupEnabled,
    backupStatusQuery.data,
    backupMutation.isPending,
    backupMutation.error,
    backupMutation.mutate,
    restoreMutation.isPending,
    restoreMutation.error,
    restoreMutation.mutate,
    toggleAutoBackup,
    scheduleAutoBackup,
    deviceIdQuery.isLoading,
  ]);
});
