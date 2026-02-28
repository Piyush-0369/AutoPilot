/**
 * CEFR-aligned learning modules — language-agnostic.
 *
 * Based on the Common European Framework of Reference (CEFR) used by
 * Duolingo, Babbel, Goethe-Institut, DELF/DALF, and other certified
 * language-learning programmes.
 *
 * Modules define *what* to learn (topics, categories, objectives).
 * Actual exercises are AI-generated at runtime for whatever target language
 * the user chose.
 */

import { Module, CEFRLevel, PROFICIENCY_TO_CEFR } from '../types';

// ─── A1 – Beginner ──────────────────────────────────────────────────────────

const A1_MODULES: Module[] = [
    {
        id: 'a1-greetings',
        title: 'Greetings & Introductions',
        description: 'Hello, goodbye, my name is…',
        icon: '🌱',
        cefrLevel: 'A1',
        category: 'conversation',
        topics: [
            'saying hello and goodbye',
            'introducing yourself',
            'asking someone\'s name',
            'polite expressions (please, thank you)',
            'formal vs informal greetings',
        ],
        lessonCount: 5,
        estimatedMinutes: 25,
        learningObjectives: [
            'Greet people at different times of day',
            'Introduce yourself and ask others\' names',
            'Use basic polite phrases',
        ],
    },
    {
        id: 'a1-numbers',
        title: 'Numbers & Counting',
        description: '1–100, phone numbers, prices',
        icon: '🔢',
        cefrLevel: 'A1',
        category: 'vocabulary',
        topics: [
            'numbers 1 to 20',
            'numbers 21 to 100',
            'saying phone numbers',
            'asking and telling prices',
            'counting objects',
        ],
        lessonCount: 5,
        estimatedMinutes: 30,
        learningObjectives: [
            'Count from 1 to 100',
            'Understand and say prices',
            'Give and understand phone numbers',
        ],
    },
    {
        id: 'a1-family',
        title: 'Family & People',
        description: 'Family members, descriptions, ages',
        icon: '👨‍👩‍👧',
        cefrLevel: 'A1',
        category: 'vocabulary',
        topics: [
            'family members (mother, father, sibling)',
            'describing people (tall, short, young, old)',
            'talking about ages',
            'possessive adjectives (my, your, his/her)',
            'asking about someone\'s family',
        ],
        lessonCount: 5,
        estimatedMinutes: 25,
        learningObjectives: [
            'Name family members',
            'Describe people simply',
            'Talk about ages and relationships',
        ],
    },
    {
        id: 'a1-food',
        title: 'Food & Drink',
        description: 'Ordering, common foods, preferences',
        icon: '🍽️',
        cefrLevel: 'A1',
        category: 'vocabulary',
        topics: [
            'common foods and drinks',
            'ordering at a restaurant',
            'expressing likes and dislikes',
            'asking for the menu and bill',
            'basic meal vocabulary (breakfast, lunch, dinner)',
        ],
        lessonCount: 5,
        estimatedMinutes: 30,
        learningObjectives: [
            'Order food and drinks',
            'Express food preferences',
            'Understand a simple menu',
        ],
    },
    {
        id: 'a1-time',
        title: 'Time & Days',
        description: 'Days of week, months, telling time',
        icon: '📅',
        cefrLevel: 'A1',
        category: 'vocabulary',
        topics: [
            'days of the week',
            'months of the year',
            'telling time (hours and minutes)',
            'parts of the day (morning, afternoon, evening)',
            'making simple appointments',
        ],
        lessonCount: 5,
        estimatedMinutes: 25,
        learningObjectives: [
            'Say and understand days and months',
            'Tell and ask the time',
            'Schedule simple meetings',
        ],
    },
    {
        id: 'a1-home',
        title: 'Home & Daily Life',
        description: 'Rooms, objects, daily routines',
        icon: '🏠',
        cefrLevel: 'A1',
        category: 'daily-life',
        topics: [
            'rooms in a house',
            'common household objects',
            'daily routine verbs (wake up, eat, sleep)',
            'talking about where you live',
            'prepositions of place (in, on, under, next to)',
        ],
        lessonCount: 5,
        estimatedMinutes: 25,
        learningObjectives: [
            'Describe your home simply',
            'Talk about your daily routine',
            'Use basic prepositions of place',
        ],
    },
];

