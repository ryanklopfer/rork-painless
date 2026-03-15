export interface CheckIn {
  id: string;
  date: string;
  painLevel: number;
  sleepQuality: number;
  stressLevel: number;
  energyLevel: number;
  readinessScore: number;
  notes: string;
}

export interface PainEntry {
  id: string;
  date: string;
  region: string;
  intensity: number;
  type: PainType;
  notes: string;
}

export type PainType = 'sharp' | 'dull' | 'aching' | 'burning' | 'stiffness' | 'throbbing';

export interface BodyRegion {
  id: string;
  label: string;
  icon: string;
}

export interface MuscleGroupVolume {
  id: string;
  name: string;
  currentSets: number;
  mev: number;
  mav: number;
  mrv: number;
  weeklyLog: SetLog[];
}

export interface SetLog {
  id: string;
  date: string;
  exercise: string;
  sets: number;
  reps: number;
  weight: number;
}

export interface LearnCard {
  id: string;
  category: LearnCategory;
  title: string;
  summary: string;
  content: string;
  icon: string;
}

export type LearnCategory = 'pain-science' | 'volume-landmarks' | 'recovery' | 'graded-exposure';

export interface ReadinessRecommendation {
  level: 'progress' | 'maintain' | 'deload' | 'rest';
  title: string;
  description: string;
  color: string;
}

export type ActivityCategory = 'cardio' | 'resistance-upper' | 'resistance-lower';

export interface ActivityPreset {
  id: string;
  name: string;
  category: ActivityCategory;
  icon: string;
  isCustom?: boolean;
}

export interface CardioBaseline {
  activityId: string;
  activityName: string;
  durationMinutes: number;
}

export interface ResistanceBaseline {
  activityId: string;
  activityName: string;
  sets: number;
  reps: number;
  weight: number;
}

export type ProgressionPhase = 'frequency' | 'volume' | 'intensity';

export interface WeeklyTarget {
  activityId: string;
  activityName: string;
  category: ActivityCategory;
  targetDuration?: number;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  isDeload: boolean;
}

export interface WeekPlan {
  weekNumber: number;
  isDeload: boolean;
  daysPerWeek: number;
  phase: ProgressionPhase;
  targets: WeeklyTarget[];
}

export interface ActivityLog {
  id: string;
  date: string;
  weekNumber: number;
  dayNumber: number;
  activityId: string;
  activityName: string;
  category: ActivityCategory;
  actualDuration?: number;
  actualSets?: number;
  actualReps?: number;
  actualWeight?: number;
  rpe: number;
  soreness: number;
  symptomNotes: string;
}

export interface Program {
  id: string;
  createdAt: string;
  totalWeeks: number;
  currentWeek: number;
  startDate: string;
  cardioActivities: CardioBaseline[];
  resistanceActivities: ResistanceBaseline[];
  weekPlans: WeekPlan[];
  logs: ActivityLog[];
  isActive: boolean;
}
