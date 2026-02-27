import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export class LearningExerciseModel extends Model {
    static table = 'learning_exercises';

    @field('lesson_id') lessonId!: string;
    @field('step_type') stepType!: string;
    @field('order_index') orderIndex!: number;
    @field('type') type!: string;
    @field('skill_type') skillType!: string;
    @field('difficulty') difficulty!: number;
    @field('cefr_level') cefrLevel!: string;
    @field('prompt') prompt!: string;
    @field('correct_answer') correctAnswer!: string;
    @field('expected_answer_variants') expectedAnswerVariants!: string;  // JSON
    @field('options') options!: string;                    // JSON
    @field('correct_index') correctIndex!: number;
    @field('sentence') sentence!: string;
    @field('blank_position') blankPosition!: number;
    @field('word_bank') wordBank!: string;                // JSON
    @field('source_language') sourceLanguage!: string;
    @field('target_language') targetLanguage!: string;
    @field('target_phrase') targetPhrase!: string;
    @field('phonetics') phonetics!: string;
    @field('context') context!: string;
    @field('hints') hints!: string;                       // JSON
    @field('grammar_topic') grammarTopic!: string;
    @field('required_words') requiredWords!: string;      // JSON
}