// ─── A2 – Elementary ─────────────────────────────────────────────────────────

const A2_MODULES: Module[] = [
    {
        id: 'a2-shopping',
        title: 'Shopping & Money',
        description: 'Prices, sizes, transactions',
        icon: '🛒',
        cefrLevel: 'A2',
        category: 'daily-life',
        topics: [
            'asking prices and comparing items',
            'clothing sizes and colours',
            'paying and asking for change',
            'returning items and complaints',
            'online shopping vocabulary',
        ],
        lessonCount: 5,
        estimatedMinutes: 30,
        learningObjectives: [
            'Navigate a shopping transaction',
            'Compare products and prices',
            'Handle basic complaints politely',
        ],
    },
    {
        id: 'a2-health',
        title: 'Health & Body',
        description: 'Body parts, symptoms, pharmacy',
        icon: '🏥',
        cefrLevel: 'A2',
        category: 'vocabulary',
        topics: [
            'body parts',
            'common symptoms and illnesses',
            'visiting the doctor',
            'buying medicine at a pharmacy',
            'giving and understanding health advice',
        ],
        lessonCount: 5,
        estimatedMinutes: 30,
        learningObjectives: [
            'Describe health problems',
            'Understand a doctor\'s basic instructions',
            'Ask for medicine at a pharmacy',
        ],
    },
    {
        id: 'a2-travel',
        title: 'Travel & Transport',
        description: 'Directions, tickets, the airport',
        icon: '✈️',
        cefrLevel: 'A2',
        category: 'travel',
        topics: [
            'asking for and giving directions',
            'buying tickets (bus, train, plane)',
            'checking in at a hotel',
            'airport vocabulary and announcements',
            'reading simple maps and signs',
        ],
        lessonCount: 5,
        estimatedMinutes: 30,
        learningObjectives: [
            'Ask for and understand directions',
            'Purchase travel tickets',
            'Navigate an airport or hotel check-in',
        ],
    },
    {
        id: 'a2-work',
        title: 'Work & Study',
        description: 'Job titles, schedules, office vocabulary',
        icon: '💼',
        cefrLevel: 'A2',
        category: 'professional',
        topics: [
            'common job titles and professions',
            'talking about your job or studies',
            'office vocabulary (meeting, email, deadline)',
            'making and cancelling appointments',
            'expressing ability with can/could',
        ],
        lessonCount: 5,
        estimatedMinutes: 30,
        learningObjectives: [
            'Describe your job or studies',
            'Use basic office vocabulary',
            'Manage appointments and schedules',
        ],
    },
    {
        id: 'a2-weather',
        title: 'Weather & Nature',
        description: 'Seasons, weather, outdoor activities',
        icon: '🌦️',
        cefrLevel: 'A2',
        category: 'vocabulary',
        topics: [
            'weather conditions (sunny, rainy, cloudy)',
            'seasons and climate',
            'outdoor activities and sports',
            'describing landscapes (mountain, river, beach)',
            'planning around the weather',
        ],
        lessonCount: 5,
        estimatedMinutes: 25,
        learningObjectives: [
            'Talk about the weather',
            'Describe seasons and landscapes',
            'Plan activities based on weather',
        ],
    },
    {
        id: 'a2-technology',
        title: 'Technology & Communication',
        description: 'Phone, internet, social media',
        icon: '📱',
        cefrLevel: 'A2',
        category: 'daily-life',
        topics: [
            'phone and messaging vocabulary',
            'internet and social media terms',
            'making a phone call',
            'writing simple text messages',
            'asking for tech help (Wi-Fi, password)',
        ],
        lessonCount: 5,
        estimatedMinutes: 25,
        learningObjectives: [
            'Make a phone call and leave a message',
            'Use basic internet and social media vocabulary',
            'Ask for technical help',
        ],
    },
];

// ─── B1 – Intermediate ──────────────────────────────────────────────────────

