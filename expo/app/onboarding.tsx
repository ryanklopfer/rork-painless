import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Footprints,
  Zap,
  Mountain,
  Bike,
  Waves,
  Dumbbell,
  ArrowRight,
  ArrowLeft,
  Check,
  Plus,
  X,
  Timer,
  Target,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useProgram } from '@/providers/ProgramProvider';
import { useProfile } from '@/providers/ProfileProvider';
import {
  ActivityPreset,
  CardioBaseline,
  ResistanceBaseline,
  ActivityCategory,
} from '@/types';
import {
  cardioPresets,
  resistanceUpperPresets,
  resistanceLowerPresets,
} from '@/mocks/activityPresets';


const TOTAL_STEPS = 7;

function getIconForActivity(iconName: string, size: number, color: string) {
  switch (iconName) {
    case 'Footprints': return <Footprints size={size} color={color} />;
    case 'Zap': return <Zap size={size} color={color} />;
    case 'Mountain': return <Mountain size={size} color={color} />;
    case 'Bike': return <Bike size={size} color={color} />;
    case 'Waves': return <Waves size={size} color={color} />;
    default: return <Dumbbell size={size} color={color} />;
  }
}

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { createProgram } = useProgram();
  const { completeOnboarding } = useProfile();
  const [step, setStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [selectedCardio, setSelectedCardio] = useState<ActivityPreset[]>([]);
  const [selectedResistance, setSelectedResistance] = useState<ActivityPreset[]>([]);
  const [cardioBaselines, setCardioBaselines] = useState<CardioBaseline[]>([]);
  const [resistanceBaselines, setResistanceBaselines] = useState<ResistanceBaseline[]>([]);
  const [programWeeks, setProgramWeeks] = useState<number>(10);
  const [customCardioName, setCustomCardioName] = useState('');
  const [customResistanceName, setCustomResistanceName] = useState('');
  const [showCustomCardio, setShowCustomCardio] = useState(false);
  const [showCustomResistance, setShowCustomResistance] = useState(false);

  const animateTransition = useCallback((direction: 'forward' | 'back', callback: () => void) => {
    const exitValue = direction === 'forward' ? -30 : 30;
    const enterValue = direction === 'forward' ? 30 : -30;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: exitValue, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(enterValue);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const goNext = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (step === 2) {
      const baselines = selectedCardio.map(a => ({
        activityId: a.id,
        activityName: a.name,
        durationMinutes: cardioBaselines.find(b => b.activityId === a.id)?.durationMinutes ?? 10,
      }));
      setCardioBaselines(baselines);
    }

    if (step === 4) {
      const baselines = selectedResistance.map(a => ({
        activityId: a.id,
        activityName: a.name,
        sets: resistanceBaselines.find(b => b.activityId === a.id)?.sets ?? 3,
        reps: resistanceBaselines.find(b => b.activityId === a.id)?.reps ?? 10,
        weight: resistanceBaselines.find(b => b.activityId === a.id)?.weight ?? 20,
      }));
      setResistanceBaselines(baselines);
    }

      animateTransition('forward', () => setStep(s => Math.min(s + 1, TOTAL_STEPS - 1)));
  }, [step, selectedCardio, selectedResistance, cardioBaselines, resistanceBaselines, animateTransition]);

  const { profile } = useProfile();

  const goBack = useCallback(() => {
    if (step === 0) {
      if (profile.hasCompletedOnboarding) {
        router.back();
      }
      return;
    }
    animateTransition('back', () => setStep(s => Math.max(s - 1, 0)));
  }, [step, animateTransition, profile.hasCompletedOnboarding]);

  const handleFinish = useCallback(() => {
    if (Platform.OS !== 'web') {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    createProgram(programWeeks, cardioBaselines, resistanceBaselines);
    completeOnboarding();
    router.replace('/(tabs)/(home)');
  }, [programWeeks, cardioBaselines, resistanceBaselines, createProgram, completeOnboarding]);

  const toggleCardio = useCallback((activity: ActivityPreset) => {
    setSelectedCardio(prev => {
      const exists = prev.find(a => a.id === activity.id);
      if (exists) return prev.filter(a => a.id !== activity.id);
      if (prev.length >= 2) return prev;
      return [...prev, activity];
    });
  }, []);

  const toggleResistance = useCallback((activity: ActivityPreset) => {
    setSelectedResistance(prev => {
      const exists = prev.find(a => a.id === activity.id);
      if (exists) return prev.filter(a => a.id !== activity.id);
      if (prev.length >= 3) return prev;
      return [...prev, activity];
    });
  }, []);

  const addCustomCardio = useCallback(() => {
    if (!customCardioName.trim() || selectedCardio.length >= 2) return;
    const custom: ActivityPreset = {
      id: `custom-cardio-${Date.now()}`,
      name: customCardioName.trim(),
      category: 'cardio',
      icon: 'Zap',
      isCustom: true,
    };
    setSelectedCardio(prev => [...prev, custom]);
    setCustomCardioName('');
    setShowCustomCardio(false);
  }, [customCardioName, selectedCardio.length]);

  const addCustomResistance = useCallback((category: ActivityCategory) => {
    if (!customResistanceName.trim() || selectedResistance.length >= 3) return;
    const custom: ActivityPreset = {
      id: `custom-resistance-${Date.now()}`,
      name: customResistanceName.trim(),
      category,
      icon: 'Dumbbell',
      isCustom: true,
    };
    setSelectedResistance(prev => [...prev, custom]);
    setCustomResistanceName('');
    setShowCustomResistance(false);
  }, [customResistanceName, selectedResistance.length]);

  const updateCardioBaseline = useCallback((activityId: string, minutes: number) => {
    setCardioBaselines(prev => {
      const existing = prev.find(b => b.activityId === activityId);
      if (existing) {
        return prev.map(b => b.activityId === activityId ? { ...b, durationMinutes: minutes } : b);
      }
      const activity = selectedCardio.find(a => a.id === activityId);
      return [...prev, { activityId, activityName: activity?.name ?? '', durationMinutes: minutes }];
    });
  }, [selectedCardio]);

  const updateResistanceBaseline = useCallback((activityId: string, field: 'sets' | 'reps' | 'weight', value: number) => {
    setResistanceBaselines(prev => {
      const existing = prev.find(b => b.activityId === activityId);
      if (existing) {
        return prev.map(b => b.activityId === activityId ? { ...b, [field]: value } : b);
      }
      const activity = selectedResistance.find(a => a.id === activityId);
      return [...prev, {
        activityId,
        activityName: activity?.name ?? '',
        sets: field === 'sets' ? value : 3,
        reps: field === 'reps' ? value : 10,
        weight: field === 'weight' ? value : 20,
      }];
    });
  }, [selectedResistance]);

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return true;
      case 1: return selectedCardio.length >= 1;
      case 2: return cardioBaselines.length === selectedCardio.length || selectedCardio.length > 0;
      case 3: return selectedResistance.length >= 2;
      case 4: return resistanceBaselines.length === selectedResistance.length || selectedResistance.length > 0;
      case 5: return programWeeks > 0;
      case 6: return true;
      default: return false;
    }
  };

  const progressWidth = ((step + 1) / TOTAL_STEPS) * 100;

  const renderStep = () => {
    switch (step) {
      case 0: return renderWelcome();
      case 1: return renderCardioSelection();
      case 2: return renderCardioBaseline();
      case 3: return renderResistanceSelection();
      case 4: return renderResistanceBaseline();
      case 5: return renderProgramLength();
      case 6: return renderSummary();
      default: return null;
    }
  };

  const renderWelcome = () => (
    <View style={styles.stepContent}>
      <View style={styles.welcomeIconContainer}>
        <Sparkles size={48} color={Colors.primary} />
      </View>
      <Text style={styles.stepTitle}>Build Your Program</Text>
      <Text style={styles.stepDescription}>
        We'll create a personalized rehab program based on your current abilities. This takes about 2 minutes.
      </Text>
      <View style={styles.welcomeFeatures}>
        {[
          { icon: <Timer size={20} color={Colors.teal} />, text: 'Set your current activity levels' },
          { icon: <Target size={20} color={Colors.primary} />, text: 'Get progressive weekly targets' },
          { icon: <Calendar size={20} color={Colors.amber} />, text: 'Built-in deload weeks for recovery' },
        ].map((feature, idx) => (
          <View key={idx} style={styles.featureRow}>
            <View style={styles.featureIcon}>{feature.icon}</View>
            <Text style={styles.featureText}>{feature.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderCardioSelection = () => (
    <ScrollView style={styles.stepScrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Cardio Activities</Text>
      <Text style={styles.stepDescription}>
        Select 1–2 time-based activities you'd like to include.
      </Text>
      <Text style={styles.selectionCount}>
        {selectedCardio.length}/2 selected
      </Text>

      <View style={styles.activityGrid}>
        {cardioPresets.map(activity => {
          const isSelected = selectedCardio.some(a => a.id === activity.id);
          const isDisabled = !isSelected && selectedCardio.length >= 2;
          return (
            <TouchableOpacity
              key={activity.id}
              style={[
                styles.activityCard,
                isSelected && styles.activityCardSelected,
                isDisabled && styles.activityCardDisabled,
              ]}
              onPress={() => toggleCardio(activity)}
              activeOpacity={0.7}
              disabled={isDisabled}
            >
              <View style={[styles.activityIconWrap, isSelected && styles.activityIconWrapSelected]}>
                {getIconForActivity(activity.icon, 22, isSelected ? Colors.textInverse : Colors.primary)}
              </View>
              <Text style={[styles.activityName, isSelected && styles.activityNameSelected]}>
                {activity.name}
              </Text>
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Check size={12} color={Colors.textInverse} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedCardio.filter(a => a.isCustom).map(custom => (
        <View key={custom.id} style={styles.customChip}>
          <Text style={styles.customChipText}>{custom.name}</Text>
          <TouchableOpacity onPress={() => setSelectedCardio(prev => prev.filter(a => a.id !== custom.id))}>
            <X size={16} color={Colors.coral} />
          </TouchableOpacity>
        </View>
      ))}

      {!showCustomCardio ? (
        <TouchableOpacity
          style={styles.addCustomButton}
          onPress={() => setShowCustomCardio(true)}
          disabled={selectedCardio.length >= 2}
        >
          <Plus size={18} color={selectedCardio.length >= 2 ? Colors.textTertiary : Colors.primary} />
          <Text style={[styles.addCustomText, selectedCardio.length >= 2 && { color: Colors.textTertiary }]}>
            Add custom activity
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.customInputRow}>
          <TextInput
            style={styles.customInput}
            value={customCardioName}
            onChangeText={setCustomCardioName}
            placeholder="Activity name..."
            placeholderTextColor={Colors.textTertiary}
            autoFocus
          />
          <TouchableOpacity style={styles.customAddBtn} onPress={addCustomCardio}>
            <Check size={18} color={Colors.textInverse} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.customCancelBtn} onPress={() => setShowCustomCardio(false)}>
            <X size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderCardioBaseline = () => (
    <ScrollView style={styles.stepScrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Current Ability</Text>
      <Text style={styles.stepDescription}>
        How long can you do each activity before needing to stop?
      </Text>

      {selectedCardio.map(activity => {
        const baseline = cardioBaselines.find(b => b.activityId === activity.id);
        const minutes = baseline?.durationMinutes ?? 10;
        return (
          <View key={activity.id} style={styles.baselineCard}>
            <View style={styles.baselineHeader}>
              {getIconForActivity(activity.icon, 20, Colors.primary)}
              <Text style={styles.baselineName}>{activity.name}</Text>
            </View>
            <View style={styles.baselineControls}>
              <TouchableOpacity
                style={styles.baselineStepBtn}
                onPress={() => updateCardioBaseline(activity.id, Math.max(1, minutes - 1))}
                activeOpacity={0.7}
              >
                <Text style={styles.baselineStepBtnText}>−</Text>
              </TouchableOpacity>
              <View style={styles.baselineDisplay}>
                <Text style={styles.baselineDisplayText}>{minutes}</Text>
                <Text style={styles.baselineDisplayUnit}>min</Text>
              </View>
              <TouchableOpacity
                style={styles.baselineStepBtn}
                onPress={() => updateCardioBaseline(activity.id, minutes + 1)}
                activeOpacity={0.7}
              >
                <Text style={styles.baselineStepBtnText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderResistanceSelection = () => (
    <ScrollView style={styles.stepScrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Resistance Exercises</Text>
      <Text style={styles.stepDescription}>
        Select 2–3 exercises. Mix upper and lower body for balance.
      </Text>
      <Text style={styles.selectionCount}>
        {selectedResistance.length}/3 selected
      </Text>

      <Text style={styles.categoryLabel}>Upper Body</Text>
      <View style={styles.activityGrid}>
        {resistanceUpperPresets.map(activity => {
          const isSelected = selectedResistance.some(a => a.id === activity.id);
          const isDisabled = !isSelected && selectedResistance.length >= 3;
          return (
            <TouchableOpacity
              key={activity.id}
              style={[
                styles.activityCard,
                isSelected && styles.activityCardSelected,
                isDisabled && styles.activityCardDisabled,
              ]}
              onPress={() => toggleResistance(activity)}
              activeOpacity={0.7}
              disabled={isDisabled}
            >
              <View style={[styles.activityIconWrap, isSelected && styles.activityIconWrapSelected]}>
                <Dumbbell size={22} color={isSelected ? Colors.textInverse : Colors.teal} />
              </View>
              <Text style={[styles.activityName, isSelected && styles.activityNameSelected]}>
                {activity.name}
              </Text>
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Check size={12} color={Colors.textInverse} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.categoryLabel}>Lower Body</Text>
      <View style={styles.activityGrid}>
        {resistanceLowerPresets.map(activity => {
          const isSelected = selectedResistance.some(a => a.id === activity.id);
          const isDisabled = !isSelected && selectedResistance.length >= 3;
          return (
            <TouchableOpacity
              key={activity.id}
              style={[
                styles.activityCard,
                isSelected && styles.activityCardSelected,
                isDisabled && styles.activityCardDisabled,
              ]}
              onPress={() => toggleResistance(activity)}
              activeOpacity={0.7}
              disabled={isDisabled}
            >
              <View style={[styles.activityIconWrap, isSelected && styles.activityIconWrapSelected]}>
                <Dumbbell size={22} color={isSelected ? Colors.textInverse : Colors.amber} />
              </View>
              <Text style={[styles.activityName, isSelected && styles.activityNameSelected]}>
                {activity.name}
              </Text>
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Check size={12} color={Colors.textInverse} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {selectedResistance.filter(a => a.isCustom).map(custom => (
        <View key={custom.id} style={styles.customChip}>
          <Text style={styles.customChipText}>{custom.name}</Text>
          <TouchableOpacity onPress={() => setSelectedResistance(prev => prev.filter(a => a.id !== custom.id))}>
            <X size={16} color={Colors.coral} />
          </TouchableOpacity>
        </View>
      ))}

      {!showCustomResistance ? (
        <TouchableOpacity
          style={styles.addCustomButton}
          onPress={() => setShowCustomResistance(true)}
          disabled={selectedResistance.length >= 3}
        >
          <Plus size={18} color={selectedResistance.length >= 3 ? Colors.textTertiary : Colors.teal} />
          <Text style={[styles.addCustomText, selectedResistance.length >= 3 && { color: Colors.textTertiary }]}>
            Add custom exercise
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.customInputRow}>
          <TextInput
            style={styles.customInput}
            value={customResistanceName}
            onChangeText={setCustomResistanceName}
            placeholder="Exercise name..."
            placeholderTextColor={Colors.textTertiary}
            autoFocus
          />
          <TouchableOpacity style={[styles.customAddBtn, { backgroundColor: Colors.teal }]} onPress={() => addCustomResistance('resistance-upper')}>
            <Text style={styles.customAddLabel}>Upper</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.customAddBtn, { backgroundColor: Colors.amber }]} onPress={() => addCustomResistance('resistance-lower')}>
            <Text style={styles.customAddLabel}>Lower</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.customCancelBtn} onPress={() => setShowCustomResistance(false)}>
            <X size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderResistanceBaseline = () => (
    <ScrollView style={styles.stepScrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Current Strength</Text>
      <Text style={styles.stepDescription}>
        Estimate what you can currently do for each exercise.
      </Text>

      {selectedResistance.map(activity => {
        const baseline = resistanceBaselines.find(b => b.activityId === activity.id);
        const sets = baseline?.sets ?? 3;
        const reps = baseline?.reps ?? 10;
        const weight = baseline?.weight ?? 20;

        return (
          <View key={activity.id} style={styles.baselineCard}>
            <View style={styles.baselineHeader}>
              <Dumbbell size={20} color={Colors.teal} />
              <Text style={styles.baselineName}>{activity.name}</Text>
            </View>

            <View style={styles.resistanceRow}>
              <View style={styles.resistanceField}>
                <Text style={styles.resistanceLabel}>Sets</Text>
                <View style={styles.numberPicker}>
                  <TouchableOpacity
                    style={styles.pickerBtn}
                    onPress={() => updateResistanceBaseline(activity.id, 'sets', sets + 1)}
                  >
                    <ChevronUp size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.pickerValue}>{sets}</Text>
                  <TouchableOpacity
                    style={styles.pickerBtn}
                    onPress={() => updateResistanceBaseline(activity.id, 'sets', Math.max(1, sets - 1))}
                  >
                    <ChevronDown size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.resistanceField}>
                <Text style={styles.resistanceLabel}>Reps</Text>
                <View style={styles.numberPicker}>
                  <TouchableOpacity
                    style={styles.pickerBtn}
                    onPress={() => updateResistanceBaseline(activity.id, 'reps', reps + 1)}
                  >
                    <ChevronUp size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <Text style={styles.pickerValue}>{reps}</Text>
                  <TouchableOpacity
                    style={styles.pickerBtn}
                    onPress={() => updateResistanceBaseline(activity.id, 'reps', Math.max(1, reps - 1))}
                  >
                    <ChevronDown size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.resistanceField}>
                <Text style={styles.resistanceLabel}>Weight</Text>
                <View style={styles.numberPicker}>
                  <TouchableOpacity
                    style={styles.pickerBtn}
                    onPress={() => updateResistanceBaseline(activity.id, 'weight', weight + 5)}
                  >
                    <ChevronUp size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                  <View style={styles.weightValueRow}>
                    <Text style={styles.pickerValue}>{weight}</Text>
                    <Text style={styles.unitLabel}>lbs</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.pickerBtn}
                    onPress={() => updateResistanceBaseline(activity.id, 'weight', Math.max(0, weight - 5))}
                  >
                    <ChevronDown size={16} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        );
      })}

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderProgramLength = () => {
    const options = [5, 10, 15, 20];
    const descriptions: Record<number, string> = {
      5: 'Quick intro · 1 deload',
      10: 'Standard program · 2 deloads',
      15: 'Extended plan · 3 deloads',
      20: 'Full journey · 4 deloads',
    };

    return (
      <View style={styles.stepContent}>
        <Text style={styles.stepTitle}>Program Length</Text>
        <Text style={styles.stepDescription}>
          Choose how many weeks you'd like to train. Frequency starts at 3 days/week and builds up over time.
        </Text>

        <View style={styles.weekOptions}>
          {options.map(weeks => (
            <TouchableOpacity
              key={weeks}
              style={[
                styles.weekOption,
                programWeeks === weeks && styles.weekOptionSelected,
              ]}
              onPress={() => setProgramWeeks(weeks)}
              activeOpacity={0.7}
            >
              <Text style={[styles.weekOptionNumber, programWeeks === weeks && styles.weekOptionNumberSelected]}>
                {weeks}
              </Text>
              <Text style={[styles.weekOptionLabel, programWeeks === weeks && styles.weekOptionLabelSelected]}>
                weeks
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.programInfo}>
          <Text style={styles.programInfoText}>
            {descriptions[programWeeks] ?? `${Math.floor(programWeeks / 5)} deload weeks`}
          </Text>
        </View>

        <View style={[styles.programInfo, { marginTop: 10, borderLeftColor: Colors.teal }]}>
          <Text style={[styles.programInfoText, { color: Colors.teal }]}>
            Progression: frequency → volume → intensity
          </Text>
        </View>
      </View>
    );
  };

  const renderSummary = () => (
    <ScrollView style={styles.stepScrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Your Program</Text>
      <Text style={styles.stepDescription}>
        Here's a summary of your {programWeeks}-week plan.
      </Text>

      <View style={styles.summarySection}>
        <Text style={styles.summaryLabel}>Cardio Activities</Text>
        {cardioBaselines.map(b => (
          <View key={b.activityId} style={styles.summaryItem}>
            <Text style={styles.summaryItemName}>{b.activityName}</Text>
            <Text style={styles.summaryItemDetail}>Starting at {b.durationMinutes} min</Text>
          </View>
        ))}
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryLabel}>Resistance Exercises</Text>
        {resistanceBaselines.map(b => (
          <View key={b.activityId} style={styles.summaryItem}>
            <Text style={styles.summaryItemName}>{b.activityName}</Text>
            <Text style={styles.summaryItemDetail}>
              {b.sets} sets × {b.reps} reps @ {b.weight} lbs
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.summarySection}>
        <Text style={styles.summaryLabel}>Schedule</Text>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemName}>{programWeeks} weeks total</Text>
          <Text style={styles.summaryItemDetail}>
            Starting at 3 days/week, building up to 7
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemName}>Graded exposure</Text>
          <Text style={styles.summaryItemDetail}>
            Frequency first → then volume → then intensity
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemName}>Pain-gated progression</Text>
          <Text style={styles.summaryItemDetail}>
            Holds back if sensitivity is elevated
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryItemName}>Deload every 5th week</Text>
          <Text style={styles.summaryItemDetail}>
            Reduced volume and intensity for recovery
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.progressBarContainer}>
        <View style={[styles.progressBar, { width: `${progressWidth}%` }]} />
      </View>

      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navButton} onPress={goBack} activeOpacity={0.7}>
          <ArrowLeft size={20} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepIndicator}>
          {step + 1} of {TOTAL_STEPS}
        </Text>
        {step > 0 && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Text style={styles.skipText}>Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.View
        style={[
          styles.animatedContent,
          { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
        ]}
      >
        {renderStep()}
      </Animated.View>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {step === TOTAL_STEPS - 1 ? (
          <TouchableOpacity
            style={[styles.primaryButton, styles.finishButton]}
            onPress={handleFinish}
            activeOpacity={0.8}
          >
            <Sparkles size={20} color={Colors.textInverse} />
            <Text style={styles.primaryButtonText}>Start Program</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryButton, !canProceed() && styles.primaryButtonDisabled]}
            onPress={goNext}
            activeOpacity={0.8}
            disabled={!canProceed()}
          >
            <Text style={styles.primaryButtonText}>Continue</Text>
            <ArrowRight size={18} color={Colors.textInverse} />
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: Colors.borderLight,
  },
  progressBar: {
    height: 3,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  stepIndicator: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  skipButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '500' as const,
  },
  animatedContent: {
    flex: 1,
  },
  stepContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  stepScrollContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    color: Colors.text,
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  welcomeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.primary + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  welcomeFeatures: {
    gap: 16,
    marginTop: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 14,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  selectionCount: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.primary,
    marginBottom: 16,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 10,
    marginTop: 20,
  },
  activityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  activityCard: {
    width: '47%' as const,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  activityCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  activityCardDisabled: {
    opacity: 0.4,
  },
  activityIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  activityIconWrapSelected: {
    backgroundColor: Colors.primary,
  },
  activityName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
    textAlign: 'center',
  },
  activityNameSelected: {
    color: Colors.primary,
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  customChipText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  addCustomText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  customInput: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    paddingHorizontal: 14,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  customAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customAddLabel: {
    fontSize: 11,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
  customCancelBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  baselineCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  baselineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  baselineName: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  baselineControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  baselineStepBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  baselineStepBtnText: {
    fontSize: 22,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  baselineDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    backgroundColor: Colors.primary + '10',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 8,
    gap: 4,
  },
  baselineDisplayText: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  baselineDisplayUnit: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.primary,
  },
  resistanceRow: {
    flexDirection: 'row',
    gap: 12,
  },
  resistanceField: {
    flex: 1,
    alignItems: 'center',
  },
  resistanceLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  numberPicker: {
    alignItems: 'center',
    gap: 4,
  },
  pickerBtn: {
    width: 36,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
    paddingVertical: 4,
  },
  unitLabel: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginLeft: 2,
  },
  weightValueRow: {
    flexDirection: 'row' as const,
    alignItems: 'baseline',
    gap: 3,
    paddingVertical: 4,
  },
  weekOptions: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  weekOption: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  weekOptionSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '08',
  },
  weekOptionNumber: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  weekOptionNumberSelected: {
    color: Colors.primary,
  },
  weekOptionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
  },
  weekOptionLabelSelected: {
    color: Colors.primary,
  },
  recommendedBadge: {
    backgroundColor: Colors.teal + '15',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginTop: 6,
  },
  recommendedText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: Colors.teal,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  programInfo: {
    backgroundColor: Colors.primary + '08',
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  programInfoText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500' as const,
  },
  summarySection: {
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  summaryItem: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  summaryItemName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  summaryItemDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.background,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonDisabled: {
    backgroundColor: Colors.textTertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  finishButton: {
    backgroundColor: Colors.teal,
    shadowColor: Colors.teal,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
