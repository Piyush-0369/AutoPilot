// ============================================================
// Seed Data — Structured Language Learning Content
// ============================================================
// This file provides in-memory seed data for the learning path system.
// In production, this data would be served from a backend API.
// The structure supports easy expansion to new languages.

import type {
    VocabularyEntry,
    GrammarModule,
    LearningScenario,
    CEFRLevel,
} from '../types/learningTypes';

// ============================================================
// SUPPORTED LANGUAGES
// ============================================================
export const SEED_LANGUAGES = [
    {
        id: 'lang-ja',
        code: 'ja',
        name: 'Japanese',
        nativeName: '日本語',
        locale: 'ja-JP',
        flag: '🇯🇵',
        sttLocale: 'ja',
        ttsVoiceId: undefined,
    },
    {
        id: 'lang-fr',
        code: 'fr',
        name: 'French',
        nativeName: 'Français',
        locale: 'fr-FR',
        flag: '🇫🇷',
        sttLocale: 'fr',
        ttsVoiceId: 'vits-piper-fr_FR-siwis-medium',
    },
    {
        id: 'lang-es',
        code: 'es',
        name: 'Spanish',
        nativeName: 'Español',
        locale: 'es-ES',
        flag: '🇪🇸',
        sttLocale: 'es',
        ttsVoiceId: 'vits-piper-es_ES-carlfm-medium',
    },
    {
        id: 'lang-de',
        code: 'de',
        name: 'German',
        nativeName: 'Deutsch',
        locale: 'de-DE',
        flag: '🇩🇪',
        sttLocale: 'de',
        ttsVoiceId: 'vits-piper-de_DE-thorsten-medium',
    },
];

// ============================================================
// COURSES
// ============================================================
export const SEED_COURSES = [
    {
        id: 'course-ja-beginner',
        languageId: 'lang-ja',
        title: 'Japanese for Beginners',
        description: 'Start your Japanese journey from zero. Learn hiragana, basic grammar, and essential vocabulary.',
        cefrLevel: 'A1' as CEFRLevel,
        totalUnits: 5,
    },
    {
        id: 'course-fr-beginner',
        languageId: 'lang-fr',
        title: 'French for Beginners',
        description: 'Learn French from scratch. Master greetings, essential phrases, and foundational grammar.',
        cefrLevel: 'A1' as CEFRLevel,
        totalUnits: 5,
    },
    {
        id: 'course-es-beginner',
        languageId: 'lang-es',
        title: 'Spanish for Beginners',
        description: 'Begin speaking Spanish today. Cover greetings, numbers, and daily conversation.',
        cefrLevel: 'A1' as CEFRLevel,
        totalUnits: 5,
    },
];

// ============================================================
// UNITS (Japanese Course)
// ============================================================
export const SEED_UNITS = [
    // --- Japanese ---
    {
        id: 'unit-ja-1',
        courseId: 'course-ja-beginner',
        orderIndex: 0,
        title: 'First Steps',
        description: 'Basic greetings and self-introduction',
        theme: 'greetings',
        icon: '👋',
        totalLessons: 5,
    },
    {
        id: 'unit-ja-2',
        courseId: 'course-ja-beginner',
        orderIndex: 1,
        title: 'Daily Life',
        description: 'Numbers, time, and daily routine',
        theme: 'daily',
        icon: '🌅',
        totalLessons: 5,
    },
    {
        id: 'unit-ja-3',
        courseId: 'course-ja-beginner',
        orderIndex: 2,
        title: 'Dining Out',
        description: 'Order food and drinks',
        theme: 'food',
        icon: '🍣',
        totalLessons: 5,
    },
    {
        id: 'unit-ja-4',
        courseId: 'course-ja-beginner',
        orderIndex: 3,
        title: 'Getting Around',
        description: 'Navigate transportation and directions',
        theme: 'travel',
        icon: '🚃',
        totalLessons: 5,
    },
    {
        id: 'unit-ja-5',
        courseId: 'course-ja-beginner',
        orderIndex: 4,
        title: 'Shopping & Services',
        description: 'Buy things and handle transactions',
        theme: 'shopping',
        icon: '🛍️',
        totalLessons: 5,
    },
    // --- French ---
    {
        id: 'unit-fr-1',
        courseId: 'course-fr-beginner',
        orderIndex: 0,
        title: 'Bonjour!',
        description: 'Basic greetings and introductions',
        theme: 'greetings',
        icon: '👋',
        totalLessons: 5,
    },
    {
        id: 'unit-fr-2',
        courseId: 'course-fr-beginner',
        orderIndex: 1,
        title: 'La Vie Quotidienne',
        description: 'Numbers, time, and daily life',
        theme: 'daily',
        icon: '🌅',
        totalLessons: 5,
    },
    {
        id: 'unit-fr-3',
        courseId: 'course-fr-beginner',
        orderIndex: 2,
        title: 'Au Restaurant',
        description: 'Order food and drinks in French',
        theme: 'food',
        icon: '🥐',
        totalLessons: 5,
    },
    // --- Spanish ---
    {
        id: 'unit-es-1',
        courseId: 'course-es-beginner',
        orderIndex: 0,
        title: '¡Hola!',
        description: 'Basic greetings and introductions',
        theme: 'greetings',
        icon: '👋',
        totalLessons: 5,
    },
    {
        id: 'unit-es-2',
        courseId: 'course-es-beginner',
        orderIndex: 1,
        title: 'Vida Diaria',
        description: 'Numbers, time, and daily life',
        theme: 'daily',
        icon: '🌅',
        totalLessons: 5,
    },
    {
        id: 'unit-es-3',
        courseId: 'course-es-beginner',
        orderIndex: 2,
        title: 'En el Restaurante',
        description: 'Order food and drinks in Spanish',
        theme: 'food',
        icon: '🌮',
        totalLessons: 5,
    },
];

