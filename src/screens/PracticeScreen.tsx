import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { BottomNav } from '../components/BottomNav';
import { useUserProgress } from '../services/UserProgressService';
import { AppColors } from '../theme';
import lessonsData from '../data/lessons.json';
import { Lesson } from '../types';
import { ExerciseModal, DailyExerciseType } from '../components/ExerciseModal';
import { aiPracticeService } from '../services/AIPracticeService';
import { AIExercise } from '../services/AIPracticeService';
import { calculateXP } from '../lib/engines/xpEngine';

type PracticeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Practice'>;
};

const lessons = lessonsData as unknown as Lesson[];

const FALLBACK_DAILY_EXERCISE: AIExercise = {
  question: 'Translate to Spanish: Good night',
  answer: 'Buenas noches',
  type: 'typing',
  hint: "It's a common evening greeting.",
  difficulty: 1,
  category: 'greetings',
};

export const PracticeScreen: React.FC<PracticeScreenProps> = ({ navigation }) => {
  const userProgress = useUserProgress();
  const [dailyExercise, setDailyExercise] = useState<AIExercise | null>(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [loadingExercise, setLoadingExercise] = useState(false);
  const [loadingLessonId, setLoadingLessonId] = useState<string | null>(null);
  const [targetLanguage] = useState('Spanish');

  // Lesson Mode State
  const [activeLessonExercises, setActiveLessonExercises] = useState<AIExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  const generateDailyExercise = useCallback(async () => {
    setLoadingExercise(true);
    try {
      const lang = userProgress.targetLanguage || targetLanguage;
      const exercise = await aiPracticeService.generateExercise('typing', lang);
      setDailyExercise(exercise);
    } catch (error) {
      console.error('Failed to generate daily exercise:', error);
      setDailyExercise({
        ...FALLBACK_DAILY_EXERCISE,
        question: `Translate to ${targetLanguage}: Good night`,
        answer: targetLanguage === 'Spanish' ? 'Buenas noches' : 'Good night',
      });
    } finally {
      setExerciseModalOpen(true);
      setLoadingExercise(false);
    };
  }, [userProgress.targetLanguage, targetLanguage]);



  const handleExerciseSkip = () => {
    // Logic similar to submit but no XP
    if (currentLessonId && activeLessonExercises.length > 0) {
      const nextIndex = currentExerciseIndex + 1;

      if (nextIndex < activeLessonExercises.length) {
        setCurrentExerciseIndex(nextIndex);
        setDailyExercise(activeLessonExercises[nextIndex]);
      } else {
        // Lesson Complete (with skipped exercises)
        setExerciseModalOpen(false);
        // Maybe give less reward or just complete
        userProgress.completeLesson(currentLessonId);
        Alert.alert("Lesson Complete!", "You've finished the lesson.");

        setCurrentLessonId(null);
        setActiveLessonExercises([]);
        setCurrentExerciseIndex(0);
      }
    } else {
      setExerciseModalOpen(false);
    }
  };

  const handleExerciseSubmit = async (answer: string, isCorrect: boolean, timeSpent: number) => {
    // 1. Award XP for the single exercise
    if (isCorrect && dailyExercise) {
      const xpResult = calculateXP({
        difficulty: dailyExercise.difficulty || 1,
        isCorrect: true,
        timeSpentMs: timeSpent,
        currentStreak: userProgress.streak,
      });
      await userProgress.updateXP(xpResult.totalXP);
    }

    // 2. Check if we are in Lesson Mode
    if (currentLessonId && activeLessonExercises.length > 0) {
      if (isCorrect) {
        const nextIndex = currentExerciseIndex + 1;

        if (nextIndex < activeLessonExercises.length) {
          // Determine next exercise
          // Small delay to let modal close animation finish if needed, or just specific logic
          // Actually the modal stays open? The current implementation closes it on submit. 
          // We want to KEEP it open for the next one, OR re-open it.
          // The current ExerciseModal calls onSubmit then handleClose after 2s delay.
          // If we want a continuous flow, we might need to update state immediately.

          // But `handleClose` in modal is called inside the timeout.
          // So the modal WILL close. We should wait for it to close then open next?
          // Or updates state so when it re-opens...

          setCurrentExerciseIndex(nextIndex);
          setDailyExercise(activeLessonExercises[nextIndex]);

          // Re-open modal after a short delay if it closed
          setTimeout(() => setExerciseModalOpen(true), 500);
        } else {
          // Lesson Complete!
          setExerciseModalOpen(false);
          await userProgress.completeLesson(currentLessonId);
          Alert.alert("Lesson Complete! 🎉", "You've mastered this lesson and earned bonus XP!");

          // Reset Lesson Mode
          setCurrentLessonId(null);
          setActiveLessonExercises([]);
          setCurrentExerciseIndex(0);
        }
      } else {
        // Incorrect - usually modal stays open or gives feedback. 
        // In current Modal logic, it closes after 2s even if correct? 
        // checking Modal code: if(correct) { setTimeout(..., 2000) } 
        // If incorrect, it just stays on feedback?
        // "handleTryAgain" resets, "Skip" closes.
        // If user skips, we probably should move to next or fail lesson?
        // For now, let's assume they retry until correct or skip.
        // If skip (handleClose called directly w/o submit), we might need to handle 'skip' in modal props?
        // But here we are in onSubmit. If they formatted current Modal correctly, onSubmit is only called on SUCCESS?
        // Modal code: onSubmit called in handleTextSubmit if correct.
        // If skip, onSubmit is NOT called. onClose is called.

        // So if we are here, it IS correct.
      }
    } else {
      // Daily Exercise Mode - just close (already closed by modal logic)
      setExerciseModalOpen(false);
    }
  };

  const handleLessonPress = async (lesson: Lesson) => {
    console.log('Starting lesson:', lesson.title);

    if (!lesson.exercises || Object.keys(lesson.exercises).length === 0) {
      Alert.alert("Available Soon", "This lesson content is coming soon!");
      return;
    }

    const currentLang = userProgress.targetLanguage || targetLanguage;
    const lessonExercises = lesson.exercises[currentLang] || lesson.exercises['Spanish'] || [];

    if (lessonExercises.length === 0) {
      Alert.alert("Not Available", "This lesson is not available in your target language.");
      return;
    }

    // Map properties correctly inside the modal wrapper
    const mappedExercises = lessonExercises.map((ex) => ({
      ...ex,
      category: 'lesson',
      difficulty: lesson.difficulty,
    }));

    setActiveLessonExercises(mappedExercises);
    setCurrentExerciseIndex(0);
    setCurrentLessonId(lesson.id);

    // Start first exercise
    setDailyExercise(mappedExercises[0]);
    setExerciseModalOpen(true);
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty === 1) return '#10B981';
    if (difficulty === 2) return '#3B82F6';
    if (difficulty === 3) return '#F59E0B';
    if (difficulty === 4) return '#EF4444';
    return '#8B5CF6';
  };

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
    return labels[difficulty] || 'Unknown';
  };

  const renderExerciseTypeButtons = () => {
    const exerciseTypes: DailyExerciseType[] = ['typing', 'tts', 'stt', 'written'];

    return (
      <View style={styles.exerciseTypesContainer}>
        <Text style={styles.exerciseTypesTitle}>Practice by Type</Text>
        <View style={styles.exerciseTypesRow}>
          {exerciseTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.exerciseTypeButton}
              onPress={async () => {
                setLoadingExercise(true);
                try {
                  const lang = userProgress.targetLanguage || targetLanguage;
                  const exercise = await aiPracticeService.generateExercise(type, lang);
                  setDailyExercise(exercise);
                  setExerciseModalOpen(true);
                } catch (error) {
                  console.error('Failed to generate exercise:', error);
                } finally {
                  setLoadingExercise(false);
                }
              }}
            >
              <Text style={styles.exerciseTypeIcon}>
                {type === 'typing' ? '🔥' : type === 'tts' ? '🗣️' : type === 'stt' ? '🎤' : '✍️'}
              </Text>
              <Text style={styles.exerciseTypeLabel}>
                {type === 'typing' ? 'Typing' : type === 'tts' ? 'Speaking' : type === 'stt' ? 'Listening' : 'Writing'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const renderConversationPracticeCard = () => (
    <View style={styles.conversationCardContainer}>
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => navigation.navigate('ConversationPractice')}
      >
        <View style={styles.conversationIconContainer}>
          <Text style={styles.conversationIcon}>💬</Text>
        </View>
        <View style={styles.conversationInfo}>
          <Text style={styles.conversationTitle}>Conversation Scenarios</Text>
          <Text style={styles.conversationSubtitle}>
            Practice real-world situations with an AI roleplayer
          </Text>
        </View>
        <Text style={styles.conversationArrow}>→</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practice</Text>
        <View style={styles.headerRight}>
          <View style={styles.statContainer}>
            <Text>⚡</Text>
            <Text style={styles.statText}>{userProgress.xp}</Text>
          </View>
        </View>
      </View>

      <View style={styles.dailyExerciseButtonContainer}>
        <TouchableOpacity
          style={[styles.dailyExerciseButton, loadingExercise && styles.dailyExerciseButtonDisabled]}
          onPress={generateDailyExercise}
          disabled={loadingExercise}
        >
          <Text style={styles.dailyExerciseButtonText}>
            {loadingExercise ? 'Generating with AI...' : 'Start AI Practice Session'}
          </Text>
        </TouchableOpacity>
      </View>

      {renderExerciseTypeButtons()}
      {renderConversationPracticeCard()}

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Available Lessons</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a lesson to start practicing
          </Text>

          {lessons.map((lesson) => {
            const isCompleted = userProgress.completedLessons.includes(lesson.id);
            const isLocked = lesson.prerequisites.some(
              (prereq) => !userProgress.completedLessons.includes(prereq)
            );

            return (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonCard,
                  isLocked && styles.lessonCardLocked,
                ]}
                onPress={() => !isLocked && handleLessonPress(lesson)}
                disabled={isLocked}
              >
                <View style={styles.lessonHeader}>
                  <View style={styles.lessonIconContainer}>
                    <Text style={styles.lessonIcon}>
                      {isCompleted ? '✅' : isLocked ? '🔒' : '📚'}
                    </Text>
                  </View>
                  <View style={styles.lessonInfo}>
                    <Text
                      style={[
                        styles.lessonTitle,
                        isLocked && styles.lessonTitleLocked,
                      ]}
                    >
                      {lesson.title} {loadingLessonId === lesson.id && " (Generating...)"}
                    </Text>
                    <Text style={styles.lessonDescription}>
                      {lesson.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.lessonMeta}>
                  <View
                    style={[
                      styles.difficultyBadge,
                      {
                        backgroundColor:
                          getDifficultyColor(lesson.difficulty) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(lesson.difficulty) },
                      ]}
                    >
                      {getDifficultyLabel(lesson.difficulty)}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      ⏱️ {lesson.estimatedMinutes} min
                    </Text>
                    <Text style={styles.metaText}>
                      📝 {lesson.exercises.length} exercises
                    </Text>
                  </View>
                </View>

                {lesson.learningObjectives.length > 0 && (
                  <View style={styles.objectivesContainer}>
                    <Text style={styles.objectivesTitle}>
                      You'll learn:
                    </Text>
                    {lesson.learningObjectives.slice(0, 3).map((obj, idx) => (
                      <Text key={idx} style={styles.objectiveText}>
                        • {obj}
                      </Text>
                    ))}
                  </View>
                )}

                {isLocked && (
                  <View style={styles.lockedOverlay}>
                    <Text style={styles.lockedText}>
                      Complete previous lessons to unlock
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.dailyExerciseSpacer} />
      </ScrollView>

      <BottomNav navigation={navigation} active="Practice" />

      {dailyExercise && (
        <ExerciseModal
          isOpen={exerciseModalOpen}
          onClose={() => {
            setExerciseModalOpen(false);
            // If user closes manually during lesson, should we reset?
            // For now, simple behavior: just close. State remains, so if they click again it might restart or resume?
            // Ideally handleLessonPress resets it.
            // If we want to allow resuming, we keep state. If we want to cancel, we clear it.
            // Let's clear it if they close to avoid confusion.
            if (currentLessonId) {
              setCurrentLessonId(null);
              setActiveLessonExercises([]);
            }
          }}
          onSkip={handleExerciseSkip}
          exerciseType={dailyExercise.type as DailyExerciseType}
          exercise={dailyExercise}
          onSubmit={handleExerciseSubmit}
          targetLanguage={userProgress.targetLanguage || targetLanguage}
          currentExerciseIndex={currentLessonId ? currentExerciseIndex + 1 : undefined}
          totalExercises={currentLessonId ? activeLessonExercises.length : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.primaryDark,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statText: { fontWeight: '600', marginLeft: 4 },

  content: {
    padding: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.primaryDark,
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 20,
  },

  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  lessonCardLocked: {
    opacity: 0.6,
  },

  lessonHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  lessonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  lessonIcon: {
    fontSize: 24,
  },

  lessonInfo: {
    flex: 1,
  },

  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primaryDark,
    marginBottom: 4,
  },

  lessonTitleLocked: {
    color: AppColors.textSecondary,
  },

  lessonDescription: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },

  lessonMeta: {
    marginBottom: 12,
  },

  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },

  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },

  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },

  metaText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },

  objectivesContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },

  objectivesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.primaryMid,
    marginBottom: 6,
  },

  objectiveText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },

  lockedOverlay: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },

  lockedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },

  dailyExerciseButton: {
    backgroundColor: '#2F5FED',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  dailyExerciseButtonDisabled: {
    opacity: 0.7,
  },
  dailyExerciseButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  dailyExerciseButtonContainer: {
    padding: 20,
    paddingBottom: 0,
  },
  dailyExerciseSpacer: {
    height: 80,
  },
  exerciseTypesContainer: {
    padding: 20,
    paddingTop: 0,
  },
  exerciseTypesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primaryDark,
    marginBottom: 12,
  },
  exerciseTypesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  exerciseTypeButton: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  exerciseTypeIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  exerciseTypeLabel: {
    textAlign: 'center',
  },
  conversationCardContainer: {
    padding: 20,
    paddingTop: 10,
  },
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: AppColors.primary + '20',
  },
  conversationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: AppColors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  conversationIcon: {
    fontSize: 24,
  },
  conversationInfo: {
    flex: 1,
  },
  conversationTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primaryDark,
    marginBottom: 4,
  },
  conversationSubtitle: {
    fontSize: 12,
    color: AppColors.textSecondary,
    lineHeight: 16,
  },
  conversationArrow: {
    fontSize: 20,
    color: AppColors.primary,
    fontWeight: '600',
  },
});
