// ============================================================
// Conversation Session Service
// ============================================================
// Manages the lifecycle of a conversation practice session:
//   - Stage tracking & transitions
//   - Objective completion
//   - Turn counting & timing
//   - Enhanced system prompt building per stage
//   - Session result persistence

import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
    LearningScenario,
    ConversationStage,
    ConversationStageName,
    ConversationMode,
    ConversationTurnFeedback,
    ConversationSessionReport,
    ErrorCategory,
} from '../types/learningTypes';

const SESSION_HISTORY_KEY = '@conversation_session_history';

// ============================================================
// Session State (in-memory during active session)
// ============================================================
export interface ConversationSessionState {
    scenario: LearningScenario;
    mode: ConversationMode;
    currentStageIndex: number;
    turnCount: number;
    turnsInCurrentStage: number;
    startedAt: string;
    objectivesCompleted: Set<string>;
    turnFeedback: ConversationTurnFeedback[];
    isActive: boolean;
}

// ============================================================
// Service Class
// ============================================================
class ConversationSessionServiceClass {
    private session: ConversationSessionState | null = null;

    // ----------------------------------------------------------
    // SESSION LIFECYCLE
    // ----------------------------------------------------------

    /** Start a new conversation session */
    startSession(scenario: LearningScenario, mode?: ConversationMode): ConversationSessionState {
        this.session = {
            scenario,
            mode: mode || scenario.conversationMode,
            currentStageIndex: 0,
            turnCount: 0,
            turnsInCurrentStage: 0,
            startedAt: new Date().toISOString(),
            objectivesCompleted: new Set(),
            turnFeedback: [],
            isActive: true,
        };
        return this.session;
    }

    /** Get current session (null if none active) */
    getSession(): ConversationSessionState | null {
        return this.session;
    }

    /** Check if a session is active */
    isSessionActive(): boolean {
        return this.session?.isActive === true;
    }

    // ----------------------------------------------------------
    // STAGE MANAGEMENT
    // ----------------------------------------------------------

    /** Get the current conversation stage */
    getCurrentStage(): ConversationStage | null {
        if (!this.session) return null;
        const stages = this.session.scenario.stages;
        return stages[this.session.currentStageIndex] || null;
    }

    /** Get current stage name */
    getCurrentStageName(): ConversationStageName {
        return this.getCurrentStage()?.name || 'warm-up';
    }

    /** Get stage progress (0–1) within the current stage */
    getStageProgress(): number {
        const stage = this.getCurrentStage();
        if (!stage || stage.suggestedTurns === 0) return 0;
        return Math.min(1, (this.session?.turnsInCurrentStage || 0) / stage.suggestedTurns);
    }

    /** Get overall session progress (0–1) */
    getOverallProgress(): number {
        if (!this.session) return 0;
        const totalStages = this.session.scenario.stages.length;
        const stageWeight = 1 / totalStages;
        const completedStages = this.session.currentStageIndex * stageWeight;
        const currentStageContribution = this.getStageProgress() * stageWeight;
        return Math.min(1, completedStages + currentStageContribution);
    }

    /**
     * Record a completed turn and potentially advance the stage.
     * Returns true if the stage changed.
     */
    recordTurn(feedback: ConversationTurnFeedback): boolean {
        if (!this.session) return false;

        this.session.turnCount += 1;
        this.session.turnsInCurrentStage += 1;
        this.session.turnFeedback.push(feedback);

        // Check if we should advance to the next stage
        const stage = this.getCurrentStage();
        if (stage && this.session.turnsInCurrentStage >= stage.suggestedTurns) {
            return this.advanceStage();
        }

        // Check max turns
        if (this.session.turnCount >= this.session.scenario.maxTurns) {
            // Skip to wrap-up if not already there
            const wrapUpIdx = this.session.scenario.stages.findIndex(s => s.name === 'wrap-up');
            if (wrapUpIdx >= 0 && this.session.currentStageIndex < wrapUpIdx) {
                this.session.currentStageIndex = wrapUpIdx;
                this.session.turnsInCurrentStage = 0;
                return true;
            }
        }

        return false;
    }