// ============================================================
// LESSONS (Japanese Unit 1: First Steps)
// ============================================================
export const SEED_LESSONS = [
    // --- Japanese Unit 1 ---
    {
        id: 'lesson-ja-1-1',
        unitId: 'unit-ja-1',
        orderIndex: 0,
        title: 'Hello & Goodbye',
        description: 'Learn the most basic Japanese greetings',
        cefrLevel: 'A1' as CEFRLevel,
        estimatedMinutes: 8,
        vocabularyIds: '["vocab-ja-1","vocab-ja-2","vocab-ja-3","vocab-ja-4","vocab-ja-5"]',
        grammarTopicId: 'grammar-ja-desu',
        prerequisites: '[]',
        xpReward: 50,
    },
    {
        id: 'lesson-ja-1-2',
        unitId: 'unit-ja-1',
        orderIndex: 1,
        title: 'Self-Introduction',
        description: 'Introduce yourself in Japanese',
        cefrLevel: 'A1' as CEFRLevel,
        estimatedMinutes: 10,
        vocabularyIds: '["vocab-ja-6","vocab-ja-7","vocab-ja-8","vocab-ja-9","vocab-ja-10"]',
        grammarTopicId: 'grammar-ja-wa-particle',
        prerequisites: '["lesson-ja-1-1"]',
        xpReward: 60,
    },
    {
        id: 'lesson-ja-1-3',
        unitId: 'unit-ja-1',
        orderIndex: 2,
        title: 'Polite Expressions',
        description: 'Thank you, sorry, and excuse me',
        cefrLevel: 'A1' as CEFRLevel,
        estimatedMinutes: 8,
        vocabularyIds: '["vocab-ja-11","vocab-ja-12","vocab-ja-13","vocab-ja-14","vocab-ja-15"]',
        grammarTopicId: null,
        prerequisites: '["lesson-ja-1-2"]',
        xpReward: 50,
    },
    {
        id: 'lesson-ja-1-4',
        unitId: 'unit-ja-1',
        orderIndex: 3,
        title: 'How Are You?',
        description: 'Ask about feelings and health',
        cefrLevel: 'A1' as CEFRLevel,
        estimatedMinutes: 10,
        vocabularyIds: '["vocab-ja-16","vocab-ja-17","vocab-ja-18","vocab-ja-19","vocab-ja-20"]',
        grammarTopicId: 'grammar-ja-ka-question',
        prerequisites: '["lesson-ja-1-3"]',
        xpReward: 60,
    },
    {
        id: 'lesson-ja-1-5',
        unitId: 'unit-ja-1',
        orderIndex: 4,
        title: 'Review: First Steps',
        description: 'Review everything from Unit 1',
        cefrLevel: 'A1' as CEFRLevel,
        estimatedMinutes: 12,
        vocabularyIds: '[]',
        grammarTopicId: null,
        prerequisites: '["lesson-ja-1-4"]',
        xpReward: 80,
    },
    // --- Japanese Unit 2: Daily Life ---
    {
        id: 'lesson-ja-2-1',
        unitId: 'unit-ja-2',
        orderIndex: 0,
        title: 'Numbers 1-10',
        description: 'Count from one to ten in Japanese',
        cefrLevel: 'A1' as CEFRLevel,
        estimatedMinutes: 8,
        vocabularyIds: '["vocab-ja-21","vocab-ja-22","vocab-ja-23","vocab-ja-24","vocab-ja-25"]',
        grammarTopicId: null,
        prerequisites: '["lesson-ja-1-5"]',
        xpReward: 50,
    },
    {
        id: 'lesson-ja-2-2',
        unitId: 'unit-ja-2',
        orderIndex: 1,
        title: 'Time & Days',
        description: 'Tell time and days of the week',
        cefrLevel: 'A1' as CEFRLevel,
        estimatedMinutes: 10,
        vocabularyIds: '["vocab-ja-26","vocab-ja-27","vocab-ja-28","vocab-ja-29","vocab-ja-30"]',
        grammarTopicId: null,
        prerequisites: '["lesson-ja-2-1"]',
        xpReward: 60,
    },
    // --- French Unit 1 ---
    {
        id: 'lesson-fr-1-1',
        unitId: 'unit-fr-1',
        orderIndex: 0,
        title: 'Basic Greetings',
        description: 'Say hello and goodbye in French',
        cefrLevel: 'A1' as CEFRLevel,
        estimatedMinutes: 8,
        vocabularyIds: '["vocab-fr-1","vocab-fr-2","vocab-fr-3","vocab-fr-4","vocab-fr-5"]',
        grammarTopicId: null,
        prerequisites: '[]',
        xpReward: 50,
    },
    {
        id: 'lesson-fr-1-2',
        unitId: 'unit-fr-1',
        orderIndex: 1,
        title: 'Introductions',
        description: 'Introduce yourself in French',
        cefrLevel: 'A1' as CEFRLevel,
        estimatedMinutes: 10,
        vocabularyIds: '["vocab-fr-6","vocab-fr-7","vocab-fr-8","vocab-fr-9","vocab-fr-10"]',
        grammarTopicId: 'grammar-fr-je-suis',
        prerequisites: '["lesson-fr-1-1"]',
        xpReward: 60,
    },
    // --- Spanish Unit 1 ---
    {
        id: 'lesson-es-1-1',
        unitId: 'unit-es-1',
        orderIndex: 0,
        title: 'Basic Greetings',
        description: 'Say hello and goodbye in Spanish',
        cefrLevel: 'A1' as CEFRLevel,
        estimatedMinutes: 8,
        vocabularyIds: '["vocab-es-1","vocab-es-2","vocab-es-3","vocab-es-4","vocab-es-5"]',
        grammarTopicId: null,
        prerequisites: '[]',
        xpReward: 50,
    },
    {
        id: 'lesson-es-1-2',
        unitId: 'unit-es-1',
        orderIndex: 1,
        title: 'Introductions',
        description: 'Introduce yourself in Spanish',
        cefrLevel: 'A1' as CEFRLevel,
        estimatedMinutes: 10,
        vocabularyIds: '["vocab-es-6","vocab-es-7","vocab-es-8","vocab-es-9","vocab-es-10"]',
        grammarTopicId: 'grammar-es-ser-estar',
        prerequisites: '["lesson-es-1-1"]',
        xpReward: 60,
    },
];

