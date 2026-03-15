import React, { useRef, useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ChevronRight,
  ChevronDown,
  Dumbbell,
  Check,
  Lock,
  Pause,
  Activity,
  TrendingUp,
  Calendar,
  Sparkles,
  RotateCcw,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useProgram } from '@/providers/ProgramProvider';
import { WeeklyTarget, WeekPlan, ActivityLog } from '@/types';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface WorkoutDay {
  dayNumber: number;
  targets: WeeklyTarget[];
  allLogged: boolean;
  someLogged: boolean;
}

function getPhaseLabel(phase: string): string {
  switch (phase) {
    case 'frequency': return 'Building Frequency';
    case 'volume': return 'Growing Volume';
    case 'intensity': return 'Increasing Intensity';
    default: return '';
  }
}

function getPhaseColor(phase: string): string {
  switch (phase) {
    case 'frequency': return Colors.primary;
    case 'volume': return Colors.teal;
    case 'intensity': return Colors.amber;
    default: return Colors.textSecondary;
  }
}

function getWeekDays(
  weekPlan: WeekPlan,
  weekLogs: ActivityLog[],
): WorkoutDay[] {
  const days: WorkoutDay[] = [];
  for (let d = 1; d <= weekPlan.daysPerWeek; d++) {
    const dayLogs = weekLogs.filter(l => l.dayNumber === d);
    const loggedIds = new Set(dayLogs.map(l => l.activityId));
    const allDone = weekPlan.targets.every(t => loggedIds.has(t.activityId));
    const someDone = dayLogs.length > 0;
    days.push({
      dayNumber: d,
      targets: weekPlan.targets,
      allLogged: allDone,
      someLogged: someDone,
    });
  }
  return days;
}

type WeekStatus = 'completed' | 'current' | 'upcoming';

function getWeekStatus(weekNumber: number, currentWeek: number): WeekStatus {
  if (weekNumber < currentWeek) return 'completed';
  if (weekNumber === currentWeek) return 'current';
  return 'upcoming';
}

