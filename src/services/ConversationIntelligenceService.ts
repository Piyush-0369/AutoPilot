// ============================================================
// Conversation Intelligence Service
// ============================================================
// Provides per-turn AI analysis during conversation practice:
//   - Intent recognition (semantic meaning vs exact match)
//   - Error categorization (tense, word-order, particle, etc.)
//   - Adaptive coaching (hints for struggling, harder for proficient)
//   - Turn-by-turn feedback generation
// Uses the on-device LLM (RunAnywhere.chat) with fallback logic.

import { RunAnywhere } from '@runanywhere/core';
import type {
    ConversationTurnFeedback,
    ConversationStageName,
    ErrorCategory,
    LearningScenario,
} from '../types/learningTypes';
import { similarityScore } from './SpeechValidationService';

// ============================================================
// Service Class
// ============================================================
class ConversationIntelligenceServiceClass {

    /**
     * Analyze a single conversation turn and produce feedback.
     * Combines LLM analysis with local heuristics.
     */
    async analyzeTurn(
        userText: string,
        aiResponse: string,
        turnIndex: number,
        stageName: ConversationStageName,
        scenario: LearningScenario,
        targetLanguage: string,
    ): Promise<ConversationTurnFeedback> {
        // Start with local heuristic analysis
        const localAnalysis = this._localAnalysis(userText, scenario, targetLanguage);

        // Try LLM-based deep analysis
        let llmAnalysis: Partial<ConversationTurnFeedback> = {};
        try {
            llmAnalysis = await this._llmAnalysis(userText, aiResponse, targetLanguage, scenario);
        } catch (e) {
            console.warn('[ConvIntelligence] LLM analysis failed, using local only:', e);
        }

        // Merge: LLM takes priority where available
        return {
            turnIndex,
            userText,
            aiResponse,
            stageName,
            pronunciationScore: llmAnalysis.pronunciationScore ?? localAnalysis.pronunciationScore,
            grammarScore: llmAnalysis.grammarScore ?? localAnalysis.grammarScore,
            vocabularyScore: llmAnalysis.vocabularyScore ?? localAnalysis.vocabularyScore,
            isGrammarCorrect: llmAnalysis.isGrammarCorrect ?? localAnalysis.isGrammarCorrect,
            errorCategory: llmAnalysis.errorCategory ?? localAnalysis.errorCategory,
            correction: llmAnalysis.correction,
            explanation: llmAnalysis.explanation,
            suggestedAlternative: llmAnalysis.suggestedAlternative,
            vocabularyUsed: llmAnalysis.vocabularyUsed ?? localAnalysis.vocabularyUsed,
            vocabularyMissed: llmAnalysis.vocabularyMissed ?? localAnalysis.vocabularyMissed,
        };
    }

    /**
     * Detect if the user is struggling and should receive a hint.
     * Checks the recent turn feedback for patterns.
     */
    detectStruggling(recentFeedback: ConversationTurnFeedback[]): {
        isStruggling: boolean;
        hint?: string;
    } {
        if (recentFeedback.length < 2) return { isStruggling: false };

        const lastN = recentFeedback.slice(-3);
        const avgGrammar = lastN.reduce((s, f) => s + f.grammarScore, 0) / lastN.length;
        const avgVocab = lastN.reduce((s, f) => s + f.vocabularyScore, 0) / lastN.length;
        const consecutiveErrors = lastN.filter(f => !f.isGrammarCorrect).length;

        if (avgGrammar < 40 || avgVocab < 30 || consecutiveErrors >= 2) {
            return {
                isStruggling: true,
                hint: this._generateHint(lastN),
            };
        }

        return { isStruggling: false };
    }

    /**
     * Detect if the user is proficient and can be challenged more.
     */
    detectProficiency(recentFeedback: ConversationTurnFeedback[]): boolean {
        if (recentFeedback.length < 3) return false;
        const lastN = recentFeedback.slice(-4);
        const avgGrammar = lastN.reduce((s, f) => s + f.grammarScore, 0) / lastN.length;
        const avgVocab = lastN.reduce((s, f) => s + f.vocabularyScore, 0) / lastN.length;
        return avgGrammar >= 85 && avgVocab >= 80;
    }

    /**
     * Generate adaptive coaching prompt modifier based on user performance.
     */
    getAdaptivePromptModifier(recentFeedback: ConversationTurnFeedback[]): string {
        const struggling = this.detectStruggling(recentFeedback);
        const proficient = this.detectProficiency(recentFeedback);

        if (struggling.isStruggling) {
            return `The user is struggling. Simplify your language. Provide more hints and encouragement. When they make mistakes, give the correct phrase and ask them to repeat it. Be extra patient.`;
        }

        if (proficient) {
            return `The user is doing very well! Challenge them more. Use slightly more complex sentences. Introduce new vocabulary naturally. Reduce hand-holding. Ask open-ended questions.`;
        }

        return ''; // No modifier needed
    }

    // ----------------------------------------------------------
    // PRIVATE: Local Heuristic Analysis
    // ----------------------------------------------------------

