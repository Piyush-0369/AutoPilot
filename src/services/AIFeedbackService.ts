// ============================================================
// AI Feedback Service
// ============================================================
// Uses the on-device LLM (via RunAnywhere.chat) to provide
// rich feedback for writing and speaking exercises.

import { RunAnywhere } from '@runanywhere/core';
import type { WritingFeedback, SpeakingFeedback } from '../types/learningTypes';
import { getSpeakingEvaluation } from './SpeechValidationService';

class AIFeedbackServiceClass {

    /**
     * Get detailed writing feedback using the on-device LLM.
     * Falls back to basic comparison if LLM is unavailable.
     */
    async getWritingFeedback(
        userAnswer: string,
        correctAnswer: string,
        expectedVariants: string[],
        context?: string
    ): Promise<WritingFeedback> {
        // First, check basic correctness
        const normalizedUser = userAnswer.trim().toLowerCase();
        const allCorrect = [correctAnswer, ...expectedVariants].map(a => a.trim().toLowerCase());
        const isCorrect = allCorrect.includes(normalizedUser);

        if (isCorrect) {
            return {
                isCorrect: true,
                correctAnswer,
                explanation: 'Perfect! Your answer is correct.',
                alternativePhrasing: expectedVariants.filter(v => v.toLowerCase() !== normalizedUser),
                grammarBreakdown: '',
                errorType: 'perfect',
            };
        }

        // Try LLM for detailed feedback
        try {
            const prompt = this._buildWritingFeedbackPrompt(userAnswer, correctAnswer, expectedVariants, context);
            const response = await RunAnywhere.chat([
                { role: 'system', content: 'You are a language tutor providing brief, helpful corrections. Respond in JSON format only.' },
                { role: 'user', content: prompt },
            ]);

            const parsed = this._parseJsonResponse(response);
            if (parsed) {
                return {
                    isCorrect: false,
                    correctAnswer,
                    explanation: parsed.explanation || 'Your answer is close but not quite right.',
                    alternativePhrasing: parsed.alternatives || expectedVariants,
                    grammarBreakdown: parsed.grammarBreakdown || '',
                    errorType: parsed.errorType || 'grammar',
                };
            }
        } catch (e) {
            console.warn('[AIFeedback] LLM feedback failed, using fallback:', e);
        }

        // Fallback: basic comparison feedback
        return this._getBasicWritingFeedback(userAnswer, correctAnswer, expectedVariants);
    }

    /**
     * Get speaking feedback combining speech validation + optional LLM insights.
     */
    async getSpeakingFeedback(
        transcription: string,
        expected: string,
        expectedVariants: string[],
        timeMs: number
    ): Promise<SpeakingFeedback> {
        const evaluation = getSpeakingEvaluation(transcription, expected, expectedVariants, timeMs);

        return {
            pronunciationScore: evaluation.pronunciationScore,
            fluencyScore: evaluation.fluencyScore,
            isAccepted: evaluation.isAccepted,
            transcription: evaluation.transcription,
            expectedPhrase: evaluation.expectedPhrase,
            mispronounced: evaluation.mispronounced,
            suggestions: evaluation.suggestions,
        };
    }

    /**
     * Generate a grammar explanation for a specific error.
     * Uses LLM with fallback.
     */
    async getGrammarExplanation(
        userAnswer: string,
        correctAnswer: string,
        targetLanguage: string
    ): Promise<string> {
        try {
            const prompt = `The student wrote "${userAnswer}" but the correct ${targetLanguage} answer is "${correctAnswer}". In 1-2 sentences, explain the grammar mistake simply. Do not use JSON.`;

            const response = await RunAnywhere.chat([
                { role: 'system', content: `You are a ${targetLanguage} language tutor. Be brief and clear.` },
                { role: 'user', content: prompt },
            ]);

            return typeof response === 'string' ? response.trim() : String(response);
        } catch (e) {
            console.warn('[AIFeedback] Grammar explanation failed:', e);
            return `The correct answer is "${correctAnswer}". Try to study this pattern carefully.`;
        }
    }

    // ----------------------------------------------------------
    // PRIVATE HELPERS
    // ----------------------------------------------------------

    private _buildWritingFeedbackPrompt(
        userAnswer: string,
        correctAnswer: string,
        variants: string[],
        context?: string
    ): string {
        return `
      Student answer: "${userAnswer}"
      Correct answer: "${correctAnswer}"
      Also acceptable: ${JSON.stringify(variants)}
      ${context ? `Context: ${context}` : ''}

      Respond in JSON: {"explanation": "brief explanation", "errorType": "grammar|vocabulary|tense|word-order|spelling", "grammarBreakdown": "brief rule", "alternatives": ["alt1"]}
    `;
    }

    private _getBasicWritingFeedback(
        userAnswer: string,
        correctAnswer: string,
        variants: string[]
    ): WritingFeedback {
        const userLower = userAnswer.trim().toLowerCase();
        const correctLower = correctAnswer.trim().toLowerCase();

        // Determine error type
        let errorType: WritingFeedback['errorType'] = 'grammar';

        // Check for word order issues
        const userWords = userLower.split(/\s+/).sort();
        const correctWords = correctLower.split(/\s+/).sort();
        if (JSON.stringify(userWords) === JSON.stringify(correctWords)) {
            errorType = 'word-order';
        }

        // Check for spelling (very close match)
        const distance = this._simpleDistance(userLower, correctLower);
        if (distance <= 2 && distance > 0) {
            errorType = 'spelling';
        }

        return {
            isCorrect: false,
            correctAnswer,
            explanation: errorType === 'word-order'
                ? 'The words are correct but in the wrong order.'
                : errorType === 'spelling'
                    ? 'Almost right! Check your spelling carefully.'
                    : `The correct answer is "${correctAnswer}".`,
            alternativePhrasing: variants,
            grammarBreakdown: '',
            errorType,
        };
    }

    private _simpleDistance(a: string, b: string): number {
        if (a === b) return 0;
        const len = Math.max(a.length, b.length);
        let diff = 0;
        for (let i = 0; i < len; i++) {
            if (a[i] !== b[i]) diff++;
        }
        return diff;
    }

    private _parseJsonResponse(response: any): any {
        try {
            const text = typeof response === 'string' ? response : String(response);
            // Try to extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch {
            // Not valid JSON
        }
        return null;
    }
}

export const aiFeedbackService = new AIFeedbackServiceClass();