// ============================================================
// VOCABULARY — Japanese (A1)
// ============================================================
export const SEED_VOCABULARY_JA: VocabularyEntry[] = [
    // Unit 1 Lesson 1: Hello & Goodbye
    { id: 'vocab-ja-1', languageCode: 'ja', word: 'こんにちは', nativeScript: 'こんにちは', phonetic: 'konnichiwa', meaning: 'Hello / Good afternoon', partOfSpeech: 'greeting', exampleSentence: 'こんにちは、元気ですか？', exampleTranslation: 'Hello, how are you?', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-ja-2', languageCode: 'ja', word: 'さようなら', nativeScript: 'さようなら', phonetic: 'sayounara', meaning: 'Goodbye', partOfSpeech: 'greeting', exampleSentence: 'さようなら、また明日！', exampleTranslation: 'Goodbye, see you tomorrow!', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-ja-3', languageCode: 'ja', word: 'おはようございます', nativeScript: 'おはようございます', phonetic: 'ohayou gozaimasu', meaning: 'Good morning (polite)', partOfSpeech: 'greeting', exampleSentence: 'おはようございます、先生。', exampleTranslation: 'Good morning, teacher.', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-ja-4', languageCode: 'ja', word: 'こんばんは', nativeScript: 'こんばんは', phonetic: 'konbanwa', meaning: 'Good evening', partOfSpeech: 'greeting', exampleSentence: 'こんばんは、お元気ですか？', exampleTranslation: 'Good evening, how are you?', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-ja-5', languageCode: 'ja', word: 'おやすみなさい', nativeScript: 'おやすみなさい', phonetic: 'oyasuminasai', meaning: 'Good night', partOfSpeech: 'greeting', exampleSentence: 'おやすみなさい、いい夢を。', exampleTranslation: 'Good night, sweet dreams.', cefrLevel: 'A1', category: 'greetings' },
    // Unit 1 Lesson 2: Self-Introduction
    { id: 'vocab-ja-6', languageCode: 'ja', word: '私', nativeScript: '私', phonetic: 'watashi', meaning: 'I / me', partOfSpeech: 'pronoun', exampleSentence: '私は学生です。', exampleTranslation: 'I am a student.', cefrLevel: 'A1', category: 'pronouns' },
    { id: 'vocab-ja-7', languageCode: 'ja', word: '名前', nativeScript: '名前', phonetic: 'namae', meaning: 'name', partOfSpeech: 'noun', exampleSentence: '名前は何ですか？', exampleTranslation: 'What is your name?', cefrLevel: 'A1', category: 'basics' },
    { id: 'vocab-ja-8', languageCode: 'ja', word: 'です', nativeScript: 'です', phonetic: 'desu', meaning: 'is / am / are (copula)', partOfSpeech: 'verb', exampleSentence: '私は田中です。', exampleTranslation: 'I am Tanaka.', cefrLevel: 'A1', category: 'grammar' },
    { id: 'vocab-ja-9', languageCode: 'ja', word: 'はじめまして', nativeScript: 'はじめまして', phonetic: 'hajimemashite', meaning: 'Nice to meet you', partOfSpeech: 'greeting', exampleSentence: 'はじめまして、田中です。', exampleTranslation: 'Nice to meet you, I am Tanaka.', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-ja-10', languageCode: 'ja', word: 'よろしくお願いします', nativeScript: 'よろしくお願いします', phonetic: 'yoroshiku onegaishimasu', meaning: 'Please take care of me / Pleased to meet you', partOfSpeech: 'expression', exampleSentence: '田中です。よろしくお願いします。', exampleTranslation: 'I am Tanaka. Pleased to meet you.', cefrLevel: 'A1', category: 'greetings' },
    // Unit 1 Lesson 3: Polite Expressions
    { id: 'vocab-ja-11', languageCode: 'ja', word: 'ありがとうございます', nativeScript: 'ありがとうございます', phonetic: 'arigatou gozaimasu', meaning: 'Thank you (polite)', partOfSpeech: 'expression', exampleSentence: 'ありがとうございます、助かりました。', exampleTranslation: 'Thank you, that helped.', cefrLevel: 'A1', category: 'politeness' },
    { id: 'vocab-ja-12', languageCode: 'ja', word: 'すみません', nativeScript: 'すみません', phonetic: 'sumimasen', meaning: 'Excuse me / Sorry', partOfSpeech: 'expression', exampleSentence: 'すみません、駅はどこですか？', exampleTranslation: 'Excuse me, where is the station?', cefrLevel: 'A1', category: 'politeness' },
    { id: 'vocab-ja-13', languageCode: 'ja', word: 'ごめんなさい', nativeScript: 'ごめんなさい', phonetic: 'gomen nasai', meaning: 'I am sorry', partOfSpeech: 'expression', exampleSentence: 'ごめんなさい、遅れました。', exampleTranslation: 'I am sorry, I was late.', cefrLevel: 'A1', category: 'politeness' },
    { id: 'vocab-ja-14', languageCode: 'ja', word: 'はい', nativeScript: 'はい', phonetic: 'hai', meaning: 'Yes', partOfSpeech: 'adverb', exampleSentence: 'はい、わかりました。', exampleTranslation: 'Yes, I understand.', cefrLevel: 'A1', category: 'basics' },
    { id: 'vocab-ja-15', languageCode: 'ja', word: 'いいえ', nativeScript: 'いいえ', phonetic: 'iie', meaning: 'No', partOfSpeech: 'adverb', exampleSentence: 'いいえ、違います。', exampleTranslation: 'No, that is wrong.', cefrLevel: 'A1', category: 'basics' },
    // Unit 1 Lesson 4: How are you?
    { id: 'vocab-ja-16', languageCode: 'ja', word: '元気', nativeScript: '元気', phonetic: 'genki', meaning: 'healthy / well / energetic', partOfSpeech: 'adjective', exampleSentence: '元気ですか？', exampleTranslation: 'How are you?', cefrLevel: 'A1', category: 'feelings' },
    { id: 'vocab-ja-17', languageCode: 'ja', word: 'お元気ですか', nativeScript: 'お元気ですか', phonetic: 'ogenki desu ka', meaning: 'How are you? (polite)', partOfSpeech: 'expression', exampleSentence: 'お元気ですか？', exampleTranslation: 'How are you?', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-ja-18', languageCode: 'ja', word: '大丈夫', nativeScript: '大丈夫', phonetic: 'daijoubu', meaning: 'OK / all right / fine', partOfSpeech: 'adjective', exampleSentence: '大丈夫ですか？', exampleTranslation: 'Are you OK?', cefrLevel: 'A1', category: 'feelings' },
    { id: 'vocab-ja-19', languageCode: 'ja', word: '疲れた', nativeScript: '疲れた', phonetic: 'tsukareta', meaning: 'tired', partOfSpeech: 'adjective', exampleSentence: '少し疲れました。', exampleTranslation: 'I am a little tired.', cefrLevel: 'A1', category: 'feelings' },
    { id: 'vocab-ja-20', languageCode: 'ja', word: 'まあまあ', nativeScript: 'まあまあ', phonetic: 'maamaa', meaning: 'so-so', partOfSpeech: 'adverb', exampleSentence: 'まあまあです。', exampleTranslation: 'I am so-so.', cefrLevel: 'A1', category: 'feelings' },
    // Unit 2 Lesson 1: Numbers 1-10
    { id: 'vocab-ja-21', languageCode: 'ja', word: '一', nativeScript: '一', phonetic: 'ichi', meaning: 'one', partOfSpeech: 'number', exampleSentence: '一つください。', exampleTranslation: 'One please.', cefrLevel: 'A1', category: 'numbers' },
    { id: 'vocab-ja-22', languageCode: 'ja', word: '二', nativeScript: '二', phonetic: 'ni', meaning: 'two', partOfSpeech: 'number', exampleSentence: '二人です。', exampleTranslation: 'Two people.', cefrLevel: 'A1', category: 'numbers' },
    { id: 'vocab-ja-23', languageCode: 'ja', word: '三', nativeScript: '三', phonetic: 'san', meaning: 'three', partOfSpeech: 'number', exampleSentence: '三分待ってください。', exampleTranslation: 'Please wait three minutes.', cefrLevel: 'A1', category: 'numbers' },
    { id: 'vocab-ja-24', languageCode: 'ja', word: '五', nativeScript: '五', phonetic: 'go', meaning: 'five', partOfSpeech: 'number', exampleSentence: '五時に会いましょう。', exampleTranslation: 'Let us meet at five o\'clock.', cefrLevel: 'A1', category: 'numbers' },
    { id: 'vocab-ja-25', languageCode: 'ja', word: '十', nativeScript: '十', phonetic: 'juu', meaning: 'ten', partOfSpeech: 'number', exampleSentence: '十個あります。', exampleTranslation: 'There are ten.', cefrLevel: 'A1', category: 'numbers' },
    // Unit 2 Lesson 2: Time & Days
    { id: 'vocab-ja-26', languageCode: 'ja', word: '今', nativeScript: '今', phonetic: 'ima', meaning: 'now', partOfSpeech: 'adverb', exampleSentence: '今、何時ですか？', exampleTranslation: 'What time is it now?', cefrLevel: 'A1', category: 'time' },
    { id: 'vocab-ja-27', languageCode: 'ja', word: '今日', nativeScript: '今日', phonetic: 'kyou', meaning: 'today', partOfSpeech: 'noun', exampleSentence: '今日は月曜日です。', exampleTranslation: 'Today is Monday.', cefrLevel: 'A1', category: 'time' },
    { id: 'vocab-ja-28', languageCode: 'ja', word: '明日', nativeScript: '明日', phonetic: 'ashita', meaning: 'tomorrow', partOfSpeech: 'noun', exampleSentence: '明日、学校に行きます。', exampleTranslation: 'I will go to school tomorrow.', cefrLevel: 'A1', category: 'time' },
    { id: 'vocab-ja-29', languageCode: 'ja', word: '昨日', nativeScript: '昨日', phonetic: 'kinou', meaning: 'yesterday', partOfSpeech: 'noun', exampleSentence: '昨日は忙しかった。', exampleTranslation: 'Yesterday was busy.', cefrLevel: 'A1', category: 'time' },
    { id: 'vocab-ja-30', languageCode: 'ja', word: '時', nativeScript: '時', phonetic: 'ji', meaning: 'o\'clock / hour', partOfSpeech: 'noun', exampleSentence: '三時に来てください。', exampleTranslation: 'Please come at three o\'clock.', cefrLevel: 'A1', category: 'time' },
];

// ============================================================
// VOCABULARY — French (A1)
// ============================================================
export const SEED_VOCABULARY_FR: VocabularyEntry[] = [
    { id: 'vocab-fr-1', languageCode: 'fr', word: 'Bonjour', nativeScript: 'Bonjour', phonetic: 'bɔ̃ʒuːʁ', meaning: 'Hello / Good day', partOfSpeech: 'greeting', exampleSentence: 'Bonjour, comment allez-vous ?', exampleTranslation: 'Hello, how are you?', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-fr-2', languageCode: 'fr', word: 'Au revoir', nativeScript: 'Au revoir', phonetic: 'o ʁəvwaːʁ', meaning: 'Goodbye', partOfSpeech: 'greeting', exampleSentence: 'Au revoir, à demain !', exampleTranslation: 'Goodbye, see you tomorrow!', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-fr-3', languageCode: 'fr', word: 'Merci', nativeScript: 'Merci', phonetic: 'mɛʁsi', meaning: 'Thank you', partOfSpeech: 'expression', exampleSentence: 'Merci beaucoup !', exampleTranslation: 'Thank you very much!', cefrLevel: 'A1', category: 'politeness' },
    { id: 'vocab-fr-4', languageCode: 'fr', word: 'Bonsoir', nativeScript: 'Bonsoir', phonetic: 'bɔ̃swaːʁ', meaning: 'Good evening', partOfSpeech: 'greeting', exampleSentence: 'Bonsoir, bienvenue.', exampleTranslation: 'Good evening, welcome.', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-fr-5', languageCode: 'fr', word: 'Salut', nativeScript: 'Salut', phonetic: 'saly', meaning: 'Hi / Bye (informal)', partOfSpeech: 'greeting', exampleSentence: 'Salut, ça va ?', exampleTranslation: 'Hi, how are you?', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-fr-6', languageCode: 'fr', word: 'Je', nativeScript: 'Je', phonetic: 'ʒə', meaning: 'I', partOfSpeech: 'pronoun', exampleSentence: 'Je suis français.', exampleTranslation: 'I am French.', cefrLevel: 'A1', category: 'pronouns' },
    { id: 'vocab-fr-7', languageCode: 'fr', word: 'suis', nativeScript: 'suis', phonetic: 'sɥi', meaning: 'am (être)', partOfSpeech: 'verb', exampleSentence: 'Je suis étudiant.', exampleTranslation: 'I am a student.', cefrLevel: 'A1', category: 'grammar' },
    { id: 'vocab-fr-8', languageCode: 'fr', word: 'Comment', nativeScript: 'Comment', phonetic: 'kɔmɑ̃', meaning: 'How', partOfSpeech: 'adverb', exampleSentence: 'Comment vous appelez-vous ?', exampleTranslation: 'What is your name?', cefrLevel: 'A1', category: 'questions' },
    { id: 'vocab-fr-9', languageCode: 'fr', word: 'Enchanté', nativeScript: 'Enchanté', phonetic: 'ɑ̃ʃɑ̃te', meaning: 'Nice to meet you', partOfSpeech: 'expression', exampleSentence: 'Enchanté de vous connaître.', exampleTranslation: 'Nice to meet you.', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-fr-10', languageCode: 'fr', word: 'Oui', nativeScript: 'Oui', phonetic: 'wi', meaning: 'Yes', partOfSpeech: 'adverb', exampleSentence: 'Oui, bien sûr.', exampleTranslation: 'Yes, of course.', cefrLevel: 'A1', category: 'basics' },
];

// ============================================================
// VOCABULARY — Spanish (A1)
// ============================================================
export const SEED_VOCABULARY_ES: VocabularyEntry[] = [
    { id: 'vocab-es-1', languageCode: 'es', word: 'Hola', nativeScript: 'Hola', phonetic: 'ola', meaning: 'Hello', partOfSpeech: 'greeting', exampleSentence: 'Hola, ¿cómo estás?', exampleTranslation: 'Hello, how are you?', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-es-2', languageCode: 'es', word: 'Adiós', nativeScript: 'Adiós', phonetic: 'aðjos', meaning: 'Goodbye', partOfSpeech: 'greeting', exampleSentence: 'Adiós, hasta mañana.', exampleTranslation: 'Goodbye, see you tomorrow.', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-es-3', languageCode: 'es', word: 'Gracias', nativeScript: 'Gracias', phonetic: 'gɾaθjas', meaning: 'Thank you', partOfSpeech: 'expression', exampleSentence: 'Muchas gracias.', exampleTranslation: 'Thank you very much.', cefrLevel: 'A1', category: 'politeness' },
    { id: 'vocab-es-4', languageCode: 'es', word: 'Buenos días', nativeScript: 'Buenos días', phonetic: 'bwenos dias', meaning: 'Good morning', partOfSpeech: 'greeting', exampleSentence: 'Buenos días, señor.', exampleTranslation: 'Good morning, sir.', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-es-5', languageCode: 'es', word: 'Buenas noches', nativeScript: 'Buenas noches', phonetic: 'bwenas notʃes', meaning: 'Good night', partOfSpeech: 'greeting', exampleSentence: 'Buenas noches, dulces sueños.', exampleTranslation: 'Good night, sweet dreams.', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-es-6', languageCode: 'es', word: 'Yo', nativeScript: 'Yo', phonetic: 'ʝo', meaning: 'I', partOfSpeech: 'pronoun', exampleSentence: 'Yo soy estudiante.', exampleTranslation: 'I am a student.', cefrLevel: 'A1', category: 'pronouns' },
    { id: 'vocab-es-7', languageCode: 'es', word: 'soy', nativeScript: 'soy', phonetic: 'soj', meaning: 'am (ser)', partOfSpeech: 'verb', exampleSentence: 'Yo soy de México.', exampleTranslation: 'I am from Mexico.', cefrLevel: 'A1', category: 'grammar' },
    { id: 'vocab-es-8', languageCode: 'es', word: 'Mucho gusto', nativeScript: 'Mucho gusto', phonetic: 'mutʃo gusto', meaning: 'Nice to meet you', partOfSpeech: 'expression', exampleSentence: 'Mucho gusto, soy Carlos.', exampleTranslation: 'Nice to meet you, I am Carlos.', cefrLevel: 'A1', category: 'greetings' },
    { id: 'vocab-es-9', languageCode: 'es', word: 'Sí', nativeScript: 'Sí', phonetic: 'si', meaning: 'Yes', partOfSpeech: 'adverb', exampleSentence: 'Sí, por supuesto.', exampleTranslation: 'Yes, of course.', cefrLevel: 'A1', category: 'basics' },
    { id: 'vocab-es-10', languageCode: 'es', word: 'No', nativeScript: 'No', phonetic: 'no', meaning: 'No', partOfSpeech: 'adverb', exampleSentence: 'No, gracias.', exampleTranslation: 'No, thank you.', cefrLevel: 'A1', category: 'basics' },
];

// ============================================================
// GRAMMAR MODULES
// ============================================================
export const SEED_GRAMMAR_MODULES: GrammarModule[] = [
    {
        id: 'grammar-ja-desu',
        languageCode: 'ja',
        title: 'です (desu) — The Copula',
        cefrLevel: 'A1',
        explanation: 'です (desu) is the polite copula in Japanese, equivalent to "is/am/are" in English. It comes at the end of a sentence to make it polite.',
        structure: '[Subject] は [Noun/Adjective] です。',
        examples: [
            { sentence: '私は学生です。', translation: 'I am a student.', breakdown: '私(I) は(topic) 学生(student) です(am)' },
            { sentence: 'これは本です。', translation: 'This is a book.', breakdown: 'これ(this) は(topic) 本(book) です(is)' },
        ],
        commonMistakes: [
            'Forgetting です at the end makes the sentence casual/rude in formal contexts',
            'です does not conjugate for person — it stays the same for I/you/he/she',
        ],
    },
    {
        id: 'grammar-ja-wa-particle',
        languageCode: 'ja',
        title: 'は (wa) — Topic Marker Particle',
        cefrLevel: 'A1',
        explanation: 'The particle は (pronounced "wa") marks the topic of a sentence. It tells the listener what you are talking about.',
        structure: '[Topic] は [Comment]。',
        examples: [
            { sentence: '私は田中です。', translation: 'I am Tanaka.', breakdown: '私(I) は(topic-marker) 田中(Tanaka) です(am)' },
            { sentence: '東京は日本にあります。', translation: 'Tokyo is in Japan.', breakdown: '東京(Tokyo) は(topic) 日本(Japan) に(in) あります(exists)' },
        ],
        commonMistakes: [
            'Writing は as "ha" instead of pronouncing it as "wa" when used as a particle',
            'Confusing は with が — は marks the topic, が marks the subject/focus',
        ],
    },
    {
        id: 'grammar-ja-ka-question',
        languageCode: 'ja',
        title: 'か (ka) — Question Particle',
        cefrLevel: 'A1',
        explanation: 'Adding か (ka) at the end of a sentence turns it into a question. It is the equivalent of a question mark in spoken Japanese.',
        structure: '[Statement] か？',
        examples: [
            { sentence: '元気ですか？', translation: 'Are you well?', breakdown: '元気(well) です(are) か(?)' },
            { sentence: '学生ですか？', translation: 'Are you a student?', breakdown: '学生(student) です(are) か(?)' },
        ],
        commonMistakes: [
            'In casual speech, か can sound too formal — rising intonation alone marks a question',
        ],
    },
    {
        id: 'grammar-fr-je-suis',
        languageCode: 'fr',
        title: 'Je suis — I am (Être)',
        cefrLevel: 'A1',
        explanation: 'Être (to be) is the most important verb in French. "Je suis" means "I am" and is used for introductions, professions, and descriptions.',
        structure: 'Je suis + [noun/adjective]',
        examples: [
            { sentence: 'Je suis étudiant.', translation: 'I am a student.', breakdown: 'Je(I) suis(am) étudiant(student)' },
            { sentence: 'Je suis français.', translation: 'I am French.', breakdown: 'Je(I) suis(am) français(French)' },
        ],
        commonMistakes: [
            'Adding an article before professions: "Je suis un étudiant" is technically correct but less natural — prefer "Je suis étudiant"',
        ],
    },
    {
        id: 'grammar-es-ser-estar',
        languageCode: 'es',
        title: 'Ser vs Estar — Two ways to say "to be"',
        cefrLevel: 'A1',
        explanation: 'Spanish has two verbs meaning "to be": SER for permanent characteristics (identity, origin, profession) and ESTAR for temporary states (location, emotion, condition).',
        structure: 'Ser: Yo soy / Estar: Yo estoy',
        examples: [
            { sentence: 'Yo soy estudiante.', translation: 'I am a student. (permanent)', breakdown: 'Yo(I) soy(am-ser) estudiante(student)' },
            { sentence: 'Yo estoy cansado.', translation: 'I am tired. (temporary)', breakdown: 'Yo(I) estoy(am-estar) cansado(tired)' },
        ],
        commonMistakes: [
            'Using "soy" for temporary feelings — "Soy cansado" is wrong, use "Estoy cansado"',
            'Using "estoy" for identity — "Estoy estudiante" is wrong, use "Soy estudiante"',
        ],
    },
];

// ============================================================
// EXERCISES — Japanese Lesson 1-1 (Hello & Goodbye)
// ============================================================
export const SEED_EXERCISES_JA_1_1 = [
    // TEACH step: no exercises needed (vocabulary cards are shown)
    // GUIDED PRACTICE
    {
        id: 'ex-ja-1-1-gp-1',
        lessonId: 'lesson-ja-1-1',
        stepType: 'guided-practice',
        orderIndex: 0,
        type: 'multiple-choice',
        skillType: 'vocab',
        difficulty: 1,
        cefrLevel: 'A1',
        prompt: 'What does "こんにちは" mean?',
        correctAnswer: 'Hello / Good afternoon',
        expectedAnswerVariants: '["Hello","Good afternoon","Hello / Good afternoon"]',
        options: '["Good morning","Hello / Good afternoon","Goodbye","Good night"]',
        correctIndex: 1,
        context: 'Basic greeting used during the day',
    },
    {
        id: 'ex-ja-1-1-gp-2',
        lessonId: 'lesson-ja-1-1',
        stepType: 'guided-practice',
        orderIndex: 1,
        type: 'translation',
        skillType: 'vocab',
        difficulty: 1,
        cefrLevel: 'A1',
        prompt: 'Translate to Japanese: Good morning (polite)',
        correctAnswer: 'おはようございます',
        expectedAnswerVariants: '["おはようございます","ohayou gozaimasu"]',
        sourceLanguage: 'en',
        targetLanguage: 'ja',
    },
    {
        id: 'ex-ja-1-1-gp-3',
        lessonId: 'lesson-ja-1-1',
        stepType: 'guided-practice',
        orderIndex: 2,
        type: 'multiple-choice',
        skillType: 'vocab',
        difficulty: 1,
        cefrLevel: 'A1',
        prompt: 'Which greeting do you say at night before sleeping?',
        correctAnswer: 'おやすみなさい',
        expectedAnswerVariants: '["おやすみなさい"]',
        options: '["こんにちは","さようなら","おやすみなさい","こんばんは"]',
        correctIndex: 2,
    },
    // REINFORCEMENT
    {
        id: 'ex-ja-1-1-rf-1',
        lessonId: 'lesson-ja-1-1',
        stepType: 'reinforcement',
        orderIndex: 0,
        type: 'translation',
        skillType: 'vocab',
        difficulty: 1,
        cefrLevel: 'A1',
        prompt: 'Translate to English: さようなら',
        correctAnswer: 'Goodbye',
        expectedAnswerVariants: '["Goodbye","Bye","Farewell"]',
        sourceLanguage: 'ja',
        targetLanguage: 'en',
    },
    {
        id: 'ex-ja-1-1-rf-2',
        lessonId: 'lesson-ja-1-1',
        stepType: 'reinforcement',
        orderIndex: 1,
        type: 'fill-blank',
        skillType: 'grammar',
        difficulty: 1,
        cefrLevel: 'A1',
        prompt: 'Fill in the blank',
        correctAnswer: 'こんばんは',
        expectedAnswerVariants: '["こんばんは"]',
        sentence: '_____ 、お元気ですか？',
        blankPosition: 0,
        wordBank: '["こんにちは","こんばんは","おはよう","さようなら"]',
        context: 'Greeting someone in the evening',
    },
    {
        id: 'ex-ja-1-1-rf-3',
        lessonId: 'lesson-ja-1-1',
        stepType: 'reinforcement',
        orderIndex: 2,
        type: 'speaking',
        skillType: 'speaking',
        difficulty: 1,
        cefrLevel: 'A1',
        prompt: 'Say this phrase out loud:',
        correctAnswer: 'こんにちは',
        expectedAnswerVariants: '["こんにちは","konnichiwa"]',
        targetPhrase: 'こんにちは',
        phonetics: 'konnichiwa',
    },
    // ASSESSMENT
    {
        id: 'ex-ja-1-1-as-1',
        lessonId: 'lesson-ja-1-1',
        stepType: 'assessment',
        orderIndex: 0,
        type: 'translation',
        skillType: 'vocab',
        difficulty: 1,
        cefrLevel: 'A1',
        prompt: 'Translate to Japanese: Good evening',
        correctAnswer: 'こんばんは',
        expectedAnswerVariants: '["こんばんは","konbanwa"]',
        sourceLanguage: 'en',
        targetLanguage: 'ja',
    },
    {
        id: 'ex-ja-1-1-as-2',
        lessonId: 'lesson-ja-1-1',
        stepType: 'assessment',
        orderIndex: 1,
        type: 'multiple-choice',
        skillType: 'vocab',
        difficulty: 1,
        cefrLevel: 'A1',
        prompt: 'What is the polite way to say "Good morning" in Japanese?',
        correctAnswer: 'おはようございます',
        expectedAnswerVariants: '["おはようございます"]',
        options: '["おはよう","おはようございます","こんにちは","おやすみ"]',
        correctIndex: 1,
    },
    {
        id: 'ex-ja-1-1-as-3',
        lessonId: 'lesson-ja-1-1',
        stepType: 'assessment',
        orderIndex: 2,
        type: 'speaking',
        skillType: 'speaking',
        difficulty: 1,
        cefrLevel: 'A1',
        prompt: 'Say this phrase:',
        correctAnswer: 'おはようございます',
        expectedAnswerVariants: '["おはようございます","ohayou gozaimasu"]',
        targetPhrase: 'おはようございます',
        phonetics: 'ohayou gozaimasu',
    },
];

// ============================================================
// LEARNING SCENARIOS
// ============================================================
export const SEED_SCENARIOS: LearningScenario[] = [
    {
        id: 'scenario-ja-restaurant',
        languageCode: 'ja',
        title: 'At a Japanese Restaurant',
        description: 'Order food and drinks at a restaurant in Tokyo',
        icon: '🍣',
        difficulty: 'A1',
        vocabularyIds: ['vocab-ja-11', 'vocab-ja-12', 'vocab-ja-14'],
        systemPrompt: 'You are a friendly Japanese waiter at a restaurant. The user is learning Japanese. Start by greeting them in Japanese with furigana. Help them practice ordering food. Use simple Japanese (A1 level). When they make mistakes, gently correct them and explain the grammar. Always provide the romaji pronunciation in parentheses.',
        objectives: ['Order a drink', 'Ask for the menu', 'Request the bill'],
        suggestedResponses: ['水をください (mizu wo kudasai)', 'メニューをお願いします (menyuu wo onegaishimasu)'],
    },
    {
        id: 'scenario-ja-train',
        languageCode: 'ja',
        title: 'Taking the Train',
        description: 'Navigate the train station and buy tickets',
        icon: '🚃',
        difficulty: 'A1',
        vocabularyIds: ['vocab-ja-12', 'vocab-ja-21', 'vocab-ja-22'],
        systemPrompt: 'You are a helpful station attendant in Japan. The user is learning Japanese. Help them practice buying train tickets and asking for directions in simple Japanese. Use A1-level vocabulary. Always provide romaji in parentheses for Japanese text.',
        objectives: ['Buy a ticket', 'Ask which platform', 'Ask about schedule'],
        suggestedResponses: ['切符をください (kippu wo kudasai)', 'すみません (sumimasen)'],
    },
    {
        id: 'scenario-fr-cafe',
        languageCode: 'fr',
        title: 'At a French Café',
        description: 'Order coffee and pastries at a Parisian café',
        icon: '☕',
        difficulty: 'A1',
        vocabularyIds: ['vocab-fr-1', 'vocab-fr-3', 'vocab-fr-10'],
        systemPrompt: 'You are a friendly waiter at a Parisian café. The user is learning French. Help them practice ordering coffee and pastries in simple French. When they make mistakes, gently correct them. Use A1-level vocabulary.',
        objectives: ['Order a coffee', 'Ask for the menu', 'Pay the bill'],
        suggestedResponses: ['Un café, s\'il vous plaît', 'L\'addition, s\'il vous plaît'],
    },
    {
        id: 'scenario-es-market',
        languageCode: 'es',
        title: 'At the Market',
        description: 'Buy fruits and vegetables at a Spanish market',
        icon: '🏪',
        difficulty: 'A1',
        vocabularyIds: ['vocab-es-1', 'vocab-es-3', 'vocab-es-9'],
        systemPrompt: 'You are a friendly vendor at a Spanish market. The user is learning Spanish. Help them practice buying fruits and vegetables using simple Spanish. When they make mistakes, gently correct them. Use A1-level vocabulary.',
        objectives: ['Greet the vendor', 'Ask for prices', 'Buy items'],
        suggestedResponses: ['Buenos días', '¿Cuánto cuesta?', 'Quiero dos kilos'],
    },
];

// ============================================================
// HELPER: Get all vocabulary for a language
// ============================================================
export function getVocabularyForLanguage(langCode: string): VocabularyEntry[] {
    switch (langCode) {
        case 'ja': return SEED_VOCABULARY_JA;
        case 'fr': return SEED_VOCABULARY_FR;
        case 'es': return SEED_VOCABULARY_ES;
        default: return [];
    }
}

// ============================================================
// HELPER: Get grammar modules for a language
// ============================================================
export function getGrammarForLanguage(langCode: string): GrammarModule[] {
    return SEED_GRAMMAR_MODULES.filter(g => g.languageCode === langCode);
}

// ============================================================
// HELPER: Get scenarios for a language
// ============================================================
export function getScenariosForLanguage(langCode: string): LearningScenario[] {
    return SEED_SCENARIOS.filter(s => s.languageCode === langCode);
}
