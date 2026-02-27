import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class LearningLessonModel extends Model {
    static table = 'learning_lessons';

    @field('unit_id') unitId!: string;
    @field('order_index') orderIndex!: number;
    @field('title') title!: string;
    @field('description') description!: string;
    @field('cefr_level') cefrLevel!: string;
    @field('estimated_minutes') estimatedMinutes!: number;
    @field('vocabulary_ids') vocabularyIds!: string;          // JSON string
    @field('grammar_topic_id') grammarTopicId!: string;
    @field('prerequisites') prerequisites!: string;           // JSON string
    @field('xp_reward') xpReward!: number;
}
