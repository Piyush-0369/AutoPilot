// ============================================================
// Learning Path Service
// ============================================================
// Core service managing the learning curriculum, lesson progression,
// content retrieval, and review word injection.
// Uses in-memory seed data (can be swapped to API-backed later).

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    SEED_LANGUAGES,
    SEED_COURSES,
    SEED_UNITS,
    SEED_LESSONS,
    SEED_EXERCISES_JA_1_1,
    getVocabularyForLanguage,
    getGrammarForLanguage,
    getScenariosForLanguage,
} from '../data/seedData';
import type {
    VocabularyEntry,
    GrammarModule,
    LearningScenario,
    UserLessonProgress,
    WordPerformance,
    LessonStepType,
    CEFRLevel,
} from '../types/learningTypes';
import { REVIEW_INTERVALS } from '../types/learningTypes';

// Storage keys
const LESSON_PROGRESS_KEY = '@learning_lesson_progress';
const WORD_PERFORMANCE_KEY = '@learning_word_performance';

// ============================================================
// Learning Path Service Class
// ============================================================
class LearningPathServiceClass {

    // ----------------------------------------------------------
    // LANGUAGES
    // ----------------------------------------------------------
    getLanguages() {
        return SEED_LANGUAGES;
    }

    getLanguageByCode(code: string) {
        return SEED_LANGUAGES.find(l => l.code === code) ||
            SEED_LANGUAGES.find(l => l.name.toLowerCase() === code.toLowerCase());
    }

    // ----------------------------------------------------------
    // COURSES
    // ----------------------------------------------------------
    getCoursesForLanguage(languageId: string) {
        return SEED_COURSES.filter(c => c.languageId === languageId);
    }

    getCourseById(courseId: string) {
        return SEED_COURSES.find(c => c.id === courseId);
    }

    // ----------------------------------------------------------
    // UNITS
    // ----------------------------------------------------------
    getUnitsForCourse(courseId: string) {
        return SEED_UNITS
            .filter(u => u.courseId === courseId)
            .sort((a, b) => a.orderIndex - b.orderIndex);
    }

    // ----------------------------------------------------------
    // LESSONS
    // ----------------------------------------------------------
    getLessonsForUnit(unitId: string) {
        return SEED_LESSONS
            .filter(l => l.unitId === unitId)
            .sort((a, b) => a.orderIndex - b.orderIndex);
    }

    getLessonById(lessonId: string) {
        return SEED_LESSONS.find(l => l.id === lessonId);
    }

    // ----------------------------------------------------------
    // EXERCISES
    // ----------------------------------------------------------
    getExercisesForLesson(lessonId: string, stepType?: LessonStepType) {
        let exercises = this._getExercisesByLessonId(lessonId);
        if (stepType) {
            exercises = exercises.filter((e: any) => e.stepType === stepType);
        }
        return exercises.sort((a: any, b: any) => a.orderIndex - b.orderIndex);
    }

    private _getExercisesByLessonId(lessonId: string): any[] {
        // Currently using seed data; in production this would query the database
        switch (lessonId) {
            case 'lesson-ja-1-1': return SEED_EXERCISES_JA_1_1;
            // Add more lesson exercise sets here as they're created
            default: return [];
        }
    }

    // ----------------------------------------------------------
    // VOCABULARY
    // ----------------------------------------------------------
    getVocabularyForLesson(lessonId: string): VocabularyEntry[] {
        const lesson = this.getLessonById(lessonId);
        if (!lesson) return [];

        try {
            const vocabIds: string[] = JSON.parse(lesson.vocabularyIds);
            const langCode = lessonId.split('-')[1]; // e.g., 'ja' from 'lesson-ja-1-1'
            const allVocab = getVocabularyForLanguage(langCode);
            return allVocab.filter(v => vocabIds.includes(v.id));
        } catch {
            return [];
        }
    }

    getVocabularyById(vocabId: string): VocabularyEntry | undefined {
        // Search across all languages
        for (const lang of SEED_LANGUAGES) {
            const vocab = getVocabularyForLanguage(lang.code);
            const found = vocab.find(v => v.id === vocabId);
            if (found) return found;
        }
        return undefined;
    }

    getAllVocabularyForLanguage(langCode: string): VocabularyEntry[] {
        return getVocabularyForLanguage(langCode);
    }

    // ----------------------------------------------------------
    // GRAMMAR
    // ----------------------------------------------------------
    getGrammarForLesson(lessonId: string): GrammarModule | undefined {
        const lesson = this.getLessonById(lessonId);
        if (!lesson || !lesson.grammarTopicId) return undefined;

        const langCode = lessonId.split('-')[1];
        const modules = getGrammarForLanguage(langCode);
        return modules.find(g => g.id === lesson.grammarTopicId);
    }

    getGrammarById(grammarId: string): GrammarModule | undefined {
        return getGrammarForLanguage('ja')
            .concat(getGrammarForLanguage('fr'))
            .concat(getGrammarForLanguage('es'))
            .find(g => g.id === grammarId);
    }

