import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AppColors } from '../theme';
import { VoiceExerciseComponent } from './VoiceExerciseComponent';

export type DailyExerciseType = 'typing' | 'tts' | 'stt';

interface Exercise {
    question: string;
    answer: string;
    wrongAnswer?: string;
    type: string;
    hint?: string;
    options?: string[];
    wordBank?: string[];
    blankPosition?: number;
    context?: string;
    difficulty?: number;
}

interface ExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    exerciseType: DailyExerciseType;
    exercise: Exercise;
    onSubmit: (answer: string, isCorrect: boolean, timeSpent: number) => void;
    onSkip?: () => void;
    targetLanguage?: string;
    currentExerciseIndex?: number;
    totalExercises?: number;
    isContinuousMode?: boolean;
}

export const ExerciseModal: React.FC<ExerciseModalProps> = ({
    isOpen,
    onClose,
    onSkip,
    exerciseType,
    exercise,
    onSubmit,
    targetLanguage = '',
    currentExerciseIndex,
    totalExercises,
    isContinuousMode = false,
}) => {
    const [userAnswer, setUserAnswer] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [startTime] = useState(Date.now());
    const [availableWords, setAvailableWords] = useState<string[]>([]);
    const [arrangedWords, setArrangedWords] = useState<string[]>([]);

    // Effect to reset state when exercise changes
    React.useEffect(() => {
        setUserAnswer('');
        setShowFeedback(false);
        setIsCorrect(false);
        setAvailableWords([]);
        setArrangedWords([]);

        if (exerciseType === 'typing' && exercise.answer) {
            const diff = exercise.difficulty ?? 1;
            if (diff === 3) {
                // Intermediate: characters
                const chars = exercise.answer.split('');
                const distractors = exercise.options || [];
                const combined = [...chars, ...distractors];
                setAvailableWords(combined.sort(() => Math.random() - 0.5));
            } else {
                // Beginner & Advanced: words
                const words = exercise.answer.split(/\s+/);
                const distractors = exercise.options || [];
                const combined = [...words, ...distractors];
                const filtered = combined.filter(w => w.trim().length > 0);
                setAvailableWords(filtered.sort(() => Math.random() - 0.5));
            }
        } else if (exerciseType === 'stt' && exercise.answer) {
            // Split answer and wrongAnswer into words safely
            const safeAnswer = String(exercise.answer || '');
            const safeWrongAnswer = exercise.wrongAnswer ? String(exercise.wrongAnswer) : '';
            const distractors = exercise.options || [];

            const words = [
                ...safeAnswer.split(/\s+/),
                ...(safeWrongAnswer ? safeWrongAnswer.split(/\s+/) : []),
                ...distractors
            ];

            // Filter empty strings and shuffle
            const filteredWords = words.filter(w => w.trim().length > 0);
            setAvailableWords(filteredWords.sort(() => Math.random() - 0.5));
        }
    }, [exercise, exerciseType]);

    const getExerciseIcon = () => {
        switch (exerciseType) {
            case 'typing':
                return '🧩';
            case 'tts':
                return '🗣️';
            case 'stt':
                return '🎤';
        }
    };

    const getExerciseTitle = () => {
        switch (exerciseType) {
            case 'typing':
                return 'Translation';
            case 'tts':
                return 'Text-to-Speech Exercise';
            case 'stt':
                return 'Speech-to-Text Exercise';
        }
    };

    const getGradientColors = () => {
        switch (exerciseType) {
            case 'tts':
                return [AppColors.accentPink, '#DB2777'];
            case 'stt':
                return [AppColors.accentViolet, '#7C3AED'];
            default:
                return ['#2F5FED', '#1E40AF'];
        }
    };

    const handleTextSubmit = () => {
        const correct = String(userAnswer).trim().toLowerCase() === String(exercise.answer || '').toLowerCase();
        const timeSpent = Date.now() - startTime;
        setIsCorrect(correct);
        setShowFeedback(true);

        if (correct) {
            setTimeout(() => {
                onSubmit(userAnswer, correct, timeSpent);
                // Do NOT call handleClose here if we want to wait for parent to update
                // But generally we want to clear local state.
                // Parent will handle closing or updating props.
                // If parent updates props, useEffect keys will trigger reset.
            }, 1000);
        }
    };

    const handleVoiceAnswer = (answer: string, correct: boolean) => {
        const timeSpent = Date.now() - startTime;
        setIsCorrect(correct);
        setShowFeedback(true);

        if (correct) {
            setTimeout(() => {
                onSubmit(answer, correct, timeSpent);
            }, 1000);
        }
    };

    const handleClose = () => {
        setUserAnswer('');
        setShowFeedback(false);
        onClose();
    };

    const handleWordSelect = (word: string, index: number) => {
        if (showFeedback) return;
        const newAvailable = [...availableWords];
        newAvailable.splice(index, 1);
        setAvailableWords(newAvailable);

        const newArranged = [...arrangedWords, word];
        setArrangedWords(newArranged);

        const isIntermediate = exerciseType === 'typing' && (exercise.difficulty === 3);
        setUserAnswer(newArranged.join(isIntermediate ? '' : ' '));
    };

    const handleWordDeselect = (word: string, index: number) => {
        if (showFeedback) return;
        const newArranged = [...arrangedWords];
        newArranged.splice(index, 1);
        setArrangedWords(newArranged);
        setAvailableWords([...availableWords, word]);

        const isIntermediate = exerciseType === 'typing' && (exercise.difficulty === 3);
        setUserAnswer(newArranged.join(isIntermediate ? '' : ' '));
    };

    const renderWordArrangement = () => (
        <View style={styles.wordArrangementSection}>
            <View style={styles.arrangedWordsArea}>
                {arrangedWords.length === 0 ? (
                    <Text style={styles.arrangedWordsPlaceholder}>Tap words to arrange them here</Text>
                ) : (
                    arrangedWords.map((word, index) => (
                        <TouchableOpacity
                            key={`arranged-${index}`}
                            style={styles.arrangedWordButton}
                            onPress={() => handleWordDeselect(word, index)}
                            disabled={showFeedback}
                        >
                            <Text style={styles.arrangedWordText}>{word}</Text>
                        </TouchableOpacity>
                    ))
                )}
            </View>
            <View style={styles.availableWordsArea}>
                {availableWords.map((word, index) => (
                    <TouchableOpacity
                        key={`available-${index}`}
                        style={styles.availableWordButton}
                        onPress={() => handleWordSelect(word, index)}
                        disabled={showFeedback}
                    >
                        <Text style={styles.availableWordText}>{word}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );

    // For Multiple Choice
    const renderMultipleChoice = () => {
        if (!exercise.options) return null;

        return (
            <View style={styles.optionsContainer}>
                {exercise.options.map((option, index) => {
                    const isSelected = userAnswer === option;
                    let backgroundColor = '#FFFFFF';
                    let borderColor = '#E5E7EB';
                    let textColor = '#1F2937';

                    if (showFeedback) {
                        if (option === exercise.answer) {
                            backgroundColor = '#D1FAE5'; // Green for correct
                            borderColor = '#059669';
                            textColor = '#065F46';
                        } else if (isSelected && !isCorrect) {
                            backgroundColor = '#FEE2E2'; // Red for wrong selection
                            borderColor = '#DC2626';
                            textColor = '#991B1B';
                        } else {
                            // Dim others
                            textColor = '#9CA3AF';
                        }
                    } else if (isSelected) {
                        backgroundColor = '#BFDBFE'; // Blue for selected
                        borderColor = '#2563EB';
                        textColor = '#1E40AF';
                    }

                    return (
                        <TouchableOpacity
                            key={index}
                            style={[styles.optionButton, { backgroundColor, borderColor }]}
                            onPress={() => !showFeedback && setUserAnswer(option)}
                            disabled={showFeedback}
                        >
                            <Text style={[styles.optionText, { color: textColor }]}>{option}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    };

    // For Fill in Blank
    const renderFillBlank = () => {
        if (!exercise.wordBank) return null;

        const parts = exercise.question.split(/_+/);

        return (
            <View>
                <Text style={styles.fillBlankSentence}>
                    {parts[0]}
                    <Text style={{ fontWeight: 'bold', color: AppColors.primaryMid, textDecorationLine: 'underline' }}>
                        {userAnswer || '_______'}
                    </Text>
                    {parts.length > 1 ? parts[1] : ''}
                </Text>

                <View style={styles.wordBankContainer}>
                    {exercise.wordBank.map((word, index) => (
                        <TouchableOpacity
                            key={index}
                            style={[
                                styles.wordBankButton,
                                userAnswer === word && styles.wordBankButtonSelected
                            ]}
                            onPress={() => !showFeedback && setUserAnswer(word)}
                            disabled={showFeedback}
                        >
                            <Text style={[
                                styles.wordBankText,
                                userAnswer === word && styles.wordBankTextSelected
                            ]}>{word}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>
        );
    };

    const renderTextInput = () => (
        <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Your Answer</Text>
            <TextInput
                style={styles.input}
                value={userAnswer}
                onChangeText={setUserAnswer}
                placeholder={`Type your ${targetLanguage} answer here...`}
                placeholderTextColor="#9CA3AF"
                editable={!showFeedback}
                onSubmitEditing={handleTextSubmit}
            />
        </View>
    );

    const renderFeedback = () => (
        <View
            style={[
                styles.feedbackBox,
                isCorrect ? styles.feedbackSuccess : styles.feedbackError,
            ]}
        >
            <View style={styles.feedbackHeader}>
                <Text style={styles.feedbackIcon}>
                    {isCorrect ? '✅' : '❌'}
                </Text>
                <View>
                    <Text
                        style={[
                            styles.feedbackTitle,
                            isCorrect
                                ? styles.feedbackTitleSuccess
                                : styles.feedbackTitleError,
                        ]}
                    >
                        {isCorrect ? 'Correct!' : 'Not quite right'}
                    </Text>
                    <Text style={styles.feedbackSubtitle}>
                        {isCorrect ? 'Great job!' : 'Try again'}
                    </Text>
                </View>
            </View>

            {!isCorrect && (
                <View style={styles.correctAnswerBox}>
                    <Text style={styles.correctAnswerLabel}>
                        Correct answer:
                    </Text>
                    <Text style={styles.correctAnswerText}>
                        {String(exercise.answer)}
                    </Text>
                </View>
            )}

            {isCorrect ? (
                isContinuousMode ? (
                    <View style={styles.xpRewardBox}>
                        <Text style={styles.xpRewardIcon}>✨</Text>
                        <View>
                            <Text style={styles.xpRewardTitle}>Correct!</Text>
                            <Text style={styles.xpRewardSubtitle}>Loading next exercise...</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.xpRewardBox}>
                        <Text style={styles.xpRewardIcon}>⚡</Text>
                        <View>
                            <Text style={styles.xpRewardTitle}>+25 XP Earned!</Text>
                            <Text style={styles.xpRewardSubtitle}>
                                Exercise completed
                            </Text>
                        </View>
                    </View>
                )
            ) : (
                <TouchableOpacity
                    style={styles.tryAgainButton}
                    onPress={() => {
                        setShowFeedback(false);
                        // Keep answer so they can edit it, or clear it?
                        // Usually keep it so they can fix a typo.
                    }}
                >
                    <Text style={styles.tryAgainText}>Try Again</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderContent = () => {
        if (showFeedback) {
            return renderFeedback();
        }

        // Service 'tts' = Speaking Practice (User Speaks) -> Component 'stt' (Recording)
        // Service 'stt' = Listening Practice (User Types) -> Standard Input + TTS Play button

        const isSpeakingExercise = exerciseType === 'tts';

        return (
            <>
                {/* Progress Indicator */}
                {totalExercises && currentExerciseIndex && (
                    <View style={{
                        flexDirection: 'row',
                        justifyContent: 'center',
                        marginBottom: 16,
                        alignItems: 'center'
                    }}>
                        <Text style={{ color: '#6B7280', fontSize: 13, fontWeight: '600' }}>
                            Exercise {currentExerciseIndex} / {totalExercises}
                        </Text>
                    </View>
                )}

                <View style={styles.questionSection}>
                    <Text style={styles.questionLabel}>
                        {exerciseType === 'tts' ? 'Speaking Practice' :
                            exerciseType === 'stt' ? 'Listening Practice' :
                                exercise.type === 'multiple-choice' ? 'Select the Correct Answer' :
                                    exercise.type === 'fill-blank' ? 'Fill in the Blank' :
                                        'Translate / Answer'}
                    </Text>

                    {/* Don't show question box for fill-blank as it is part of the UI */}
                    {!exercise.wordBank && (
                        <View style={styles.questionBox}>
                            <Text style={styles.questionText}>{exercise.question}</Text>
                        </View>
                    )}

                    {exercise.hint && (
                        <View style={styles.hintContainer}>
                            <Text style={styles.hintIcon}>💡</Text>
                            <Text style={styles.hintText}>Hint: {exercise.hint}</Text>
                        </View>
                    )}
                </View>

                {isSpeakingExercise ? (
                    <VoiceExerciseComponent
                        exerciseType="stt" // Component 'stt' means Recording/STT
                        question={exercise.question}
                        expectedAnswer={exercise.answer}
                        onAnswerSubmit={handleVoiceAnswer}
                        targetLanguage={targetLanguage}
                    />
                ) : (
                    <>
                        {exerciseType === 'typing' ? (
                            renderWordArrangement()
                        ) : exercise.options && Array.isArray(exercise.options) ? (
                            renderMultipleChoice()
                        ) : exercise.wordBank && Array.isArray(exercise.wordBank) ? (
                            renderFillBlank()
                        ) : exerciseType === 'stt' ? (
                            <>
                                <VoiceExerciseComponent
                                    exerciseType="tts"
                                    question=""
                                    expectedAnswer={exercise.answer}
                                    onAnswerSubmit={() => { }}
                                    hideInstructions={true}
                                    targetLanguage={targetLanguage}
                                />
                                {renderWordArrangement()}
                            </>
                        ) : (
                            renderTextInput()
                        )}

                        <TouchableOpacity
                            onPress={handleTextSubmit}
                            disabled={!String(userAnswer).trim() || showFeedback}
                            style={[
                                styles.submitButton,
                                (!String(userAnswer).trim() || showFeedback) && styles.submitButtonDisabled,
                            ]}
                        >
                            <Text style={styles.submitButtonText}>Check Answer</Text>
                        </TouchableOpacity>
                    </>
                )}

                {!isSpeakingExercise && !isCorrect && (
                    <TouchableOpacity
                        onPress={() => {
                            if (onSkip) {
                                onSkip();
                            } else {
                                handleClose();
                            }
                        }}
                        style={styles.skipButton}
                    >
                        <Text style={styles.skipButtonText}>Skip</Text>
                    </TouchableOpacity>
                )}
            </>
        );
    };

    return (
        <Modal
            visible={isOpen}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    <LinearGradient
                        colors={getGradientColors()}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.header}
                    >
                        <TouchableOpacity
                            onPress={handleClose}
                            style={styles.closeButton}
                        >
                            <Text style={styles.closeIcon}>✕</Text>
                        </TouchableOpacity>

                        <View style={styles.headerContent}>
                            <Text style={styles.headerIcon}>{getExerciseIcon()}</Text>
                            <View>
                                <Text style={styles.headerTitle}>{getExerciseTitle()}</Text>
                                <Text style={styles.headerSubtitle}>
                                    {targetLanguage} Practice
                                </Text>
                            </View>
                        </View>
                    </LinearGradient>

                    <KeyboardAvoidingView
                        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                        style={styles.keyboardAvoid}
                    >
                        <ScrollView style={styles.contentScroll} contentContainerStyle={styles.content}>
                            {renderContent()}
                        </ScrollView>
                    </KeyboardAvoidingView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    modalContainer: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        width: '100%',
        maxWidth: 500,
        maxHeight: '90%',
        overflow: 'hidden',
    },
    header: {
        padding: 24,
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1,
    },
    closeIcon: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headerIcon: {
        fontSize: 40,
        marginRight: 12,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    headerSubtitle: {
        fontSize: 13,
        color: '#FFFFFF',
        opacity: 0.9,
    },
    keyboardAvoid: {
        flexShrink: 1,
    },
    contentScroll: {
        maxHeight: 400,
    },
    content: {
        padding: 24,
    },
    questionSection: {
        marginBottom: 16,
    },
    questionLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: AppColors.textSecondary,
        marginBottom: 8,
    },
    questionBox: {
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    questionText: {
        fontSize: 16,
        fontWeight: '500',
        color: AppColors.primaryMid,
    },
    hintContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    hintIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    hintText: {
        fontSize: 13,
        color: AppColors.textSecondary,
        flex: 1,
    },
    inputSection: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: AppColors.textSecondary,
        marginBottom: 8,
    },
    input: {
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        fontSize: 16,
        color: AppColors.primaryMid,
    },
    submitButton: {
        backgroundColor: '#2F5FED',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    skipButton: {
        marginTop: 12,
        alignItems: 'center',
        padding: 8,
    },
    skipButtonText: {
        color: AppColors.textSecondary,
        fontSize: 14,
    },
    feedbackBox: {
        borderRadius: 16,
        padding: 24,
        marginTop: 16,
    },
    feedbackSuccess: {
        backgroundColor: '#DCFCE7',
    },
    feedbackError: {
        backgroundColor: '#FEE2E2',
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    feedbackIcon: {
        fontSize: 40,
        marginRight: 12,
    },
    feedbackTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    feedbackTitleSuccess: {
        color: '#16A34A',
    },
    feedbackTitleError: {
        color: '#DC2626',
    },
    feedbackSubtitle: {
        fontSize: 13,
        color: AppColors.textSecondary,
    },
    correctAnswerBox: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
    },
    correctAnswerLabel: {
        fontSize: 13,
        color: AppColors.textSecondary,
        marginBottom: 4,
    },
    correctAnswerText: {
        fontSize: 16,
        fontWeight: '600',
        color: AppColors.primaryMid,
    },
    xpRewardBox: {
        backgroundColor: '#FEF3C7',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    xpRewardIcon: {
        fontSize: 24,
        marginRight: 8,
    },
    xpRewardTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#92400E',
    },
    xpRewardSubtitle: {
        fontSize: 11,
        color: '#92400E',
    },
    // New Styles
    optionsContainer: {
        marginTop: 20,
        gap: 12,
    },
    optionButton: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    optionText: {
        fontSize: 16,
        textAlign: 'center',
        fontWeight: '500',
        color: '#1F2937',
    },
    fillBlankSentence: {
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 32,
        color: '#374151',
    },
    wordBankContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 10,
    },
    wordBankButton: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    wordBankButtonSelected: {
        backgroundColor: '#DBEAFE',
        borderColor: '#3B82F6',
    },
    wordBankText: {
        fontSize: 16,
        color: '#4B5563',
        fontWeight: '500',
    },
    wordBankTextSelected: {
        color: '#1E40AF',
    },
    tryAgainButton: {
        backgroundColor: '#EF4444',
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 12,
    },
    tryAgainText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    wordArrangementSection: {
        marginBottom: 16,
    },
    arrangedWordsArea: {
        minHeight: 60,
        backgroundColor: '#F9FAFB',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
        alignItems: 'center',
    },
    arrangedWordsPlaceholder: {
        color: '#9CA3AF',
        fontSize: 15,
        fontStyle: 'italic',
    },
    arrangedWordButton: {
        backgroundColor: '#2F5FED',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    arrangedWordText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    availableWordsArea: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    availableWordButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#2F5FED',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
    },
    availableWordText: {
        color: '#2F5FED',
        fontSize: 16,
        fontWeight: '500',
    },
});
