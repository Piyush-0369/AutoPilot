// ============================================================
// ConversationFeedbackOverlay
// ============================================================
// Slide-up overlay after each user turn showing:
//   - Pronunciation score indicator
//   - Grammar correction with explanation
//   - Vocabulary feedback
//   - Suggested alternative phrasing

import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
    Dimensions,
} from 'react-native';
import { AppColors } from '../theme';
import type { ConversationTurnFeedback } from '../types/learningTypes';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ConversationFeedbackOverlayProps {
    feedback: ConversationTurnFeedback | null;
    visible: boolean;
    onDismiss: () => void;
    autoDismissMs?: number;
}

export const ConversationFeedbackOverlay: React.FC<ConversationFeedbackOverlayProps> = ({
    feedback,
    visible,
    onDismiss,
    autoDismissMs = 4000,
}) => {
    const slideAnim = useRef(new Animated.Value(200)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible && feedback) {
            Animated.parallel([
                Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 80, friction: 10 }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();

            // Auto-dismiss
            const timer = setTimeout(() => {
                dismiss();
            }, autoDismissMs);
            return () => clearTimeout(timer);
        }
    }, [visible, feedback]);

    const dismiss = () => {
        Animated.parallel([
            Animated.timing(slideAnim, { toValue: 200, duration: 250, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start(() => onDismiss());
    };

    if (!visible || !feedback) return null;

    const getScoreColor = (score: number) => {
        if (score >= 80) return AppColors.accentGreen;
        if (score >= 50) return '#F59E0B';
        return '#EF4444';
    };

    const getScoreEmoji = (score: number) => {
        if (score >= 90) return '🌟';
        if (score >= 70) return '✅';
        if (score >= 50) return '💡';
        return '⚠️';
    };

    return (
        <Animated.View
            style={[
                styles.container,
                { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
            ]}
        >
            <TouchableOpacity onPress={dismiss} activeOpacity={0.9} style={styles.touchArea}>
                {/* Score Row */}
                <View style={styles.scoreRow}>
                    <View style={styles.scoreItem}>
                        <Text style={styles.scoreEmoji}>🗣️</Text>
                        <View style={[styles.scoreBar, { backgroundColor: getScoreColor(feedback.pronunciationScore) + '30' }]}>
                            <View style={[styles.scoreFill, {
                                width: `${feedback.pronunciationScore}%`,
                                backgroundColor: getScoreColor(feedback.pronunciationScore),
                            }]} />
                        </View>
                        <Text style={[styles.scoreValue, { color: getScoreColor(feedback.pronunciationScore) }]}>
                            {feedback.pronunciationScore}
                        </Text>
                    </View>

                    <View style={styles.scoreItem}>
                        <Text style={styles.scoreEmoji}>📝</Text>
                        <View style={[styles.scoreBar, { backgroundColor: getScoreColor(feedback.grammarScore) + '30' }]}>
                            <View style={[styles.scoreFill, {
                                width: `${feedback.grammarScore}%`,
                                backgroundColor: getScoreColor(feedback.grammarScore),
                            }]} />
                        </View>
                        <Text style={[styles.scoreValue, { color: getScoreColor(feedback.grammarScore) }]}>
                            {feedback.grammarScore}
                        </Text>
                    </View>

                    <View style={styles.scoreItem}>
                        <Text style={styles.scoreEmoji}>📚</Text>
                        <View style={[styles.scoreBar, { backgroundColor: getScoreColor(feedback.vocabularyScore) + '30' }]}>
                            <View style={[styles.scoreFill, {
                                width: `${feedback.vocabularyScore}%`,
                                backgroundColor: getScoreColor(feedback.vocabularyScore),
                            }]} />
                        </View>
                        <Text style={[styles.scoreValue, { color: getScoreColor(feedback.vocabularyScore) }]}>
                            {feedback.vocabularyScore}
                        </Text>
                    </View>
                </View>

                {/* Correction */}
                {!feedback.isGrammarCorrect && feedback.correction && (
                    <View style={styles.correctionCard}>
                        <View style={styles.correctionHeader}>
                            <Text style={styles.correctionIcon}>✏️</Text>
                            <Text style={styles.correctionLabel}>
                                {feedback.errorCategory ? feedback.errorCategory.replace('-', ' ') : 'correction'}
                            </Text>
                        </View>
                        <Text style={styles.correctionText}>{feedback.correction}</Text>
                        {feedback.explanation && (
                            <Text style={styles.explanationText}>{feedback.explanation}</Text>
                        )}
                    </View>
                )}

                {/* Suggested Alternative */}
                {feedback.suggestedAlternative && feedback.isGrammarCorrect && (
                    <View style={styles.suggestionCard}>
                        <Text style={styles.suggestionLabel}>💡 Try also:</Text>
                        <Text style={styles.suggestionText}>{feedback.suggestedAlternative}</Text>
                    </View>
                )}

                {/* Overall indicator */}
                <Text style={styles.overallEmoji}>
                    {getScoreEmoji(Math.round((feedback.pronunciationScore + feedback.grammarScore + feedback.vocabularyScore) / 3))}
                </Text>
            </TouchableOpacity>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 80,
        left: 12,
        right: 12,
        backgroundColor: AppColors.surfaceCard,
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: AppColors.accentCyan + '40',
        elevation: 12,
        shadowColor: AppColors.accentCyan,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    touchArea: {
        flex: 1,
    },
    scoreRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    scoreItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    scoreEmoji: {
        fontSize: 14,
    },
    scoreBar: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    scoreFill: {
        height: '100%',
        borderRadius: 3,
    },
    scoreValue: {
        fontSize: 12,
        fontWeight: '700',
        minWidth: 24,
        textAlign: 'right',
    },
    correctionCard: {
        marginTop: 12,
        backgroundColor: '#EF444415',
        borderRadius: 12,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: '#EF4444',
    },
    correctionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    correctionIcon: {
        fontSize: 14,
    },
    correctionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#EF4444',
        textTransform: 'uppercase',
    },
    correctionText: {
        fontSize: 14,
        color: AppColors.textPrimary,
        fontWeight: '600',
    },
    explanationText: {
        fontSize: 12,
        color: AppColors.textSecondary,
        marginTop: 4,
        fontStyle: 'italic',
    },
    suggestionCard: {
        marginTop: 12,
        backgroundColor: AppColors.accentCyan + '15',
        borderRadius: 12,
        padding: 12,
        borderLeftWidth: 3,
        borderLeftColor: AppColors.accentCyan,
    },
    suggestionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: AppColors.accentCyan,
        marginBottom: 4,
    },
    suggestionText: {
        fontSize: 14,
        color: AppColors.textPrimary,
    },
    overallEmoji: {
        position: 'absolute',
        top: -12,
        right: 12,
        fontSize: 24,
    },
});
