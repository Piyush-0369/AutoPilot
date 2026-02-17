// User types
export interface User {
    id: string
    name: string
    email?: string
    avatar?: string
    targetLanguage: string
    nativeLanguage: string
    dailyGoalMinutes: number
    xp: number
    level: number
    streak: number
    lastActiveDate: string
    longestStreak: number
    totalMinutesLearned: number
    achievements: string[]
    unlockedAchievements: string[]
    completedLessons: string[]
    skillTreeProgress: Record<string, SkillNodeStatus>
    srsItems: Record<string, SRSItem>
    createdAt: string
    updatedAt: string
}

export type SkillNodeStatus = 'locked' | 'in-progress' | 'mastered'

export interface SRSItem {
    itemId: string
    eFactor: number
    intervalDays: number
    repetitionCount: number
    nextReview: string
    lastReviewed: string
}

// Lesson types
export interface Lesson {
    id: string
    title: string
    description: string
    difficulty: number
    skillNode: string
    estimatedMinutes: number
    exercises: Exercise[]
    learningObjectives: string[]
    prerequisites: string[]
    tags: string[]
    createdAt: string
}

// Exercise types
export type ExerciseType =
    | 'translation'
    | 'fill-blank'
    | 'multiple-choice'
    | 'speaking'
    | 'listening'

export interface BaseExercise {
    id: string
    type: ExerciseType
    difficulty: number
    prompt: string
    correctAnswer: string
    context?: string
    hints?: string[]
    imageUrl?: string
    audioUrl?: string
}

export interface TranslationExercise extends BaseExercise {
    type: 'translation'
    sourceLanguage: string
    targetLanguage: string
}

export interface FillBlankExercise extends BaseExercise {
    type: 'fill-blank'
    sentence: string
    blankPosition: number
    wordBank?: string[]
}

export interface MultipleChoiceExercise extends BaseExercise {
    type: 'multiple-choice'
    options: string[]
    correctIndex: number
}

export interface SpeakingExercise extends BaseExercise {
    type: 'speaking'
    targetPhrase: string
    phonetics?: string
}

export interface ListeningExercise extends BaseExercise {
    type: 'listening'
    audioUrl: string
    transcription: string
}

export type Exercise =
    | TranslationExercise
    | FillBlankExercise
    | MultipleChoiceExercise
    | SpeakingExercise
    | ListeningExercise

// Achievement types
export type AchievementType = 'xp' | 'streak' | 'lessons' | 'perfect-session' | 'special'

export interface Achievement {
    id: string
    title: string
    description: string
    icon: string
    type: AchievementType
    requirement: {
        type: AchievementType
        value: number
    }
    xpReward: number
    rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

// Skill tree types
export interface SkillNode {
    id: string
    title: string
    description: string
    icon: string
    prerequisites: string[]
    lessons: string[]
    position: {
        x: number
        y: number
    }
    category: string
}

// Leaderboard types
export interface LeaderboardEntry {
    rank: number
    userId: string
    name: string
    avatar?: string
    xp: number
    level: number
    streak: number
    country?: string
}

// Session types
export interface SessionAnswer {
    exerciseId: string
    userAnswer: string
    correctAnswer: string
    isCorrect: boolean
    timeSpentMs: number
    xpEarned: number
}

export interface SessionSummary {
    totalXP: number
    accuracy: number
    timeSpentMinutes: number
    exercisesCompleted: number
    newLevel?: number
}

// AI types
export interface CorrectionRequest {
    userInput: string
    expectedAnswer: string
    context: string
    targetLanguage: string
}

export interface CorrectionResponse {
    original: string
    corrected: string
    explanation: string
    alternative: string
    errorType: 'grammar' | 'vocabulary' | 'tense' | 'word-order' | 'perfect'
    confidence: number
    microExercise: string
}

// API types
export interface APIResponse<T> {
    success: boolean
    data?: T
    error?: {
        code: string
        message: string
        details?: Record<string, string[]>
    }
    meta?: {
        timestamp: string
        requestId: string
    }
}