    private _localAnalysis(
        userText: string,
        scenario: LearningScenario,
        targetLanguage: string,
    ): ConversationTurnFeedback {
        // Check vocabulary usage
        const vocabUsed: string[] = [];
        const vocabMissed: string[] = [];
        const userLower = userText.toLowerCase();

        // Simple check: see if user's text contains suggested response patterns
        for (const suggested of scenario.suggestedResponses) {
            const cleanSuggested = suggested.replace(/\s*\(.*?\)\s*/g, '').toLowerCase();
            const score = similarityScore(userLower, cleanSuggested);
            if (score > 50) {
                vocabUsed.push(cleanSuggested);
            }
        }

        // Basic grammar check: purely heuristic
        const wordCount = userText.trim().split(/\s+/).length;
        const hasContent = wordCount >= 2;
        const pronunciationScore = hasContent ? 70 : 40;

        // Detect if user typed in English when they should use target language
        const isEnglish = /^[a-zA-Z\s.,!?]+$/.test(userText.trim());
        const isTargetNonLatin = ['ja', 'ko', 'zh', 'ar', 'hi', 'ru'].includes(
            scenario.languageCode
        );

        let grammarScore = 65;
        let isGrammarCorrect = true;
        let errorCategory: ErrorCategory | undefined;

        if (isTargetNonLatin && isEnglish && wordCount > 2) {
            // User is speaking English in a non-Latin language scenario
            grammarScore = 30;
            isGrammarCorrect = false;
            errorCategory = 'vocabulary';
        }

        return {
            turnIndex: 0,
            userText,
            aiResponse: '',
            stageName: 'warm-up',
            pronunciationScore,
            grammarScore,
            vocabularyScore: vocabUsed.length > 0 ? 80 : 50,
            isGrammarCorrect,
            errorCategory,
            vocabularyUsed: vocabUsed,
            vocabularyMissed: vocabMissed,
        };
    }

    // ----------------------------------------------------------
    // PRIVATE: LLM-Based Deep Analysis
    // ----------------------------------------------------------

    private async _llmAnalysis(
        userText: string,
        aiResponse: string,
        targetLanguage: string,
        scenario: LearningScenario,
    ): Promise<Partial<ConversationTurnFeedback>> {
        const prompt = `Analyze this language learning conversation turn.

User said: "${userText}"
AI responded: "${aiResponse}"
Target language: ${targetLanguage} (${scenario.difficulty} level)
Scenario: ${scenario.title}

Respond in JSON only:
{
  "grammarScore": <0-100>,
  "vocabularyScore": <0-100>,
  "isGrammarCorrect": <true/false>,
  "errorCategory": "<tense|word-order|missing-particle|conjugation|gender-agreement|formality|vocabulary|pronunciation|spelling|other>" or null,
  "correction": "<corrected sentence>" or null,
  "explanation": "<1-sentence explanation of error>" or null,
  "suggestedAlternative": "<better way to say it>" or null
}`;

        const response = await RunAnywhere.chat([
            {
                role: 'system',
                content: `You are a ${targetLanguage} language analysis engine. Respond ONLY with valid JSON. Be concise.`,
            },
            { role: 'user', content: prompt },
        ] as any);

        const parsed = this._parseJson(response);
        if (!parsed) return {};

        return {
            grammarScore: this._clamp(parsed.grammarScore, 0, 100),
            vocabularyScore: this._clamp(parsed.vocabularyScore, 0, 100),
            isGrammarCorrect: parsed.isGrammarCorrect === true,
            errorCategory: this._validateErrorCategory(parsed.errorCategory),
            correction: parsed.correction || undefined,
            explanation: parsed.explanation || undefined,
            suggestedAlternative: parsed.suggestedAlternative || undefined,
        };
    }

    // ----------------------------------------------------------
    // PRIVATE: Helpers
    // ----------------------------------------------------------

    private _generateHint(feedback: ConversationTurnFeedback[]): string {
        const lastError = feedback.find(f => !f.isGrammarCorrect && f.correction);
        if (lastError?.correction) {
            return `Try saying: "${lastError.correction}"`;
        }
        return 'Take your time. Try using simple phrases you learned in your lessons.';
    }

    private _parseJson(response: any): any {
        try {
            const text = typeof response === 'string' ? response : String(response);
            const match = text.match(/\{[\s\S]*\}/);
            if (match) return JSON.parse(match[0]);
        } catch { /* not valid JSON */ }
        return null;
    }

    private _clamp(value: any, min: number, max: number): number {
        const num = Number(value);
        if (isNaN(num)) return 50;
        return Math.max(min, Math.min(max, num));
    }

    private _validateErrorCategory(cat: any): ErrorCategory | undefined {
        const valid: ErrorCategory[] = [
            'tense', 'word-order', 'missing-particle', 'conjugation',
            'gender-agreement', 'formality', 'vocabulary', 'pronunciation',
            'spelling', 'other',
        ];
        return valid.includes(cat) ? cat : undefined;
    }
}

// Singleton export
export const conversationIntelligenceService = new ConversationIntelligenceServiceClass();
