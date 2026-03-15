import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
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
  ChevronRight,
  ClipboardCheck,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { learnCards, categoryLabels, categoryColors } from '@/mocks/learnContent';
import { LearnCategory } from '@/types';

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

const CATEGORIES: (LearnCategory | 'all')[] = ['all', 'pain-science', 'volume-landmarks', 'recovery', 'graded-exposure'];

function LearnCardItem({ card, onPress }: { card: typeof learnCards[0]; onPress: () => void }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const IconComponent = ICON_MAP[card.icon] ?? Brain;
  const catColor = categoryColors[card.category] ?? Colors.primary;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scaleAnim]);

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.learnCard, { transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.cardIconContainer, { backgroundColor: catColor + '15' }]}>
          <IconComponent size={22} color={catColor} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.categoryBadge, { color: catColor }]}>
              {categoryLabels[card.category]}
            </Text>
          </View>
          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardSummary} numberOfLines={2}>{card.summary}</Text>
        </View>
        <ChevronRight size={18} color={Colors.textTertiary} />
      </Animated.View>
    </TouchableOpacity>
  );
}

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState<LearnCategory | 'all'>('all');

  const filteredCards = selectedCategory === 'all'
    ? learnCards
    : learnCards.filter(c => c.category === selectedCategory);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Learn</Text>
        <Text style={styles.subtitle}>Evidence-based education</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[
              styles.filterChip,
              selectedCategory === cat && styles.filterChipSelected,
              selectedCategory === cat && cat !== 'all' && {
                backgroundColor: (categoryColors[cat] ?? Colors.primary) + '15',
                borderColor: categoryColors[cat] ?? Colors.primary,
              },
            ]}
            onPress={() => setSelectedCategory(cat)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.filterChipText,
              selectedCategory === cat && styles.filterChipTextSelected,
              selectedCategory === cat && cat !== 'all' && {
                color: categoryColors[cat] ?? Colors.primary,
              },
            ]}>
              {cat === 'all' ? 'All' : categoryLabels[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {(selectedCategory === 'all' || selectedCategory === 'pain-science') && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/pain-science-quiz')}
            style={styles.quizBanner}
          >
            <View style={styles.quizBannerIcon}>
              <ClipboardCheck size={22} color="#fff" />
            </View>
            <View style={styles.quizBannerContent}>
              <Text style={styles.quizBannerTitle}>Pain Science Quiz</Text>
              <Text style={styles.quizBannerDesc}>10 true/false questions — test your knowledge</Text>
            </View>
            <ChevronRight size={18} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        )}

        {filteredCards.map(card => (
          <LearnCardItem
            key={card.id}
            card={card}
            onPress={() => router.push({ pathname: '/learn-detail', params: { id: card.id } })}
          />
        ))}
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
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  filterScroll: {
    maxHeight: 48,
    marginVertical: 12,
  },
  filterContent: {
    paddingHorizontal: 20,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  filterChipSelected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  filterChipTextSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  learnCard: {
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
  cardIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryBadge: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
    marginTop: 2,
  },
  cardSummary: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  quizBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90D9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    shadowColor: 'rgba(74, 144, 217, 0.3)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  quizBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  quizBannerContent: {
    flex: 1,
  },
  quizBannerTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 2,
  },
  quizBannerDesc: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
  },
});
