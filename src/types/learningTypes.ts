// ============================================================
// Learning Path System Types
// ============================================================

// --- CEFR Levels ---
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// --- Skill Types ---
export type ExerciseSkillType = 'vocab' | 'grammar' | 'listening' | 'speaking' | 'reading';

// --- Extended Exercise Types ---
export type LearningExerciseType =
    | 'translation'
    | 'fill-blank'
    | 'multiple-choice'
    | 'speaking'
    | 'listening'
    | 'reorder-sentence'
    | 'conversation-simulation';

// --- Lesson Step Types ---
export type LessonStepType = 'teach' | 'guided-practice' | 'reinforcement' | 'assessment';

// --- Language ---
export interface Language {
    id: string;
    code: string;           // ISO 639-1: 'ja', 'fr', 'es', 'de'
    name: string;           // 'Japanese', 'French', etc.
    nativeName: string;     // '日本語', 'Français', etc.
    locale: string;         // BCP-47: 'ja-JP', 'fr-FR', etc.
    flag: string;           // Emoji flag
    sttLocale: string;      // Whisper locale code
    ttsVoiceId?: string;    // Piper TTS voice ID
}

// --- Course ---
export interface Course {
    id: string;
    languageId: string;
    title: string;
    description: string;
    cefrLevel: CEFRLevel;
    totalUnits: number;
    imageUrl?: string;
}

// --- Unit ---
export interface Unit {
    id: string;
    courseId: string;
    orderIndex: number;
    title: string;
    description: string;
    theme: string;           // e.g., 'travel', 'food', 'business'
    icon: string;
    totalLessons: number;
}

// --- Learning Lesson ---
export interface LearningLesson {
    id: string;
    unitId: string;
    orderIndex: number;
    title: string;
    description: string;
    cefrLevel: CEFRLevel;
    estimatedMinutes: number;
    vocabularyIds: string[];     // IDs of vocabulary words taught
    grammarTopicId?: string;     // Grammar concept for this lesson
    prerequisites: string[];     // Lesson IDs required before unlock
    xpReward: number;
}

// --- Learning Exercise ---
export interface LearningExercise {
    id: string;
    lessonId: string;
    stepType: LessonStepType;
    orderIndex: number;
    type: LearningExerciseType;
    skillType: ExerciseSkillType;
    difficulty: number;          // 1-5
    cefrLevel: CEFRLevel;
    prompt: string;
    correctAnswer: string;
    expectedAnswerVariants: string[];  // Multiple valid answers
    // Type-specific fields
    options?: string[];          // For multiple-choice
    correctIndex?: number;       // For multiple-choice
    sentence?: string;           // For fill-blank
    blankPosition?: number;      // For fill-blank
    wordBank?: string[];         // For fill-blank or reorder
    sourceLanguage?: string;
    targetLanguage?: string;
    targetPhrase?: string;       // For speaking exercises
    phonetics?: string;          // For speaking exercises
    audioUrl?: string;           // For listening exercises
    transcription?: string;      // For listening exercises
    context?: string;
    hints?: string[];
    grammarTopic?: string;       // Grammar concept being tested
    requiredWords?: string[];    // Words this exercise tests
}

// --- Vocabulary Entry ---
export interface VocabularyEntry {
    id: string;
    languageCode: string;
    word: string;                // Target language word
    nativeScript: string;        // e.g., 'ありがとう' for Japanese
    phonetic: string;            // Romanization: 'arigatou'
    meaning: string;             // English meaning
    partOfSpeech: string;        // noun, verb, adjective, etc.
    exampleSentence: string;     // In target language
    exampleTranslation: string;  // In English
    cefrLevel: CEFRLevel;
    category: string;            // greetings, food, travel, etc.
    audioId?: string;
}

// --- Grammar Module ---
export interface GrammarModule {
    id: string;
    languageCode: string;
    title: string;
    cefrLevel: CEFRLevel;
    explanation: string;
    structure: string;           // e.g., 'Subject + は + Predicate'
    examples: GrammarExample[];
    commonMistakes: string[];
}

export interface GrammarExample {
    sentence: string;
    translation: string;
    breakdown: string;           // Word-by-word
}

// --- Conversation Mode ---
export type ConversationMode = 'formal' | 'casual' | 'professional';

// --- Conversation Stage Names ---
export type ConversationStageName = 'warm-up' | 'guided' | 'challenge' | 'natural-flow' | 'wrap-up';

// --- Conversation Stage ---
export interface ConversationStage {
    name: ConversationStageName;
    label: string;
    description: string;
    suggestedTurns: number;        // How many turns this stage should last
    objectives: string[];          // What user should accomplish in this stage
    coachingIntensity: 'high' | 'medium' | 'low';  // How much help AI provides
    systemPromptOverride?: string; // Additional prompt instructions for this stage
}

// --- Error Category ---
export type ErrorCategory =
    | 'tense'
    | 'word-order'
    | 'missing-particle'
    | 'conjugation'
    | 'gender-agreement'
    | 'formality'
    | 'vocabulary'
    | 'pronunciation'
    | 'spelling'
    | 'other';

