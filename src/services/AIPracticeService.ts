import { RunAnywhere } from '@runanywhere/core';
import { DailyExerciseType } from '../components/ExerciseModal';

export interface AIExercise {
  question: string;
  answer: string;
  type: DailyExerciseType;
  hint?: string;
  difficulty: number;
  category: string;
  options?: string[];
  wordBank?: string[];
  blankPosition?: number;
  context?: string;
}

export interface PracticeSession {
  id: string;
  exercises: AIExercise[];
  targetLanguage: string;
  createdAt: Date;
}

const EXERCISE_PROMPTS = {
  typing: (lang: string, difficulty: number, topic?: string) =>
    `Generate a translation exercise for ${lang}. Difficulty: ${difficulty}/5. Theme: ${topic || 'General'}.
Respond with ONLY valid JSON: {"question": "Translate: Hello", "answer": "Bonjour", "hint": "Greeting", "category": "greetings"}`,

  tts: (lang: string, difficulty: number, topic?: string) =>
    `Generate a speaking exercise for ${lang}. Difficulty: ${difficulty}/5. Theme: ${topic || 'General'}.
Respond with ONLY valid JSON: {"question": "Say: Thank you", "answer": "Merci", "hint": "Polite", "category": "greetings"}`,

  stt: (lang: string, difficulty: number, topic?: string) =>
    `Generate a listening exercise for ${lang}. Difficulty: ${difficulty}/5. Theme: ${topic || 'General'}.
Respond with ONLY valid JSON: {"question": "Type what you hear", "answer": "Oui", "hint": "Yes", "category": "basics"}`,

  written: (lang: string, difficulty: number, topic?: string) =>
    `Generate a writing exercise for ${lang}. Difficulty: ${difficulty}/5. Theme: ${topic || 'General'}.
Respond with ONLY valid JSON: {"question": "Write about food", "answer": "J'aime la pizza", "hint": "Food", "category": "food"}`,
};

class AIPracticeService {
  private sessionHistory: PracticeSession[] = [];
  private currentDifficulty: number = 1;

  async generateExercise(
    type: DailyExerciseType,
    targetLanguage: string = 'Spanish',
    difficulty?: number,
    topic?: string
  ): Promise<AIExercise> {
    const diff = difficulty || this.currentDifficulty;

    try {
      const prompt = EXERCISE_PROMPTS[type](targetLanguage, diff, topic);

      const result = await RunAnywhere.generate(prompt, {
        maxTokens: 150,
        temperature: 0.1,
        systemPrompt: 'You are a JSON API. You MUST output ONLY raw valid JSON strings without markdown or explanations.',
      });

      const parsed = this.parseJSONResponse(result.text);

      if (parsed && parsed.question && parsed.answer) {
        return {
          question: parsed.question,
          answer: parsed.answer,
          type,
          hint: parsed.hint || undefined,
          difficulty: diff,
          category: parsed.category || 'general',
        };
      }
    } catch (error) {
      console.error('AI Exercise generation error:', error);
    }

    return this.getFallbackExercise(type, targetLanguage);
  }

  async generateMockPracticeSet(
    targetLanguage: string = 'Spanish',
    count: number = 3,
    includeTypes?: DailyExerciseType[],
    topic?: string
  ): Promise<AIExercise[]> {
    const langLower = targetLanguage.toLowerCase();

    // Core dictionaries for common supported languages
    const dicts: Record<string, Record<string, string>> = {
      spanish: { hello: 'Hola', goodbye: 'Adiós', thanks: 'Gracias', sentence: 'Me gusta aprender' },
      french: { hello: 'Bonjour', goodbye: 'Au revoir', thanks: 'Merci', sentence: "J'aime apprendre" },
      german: { hello: 'Hallo', goodbye: 'Tschüss', thanks: 'Danke', sentence: 'Ich lerne gerne' },
      italian: { hello: 'Ciao', goodbye: 'Arrivederci', thanks: 'Grazie', sentence: 'Mi piace imparare' },
      japanese: { hello: 'Konnichiwa', goodbye: 'Sayonara', thanks: 'Arigatou', sentence: 'Watashi wa manabu no ga suki desu' },
      korean: { hello: 'Annyeonghaseyo', goodbye: 'Annyeonghi gaseyo', thanks: 'Gamsahamnida', sentence: 'Naneun baeuneun geoseul joahaeyo' },
      portuguese: { hello: 'Olá', goodbye: 'Tchau', thanks: 'Obrigado', sentence: 'Eu gosto de aprender' },
    };

    const dict = dicts[langLower] || {
      hello: `[Hello in ${targetLanguage}]`,
      goodbye: `[Goodbye in ${targetLanguage}]`,
      thanks: `[Thanks in ${targetLanguage}]`,
      sentence: `[Sentence about ${topic || 'learning'} in ${targetLanguage}]`
    };

    const mockExercises: AIExercise[] = [
      {
        question: `Translate to ${targetLanguage}: Hello`,
        answer: dict.hello,
        type: 'typing',
        difficulty: 1,
        category: 'lesson_mock',
        hint: `Common greeting in ${targetLanguage}`
      },
      {
        question: `Say in ${targetLanguage}: Thank you`,
        answer: dict.thanks,
        type: 'tts',
        difficulty: 1,
        category: 'lesson_mock',
        hint: `Polite expression in ${targetLanguage}`
      },
      {
        question: `Write a sentence about ${topic || 'learning'} in ${targetLanguage}`,
        answer: dict.sentence,
        type: 'written',
        difficulty: 1,
        category: 'lesson_mock',
        hint: `Use basic ${targetLanguage} grammar`
      },
      {
        question: `Listen and type: ${dict.goodbye}`,
        answer: dict.goodbye,
        type: 'stt',
        difficulty: 1,
        category: 'lesson_mock',
        hint: `Farewell in ${targetLanguage}`
      }
    ];

    // Return the required number of mock exercises
    return mockExercises.slice(0, count);
  }

