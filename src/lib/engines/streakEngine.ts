// Streak Tracking Engine

export interface StreakUpdateInput {
    lastActiveDate: string // ISO date string
    currentStreak: number
    longestStreak: number
}

export interface StreakUpdateResult {
    newStreak: number
    longestStreak: number
    streakMaintained: boolean
    streakBroken: boolean
    isNewRecord: boolean
}

export function updateStreak(input: StreakUpdateInput): StreakUpdateResult {
    const { lastActiveDate, currentStreak, longestStreak } = input

    const today = new Date().toISOString().split('T')[0]
    const lastActive = lastActiveDate.split('T')[0]

    // Calculate yesterday's date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    let newStreak = currentStreak
    let streakMaintained = false
    let streakBroken = false

    if (lastActive === today) {
        // Already active today, maintain streak
        newStreak = currentStreak
        streakMaintained = true
    } else if (lastActive === yesterdayStr) {
        // Active yesterday, increment streak
        newStreak = currentStreak + 1
        streakMaintained = true
    } else {
        // Missed a day, reset streak
        newStreak = 1
        streakBroken = currentStreak > 0
    }

    const newLongestStreak = Math.max(longestStreak, newStreak)
    const isNewRecord = newStreak > longestStreak

    return {
        newStreak,
        longestStreak: newLongestStreak,
        streakMaintained,
        streakBroken,
        isNewRecord
    }
}

export function getStreakStatus(streak: number): {
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert' | 'master'
    emoji: string
    message: string
} {
    if (streak >= 100) {
        return { level: 'master', emoji: '🏆', message: 'Legendary streak!' }
    } else if (streak >= 30) {
        return { level: 'expert', emoji: '🔥', message: 'On fire!' }
    } else if (streak >= 14) {
        return { level: 'advanced', emoji: '⚡', message: 'Crushing it!' }
    } else if (streak >= 7) {
        return { level: 'intermediate', emoji: '💪', message: 'Building momentum!' }
    } else {
        return { level: 'beginner', emoji: '🌱', message: 'Keep going!' }
    }
}
