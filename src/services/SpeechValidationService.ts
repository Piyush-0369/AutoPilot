// ============================================================
// Speech Validation Service
// ============================================================
// Provides speech comparison, pronunciation scoring, and
// fluency metrics for the speaking exercises.

/**
 * Calculate Levenshtein distance between two strings.
 * Used for pronunciation tolerance comparison.
 */
export function levenshteinDistance(a: string, b: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= b.length; i++) {
        matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
        matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1,     // insertion
                    matrix[i - 1][j] + 1      // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0–100) between two strings.
 * Higher = more similar.
 */
export function similarityScore(transcription: string, expected: string): number {
    const a = normalizeText(transcription);
    const b = normalizeText(expected);

    if (a === b) return 100;
    if (a.length === 0 || b.length === 0) return 0;

    const distance = levenshteinDistance(a, b);
    const maxLen = Math.max(a.length, b.length);
    const similarity = ((maxLen - distance) / maxLen) * 100;

    return Math.round(Math.max(0, Math.min(100, similarity)));
}

/**
 * Compare spoken transcription with expected answer.
 * Considers multiple valid answer variants.
 * Returns the best matching score.
 */
export function compareSpeech(
    transcription: string,
    expectedAnswers: string[],
    toleranceThreshold: number = 70
): {
    isAccepted: boolean;
    bestScore: number;
    bestMatch: string;
} {
    let bestScore = 0;
    let bestMatch = expectedAnswers[0] || '';

    for (const expected of expectedAnswers) {
        const score = similarityScore(transcription, expected);
        if (score > bestScore) {
            bestScore = score;
            bestMatch = expected;
        }
    }

    return {
        isAccepted: bestScore >= toleranceThreshold,
        bestScore,
        bestMatch,
    };
}

/**
 * Calculate pronunciation score (0–100).
 * Considers character-level accuracy.
 */
export function calculatePronunciationScore(
    transcription: string,
    expected: string
): number {
    return similarityScore(transcription, expected);
}

/**
 * Calculate fluency score (0–100) based on speaking speed.
 * Assumes a target speaking rate and penalizes very slow or very fast speech.
 */
export function calculateFluencyScore(
    transcription: string,
    expectedWordCount: number,
    timeMs: number
): number {
    if (timeMs <= 0 || expectedWordCount <= 0) return 50;

    const words = transcription.trim().split(/\s+/).length;
    const wordsPerMinute = (words / timeMs) * 60000;

    // Ideal range: 80-160 words per minute for language learners
    if (wordsPerMinute >= 80 && wordsPerMinute <= 160) {
        return 100;
    } else if (wordsPerMinute < 80) {
        // Too slow
        return Math.max(20, Math.round((wordsPerMinute / 80) * 100));
    } else {
        // Too fast (unlikely for learners)
        return Math.max(50, Math.round(100 - ((wordsPerMinute - 160) / 160) * 50));
    }
}

/**
 * Highlight mispronounced tokens by comparing word-by-word.
 * Returns tokens that differ between transcription and expected.
 */
export function highlightMispronounced(
    transcription: string,
    expected: string
): string[] {
    const transcWords = normalizeText(transcription).split(/\s+/);
    const expectedWords = normalizeText(expected).split(/\s+/);
    const mispronounced: string[] = [];

    for (let i = 0; i < expectedWords.length; i++) {
        if (i >= transcWords.length) {
            // Missing word
            mispronounced.push(expectedWords[i]);
        } else if (similarityScore(transcWords[i], expectedWords[i]) < 80) {
            mispronounced.push(expectedWords[i]);
        }
    }

    return mispronounced;
}

/**
 * Get overall speaking feedback combining all metrics.
 */
export function getSpeakingEvaluation(
    transcription: string,
    expected: string,
    expectedVariants: string[],
    timeMs: number
) {
    const allVariants = [expected, ...expectedVariants];
    const comparison = compareSpeech(transcription, allVariants);
    const pronunciationScore = calculatePronunciationScore(transcription, comparison.bestMatch);
    const expectedWordCount = comparison.bestMatch.split(/\s+/).length;
    const fluencyScore = calculateFluencyScore(transcription, expectedWordCount, timeMs);
    const mispronounced = highlightMispronounced(transcription, comparison.bestMatch);

    return {
        isAccepted: comparison.isAccepted,
        pronunciationScore,
        fluencyScore,
        overallScore: Math.round((pronunciationScore * 0.7 + fluencyScore * 0.3)),
        transcription,
        expectedPhrase: comparison.bestMatch,
        mispronounced,
        suggestions: mispronounced.length > 0
            ? `Try to clearly pronounce: ${mispronounced.join(', ')}`
            : 'Great pronunciation!',
    };
}

/**
 * Normalize text for comparison.
 * Lowercases, trims, removes extra whitespace and common punctuation.
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[.,!?;:'"(){}[\]]/g, '')
        .replace(/\s+/g, ' ');
}
