// ============================================================
// Vocabulary Card View Component
// ============================================================
// Flashcard-style component showing vocabulary with native script,
// phonetics, meaning, example, and audio playback button.

import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    Animated,
} from 'react-native';
import { RunAnywhere } from '@runanywhere/core';
import { AppColors } from '../theme';
import type { VocabularyEntry } from '../types/learningTypes';

interface VocabularyCardViewProps {
    vocabulary: VocabularyEntry;
    onNext?: () => void;
    onPrevious?: () => void;
    currentIndex?: number;
    totalCards?: number;
    showProgress?: boolean;
}

export const VocabularyCardView: React.FC<VocabularyCardViewProps> = ({
    vocabulary,
    onNext,
    onPrevious,
    currentIndex = 0,
    totalCards = 1,
    showProgress = true,
}) => {
    const [isFlipped, setIsFlipped] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);

    const handlePlayAudio = async () => {
        try {
            setIsSpeaking(true);
            await RunAnywhere.speak(vocabulary.nativeScript || vocabulary.word);
        } catch (e) {
            console.warn('[VocabCard] TTS error:', e);
        } finally {
            setIsSpeaking(false);
        }
    };

    const handlePlayExample = async () => {
        try {
            setIsSpeaking(true);
            await RunAnywhere.speak(vocabulary.exampleSentence);
        } catch (e) {
            console.warn('[VocabCard] TTS error:', e);
        } finally {
            setIsSpeaking(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Progress Indicator */}
            {showProgress && (
                <View style={styles.progressRow}>
                    <Text style={styles.progressText}>
                        {currentIndex + 1} / {totalCards}
                    </Text>
                    <View style={styles.progressBarBg}>
                        <View
                            style={[
                                styles.progressBarFill,
                                { width: `${((currentIndex + 1) / totalCards) * 100}%` },
                            ]}
                        />
                    </View>
                </View>
            )}

            {/* Card */}
            <TouchableOpacity
                style={styles.card}
                activeOpacity={0.95}
                onPress={() => setIsFlipped(!isFlipped)}
            >
                {/* Word in native script */}
                <Text style={styles.nativeScript}>{vocabulary.nativeScript}</Text>

                {/* Phonetic / Romanization */}
                <Text style={styles.phonetic}>{vocabulary.phonetic}</Text>

                {/* Audio button */}
                <TouchableOpacity
                    style={styles.audioButton}
                    onPress={handlePlayAudio}
                    disabled={isSpeaking}
                >
                    <Text style={styles.audioIcon}>{isSpeaking ? '🔊' : '🔈'}</Text>
                    <Text style={styles.audioText}>Listen</Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Meaning */}
                <Text style={styles.meaningLabel}>Meaning</Text>
                <Text style={styles.meaning}>{vocabulary.meaning}</Text>

                {/* Part of Speech */}
                <View style={styles.posTag}>
                    <Text style={styles.posText}>{vocabulary.partOfSpeech}</Text>
                </View>

                {/* Example Sentence */}
                <View style={styles.exampleContainer}>
                    <View style={styles.exampleHeader}>
                        <Text style={styles.exampleLabel}>Example</Text>
                        <TouchableOpacity onPress={handlePlayExample} disabled={isSpeaking}>
                            <Text style={styles.exampleAudio}>🔊</Text>
                        </TouchableOpacity>
                    </View>
                    <Text style={styles.exampleSentence}>{vocabulary.exampleSentence}</Text>
                    <Text style={styles.exampleTranslation}>{vocabulary.exampleTranslation}</Text>
                </View>

                {/* CEFR Level Badge */}
                <View style={styles.cefrBadge}>
                    <Text style={styles.cefrText}>{vocabulary.cefrLevel}</Text>
                </View>
            </TouchableOpacity>

            {/* Navigation */}
            <View style={styles.navRow}>
                <TouchableOpacity
                    style={[styles.navButton, !onPrevious && styles.navButtonDisabled]}
                    onPress={onPrevious}
                    disabled={!onPrevious}
                >
                    <Text style={styles.navButtonText}>← Previous</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.navButton, styles.navButtonPrimary]}
                    onPress={onNext}
                >
                    <Text style={[styles.navButtonText, styles.navButtonPrimaryText]}>
                        {currentIndex === totalCards - 1 ? 'Continue ✓' : 'Next →'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 12,
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: AppColors.textSecondary,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        backgroundColor: AppColors.textMuted + '30',
        borderRadius: 3,
    },
    progressBarFill: {
        height: 6,
        backgroundColor: AppColors.accentCyan,
        borderRadius: 3,
    },
    card: {
        backgroundColor: AppColors.surfaceCard,
        borderRadius: 24,
        padding: 28,
        borderWidth: 1,
        borderColor: AppColors.textMuted + '1A',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    nativeScript: {
        fontSize: 42,
        fontWeight: '800',
        color: AppColors.textPrimary,
        textAlign: 'center',
        marginBottom: 8,
    },
    phonetic: {
        fontSize: 18,
        color: AppColors.accentCyan,
        fontStyle: 'italic',
        marginBottom: 16,
    },
    audioButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: AppColors.accentCyan + '20',
        borderRadius: 20,
        gap: 8,
        marginBottom: 20,
    },
    audioIcon: {
        fontSize: 20,
    },
    audioText: {
        fontSize: 14,
        fontWeight: '600',
        color: AppColors.accentCyan,
    },
    divider: {
        width: '80%',
        height: 1,
        backgroundColor: AppColors.textMuted + '20',
        marginBottom: 16,
    },
    meaningLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: AppColors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 4,
    },
    meaning: {
        fontSize: 22,
        fontWeight: '700',
        color: AppColors.textPrimary,
        textAlign: 'center',
        marginBottom: 12,
    },
    posTag: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        backgroundColor: AppColors.accentViolet + '20',
        borderRadius: 12,
        marginBottom: 20,
    },
    posText: {
        fontSize: 12,
        fontWeight: '600',
        color: AppColors.accentViolet,
        textTransform: 'capitalize',
    },
    exampleContainer: {
        width: '100%',
        backgroundColor: AppColors.primaryDark + '30',
        borderRadius: 16,
        padding: 16,
    },
    exampleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    exampleLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: AppColors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    exampleAudio: {
        fontSize: 18,
    },
    exampleSentence: {
        fontSize: 16,
        color: AppColors.textPrimary,
        lineHeight: 24,
        marginBottom: 4,
    },
    exampleTranslation: {
        fontSize: 14,
        color: AppColors.textSecondary,
        fontStyle: 'italic',
        lineHeight: 20,
    },
    cefrBadge: {
        position: 'absolute',
        top: 16,
        right: 16,
        paddingHorizontal: 10,
        paddingVertical: 4,
        backgroundColor: AppColors.accentGreen + '30',
        borderRadius: 8,
    },
    cefrText: {
        fontSize: 11,
        fontWeight: '700',
        color: AppColors.accentGreen,
    },
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        gap: 12,
    },
    navButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        backgroundColor: AppColors.surfaceCard,
        borderWidth: 1,
        borderColor: AppColors.textMuted + '30',
    },
    navButtonDisabled: {
        opacity: 0.4,
    },
    navButtonPrimary: {
        backgroundColor: AppColors.accentCyan,
        borderColor: AppColors.accentCyan,
    },
    navButtonText: {
        fontSize: 15,
        fontWeight: '600',
        color: AppColors.textSecondary,
    },
    navButtonPrimaryText: {
        color: '#FFFFFF',
    },
});
