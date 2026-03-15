import { useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';

export interface UserProfile {
  name: string;
  age: string;
  goalDescription: string;
  injuryHistory: string;
  trainingExperience: 'beginner' | 'intermediate' | 'advanced' | '';
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  hasCompletedOnboarding: boolean;
}

const DEFAULT_PROFILE: UserProfile = {
  name: '',
  age: '',
  goalDescription: '',
  injuryHistory: '',
  trainingExperience: '',
  notificationsEnabled: true,
  darkModeEnabled: false,
  hasCompletedOnboarding: false,
};

const STORAGE_KEY = 'rehabflow_profile';

export const [ProfileProvider, useProfile] = createContextHook(() => {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) as UserProfile : DEFAULT_PROFILE;
    },
  });

  useEffect(() => {
    if (profileQuery.data) {
      setProfile(profileQuery.data);
    }
  }, [profileQuery.data]);

  const syncProfile = useMutation({
    mutationFn: async (data: UserProfile) => {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    },
  });

  const updateProfile = useCallback((updates: Partial<UserProfile>) => {
    const updated = { ...profile, ...updates };
    setProfile(updated);
    syncProfile.mutate(updated);
  }, [profile, syncProfile]);

  const resetProfile = useCallback(() => {
    setProfile(DEFAULT_PROFILE);
    syncProfile.mutate(DEFAULT_PROFILE);
  }, [syncProfile]);

  const clearAllData = useMutation({
    mutationFn: async () => {
      const keys = [
        STORAGE_KEY,
        'rehabflow_checkins',
        'rehabflow_pain_entries',
        'rehabflow_muscle_groups',
        'rehabflow_streak',
        'rehabflow_program',
      ];
      await AsyncStorage.multiRemove(keys);
      setProfile(DEFAULT_PROFILE);
    },
  });

  const completeOnboarding = useCallback(() => {
    const updated = { ...profile, hasCompletedOnboarding: true };
    setProfile(updated);
    syncProfile.mutate(updated);
  }, [profile, syncProfile]);

  return useMemo(() => ({
    profile,
    isLoading: profileQuery.isLoading,
    updateProfile,
    resetProfile,
    completeOnboarding,
    clearAllData: clearAllData.mutate,
    isClearingData: clearAllData.isPending,
  }), [profile, profileQuery.isLoading, updateProfile, resetProfile, completeOnboarding, clearAllData.mutate, clearAllData.isPending]);
});
