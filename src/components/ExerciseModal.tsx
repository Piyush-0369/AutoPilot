import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AppColors } from '../theme';

// For daily exercises, we use a simplified type
export type DailyExerciseType = 'typing' | 'tts' | 'stt' | 'written';

interface Exercise {
    question: string;
    answer: string;
    type: string;
    hint?: string;
}

interface ExerciseModalProps {
    isOpen: boolean;
    onClose: () => void;
    exerciseType: DailyExerciseType;
    exercise: Exercise;
    onSubmit: (answer: string, isCorrect: boolean, timeSpent: number) => void;
}

export const ExerciseModal: React.FC<ExerciseModalProps> = ({
    isOpen,
    onClose,
    exerciseType,
    exercise,
    onSubmit,
}) => {
    const [userAnswer, setUserAnswer] = useState('');
    const [showFeedback, setShowFeedback] = useState(false);
    const [isCorrect, setIsCorrect] = useState(false);
    const [startTime] = useState(Date.now());

    const getExerciseIcon = () => {
        switch (exerciseType) {
            case 'typing':
                return '🔥';
            case 'tts':
                return '🗣️';
            case 'stt':
                return '🎤';
            case 'written':
                return '🔤';
        }
    };

    const getExerciseTitle = () => {
        switch (exerciseType) {
            case 'typing':
                return 'Typing Exercise';
            case 'tts':
                return 'Text-to-Speech Exercise';
            case 'stt':
                return 'Speech-to-Text Exercise';
            case 'written':
                return 'Written Practice';
        }
    };

    const handleSubmit = () => {
        const correct = userAnswer.trim().toLowerCase() === exercise.answer.toLowerCase();
        const timeSpent = Date.now() - startTime;
        setIsCorrect(correct);
        setShowFeedback(true);

        if (correct) {
            setTimeout(() => {
                onSubmit(userAnswer, correct, timeSpent);
                handleClose();
            }, 2000);
        }
    };

    const handleTryAgain = () => {
        setShowFeedback(false);
        setUserAnswer('');
    };

    const handleClose = () => {
        setUserAnswer('');
        setShowFeedback(false);
        onClose();
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
                    {/* Header */}
                    <LinearGradient
                        colors={['#2F5FED', '#1E40AF']}
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
                                <Text style={styles.headerSubtitle}>Daily Challenge</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Content */}
                    <View style={styles.content}>
                        {!showFeedback ? (
                            <>
                                {/* Question */}
                                <View style={styles.questionSection}>
                                    <Text style={styles.questionLabel}>{exercise.type}</Text>
                                    <View style={styles.questionBox}>
                                        <Text style={styles.questionText}>{exercise.question}</Text>
                                    </View>

                                    {exercise.hint && (
                                        <View style={styles.hintContainer}>
                                            <Text style={styles.hintIcon}>💡</Text>
                                            <Text style={styles.hintText}>Hint: {exercise.hint}</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Input */}
                                <View style={styles.inputSection}>
                                    <Text style={styles.inputLabel}>Your Answer</Text>
                                    <TextInput
                                        style={styles.input}
                                        value={userAnswer}
                                        onChangeText={setUserAnswer}
                                        placeholder="Type your answer here..."
                                        placeholderTextColor="#9CA3AF"
                                        autoFocus
                                        onSubmitEditing={handleSubmit}
                                    />
                                </View>

                                {/* Submit Button */}
                                <TouchableOpacity
                                    onPress={handleSubmit}
                                    disabled={!userAnswer.trim()}
                                    style={[
                                        styles.submitButton,
                                        !userAnswer.trim() && styles.submitButtonDisabled,
                                    ]}
                                >
                                    <Text style={styles.submitButtonText}>Check Answer</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                {/* Feedback */}
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
                                                {exercise.answer}
                                            </Text>
                                        </View>
                                    )}

                                    {isCorrect && (
                                        <View style={styles.xpRewardBox}>
                                            <Text style={styles.xpRewardIcon}>⚡</Text>
                                            <View>
                                                <Text style={styles.xpRewardTitle}>+25 XP Earned!</Text>
                                                <Text style={styles.xpRewardSubtitle}>
                                                    Daily challenge completed
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Action Buttons */}
                                {!isCorrect && (
                                    <TouchableOpacity
                                        onPress={handleTryAgain}
                                        style={styles.submitButton}
                                    >
                                        <Text style={styles.submitButtonText}>Try Again</Text>
                                    </TouchableOpacity>
                                )}
                            </>
                        )}
                    </View>
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
    content: {
        padding: 24,
    },
    questionSection: {
        marginBottom: 24,
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
        color: AppColors.textPrimary,
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
        marginBottom: 24,
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
        color: AppColors.textPrimary,
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
    feedbackBox: {
        borderRadius: 16,
        padding: 24,
        marginBottom: 24,
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
        color: AppColors.textPrimary,
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
});
