import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import {
  X,
  Brain,
  TrendingUp,
  BarChart3,
  ArrowUpRight,
  RefreshCw,
  BatteryLow,
  PauseCircle,
  Moon,
  Scale,
  ShieldCheck,
  Flag,
  Users,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { learnCards, categoryLabels, categoryColors } from '@/mocks/learnContent';

const ICON_MAP: Record<string, React.ComponentType<{ size: number; color: string }>> = {
  'brain': Brain,
  'trending-up': TrendingUp,
  'bar-chart-3': BarChart3,
  'arrow-up-right': ArrowUpRight,
  'refresh-cw': RefreshCw,
  'battery-low': BatteryLow,
  'pause-circle': PauseCircle,
  'moon': Moon,
  'scale': Scale,
  'shield-check': ShieldCheck,
  'flag': Flag,
  'users': Users,
};

export default function LearnDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const card = learnCards.find(c => c.id === id);

  if (!card) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Content not found</Text>
        </View>
      </View>
    );
  }

  const IconComponent = ICON_MAP[card.icon] ?? Brain;
  const catColor = categoryColors[card.category] ?? Colors.primary;

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Learn</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.iconContainer, { backgroundColor: catColor + '15' }]}>
          <IconComponent size={36} color={catColor} />
        </View>

        <Text style={[styles.categoryLabel, { color: catColor }]}>
          {categoryLabels[card.category]}
        </Text>

        <Text style={styles.cardTitle}>{card.title}</Text>
        <Text style={styles.cardSummary}>{card.summary}</Text>

        <View style={styles.divider} />

        <Text style={styles.contentText}>{card.content}</Text>

        <View style={{ height: 40 }} />
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
  topTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  categoryLabel: {
    fontSize: 12,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  cardSummary: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 24,
  },
  contentText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 26,
    letterSpacing: 0.1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
