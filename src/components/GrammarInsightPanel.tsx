// ============================================================
// Grammar Insight Panel Component
// ============================================================
// Shown when a user makes a mistake — explains the grammar rule,
// highlights the error, and shows the correct structure.

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppColors } from '../theme';
import type { GrammarModule } from '../types/learningTypes';

interface GrammarInsightPanelProps {
    grammarModule?: GrammarModule;
    userAnswer?: string;
    correctAnswer: string;
    errorExplanation?: string;
    onDismiss?: () => void;
    onPracticeMore?: () => void;
}

export const GrammarInsightPanel: React.FC<GrammarInsightPanelProps> = ({
    grammarModule,
    userAnswer,
    correctAnswer,
    errorExplanation,
    onDismiss,
    onPracticeMore,
}) => {
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerIcon}>📖</Text>
                <Text style={styles.headerTitle}>Grammar Insight</Text>
            </View>

            {/* Error Highlight */}
            {userAnswer && (
                <View style={styles.errorSection}>
                    <View style={styles.answerRow}>
                        <Text style={styles.answerLabel}>Your answer:</Text>
                        <Text style={styles.userAnswer}>{userAnswer}</Text>
                    </View>
                    <View style={styles.answerRow}>
                        <Text style={styles.answerLabel}>Correct:</Text>
                        <Text style={styles.correctAnswer}>{correctAnswer}</Text>
                    </View>
                </View>
            )}

            {/* Error Explanation */}
            {errorExplanation && (
                <View style={styles.explanationBox}>
                    <Text style={styles.explanationIcon}>💡</Text>
                    <Text style={styles.explanationText}>{errorExplanation}</Text>
                </View>
            )}

            {/* Grammar Rule */}
            {grammarModule && (
                <View style={styles.ruleSection}>
                    <Text style={styles.ruleTitle}>{grammarModule.title}</Text>
                    <Text style={styles.ruleExplanation}>{grammarModule.explanation}</Text>

                    {/* Structure */}
                    <View style={styles.structureBox}>
                        <Text style={styles.structureLabel}>Structure</Text>
                        <Text style={styles.structureText}>{grammarModule.structure}</Text>
                    </View>

                    {/* Examples */}
                    {grammarModule.examples.slice(0, 2).map((example, idx) => (
                        <View key={idx} style={styles.exampleRow}>
                            <Text style={styles.exampleSentence}>{example.sentence}</Text>
                            <Text style={styles.exampleTranslation}>{example.translation}</Text>
                            {example.breakdown && (
                                <Text style={styles.exampleBreakdown}>{example.breakdown}</Text>
                            )}
                        </View>
                    ))}

                    {/* Common Mistakes */}
                    {grammarModule.commonMistakes.length > 0 && (
                        <View style={styles.mistakesSection}>
                            <Text style={styles.mistakesTitle}>⚠️ Common Mistakes</Text>
                            {grammarModule.commonMistakes.map((mistake, idx) => (
                                <Text key={idx} style={styles.mistakeText}>• {mistake}</Text>
                            ))}
                        </View>
                    )}
                </View>
            )}

            {/* Actions */}
            <View style={styles.actionsRow}>
                {onPracticeMore && (
                    <TouchableOpacity style={styles.practiceButton} onPress={onPracticeMore}>
                        <Text style={styles.practiceButtonText}>Practice This</Text>
                    </TouchableOpacity>
                )}
                {onDismiss && (
                    <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
                        <Text style={styles.dismissButtonText}>Got It</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: AppColors.surfaceCard,
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: AppColors.accentViolet + '30',
        elevation: 4,
        shadowColor: AppColors.accentViolet,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 16,
    },
    headerIcon: {
        fontSize: 24,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: AppColors.textPrimary,
    },
    errorSection: {
        backgroundColor: '#EF4444' + '15',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        borderLeftWidth: 3,
        borderLeftColor: '#EF4444',
    },
    answerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
        gap: 8,
    },
    answerLabel: {
        fontSize: 13,
        color: AppColors.textMuted,
        fontWeight: '600',
        width: 90,
    },
    userAnswer: {
        fontSize: 15,
        color: '#EF4444',
        fontWeight: '600',
        textDecorationLine: 'line-through',
        flex: 1,
    },
    correctAnswer: {
        fontSize: 15,
        color: AppColors.accentGreen,
        fontWeight: '700',
        flex: 1,
    },
    explanationBox: {
        flexDirection: 'row',
        backgroundColor: AppColors.accentCyan + '15',
        borderRadius: 12,
        padding: 14,
        marginBottom: 16,
        gap: 10,
        alignItems: 'flex-start',
    },
    explanationIcon: {
        fontSize: 18,
        marginTop: 2,
    },
    explanationText: {
        fontSize: 14,
        color: AppColors.textPrimary,
        lineHeight: 22,
        flex: 1,
    },
    ruleSection: {
        marginBottom: 16,
    },
    ruleTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: AppColors.accentViolet,
        marginBottom: 8,
    },
    ruleExplanation: {
        fontSize: 14,
        color: AppColors.textSecondary,
        lineHeight: 22,
        marginBottom: 12,
    },
    structureBox: {
        backgroundColor: AppColors.primaryDark + '50',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
    },
    structureLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: AppColors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    structureText: {
        fontSize: 16,
        fontWeight: '600',
        color: AppColors.accentCyan,
        fontFamily: 'monospace',
    },
    exampleRow: {
        backgroundColor: AppColors.primaryDark + '30',
        borderRadius: 10,
        padding: 12,
        marginBottom: 8,
    },
    exampleSentence: {
        fontSize: 15,
        color: AppColors.textPrimary,
        fontWeight: '600',
        marginBottom: 2,
    },
    exampleTranslation: {
        fontSize: 13,
        color: AppColors.textSecondary,
        fontStyle: 'italic',
        marginBottom: 4,
    },
    exampleBreakdown: {
        fontSize: 12,
        color: AppColors.textMuted,
        fontFamily: 'monospace',
    },
    mistakesSection: {
        marginTop: 8,
    },
    mistakesTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F59E0B',
        marginBottom: 6,
    },
    mistakeText: {
        fontSize: 13,
        color: AppColors.textSecondary,
        lineHeight: 20,
        marginBottom: 4,
        paddingLeft: 4,
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 12,
    },
    practiceButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: AppColors.accentViolet + '20',
        borderWidth: 1,
        borderColor: AppColors.accentViolet + '40',
    },
    practiceButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: AppColors.accentViolet,
    },
    dismissButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        backgroundColor: AppColors.accentGreen,
    },
    dismissButtonText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFFFFF',
    },
});
