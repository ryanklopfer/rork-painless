import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  MessageSquare,
  Bug,
  Lightbulb,
  Star,
  Send,
  CheckCircle2,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

type FeedbackType = 'general' | 'bug' | 'feature';

interface FeedbackEntry {
  id: string;
  type: FeedbackType;
  rating: number;
  message: string;
  createdAt: string;
}

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: typeof MessageSquare; color: string }[] = [
  { value: 'general', label: 'General', icon: MessageSquare, color: Colors.primary },
  { value: 'bug', label: 'Bug Report', icon: Bug, color: Colors.coral },
  { value: 'feature', label: 'Feature Idea', icon: Lightbulb, color: Colors.amber },
];

const PLACEHOLDER_MAP: Record<FeedbackType, string> = {
  general: 'Tell us what you think about the app...',
  bug: 'Describe the issue you encountered. What did you expect to happen?',
  feature: 'Describe the feature you\'d love to see...',
};

export default function FeedbackScreen() {
  const router = useRouter();
  const [type, setType] = useState<FeedbackType>('general');
  const [rating, setRating] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const scaleAnims = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(1))
  ).current;
  const successScale = useRef(new Animated.Value(0)).current;
  const successOpacity = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(1)).current;

  const handleStarPress = useCallback((index: number) => {
    const newRating = index + 1;
    setRating(newRating);

    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 1.4,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnims[index], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnims]);

  const handleSubmit = useCallback(async () => {
    if (!message.trim()) {
      Alert.alert('Missing Feedback', 'Please write a message before submitting.');
      return;
    }
    if (rating === 0) {
      Alert.alert('Missing Rating', 'Please tap a star to rate your experience.');
      return;
    }

    setIsSubmitting(true);

    try {
      const entry: FeedbackEntry = {
        id: Date.now().toString(),
        type,
        rating,
        message: message.trim(),
        createdAt: new Date().toISOString(),
      };

      const stored = await AsyncStorage.getItem('user_feedback');
      const existing: FeedbackEntry[] = stored ? JSON.parse(stored) : [];
      existing.push(entry);
      await AsyncStorage.setItem('user_feedback', JSON.stringify(existing));

      console.log('[Feedback] Saved feedback:', entry);

      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Animated.timing(formOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setSubmitted(true);
        Animated.parallel([
          Animated.spring(successScale, {
            toValue: 1,
            friction: 5,
            tension: 80,
            useNativeDriver: true,
          }),
          Animated.timing(successOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } catch (error) {
      console.error('[Feedback] Error saving feedback:', error);
      Alert.alert('Error', 'Could not save your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [type, rating, message, formOpacity, successScale, successOpacity]);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  const canSubmit = message.trim().length > 0 && rating > 0;

  if (submitted) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.closeRow}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              activeOpacity={0.7}
              testID="feedback-close"
            >
              <X color={Colors.textSecondary} size={22} />
            </TouchableOpacity>
          </View>
          <Animated.View
            style={[
              styles.successContainer,
              {
                transform: [{ scale: successScale }],
                opacity: successOpacity,
              },
            ]}
          >
            <View style={styles.successIconWrap}>
              <CheckCircle2 color={Colors.teal} size={56} />
            </View>
            <Text style={styles.successTitle}>Thanks for your feedback!</Text>
            <Text style={styles.successSub}>
              Your input helps us make RehabFlow better for everyone.
            </Text>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={handleClose}
              activeOpacity={0.7}
              testID="feedback-done"
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.flex}
        >
          <Animated.View style={[styles.flex, { opacity: formOpacity }]}>
            <View style={styles.topBar}>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                activeOpacity={0.7}
                testID="feedback-close-form"
              >
                <X color={Colors.textSecondary} size={22} />
              </TouchableOpacity>
              <Text style={styles.topBarTitle}>Send Feedback</Text>
              <View style={styles.closeBtnPlaceholder} />
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.sectionLabel}>What kind of feedback?</Text>
              <View style={styles.typeRow}>
                {FEEDBACK_TYPES.map((item) => {
                  const Icon = item.icon;
                  const isActive = type === item.value;
                  return (
                    <TouchableOpacity
                      key={item.value}
                      style={[
                        styles.typeChip,
                        isActive && { backgroundColor: item.color + '18', borderColor: item.color },
                      ]}
                      onPress={() => setType(item.value)}
                      activeOpacity={0.7}
                      testID={`feedback-type-${item.value}`}
                    >
                      <Icon
                        color={isActive ? item.color : Colors.textTertiary}
                        size={18}
                      />
                      <Text
                        style={[
                          styles.typeChipText,
                          isActive && { color: item.color },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.sectionLabel}>Rate your experience</Text>
              <View style={styles.starsRow}>
                {Array.from({ length: 5 }).map((_, i) => {
                  const filled = i < rating;
                  return (
                    <TouchableOpacity
                      key={i}
                      onPress={() => handleStarPress(i)}
                      activeOpacity={0.6}
                      testID={`feedback-star-${i}`}
                    >
                      <Animated.View
                        style={{ transform: [{ scale: scaleAnims[i] }] }}
                      >
                        <Star
                          color={filled ? Colors.amber : Colors.borderLight}
                          fill={filled ? Colors.amber : 'transparent'}
                          size={36}
                        />
                      </Animated.View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {rating > 0 && (
                <Text style={styles.ratingHint}>
                  {rating <= 2 ? "We're sorry to hear that" : rating <= 3 ? 'Thanks for being honest' : rating === 4 ? 'Glad you like it!' : 'Awesome, thank you!'}
                </Text>
              )}

              <Text style={styles.sectionLabel}>Your message</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.messageInput}
                  value={message}
                  onChangeText={setMessage}
                  placeholder={PLACEHOLDER_MAP[type]}
                  placeholderTextColor={Colors.textTertiary}
                  multiline
                  maxLength={1000}
                  textAlignVertical="top"
                  testID="feedback-message"
                />
                <Text style={styles.charCount}>{message.length}/1000</Text>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!canSubmit || isSubmitting}
                activeOpacity={0.7}
                testID="feedback-submit"
              >
                <Send color={Colors.textInverse} size={18} />
                <Text style={styles.submitBtnText}>
                  {isSubmitting ? 'Sending...' : 'Submit Feedback'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  safeArea: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnPlaceholder: {
    width: 36,
  },
  closeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textTertiary,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.7,
    marginBottom: 12,
    marginTop: 8,
  },
  typeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
  },
  typeChipText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    marginBottom: 4,
  },
  ratingHint: {
    textAlign: 'center' as const,
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
    fontStyle: 'italic' as const,
  },
  inputWrap: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginBottom: 24,
    overflow: 'hidden',
  },
  messageInput: {
    minHeight: 140,
    maxHeight: 220,
    padding: 16,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 22,
  },
  charCount: {
    textAlign: 'right' as const,
    fontSize: 11,
    color: Colors.textTertiary,
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.textTertiary,
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.textInverse,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.teal + '12',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 10,
    textAlign: 'center' as const,
  },
  successSub: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 36,
  },
  doneBtn: {
    backgroundColor: Colors.teal,
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 12,
  },
  doneBtnText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textInverse,
  },
});
