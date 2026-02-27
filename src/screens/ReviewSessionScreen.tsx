// ============================================================
// Review Session Screen — SRS Word Review
// ============================================================
// Dedicated screen for reviewing due vocabulary words using
// the spaced repetition system.

import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Platform,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppColors } from '../theme';
import { useUserProgress } from '../services/UserProgressService';
import { learningPathService } from '../services/LearningPathService';
import type { WordPerformance, VocabularyEntry } from '../types/learningTypes';
import { RootStackParamList } from '../navigation/types';

type ReviewSessionScreenProps = {
    navigation: StackNavigationProp<RootStackParamList, 'ReviewSession'>;
};

export const ReviewSessionScreen: React.FC<ReviewSessionScreenProps> = ({ navigation }) => {
    const userProgress = useUserProgress();
    const [isLoading, setIsLoading] = useState(true);
    const [dueWords, setDueWords] = useState<WordPerformance[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [vocab, setVocab] = useState<VocabularyEntry | undefined>();
    const [sessionResults, setSessionResults] = useState({ correct: 0, incorrect: 0 });
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        loadReviewWords();
    }, []);

    const loadReviewWords = async () => {
        setIsLoading(true);
        try {
            const due = await learningPathService.getDueReviewWords('default');
            setDueWords(due);
            if (due.length > 0) {
                loadVocab(due[0].vocabularyId);
            }
        } catch (e) {
            console.error('[Review] Load error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const loadVocab = (vocabId: string) => {
        const entry = learningPathService.getVocabularyById(vocabId);
        setVocab(entry);
    };

    const handleGrade = async (isCorrect: boolean) => {
        const currentWord = dueWords[currentIndex];
        if (!currentWord) return;

        // Record result
        await learningPathService.recordWordResult(
            'default',
            currentWord.vocabularyId,
            vocab?.word || '',
            isCorrect
        );

        setSessionResults(prev => ({
            correct: prev.correct + (isCorrect ? 1 : 0),
            incorrect: prev.incorrect + (isCorrect ? 0 : 1),
        }));

        // Next word
        if (currentIndex < dueWords.length - 1) {
            const nextIdx = currentIndex + 1;
            setCurrentIndex(nextIdx);
            setShowAnswer(false);
            loadVocab(dueWords[nextIdx].vocabularyId);
        } else {
            setIsComplete(true);
            // Award XP for review
            const xp = sessionResults.correct * 5 + 10;
            await userProgress.updateXP(xp);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={AppColors.accentCyan} />
                <Text style={styles.loadingText}>Loading review words...</Text>
            </View>
        );
    }

    // No words due
    if (dueWords.length === 0 && !isComplete) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.emptyEmoji}>🎉</Text>
                <Text style={styles.emptyTitle}>All caught up!</Text>
                <Text style={styles.emptySubtitle}>No words due for review right now. Keep learning to add more words!</Text>
                <TouchableOpacity style={styles.goBackButton} onPress={() => navigation.goBack()}>
                    <Text style={styles.goBackButtonText}>← Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Session complete
    if (isComplete) {
        const total = sessionResults.correct + sessionResults.incorrect;
        const accuracy = total > 0 ? Math.round((sessionResults.correct / total) * 100) : 0;
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.resultEmoji}>📊</Text>
                <Text style={styles.resultTitle}>Review Complete!</Text>
                <Text style={styles.resultSubtitle}>
                    {sessionResults.correct} correct, {sessionResults.incorrect} incorrect ({accuracy}%)
                </Text>
                <View style={styles.statsRow}>
                    <View style={[styles.statBadge, { backgroundColor: AppColors.accentGreen + '20' }]}>
                        <Text style={[styles.statNumber, { color: AppColors.accentGreen }]}>{sessionResults.correct}</Text>
                        <Text style={styles.statLabel}>Correct</Text>
                    </View>
                    <View style={[styles.statBadge, { backgroundColor: '#EF4444' + '20' }]}>
                        <Text style={[styles.statNumber, { color: '#EF4444' }]}>{sessionResults.incorrect}</Text>
                        <Text style={styles.statLabel}>Incorrect</Text>
                    </View>
                </View>
                <TouchableOpacity style={styles.doneButton} onPress={() => navigation.goBack()}>
                    <LinearGradient
                        colors={[AppColors.accentCyan, '#06B6D4']}
                        style={styles.doneButtonGradient}
                    >
                        <Text style={styles.doneButtonText}>Done</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </View>
        );
    }

    // Active review
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>✕</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>Review</Text>
                    <Text style={styles.headerSubtitle}>{currentIndex + 1} / {dueWords.length}</Text>
                </View>
                <View style={{ width: 40 }} />
            </View>

            {/* Progress */}
            <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${((currentIndex + 1) / dueWords.length) * 100}%` }]} />
            </View>

            {/* Card */}
            <View style={styles.cardArea}>
                {vocab ? (
                    <TouchableOpacity
                        style={styles.card}
                        activeOpacity={0.95}
                        onPress={() => setShowAnswer(true)}
                    >
                        <Text style={styles.cardWord}>{vocab.nativeScript}</Text>
                        <Text style={styles.cardPhonetic}>{vocab.phonetic}</Text>

                        {showAnswer ? (
                            <View style={styles.answerArea}>
                                <View style={styles.answerDivider} />
                                <Text style={styles.cardMeaning}>{vocab.meaning}</Text>
                                <Text style={styles.cardExample}>{vocab.exampleSentence}</Text>
                                <Text style={styles.cardExampleTranslation}>{vocab.exampleTranslation}</Text>
                            </View>
                        ) : (
                            <Text style={styles.tapHint}>Tap to reveal answer</Text>
                        )}
                    </TouchableOpacity>
                ) : (
                    <Text style={styles.loadingText}>Loading...</Text>
                )}
            </View>

            {/* Grade Buttons */}
            {showAnswer && (
                <View style={styles.gradeRow}>
                    <TouchableOpacity
                        style={[styles.gradeButton, styles.gradeFail]}
                        onPress={() => handleGrade(false)}
                    >
                        <Text style={styles.gradeEmoji}>😕</Text>
                        <Text style={[styles.gradeText, { color: '#EF4444' }]}>Again</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.gradeButton, styles.gradeHard]}
                        onPress={() => handleGrade(true)}
                    >
                        <Text style={styles.gradeEmoji}>🤔</Text>
                        <Text style={[styles.gradeText, { color: '#F59E0B' }]}>Hard</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.gradeButton, styles.gradeGood]}
                        onPress={() => handleGrade(true)}
                    >
                        <Text style={styles.gradeEmoji}>😊</Text>
                        <Text style={[styles.gradeText, { color: AppColors.accentGreen }]}>Good</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.gradeButton, styles.gradeEasy]}
                        onPress={() => handleGrade(true)}
                    >
                        <Text style={styles.gradeEmoji}>⭐</Text>
                        <Text style={[styles.gradeText, { color: AppColors.accentCyan }]}>Easy</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, backgroundColor: '#F5F7FA' },
    loadingText: { marginTop: 16, fontSize: 16, color: AppColors.textSecondary },
    header: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 20, paddingVertical: 14,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 14 : 56,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6' },
    backButtonText: { fontSize: 18, color: '#374151', fontWeight: '600' },
    headerCenter: { alignItems: 'center' },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    headerSubtitle: { fontSize: 13, color: '#6B7280' },
    progressBar: { height: 4, backgroundColor: '#E5E7EB' },
    progressFill: { height: 4, backgroundColor: AppColors.accentCyan, borderRadius: 2 },
    cardArea: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
    card: {
        backgroundColor: '#FFFFFF', borderRadius: 24, padding: 32, width: '100%',
        alignItems: 'center', elevation: 4, shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12,
        borderWidth: 1, borderColor: '#F3F4F6', minHeight: 280,
    },
    cardWord: { fontSize: 44, fontWeight: '800', color: '#111827', textAlign: 'center', marginBottom: 8 },
    cardPhonetic: { fontSize: 18, color: AppColors.accentCyan, fontStyle: 'italic', marginBottom: 24 },
    tapHint: { fontSize: 15, color: '#9CA3AF', fontStyle: 'italic', marginTop: 20 },
    answerArea: { width: '100%', alignItems: 'center' },
    answerDivider: { width: '60%', height: 1, backgroundColor: '#E5E7EB', marginBottom: 20 },
    cardMeaning: { fontSize: 24, fontWeight: '700', color: '#111827', textAlign: 'center', marginBottom: 16 },
    cardExample: { fontSize: 15, color: '#374151', textAlign: 'center', lineHeight: 22 },
    cardExampleTranslation: { fontSize: 14, color: '#9CA3AF', fontStyle: 'italic', textAlign: 'center', marginTop: 4 },
    gradeRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 32, paddingTop: 16, gap: 8, backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#F3F4F6' },
    gradeButton: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 2 },
    gradeFail: { borderColor: '#EF4444' + '40', backgroundColor: '#EF4444' + '08' },
    gradeHard: { borderColor: '#F59E0B' + '40', backgroundColor: '#F59E0B' + '08' },
    gradeGood: { borderColor: AppColors.accentGreen + '40', backgroundColor: AppColors.accentGreen + '08' },
    gradeEasy: { borderColor: AppColors.accentCyan + '40', backgroundColor: AppColors.accentCyan + '08' },
    gradeEmoji: { fontSize: 22, marginBottom: 4 },
    gradeText: { fontSize: 12, fontWeight: '700' },
    emptyEmoji: { fontSize: 60, marginBottom: 20 },
    emptyTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
    emptySubtitle: { fontSize: 15, color: '#6B7280', textAlign: 'center', lineHeight: 22 },
    goBackButton: { marginTop: 24, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14, backgroundColor: AppColors.accentCyan + '15' },
    goBackButtonText: { fontSize: 15, fontWeight: '600', color: AppColors.accentCyan },
    resultEmoji: { fontSize: 60, marginBottom: 20 },
    resultTitle: { fontSize: 24, fontWeight: '800', color: '#111827', marginBottom: 8 },
    resultSubtitle: { fontSize: 15, color: '#6B7280', marginBottom: 24 },
    statsRow: { flexDirection: 'row', gap: 24, marginBottom: 32 },
    statBadge: { paddingHorizontal: 24, paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
    statNumber: { fontSize: 28, fontWeight: '800' },
    statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
    doneButton: { width: '100%' },
    doneButtonGradient: { height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    doneButtonText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
});