    // ----------------------------------------------------------
    // SCENARIOS
    // ----------------------------------------------------------
    getScenariosForLanguage(langCode: string): LearningScenario[] {
        return getScenariosForLanguage(langCode);
    }

    // ----------------------------------------------------------
    // LESSON PROGRESS
    // ----------------------------------------------------------
    async getLessonProgress(userId: string): Promise<Record<string, UserLessonProgress>> {
        try {
            const stored = await AsyncStorage.getItem(LESSON_PROGRESS_KEY);
            if (stored) {
                const allProgress = JSON.parse(stored);
                return allProgress[userId] || {};
            }
        } catch (e) {
            console.error('[LearningPath] Error loading lesson progress:', e);
        }
        return {};
    }

    async getLessonProgressById(userId: string, lessonId: string): Promise<UserLessonProgress | null> {
        const progress = await this.getLessonProgress(userId);
        return progress[lessonId] || null;
    }

    async isLessonUnlocked(userId: string, lessonId: string): Promise<boolean> {
        const lesson = this.getLessonById(lessonId);
        if (!lesson) return false;

        // First lesson in a unit is always unlocked (if it has no prerequisites)
        try {
            const prereqs: string[] = JSON.parse(lesson.prerequisites);
            if (prereqs.length === 0) return true;

            // Check if all prerequisites are completed
            const progress = await this.getLessonProgress(userId);
            return prereqs.every(prereqId => progress[prereqId]?.isCompleted === true);
        } catch {
            return lesson.orderIndex === 0; // First lesson defaults to unlocked
        }
    }

    async completeLessonStep(
        userId: string,
        lessonId: string,
        step: LessonStepType,
        score?: number
    ): Promise<UserLessonProgress> {
        const progress = await this.getLessonProgress(userId);
        const existing = progress[lessonId] || this._createInitialProgress(userId, lessonId);

        // Update the step
        switch (step) {
            case 'teach':
                existing.teachCompleted = true;
                existing.currentStep = 'guided-practice';
                break;
            case 'guided-practice':
                existing.guidedPracticeCompleted = true;
                existing.currentStep = 'reinforcement';
                break;
            case 'reinforcement':
                existing.reinforcementCompleted = true;
                existing.currentStep = 'assessment';
                break;
            case 'assessment':
                existing.assessmentCompleted = true;
                existing.assessmentScore = score || 0;
                existing.bestScore = Math.max(existing.bestScore, score || 0);
                existing.attempts += 1;

                // Pass threshold: 70%
                if ((score || 0) >= 70) {
                    existing.isCompleted = true;
                    existing.completedAt = new Date().toISOString();
                    const lesson = this.getLessonById(lessonId);
                    existing.xpEarned = lesson?.xpReward || 50;
                }
                break;
        }

        // Save
        progress[lessonId] = existing;
        await this._saveLessonProgress(userId, progress);
        return existing;
    }

    async getNextLesson(userId: string, currentLessonId: string): Promise<string | null> {
        const currentLesson = this.getLessonById(currentLessonId);
        if (!currentLesson) return null;

        const unitLessons = this.getLessonsForUnit(currentLesson.unitId);
        const currentIdx = unitLessons.findIndex(l => l.id === currentLessonId);

        if (currentIdx < unitLessons.length - 1) {
            // Next lesson in same unit
            return unitLessons[currentIdx + 1].id;
        }

        // Try to find next unit's first lesson
        const unit = SEED_UNITS.find(u => u.id === currentLesson.unitId);
        if (!unit) return null;

        const courseUnits = this.getUnitsForCourse(unit.courseId);
        const unitIdx = courseUnits.findIndex(u => u.id === unit.id);

        if (unitIdx < courseUnits.length - 1) {
            const nextUnit = courseUnits[unitIdx + 1];
            const nextUnitLessons = this.getLessonsForUnit(nextUnit.id);
            return nextUnitLessons.length > 0 ? nextUnitLessons[0].id : null;
        }

        return null; // Course complete!
    }

    // ----------------------------------------------------------
    // WORD PERFORMANCE / SRS
    // ----------------------------------------------------------
    async getWordPerformance(userId: string): Promise<Record<string, WordPerformance>> {
        try {
            const stored = await AsyncStorage.getItem(WORD_PERFORMANCE_KEY);
            if (stored) {
                const all = JSON.parse(stored);
                return all[userId] || {};
            }
        } catch (e) {
            console.error('[LearningPath] Error loading word performance:', e);
        }
        return {};
    }

