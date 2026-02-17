// Spaced Repetition System (SRS) Engine - Simplified SM-2

import { SRSItem } from '../../types'

export interface SRSReviewInput {
    item: SRSItem
    quality: number // 0-5 (0=complete blackout, 5=perfect recall)
}

export interface SRSReviewResult {
    updatedItem: SRSItem
    daysUntilNextReview: number
}

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