  async generatePracticeSet(
    targetLanguage: string = 'Spanish',
    count: number = 4,
    includeTypes?: DailyExerciseType[],
    topic?: string
  ): Promise<AIExercise[]> {
    const types: DailyExerciseType[] = includeTypes || ['typing', 'tts', 'stt', 'written'];
    const exercises: AIExercise[] = [];

    const difficulty = this.currentDifficulty;

    for (let i = 0; i < Math.min(count, types.length); i++) {
      const exercise = await this.generateExercise(types[i], targetLanguage, difficulty, topic);
      exercises.push(exercise);
    }

    return exercises;
  }

  async generateDailyChallenge(
    targetLanguage: string = 'Spanish'
  ): Promise<AIExercise[]> {
    const types: DailyExerciseType[] = ['typing', 'tts', 'stt', 'written'];
    const exercises: AIExercise[] = [];

    const difficulty = this.currentDifficulty;

    for (const type of types) {
      const exercise = await this.generateExercise(type, targetLanguage, difficulty);
      exercises.push(exercise);
    }

    const session: PracticeSession = {
      id: Date.now().toString(),
      exercises,
      targetLanguage,
      createdAt: new Date(),
    };

    this.sessionHistory.push(session);

    if (this.sessionHistory.length > 30) {
      this.sessionHistory = this.sessionHistory.slice(-30);
    }

    return exercises;
  }

  async generateConversationTopic(
    targetLanguage: string = 'Spanish'
  ): Promise<{ topic: string; prompt: string; vocabulary: string[] }> {
    const prompt = `Generate a conversation practice topic for ${targetLanguage} language learners.
    Provide a JSON object with keys: topic, prompt, vocabulary.
    - topic: A short title for the conversation scenario
    - prompt: A prompt to start the conversation (in English)
    - vocabulary: Array of 5-8 useful words/phrases for this conversation
    Respond with ONLY valid JSON.`;

    try {
      const result = await RunAnywhere.generate(prompt, {
        maxTokens: 400,
        temperature: 0.8,
        systemPrompt: 'You are a language learning AI. Always respond with valid JSON only.',
      });

      const parsed = this.parseJSONResponse(result.text);

      if (parsed && parsed.topic && parsed.prompt) {
        return {
          topic: parsed.topic,
          prompt: parsed.prompt,
          vocabulary: parsed.vocabulary || [],
        };
      }
    } catch (error) {
      console.error('Conversation topic generation error:', error);
    }

    return {
      topic: 'At the Restaurant',
      prompt: 'Practice ordering food and making requests at a restaurant.',
      vocabulary: ['Menu', 'Bill', 'Water', 'Delicious', 'Thank you'],
    };
  }

  async generateGrammarExplanation(
    grammarPoint: string,
    targetLanguage: string = 'Spanish'
  ): Promise<{ explanation: string; examples: string[]; tips: string[] }> {
    const prompt = `Explain the grammar concept "${grammarPoint}" in ${targetLanguage} for beginners.
    Provide a JSON object with keys: explanation, examples, tips.
    - explanation: A simple 1-2 sentence explanation in English
    - examples: Array of 3-4 example sentences showing the grammar
    - tips: Array of 2-3 helpful tips for learners
    Respond with ONLY valid JSON.`;

    try {
      const result = await RunAnywhere.generate(prompt, {
        maxTokens: 500,
        temperature: 0.7,
        systemPrompt: 'You are a language learning AI. Always respond with valid JSON only.',
      });

      const parsed = this.parseJSONResponse(result.text);

      if (parsed && parsed.explanation) {
        return {
          explanation: parsed.explanation,
          examples: parsed.examples || [],
          tips: parsed.tips || [],
        };
      }
    } catch (error) {
      console.error('Grammar explanation error:', error);
    }

    return {
      explanation: `${grammarPoint} is an important grammar concept in ${targetLanguage}.`,
      examples: ['Example 1', 'Example 2', 'Example 3'],
      tips: ['Tip 1', 'Tip 2'],
    };
  }

