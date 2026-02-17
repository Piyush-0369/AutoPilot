// XP Calculation Engine

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
