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
import { X, Check, Minus, Plus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useRehab } from '@/providers/RehabProvider';

export default function LogSetsScreen() {
  const insets = useSafeAreaInsets();
  const { muscleGroups, logSets } = useRehab();
  const [selectedGroup, setSelectedGroup] = useState<string>('');
  const [exercise, setExercise] = useState<string>('');
  const [sets, setSets] = useState<number>(3);
  const [reps, setReps] = useState<number>(10);
  const [weight, setWeight] = useState<string>('');

  const handleSave = useCallback(() => {
    if (!selectedGroup || !exercise.trim()) return;
    logSets(selectedGroup, exercise.trim(), sets, reps, parseFloat(weight) || 0);
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    router.back();
  }, [selectedGroup, exercise, sets, reps, weight, logSets]);

  const canSave = selectedGroup && exercise.trim();

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Log Training</Text>
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
          disabled={!canSave}
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
        <Text style={styles.sectionLabel}>Muscle Group</Text>
        <View style={styles.groupGrid}>
          {muscleGroups.map(group => (
            <TouchableOpacity
              key={group.id}
              style={[
                styles.groupChip,
                selectedGroup === group.id && styles.groupChipSelected,
              ]}
              onPress={() => {
                setSelectedGroup(group.id);
                if (Platform.OS !== 'web') void Haptics.selectionAsync();
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.groupChipText,
                selectedGroup === group.id && styles.groupChipTextSelected,
              ]}>
                {group.name}
              </Text>
              <Text style={[
                styles.groupChipSets,
                selectedGroup === group.id && styles.groupChipSetsSelected,
              ]}>
                {group.currentSets}/{group.mav}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Exercise Name</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., Bench Press, Squat..."
          placeholderTextColor={Colors.textTertiary}
          value={exercise}
          onChangeText={setExercise}
        />

        <View style={styles.counterRow}>
          <View style={styles.counterItem}>
            <Text style={styles.counterLabel}>Sets</Text>
            <View style={styles.counter}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setSets(Math.max(1, sets - 1))}
                activeOpacity={0.7}
              >
                <Minus size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{sets}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setSets(Math.min(20, sets + 1))}
                activeOpacity={0.7}
              >
                <Plus size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.counterItem}>
            <Text style={styles.counterLabel}>Reps</Text>
            <View style={styles.counter}>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setReps(Math.max(1, reps - 1))}
                activeOpacity={0.7}
              >
                <Minus size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.counterValue}>{reps}</Text>
              <TouchableOpacity
                style={styles.counterButton}
                onPress={() => setReps(Math.min(50, reps + 1))}
                activeOpacity={0.7}
              >
                <Plus size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Weight (optional)</Text>
        <TextInput
          style={styles.textInput}
          placeholder="e.g., 135"
          placeholderTextColor={Colors.textTertiary}
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
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
    backgroundColor: Colors.teal,
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
  groupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  groupChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  groupChipSelected: {
    backgroundColor: Colors.teal + '15',
    borderColor: Colors.teal,
  },
  groupChipText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  groupChipTextSelected: {
    color: Colors.teal,
    fontWeight: '600' as const,
  },
  groupChipSets: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  groupChipSetsSelected: {
    color: Colors.teal,
  },
  textInput: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  counterRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  counterItem: {
    flex: 1,
    gap: 8,
  },
  counterLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
  },
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValue: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
  },
});
