import React, { useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  ClipboardCheck,
  Activity,
  Dumbbell,
  TrendingUp,
  ChevronRight,
  AlertTriangle,
  Sparkles,
  Check,
  Calendar,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRehab } from '@/providers/RehabProvider';
import { useProgram } from '@/providers/ProgramProvider';
import { useProfile } from '@/providers/ProfileProvider';
import { WeeklyTarget } from '@/types';

function ActionButton({
  icon,
  label,
  subtitle,
  color,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, [scaleAnim]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        if (Platform.OS !== 'web') {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.actionButton, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.actionIcon, { backgroundColor: color + '15' }]}>{icon}</View>
        <View style={styles.actionText}>
          <Text style={styles.actionLabel}>{label}</Text>
          <Text style={styles.actionSubtitle}>{subtitle}</Text>
        </View>
        <ChevronRight size={18} color={Colors.textTertiary} />
      </Animated.View>
    </TouchableOpacity>
  );
}

interface CurrentWeekDay {
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

function DayCard({
  weekNumber,
  day,
  onPress,
}: {
  weekNumber: number;
  day: CurrentWeekDay;
  onPress: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const exerciseCount = day.targets.length;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[
        styles.dayCard,
        day.allLogged && styles.dayCardLogged,
        { transform: [{ scale: scaleAnim }] },
      ]}>
        <View style={styles.dayCardLeft}>
          <View style={[
            styles.dayCardIcon,
            day.allLogged
              ? { backgroundColor: Colors.teal + '15' }
              : { backgroundColor: Colors.primary + '12' },
          ]}>
            {day.allLogged
              ? <Check size={18} color={Colors.teal} />
              : <Dumbbell size={18} color={Colors.primary} />
            }
          </View>
          <View style={styles.dayCardTextWrap}>
            <Text style={[
              styles.dayCardTitle,
              day.allLogged && { color: Colors.teal },
            ]}>
              Week {weekNumber} · Day {day.dayNumber}
            </Text>
            <Text style={styles.dayCardSub}>
              {exerciseCount} exercise{exerciseCount !== 1 ? 's' : ''}
              {day.someLogged && !day.allLogged ? ' · In progress' : ''}
              {day.allLogged ? ' · Complete' : ''}
            </Text>
          </View>
        </View>
        <ChevronRight size={16} color={day.allLogged ? Colors.teal : Colors.textSecondary} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const {
    todayCheckIn,
    muscleGroups,
    checkIns,
  } = useRehab();
  const { program, currentWeekPlan, currentWeekLogs, programProgress, advanceWeek } = useProgram();
  const { profile, isLoading: profileLoading } = useProfile();

  const overMRV = muscleGroups.filter(mg => mg.currentSets > mg.mrv);

  const daysPerWeek = currentWeekPlan?.daysPerWeek ?? 3;

  const currentWeekDays = useMemo((): CurrentWeekDay[] => {
    if (!currentWeekPlan) return [];
    const days: CurrentWeekDay[] = [];
    for (let d = 1; d <= currentWeekPlan.daysPerWeek; d++) {
      const dayLogs = currentWeekLogs.filter(l => l.dayNumber === d);
      const loggedIds = new Set(dayLogs.map(l => l.activityId));
      const allDone = currentWeekPlan.targets.every(t => loggedIds.has(t.activityId));
      const someDone = dayLogs.length > 0;
      days.push({
        dayNumber: d,
        targets: currentWeekPlan.targets,
        allLogged: allDone,
        someLogged: someDone,
      });
    }
    return days;
  }, [currentWeekPlan, currentWeekLogs]);

  const allTargetsLogged = useMemo(() => {
    if (!currentWeekPlan) return false;
    return currentWeekDays.every(d => d.allLogged);
  }, [currentWeekPlan, currentWeekDays]);

  const completedDays = currentWeekDays.filter(d => d.allLogged).length;

  const handleOpenDay = useCallback((weekNumber: number, dayNumber: number) => {
    if (!program) return;
    router.push({ pathname: '/log-activity', params: { weekNumber: String(weekNumber), dayNumber: String(dayNumber) } });
  }, [program]);

  useEffect(() => {
    if (!profileLoading && !profile.hasCompletedOnboarding) {
      console.log('[HomeScreen] New user detected, redirecting to onboarding');
      router.replace('/onboarding');
    }
  }, [profileLoading, profile.hasCompletedOnboarding]);

  if (profileLoading || !profile.hasCompletedOnboarding) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const hasActiveProgram = program && program.isActive;

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  })();

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={styles.greeting}>{greeting}</Text>
          <Text style={styles.dateText}>{dateStr}</Text>
        </View>


        {hasActiveProgram && (
          <>
            <View style={styles.programOverview}>
              <View style={styles.programOverviewHeader}>
                <View>
                  <Text style={styles.programOverviewTitle}>Week {program.currentWeek}</Text>
                  <Text style={styles.programOverviewSub}>
                    {getPhaseLabel(currentWeekPlan?.phase ?? 'frequency')} · {daysPerWeek} day{daysPerWeek !== 1 ? 's' : ''}
                  </Text>
                </View>
                {allTargetsLogged && program.currentWeek < program.totalWeeks && (
                  <TouchableOpacity
                    style={styles.advanceButton}
                    onPress={() => {
                      if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      advanceWeek();
                    }}
                    activeOpacity={0.8}
                  >
                    <TrendingUp size={14} color={Colors.textInverse} />
                    <Text style={styles.advanceButtonText}>Advance</Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.overviewProgressRow}>
                <View style={styles.overviewProgressBarBg}>
                  <View style={[styles.overviewProgressBarFill, { width: `${programProgress}%` }]} />
                </View>
                <Text style={styles.overviewProgressPercent}>{programProgress}%</Text>
              </View>

              <View style={styles.weekProgressRow}>
                <Text style={styles.weekProgressLabel}>{completedDays}/{daysPerWeek} days complete</Text>
                <View style={styles.weekProgressBarBg}>
                  <View style={[
                    styles.weekProgressBarFill,
                    { width: `${daysPerWeek > 0 ? (completedDays / daysPerWeek) * 100 : 0}%` },
                  ]} />
                </View>
              </View>

              <View style={styles.overviewStats}>
                <View style={styles.overviewStatItem}>
                  <Calendar size={14} color={Colors.primary} />
                  <Text style={styles.overviewStatValue}>{program.currentWeek}/{program.totalWeeks}</Text>
                  <Text style={styles.overviewStatLabel}>Week</Text>
                </View>
                <View style={styles.overviewStatDivider} />
                <View style={styles.overviewStatItem}>
                  <Dumbbell size={14} color={Colors.teal} />
                  <Text style={styles.overviewStatValue}>{daysPerWeek}</Text>
                  <Text style={styles.overviewStatLabel}>Days/Wk</Text>
                </View>
                <View style={styles.overviewStatDivider} />
                <View style={styles.overviewStatItem}>
                  <Activity size={14} color={getPhaseColor(currentWeekPlan?.phase ?? 'frequency')} />
                  <Text style={styles.overviewStatValue}>
                    {currentWeekPlan ? getPhaseLabel(currentWeekPlan.phase).split(' ')[0] : '—'}
                  </Text>
                  <Text style={styles.overviewStatLabel}>Phase</Text>
                </View>
              </View>
            </View>

            <Text style={[styles.sectionLabel, { marginTop: 4 }]}>This Week's Workouts</Text>

            {currentWeekDays.map(day => (
              <DayCard
                key={day.dayNumber}
                weekNumber={program.currentWeek}
                day={day}
                onPress={() => handleOpenDay(program.currentWeek, day.dayNumber)}
              />
            ))}

            <TouchableOpacity
              style={styles.viewAllWeeksButton}
              onPress={() => router.push('/(tabs)/load')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllWeeksText}>View All Weeks</Text>
              <ChevronRight size={14} color={Colors.primary} />
            </TouchableOpacity>
          </>
        )}

        {!hasActiveProgram && (
          <TouchableOpacity
            style={styles.createProgramCard}
            onPress={() => router.push('/onboarding')}
            activeOpacity={0.8}
          >
            <View style={styles.createProgramIcon}>
              <Sparkles size={26} color={Colors.primary} />
            </View>
            <View style={styles.createProgramText}>
              <Text style={styles.createProgramTitle}>Build a Program</Text>
              <Text style={styles.createProgramDescription}>
                Get a personalized progressive plan with weekly targets
              </Text>
            </View>
            <ChevronRight size={18} color={Colors.textTertiary} />
          </TouchableOpacity>
        )}

        {overMRV.length > 0 && (
          <View style={styles.alertCard}>
            <AlertTriangle size={18} color={Colors.coral} />
            <Text style={styles.alertText}>
              {overMRV.length} muscle group{overMRV.length > 1 ? 's' : ''} over MRV — consider a deload
            </Text>
          </View>
        )}



        {todayCheckIn && (
          <View style={styles.todaySummary}>
            <Text style={styles.sectionLabel}>Today's Check-In</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryItemLabel}>Pain Level</Text>
                <Text style={[styles.summaryItemValue, { color: todayCheckIn.painLevel > 5 ? Colors.coral : Colors.teal }]}>
                  {todayCheckIn.painLevel}/10
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryItemLabel}>Sleep Quality</Text>
                <Text style={[styles.summaryItemValue, { color: Colors.primary }]}>
                  {todayCheckIn.sleepQuality}/10
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryItemLabel}>Energy</Text>
                <Text style={[styles.summaryItemValue, { color: Colors.teal }]}>
                  {todayCheckIn.energyLevel}/10
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryItemLabel}>Stress</Text>
                <Text style={[styles.summaryItemValue, { color: todayCheckIn.stressLevel > 5 ? Colors.coral : Colors.teal }]}>
                  {todayCheckIn.stressLevel}/10
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.actionsSection}>
          <Text style={styles.sectionLabel}>Quick Actions</Text>
          <ActionButton
            icon={<ClipboardCheck size={20} color={Colors.primary} />}
            label={todayCheckIn ? 'Update Check-In' : 'Daily Check-In'}
            subtitle={todayCheckIn ? 'Already checked in today' : 'Start your day right'}
            color={Colors.primary}
            onPress={() => router.push('/check-in')}
          />
          <ActionButton
            icon={<Activity size={20} color={Colors.coral} />}
            label="Log Pain"
            subtitle="Track a pain episode"
            color={Colors.coral}
            onPress={() => router.push('/log-pain')}
          />
          <ActionButton
            icon={<Dumbbell size={20} color={Colors.teal} />}
            label="Log Training"
            subtitle="Record your sets"
            color={Colors.teal}
            onPress={() => router.push('/log-sets')}
          />
          <ActionButton
            icon={<TrendingUp size={20} color={Colors.green} />}
            label="Learn"
            subtitle="Evidence-based education"
            color={Colors.green}
            onPress={() => router.push('/(tabs)/learn')}
          />
        </View>

        {checkIns.length > 1 && (
          <View style={styles.trendSection}>
            <Text style={styles.sectionLabel}>Readiness Trend (Last 7)</Text>
            <View style={styles.trendCard}>
              <View style={styles.trendBars}>
                {checkIns.slice(0, 7).reverse().map((ci) => {
                  const height = Math.max(ci.readinessScore * 0.8, 4);
                  const color = ci.readinessScore >= 60 ? Colors.teal : ci.readinessScore >= 40 ? Colors.amber : Colors.coral;
                  return (
                    <View key={ci.id} style={styles.trendBarContainer}>
                      <View style={[styles.trendBar, { height, backgroundColor: color }]} />
                      <Text style={styles.trendBarLabel}>
                        {new Date(ci.date).toLocaleDateString('en-US', { weekday: 'short' }).charAt(0)}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>
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
  headerSection: {
    marginBottom: 24,
  },

  greeting: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  dateText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
    fontWeight: '400' as const,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  programOverview: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  programOverviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  programOverviewTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
  },
  programOverviewSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  advanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.teal,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  advanceButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  overviewProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  overviewProgressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  overviewProgressBarFill: {
    height: 6,
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  overviewProgressPercent: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
    minWidth: 36,
    textAlign: 'right' as const,
  },
  overviewStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 12,
  },
  overviewStatItem: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  overviewStatValue: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  overviewStatLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.3,
  },
  overviewStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.borderLight,
  },
  weekProgressRow: {
    marginTop: 12,
    marginBottom: 14,
  },
  weekProgressLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  weekProgressBarBg: {
    height: 5,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 3,
    overflow: 'hidden',
  },
  weekProgressBarFill: {
    height: 5,
    backgroundColor: Colors.teal,
    borderRadius: 3,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  dayCardLogged: {
    backgroundColor: Colors.teal + '08',
    borderWidth: 1,
    borderColor: Colors.teal + '20',
  },
  dayCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCardTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  dayCardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  dayCardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  viewAllWeeksButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 14,
    marginBottom: 8,
  },
  viewAllWeeksText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  createProgramCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.primary + '15',
  },
  createProgramIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: Colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createProgramText: {
    flex: 1,
    marginLeft: 14,
  },
  createProgramTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  createProgramDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.coral + '10',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: Colors.coral,
  },
  alertText: {
    fontSize: 13,
    color: Colors.coral,
    fontWeight: '500' as const,
    flex: 1,
  },

  todaySummary: {
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryItemLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  summaryItemValue: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    flex: 1,
    marginLeft: 12,
  },
  actionLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  actionSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  trendSection: {
    marginBottom: 24,
  },
  trendCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  trendBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: 100,
  },
  trendBarContainer: {
    alignItems: 'center',
    gap: 6,
  },
  trendBar: {
    width: 28,
    borderRadius: 6,
    minHeight: 4,
  },
  trendBarLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
});
