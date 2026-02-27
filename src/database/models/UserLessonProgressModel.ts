import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class UserLessonProgressModel extends Model {
    static table = 'user_lesson_progress';

    @field('user_id') userId!: string;
    @field('lesson_id') lessonId!: string;
    @field('is_unlocked') isUnlocked!: boolean;
    @field('is_completed') isCompleted!: boolean;
    @field('current_step') currentStep!: string;
    @field('teach_completed') teachCompleted!: boolean;
    @field('guided_practice_completed') guidedPracticeCompleted!: boolean;
    @field('reinforcement_completed') reinforcementCompleted!: boolean;
    @field('assessment_completed') assessmentCompleted!: boolean;
    @field('assessment_score') assessmentScore!: number;
    @field('best_score') bestScore!: number;
    @field('attempts') attempts!: number;
    @field('completed_at') completedAt!: number;
    @field('xp_earned') xpEarned!: number;
}