const B1_MODULES: Module[] = [
    {
        id: 'b1-news',
        title: 'News & Current Events',
        description: 'Headlines, opinions, debate',
        icon: '🗞️',
        cefrLevel: 'B1',
        category: 'culture',
        topics: [
            'understanding news headlines',
            'expressing opinions (I think, I believe)',
            'agreeing and disagreeing politely',
            'summarising an article or story',
            'discussing current events',
        ],
        lessonCount: 5,
        estimatedMinutes: 35,
        learningObjectives: [
            'Understand the gist of news articles',
            'Express and support opinions',
            'Discuss current events in conversation',
        ],
    },
    {
        id: 'b1-culture',
        title: 'Culture & Entertainment',
        description: 'Movies, music, books',
        icon: '🎭',
        cefrLevel: 'B1',
        category: 'culture',
        topics: [
            'describing films, shows, and music',
            'recommending and reviewing entertainment',
            'talking about hobbies and free time',
            'cultural traditions and holidays',
            'comparing cultures',
        ],
        lessonCount: 5,
        estimatedMinutes: 30,
        learningObjectives: [
            'Recommend and discuss entertainment',
            'Describe cultural traditions',
            'Compare cultural differences',
        ],
    },
    {
        id: 'b1-relationships',
        title: 'Social Relationships',
        description: 'Feelings, advice, invitations',
        icon: '🤝',
        cefrLevel: 'B1',
        category: 'conversation',
        topics: [
            'expressing feelings and emotions',
            'giving and receiving advice',
            'making and accepting invitations',
            'apologising and resolving conflicts',
            'talking about future plans and dreams',
        ],
        lessonCount: 5,
        estimatedMinutes: 30,
        learningObjectives: [
            'Express complex emotions',
            'Give appropriate advice',
            'Navigate social invitations and conflicts',
        ],
    },
    {
        id: 'b1-city',
        title: 'City & Services',
        description: 'Government, banks, bureaucracy',
        icon: '🏛️',
        cefrLevel: 'B1',
        category: 'daily-life',
        topics: [
            'dealing with bureaucracy and forms',
            'banking vocabulary (account, transfer, loan)',
            'post office and government offices',
            'renting a flat or house',
            'understanding contracts and agreements',
        ],
        lessonCount: 5,
        estimatedMinutes: 35,
        learningObjectives: [
            'Handle administrative tasks',
            'Navigate banking and postal services',
            'Understand simple contracts',
        ],
    },
    {
        id: 'b1-environment',
        title: 'Environment & Society',
        description: 'Climate, recycling, community',
        icon: '🌍',
        cefrLevel: 'B1',
        category: 'culture',
        topics: [
            'environmental vocabulary (pollution, recycling)',
            'talking about climate change',
            'community and volunteering',
            'discussing social issues',
            'proposing solutions to problems',
        ],
        lessonCount: 5,
        estimatedMinutes: 30,
        learningObjectives: [
            'Discuss environmental topics',
            'Talk about social issues',
            'Propose and evaluate solutions',
        ],
    },
    {
        id: 'b1-storytelling',
        title: 'Storytelling & Narration',
        description: 'Past tense, sequencing, anecdotes',
        icon: '📖',
        cefrLevel: 'B1',
        category: 'grammar',
        topics: [
            'narrating past events in sequence',
            'using time connectors (then, after, before)',
            'telling an anecdote or joke',
            'describing experiences and memories',
            'reported speech basics',
        ],
        lessonCount: 5,
        estimatedMinutes: 35,
        learningObjectives: [
            'Tell a story in chronological order',
            'Use past tenses precisely',
            'Report what someone else said',
        ],
    },
];

// ─── B2 – Advanced ───────────────────────────────────────────────────────────

