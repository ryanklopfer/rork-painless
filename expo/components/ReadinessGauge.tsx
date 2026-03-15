import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Colors from '@/constants/colors';

interface ReadinessGaugeProps {
  score: number | null;
  size?: number;
  hideLabel?: boolean;
}

function getReadinessColor(score: number): string {
  if (score >= 80) return Colors.readiness.great;
  if (score >= 60) return Colors.readiness.good;
  if (score >= 40) return Colors.readiness.moderate;
  if (score >= 20) return Colors.readiness.low;
  return Colors.readiness.veryLow;
}

function getReadinessLabel(score: number): string {
  if (score >= 80) return 'Ready to Progress';
  if (score >= 60) return 'Good to Train';
  if (score >= 40) return 'Train with Caution';
  if (score >= 20) return 'Consider Deloading';
  return 'Rest Day Recommended';
}

export default function ReadinessGauge({ score, size = 180, hideLabel = false }: ReadinessGaugeProps) {
  const animValue = useRef(new Animated.Value(0)).current;
  const strokeWidth = 6;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const displayScore = score ?? 0;
  const progress = displayScore / 100;

  useEffect(() => {
    Animated.timing(animValue, {
      toValue: progress,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [progress, animValue]);

  const color = score !== null ? getReadinessColor(displayScore) : Colors.textTertiary;
  const label = score !== null ? getReadinessLabel(displayScore) : 'No check-in yet';
  const dashOffset = circumference * (1 - progress);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.surfaceSecondary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {!hideLabel && (
        <View style={styles.scoreContainer}>
          <Text style={[styles.scoreText, { color, fontSize: size * 0.27 }]}>
            {score !== null ? displayScore : '—'}
          </Text>
          <Text style={[styles.labelText, { fontSize: size * 0.07 }]}>{label}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    position: 'absolute',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 48,
    fontWeight: '700' as const,
    letterSpacing: -1,
  },
  labelText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
});
