// Adaptive Difficulty Engine

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

export function getDifficultyLabel(difficulty: number): string {
    const labels = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert']
    return labels[difficulty] || 'Unknown'
}