// --- Scenario (for conversation mode) ---
export interface LearningScenario {
    id: string;
    languageCode: string;
    title: string;
    description: string;
    icon: string;
    difficulty: CEFRLevel;
    vocabularyIds: string[];     // Pre-teach these words
    systemPrompt: string;        // For LLM conversation
    objectives: string[];
    suggestedResponses: string[];
    // --- Enhanced fields ---
    conversationMode: ConversationMode;
    stages: ConversationStage[];
    prerequisiteLessonIds: string[];  // Lessons required before unlock
    estimatedMinutes: number;
    maxTurns: number;
    aiPersonality: string;           // e.g., 'friendly waiter', 'formal clerk'
    contextDescription: string;      // Scene-setting narrative for the user
}

// --- Per-Turn Feedback ---
export interface ConversationTurnFeedback {
    turnIndex: number;
    userText: string;
    aiResponse: string;
    pronunciationScore: number;       // 0-100
    grammarScore: number;             // 0-100
    vocabularyScore: number;          // 0-100
    isGrammarCorrect: boolean;
    errorCategory?: ErrorCategory;
    correction?: string;              // Corrected version of user's sentence
    explanation?: string;             // Brief grammar/vocab explanation
    suggestedAlternative?: string;    // Better way to say it
    vocabularyUsed: string[];         // Vocab IDs the user successfully used
    vocabularyMissed: string[];       // Vocab IDs the user should have used
    stageName: ConversationStageName;
}

// --- Session Report ---
export interface ConversationSessionReport {
    scenarioId: string;
    languageCode: string;
    startedAt: string;
    completedAt: string;
    totalTurns: number;
    objectivesCompleted: string[];
    objectivesTotal: string[];
    // Aggregate scores (0-100)
    fluencyScore: number;
    grammarScore: number;
    vocabularyScore: number;
    confidenceScore: number;         // Based on response time and self-corrections
    overallScore: number;
    // Detailed breakdown
    turnFeedback: ConversationTurnFeedback[];
    errorBreakdown: Record<ErrorCategory, number>;   // Count per error type
    weakVocabulary: string[];        // Vocab IDs to feed back into SRS
    strongVocabulary: string[];      // Vocab IDs user used well
    xpEarned: number;
    stageReached: ConversationStageName;
    conversationMode: ConversationMode;
}

// --- User Performance Tracking ---
export interface WordPerformance {
    id: string;
    userId: string;
    vocabularyId: string;
    correctCount: number;
    incorrectCount: number;
    lastReviewed: string;       // ISO datetime
    nextReviewDate: string;     // ISO datetime
    masteryLevel: WordMasteryLevel;
    intervalIndex: number;       // Index into REVIEW_INTERVALS
}

export type WordMasteryLevel = 'new' | 'learning' | 'reviewing' | 'mastered';

export interface GrammarPerformance {
    id: string;
    userId: string;
    grammarTopicId: string;
    correctCount: number;
    incorrectCount: number;
    accuracy: number;           // 0-100
    lastPracticed: string;
    masteryLevel: 'weak' | 'developing' | 'strong' | 'mastered';
}

export interface UserLessonProgress {
    id: string;
    userId: string;
    lessonId: string;
    isUnlocked: boolean;
    isCompleted: boolean;
    currentStep: LessonStepType;
    teachCompleted: boolean;
    guidedPracticeCompleted: boolean;
    reinforcementCompleted: boolean;
    assessmentCompleted: boolean;
    assessmentScore: number;    // 0-100
    bestScore: number;
    attempts: number;
    completedAt?: string;
    xpEarned: number;
}

// --- Skill Performance (for adaptive engine) ---
export interface SkillPerformance {
    vocab: { accuracy: number; count: number; avgTimeMs: number };
    grammar: { accuracy: number; count: number; avgTimeMs: number };
    listening: { accuracy: number; count: number; avgTimeMs: number };
    speaking: { accuracy: number; averageScore: number; count: number };
}

// --- AI Feedback Types ---
export interface WritingFeedback {
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
    alternativePhrasing: string[];
    grammarBreakdown: string;
    errorType?: 'grammar' | 'vocabulary' | 'tense' | 'word-order' | 'spelling' | 'perfect';
}

export interface SpeakingFeedback {
    pronunciationScore: number;  // 0-100
    fluencyScore: number;        // 0-100
    isAccepted: boolean;
    transcription: string;
    expectedPhrase: string;
    mispronounced: string[];     // Tokens that were off
    suggestions: string;
}

// --- Review Intervals ---
export const REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60]; // days

// --- STT Language Mapping ---
export const STT_LANGUAGE_MAP: Record<string, string> = {
    en: 'en',
    ja: 'ja',
    fr: 'fr',
    es: 'es',
    de: 'de',
    ko: 'ko',
    zh: 'zh',
    it: 'it',
    pt: 'pt',
    ru: 'ru',
    // Alias support for full language names
    english: 'en',
    japanese: 'ja',
    french: 'fr',
    spanish: 'es',
    german: 'de',
    Korean: 'ko',
    Chinese: 'zh',
    Italian: 'it',
    Portuguese: 'pt',
    Russian: 'ru',
};

// Helper to resolve STT locale from user's target language setting
export function getSTTLocale(targetLanguage: string): string {
    const lower = targetLanguage.toLowerCase().trim();
    return STT_LANGUAGE_MAP[lower] || 'en';
}
