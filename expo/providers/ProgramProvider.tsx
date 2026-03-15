import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import {
  Program,
  CardioBaseline,
  ResistanceBaseline,
  ActivityLog,
  WeekPlan,
} from '@/types';
import { generateWeekPlans, adjustWeekTargets } from '@/utils/programGenerator';
import { useRehab } from '@/providers/RehabProvider';

const STORAGE_KEY = 'rehabflow_program';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

export const [ProgramProvider, useProgram] = createContextHook(() => {
  const [program, setProgram] = useState<Program | null>(null);
  const { recentPainAverage } = useRehab();

  const programQuery = useQuery({
    queryKey: ['program'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) as Program : null;
    },
  });

  useEffect(() => {
    if (programQuery.data !== undefined) {
      setProgram(programQuery.data);
    }
  }, [programQuery.data]);

  const syncProgram = useMutation({
    mutationFn: async (data: Program | null) => {
      if (data) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
      }
      return data;
    },
  });

  const createProgram = useCallback((
    totalWeeks: number,
    cardio: CardioBaseline[],
    resistance: ResistanceBaseline[]
  ) => {
    const weekPlans = generateWeekPlans(totalWeeks, cardio, resistance);
    const newProgram: Program = {
      id: generateId(),
      createdAt: new Date().toISOString(),
      totalWeeks,
      currentWeek: 1,
      startDate: new Date().toISOString(),
      cardioActivities: cardio,
      resistanceActivities: resistance,
      weekPlans,
      logs: [],
      isActive: true,
    };
    console.log('[ProgramProvider] Creating program:', newProgram.id, 'weeks:', totalWeeks);
    console.log('[ProgramProvider] Week 1 days:', weekPlans[0]?.daysPerWeek, 'phase:', weekPlans[0]?.phase);
    setProgram(newProgram);
    syncProgram.mutate(newProgram);
    return newProgram;
  }, [syncProgram]);

  const logActivity = useCallback((log: Omit<ActivityLog, 'id' | 'date'>) => {
    if (!program) return;
    const newLog: ActivityLog = {
      id: generateId(),
      date: new Date().toISOString(),
      ...log,
    };
    console.log('[ProgramProvider] Logging activity:', newLog.activityName, 'week:', newLog.weekNumber, 'day:', newLog.dayNumber, 'RPE:', newLog.rpe);
    const updated = { ...program, logs: [...program.logs, newLog] };
    setProgram(updated);
    syncProgram.mutate(updated);
  }, [program, syncProgram]);

  const advanceWeek = useCallback(() => {
    if (!program) return;
    const nextWeek = program.currentWeek + 1;
    if (nextWeek > program.totalWeeks) {
      console.log('[ProgramProvider] Program complete!');
      return;
    }

    const previousWeekLogs = program.logs.filter(l => l.weekNumber === program.currentWeek);
    const currentPlan = program.weekPlans.find(w => w.weekNumber === nextWeek);

    if (currentPlan) {
      const { plan: adjustedPlan, frequencyHeld } = adjustWeekTargets(
        currentPlan,
        previousWeekLogs,
        recentPainAverage,
      );
      const updatedPlans = program.weekPlans.map(w =>
        w.weekNumber === nextWeek ? adjustedPlan : w
      );
      const updated = { ...program, currentWeek: nextWeek, weekPlans: updatedPlans };
      console.log('[ProgramProvider] Advancing to week', nextWeek,
        'days:', adjustedPlan.daysPerWeek,
        'phase:', adjustedPlan.phase,
        frequencyHeld ? '(frequency held due to pain)' : ''
      );
      setProgram(updated);
      syncProgram.mutate(updated);
    } else {
      const updated = { ...program, currentWeek: nextWeek };
      console.log('[ProgramProvider] Advancing to week', nextWeek);
      setProgram(updated);
      syncProgram.mutate(updated);
    }
  }, [program, syncProgram, recentPainAverage]);

  const resetProgram = useCallback(() => {
    console.log('[ProgramProvider] Resetting program');
    setProgram(null);
    syncProgram.mutate(null);
  }, [syncProgram]);

  const currentWeekPlan = useMemo((): WeekPlan | null => {
    if (!program) return null;
    return program.weekPlans.find(w => w.weekNumber === program.currentWeek) ?? null;
  }, [program]);

  const currentWeekLogs = useMemo((): ActivityLog[] => {
    if (!program) return [];
    return program.logs.filter(l => l.weekNumber === program.currentWeek);
  }, [program]);

  const programProgress = useMemo(() => {
    if (!program) return 0;
    return Math.round((program.currentWeek / program.totalWeeks) * 100);
  }, [program]);

  const getWeekLogs = useCallback((weekNumber: number): ActivityLog[] => {
    if (!program) return [];
    return program.logs.filter(l => l.weekNumber === weekNumber);
  }, [program]);

  const isLoading = programQuery.isLoading;

  return useMemo(() => ({
    program,
    currentWeekPlan,
    currentWeekLogs,
    programProgress,
    isLoading,
    createProgram,
    logActivity,
    advanceWeek,
    resetProgram,
    getWeekLogs,
  }), [program, currentWeekPlan, currentWeekLogs, programProgress, isLoading, createProgram, logActivity, advanceWeek, resetProgram, getWeekLogs]);
});
