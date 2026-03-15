import { ActivityPreset } from '@/types';

export const cardioPresets: ActivityPreset[] = [
  { id: 'walking', name: 'Walking', category: 'cardio', icon: 'Footprints' },
  { id: 'running', name: 'Running', category: 'cardio', icon: 'Zap' },
  { id: 'hiking', name: 'Hiking', category: 'cardio', icon: 'Mountain' },
  { id: 'cycling', name: 'Cycling', category: 'cardio', icon: 'Bike' },
  { id: 'swimming', name: 'Swimming', category: 'cardio', icon: 'Waves' },
  { id: 'elliptical', name: 'Elliptical', category: 'cardio', icon: 'IterationCw' },
  { id: 'rowing', name: 'Rowing', category: 'cardio', icon: 'Ship' },
];

export const resistanceUpperPresets: ActivityPreset[] = [
  { id: 'bench-press', name: 'Bench Press', category: 'resistance-upper', icon: 'Dumbbell' },
  { id: 'overhead-press', name: 'Overhead Press', category: 'resistance-upper', icon: 'ArrowUp' },
  { id: 'bent-over-row', name: 'Bent Over Row', category: 'resistance-upper', icon: 'ArrowDownUp' },
  { id: 'lat-pulldown', name: 'Lat Pulldown', category: 'resistance-upper', icon: 'ArrowDown' },
  { id: 'bicep-curl', name: 'Bicep Curl', category: 'resistance-upper', icon: 'Dumbbell' },
  { id: 'tricep-extension', name: 'Tricep Extension', category: 'resistance-upper', icon: 'Dumbbell' },
  { id: 'push-ups', name: 'Push-Ups', category: 'resistance-upper', icon: 'ArrowUpFromLine' },
  { id: 'face-pulls', name: 'Face Pulls', category: 'resistance-upper', icon: 'Crosshair' },
];

export const resistanceLowerPresets: ActivityPreset[] = [
  { id: 'squat', name: 'Squat', category: 'resistance-lower', icon: 'ArrowDownUp' },
  { id: 'deadlift', name: 'Deadlift', category: 'resistance-lower', icon: 'ArrowUp' },
  { id: 'leg-press', name: 'Leg Press', category: 'resistance-lower', icon: 'ArrowUpFromLine' },
  { id: 'lunges', name: 'Lunges', category: 'resistance-lower', icon: 'Footprints' },
  { id: 'leg-curl', name: 'Leg Curl', category: 'resistance-lower', icon: 'IterationCw' },
  { id: 'leg-extension', name: 'Leg Extension', category: 'resistance-lower', icon: 'ArrowUp' },
  { id: 'calf-raises', name: 'Calf Raises', category: 'resistance-lower', icon: 'ArrowUp' },
  { id: 'hip-thrust', name: 'Hip Thrust', category: 'resistance-lower', icon: 'ArrowUpFromLine' },
];

export const allResistancePresets: ActivityPreset[] = [
  ...resistanceUpperPresets,
  ...resistanceLowerPresets,
];
