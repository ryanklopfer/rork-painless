import {
  CardioBaseline,
  ResistanceBaseline,
  WeekPlan,
  WeeklyTarget,
  ActivityLog,
  ProgressionPhase,
} from '@/types';

const MIN_FREQUENCY = 3;
const MAX_FREQUENCY = 7;

function isDeloadWeek(weekNumber: number): boolean {
  return weekNumber % 5 === 0;
}

function computeFrequencySchedule(totalWeeks: number): number[] {
  const schedule: number[] = [];
  const nonDeloadWeeks = Array.from({ length: totalWeeks }, (_, i) => i + 1).filter(w => !isDeloadWeek(w));
  const totalNonDeload = nonDeloadWeeks.length;

  const frequencyRange = MAX_FREQUENCY - MIN_FREQUENCY;
  const frequencyPhaseWeeks = Math.ceil(totalNonDeload * 0.5);
  let nonDeloadIdx = 0;

  for (let week = 1; week <= totalWeeks; week++) {
    if (isDeloadWeek(week)) {
      schedule.push(MIN_FREQUENCY);
      continue;
    }

    let freq: number;
    if (nonDeloadIdx < frequencyPhaseWeeks && frequencyPhaseWeeks > 0) {
      const progress = nonDeloadIdx / Math.max(frequencyPhaseWeeks - 1, 1);
      freq = Math.round(MIN_FREQUENCY + progress * frequencyRange);
    } else {
      freq = MAX_FREQUENCY;
    }
    freq = Math.max(MIN_FREQUENCY, Math.min(MAX_FREQUENCY, freq));
    schedule.push(freq);
    nonDeloadIdx++;
  }

  return schedule;
}

function getPhaseForWeek(
  weekNumber: number,
  totalWeeks: number,
  frequencySchedule: number[],
): ProgressionPhase {
  if (isDeloadWeek(weekNumber)) return 'frequency';

  const currentFreq = frequencySchedule[weekNumber - 1] ?? MIN_FREQUENCY;
  if (currentFreq < MAX_FREQUENCY) return 'frequency';

  const nonDeloadWeeks = Array.from({ length: totalWeeks }, (_, i) => i + 1).filter(w => !isDeloadWeek(w));
  const freqMaxIdx = nonDeloadWeeks.findIndex(w => (frequencySchedule[w - 1] ?? MIN_FREQUENCY) >= MAX_FREQUENCY);
  const currentNonDeloadIdx = nonDeloadWeeks.indexOf(weekNumber);

  if (freqMaxIdx < 0) return 'frequency';

  const postFreqWeeks = nonDeloadWeeks.length - freqMaxIdx;
  const volumePhaseLength = Math.ceil(postFreqWeeks * 0.5);

  if (currentNonDeloadIdx < freqMaxIdx + volumePhaseLength) return 'volume';
  return 'intensity';
}