  private parseJSONResponse(text: string): any | null {
    try {
      let cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      const firstBrace = cleanText.indexOf('{');
      const firstCloseBrace = cleanText.indexOf('}', firstBrace);

      if (firstBrace !== -1) {
        let possibleJson = '';

        if (firstCloseBrace !== -1) {
          // Grab only the FIRST JSON object in case it hallucinated multiple
          possibleJson = cleanText.substring(firstBrace, firstCloseBrace + 1);
        } else {
          // Truncated JSON recovery
          let salvaged = cleanText.substring(firstBrace);
          salvaged = salvaged.replace(/,\s*"?[^"]*$/, ''); // Strip broken trailing properties
          if (!salvaged.endsWith('}')) {
            if (salvaged.endsWith('"')) salvaged += '}';
            else salvaged += '"}';
          }
          possibleJson = salvaged;
        }

        // Clean up common LLM format errors
        possibleJson = possibleJson.replace(/,\s*}/g, '}'); // Remove trailing commas
        possibleJson = possibleJson.replace(/'([^']+)'\s*:/g, '"$1":'); // Fix single-quoted keys
        possibleJson = possibleJson.replace(/:\s*'([^']+)'/g, ': "$1"'); // Fix single-quoted values

        try {
          return JSON.parse(possibleJson);
        } catch (e: any) {
          console.log("Failed to parse JSON", possibleJson, "Error:", e?.message);
        }
      }

    } catch (error: any) {
      console.warn('JSON parsing warning:', error?.message || 'Failed to parse');
      console.log('Raw text was:', text); // Debug log
    }
    return null;
  }

  private getFallbackExercise(type: DailyExerciseType, lang: string): AIExercise {
    // Hardcoded French exercises for MVP
    if (lang === 'French') {
      const frenchExercises: Record<DailyExerciseType, AIExercise> = {
        typing: {
          question: 'Translate to French: Good evening',
          answer: 'Bonsoir',
          type: 'typing',
          hint: 'Used after 6 PM',
          difficulty: 1,
          category: 'greetings',
        },
        tts: {
          question: 'Say in French: My name is...',
          answer: "Je m'appelle",
          type: 'tts',
          hint: 'Introduction phrase',
          difficulty: 1,
          category: 'greetings',
        },
        stt: {
          question: 'Listen and type what you hear (in English)',
          answer: 'Merci beaucoup',
          type: 'stt',
          hint: 'Means "Thank you very much"',
          difficulty: 1,
          category: 'greetings',
        },
        written: {
          question: 'Write in French: Where is the train station?',
          answer: 'Où est la gare ?',
          type: 'written',
          hint: 'Asking for directions',
          difficulty: 1,
          category: 'travel',
        },
      };
      return frenchExercises[type];
    }

    const fallbacks: Record<DailyExerciseType, AIExercise> = {
      typing: {
        question: `Translate to ${lang}: Hello`,
        answer: lang === 'Spanish' ? 'Hola' : 'Hello',
        type: 'typing',
        hint: "It's a common greeting",
        difficulty: 1,
        category: 'greetings',
      },
      tts: {
        question: `Say in ${lang}: Good morning`,
        answer: lang === 'Spanish' ? 'Buenos días' : 'Good morning',
        type: 'tts',
        hint: 'A morning greeting',
        difficulty: 1,
        category: 'greetings',
      },
      stt: {
        question: `Listen and type what you hear: Thank you`,
        answer: lang === 'Spanish' ? 'Gracias' : 'Thank you',
        type: 'stt',
        hint: 'A polite expression',
        difficulty: 1,
        category: 'greetings',
      },
      written: {
        question: `Write in ${lang}: How are you?`,
        answer: lang === 'Spanish' ? '¿Cómo estás?' : 'How are you?',
        type: 'written',
        hint: 'A common question',
        difficulty: 1,
        category: 'greetings',
      },
    };
    return fallbacks[type];
  }

  setDifficulty(level: number) {
    this.currentDifficulty = Math.max(1, Math.min(5, level));
  }

  getDifficulty(): number {
    return this.currentDifficulty;
  }

  getSessionHistory(): PracticeSession[] {
    return this.sessionHistory;
  }
}

export const aiPracticeService = new AIPracticeService();
