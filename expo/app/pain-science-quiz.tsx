import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { X, CheckCircle, XCircle, RotateCcw, Brain, Trophy } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { painScienceQuiz, QuizQuestion } from '@/mocks/quizData';

type AnswerState = 'unanswered' | 'correct' | 'incorrect';

function QuestionCard({
  question,
  index,
  onAnswer,
  answerState,
  selectedAnswer,
}: {
  question: QuizQuestion;
  index: number;
  onAnswer: (answer: boolean) => void;
  answerState: AnswerState;
  selectedAnswer: boolean | null;
}) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const scaleTrue = useRef(new Animated.Value(1)).current;
  const scaleFalse = useRef(new Animated.Value(1)).current;

  const animateResult = useCallback((correct: boolean) => {
    if (!correct) {
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
      ]).start();
    }
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
  }, [fadeAnim, shakeAnim]);

  const handleAnswer = useCallback((answer: boolean) => {
    if (answerState !== 'unanswered') return;
    const correct = answer === question.answer;
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(correct ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Heavy);
    }
    onAnswer(answer);
    animateResult(correct);
  }, [answerState, question.answer, onAnswer, animateResult]);

  const handlePressInTrue = useCallback(() => {
    if (answerState !== 'unanswered') return;
    Animated.spring(scaleTrue, { toValue: 0.95, useNativeDriver: true }).start();
  }, [scaleTrue, answerState]);

  const handlePressOutTrue = useCallback(() => {
    Animated.spring(scaleTrue, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scaleTrue]);

  const handlePressInFalse = useCallback(() => {
    if (answerState !== 'unanswered') return;
    Animated.spring(scaleFalse, { toValue: 0.95, useNativeDriver: true }).start();
  }, [scaleFalse, answerState]);

  const handlePressOutFalse = useCallback(() => {
    Animated.spring(scaleFalse, { toValue: 1, friction: 4, useNativeDriver: true }).start();
  }, [scaleFalse]);

  const getTrueStyle = () => {
    if (answerState === 'unanswered') return {};
    if (question.answer === true) return styles.correctButton;
    if (selectedAnswer === true) return styles.incorrectButton;
    return styles.disabledButton;
  };

  const getFalseStyle = () => {
    if (answerState === 'unanswered') return {};
    if (question.answer === false) return styles.correctButton;
    if (selectedAnswer === false) return styles.incorrectButton;
    return styles.disabledButton;
  };

  const getTrueTextStyle = () => {
    if (answerState === 'unanswered') return {};
    if (question.answer === true) return styles.correctButtonText;
    if (selectedAnswer === true) return styles.incorrectButtonText;
    return styles.disabledButtonText;
  };

  const getFalseTextStyle = () => {
    if (answerState === 'unanswered') return {};
    if (question.answer === false) return styles.correctButtonText;
    if (selectedAnswer === false) return styles.incorrectButtonText;
    return styles.disabledButtonText;
  };

  return (
    <Animated.View style={[styles.questionCard, { transform: [{ translateX: shakeAnim }] }]}>
      <View style={styles.questionNumber}>
        <Text style={styles.questionNumberText}>{index + 1}</Text>
      </View>
      <Text style={styles.questionText}>{question.statement}</Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleAnswer(true)}
          onPressIn={handlePressInTrue}
          onPressOut={handlePressOutTrue}
          disabled={answerState !== 'unanswered'}
        >
          <Animated.View style={[styles.answerButton, getTrueStyle(), { transform: [{ scale: scaleTrue }] }]}>
            <CheckCircle size={18} color={answerState !== 'unanswered' && question.answer === true ? '#fff' : answerState !== 'unanswered' && selectedAnswer === true ? '#fff' : Colors.green} />
            <Text style={[styles.answerButtonText, getTrueTextStyle()]}>True</Text>
          </Animated.View>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => handleAnswer(false)}
          onPressIn={handlePressInFalse}
          onPressOut={handlePressOutFalse}
          disabled={answerState !== 'unanswered'}
        >
          <Animated.View style={[styles.answerButton, getFalseStyle(), { transform: [{ scale: scaleFalse }] }]}>
            <XCircle size={18} color={answerState !== 'unanswered' && question.answer === false ? '#fff' : answerState !== 'unanswered' && selectedAnswer === false ? '#fff' : Colors.coral} />
            <Text style={[styles.answerButtonText, getFalseTextStyle()]}>False</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {answerState !== 'unanswered' && (
        <Animated.View style={[
          styles.explanationBox,
          answerState === 'correct' ? styles.explanationCorrect : styles.explanationIncorrect,
          { opacity: fadeAnim },
        ]}>
          <View style={styles.explanationHeader}>
            {answerState === 'correct' ? (
              <CheckCircle size={16} color={Colors.green} />
            ) : (
              <XCircle size={16} color={Colors.coral} />
            )}
            <Text style={[
              styles.explanationLabel,
              { color: answerState === 'correct' ? Colors.green : Colors.coral },
            ]}>
              {answerState === 'correct' ? 'Correct!' : 'Not quite'}
            </Text>
          </View>
          <Text style={styles.explanationText}>{question.explanation}</Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function PainScienceQuizScreen() {
  const insets = useSafeAreaInsets();
  const [answers, setAnswers] = useState<Map<number, { state: AnswerState; selected: boolean }>>(new Map());
  const scrollRef = useRef<ScrollView>(null);
  const scoreAnim = useRef(new Animated.Value(0)).current;

  const totalAnswered = answers.size;
  const totalCorrect = Array.from(answers.values()).filter(a => a.state === 'correct').length;
  const quizComplete = totalAnswered === painScienceQuiz.length;

  const handleAnswer = useCallback((questionId: number, correctAnswer: boolean, userAnswer: boolean) => {
    const isCorrect = userAnswer === correctAnswer;
    setAnswers(prev => {
      const next = new Map(prev);
      next.set(questionId, { state: isCorrect ? 'correct' : 'incorrect', selected: userAnswer });
      return next;
    });

    if (totalAnswered + 1 === painScienceQuiz.length) {
      Animated.spring(scoreAnim, { toValue: 1, useNativeDriver: true, delay: 400 }).start();
      if (Platform.OS !== 'web') {
        setTimeout(() => {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }, 500);
      }
    }
  }, [totalAnswered, scoreAnim]);

  const handleReset = useCallback(() => {
    setAnswers(new Map());
    scoreAnim.setValue(0);
    scrollRef.current?.scrollTo({ y: 0, animated: true });
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }, [scoreAnim]);

  const progressWidth = (totalAnswered / painScienceQuiz.length) * 100;

  const getScoreColor = () => {
    const pct = totalCorrect / painScienceQuiz.length;
    if (pct >= 0.8) return Colors.green;
    if (pct >= 0.6) return Colors.amber;
    return Colors.coral;
  };

  const getScoreMessage = () => {
    const pct = totalCorrect / painScienceQuiz.length;
    if (pct === 1) return 'Perfect score! You really understand pain science.';
    if (pct >= 0.8) return 'Great job! You have a solid understanding.';
    if (pct >= 0.6) return 'Good effort! Review the explanations to learn more.';
    return 'Keep learning! Read through the Pain Science cards and try again.';
  };

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Brain size={18} color={Colors.primary} />
          <Text style={styles.topTitle}>Pain Science Quiz</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${progressWidth}%` }]} />
        </View>
        <Text style={styles.progressText}>{totalAnswered}/{painScienceQuiz.length}</Text>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Test Your Knowledge</Text>
          <Text style={styles.introDesc}>
            10 true/false questions based on modern pain science education. Tap True or False for each statement.
          </Text>
        </View>

        {painScienceQuiz.map((q, i) => {
          const answer = answers.get(q.id);
          return (
            <QuestionCard
              key={q.id}
              question={q}
              index={i}
              answerState={answer?.state ?? 'unanswered'}
              selectedAnswer={answer?.selected ?? null}
              onAnswer={(userAnswer) => handleAnswer(q.id, q.answer, userAnswer)}
            />
          );
        })}

        {quizComplete && (
          <Animated.View style={[
            styles.scoreCard,
            { transform: [{ scale: scoreAnim }] },
          ]}>
            <View style={[styles.scoreBadge, { backgroundColor: getScoreColor() + '18' }]}>
              <Trophy size={28} color={getScoreColor()} />
            </View>
            <Text style={styles.scoreTitle}>Quiz Complete!</Text>
            <View style={styles.scoreRow}>
              <Text style={[styles.scoreNumber, { color: getScoreColor() }]}>{totalCorrect}</Text>
              <Text style={styles.scoreOf}>/ {painScienceQuiz.length}</Text>
            </View>
            <Text style={styles.scoreMessage}>{getScoreMessage()}</Text>

            <TouchableOpacity style={styles.retakeButton} onPress={handleReset} activeOpacity={0.7}>
              <RotateCcw size={16} color={Colors.primary} />
              <Text style={styles.retakeText}>Retake Quiz</Text>
            </TouchableOpacity>
          </Animated.View>
        )}
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
  topBarCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topTitle: {
    fontSize: 17,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 10,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
    minWidth: 36,
    textAlign: 'right' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  introCard: {
    backgroundColor: Colors.primary + '0C',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  introTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  introDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  questionCard: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  questionNumberText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  questionText: {
    fontSize: 15,
    fontWeight: '500' as const,
    color: Colors.text,
    lineHeight: 22,
    marginBottom: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  answerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.surfaceSecondary,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  answerButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  correctButton: {
    backgroundColor: Colors.green,
    borderColor: Colors.green,
  },
  incorrectButton: {
    backgroundColor: Colors.coral,
    borderColor: Colors.coral,
  },
  disabledButton: {
    backgroundColor: Colors.surfaceSecondary,
    borderColor: Colors.border,
    opacity: 0.5,
  },
  correctButtonText: {
    color: '#fff',
  },
  incorrectButtonText: {
    color: '#fff',
  },
  disabledButtonText: {
    color: Colors.textTertiary,
  },
  explanationBox: {
    marginTop: 14,
    padding: 14,
    borderRadius: 10,
  },
  explanationCorrect: {
    backgroundColor: Colors.green + '0D',
    borderWidth: 1,
    borderColor: Colors.green + '25',
  },
  explanationIncorrect: {
    backgroundColor: Colors.coral + '0D',
    borderWidth: 1,
    borderColor: Colors.coral + '25',
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  explanationLabel: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  explanationText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  scoreCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: 28,
    marginTop: 8,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: Colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  scoreBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  scoreTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 40,
    fontWeight: '800' as const,
  },
  scoreOf: {
    fontSize: 20,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  scoreMessage: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.primary + '12',
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
  },
  retakeText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
});
