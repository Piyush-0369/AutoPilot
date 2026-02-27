// ============================================================
// ConversationReportCard
// ============================================================
// End-of-session report card with:
//   - Skill radar visualization (4 axes)
//   - Error category breakdown
//   - Top words to review
//   - XP earned + objective progress

import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AppColors } from '../theme';
import type { ConversationSessionReport, ErrorCategory } from '../types/learningTypes';

interface ConversationReportCardProps {
    report: ConversationSessionReport;
    onPracticeAgain: () => void;
    onClose: () => void;
}

const SCORE_LABELS = [
    { key: 'fluencyScore', label: 'Fluency', icon: '🗣️', color: AppColors.accentCyan },
    { key: 'grammarScore', label: 'Grammar', icon: '📝', color: AppColors.accentViolet },
    { key: 'vocabularyScore', label: 'Vocabulary', icon: '📚', color: AppColors.accentGreen },
    { key: 'confidenceScore', label: 'Confidence', icon: '💪', color: '#F59E0B' },
] as const;

const ERROR_ICONS: Record<ErrorCategory, string> = {
    'tense': '⏰', 'word-order': '🔀', 'missing-particle': '🔗',
    'conjugation': '🔄', 'gender-agreement': '⚧️', 'formality': '🎩',
    'vocabulary': '📖', 'pronunciation': '🗣️', 'spelling': '✏️', 'other': '❓',
};

