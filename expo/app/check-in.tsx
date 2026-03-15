import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Platform,
  PanResponder,
  LayoutChangeEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X, Check } from 'lucide-react-native';
import Svg, { Circle } from 'react-native-svg';
import Colors from '@/constants/colors';
import { useRehab } from '@/providers/RehabProvider';

interface SliderConfig {
  key: string;
  label: string;
  emoji: string;
  color: string;
  min: number;
  max: number;
  suffix: string;
  lowLabel: string;
  highLabel: string;
}

const SLIDERS: SliderConfig[] = [
  { key: 'energy', label: 'Energy Level', emoji: '\u26A1', color: '#4CAF50', min: 0, max: 10, suffix: '/10', lowLabel: 'Exhausted', highLabel: 'Energized' },
  { key: 'sleep', label: 'Sleep (hours)', emoji: '\uD83D\uDCA4', color: '#9C27B0', min: 0, max: 12, suffix: 'h', lowLabel: '0h', highLabel: '12h' },
  { key: 'stress', label: 'Life Stress', emoji: '\uD83E\uDD2F', color: '#F44336', min: 0, max: 10, suffix: '/10', lowLabel: 'Relaxed', highLabel: 'Very Stressed' },
  { key: 'soreness', label: 'Muscle Soreness', emoji: '\uD83E\uDD4A', color: '#FF9800', min: 0, max: 10, suffix: '/10', lowLabel: 'None', highLabel: 'Severe' },
];

function getReadinessScore(energy: number, sleep: number, stress: number, soreness: number): number {
  const energyScore = (energy / 10) * 25;
  const sleepScore = Math.min(sleep / 8, 1) * 25;
  const stressScore = ((10 - stress) / 10) * 25;
  const sorenessScore = ((10 - soreness) / 10) * 25;
  return Math.round(energyScore + sleepScore + stressScore + sorenessScore);
}

function getReadinessLabel(score: number): string {
  if (score >= 80) return 'Ready to Push';
  if (score >= 60) return 'Good to Train';
  if (score >= 40) return 'Train with Caution';
  if (score >= 20) return 'Consider Deloading';
  return 'Rest Day Recommended';
}

function getReadinessColor(score: number): string {
  if (score >= 80) return Colors.readiness.great;
  if (score >= 60) return Colors.readiness.good;
  if (score >= 40) return Colors.readiness.moderate;
  if (score >= 20) return Colors.readiness.low;
  return Colors.readiness.veryLow;
}

function getRecommendation(score: number): { title: string; desc: string; color: string } {
  if (score >= 75) return {
    title: 'Full volume \u2014 train at your MAV',
    desc: 'Your cup has room. Push toward your planned sets and weight.',
    color: Colors.teal,
  };
  if (score >= 50) return {
    title: 'Moderate volume \u2014 stay controlled',
    desc: 'Train at your current level but monitor how you feel.',
    color: Colors.amber,
  };
  if (score >= 30) return {
    title: 'Reduce volume \u2014 lighter session',
    desc: 'Back off intensity today. Focus on technique and movement quality.',
    color: Colors.coral,
  };
  return {
    title: 'Rest or active recovery',
    desc: 'Your body needs recovery. Gentle movement, sleep, and nutrition.',
    color: Colors.readiness.veryLow,
  };
}