    /** Manually advance to next stage */
    advanceStage(): boolean {
        if (!this.session) return false;
        const stages = this.session.scenario.stages;
        if (this.session.currentStageIndex < stages.length - 1) {
            this.session.currentStageIndex += 1;
            this.session.turnsInCurrentStage = 0;
            return true;
        }
        return false;
    }

    // ----------------------------------------------------------
    // OBJECTIVE TRACKING
    // ----------------------------------------------------------

    /** Mark an objective as completed */
    completeObjective(objective: string): void {
        this.session?.objectivesCompleted.add(objective);
    }

    /** Get list of completed objectives */
    getCompletedObjectives(): string[] {
        return Array.from(this.session?.objectivesCompleted || []);
    }

    /** Get objective completion ratio */
    getObjectiveProgress(): { completed: number; total: number; percent: number } {
        if (!this.session) return { completed: 0, total: 0, percent: 0 };
        const total = this.session.scenario.objectives.length;
        const completed = this.session.objectivesCompleted.size;
        return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
    }

    // ----------------------------------------------------------
    // SYSTEM PROMPT BUILDER
    // ----------------------------------------------------------

    /** Build an enhanced system prompt for the current stage */
    buildStagePrompt(targetLanguage: string): string {
        if (!this.session) return '';

        const { scenario, mode } = this.session;
        const stage = this.getCurrentStage();

        const modeInstructions: Record<ConversationMode, string> = {
            formal: 'Use formal/polite language registers. Address the user formally.',
            casual: 'Use casual, friendly language. Be relaxed and approachable.',
            professional: 'Use professional, business-appropriate language.',
        };

        const coachingInstructions: Record<string, string> = {
            high: `Provide heavy guidance. If the user is stuck, suggest what to say next in ${targetLanguage} with pronunciation help. Correct every mistake gently with explanations.`,
            medium: `Provide moderate guidance. Correct significant mistakes but let minor ones slide. Occasionally suggest better phrasing.`,
            low: `Minimal guidance. Let the conversation flow naturally. Only correct critical errors. Respond naturally as your character would.`,
        };

        let prompt = `${scenario.systemPrompt}\n\n`;
        prompt += `CURRENT CONTEXT: ${scenario.contextDescription}\n`;
        prompt += `YOUR CHARACTER: ${scenario.aiPersonality}\n`;
        prompt += `LANGUAGE MODE: ${modeInstructions[mode]}\n`;
        prompt += `The user is learning ${targetLanguage}.\n\n`;

        if (stage) {
            prompt += `CURRENT CONVERSATION STAGE: ${stage.label} — ${stage.description}\n`;
            prompt += `COACHING LEVEL: ${coachingInstructions[stage.coachingIntensity]}\n`;
            if (stage.objectives.length > 0) {
                prompt += `STAGE GOALS: Guide the conversation so the user practices: ${stage.objectives.join(', ')}\n`;
            }
            if (stage.systemPromptOverride) {
                prompt += `ADDITIONAL: ${stage.systemPromptOverride}\n`;
            }
        }

        return prompt;
    }

    // ----------------------------------------------------------
    // SESSION REPORT GENERATION
    // ----------------------------------------------------------

