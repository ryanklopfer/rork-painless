import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { X, Check } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRehab } from '@/providers/RehabProvider';
import { bodyRegions, painTypes } from '@/mocks/bodyRegions';
import { PainType } from '@/types';

export default function LogPainScreen() {
  const insets = useSafeAreaInsets();
  const { addPainEntry } = useRehab();
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [selectedType, setSelectedType] = useState<PainType>('aching');
  const [intensity, setIntensity] = useState<number>(4);
  const [notes, setNotes] = useState<string>('');

  const handleSave = useCallback(() => {
    if (!selectedRegion) return;
    addPainEntry({
      region: selectedRegion,
      type: selectedType,
      intensity,
      notes,
    });
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  }, [selectedRegion, selectedType, intensity, notes, addPainEntry]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Log Pain</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, !selectedRegion && styles.saveButtonDisabled]}
          disabled={!selectedRegion}
          activeOpacity={0.8}
        >
          <Check size={18} color={Colors.textInverse} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionLabel}>Body Region</Text>
        <View style={styles.regionGrid}>
          {bodyRegions.map(region => (
            <TouchableOpacity
              key={region.id}
              style={[
                styles.regionChip,
                selectedRegion === region.id && styles.regionChipSelected,
              ]}
              onPress={() => {
                setSelectedRegion(region.id);
                if (Platform.OS !== 'web') void Haptics.selectionAsync();
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.regionChipText,
                selectedRegion === region.id && styles.regionChipTextSelected,
              ]}>
                {region.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Pain Type</Text>
        <View style={styles.typeGrid}>
          {painTypes.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeChip,
                selectedType === type.id && styles.typeChipSelected,
              ]}
              onPress={() => {
                setSelectedType(type.id as PainType);
                if (Platform.OS !== 'web') void Haptics.selectionAsync();
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.typeEmoji}>{type.emoji}</Text>
              <Text style={[
                styles.typeChipText,
                selectedType === type.id && styles.typeChipTextSelected,
              ]}>
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Intensity</Text>
        <View style={styles.intensitySection}>
          <Text style={[
            styles.intensityValue,
            {
              color: intensity <= 3 ? Colors.teal : intensity <= 6 ? Colors.amber : Colors.coral,
            },
          ]}>
            {intensity}/10
          </Text>
          <View style={styles.intensityTrack}>
            {Array.from({ length: 11 }, (_, i) => {
              const dotColor = i <= intensity
                ? (i <= 3 ? Colors.teal : i <= 6 ? Colors.amber : Colors.coral)
                : Colors.surfaceSecondary;
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => {
                    setIntensity(i);
                    if (Platform.OS !== 'web') void Haptics.selectionAsync();
                  }}
                  style={[
                    styles.intensityDot,
                    {
                      backgroundColor: dotColor,
                      transform: [{ scale: i === intensity ? 1.4 : 1 }],
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.intensityLabels}>
            <Text style={styles.intensityEndLabel}>None</Text>
            <Text style={styles.intensityEndLabel}>Severe</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Notes (Optional)</Text>
        <TextInput
          style={styles.notesInput}
          placeholder="Describe what you're feeling..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          value={notes}
          onChangeText={setNotes}
          textAlignVertical="top"
        />

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
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 12,
    marginTop: 20,
  },
  regionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  regionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  regionChipSelected: {
    backgroundColor: Colors.primary + '15',
    borderColor: Colors.primary,
  },
  regionChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  regionChipTextSelected: {
    color: Colors.primary,
    fontWeight: '600' as const,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  typeChipSelected: {
    backgroundColor: Colors.coral + '15',
    borderColor: Colors.coral,
  },
  typeEmoji: {
    fontSize: 16,
  },
  typeChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  typeChipTextSelected: {
    color: Colors.coral,
    fontWeight: '600' as const,
  },
  intensitySection: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 16,
  },
  intensityValue: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  intensityTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 4,
  },
  intensityDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  intensityLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  intensityEndLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  notesInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
    lineHeight: 22,
  },
});
