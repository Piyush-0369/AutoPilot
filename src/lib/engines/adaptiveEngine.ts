// Adaptive Difficulty Engine — Enhanced with Per-Skill Tracking

import type { SkillPerformance } from '../../types/learningTypes'

export interface AdaptiveDifficultyInput {
    currentDifficulty: number
    correctStreak: number
    incorrectStreak: number
    lastAnswerCorrect: boolean
}

export interface AdaptiveDifficultyResult {
    newDifficulty: number
    difficultyChanged: boolean
    reason?: string
}

/**
 * Basic difficulty adjustment based on streak (existing).
 */
export function adjustDifficulty(input: AdaptiveDifficultyInput): AdaptiveDifficultyResult {
    const { currentDifficulty, correctStreak, incorrectStreak } = input

    // Increase difficulty after 3 correct in a row
    if (correctStreak >= 3) {
        const newDifficulty = Math.min(currentDifficulty + 1, 5)
        return {
            newDifficulty,
            difficultyChanged: newDifficulty !== currentDifficulty,
            reason: 'Increased difficulty due to correct streak'
        }
    }

    // Decrease difficulty after 2 incorrect in a row
    if (incorrectStreak >= 2) {
        const newDifficulty = Math.max(currentDifficulty - 1, 1)
        return {
            newDifficulty,
            difficultyChanged: newDifficulty !== currentDifficulty,
            reason: 'Decreased difficulty due to incorrect streak'
        }
    }

    return {
        newDifficulty: currentDifficulty,
        difficultyChanged: false
    }
}

/**
 * Per-skill difficulty adjustment. Recommends difficulty based on
 * multi-dimensional skill performance.
 */
export function adjustLessonDifficulty(skillPerformance: SkillPerformance): {
    recommendedDifficulty: number
    weakSkills: string[]
    strongSkills: string[]
    suggestion: string
} {
    const weakSkills: string[] = []
    const strongSkills: string[] = []

    // Evaluate each skill
    const skills = ['vocab', 'grammar', 'listening', 'speaking'] as const
    let totalWeighted = 0
    let totalWeight = 0

    for (const skill of skills) {
        const data = skillPerformance[skill]
        if (!data || data.count === 0) continue

        const accuracy = skill === 'speaking'
            ? (data as any).averageScore / 100
            : data.accuracy / 100

        totalWeighted += accuracy * data.count
        totalWeight += data.count

        if (accuracy < 0.5) {
            weakSkills.push(skill)
        } else if (accuracy >= 0.85) {
            strongSkills.push(skill)
        }
    }

    const overallAccuracy = totalWeight > 0 ? totalWeighted / totalWeight : 0.5

    // Map accuracy to difficulty (1-5)
    let recommendedDifficulty: number
    if (overallAccuracy >= 0.9) recommendedDifficulty = 5
    else if (overallAccuracy >= 0.8) recommendedDifficulty = 4
    else if (overallAccuracy >= 0.65) recommendedDifficulty = 3
    else if (overallAccuracy >= 0.45) recommendedDifficulty = 2
    else recommendedDifficulty = 1

    // Build suggestion
    let suggestion = ''
    if (weakSkills.length > 0) {
        suggestion = `Focus on improving: ${weakSkills.join(', ')}. `
    }
    if (strongSkills.length > 0) {
        suggestion += `Great progress in: ${strongSkills.join(', ')}!`
    }
    if (!suggestion) {
        suggestion = 'Keep practicing to improve your skills!'
    }

    return {
        recommendedDifficulty,
        weakSkills,
        strongSkills,
        suggestion: suggestion.trim(),
    }
}

/**
 * Get difficulty label.
 */
export function getDifficultyLabel(difficulty: number): string {
    const labels = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert']
    return labels[difficulty] || 'Unknown'
}

/**
 * Map CEFR level to difficulty number.
 */
export function cefrToDifficulty(cefr: string): number {
    const map: Record<string, number> = {
        'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 5
    }
    return map[cefr] || 1
}

