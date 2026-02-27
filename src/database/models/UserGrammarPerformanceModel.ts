import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class UserGrammarPerformanceModel extends Model {
    static table = 'user_grammar_performance';

    @field('user_id') userId!: string;
    @field('grammar_topic_id') grammarTopicId!: string;
    @field('correct_count') correctCount!: number;
    @field('incorrect_count') incorrectCount!: number;
    @field('accuracy') accuracy!: number;
    @field('last_practiced') lastPracticed!: number;
    @field('mastery_level') masteryLevel!: string;
}
