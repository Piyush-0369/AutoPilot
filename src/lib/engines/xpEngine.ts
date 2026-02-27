// XP Calculation Engine — Enhanced with CEFR and Lesson Bonuses

export interface XPCalculationInput {
    difficulty: number // 1-5
    isCorrect: boolean
    timeSpentMs: number
    currentStreak: number
}

export interface XPCalculationResult {
    baseXP: number
    accuracyBonus: number
    speedBonus: number
    streakBonus: number
    totalXP: number
}

export function calculateXP(input: XPCalculationInput): XPCalculationResult {
    const { difficulty, isCorrect, timeSpentMs, currentStreak } = input

    const baseXP = 10 * difficulty

    // Accuracy bonus (0 if wrong, up to 50% of base if correct)
    const accuracyBonus = isCorrect ? baseXP * 0.5 : 0

    // Speed bonus (20% of base if answered in < 10 seconds)
    const speedBonus = timeSpentMs < 10000 ? baseXP * 0.2 : 0

    // Streak bonus (10% per streak level, max 10 streak)
    const streakBonus = baseXP * 0.1 * Math.min(currentStreak, 10)

    const totalXP = Math.round(baseXP + accuracyBonus + speedBonus + streakBonus)

    return {
        baseXP,
        accuracyBonus: Math.round(accuracyBonus),
        speedBonus: Math.round(speedBonus),
        streakBonus: Math.round(streakBonus),
        totalXP
    }
}

/**
 * Calculate XP with CEFR difficulty multiplier.
 * Higher CEFR levels give more XP.
 */
export function calculateXPWithCEFR(
    input: XPCalculationInput,
    cefrLevel: string
): XPCalculationResult {
    const cefrMultiplier: Record<string, number> = {
        'A1': 1.0, 'A2': 1.2, 'B1': 1.5, 'B2': 1.8, 'C1': 2.0, 'C2': 2.5
    }
    const multiplier = cefrMultiplier[cefrLevel] || 1.0
    const result = calculateXP(input)

    return {
        ...result,
        baseXP: Math.round(result.baseXP * multiplier),
        totalXP: Math.round(result.totalXP * multiplier),
    }
}

/**
 * Calculate lesson completion bonus XP.
 */
export function calculateLessonCompletionXP(
    baseReward: number,
    assessmentScore: number,
    isPerfect: boolean
): number {
    let xp = baseReward

    // Score bonus: up to 50% extra for high scores
    if (assessmentScore >= 90) {
        xp += Math.round(baseReward * 0.5)
    } else if (assessmentScore >= 80) {
        xp += Math.round(baseReward * 0.3)
    }

    // Perfect assessment bonus: 25% extra
    if (isPerfect) {
        xp += Math.round(baseReward * 0.25)
    }

    return xp
}

/**
 * Calculate daily goal completion bonus.
 */
export function calculateDailyGoalBonus(
    goalMinutes: number,
    actualMinutes: number
): number {
    if (actualMinutes >= goalMinutes) {
        return 25 // Flat 25 XP for completing daily goal
    }
    return 0
}

export function calculateLevel(totalXP: number): number {
    return Math.floor(totalXP / 100) + 1
}

export function getXPForNextLevel(currentXP: number): number {
    const currentLevel = calculateLevel(currentXP)
    return (currentLevel * 100) - currentXP
}

export function getProgressToNextLevel(currentXP: number): number {
    const xpInCurrentLevel = currentXP % 100
    return xpInCurrentLevel / 100
}