function DayButton({
  day,
  onPress,
  disabled,
}: {
  day: WorkoutDay;
  onPress: () => void;
  disabled?: boolean;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (disabled) return;
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  }, [scaleAnim, disabled]);

  const handlePressOut = useCallback(() => {
    if (disabled) return;
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scaleAnim, disabled]);

  const exerciseCount = day.targets.length;

  return (
    <TouchableOpacity
      activeOpacity={disabled ? 1 : 0.8}
      onPress={() => {
        if (disabled) return;
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[
        styles.dayButton,
        day.allLogged && styles.dayButtonLogged,
        disabled && styles.dayButtonDisabled,
        { transform: [{ scale: scaleAnim }] },
      ]}>
        <View style={styles.dayButtonLeft}>
          <View style={[
            styles.dayIcon,
            day.allLogged
              ? { backgroundColor: Colors.teal + '15' }
              : disabled
                ? { backgroundColor: Colors.surfaceSecondary }
                : { backgroundColor: Colors.primary + '12' },
          ]}>
            {day.allLogged
              ? <Check size={18} color={Colors.teal} />
              : disabled
                ? <Lock size={16} color={Colors.textTertiary} />
                : <Dumbbell size={18} color={Colors.primary} />
            }
          </View>
          <View style={styles.dayButtonTextWrap}>
            <Text style={[
              styles.dayButtonTitle,
              day.allLogged && styles.dayButtonTitleLogged,
              disabled && styles.dayButtonTitleDisabled,
            ]}>
              Day {day.dayNumber}
            </Text>
            <Text style={[styles.dayButtonSub, disabled && styles.dayButtonSubDisabled]}>
              {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
              {day.someLogged && !day.allLogged ? ' · In progress' : ''}
              {day.allLogged ? ' · Complete' : ''}
            </Text>
          </View>
        </View>
        <ChevronRight size={16} color={day.allLogged ? Colors.teal : disabled ? Colors.textTertiary : Colors.textSecondary} />
      </Animated.View>
    </TouchableOpacity>
  );
}

function WeekCard({
  weekPlan,
  currentWeek,
  weekLogs,
  isExpanded,
  onToggle,
  onOpenDay,
}: {
  weekPlan: WeekPlan;
  currentWeek: number;
  weekLogs: ActivityLog[];
  isExpanded: boolean;
  onToggle: () => void;
  onOpenDay: (weekNumber: number, dayNumber: number) => void;
}) {
  const weekDays = useMemo(() => getWeekDays(weekPlan, weekLogs), [weekPlan, weekLogs]);
  const status = getWeekStatus(weekPlan.weekNumber, currentWeek);
  const completedDays = weekDays.filter(d => d.allLogged).length;
  const totalDays = weekPlan.daysPerWeek;
  const isCurrent = status === 'current';
  const isPast = status === 'completed';
  const isFuture = status === 'upcoming';
  const phaseColor = getPhaseColor(weekPlan.phase);

  const rotateAnim = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;

  const handleToggle = useCallback(() => {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(rotateAnim, {
      toValue: isExpanded ? 0 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
    if (Platform.OS !== 'web') {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    onToggle();
  }, [isExpanded, onToggle, rotateAnim]);

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={[
      styles.weekCard,
      isCurrent && styles.weekCardCurrent,
      isPast && completedDays === totalDays && styles.weekCardComplete,
    ]}>
      <TouchableOpacity
        style={styles.weekCardHeader}
        activeOpacity={0.7}
        onPress={handleToggle}
      >
        <View style={styles.weekCardHeaderLeft}>
          <View style={[
            styles.weekBadge,
            isCurrent && { backgroundColor: Colors.primary },
            isPast && completedDays === totalDays && { backgroundColor: Colors.teal },
            isPast && completedDays < totalDays && { backgroundColor: Colors.amber },
            isFuture && { backgroundColor: Colors.surfaceSecondary },
          ]}>
            {isPast && completedDays === totalDays ? (
              <Check size={14} color={Colors.textInverse} />
            ) : (
              <Text style={[
                styles.weekBadgeText,
                (isCurrent || (isPast && completedDays < totalDays)) && { color: Colors.textInverse },
                isFuture && { color: Colors.textTertiary },
              ]}>
                {weekPlan.weekNumber}
              </Text>
            )}
          </View>
          <View style={styles.weekCardTitleWrap}>
            <View style={styles.weekCardTitleRow}>
              <Text style={[
                styles.weekCardTitle,
                isFuture && styles.weekCardTitleFuture,
              ]}>
                Week {weekPlan.weekNumber}
              </Text>
              {weekPlan.isDeload && (
                <View style={styles.deloadChip}>
                  <Pause size={10} color={Colors.amber} />
                  <Text style={styles.deloadChipText}>Deload</Text>
                </View>
              )}
              {isCurrent && (
                <View style={styles.currentChip}>
                  <Text style={styles.currentChipText}>Current</Text>
                </View>
              )}
            </View>
            <View style={styles.weekCardMeta}>
              <View style={[styles.phaseIndicator, { backgroundColor: phaseColor + '20' }]}>
                <View style={[styles.phaseIndicatorDot, { backgroundColor: phaseColor }]} />
                <Text style={[styles.phaseIndicatorText, { color: phaseColor }]}>
                  {getPhaseLabel(weekPlan.phase)}
                </Text>
              </View>
              <Text style={styles.weekCardDays}>
                {totalDays} day{totalDays !== 1 ? 's' : ''}
              </Text>
              {(isCurrent || isPast) && (
                <Text style={styles.weekCardProgress}>
                  {completedDays}/{totalDays} done
                </Text>
              )}
            </View>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <ChevronDown size={20} color={isFuture ? Colors.textTertiary : Colors.textSecondary} />
        </Animated.View>
      </TouchableOpacity>

      {isCurrent && !isExpanded && (
        <View style={styles.weekCardQuickProgress}>
          <View style={styles.quickProgressBarBg}>
            <View style={[
              styles.quickProgressBarFill,
              { width: `${totalDays > 0 ? (completedDays / totalDays) * 100 : 0}%` },
            ]} />
          </View>
        </View>
      )}

      {isExpanded && (
        <View style={styles.weekCardBody}>
          {weekPlan.targets.length > 0 && (
            <View style={styles.weekTargetsSummary}>
              {weekPlan.targets.map(t => (
                <View key={t.activityId} style={styles.targetChip}>
                  <Text style={styles.targetChipText} numberOfLines={1}>
                    {t.activityName}
                    {t.category === 'cardio'
                      ? ` · ${t.targetDuration}min`
                      : ` · ${t.targetSets}×${t.targetReps} @ ${t.targetWeight}lbs`
                    }
                  </Text>
                </View>
              ))}
            </View>
          )}
          {weekDays.map(day => (
            <DayButton
              key={day.dayNumber}
              day={day}
              disabled={isFuture}
              onPress={() => onOpenDay(weekPlan.weekNumber, day.dayNumber)}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export default function LoadScreen() {
  const insets = useSafeAreaInsets();
  const { program, programProgress, advanceWeek, resetProgram, getWeekLogs, currentWeekPlan, currentWeekLogs } = useProgram();

  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  const hasActiveProgram = program && program.isActive;

  const initialExpandedSet = useMemo(() => {
    if (program) return new Set([program.currentWeek]);
    return new Set<number>();
  }, [program]);

  const effectiveExpanded = useMemo(() => {
    if (expandedWeeks.size === 0 && program) {
      return initialExpandedSet;
    }
    return expandedWeeks;
  }, [expandedWeeks, initialExpandedSet, program]);

  const toggleWeek = useCallback((weekNumber: number) => {
    setExpandedWeeks(prev => {
      const base = prev.size === 0 && program ? new Set(initialExpandedSet) : new Set(prev);
      if (base.has(weekNumber)) {
        base.delete(weekNumber);
      } else {
        base.add(weekNumber);
      }
      return base;
    });
  }, [program, initialExpandedSet]);

  const allTargetsLogged = useMemo(() => {
    if (!currentWeekPlan || !program) return false;
    const daysPerWeek = currentWeekPlan.daysPerWeek;
    for (let d = 1; d <= daysPerWeek; d++) {
      const dayLogs = currentWeekLogs.filter(l => l.dayNumber === d);
      if (dayLogs.length < currentWeekPlan.targets.length) return false;
    }
    return true;
  }, [currentWeekPlan, currentWeekLogs, program]);

  const handleOpenDay = useCallback((weekNumber: number, dayNumber: number) => {
    if (!program) return;
    router.push({ pathname: '/log-activity', params: { weekNumber: String(weekNumber), dayNumber: String(dayNumber) } });
  }, [program]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Activity Manager</Text>
          {hasActiveProgram && (
            <Text style={styles.subtitle}>
              {program.totalWeeks}-week rehab protocol
            </Text>
          )}
        </View>

        {hasActiveProgram && (
          <>
            <View style={styles.programSummary}>
              <View style={styles.programSummaryRow}>
                <View style={styles.summaryStatItem}>
                  <Calendar size={14} color={Colors.primary} />
                  <Text style={styles.summaryStatValue}>Week {program.currentWeek}</Text>
                  <Text style={styles.summaryStatLabel}>Current</Text>
                </View>
                <View style={styles.summaryStatDivider} />
                <View style={styles.summaryStatItem}>
                  <Dumbbell size={14} color={Colors.teal} />
                  <Text style={styles.summaryStatValue}>{currentWeekPlan?.daysPerWeek ?? '—'}</Text>
                  <Text style={styles.summaryStatLabel}>Days/Wk</Text>
                </View>
                <View style={styles.summaryStatDivider} />
                <View style={styles.summaryStatItem}>
                  <Activity size={14} color={getPhaseColor(currentWeekPlan?.phase ?? 'frequency')} />
                  <Text style={styles.summaryStatValue}>
                    {currentWeekPlan ? getPhaseLabel(currentWeekPlan.phase).split(' ')[0] : '—'}
                  </Text>
                  <Text style={styles.summaryStatLabel}>Phase</Text>
                </View>
              </View>
              <View style={styles.progressRow}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${programProgress}%` }]} />
                </View>
                <Text style={styles.progressPercent}>{programProgress}%</Text>
              </View>
              {allTargetsLogged && program.currentWeek < program.totalWeeks && (
                <TouchableOpacity
                  style={styles.advanceButton}
                  onPress={() => {
                    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    advanceWeek();
                    setExpandedWeeks(new Set());
                  }}
                  activeOpacity={0.8}
                >
                  <TrendingUp size={14} color={Colors.textInverse} />
                  <Text style={styles.advanceButtonText}>Advance to Next Week</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.sectionLabel}>All Weeks</Text>

            {program.weekPlans.map(weekPlan => (
              <WeekCard
                key={weekPlan.weekNumber}
                weekPlan={weekPlan}
                currentWeek={program.currentWeek}
                weekLogs={getWeekLogs(weekPlan.weekNumber)}
                isExpanded={effectiveExpanded.has(weekPlan.weekNumber)}
                onToggle={() => toggleWeek(weekPlan.weekNumber)}
                onOpenDay={handleOpenDay}
              />
            ))}

            <TouchableOpacity
              style={styles.resetProgramButton}
              onPress={resetProgram}
              activeOpacity={0.7}
            >
              <RotateCcw size={13} color={Colors.coral} />
              <Text style={styles.resetProgramText}>Reset Program</Text>
            </TouchableOpacity>
          </>
        )}

        {!hasActiveProgram && (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconWrap}>
              <Sparkles size={36} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Active Program</Text>
            <Text style={styles.emptyDescription}>
              Create a rehab program from the home screen to see your weekly breakdown here.
            </Text>
            <TouchableOpacity
              style={styles.createButton}
              onPress={() => router.push('/onboarding')}
              activeOpacity={0.8}
            >
              <Text style={styles.createButtonText}>Build a Program</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '400' as const,
  },
  programSummary: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  programSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  summaryStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  summaryStatValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  summaryStatLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  summaryStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderLight,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressPercent: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
    minWidth: 36,
    textAlign: 'right' as const,
  },
  advanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.teal,
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  advanceButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  weekCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    marginBottom: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  weekCardCurrent: {
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
  },
  weekCardComplete: {
    borderWidth: 1,
    borderColor: Colors.teal + '20',
  },
  weekCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  weekCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weekBadge: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekBadgeText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  weekCardTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  weekCardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekCardTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  weekCardTitleFuture: {
    color: Colors.textTertiary,
  },
  deloadChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.amber + '15',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  deloadChipText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.amber,
  },
  currentChip: {
    backgroundColor: Colors.primary + '15',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  currentChipText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  weekCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  phaseIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    gap: 4,
  },
  phaseIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  phaseIndicatorText: {
    fontSize: 10,
    fontWeight: '600' as const,
  },
  weekCardDays: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  weekCardProgress: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  weekCardQuickProgress: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  quickProgressBarBg: {
    height: 3,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 2,
    overflow: 'hidden',
  },
  quickProgressBarFill: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  weekCardBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  weekTargetsSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  targetChip: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  targetChipText: {
    fontSize: 11,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  dayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 6,
  },
  dayButtonLogged: {
    backgroundColor: Colors.teal + '08',
    borderWidth: 1,
    borderColor: Colors.teal + '20',
  },
  dayButtonDisabled: {
    opacity: 0.55,
  },
  dayButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayButtonTextWrap: {
    flex: 1,
    marginLeft: 10,
  },
  dayButtonTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dayButtonTitleLogged: {
    color: Colors.teal,
  },
  dayButtonTitleDisabled: {
    color: Colors.textTertiary,
  },
  dayButtonSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  dayButtonSubDisabled: {
    color: Colors.textTertiary,
  },
  resetProgramButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 4,
    marginBottom: 16,
  },
  resetProgramText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.coral,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
