import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  X,
  Check,
  Timer,
  Dumbbell,
  Gauge,
  ThermometerSun,
  ChevronDown,
  ChevronUp,
  Save,
  Clock,
  Weight,
  Repeat,
  Layers,
  MessageSquare,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useProgram } from '@/providers/ProgramProvider';
import { ActivityCategory, ActivityLog } from '@/types';

const RPE_LABELS: Record<number, string> = {
  1: 'Very light',
  2: 'Light',
  3: 'Light-Moderate',
  4: 'Moderate',
  5: 'Moderate',
  6: 'Moderate-Hard',
  7: 'Hard',
  8: 'Very Hard',
  9: 'Near Max',
  10: 'Maximum',
};

const SORENESS_LABELS: Record<number, string> = {
  0: 'No soreness',
  1: 'Minimal',
  2: 'Mild',
  3: 'Noticeable',
  4: 'Moderate',
  5: 'Significant',
  6: 'Moderate-High',
  7: 'High',
  8: 'Very High',
  9: 'Severe',
  10: 'Extreme',
};

function getRpeColor(rpe: number): string {
  if (rpe <= 4) return Colors.teal;
  if (rpe <= 6) return Colors.green;
  if (rpe <= 8) return Colors.amber;
  return Colors.coral;
}

function getSorenessColor(soreness: number): string {
  if (soreness <= 2) return Colors.teal;
  if (soreness <= 4) return Colors.green;
  if (soreness <= 6) return Colors.amber;
  return Colors.coral;
}

interface ExerciseFormState {
  durationText: string;
  setsText: string;
  repsText: string;
  weightText: string;
  rpe: number;
  soreness: number;
  notes: string;
}

interface ExerciseEntry {
  activityId: string;
  activityName: string;
  category: ActivityCategory;
  targetDuration?: number;
  targetSets?: number;
  targetReps?: number;
  targetWeight?: number;
  form: ExerciseFormState;
  loggedData: ActivityLog | null;
}

function RpePicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.rpeSection}>
      <View style={styles.rpeSectionHeader}>
        <Gauge size={15} color={getRpeColor(value)} />
        <Text style={styles.rpeSectionLabel}>Intensity (RPE)</Text>
        <View style={[styles.rpeBadge, { backgroundColor: getRpeColor(value) + '18' }]}>
          <Text style={[styles.rpeBadgeText, { color: getRpeColor(value) }]}>{value} — {RPE_LABELS[value]}</Text>
        </View>
      </View>
      <View style={styles.rpeDotsRow}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map(val => (
          <TouchableOpacity
            key={val}
            style={[
              styles.rpeDot,
              { backgroundColor: val <= value ? getRpeColor(value) : Colors.surfaceSecondary },
            ]}
            onPress={() => {
              onChange(val);
              if (Platform.OS !== 'web') void Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.rpeDotText, val <= value && styles.rpeDotTextActive]}>{val}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function SorenessPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View style={styles.rpeSection}>
      <View style={styles.rpeSectionHeader}>
        <ThermometerSun size={15} color={getSorenessColor(value)} />
        <Text style={styles.rpeSectionLabel}>Soreness</Text>
        <View style={[styles.rpeBadge, { backgroundColor: getSorenessColor(value) + '18' }]}>
          <Text style={[styles.rpeBadgeText, { color: getSorenessColor(value) }]}>{value} — {SORENESS_LABELS[value]}</Text>
        </View>
      </View>
      <View style={styles.rpeDotsRow}>
        {Array.from({ length: 11 }, (_, i) => i).map(val => (
          <TouchableOpacity
            key={val}
            style={[
              styles.sorenDot,
              { backgroundColor: val <= value ? getSorenessColor(value) : Colors.surfaceSecondary },
            ]}
            onPress={() => {
              onChange(val);
              if (Platform.OS !== 'web') void Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.sorenDotText, val <= value && styles.rpeDotTextActive]}>{val}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function LoggedSummary({ log }: { log: ActivityLog }) {
  const isCardio = log.category === 'cardio';
  return (
    <View style={styles.loggedSummary}>
      <View style={styles.loggedBanner}>
        <Check size={14} color={Colors.teal} />
        <Text style={styles.loggedBannerText}>Logged</Text>
        <Text style={styles.loggedBannerTime}>
          {new Date(log.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
        </Text>
      </View>
      <View style={styles.loggedGrid}>
        {isCardio ? (
          <View style={styles.loggedGridItem}>
            <Clock size={13} color={Colors.primary} />
            <Text style={styles.loggedGridValue}>{log.actualDuration ?? 0} min</Text>
          </View>
        ) : (
          <>
            <View style={styles.loggedGridItem}>
              <Layers size={13} color={Colors.primary} />
              <Text style={styles.loggedGridValue}>{log.actualSets ?? 0} sets</Text>
            </View>
            <View style={styles.loggedGridItem}>
              <Repeat size={13} color={Colors.amber} />
              <Text style={styles.loggedGridValue}>{log.actualReps ?? 0} reps</Text>
            </View>
            <View style={styles.loggedGridItem}>
              <Weight size={13} color={Colors.coral} />
              <Text style={styles.loggedGridValue}>{log.actualWeight ?? 0} lbs</Text>
            </View>
          </>
        )}
        <View style={styles.loggedGridItem}>
          <Gauge size={13} color={getRpeColor(log.rpe)} />
          <Text style={styles.loggedGridValue}>RPE {log.rpe}</Text>
        </View>
        <View style={styles.loggedGridItem}>
          <ThermometerSun size={13} color={getSorenessColor(log.soreness)} />
          <Text style={styles.loggedGridValue}>Sore {log.soreness}</Text>
        </View>
      </View>
      {log.symptomNotes ? (
        <View style={styles.loggedNotesRow}>
          <MessageSquare size={12} color={Colors.textTertiary} />
          <Text style={styles.loggedNotesText} numberOfLines={2}>{log.symptomNotes}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ExerciseCard({
  entry,
  index,
  isExpanded,
  onToggle,
  onUpdateForm,
  onSave,
}: {
  entry: ExerciseEntry;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdateForm: (field: keyof ExerciseFormState, value: string | number) => void;
  onSave: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isCardio = entry.category === 'cardio';
  const isLogged = !!entry.loggedData;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.98, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 5, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={[
      styles.exerciseCard,
      isLogged && styles.exerciseCardLogged,
      { transform: [{ scale: scaleAnim }] },
    ]}>
      <TouchableOpacity
        style={styles.exerciseHeader}
        onPress={onToggle}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}
      >
        <View style={styles.exerciseNumberBadge}>
          <Text style={[styles.exerciseNumber, isLogged && { color: Colors.teal }]}>{index + 1}</Text>
        </View>
        <View style={[
          styles.exerciseIconWrap,
          { backgroundColor: (isLogged ? Colors.teal : isCardio ? Colors.primary : Colors.amber) + '12' },
        ]}>
          {isLogged
            ? <Check size={18} color={Colors.teal} />
            : isCardio
              ? <Timer size={18} color={Colors.primary} />
              : <Dumbbell size={18} color={Colors.amber} />
          }
        </View>
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, isLogged && { color: Colors.teal }]}>
            {entry.activityName}
          </Text>
          <Text style={styles.exerciseTarget}>
            {isCardio
              ? `Target: ${entry.targetDuration ?? 0} min`
              : `Target: ${entry.targetSets ?? 0} × ${entry.targetReps ?? 0} @ ${entry.targetWeight ?? 0} lbs`
            }
          </Text>
        </View>
        {isExpanded
          ? <ChevronUp size={18} color={Colors.textTertiary} />
          : <ChevronDown size={18} color={Colors.textTertiary} />
        }
      </TouchableOpacity>

      {isExpanded && isLogged && entry.loggedData && (
        <LoggedSummary log={entry.loggedData} />
      )}

      {isExpanded && !isLogged && (
        <View style={styles.exerciseBody}>
          {isCardio ? (
            <View style={styles.inputGroup}>
              <Text style={styles.inputGroupLabel}>Duration</Text>
              <View style={styles.inputWithUnit}>
                <TextInput
                  style={styles.fieldInput}
                  value={entry.form.durationText}
                  onChangeText={(v) => onUpdateForm('durationText', v)}
                  keyboardType="numeric"
                  selectTextOnFocus
                  testID={`duration-input-${index}`}
                />
                <Text style={styles.fieldUnit}>min</Text>
              </View>
            </View>
          ) : (
            <View style={styles.resistanceInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputGroupLabel}>Sets</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={entry.form.setsText}
                  onChangeText={(v) => onUpdateForm('setsText', v)}
                  keyboardType="numeric"
                  selectTextOnFocus
                  testID={`sets-input-${index}`}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputGroupLabel}>Reps</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={entry.form.repsText}
                  onChangeText={(v) => onUpdateForm('repsText', v)}
                  keyboardType="numeric"
                  selectTextOnFocus
                  testID={`reps-input-${index}`}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputGroupLabel}>Weight</Text>
                <View style={styles.inputWithUnit}>
                  <TextInput
                    style={styles.fieldInput}
                    value={entry.form.weightText}
                    onChangeText={(v) => onUpdateForm('weightText', v)}
                    keyboardType="numeric"
                    selectTextOnFocus
                    testID={`weight-input-${index}`}
                  />
                  <Text style={styles.fieldUnit}>lbs</Text>
                </View>
              </View>
            </View>
          )}

          <View style={styles.exerciseDivider} />

          <RpePicker
            value={entry.form.rpe}
            onChange={(v) => onUpdateForm('rpe', v)}
          />

          <SorenessPicker
            value={entry.form.soreness}
            onChange={(v) => onUpdateForm('soreness', v)}
          />

          <View style={styles.notesSection}>
            <Text style={styles.inputGroupLabel}>Notes (optional)</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="Pain, discomfort, or observations..."
              placeholderTextColor={Colors.textTertiary}
              value={entry.form.notes}
              onChangeText={(v) => onUpdateForm('notes', v)}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
              testID={`notes-input-${index}`}
            />
          </View>

          <TouchableOpacity
            style={styles.logExerciseButton}
            onPress={() => {
              if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSave();
            }}
            activeOpacity={0.8}
            testID={`log-exercise-btn-${index}`}
          >
            <Save size={16} color={Colors.textInverse} />
            <Text style={styles.logExerciseText}>Log {entry.activityName}</Text>
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}

export default function LogActivityScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    weekNumber: string;
    dayNumber: string;
  }>();
  const { logActivity, currentWeekPlan, currentWeekLogs } = useProgram();

  const weekNumber = parseInt(params.weekNumber ?? '1', 10);
  const dayNumber = parseInt(params.dayNumber ?? '1', 10);

  const targets = currentWeekPlan?.targets ?? [];

  const existingLogs = useMemo(() => {
    const map = new Map<string, ActivityLog>();
    currentWeekLogs
      .filter(l => l.dayNumber === dayNumber)
      .forEach(l => map.set(l.activityId, l));
    return map;
  }, [currentWeekLogs, dayNumber]);

  const [entries, setEntries] = useState<ExerciseEntry[]>(() =>
    targets.map(t => {
      const existing = existingLogs.get(t.activityId) ?? null;
      return {
        activityId: t.activityId,
        activityName: t.activityName,
        category: t.category,
        targetDuration: t.targetDuration,
        targetSets: t.targetSets,
        targetReps: t.targetReps,
        targetWeight: t.targetWeight,
        form: {
          durationText: String(existing?.actualDuration ?? t.targetDuration ?? 10),
          setsText: String(existing?.actualSets ?? t.targetSets ?? 3),
          repsText: String(existing?.actualReps ?? t.targetReps ?? 10),
          weightText: String(existing?.actualWeight ?? t.targetWeight ?? 0),
          rpe: existing?.rpe ?? 5,
          soreness: existing?.soreness ?? 2,
          notes: existing?.symptomNotes ?? '',
        },
        loggedData: existing,
      };
    })
  );

  const [expandedIdx, setExpandedIdx] = useState<number | null>(() => {
    const firstUnlogged = entries.findIndex(e => !e.loggedData);
    return firstUnlogged >= 0 ? firstUnlogged : null;
  });

  const updateForm = useCallback((idx: number, field: keyof ExerciseFormState, value: string | number) => {
    setEntries(prev => prev.map((e, i) => {
      if (i !== idx) return e;
      return { ...e, form: { ...e.form, [field]: value } };
    }));
  }, []);

  const handleSaveExercise = useCallback((idx: number) => {
    const entry = entries[idx];
    if (!entry || entry.loggedData) return;

    const isCardio = entry.category === 'cardio';
    const duration = parseInt(entry.form.durationText, 10) || 0;
    const sets = parseInt(entry.form.setsText, 10) || 0;
    const reps = parseInt(entry.form.repsText, 10) || 0;
    const weight = parseFloat(entry.form.weightText) || 0;

    console.log('[LogActivity] Saving exercise:', entry.activityName, 'RPE:', entry.form.rpe, 'Soreness:', entry.form.soreness);

    logActivity({
      weekNumber,
      dayNumber,
      activityId: entry.activityId,
      activityName: entry.activityName,
      category: entry.category,
      actualDuration: isCardio ? duration : undefined,
      actualSets: !isCardio ? sets : undefined,
      actualReps: !isCardio ? reps : undefined,
      actualWeight: !isCardio ? weight : undefined,
      rpe: entry.form.rpe,
      soreness: entry.form.soreness,
      symptomNotes: entry.form.notes,
    });

    const fakeLog: ActivityLog = {
      id: Date.now().toString(36),
      date: new Date().toISOString(),
      weekNumber,
      dayNumber,
      activityId: entry.activityId,
      activityName: entry.activityName,
      category: entry.category,
      actualDuration: isCardio ? duration : undefined,
      actualSets: !isCardio ? sets : undefined,
      actualReps: !isCardio ? reps : undefined,
      actualWeight: !isCardio ? weight : undefined,
      rpe: entry.form.rpe,
      soreness: entry.form.soreness,
      symptomNotes: entry.form.notes,
    };

    setEntries(prev => prev.map((e, i) => i === idx ? { ...e, loggedData: fakeLog } : e));

    const nextUnlogged = entries.findIndex((e, i) => i > idx && !e.loggedData);
    if (nextUnlogged >= 0) {
      setExpandedIdx(nextUnlogged);
    } else {
      setExpandedIdx(null);
    }
  }, [entries, weekNumber, dayNumber, logActivity]);

  const loggedCount = entries.filter(e => !!e.loggedData).length;
  const totalCount = entries.length;
  const allDone = loggedCount === totalCount && totalCount > 0;
  const progressPercent = totalCount > 0 ? (loggedCount / totalCount) * 100 : 0;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.closeButton}
          testID="close-btn"
        >
          <X size={20} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.topTitleWrap}>
          <Text style={styles.topTitle}>Week {weekNumber} · Day {dayNumber}</Text>
          <Text style={styles.topSubtitle}>
            {loggedCount}/{totalCount} logged
          </Text>
        </View>
        {allDone ? (
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.doneButton}
            activeOpacity={0.8}
            testID="done-btn"
          >
            <Check size={16} color={Colors.textInverse} />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 60 }} />
        )}
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {entries.map((entry, idx) => (
          <ExerciseCard
            key={entry.activityId}
            entry={entry}
            index={idx}
            isExpanded={expandedIdx === idx}
            onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            onUpdateForm={(field, value) => updateForm(idx, field, value)}
            onSave={() => handleSaveExercise(idx)}
          />
        ))}

        {allDone && (
          <View style={styles.completionCard}>
            <View style={styles.completionIconWrap}>
              <Check size={28} color={Colors.teal} />
            </View>
            <Text style={styles.completionTitle}>Workout Complete!</Text>
            <Text style={styles.completionSub}>
              All {totalCount} exercise{totalCount !== 1 ? 's' : ''} logged for Day {dayNumber}
            </Text>
            <TouchableOpacity
              style={styles.completionButton}
              onPress={() => router.back()}
              activeOpacity={0.8}
            >
              <Text style={styles.completionButtonText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: insets.bottom + 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitleWrap: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.text,
    textAlign: 'center' as const,
  },
  topSubtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.teal,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  doneButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: Colors.teal,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  exerciseCardLogged: {
    borderWidth: 1.5,
    borderColor: Colors.teal + '30',
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  exerciseNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseNumber: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: Colors.textSecondary,
  },
  exerciseIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  exerciseTarget: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  exerciseBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: 14,
  },
  resistanceInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    flex: 1,
  },
  inputGroupLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputWithUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fieldInput: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlign: 'center' as const,
    flex: 1,
    minWidth: 50,
  },
  fieldUnit: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  exerciseDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: 14,
  },
  rpeSection: {
    marginBottom: 14,
  },
  rpeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  rpeSectionLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  rpeBadge: {
    marginLeft: 'auto',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rpeBadgeText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  rpeDotsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 3,
  },
  rpeDot: {
    flex: 1,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 32,
  },
  rpeDotText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.textTertiary,
  },
  rpeDotTextActive: {
    color: Colors.textInverse,
  },
  sorenDot: {
    flex: 1,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 28,
  },
  sorenDotText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.textTertiary,
  },
  notesSection: {
    marginBottom: 14,
  },
  notesInput: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    minHeight: 52,
  },
  logExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.teal,
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
    shadowColor: Colors.teal,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  logExerciseText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  loggedSummary: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.teal + '15',
    paddingTop: 12,
  },
  loggedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  loggedBannerText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.teal,
  },
  loggedBannerTime: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginLeft: 'auto',
  },
  loggedGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  loggedGridItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  loggedGridValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  loggedNotesRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  loggedNotesText: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  completionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: Colors.teal + '20',
  },
  completionIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.teal + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  completionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.teal,
    marginBottom: 6,
  },
  completionSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 20,
  },
  completionButton: {
    backgroundColor: Colors.teal,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 12,
  },
  completionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
