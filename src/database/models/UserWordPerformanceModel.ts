import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class UserWordPerformanceModel extends Model {
    static table = 'user_word_performance';

    @field('user_id') userId!: string;
    @field('vocabulary_id') vocabularyId!: string;
    @field('word') word!: string;
    @field('correct_count') correctCount!: number;
    @field('incorrect_count') incorrectCount!: number;
    @field('last_reviewed') lastReviewed!: number;
    @field('next_review_date') nextReviewDate!: number;
    @field('mastery_level') masteryLevel!: string;
    @field('interval_index') intervalIndex!: number;
}