    /** End the session and generate a report */
    async endSession(): Promise<ConversationSessionReport | null> {
        if (!this.session) return null;

        const { scenario, turnFeedback, objectivesCompleted, turnCount, mode, startedAt } = this.session;

        // Calculate aggregate scores
        const avgPronunciation = this._average(turnFeedback.map(t => t.pronunciationScore));
        const avgGrammar = this._average(turnFeedback.map(t => t.grammarScore));
        const avgVocabulary = this._average(turnFeedback.map(t => t.vocabularyScore));

        // Confidence is based on turn count relative to max turns + objective completion
        const turnRatio = Math.min(1, turnCount / scenario.maxTurns);
        const objRatio = scenario.objectives.length > 0
            ? objectivesCompleted.size / scenario.objectives.length
            : 0.5;
        const confidenceScore = Math.round((turnRatio * 40 + objRatio * 60));

        const overallScore = Math.round(
            avgPronunciation * 0.2 + avgGrammar * 0.3 + avgVocabulary * 0.3 + confidenceScore * 0.2
        );

        // Error breakdown
        const errorBreakdown = this._buildErrorBreakdown(turnFeedback);

        // Vocabulary analysis
        const allUsed = new Set<string>();
        const allMissed = new Set<string>();
        turnFeedback.forEach(t => {
            t.vocabularyUsed.forEach(v => allUsed.add(v));
            t.vocabularyMissed.forEach(v => allMissed.add(v));
        });

        // XP calculation
        const baseXP = 30;
        const turnBonus = Math.min(20, turnCount * 2);
        const objectiveBonus = objectivesCompleted.size * 10;
        const scoreBonus = Math.round(overallScore / 10);
        const xpEarned = baseXP + turnBonus + objectiveBonus + scoreBonus;

        const report: ConversationSessionReport = {
            scenarioId: scenario.id,
            languageCode: scenario.languageCode,
            startedAt,
            completedAt: new Date().toISOString(),
            totalTurns: turnCount,
            objectivesCompleted: Array.from(objectivesCompleted),
            objectivesTotal: scenario.objectives,
            fluencyScore: Math.round(avgPronunciation),
            grammarScore: Math.round(avgGrammar),
            vocabularyScore: Math.round(avgVocabulary),
            confidenceScore,
            overallScore,
            turnFeedback,
            errorBreakdown,
            weakVocabulary: Array.from(allMissed),
            strongVocabulary: Array.from(allUsed),
            xpEarned,
            stageReached: this.getCurrentStageName(),
            conversationMode: mode,
        };

        // Persist
        await this._saveSessionResult(report);

        // Clear session
        this.session = null;

        return report;
    }

    // ----------------------------------------------------------
    // HISTORY
    // ----------------------------------------------------------

    /** Get past conversation session reports */
    async getSessionHistory(): Promise<ConversationSessionReport[]> {
        try {
            const stored = await AsyncStorage.getItem(SESSION_HISTORY_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    // ----------------------------------------------------------
    // PRIVATE HELPERS
    // ----------------------------------------------------------

    private _average(values: number[]): number {
        if (values.length === 0) return 50; // default neutral score
        return values.reduce((sum, v) => sum + v, 0) / values.length;
    }

    private _buildErrorBreakdown(feedback: ConversationTurnFeedback[]): Record<ErrorCategory, number> {
        const breakdown: Record<ErrorCategory, number> = {
            'tense': 0, 'word-order': 0, 'missing-particle': 0,
            'conjugation': 0, 'gender-agreement': 0, 'formality': 0,
            'vocabulary': 0, 'pronunciation': 0, 'spelling': 0, 'other': 0,
        };
        feedback.forEach(t => {
            if (t.errorCategory) {
                breakdown[t.errorCategory] = (breakdown[t.errorCategory] || 0) + 1;
            }
        });
        return breakdown;
    }

    private async _saveSessionResult(report: ConversationSessionReport): Promise<void> {
        try {
            const history = await this.getSessionHistory();
            history.push(report);
            // Keep last 50 sessions
            const trimmed = history.slice(-50);
            await AsyncStorage.setItem(SESSION_HISTORY_KEY, JSON.stringify(trimmed));
        } catch (e) {
            console.error('[ConversationSession] Error saving session:', e);
        }
    }
}

// Singleton export
export const conversationSessionService = new ConversationSessionServiceClass();