function ContinuousSlider({
  config,
  value,
  onValueChange,
}: {
  config: SliderConfig;
  value: number;
  onValueChange: (v: number) => void;
}) {
  const trackWidth = useRef(0);
  const lastHapticValue = useRef(value);

  const handleTrackLayout = useCallback((e: LayoutChangeEvent) => {
    trackWidth.current = e.nativeEvent.layout.width;
  }, []);

  const clampValue = useCallback((x: number) => {
    if (trackWidth.current === 0) return value;
    const ratio = Math.max(0, Math.min(1, x / trackWidth.current));
    const raw = config.min + ratio * (config.max - config.min);
    return Math.round(raw);
  }, [config.min, config.max, value]);

  const panResponder = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt) => {
      const x = evt.nativeEvent.locationX;
      const newVal = clampValue(x);
      onValueChange(newVal);
      lastHapticValue.current = newVal;
    },
    onPanResponderMove: (evt) => {
      const x = evt.nativeEvent.locationX;
      const newVal = clampValue(x);
      onValueChange(newVal);
      if (newVal !== lastHapticValue.current) {
        lastHapticValue.current = newVal;
        if (Platform.OS !== 'web') {
          void Haptics.selectionAsync();
        }
      }
    },
  }), [clampValue, onValueChange]);

  const progress = (value - config.min) / (config.max - config.min);
  const displayValue = config.suffix === 'h' ? `${value}h` : `${value}${config.suffix}`;

  return (
    <View style={sliderStyles.container}>
      <View style={sliderStyles.header}>
        <Text style={sliderStyles.labelRow}>
          <Text style={sliderStyles.emoji}>{config.emoji} </Text>
          <Text style={sliderStyles.label}>{config.label}</Text>
        </Text>
        <Text style={[sliderStyles.value, { color: config.color }]}>{displayValue}</Text>
      </View>
      <View
        style={sliderStyles.trackOuter}
        onLayout={handleTrackLayout}
        {...panResponder.panHandlers}
      >
        <View style={sliderStyles.trackBg}>
          <View style={[sliderStyles.trackFill, { width: `${progress * 100}%`, backgroundColor: config.color }]} />
        </View>
        <View style={[sliderStyles.thumb, { left: `${progress * 100}%`, backgroundColor: config.color }]} />
      </View>
    </View>
  );
}

const sliderStyles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelRow: {
    fontSize: 16,
  },
  emoji: {
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  value: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  trackOuter: {
    height: 40,
    justifyContent: 'center',
    position: 'relative' as const,
  },
  trackBg: {
    height: 8,
    backgroundColor: '#3A3F4B',
    borderRadius: 4,
    overflow: 'hidden',
  },
  trackFill: {
    height: 8,
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute' as const,
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: -12,
    top: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});