const B2_MODULES: Module[] = [
    {
        id: 'b2-abstract',
        title: 'Abstract Ideas',
        description: 'Philosophy, ethics, hypotheticals',
        icon: '💡',
        cefrLevel: 'B2',
        category: 'culture',
        topics: [
            'discussing hypothetical situations (if I were…)',
            'expressing certainty and doubt',
            'debating ethical dilemmas',
            'abstract nouns (freedom, justice, happiness)',
            'philosophical questions and thought experiments',
        ],
        lessonCount: 5,
        estimatedMinutes: 40,
        learningObjectives: [
            'Discuss hypothetical scenarios fluently',
            'Express nuanced opinions on abstract topics',
            'Debate ethical questions',
        ],
    },
    {
        id: 'b2-professional',
        title: 'Professional Writing',
        description: 'Formal emails, reports, presentations',
        icon: '📊',
        cefrLevel: 'B2',
        category: 'professional',
        topics: [
            'writing formal emails and letters',
            'structuring a report or summary',
            'giving a presentation',
            'negotiating and compromising',
            'professional register and tone',
        ],
        lessonCount: 5,
        estimatedMinutes: 40,
        learningObjectives: [
            'Write formal professional correspondence',
            'Structure and deliver a presentation',
            'Negotiate using appropriate language',
        ],
    },
    {
        id: 'b2-debate',
        title: 'Debate & Persuasion',
        description: 'Argumentation, cause & effect',
        icon: '🗣️',
        cefrLevel: 'B2',
        category: 'conversation',
        topics: [
            'building a structured argument',
            'expressing cause and effect',
            'conceding points and counter-arguing',
            'persuasive language and rhetoric',
            'discussing pros and cons of complex topics',
        ],
        lessonCount: 5,
        estimatedMinutes: 35,
        learningObjectives: [
            'Construct coherent arguments',
            'Use cause-effect language precisely',
            'Persuade and counter-argue effectively',
        ],
    },
    {
        id: 'b2-literature',
        title: 'Literature & Idioms',
        description: 'Proverbs, figurative language, nuance',
        icon: '📚',
        cefrLevel: 'B2',
        category: 'culture',
        topics: [
            'common idioms and their meanings',
            'proverbs and sayings',
            'figurative language (metaphor, simile)',
            'understanding humour and sarcasm',
            'register shifts (formal ↔ colloquial)',
        ],
        lessonCount: 5,
        estimatedMinutes: 35,
        learningObjectives: [
            'Use and understand common idioms',
            'Recognise figurative language',
            'Shift between formal and informal register',
        ],
    },
];

// ─── All modules ─────────────────────────────────────────────────────────────

export const ALL_MODULES: Module[] = [
    ...A1_MODULES,
    ...A2_MODULES,
    ...B1_MODULES,
    ...B2_MODULES,
];

// ─── CEFR level ordering ────────────────────────────────────────────────────

const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2'];

/**
 * Returns all modules at or below the user's proficiency level.
 * e.g. an "intermediate" (B1) user gets A1 + A2 + B1 modules.
 * Unknown proficiency defaults to A1 only.
 */
export function getModulesForLevel(proficiency: string): Module[] {
    const userCEFR = PROFICIENCY_TO_CEFR[proficiency.toLowerCase()] || 'A1';
    const maxIndex = CEFR_ORDER.indexOf(userCEFR);

    return ALL_MODULES.filter(m => {
        const moduleIndex = CEFR_ORDER.indexOf(m.cefrLevel);
        return moduleIndex <= maxIndex;
    });
}

/**
 * Returns ALL modules grouped by CEFR level, with a flag for whether
 * each level is unlocked for the given proficiency.
 */
export function getModulesGroupedByLevel(proficiency: string): {
    level: CEFRLevel;
    unlocked: boolean;
    modules: Module[];
}[] {
    const userCEFR = PROFICIENCY_TO_CEFR[proficiency.toLowerCase()] || 'A1';
    const maxIndex = CEFR_ORDER.indexOf(userCEFR);

    return CEFR_ORDER.map((level, idx) => ({
        level,
        unlocked: idx <= maxIndex,
        modules: ALL_MODULES.filter(m => m.cefrLevel === level),
    }));
}

/**
 * Maps a CEFR level to an AI difficulty number (1–5).
 */
export function cefrToDifficulty(cefrLevel: CEFRLevel): number {
    const map: Record<CEFRLevel, number> = {
        A1: 1,
        A2: 2,
        B1: 3,
        B2: 4,
    };
    return map[cefrLevel] || 1;
}
