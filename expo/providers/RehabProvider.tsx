import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { CheckIn, PainEntry, MuscleGroupVolume, SetLog } from '@/types';
import { defaultMuscleGroups } from '@/mocks/muscleGroups';

const STORAGE_KEYS = {
  CHECK_INS: 'rehabflow_checkins',
  PAIN_ENTRIES: 'rehabflow_pain_entries',
  MUSCLE_GROUPS: 'rehabflow_muscle_groups',
  STREAK: 'rehabflow_streak',
};

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

function calculateReadinessScore(checkIn: Omit<CheckIn, 'id' | 'date' | 'readinessScore' | 'notes'>): number {
  const painScore = (10 - checkIn.painLevel) * 10;
  const sleepScore = checkIn.sleepQuality * 10;
  const stressScore = (10 - checkIn.stressLevel) * 10;
  const energyScore = checkIn.energyLevel * 10;
  const raw = (painScore * 0.35) + (sleepScore * 0.25) + (stressScore * 0.15) + (energyScore * 0.25);
  return Math.round(Math.min(100, Math.max(0, raw)));
}

export const [RehabProvider, useRehab] = createContextHook(() => {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [painEntries, setPainEntries] = useState<PainEntry[]>([]);
  const [muscleGroups, setMuscleGroups] = useState<MuscleGroupVolume[]>(defaultMuscleGroups);
  const [streak, setStreak] = useState<number>(0);

  const checkInsQuery = useQuery({
    queryKey: ['checkins'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.CHECK_INS);
      return stored ? JSON.parse(stored) as CheckIn[] : [];
    },
  });

  const painQuery = useQuery({
    queryKey: ['painEntries'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.PAIN_ENTRIES);
      return stored ? JSON.parse(stored) as PainEntry[] : [];
    },
  });

  const muscleQuery = useQuery({
    queryKey: ['muscleGroups'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.MUSCLE_GROUPS);
      return stored ? JSON.parse(stored) as MuscleGroupVolume[] : defaultMuscleGroups;
    },
  });

  const streakQuery = useQuery({
    queryKey: ['streak'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEYS.STREAK);
      return stored ? parseInt(stored, 10) : 0;
    },
  });

  useEffect(() => {
    if (checkInsQuery.data) setCheckIns(checkInsQuery.data);
  }, [checkInsQuery.data]);

  useEffect(() => {
    if (painQuery.data) setPainEntries(painQuery.data);
  }, [painQuery.data]);

  useEffect(() => {
    if (muscleQuery.data) setMuscleGroups(muscleQuery.data);
  }, [muscleQuery.data]);

  useEffect(() => {
    if (streakQuery.data !== undefined) setStreak(streakQuery.data);
  }, [streakQuery.data]);

  const syncCheckIns = useMutation({
    mutationFn: async (data: CheckIn[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.CHECK_INS, JSON.stringify(data));
      return data;
    },
  });

  const syncPainEntries = useMutation({
    mutationFn: async (data: PainEntry[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.PAIN_ENTRIES, JSON.stringify(data));
      return data;
    },
  });

  const syncMuscleGroups = useMutation({
    mutationFn: async (data: MuscleGroupVolume[]) => {
      await AsyncStorage.setItem(STORAGE_KEYS.MUSCLE_GROUPS, JSON.stringify(data));
      return data;
    },
  });

  const syncStreak = useMutation({
    mutationFn: async (value: number) => {
      await AsyncStorage.setItem(STORAGE_KEYS.STREAK, value.toString());
      return value;
    },
  });

  const addCheckIn = useCallback((data: {
    painLevel: number;
    sleepQuality: number;
    stressLevel: number;
    energyLevel: number;
    notes: string;
  }) => {
    const readinessScore = calculateReadinessScore(data);
    const newCheckIn: CheckIn = {
      id: generateId(),
      date: new Date().toISOString(),
      readinessScore,
      ...data,
    };
    const updated = [newCheckIn, ...checkIns];
    setCheckIns(updated);
    syncCheckIns.mutate(updated);

    const today = getToday();
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const lastCheckIn = checkIns[0];
    if (lastCheckIn) {
      const lastDate = lastCheckIn.date.split('T')[0];
      if (lastDate === yesterday || lastDate === today) {
        const newStreak = streak + 1;
        setStreak(newStreak);
        syncStreak.mutate(newStreak);
      } else if (lastDate !== today) {
        setStreak(1);
        syncStreak.mutate(1);
      }
    } else {
      setStreak(1);
      syncStreak.mutate(1);
    }

    return newCheckIn;
  }, [checkIns, streak, syncCheckIns, syncStreak]);

  const addPainEntry = useCallback((data: Omit<PainEntry, 'id' | 'date'>) => {
    const newEntry: PainEntry = {
      id: generateId(),
      date: new Date().toISOString(),
      ...data,
    };
    const updated = [newEntry, ...painEntries];
    setPainEntries(updated);
    syncPainEntries.mutate(updated);
    return newEntry;
  }, [painEntries, syncPainEntries]);

  const logSets = useCallback((muscleGroupId: string, exercise: string, sets: number, reps: number, weight: number) => {
    const newLog: SetLog = {
      id: generateId(),
      date: new Date().toISOString(),
      exercise,
      sets,
      reps,
      weight,
    };
    const updated = muscleGroups.map(mg => {
      if (mg.id === muscleGroupId) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekStartStr = weekStart.toISOString().split('T')[0];
        const updatedLog = [...mg.weeklyLog, newLog];
        const weekSets = updatedLog
          .filter(l => l.date.split('T')[0] >= weekStartStr)
          .reduce((sum, l) => sum + l.sets, 0);
        return { ...mg, weeklyLog: updatedLog, currentSets: weekSets };
      }
      return mg;
    });
    setMuscleGroups(updated);
    syncMuscleGroups.mutate(updated);
  }, [muscleGroups, syncMuscleGroups]);

  const resetWeeklyVolume = useCallback(() => {
    const updated = muscleGroups.map(mg => ({
      ...mg,
      currentSets: 0,
      weeklyLog: [],
    }));
    setMuscleGroups(updated);
    syncMuscleGroups.mutate(updated);
  }, [muscleGroups, syncMuscleGroups]);

  const todayCheckIn = useMemo(() => {
    const today = getToday();
    return checkIns.find(c => c.date.split('T')[0] === today) ?? null;
  }, [checkIns]);

  const latestReadiness = useMemo(() => {
    if (checkIns.length === 0) return null;
    return checkIns[0].readinessScore;
  }, [checkIns]);

  const recentPainAverage = useMemo(() => {
    const recent = painEntries.slice(0, 7);
    if (recent.length === 0) return null;
    return Math.round(recent.reduce((sum, e) => sum + e.intensity, 0) / recent.length * 10) / 10;
  }, [painEntries]);

  const isLoading = checkInsQuery.isLoading || painQuery.isLoading || muscleQuery.isLoading;

  return useMemo(() => ({
    checkIns,
    painEntries,
    muscleGroups,
    streak,
    todayCheckIn,
    latestReadiness,
    recentPainAverage,
    isLoading,
    addCheckIn,
    addPainEntry,
    logSets,
    resetWeeklyVolume,
  }), [checkIns, painEntries, muscleGroups, streak, todayCheckIn, latestReadiness, recentPainAverage, isLoading, addCheckIn, addPainEntry, logSets, resetWeeklyVolume]);
});