export const ConversationReportCard: React.FC<ConversationReportCardProps> = ({
    report, onPracticeAgain, onClose,
}) => {
    const getGrade = (score: number): { letter: string; color: string } => {
        if (score >= 90) return { letter: 'A+', color: AppColors.accentGreen };
        if (score >= 80) return { letter: 'A', color: AppColors.accentGreen };
        if (score >= 70) return { letter: 'B', color: AppColors.accentCyan };
        if (score >= 60) return { letter: 'C', color: '#F59E0B' };
        return { letter: 'D', color: '#EF4444' };
    };

    const grade = getGrade(report.overallScore);

    // Filter out zero-count error categories
    const activeErrors = Object.entries(report.errorBreakdown)
        .filter(([_, count]) => count > 0)
        .sort(([, a], [, b]) => b - a);

    return (
        <View style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.title}>Session Complete!</Text>
                    <View style={[styles.gradeBadge, { backgroundColor: grade.color + '20', borderColor: grade.color }]}>
                        <Text style={[styles.gradeText, { color: grade.color }]}>{grade.letter}</Text>
                    </View>
                </View>

                {/* Overall Score */}
                <View style={styles.overallScoreContainer}>
                    <Text style={styles.overallScoreValue}>{report.overallScore}</Text>
                    <Text style={styles.overallScoreLabel}>Overall Score</Text>
                </View>

                {/* Skill Bars (Radar-style vertical bars) */}
                <View style={styles.skillSection}>
                    <Text style={styles.sectionTitle}>Skills Breakdown</Text>
                    {SCORE_LABELS.map(({ key, label, icon, color }) => {
                        const score = report[key];
                        return (
                            <View key={key} style={styles.skillRow}>
                                <Text style={styles.skillIcon}>{icon}</Text>
                                <Text style={styles.skillLabel}>{label}</Text>
                                <View style={styles.skillBarBg}>
                                    <View style={[styles.skillBarFill, { width: `${score}%`, backgroundColor: color }]} />
                                </View>
                                <Text style={[styles.skillValue, { color }]}>{score}</Text>
                            </View>
                        );
                    })}
                </View>

                {/* Stats Row */}
                <View style={styles.statsRow}>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>💬</Text>
                        <Text style={styles.statValue}>{report.totalTurns}</Text>
                        <Text style={styles.statLabel}>Turns</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>🎯</Text>
                        <Text style={styles.statValue}>
                            {report.objectivesCompleted.length}/{report.objectivesTotal.length}
                        </Text>
                        <Text style={styles.statLabel}>Objectives</Text>
                    </View>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>⚡</Text>
                        <Text style={[styles.statValue, { color: AppColors.accentGreen }]}>{report.xpEarned}</Text>
                        <Text style={styles.statLabel}>XP Earned</Text>
                    </View>
                </View>

                {/* Error Breakdown */}
                {activeErrors.length > 0 && (
                    <View style={styles.errorSection}>
                        <Text style={styles.sectionTitle}>Error Analysis</Text>
                        {activeErrors.map(([category, count]) => (
                            <View key={category} style={styles.errorRow}>
                                <Text style={styles.errorIcon}>
                                    {ERROR_ICONS[category as ErrorCategory] || '❓'}
                                </Text>
                                <Text style={styles.errorLabel}>
                                    {category.replace(/-/g, ' ')}
                                </Text>
                                <View style={styles.errorCountBadge}>
                                    <Text style={styles.errorCountText}>{count}×</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {/* Weak Vocabulary */}
                {report.weakVocabulary.length > 0 && (
                    <View style={styles.vocabSection}>
                        <Text style={styles.sectionTitle}>📖 Words to Review</Text>
                        <View style={styles.vocabChips}>
                            {report.weakVocabulary.slice(0, 5).map((vocabId, idx) => (
                                <View key={idx} style={styles.vocabChip}>
                                    <Text style={styles.vocabChipText}>{vocabId}</Text>
                                </View>
                            ))}
                        </View>
                    </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionsContainer}>
                    <TouchableOpacity onPress={onPracticeAgain} style={styles.primaryAction}>
                        <LinearGradient
                            colors={[AppColors.accentCyan, '#06B6D4']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.primaryActionGradient}
                        >
                            <Text style={styles.primaryActionIcon}>🔄</Text>
                            <Text style={styles.primaryActionText}>Practice Again</Text>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={onClose} style={styles.secondaryAction}>
                        <Text style={styles.secondaryActionText}>Back to Scenarios</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: AppColors.primaryDark },
    scrollContent: { padding: 24, paddingBottom: 40 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
    title: { fontSize: 26, fontWeight: '800', color: AppColors.textPrimary },
    gradeBadge: {
        width: 52, height: 52, borderRadius: 26, borderWidth: 2,
        justifyContent: 'center', alignItems: 'center',
    },
    gradeText: { fontSize: 20, fontWeight: '900' },

    overallScoreContainer: { alignItems: 'center', marginBottom: 28 },
    overallScoreValue: { fontSize: 64, fontWeight: '900', color: AppColors.accentCyan },
    overallScoreLabel: { fontSize: 14, color: AppColors.textSecondary, fontWeight: '600' },

    skillSection: { marginBottom: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '700', color: AppColors.textPrimary, marginBottom: 12 },
    skillRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
    skillIcon: { fontSize: 16, width: 24 },
    skillLabel: { fontSize: 13, color: AppColors.textSecondary, width: 80, fontWeight: '600' },
    skillBarBg: { flex: 1, height: 8, borderRadius: 4, backgroundColor: AppColors.textMuted + '20', overflow: 'hidden' },
    skillBarFill: { height: '100%', borderRadius: 4 },
    skillValue: { fontSize: 14, fontWeight: '700', width: 32, textAlign: 'right' },

    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
    statCard: {
        flex: 1, backgroundColor: AppColors.surfaceCard, borderRadius: 16,
        padding: 16, alignItems: 'center', borderWidth: 1, borderColor: AppColors.textMuted + '15',
    },
    statIcon: { fontSize: 20, marginBottom: 4 },
    statValue: { fontSize: 22, fontWeight: '800', color: AppColors.textPrimary },
    statLabel: { fontSize: 11, color: AppColors.textSecondary, fontWeight: '600', marginTop: 2 },

    errorSection: { marginBottom: 24 },
    errorRow: {
        flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8,
        borderBottomWidth: 1, borderBottomColor: AppColors.textMuted + '10',
    },
    errorIcon: { fontSize: 18 },
    errorLabel: { flex: 1, fontSize: 14, color: AppColors.textSecondary, textTransform: 'capitalize' },
    errorCountBadge: {
        backgroundColor: '#EF444420', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10,
    },
    errorCountText: { fontSize: 13, fontWeight: '700', color: '#EF4444' },

    vocabSection: { marginBottom: 24 },
    vocabChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    vocabChip: {
        backgroundColor: AppColors.accentCyan + '20', paddingHorizontal: 14, paddingVertical: 6,
        borderRadius: 20, borderWidth: 1, borderColor: AppColors.accentCyan + '40',
    },
    vocabChipText: { fontSize: 13, color: AppColors.accentCyan, fontWeight: '600' },

    actionsContainer: { marginTop: 8, gap: 12 },
    primaryAction: {},
    primaryActionGradient: {
        flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center',
        alignItems: 'center', gap: 10, elevation: 8,
        shadowColor: AppColors.accentCyan,
        shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20,
    },
    primaryActionIcon: { fontSize: 20 },
    primaryActionText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

    secondaryAction: {
        height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: AppColors.textMuted + '30',
    },
    secondaryActionText: { fontSize: 14, color: AppColors.textSecondary, fontWeight: '600' },
});
