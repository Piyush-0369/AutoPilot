// Spaced Repetition System (SRS) Engine - Simplified SM-2 + Custom Intervals

import { SRSItem } from '../../types'

export interface SRSReviewInput {
    item: SRSItem
    quality: number // 0-5 (0=complete blackout, 5=perfect recall)
}

export interface SRSReviewResult {
    updatedItem: SRSItem
    daysUntilNextReview: number
}

// Custom fixed intervals (fallback / alternative to SM-2 dynamic)
export const CUSTOM_REVIEW_INTERVALS = [1, 3, 7, 14, 30, 60] // days

export type WordMasteryLevel = 'new' | 'learning' | 'reviewing' | 'mastered'

/**
 * Standard SM-2 SRS review — existing implementation
 */
export function reviewItem(input: SRSReviewInput): SRSReviewResult {
    const { item, quality } = input
    let { eFactor, intervalDays, repetitionCount } = item

    // Update eFactor
    eFactor = eFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    eFactor = Math.max(eFactor, 1.3)

    // Calculate new interval
    if (quality < 3) {
        // Incorrect answer - reset
        repetitionCount = 0
        intervalDays = 1
    } else {
        // Correct answer - increase interval
        if (repetitionCount === 0) {
            intervalDays = 1
        } else if (repetitionCount === 1) {
            intervalDays = 6
        } else {
            intervalDays = Math.round(intervalDays * eFactor)
        }
        repetitionCount += 1
    }

    const now = new Date()
    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000)

    const updatedItem: SRSItem = {
        ...item,
        eFactor,
        intervalDays,
        repetitionCount,
        lastReviewed: now.toISOString(),
        nextReview: nextReview.toISOString()
    }

    return {
        updatedItem,
        daysUntilNextReview: intervalDays
    }
}

/**
 * Custom fixed-interval SRS review.
 * Simpler than SM-2: if correct, advance to next interval; if wrong, reset to 1 day.
 */
export function reviewWithCustomIntervals(
    item: SRSItem,
    isCorrect: boolean
): SRSReviewResult {
    let intervalIndex = (item as any).intervalIndex ?? 0

    if (isCorrect) {
        intervalIndex = Math.min(intervalIndex + 1, CUSTOM_REVIEW_INTERVALS.length - 1)
    } else {
        intervalIndex = 0 // Reset to 1 day
    }

    const intervalDays = CUSTOM_REVIEW_INTERVALS[intervalIndex]
    const now = new Date()
    const nextReview = new Date(now.getTime() + intervalDays * 24 * 60 * 60 * 1000)

    const updatedItem: SRSItem = {
        ...item,
        intervalDays,
        repetitionCount: isCorrect ? item.repetitionCount + 1 : 0,
        eFactor: item.eFactor,
        lastReviewed: now.toISOString(),
        nextReview: nextReview.toISOString(),
    }
        // Store intervalIndex on the item for next call
        ; (updatedItem as any).intervalIndex = intervalIndex

    return {
        updatedItem,
        daysUntilNextReview: intervalDays,
    }
}

/**
 * Calculate word mastery level based on SRS progress.
 */
export function getWordMasteryLevel(item: SRSItem): WordMasteryLevel {
    const intervalIndex = (item as any).intervalIndex ?? 0

    if (intervalIndex >= CUSTOM_REVIEW_INTERVALS.length - 1 && item.repetitionCount >= 5) {
        return 'mastered'
    }
    if (intervalIndex >= 3) {
        return 'reviewing'
    }
    if (item.repetitionCount > 0) {
        return 'learning'
    }
    return 'new'
}

export function getDueItems(items: SRSItem[]): SRSItem[] {
    const now = new Date()
    return items.filter(item => new Date(item.nextReview) <= now)
}

export function createNewSRSItem(itemId: string): SRSItem {
    return {
        itemId,
        eFactor: 2.5,
        intervalDays: 1,
        repetitionCount: 0,
        nextReview: new Date().toISOString(),
        lastReviewed: new Date().toISOString()
    }
}

