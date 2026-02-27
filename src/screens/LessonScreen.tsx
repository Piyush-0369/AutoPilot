// ============================================================
// Lesson Screen — 4-Step Learning Flow
// ============================================================
// The core adaptive learning screen implementing:
//   Step 1: Teach — Vocabulary cards + Grammar concept
//   Step 2: Guided Practice — Easy exercises with new content
//   Step 3: Reinforcement — Mixed exercises + SRS review
//   Step 4: Assessment — Short test (must pass ≥70%)

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Platform,
    StatusBar,
    Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { AppColors } from '../theme';
import { useUserProgress } from '../services/UserProgressService';
import { useSession } from '../services/SessionService';
import { learningPathService } from '../services/LearningPathService';
import { aiFeedbackService } from '../services/AIFeedbackService';
import { VocabularyCardView } from '../components/VocabularyCardView';
import { GrammarInsightPanel } from '../components/GrammarInsightPanel';
import { ExerciseModal } from '../components/ExerciseModal';
import type {
    LessonStepType,
    VocabularyEntry,
    GrammarModule,
    WritingFeedback,
} from '../types/learningTypes';
import { RootStackParamList } from '../navigation/types';

type LessonScreenProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Lesson'>;
    route: RouteProp<RootStackParamList, 'Lesson'>;
};

// Step configuration
const STEPS: { key: LessonStepType; label: string; icon: string; color: string }[] = [
    { key: 'teach', label: 'Learn', icon: '📖', color: AppColors.accentCyan },
    { key: 'guided-practice', label: 'Practice', icon: '✏️', color: AppColors.accentGreen },
    { key: 'reinforcement', label: 'Reinforce', icon: '🔄', color: AppColors.accentViolet },
    { key: 'assessment', label: 'Test', icon: '🎯', color: '#F59E0B' },
];

const PASS_THRESHOLD = 70; // Percentage to pass assessment

