import React, { useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Activity, Dumbbell, TrendingUp, Flame } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRehab } from '@/providers/RehabProvider';
import LineGraph from '@/components/LineGraph';
import ReadinessGauge from '@/components/ReadinessGauge';

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
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
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.statIcon, { backgroundColor: color + '15' }]}>{icon}</View>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const { recentPainAverage, muscleGroups, checkIns, painEntries, latestReadiness, streak } = useRehab();

  const totalSets = useMemo(
    () => muscleGroups.reduce((sum, mg) => sum + mg.currentSets, 0),
    [muscleGroups],
  );

  const painTrend = useMemo(() => {
    const recent = painEntries.slice(0, 14);
    if (recent.length < 2) return null;
    const half = Math.floor(recent.length / 2);
    const newerAvg = recent.slice(0, half).reduce((s, e) => s + e.intensity, 0) / half;
    const olderAvg = recent.slice(half).reduce((s, e) => s + e.intensity, 0) / (recent.length - half);
    const diff = newerAvg - olderAvg;
    if (Math.abs(diff) < 0.3) return 'stable' as const;
    return diff < 0 ? 'improving' as const : 'worsening' as const;
  }, [painEntries]);

  const readinessTrend = useMemo(() => {
    if (checkIns.length < 2) return null;
    const recent = checkIns.slice(0, 7);
    const avg = recent.reduce((s, c) => s + c.readinessScore, 0) / recent.length;
    return Math.round(avg);
  }, [checkIns]);

  const recentCheckIns = useMemo(() => {
    return [...checkIns].slice(0, 14).reverse();
  }, [checkIns]);

  const energyData = useMemo(() => {
    return recentCheckIns.map(ci => ({
      label: formatDateShort(ci.date),
      value: ci.energyLevel,
    }));
  }, [recentCheckIns]);

  const sleepData = useMemo(() => {
    return recentCheckIns.map(ci => ({
      label: formatDateShort(ci.date),
      value: ci.sleepQuality,
    }));
  }, [recentCheckIns]);

  const stressData = useMemo(() => {
    return recentCheckIns.map(ci => ({
      label: formatDateShort(ci.date),
      value: ci.stressLevel,
    }));
  }, [recentCheckIns]);

  const painData = useMemo(() => {
    return recentCheckIns.map(ci => ({
      label: formatDateShort(ci.date),
      value: ci.painLevel,
    }));
  }, [recentCheckIns]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topCardsRow}>
          <View style={styles.readinessCard}>
            <ReadinessGauge score={latestReadiness} size={44} hideLabel />
            <View style={styles.readinessTextWrap}>
              <Text style={styles.readinessValue}>{latestReadiness ?? '\u2014'}</Text>
              <Text style={styles.readinessLabel}>Readiness</Text>
            </View>
          </View>
          <View style={styles.streakCard}>
            <View style={[styles.streakIcon, { backgroundColor: Colors.amber + '15' }]}>
              <Flame size={20} color={Colors.amber} />
            </View>
            <Text style={styles.streakValue}>{streak}d</Text>
            <Text style={styles.streakLabel}>Streak</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <StatCard
            icon={<Activity size={20} color={Colors.coral} />}
            label="Pain Avg"
            value={recentPainAverage !== null ? `${recentPainAverage}/10` : '\u2014'}
            color={Colors.coral}
          />
          <StatCard
            icon={<Dumbbell size={20} color={Colors.primary} />}
            label="Weekly Sets"
            value={`${totalSets}`}
            color={Colors.primary}
          />
        </View>

        {painTrend && (
          <View style={styles.insightCard}>
            <View style={[
              styles.insightDot,
              { backgroundColor: painTrend === 'improving' ? Colors.teal : painTrend === 'worsening' ? Colors.coral : Colors.amber },
            ]} />
            <View style={styles.insightTextWrap}>
              <Text style={styles.insightTitle}>Pain Trend</Text>
              <Text style={styles.insightSub}>
                {painTrend === 'improving' && 'Your pain levels are trending down \u2014 great progress!'}
                {painTrend === 'worsening' && 'Pain levels have been rising \u2014 consider easing intensity.'}
                {painTrend === 'stable' && 'Pain levels are holding steady.'}
              </Text>
            </View>
          </View>
        )}

        {readinessTrend !== null && (
          <View style={styles.insightCard}>
            <View style={[
              styles.insightDot,
              { backgroundColor: readinessTrend >= 60 ? Colors.teal : readinessTrend >= 40 ? Colors.amber : Colors.coral },
            ]} />
            <View style={styles.insightTextWrap}>
              <Text style={styles.insightTitle}>Avg Readiness (7-day)</Text>
              <Text style={styles.insightSub}>
                Your average readiness score is {readinessTrend}/100
              </Text>
            </View>
          </View>
        )}

        {checkIns.length > 0 && (
          <View style={styles.graphsSection}>
            <Text style={styles.graphsSectionTitle}>Check-In Trends</Text>

            <LineGraph
              data={energyData}
              color="#4CAF50"
              title="Energy Level"
              suffix=""
              maxValue={10}
            />

            <LineGraph
              data={sleepData}
              color="#9C27B0"
              title="Sleep Quality"
              suffix=""
              maxValue={10}
            />

            <LineGraph
              data={stressData}
              color="#F44336"
              title="Life Stress"
              suffix=""
              maxValue={10}
            />

            <LineGraph
              data={painData}
              color="#FF9800"
              title="Muscle / Joint Pain"
              suffix=""
              maxValue={10}
            />
          </View>
        )}

        {muscleGroups.some(mg => mg.currentSets > 0) && (
          <View style={styles.volumeSection}>
            <Text style={styles.sectionLabel}>Volume by Muscle Group</Text>
            {muscleGroups.filter(mg => mg.currentSets > 0).map(mg => {
              const pct = Math.min((mg.currentSets / mg.mrv) * 100, 100);
              const barColor = mg.currentSets > mg.mrv ? Colors.coral : mg.currentSets >= mg.mev ? Colors.teal : Colors.primary;
              return (
                <View key={mg.id} style={styles.volumeRow}>
                  <Text style={styles.volumeName}>{mg.name}</Text>
                  <View style={styles.volumeBarWrap}>
                    <View style={styles.volumeBarBg}>
                      <View style={[styles.volumeBarFill, { width: `${pct}%`, backgroundColor: barColor }]} />
                    </View>
                    <Text style={[styles.volumeSets, { color: barColor }]}>{mg.currentSets}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

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

        {checkIns.length === 0 && painEntries.length === 0 && totalSets === 0 && (
          <View style={styles.emptyContainer}>
            <View style={styles.iconCircle}>
              <TrendingUp size={32} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Data Yet</Text>
            <Text style={styles.emptySubtitle}>
              Complete check-ins, log pain, and record sets to see your progress here.
            </Text>
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  topCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  readinessCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    gap: 10,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  readinessTextWrap: {
    alignItems: 'flex-start',
  },
  readinessValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  readinessLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  streakCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  streakIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  streakValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  streakLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginTop: 4,
  },
  insightCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  insightDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 4,
    marginRight: 12,
  },
  insightTextWrap: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 3,
  },
  insightSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  graphsSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  graphsSectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 8,
  },
  volumeSection: {
    marginBottom: 20,
  },
  volumeRow: {
    marginBottom: 12,
  },
  volumeName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 5,
  },
  volumeBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  volumeBarBg: {
    flex: 1,
    height: 8,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: 4,
    overflow: 'hidden',
  },
  volumeBarFill: {
    height: 8,
    borderRadius: 4,
  },
  volumeSets: {
    fontSize: 13,
    fontWeight: '700' as const,
    minWidth: 24,
    textAlign: 'right' as const,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary + '15',
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
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