export function generateWeekPlans(
  totalWeeks: number,
  cardio: CardioBaseline[],
  resistance: ResistanceBaseline[]
): WeekPlan[] {
  const frequencySchedule = computeFrequencySchedule(totalWeeks);
  const plans: WeekPlan[] = [];

  let prevCardioDurations = cardio.map(c => c.durationMinutes);
  let prevResistanceSets = resistance.map(r => r.sets);
  let prevResistanceReps = resistance.map(r => r.reps);
  let prevResistanceWeight = resistance.map(r => r.weight);

  const volumeRate = 0.08;
  const intensityRate = 0.06;

  for (let week = 1; week <= totalWeeks; week++) {
    const deload = isDeloadWeek(week);
    const daysPerWeek = frequencySchedule[week - 1] ?? MIN_FREQUENCY;
    const phase = getPhaseForWeek(week, totalWeeks, frequencySchedule);
    const targets: WeeklyTarget[] = [];

    cardio.forEach((c, i) => {
      let duration: number;
      if (week === 1) {
        duration = c.durationMinutes;
      } else if (deload) {
        duration = Math.round(prevCardioDurations[i] * 0.5);
      } else if (phase === 'volume') {
        duration = Math.round(prevCardioDurations[i] * (1 + volumeRate));
      } else if (phase === 'intensity') {
        duration = Math.round(prevCardioDurations[i] * (1 + intensityRate));
      } else {
        duration = prevCardioDurations[i];
      }

      targets.push({
        activityId: c.activityId,
        activityName: c.activityName,
        category: 'cardio',
        targetDuration: duration,
        isDeload: deload,
      });

      if (!deload) {
        prevCardioDurations[i] = duration;
      }
    });

    resistance.forEach((r, i) => {
      let sets: number;
      let reps: number;
      let weight: number;

      if (week === 1) {
        sets = r.sets;
        reps = r.reps;
        weight = r.weight;
      } else if (deload) {
        sets = Math.max(1, Math.round(prevResistanceSets[i] * 0.5));
        reps = prevResistanceReps[i];
        weight = Math.round(prevResistanceWeight[i] * 0.7);
      } else if (phase === 'frequency') {
        sets = prevResistanceSets[i];
        reps = prevResistanceReps[i];
        weight = prevResistanceWeight[i];
      } else if (phase === 'volume') {
        sets = prevResistanceSets[i];
        reps = prevResistanceReps[i];
        if (week % 2 === 0) {
          sets = Math.min(sets + 1, r.sets + 6);
        }
        if (week % 3 === 0) {
          reps = Math.min(reps + 1, r.reps + 8);
        }
        weight = prevResistanceWeight[i];
      } else {
        sets = prevResistanceSets[i];
        reps = prevResistanceReps[i];
        weight = Math.round(prevResistanceWeight[i] * (1 + intensityRate));
      }

      const category = r.activityId.includes('squat') || r.activityId.includes('deadlift') ||
        r.activityId.includes('leg') || r.activityId.includes('lunge') ||
        r.activityId.includes('calf') || r.activityId.includes('hip')
        ? 'resistance-lower' as const : 'resistance-upper' as const;

      targets.push({
        activityId: r.activityId,
        activityName: r.activityName,
        category,
        targetSets: sets,
        targetReps: reps,
        targetWeight: weight,
        isDeload: deload,
      });

      if (!deload) {
        prevResistanceSets[i] = sets;
        prevResistanceReps[i] = reps;
        prevResistanceWeight[i] = weight;
      }
    });

    plans.push({ weekNumber: week, isDeload: deload, daysPerWeek, phase, targets });
  }

  return plans;
}

export function adjustWeekTargets(
  currentPlan: WeekPlan,
  previousWeekLogs: ActivityLog[],
  previousPainAvg: number | null,
): { plan: WeekPlan; frequencyHeld: boolean } {
  let frequencyHeld = false;

  if (previousWeekLogs.length === 0 && previousPainAvg === null) {
    return { plan: currentPlan, frequencyHeld: false };
  }

  const avgRpe = previousWeekLogs.length > 0
    ? previousWeekLogs.reduce((sum, l) => sum + l.rpe, 0) / previousWeekLogs.length
    : 5;
  const avgSoreness = previousWeekLogs.length > 0
    ? previousWeekLogs.reduce((sum, l) => sum + l.soreness, 0) / previousWeekLogs.length
    : 3;

  const painTooHigh = (previousPainAvg !== null && previousPainAvg > 6) || avgSoreness > 6 || avgRpe > 8;

  let daysPerWeek = currentPlan.daysPerWeek;
  if (painTooHigh && daysPerWeek > MIN_FREQUENCY) {
    daysPerWeek = Math.max(MIN_FREQUENCY, daysPerWeek - 1);
    frequencyHeld = true;
    console.log('[ProgramGenerator] Pain-gated: holding frequency at', daysPerWeek);
  }

  let modifier = 0;
  if (avgRpe <= 5 && avgSoreness <= 3) {
    modifier = 0.10;
  } else if (avgRpe <= 7 && avgSoreness <= 5) {
    modifier = 0;
  } else if (avgRpe <= 8 && avgSoreness <= 7) {
    modifier = -0.10;
  } else {
    modifier = -0.20;
  }

  const adjustedTargets = modifier === 0 ? currentPlan.targets : currentPlan.targets.map(target => {
    if (target.isDeload) return target;

    if (target.category === 'cardio' && target.targetDuration) {
      return {
        ...target,
        targetDuration: Math.max(5, Math.round(target.targetDuration * (1 + modifier))),
      };
    }

    if (target.targetSets && target.targetWeight) {
      return {
        ...target,
        targetSets: Math.max(1, Math.round(target.targetSets * (1 + modifier * 0.5))),
        targetWeight: Math.max(0, Math.round(target.targetWeight * (1 + modifier))),
      };
    }

    return target;
  });

  return {
    plan: { ...currentPlan, daysPerWeek, targets: adjustedTargets },
    frequencyHeld,
  };
}