export default function CheckInScreen() {
  const insets = useSafeAreaInsets();
  const { addCheckIn } = useRehab();

  const [energy, setEnergy] = useState<number>(7);
  const [sleep, setSleep] = useState<number>(7);
  const [stress, setStress] = useState<number>(4);
  const [soreness, setSoreness] = useState<number>(3);
  const [submitted, setSubmitted] = useState<boolean>(false);

  const readiness = useMemo(() => getReadinessScore(energy, sleep, stress, soreness), [energy, sleep, stress, soreness]);
  const readinessColor = getReadinessColor(readiness);
  const readinessLabel = getReadinessLabel(readiness);
  const recommendation = useMemo(() => getRecommendation(readiness), [readiness]);

  const gaugeSize = 120;
  const strokeWidth = 10;
  const radius = (gaugeSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - readiness / 100);

  const gaugeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(gaugeAnim, {
      toValue: readiness / 100,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [readiness, gaugeAnim]);

  const handleSubmit = useCallback(() => {
    addCheckIn({
      painLevel: soreness,
      sleepQuality: Math.round((sleep / 12) * 10),
      stressLevel: stress,
      energyLevel: energy,
      notes: '',
    });
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSubmitted(true);
  }, [energy, sleep, stress, soreness, addCheckIn]);

  const submitScale = useRef(new Animated.Value(1)).current;
  const handlePressIn = useCallback(() => {
    Animated.spring(submitScale, { toValue: 0.96, useNativeDriver: true }).start();
  }, [submitScale]);
  const handlePressOut = useCallback(() => {
    Animated.spring(submitScale, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [submitScale]);

  if (submitted) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <View style={{ width: 36 }} />
          <Text style={styles.topTitle}>Check-In Complete</Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X size={22} color={Colors.text} />
          </TouchableOpacity>
        </View>
        <View style={styles.resultContainer}>
          <View style={styles.gaugeCard}>
            <View style={{ width: gaugeSize, height: gaugeSize, alignItems: 'center', justifyContent: 'center' }}>
              <Svg width={gaugeSize} height={gaugeSize} style={{ position: 'absolute' as const }}>
                <Circle
                  cx={gaugeSize / 2}
                  cy={gaugeSize / 2}
                  r={radius}
                  stroke={Colors.surfaceSecondary}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  transform={`rotate(-90 ${gaugeSize / 2} ${gaugeSize / 2})`}
                />
                <Circle
                  cx={gaugeSize / 2}
                  cy={gaugeSize / 2}
                  r={radius}
                  stroke={readinessColor}
                  strokeWidth={strokeWidth}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={dashOffset}
                  transform={`rotate(-90 ${gaugeSize / 2} ${gaugeSize / 2})`}
                />
              </Svg>
              <Text style={[styles.gaugeScore, { color: readinessColor }]}>{readiness}</Text>
            </View>
            <Text style={[styles.gaugeLabel, { color: readinessColor }]}>{readinessLabel}</Text>
          </View>

          <View style={[styles.recommendationCard, { borderLeftColor: recommendation.color }]}>
            <Text style={[styles.recommendationTitle, { color: recommendation.color }]}>{recommendation.title}</Text>
            <Text style={styles.recommendationDesc}>{recommendation.desc}</Text>
          </View>

          <TouchableOpacity style={styles.doneButton} onPress={() => router.back()} activeOpacity={0.8}>
            <Check size={18} color={Colors.textInverse} />
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Pre-Workout Check-In</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 16) + 80 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gaugeCard}>
          <View style={{ width: gaugeSize, height: gaugeSize, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={gaugeSize} height={gaugeSize} style={{ position: 'absolute' as const }}>
              <Circle
                cx={gaugeSize / 2}
                cy={gaugeSize / 2}
                r={radius}
                stroke={Colors.surfaceSecondary}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                transform={`rotate(-90 ${gaugeSize / 2} ${gaugeSize / 2})`}
              />
              <Circle
                cx={gaugeSize / 2}
                cy={gaugeSize / 2}
                r={radius}
                stroke={readinessColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${circumference}`}
                strokeDashoffset={dashOffset}
                transform={`rotate(-90 ${gaugeSize / 2} ${gaugeSize / 2})`}
              />
            </Svg>
            <Text style={[styles.gaugeScore, { color: readinessColor }]}>{readiness}</Text>
          </View>
          <Text style={[styles.gaugeLabel, { color: readinessColor }]}>{readinessLabel}</Text>
          <Text style={styles.gaugeHint}>Adjust the sliders below — your plan adapts in real time</Text>
        </View>

        <View style={styles.slidersCard}>
          <ContinuousSlider config={SLIDERS[0]} value={energy} onValueChange={setEnergy} />
          <ContinuousSlider config={SLIDERS[1]} value={sleep} onValueChange={setSleep} />
          <ContinuousSlider config={SLIDERS[2]} value={stress} onValueChange={setStress} />
          <ContinuousSlider config={SLIDERS[3]} value={soreness} onValueChange={setSoreness} />
        </View>

        <View style={[styles.recommendationCard, { borderLeftColor: recommendation.color }]}>
          <Text style={[styles.recommendationTitle, { color: recommendation.color }]}>{recommendation.title}</Text>
          <Text style={styles.recommendationDesc}>{recommendation.desc}</Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.submitButton, { transform: [{ scale: submitScale }] }]}>
            <Check size={18} color={Colors.textInverse} />
            <Text style={styles.submitButtonText}>Submit Check-In</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>
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
    fontWeight: '700' as const,
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  gaugeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  gaugeScore: {
    fontSize: 40,
    fontWeight: '700' as const,
    letterSpacing: -1,
  },
  gaugeLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 12,
  },
  gaugeHint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  slidersCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    paddingBottom: 4,
    marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  recommendationCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    marginBottom: 16,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  recommendationTitle: {
    fontSize: 15,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  recommendationDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 20,
  },
  doneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: 40,
    paddingVertical: 14,
    gap: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
