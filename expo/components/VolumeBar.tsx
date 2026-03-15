import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Colors from '@/constants/colors';
import { MuscleGroupVolume } from '@/types';

interface VolumeBarProps {
  group: MuscleGroupVolume;
  compact?: boolean;
}

function getZoneLabel(current: number, mev: number, mav: number, mrv: number): string {
  if (current === 0) return 'No volume';
  if (current < mev) return 'Below MEV';
  if (current <= mav) return 'Optimal (MAV)';
  if (current <= mrv) return 'High (near MRV)';
  return 'Over MRV!';
}

function getZoneColor(current: number, mev: number, mav: number, mrv: number): string {
  if (current === 0) return Colors.textTertiary;
  if (current < mev) return Colors.zones.mev;
  if (current <= mav) return Colors.zones.mav;
  if (current <= mrv) return Colors.amber;
  return Colors.zones.aboveMRV;
}

export default function VolumeBar({ group, compact = false }: VolumeBarProps) {
  const maxDisplay = group.mrv * 1.2;
  const mevPct = (group.mev / maxDisplay) * 100;
  const mavPct = (group.mav / maxDisplay) * 100;
  const mrvPct = (group.mrv / maxDisplay) * 100;
  const currentPct = Math.min((group.currentSets / maxDisplay) * 100, 100);
  const zoneColor = getZoneColor(group.currentSets, group.mev, group.mav, group.mrv);
  const zoneLabel = getZoneLabel(group.currentSets, group.mev, group.mav, group.mrv);

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.header}>
        <Text style={styles.name}>{group.name}</Text>
        <Text style={[styles.setsText, { color: zoneColor }]}>
          {group.currentSets} sets
        </Text>
      </View>
      <View style={styles.barContainer}>
        <View style={styles.barBg}>
          <View style={[styles.zoneMev, { width: `${mevPct}%` }]} />
          <View style={[styles.zoneMav, { left: `${mevPct}%`, width: `${mavPct - mevPct}%` }]} />
          <View style={[styles.zoneMrv, { left: `${mavPct}%`, width: `${mrvPct - mavPct}%` }]} />
          <View style={[styles.zoneOver, { left: `${mrvPct}%`, width: `${100 - mrvPct}%` }]} />
        </View>
        <View style={[styles.indicator, { left: `${currentPct}%`, backgroundColor: zoneColor }]} />
      </View>
      {!compact && (
        <View style={styles.labels}>
          <Text style={styles.labelText}>MEV: {group.mev}</Text>
          <Text style={styles.labelText}>MAV: {group.mav}</Text>
          <Text style={styles.labelText}>MRV: {group.mrv}</Text>
        </View>
      )}
      <Text style={[styles.zoneLabel, { color: zoneColor }]}>{zoneLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 6,
  },
  containerCompact: {
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  setsText: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  barContainer: {
    height: 10,
    position: 'relative',
  },
  barBg: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
    position: 'relative',
  },
  zoneMev: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: Colors.zones.belowMEV,
  },
  zoneMav: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#C8F0EC',
  },
  zoneMrv: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#FFE0B2',
  },
  zoneOver: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    backgroundColor: '#FFCDD2',
  },
  indicator: {
    position: 'absolute',
    top: -3,
    width: 4,
    height: 16,
    borderRadius: 2,
    marginLeft: -2,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  labelText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  zoneLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
});