    async recordWordResult(userId: string, vocabularyId: string, word: string, isCorrect: boolean): Promise<void> {
        const performances = await this.getWordPerformance(userId);
        const existing = performances[vocabularyId] || this._createInitialWordPerformance(userId, vocabularyId, word);

        if (isCorrect) {
            existing.correctCount += 1;
            existing.intervalIndex = Math.min(existing.intervalIndex + 1, REVIEW_INTERVALS.length - 1);
            existing.masteryLevel = this._calculateMasteryLevel(existing);
        } else {
            existing.incorrectCount += 1;
            existing.intervalIndex = 0; // Reset to 1 day
            existing.masteryLevel = existing.correctCount > 0 ? 'learning' : 'new';
        }

        const now = new Date();
        existing.lastReviewed = now.toISOString();
        const nextDays = REVIEW_INTERVALS[existing.intervalIndex];
        const nextDate = new Date(now.getTime() + nextDays * 24 * 60 * 60 * 1000);
        existing.nextReviewDate = nextDate.toISOString();

        performances[vocabularyId] = existing;
        await this._saveWordPerformance(userId, performances);
    }

    async getDueReviewWords(userId: string): Promise<WordPerformance[]> {
        const performances = await this.getWordPerformance(userId);
        const now = new Date();
        return Object.values(performances).filter(wp => {
            return new Date(wp.nextReviewDate) <= now && wp.masteryLevel !== 'mastered';
        });
    }

    async getWeakWords(userId: string): Promise<WordPerformance[]> {
        const performances = await this.getWordPerformance(userId);
        return Object.values(performances)
            .filter(wp => wp.masteryLevel === 'new' || wp.masteryLevel === 'learning')
            .sort((a, b) => {
                const aAccuracy = a.correctCount / Math.max(1, a.correctCount + a.incorrectCount);
                const bAccuracy = b.correctCount / Math.max(1, b.correctCount + b.incorrectCount);
                return aAccuracy - bAccuracy;
            });
    }

    // ----------------------------------------------------------
    // COURSE PROGRESS SUMMARY
    // ----------------------------------------------------------
    async getCourseProgress(userId: string, courseId: string) {
        const units = this.getUnitsForCourse(courseId);
        const progress = await this.getLessonProgress(userId);

        let totalLessons = 0;
        let completedLessons = 0;
        let totalXP = 0;

        for (const unit of units) {
            const lessons = this.getLessonsForUnit(unit.id);
            totalLessons += lessons.length;

            for (const lesson of lessons) {
                const lp = progress[lesson.id];
                if (lp?.isCompleted) {
                    completedLessons += 1;
                    totalXP += lp.xpEarned;
                }
            }
        }

        return {
            totalLessons,
            completedLessons,
            totalXP,
            progressPercent: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
        };
    }

    // ----------------------------------------------------------
    // PRIVATE HELPERS
    // ----------------------------------------------------------
    private _createInitialProgress(userId: string, lessonId: string): UserLessonProgress {
        return {
            id: `${userId}-${lessonId}`,
            userId,
            lessonId,
            isUnlocked: true,
            isCompleted: false,
            currentStep: 'teach',
            teachCompleted: false,
            guidedPracticeCompleted: false,
            reinforcementCompleted: false,
            assessmentCompleted: false,
            assessmentScore: 0,
            bestScore: 0,
            attempts: 0,
            xpEarned: 0,
        };
    }

    private _createInitialWordPerformance(userId: string, vocabularyId: string, word: string): WordPerformance {
        return {
            id: `${userId}-${vocabularyId}`,
            userId,
            vocabularyId,
            correctCount: 0,
            incorrectCount: 0,
            lastReviewed: new Date().toISOString(),
            nextReviewDate: new Date().toISOString(),
            masteryLevel: 'new',
            intervalIndex: 0,
        };
    }

    private _calculateMasteryLevel(wp: WordPerformance): WordPerformance['masteryLevel'] {
        const total = wp.correctCount + wp.incorrectCount;
        const accuracy = total > 0 ? wp.correctCount / total : 0;

        if (wp.intervalIndex >= REVIEW_INTERVALS.length - 1 && accuracy >= 0.9) return 'mastered';
        if (wp.intervalIndex >= 3 && accuracy >= 0.7) return 'reviewing';
        if (wp.correctCount > 0) return 'learning';
        return 'new';
    }

    private async _saveLessonProgress(userId: string, progress: Record<string, UserLessonProgress>) {
        try {
            const stored = await AsyncStorage.getItem(LESSON_PROGRESS_KEY);
            const all = stored ? JSON.parse(stored) : {};
            all[userId] = progress;
            await AsyncStorage.setItem(LESSON_PROGRESS_KEY, JSON.stringify(all));
        } catch (e) {
            console.error('[LearningPath] Error saving lesson progress:', e);
        }
    }

    private async _saveWordPerformance(userId: string, performances: Record<string, WordPerformance>) {
        try {
            const stored = await AsyncStorage.getItem(WORD_PERFORMANCE_KEY);
            const all = stored ? JSON.parse(stored) : {};
            all[userId] = performances;
            await AsyncStorage.setItem(WORD_PERFORMANCE_KEY, JSON.stringify(all));
        } catch (e) {
            console.error('[LearningPath] Error saving word performance:', e);
        }
    }
}

// Singleton export
export const learningPathService = new LearningPathServiceClass();
