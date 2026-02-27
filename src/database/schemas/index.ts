import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 3, // Incremented: added learning path tables
  tables: [
    // --- USERS DOMAIN ---

    tableSchema({
      name: 'user_profiles',
      columns: [
        { name: 'username', type: 'string' },
        { name: 'email', type: 'string' },
        { name: 'native_language', type: 'string' },
        { name: 'target_languages', type: 'string' }, // JSON array of {languageCode, proficiencyLevel}
        { name: 'last_active_at', type: 'number' },
        { name: 'created_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'user_settings',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true }, // FK to user_profiles
        { name: 'theme', type: 'string' },
        { name: 'notifications', type: 'string' }, // JSON object
        { name: 'audio_settings', type: 'string' }, // JSON object
      ],
    }),

    tableSchema({
      name: 'user_progress',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true }, // FK
        { name: 'language_code', type: 'string' },
        { name: 'xp', type: 'number' },
        { name: 'streak', type: 'number' },
        { name: 'last_practice_date', type: 'number' },
        { name: 'topics_mastered', type: 'string' }, // JSON array of strings
        { name: 'vocabulary_count', type: 'number' },
      ],
    }),

    // --- CONVERSATIONS & TUTOR DOMAIN ---

    tableSchema({
      name: 'tutor_personas',
      columns: [
        { name: 'name', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'avatar_url', type: 'string' },
        { name: 'voice_id', type: 'string' },
        { name: 'traits', type: 'string' }, // JSON array
        { name: 'specialties', type: 'string' }, // JSON array
        { name: 'languages', type: 'string' }, // JSON array
      ],
    }),

    tableSchema({
      name: 'scenarios',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'difficulty_level', type: 'string' },
        { name: 'roles', type: 'string' }, // JSON object
        { name: 'objectives', type: 'string' }, // JSON array
        { name: 'initial_message', type: 'string' },
      ],
    }),

    tableSchema({
      name: 'knowledge_base_entries',
      columns: [
        { name: 'topic', type: 'string' },
        { name: 'language_code', type: 'string' },
        { name: 'content', type: 'string' },
        { name: 'difficulty_level', type: 'string' },
        { name: 'tags', type: 'string' }, // JSON array
      ],
    }),

    tableSchema({
      name: 'conversation_sessions',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true }, // FK
        { name: 'tutor_id', type: 'string', isIndexed: true }, // FK
        { name: 'scenario_id', type: 'string', isIndexed: true }, // FK
        { name: 'start_time', type: 'number' },
        { name: 'end_time', type: 'number', isOptional: true },
        { name: 'status', type: 'string' },
        { name: 'topic', type: 'string' },
        { name: 'language_code', type: 'string' },
      ],
    }),

    tableSchema({
      name: 'messages',
      columns: [
        { name: 'session_id', type: 'string', isIndexed: true }, // FK
        { name: 'sender', type: 'string' }, // "user" | "tutor" | "system"
        { name: 'content', type: 'string' },
        { name: 'audio_url', type: 'string', isOptional: true },
        { name: 'timestamp', type: 'number' },
        { name: 'corrections', type: 'string', isOptional: true }, // JSON array of {original, corrected, explanation}
      ],
    }),

    // --- GAMIFICATION DOMAIN ---

    tableSchema({
      name: 'achievements',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'icon_url', type: 'string' },
        { name: 'category', type: 'string' },
        { name: 'criteria', type: 'string' }, // JSON object
        { name: 'xp_reward', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'quests',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true }, // FK
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'type', type: 'string' }, // daily, weekly, special
        { name: 'status', type: 'string' }, // active, completed, expired
        { name: 'progress', type: 'number' },
        { name: 'goal', type: 'number' },
        { name: 'rewards', type: 'string' }, // JSON object {xp, currency}
        { name: 'expires_at', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'leaderboards',
      columns: [
        { name: 'type', type: 'string' }, // global, friends, league
        { name: 'period', type: 'string' }, // daily, weekly, all-time
        { name: 'entries', type: 'string' }, // JSON array containing userId rankings
        { name: 'updated_at', type: 'number' },
      ],
    }),

    // ============================================================
    // LEARNING PATH DOMAIN
    // ============================================================

    tableSchema({
      name: 'languages',
      columns: [
        { name: 'code', type: 'string', isIndexed: true },
        { name: 'name', type: 'string' },
        { name: 'native_name', type: 'string' },
        { name: 'locale', type: 'string' },
        { name: 'flag', type: 'string' },
        { name: 'stt_locale', type: 'string' },
        { name: 'tts_voice_id', type: 'string', isOptional: true },
      ],
    }),

    tableSchema({
      name: 'courses',
      columns: [
        { name: 'language_id', type: 'string', isIndexed: true },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'cefr_level', type: 'string' },
        { name: 'total_units', type: 'number' },
        { name: 'image_url', type: 'string', isOptional: true },
      ],
    }),

    tableSchema({
      name: 'units',
      columns: [
        { name: 'course_id', type: 'string', isIndexed: true },
        { name: 'order_index', type: 'number' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'theme', type: 'string' },
        { name: 'icon', type: 'string' },
        { name: 'total_lessons', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'learning_lessons',
      columns: [
        { name: 'unit_id', type: 'string', isIndexed: true },
        { name: 'order_index', type: 'number' },
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string' },
        { name: 'cefr_level', type: 'string' },
        { name: 'estimated_minutes', type: 'number' },
        { name: 'vocabulary_ids', type: 'string' },       // JSON array
        { name: 'grammar_topic_id', type: 'string', isOptional: true },
        { name: 'prerequisites', type: 'string' },        // JSON array
        { name: 'xp_reward', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'learning_exercises',
      columns: [
        { name: 'lesson_id', type: 'string', isIndexed: true },
        { name: 'step_type', type: 'string' },            // teach | guided-practice | reinforcement | assessment
        { name: 'order_index', type: 'number' },
        { name: 'type', type: 'string' },                 // translation | fill-blank | multiple-choice | ...
        { name: 'skill_type', type: 'string' },           // vocab | grammar | listening | speaking
        { name: 'difficulty', type: 'number' },
        { name: 'cefr_level', type: 'string' },
        { name: 'prompt', type: 'string' },
        { name: 'correct_answer', type: 'string' },
        { name: 'expected_answer_variants', type: 'string' }, // JSON array
        { name: 'options', type: 'string', isOptional: true },         // JSON array
        { name: 'correct_index', type: 'number', isOptional: true },
        { name: 'sentence', type: 'string', isOptional: true },
        { name: 'blank_position', type: 'number', isOptional: true },
        { name: 'word_bank', type: 'string', isOptional: true },       // JSON array
        { name: 'source_language', type: 'string', isOptional: true },
        { name: 'target_language', type: 'string', isOptional: true },
        { name: 'target_phrase', type: 'string', isOptional: true },
        { name: 'phonetics', type: 'string', isOptional: true },
        { name: 'context', type: 'string', isOptional: true },
        { name: 'hints', type: 'string', isOptional: true },           // JSON array
        { name: 'grammar_topic', type: 'string', isOptional: true },
        { name: 'required_words', type: 'string', isOptional: true },  // JSON array
      ],
    }),

    tableSchema({
      name: 'user_lesson_progress',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'lesson_id', type: 'string', isIndexed: true },
        { name: 'is_unlocked', type: 'boolean' },
        { name: 'is_completed', type: 'boolean' },
        { name: 'current_step', type: 'string' },         // teach | guided-practice | reinforcement | assessment
        { name: 'teach_completed', type: 'boolean' },
        { name: 'guided_practice_completed', type: 'boolean' },
        { name: 'reinforcement_completed', type: 'boolean' },
        { name: 'assessment_completed', type: 'boolean' },
        { name: 'assessment_score', type: 'number' },
        { name: 'best_score', type: 'number' },
        { name: 'attempts', type: 'number' },
        { name: 'completed_at', type: 'number', isOptional: true },
        { name: 'xp_earned', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'user_word_performance',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'vocabulary_id', type: 'string', isIndexed: true },
        { name: 'word', type: 'string' },
        { name: 'correct_count', type: 'number' },
        { name: 'incorrect_count', type: 'number' },
        { name: 'last_reviewed', type: 'number' },
        { name: 'next_review_date', type: 'number' },
        { name: 'mastery_level', type: 'string' },        // new | learning | reviewing | mastered
        { name: 'interval_index', type: 'number' },
      ],
    }),

    tableSchema({
      name: 'user_grammar_performance',
      columns: [
        { name: 'user_id', type: 'string', isIndexed: true },
        { name: 'grammar_topic_id', type: 'string', isIndexed: true },
        { name: 'correct_count', type: 'number' },
        { name: 'incorrect_count', type: 'number' },
        { name: 'accuracy', type: 'number' },
        { name: 'last_practiced', type: 'number' },
        { name: 'mastery_level', type: 'string' },        // weak | developing | strong | mastered
      ],
    }),

  ],
});