export const LessonScreen: React.FC<LessonScreenProps> = ({ navigation, route }) => {
    const { lessonId } = route.params;
    const userProgress = useUserProgress();
    const session = useSession();

    // Lesson data
    const [lessonTitle, setLessonTitle] = useState('');
    const [lessonDescription, setLessonDescription] = useState('');
    const [vocabulary, setVocabulary] = useState<VocabularyEntry[]>([]);
    const [grammar, setGrammar] = useState<GrammarModule | undefined>();
    const [exercises, setExercises] = useState<any[]>([]);

    // State
    const [currentStep, setCurrentStep] = useState<LessonStepType>('teach');
    const [currentVocabIndex, setCurrentVocabIndex] = useState(0);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [showGrammarInsight, setShowGrammarInsight] = useState(false);
    const [lastFeedback, setLastFeedback] = useState<WritingFeedback | null>(null);
    const [showExerciseModal, setShowExerciseModal] = useState(false);

    // Assessment tracking
    const [assessmentCorrect, setAssessmentCorrect] = useState(0);
    const [assessmentTotal, setAssessmentTotal] = useState(0);
    const [showResults, setShowResults] = useState(false);

    // Animation
    const progressAnim = useRef(new Animated.Value(0)).current;

    // ----------------------------------------------------------
    // LOAD LESSON DATA
    // ----------------------------------------------------------
    useEffect(() => {
        loadLessonData();
    }, [lessonId]);

    const loadLessonData = async () => {
        setIsLoading(true);
        try {
            const lesson = learningPathService.getLessonById(lessonId);
            if (!lesson) {
                Alert.alert('Error', 'Lesson not found');
                navigation.goBack();
                return;
            }

            setLessonTitle(lesson.title);
            setLessonDescription(lesson.description);

            // Load vocabulary
            const vocab = learningPathService.getVocabularyForLesson(lessonId);
            setVocabulary(vocab);

            // Load grammar
            const grammarModule = learningPathService.getGrammarForLesson(lessonId);
            setGrammar(grammarModule);

            // Load exercises for current step
            await loadExercisesForStep('guided-practice');

            // Check progress to resume
            const userId = 'default';
            const progress = await learningPathService.getLessonProgressById(userId, lessonId);
            if (progress) {
                setCurrentStep(progress.currentStep as LessonStepType);
            }
        } catch (e) {
            console.error('[Lesson] Load error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadExercisesForStep = async (step: LessonStepType) => {
        const stepExercises = learningPathService.getExercisesForLesson(lessonId, step);
        setExercises(stepExercises);
        setCurrentExerciseIndex(0);
    };

    // ----------------------------------------------------------
    // STEP PROGRESSION
    // ----------------------------------------------------------
    const handleStepComplete = async (step: LessonStepType) => {
        const userId = 'default';
        await learningPathService.completeLessonStep(userId, lessonId, step);

        const stepIdx = STEPS.findIndex(s => s.key === step);

        if (step === 'assessment') {
            // Show results
            const score = assessmentTotal > 0
                ? Math.round((assessmentCorrect / assessmentTotal) * 100)
                : 0;

            await learningPathService.completeLessonStep(userId, lessonId, 'assessment', score);

            if (score >= PASS_THRESHOLD) {
                // Award XP
                const lesson = learningPathService.getLessonById(lessonId);
                const xpReward = lesson?.xpReward || 50;
                await userProgress.updateXP(xpReward);
            }

            setShowResults(true);
        } else if (stepIdx < STEPS.length - 1) {
            const nextStep = STEPS[stepIdx + 1].key;
            setCurrentStep(nextStep);
            await loadExercisesForStep(nextStep);

            // Animate progress
            Animated.timing(progressAnim, {
                toValue: (stepIdx + 1) / STEPS.length,
                duration: 500,
                useNativeDriver: false,
            }).start();
        }
    };

    // ----------------------------------------------------------
    // EXERCISE HANDLING
    // ----------------------------------------------------------
    const handleExerciseSubmit = async (answer: string, exercise: any) => {
        const expectedVariants: string[] = (() => {
            try { return JSON.parse(exercise.expectedAnswerVariants || '[]'); } catch { return []; }
        })();

        // Get AI feedback
        const feedback = await aiFeedbackService.getWritingFeedback(
            answer,
            exercise.correctAnswer,
            expectedVariants,
            exercise.context
        );

        setLastFeedback(feedback);

        // Track word performance for SRS
        if (exercise.requiredWords) {
            try {
                const words: string[] = JSON.parse(exercise.requiredWords);
                const userId = 'default';
                for (const wordId of words) {
                    await learningPathService.recordWordResult(userId, wordId, '', feedback.isCorrect);
                }
            } catch { }
        }

        // Assessment tracking
        if (currentStep === 'assessment') {
            setAssessmentTotal(prev => prev + 1);
            if (feedback.isCorrect) {
                setAssessmentCorrect(prev => prev + 1);
            }
        }

        // Show grammar insight on grammar errors
        if (!feedback.isCorrect && exercise.grammarTopic && grammar) {
            setShowGrammarInsight(true);
        }

        return feedback.isCorrect;
    };

    const handleNextExercise = () => {
        setLastFeedback(null);
        setShowGrammarInsight(false);

        if (currentExerciseIndex < exercises.length - 1) {
            setCurrentExerciseIndex(prev => prev + 1);
        } else {
            // Step complete
            handleStepComplete(currentStep);
        }
    };

    // ----------------------------------------------------------
    // RENDER: Loading
    // ----------------------------------------------------------
    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={AppColors.accentCyan} />
                <Text style={styles.loadingText}>Loading lesson...</Text>
            </View>
        );
    }

    // ----------------------------------------------------------
    // RENDER: Results
    // ----------------------------------------------------------
    if (showResults) {
        const score = assessmentTotal > 0
            ? Math.round((assessmentCorrect / assessmentTotal) * 100)
            : 100;
        const passed = score >= PASS_THRESHOLD;
        const lesson = learningPathService.getLessonById(lessonId);

        return (
            <View style={styles.container}>
                <View style={styles.resultsContainer}>
                    <Text style={styles.resultsEmoji}>{passed ? '🎉' : '📚'}</Text>
                    <Text style={styles.resultsTitle}>
                        {passed ? 'Lesson Complete!' : 'Keep Practicing'}
                    </Text>
                    <Text style={styles.resultsSubtitle}>
                        {passed
                            ? `You scored ${score}% and earned ${lesson?.xpReward || 50} XP!`
                            : `You scored ${score}%. Need ${PASS_THRESHOLD}% to pass.`}
                    </Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{assessmentCorrect}</Text>
                            <Text style={styles.statLabel}>Correct</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={styles.statValue}>{assessmentTotal - assessmentCorrect}</Text>
                            <Text style={styles.statLabel}>Incorrect</Text>
                        </View>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: passed ? AppColors.accentGreen : '#EF4444' }]}>
                                {score}%
                            </Text>
                            <Text style={styles.statLabel}>Score</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        style={styles.resultButton}
                        onPress={async () => {
                            if (passed) {
                                const nextLessonId = await learningPathService.getNextLesson(
                                    userProgress.userId || 'default',
                                    lessonId
                                );
                                if (nextLessonId) {
                                    navigation.replace('Lesson', { lessonId: nextLessonId });
                                } else {
                                    navigation.goBack();
                                }
                            } else {
                                // Retry assessment
                                setAssessmentCorrect(0);
                                setAssessmentTotal(0);
                                setShowResults(false);
                                setCurrentStep('assessment');
                                await loadExercisesForStep('assessment');
                            }
                        }}
                    >
                        <LinearGradient
                            colors={passed ? [AppColors.accentGreen, '#059669'] : [AppColors.accentCyan, '#06B6D4']}
                            style={styles.resultButtonGradient}
                        >
                            <Text style={styles.resultButtonText}>
                                {passed ? 'Next Lesson →' : 'Try Again'}
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backToMapButton}>
                        <Text style={styles.backToMapText}>Back to Roadmap</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // ----------------------------------------------------------
    // RENDER: Step Progress Bar
    // ----------------------------------------------------------
    const currentStepIdx = STEPS.findIndex(s => s.key === currentStep);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{lessonTitle}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Step Progress */}
            <View style={styles.stepsContainer}>
                {STEPS.map((step, idx) => {
                    const isActive = idx === currentStepIdx;
                    const isComplete = idx < currentStepIdx;
                    return (
                        <View key={step.key} style={styles.stepItem}>
                            <View
                                style={[
                                    styles.stepDot,
                                    isComplete && { backgroundColor: step.color },
                                    isActive && { backgroundColor: step.color, transform: [{ scale: 1.3 }] },
                                    !isActive && !isComplete && { backgroundColor: AppColors.textMuted + '40' },
                                ]}
                            >
                                <Text style={styles.stepDotText}>
                                    {isComplete ? '✓' : step.icon}
                                </Text>
                            </View>
                            <Text
                                style={[
                                    styles.stepLabel,
                                    isActive && { color: step.color, fontWeight: '700' },
                                ]}
                            >
                                {step.label}
                            </Text>
                            {idx < STEPS.length - 1 && (
                                <View
                                    style={[
                                        styles.stepConnector,
                                        isComplete && { backgroundColor: step.color },
                                    ]}
                                />
                            )}
                        </View>
                    );
                })}
            </View>

            {/* Step Content */}
            <ScrollView
                style={styles.contentArea}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* TEACH STEP */}
                {currentStep === 'teach' && (
                    <View style={styles.stepContent}>
                        {vocabulary.length > 0 && (
                            <VocabularyCardView
                                vocabulary={vocabulary[currentVocabIndex]}
                                currentIndex={currentVocabIndex}
                                totalCards={vocabulary.length}
                                onPrevious={currentVocabIndex > 0
                                    ? () => setCurrentVocabIndex(prev => prev - 1)
                                    : undefined}
                                onNext={() => {
                                    if (currentVocabIndex < vocabulary.length - 1) {
                                        setCurrentVocabIndex(prev => prev + 1);
                                    } else if (grammar) {
                                        // Show grammar after all vocab cards
                                        setShowGrammarInsight(true);
                                    } else {
                                        // No grammar — complete teach step
                                        handleStepComplete('teach');
                                    }
                                }}
                            />
                        )}

                        {showGrammarInsight && grammar && currentStep === 'teach' && (
                            <View style={styles.grammarContainer}>
                                <GrammarInsightPanel
                                    grammarModule={grammar}
                                    correctAnswer=""
                                    onDismiss={() => {
                                        setShowGrammarInsight(false);
                                        handleStepComplete('teach');
                                    }}
                                />
                            </View>
                        )}
                    </View>
                )}

                {/* PRACTICE / REINFORCEMENT / ASSESSMENT STEPS */}
                {(currentStep === 'guided-practice' ||
                    currentStep === 'reinforcement' ||
                    currentStep === 'assessment') && (
                        <View style={styles.stepContent}>
                            {exercises.length > 0 ? (
                                <View>
                                    {/* Exercise Progress */}
                                    <View style={styles.exerciseProgress}>
                                        <Text style={styles.exerciseProgressText}>
                                            Exercise {currentExerciseIndex + 1} of {exercises.length}
                                        </Text>
                                        <View style={styles.exerciseProgressBar}>
                                            <View
                                                style={[
                                                    styles.exerciseProgressFill,
                                                    {
                                                        width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%`,
                                                        backgroundColor: STEPS[currentStepIdx]?.color || AppColors.accentCyan,
                                                    },
                                                ]}
                                            />
                                        </View>
                                    </View>

                                    {/* Current Exercise */}
                                    {renderExercise(exercises[currentExerciseIndex])}

                                    {/* Grammar Insight (on error) */}
                                    {showGrammarInsight && grammar && (
                                        <View style={styles.grammarContainer}>
                                            <GrammarInsightPanel
                                                grammarModule={grammar}
                                                userAnswer={lastFeedback?.isCorrect ? undefined : 'Your incorrect answer'}
                                                correctAnswer={lastFeedback?.correctAnswer || ''}
                                                errorExplanation={lastFeedback?.explanation}
                                                onDismiss={() => {
                                                    setShowGrammarInsight(false);
                                                    handleNextExercise();
                                                }}
                                            />
                                        </View>
                                    )}

                                    {/* Feedback */}
                                    {lastFeedback && !showGrammarInsight && (
                                        <View style={styles.feedbackContainer}>
                                            <View
                                                style={[
                                                    styles.feedbackCard,
                                                    lastFeedback.isCorrect ? styles.feedbackCorrect : styles.feedbackIncorrect,
                                                ]}
                                            >
                                                <Text style={styles.feedbackEmoji}>
                                                    {lastFeedback.isCorrect ? '✅' : '❌'}
                                                </Text>
                                                <Text style={styles.feedbackText}>
                                                    {lastFeedback.explanation}
                                                </Text>
                                                {!lastFeedback.isCorrect && lastFeedback.correctAnswer && (
                                                    <Text style={styles.feedbackCorrectAnswer}>
                                                        Correct: {lastFeedback.correctAnswer}
                                                    </Text>
                                                )}
                                            </View>

                                            <TouchableOpacity
                                                style={styles.feedbackButton}
                                                onPress={handleNextExercise}
                                            >
                                                <Text style={styles.feedbackButtonText}>Continue</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            ) : (
                                <View style={styles.noExercises}>
                                    <Text style={styles.noExercisesText}>
                                        No exercises available for this step yet.
                                    </Text>
                                    <TouchableOpacity
                                        style={styles.skipButton}
                                        onPress={() => handleStepComplete(currentStep)}
                                    >
                                        <Text style={styles.skipButtonText}>Skip to Next Step →</Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                    )}
            </ScrollView>
        </View>
    );

    // ----------------------------------------------------------
    // RENDER: Individual Exercise
    // ----------------------------------------------------------
    function renderExercise(exercise: any) {
        if (!exercise || lastFeedback) return null;

        return (
            <View style={styles.exerciseCard}>
                {/* Prompt */}
                <Text style={styles.exercisePrompt}>{exercise.prompt}</Text>

                {/* Type-specific rendering */}
                {exercise.type === 'multiple-choice' && renderMultipleChoice(exercise)}
                {exercise.type === 'translation' && renderTranslation(exercise)}
                {exercise.type === 'fill-blank' && renderFillBlank(exercise)}
                {exercise.type === 'speaking' && renderSpeaking(exercise)}

                {/* Context hint */}
                {exercise.context && (
                    <Text style={styles.contextHint}>💡 {exercise.context}</Text>
                )}
            </View>
        );
    }

    function renderMultipleChoice(exercise: any) {
        const options: string[] = (() => {
            try { return JSON.parse(exercise.options || '[]'); } catch { return []; }
        })();

        return (
            <View style={styles.optionsContainer}>
                {options.map((option, idx) => (
                    <TouchableOpacity
                        key={idx}
                        style={styles.optionButton}
                        onPress={() => handleExerciseSubmit(option, exercise)}
                    >
                        <View style={styles.optionIndex}>
                            <Text style={styles.optionIndexText}>{String.fromCharCode(65 + idx)}</Text>
                        </View>
                        <Text style={styles.optionText}>{option}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        );
    }

    function renderTranslation(exercise: any) {
        const [answer, setAnswer] = React.useState('');
        const inputRef = React.useRef<any>(null);

        return (
            <View style={styles.translationContainer}>
                <View style={styles.inputRow}>
                    <View style={styles.textInputContainer}>
                        <Text style={styles.inputLabel}>Your translation:</Text>
                        {/* Using a simple Text + TouchableOpacity simulation instead of TextInput
                to avoid import issues. In production, use TextInput. */}
                        <TouchableOpacity
                            style={styles.textInput}
                            onPress={() => {
                                // In production this would focus a TextInput
                                Alert.prompt?.(
                                    'Type your answer',
                                    exercise.prompt,
                                    (text: string) => {
                                        if (text) {
                                            handleExerciseSubmit(text, exercise);
                                        }
                                    }
                                ) || Alert.alert('Type Answer',
                                    'Enter your translation in the text field',
                                    [{ text: 'OK' }]
                                );
                            }}
                        >
                            <Text style={styles.textInputPlaceholder}>
                                {answer || 'Tap to type your answer...'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {exercise.hints && (
                    <Text style={styles.hintText}>
                        Hint: {(() => { try { return JSON.parse(exercise.hints)[0]; } catch { return ''; } })()}
                    </Text>
                )}
            </View>
        );
    }

    function renderFillBlank(exercise: any) {
        const wordBank: string[] = (() => {
            try { return JSON.parse(exercise.wordBank || '[]'); } catch { return []; }
        })();

        return (
            <View style={styles.fillBlankContainer}>
                {exercise.sentence && (
                    <Text style={styles.fillBlankSentence}>{exercise.sentence}</Text>
                )}
                <View style={styles.wordBankContainer}>
                    {wordBank.map((word, idx) => (
                        <TouchableOpacity
                            key={idx}
                            style={styles.wordBankItem}
                            onPress={() => handleExerciseSubmit(word, exercise)}
                        >
                            <Text style={styles.wordBankText}>{word}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    }

    function renderSpeaking(exercise: any) {
        return (
            <View style={styles.speakingContainer}>
                <Text style={styles.speakingPhrase}>{exercise.targetPhrase}</Text>
                {exercise.phonetics && (
                    <Text style={styles.speakingPhonetics}>{exercise.phonetics}</Text>
                )}

                <TouchableOpacity
                    style={styles.speakButton}
                    onPress={() => {
                        // In production, this would trigger recording + STT + evaluation
                        // For now, simulate a correct answer
                        handleExerciseSubmit(exercise.correctAnswer, exercise);
                    }}
                >
                    <LinearGradient
                        colors={[AppColors.accentCyan, '#06B6D4']}
                        style={styles.speakButtonGradient}
                    >
                        <Text style={styles.speakButtonIcon}>🎤</Text>
                        <Text style={styles.speakButtonText}>Tap to Speak</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }
};

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F7FA',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: AppColors.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 56,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
    },
    closeButtonText: {
        fontSize: 18,
        color: '#6B7280',
        fontWeight: '600',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111827',
    },
    // Steps
    stepsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    stepItem: {
        alignItems: 'center',
        flex: 1,
    },
    stepDot: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 6,
    },
    stepDotText: {
        fontSize: 14,
    },
    stepLabel: {
        fontSize: 11,
        color: AppColors.textMuted,
        fontWeight: '500',
    },
    stepConnector: {
        position: 'absolute',
        top: 18,
        right: -20,
        width: 20,
        height: 2,
        backgroundColor: AppColors.textMuted + '30',
    },
    // Content
    contentArea: {
        flex: 1,
    },
    contentContainer: {
        paddingBottom: 40,
    },
    stepContent: {
        flex: 1,
    },
    grammarContainer: {
        margin: 20,
    },
    // Exercise
    exerciseProgress: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    exerciseProgressText: {
        fontSize: 13,
        color: AppColors.textMuted,
        fontWeight: '600',
        marginBottom: 8,
    },
    exerciseProgressBar: {
        height: 4,
        backgroundColor: AppColors.textMuted + '20',
        borderRadius: 2,
    },
    exerciseProgressFill: {
        height: 4,
        borderRadius: 2,
    },
    exerciseCard: {
        margin: 20,
        padding: 24,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    exercisePrompt: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 24,
        lineHeight: 28,
    },
    contextHint: {
        fontSize: 13,
        color: AppColors.textMuted,
        fontStyle: 'italic',
        marginTop: 16,
    },
    // Multiple Choice
    optionsContainer: {
        gap: 12,
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 14,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        gap: 14,
    },
    optionIndex: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: AppColors.accentCyan + '15',
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionIndexText: {
        fontSize: 14,
        fontWeight: '700',
        color: AppColors.accentCyan,
    },
    optionText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
        flex: 1,
    },
    // Translation
    translationContainer: {
        gap: 12,
    },
    inputRow: {
        gap: 12,
    },
    textInputContainer: {
        gap: 8,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: AppColors.textMuted,
    },
    textInput: {
        padding: 16,
        backgroundColor: '#F9FAFB',
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        minHeight: 56,
        justifyContent: 'center',
    },
    textInputPlaceholder: {
        fontSize: 16,
        color: '#9CA3AF',
    },
    hintText: {
        fontSize: 13,
        color: AppColors.accentViolet,
        fontStyle: 'italic',
    },
    // Fill Blank
    fillBlankContainer: {
        gap: 16,
    },
    fillBlankSentence: {
        fontSize: 20,
        color: '#111827',
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 30,
    },
    wordBankContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    wordBankItem: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        backgroundColor: AppColors.accentCyan + '15',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: AppColors.accentCyan + '40',
    },
    wordBankText: {
        fontSize: 16,
        fontWeight: '600',
        color: AppColors.accentCyan,
    },
    // Speaking
    speakingContainer: {
        alignItems: 'center',
        gap: 16,
    },
    speakingPhrase: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        textAlign: 'center',
    },
    speakingPhonetics: {
        fontSize: 16,
        color: AppColors.accentCyan,
        fontStyle: 'italic',
    },
    speakButton: {
        marginTop: 12,
        width: '100%',
    },
    speakButtonGradient: {
        flexDirection: 'row',
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    speakButtonIcon: {
        fontSize: 22,
    },
    speakButtonText: {
        fontSize: 17,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Feedback
    feedbackContainer: {
        margin: 20,
        gap: 12,
    },
    feedbackCard: {
        padding: 20,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
    },
    feedbackCorrect: {
        backgroundColor: AppColors.accentGreen + '15',
        borderWidth: 1,
        borderColor: AppColors.accentGreen + '30',
    },
    feedbackIncorrect: {
        backgroundColor: '#EF4444' + '15',
        borderWidth: 1,
        borderColor: '#EF4444' + '30',
    },
    feedbackEmoji: {
        fontSize: 24,
    },
    feedbackText: {
        fontSize: 15,
        color: '#374151',
        lineHeight: 22,
        flex: 1,
    },
    feedbackCorrectAnswer: {
        fontSize: 14,
        fontWeight: '600',
        color: AppColors.accentGreen,
        marginTop: 4,
    },
    feedbackButton: {
        paddingVertical: 14,
        borderRadius: 14,
        backgroundColor: AppColors.accentCyan,
        alignItems: 'center',
    },
    feedbackButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // No Exercises
    noExercises: {
        padding: 40,
        alignItems: 'center',
        gap: 16,
    },
    noExercisesText: {
        fontSize: 16,
        color: AppColors.textMuted,
        textAlign: 'center',
    },
    skipButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 14,
        backgroundColor: AppColors.accentCyan,
    },
    skipButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    // Results
    resultsContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    resultsEmoji: {
        fontSize: 72,
        marginBottom: 24,
    },
    resultsTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#111827',
        marginBottom: 12,
    },
    resultsSubtitle: {
        fontSize: 16,
        color: AppColors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 32,
        marginBottom: 36,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 32,
        fontWeight: '800',
        color: '#111827',
    },
    statLabel: {
        fontSize: 13,
        color: AppColors.textMuted,
        marginTop: 4,
    },
    resultButton: {
        width: '100%',
        marginBottom: 12,
    },
    resultButtonGradient: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    resultButtonText: {
        fontSize: 17,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    backToMapButton: {
        paddingVertical: 12,
    },
    backToMapText: {
        fontSize: 15,
        color: AppColors.textMuted,
        fontWeight: '500',
    },
});
