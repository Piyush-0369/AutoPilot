import React, { useState, useCallback, useEffect } from 'react';
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
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { BottomNav } from '../components/BottomNav';
import { useUserProgress } from '../services/UserProgressService';
import { useModelService } from '../services/ModelService';
import { AppColors } from '../theme';
import lessonsData from '../data/lessons.json';
import { Lesson, Module as ModuleType, CEFR_LABELS } from '../types';
import { ExerciseModal, DailyExerciseType } from '../components/ExerciseModal';
import { aiPracticeService } from '../services/AIPracticeService';
import { AIExercise } from '../services/AIPracticeService';
import { calculateXP } from '../lib/engines/xpEngine';
import { LANGUAGES } from '../data/languages';
import { getModulesGroupedByLevel } from '../data/modules';

type PracticeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Practice'>;
  route: RouteProp<RootStackParamList, 'Practice'>;
};

const lessons = lessonsData as Lesson[];

export const PracticeScreen: React.FC<PracticeScreenProps> = ({ navigation, route }) => {
  const userProgress = useUserProgress();
  const { isVoiceAgentReady } = useModelService();

  const [dailyExercise, setDailyExercise] = useState<AIExercise | null>(null);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [loadingExercise, setLoadingExercise] = useState(false);

  // Resolve native language code to full name for prompts
  const getNativeLangName = useCallback(() => {
    const found = LANGUAGES.find(l => l.code === userProgress.nativeLanguage || l.label === userProgress.nativeLanguage);
    return found?.label || userProgress.nativeLanguage || 'English';
  }, [userProgress.nativeLanguage]);

  const getTargetLangName = useCallback(() => {
    const found = LANGUAGES.find(l => l.code === userProgress.targetLanguage || l.label === userProgress.targetLanguage);
    return found?.label || userProgress.targetLanguage || 'Spanish';
  }, [userProgress.targetLanguage]);

  // Initialize background queue safely once models are loaded
  // We initialize the local buffer for all 3 types instantly, then kick off the global queue.
  useEffect(() => {
    if (isVoiceAgentReady) {
      const lang = getTargetLangName(); // fallback if no target somehow
      const nativeLangName = getNativeLangName();

      // Ensure we immediately have something to tap into initially
      const types: DailyExerciseType[] = ['typing', 'tts', 'stt'];
      types.forEach(type => {
        aiPracticeService.initializeBackgroundQueue(type, lang, nativeLangName);
      });

      // Kick off the global continuous generator loop for all practice types
      aiPracticeService.startGlobalBackgroundGeneration(lang, nativeLangName);
    }
  }, [isVoiceAgentReady, getTargetLangName, getNativeLangName]);

  // Lesson Mode State
  const [activeLessonExercises, setActiveLessonExercises] = useState<AIExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null);

  // Continuous Practice State
  const [isContinuousMode, setIsContinuousMode] = useState(false);
  const [accumulatedXP, setAccumulatedXP] = useState(0);
  const [continuousCount, setContinuousCount] = useState(0);

  // Module Practice State
  const [, setActiveModule] = useState<ModuleType | null>(null);

  const startContinuousPractice = useCallback(async (type: DailyExerciseType = 'typing') => {
    setLoadingExercise(true);
    try {
      const lang = getTargetLangName();
      const nativeLangName = getNativeLangName();
      // Fetch instantly from queue
      const exercise = await aiPracticeService.popExerciseFromQueue(type, lang, nativeLangName);

      // Kick off background replacement
      aiPracticeService.backgroundGenerateReplacement(type, lang, nativeLangName);

      setDailyExercise(exercise);
      setIsContinuousMode(true);
      setAccumulatedXP(0);
      setContinuousCount(1);
    } catch (error) {
      console.error('Failed to pull from queue:', error);
    } finally {
      setLoadingExercise(false);
      setExerciseModalOpen(true);
    }
  }, [getTargetLangName, getNativeLangName]);

  const generateDailyExercise = useCallback(async () => {
    // We treat the main button as continuous typing practice
    await startContinuousPractice('typing');
  }, [startContinuousPractice]);

  // Handle auto-starting an exercise from HomeScreen navigation
  useEffect(() => {
    if (isVoiceAgentReady && route.params?.startExerciseType && !exerciseModalOpen) {
      const type = route.params.startExerciseType;
      // Clear the parameter so it doesn't loop
      navigation.setParams({ startExerciseType: undefined });
      startContinuousPractice(type);
    }
  }, [isVoiceAgentReady, route.params?.startExerciseType, exerciseModalOpen, startContinuousPractice, navigation]);

  const mapToAIExercise = (ex: any): AIExercise => {
    let type: DailyExerciseType = 'typing';
    let question = ex.prompt || 'Question';
    let answer = ex.correctAnswer || '';

    if (ex.type === 'translation') type = 'typing';
    if (ex.type === 'speaking') type = 'tts';
    if (ex.type === 'listening') type = 'stt';
    if (ex.type === 'fill-blank') {
      type = 'typing';
      question = ex.sentence || ex.prompt;
    }
    if (ex.type === 'multiple-choice') type = 'typing'; // Fallback to typing for now

    return {
      question,
      answer,
      type,
      hint: ex.hints ? ex.hints[0] : undefined,
      difficulty: ex.difficulty || 1,
      category: 'lesson',
      options: ex.options,
      wordBank: ex.wordBank,
      blankPosition: ex.blankPosition,
      context: ex.context,
    };
  };

  const handleExerciseSkip = async () => {
    // Continuous Mode Skip
    if (isContinuousMode) {
      try {
        const lang = getTargetLangName();
        const nativeLangName = getNativeLangName();
        const nextExerciseType = (dailyExercise?.type || 'typing') as DailyExerciseType;

        // Pop next, no XP
        const nextExercise = await aiPracticeService.popExerciseFromQueue(nextExerciseType, lang, nativeLangName);
        aiPracticeService.backgroundGenerateReplacement(nextExerciseType, lang, nativeLangName);

        if (nextExercise && nextExercise.question && nextExercise.answer) {
          setDailyExercise(nextExercise);
          setContinuousCount(prev => prev + 1);
        } else {
          setExerciseModalOpen(false);
        }
      } catch (e) {
        console.error('Error on skip continuous:', e);
        setExerciseModalOpen(false);
      }
      return;
    }

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
    let xpToAward = 0;

    // 1. Calculate XP for the single exercise
    if (isCorrect && dailyExercise) {
      const xpResult = calculateXP({
        difficulty: dailyExercise.difficulty || 1,
        isCorrect: true,
        timeSpentMs: timeSpent,
        currentStreak: userProgress.streak,
      });
      xpToAward = xpResult.totalXP;
    }

    // 2. Continuous Mode logic
    if (isContinuousMode) {
      if (isCorrect) {
        setAccumulatedXP(prev => prev + xpToAward);

        try {
          // Load next continuous exercise instantly
          const lang = getTargetLangName();
          const nativeLangName = getNativeLangName();
          const nextExerciseType = (dailyExercise?.type || 'typing') as DailyExerciseType;

          // Pop instantly from queue
          const nextExercise = await aiPracticeService.popExerciseFromQueue(nextExerciseType, lang, nativeLangName);
          aiPracticeService.backgroundGenerateReplacement(nextExerciseType, lang, nativeLangName);

          // Validate exercise before setting
          if (nextExercise && nextExercise.question && nextExercise.answer) {
            setDailyExercise(nextExercise);
            setContinuousCount(prev => prev + 1);
          } else {
            console.warn('[PracticeScreen] Invalid next exercise, closing modal');
            setExerciseModalOpen(false);
          }
        } catch (error) {
          console.error('[PracticeScreen] Error loading next exercise:', error);
          setExerciseModalOpen(false);
        }
      }
      return;
    }

    // 3. Normal / Lesson XP award immediately
    if (xpToAward > 0 && !isContinuousMode) {
      await userProgress.updateXP(xpToAward);
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
        // If user formatted current Modal correctly, onSubmit is only called on SUCCESS?
        // Modal code: onSubmit called in handleTextSubmit if correct.
        // If skip, onSubmit is NOT called. onClose is called.

        // So if we are here, it IS correct.
      }
    } else {
      // Daily Exercise Mode - just close (already closed by modal logic)
      setExerciseModalOpen(false);
    }
  };

  const handleLessonPress = (lesson: Lesson) => {
    console.log('Starting lesson:', lesson.title);

    if (!lesson.exercises || lesson.exercises.length === 0) {
      Alert.alert("Available Soon", "This lesson content is coming soon!");
      return;
    }

    const aiExercises = lesson.exercises.map(mapToAIExercise);
    setActiveLessonExercises(aiExercises);
    setCurrentExerciseIndex(0);
    setCurrentLessonId(lesson.id);

    // Start first exercise
    setDailyExercise(aiExercises[0]);
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
    const exerciseTypes: DailyExerciseType[] = ['typing', 'tts', 'stt'];

    return (
      <View style={styles.exerciseTypesContainer}>
        <Text style={styles.exerciseTypesTitle}>Practice by Type</Text>
        <View style={styles.exerciseTypesRow}>
          {exerciseTypes.map((type) => (
            <TouchableOpacity
              key={type}
              style={styles.exerciseTypeButton}
              onPress={() => startContinuousPractice(type)}
            >
              <Text style={styles.exerciseTypeIcon}>
                {type === 'typing' ? '🧩' : type === 'tts' ? '🗣️' : '🎤'}
              </Text>
              <Text style={styles.exerciseTypeLabel}>
                {type === 'typing' ? 'Translation' : type === 'tts' ? 'Speaking' : 'Listening'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  const startModulePractice = useCallback(async (mod: ModuleType) => {
    setLoadingExercise(true);
    setActiveModule(mod);
    try {
      const lang = getTargetLangName();
      const nativeLangName = getNativeLangName();
      const exercise = await aiPracticeService.generateModuleExercise(
        'typing', lang, mod, nativeLangName
      );
      setDailyExercise(exercise);
      setIsContinuousMode(true);
      setAccumulatedXP(0);
      setContinuousCount(1);
    } catch (error) {
      console.error('Failed to generate module exercise:', error);
    } finally {
      setLoadingExercise(false);
      setExerciseModalOpen(true);
    }
  }, [getTargetLangName, getNativeLangName]);

  const renderModuleSections = () => {
    const proficiency = userProgress.proficiencyLevel || 'beginner';
    const grouped = getModulesGroupedByLevel(proficiency);

    return (
      <View style={styles.modulesContainer}>
        <Text style={styles.sectionTitle}>Learning Modules</Text>
        <Text style={styles.sectionSubtitle}>CEFR-aligned curriculum tailored to your level</Text>

        {grouped.map(({ level, unlocked, modules }) => {
          const labelInfo = CEFR_LABELS[level];
          return (
            <View key={level} style={styles.cefrSection}>
              <View style={styles.cefrHeader}>
                <Text style={styles.cefrIcon}>{labelInfo.icon}</Text>
                <Text style={[styles.cefrLabel, { color: labelInfo.color }]}>
                  {labelInfo.label} · {level}
                </Text>
                {!unlocked && (
                  <View style={styles.lockedBadge}>
                    <Text style={styles.lockedBadgeText}>🔒 Locked</Text>
                  </View>
                )}
              </View>

              <View style={styles.moduleGrid}>
                {modules.map((mod) => (
                  <TouchableOpacity
                    key={mod.id}
                    style={[
                      styles.moduleCard,
                      !unlocked && styles.moduleCardLocked,
                      { borderLeftColor: labelInfo.color },
                    ]}
                    onPress={() => unlocked && startModulePractice(mod)}
                    disabled={!unlocked || loadingExercise}
                    activeOpacity={0.7}
                  >
                    <View style={styles.moduleCardHeader}>
                      <Text style={styles.moduleIcon}>{mod.icon}</Text>
                      <View style={styles.moduleInfo}>
                        <Text
                          style={[
                            styles.moduleTitle,
                            !unlocked && styles.moduleTitleLocked,
                          ]}
                        >
                          {mod.title}
                        </Text>
                        <Text style={styles.moduleDescription}>
                          {mod.description}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.moduleMeta}>
                      <Text style={styles.moduleMetaText}>
                        📝 {mod.topics.length} topics
                      </Text>
                      <Text style={styles.moduleMetaText}>
                        ⏱️ {mod.estimatedMinutes} min
                      </Text>
                    </View>
                    {!unlocked && (
                      <View style={styles.moduleLockedOverlay}>
                        <Text style={styles.moduleLockedText}>Level up to unlock</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
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

      <ScrollView showsVerticalScrollIndicator={false}>
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

        {renderModuleSections()}

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Classic Lessons</Text>
          <Text style={styles.sectionSubtitle}>
            Structured lessons with pre-built exercises
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
                      {lesson.title}
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
          isContinuousMode={isContinuousMode}
          onClose={async () => {
            setExerciseModalOpen(false);

            // If exiting continuous mode, award accumulated XP!
            if (isContinuousMode && accumulatedXP > 0) {
              await userProgress.updateXP(accumulatedXP);
              Alert.alert(
                "Great Job!",
                `You completed ${continuousCount - 1} continuous exercises and earned +${accumulatedXP} XP!`
              );
              setAccumulatedXP(0);
              setIsContinuousMode(false);
            }

            if (currentLessonId) {
              setCurrentLessonId(null);
              setActiveLessonExercises([]);
            }
          }}
          onSkip={handleExerciseSkip}
          exerciseType={dailyExercise.type as DailyExerciseType}
          exercise={dailyExercise}
          onSubmit={handleExerciseSubmit}
          targetLanguage={getTargetLangName()}
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

  // ── Module Section Styles ────────────────────────────────────
  modulesContainer: {
    padding: 20,
    paddingTop: 10,
  },
  cefrSection: {
    marginBottom: 20,
  },
  cefrHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  cefrIcon: {
    fontSize: 20,
  },
  cefrLabel: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  lockedBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  lockedBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  moduleGrid: {
    gap: 10,
  },
  moduleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderLeftWidth: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  moduleCardLocked: {
    opacity: 0.5,
  },
  moduleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleIcon: {
    fontSize: 28,
    marginRight: 12,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.primaryDark,
    marginBottom: 2,
  },
  moduleTitleLocked: {
    color: AppColors.textSecondary,
  },
  moduleDescription: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  moduleMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  moduleMetaText: {
    fontSize: 11,
    color: AppColors.textSecondary,
  },
  moduleLockedOverlay: {
    marginTop: 8,
    padding: 6,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },
  moduleLockedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },
});
