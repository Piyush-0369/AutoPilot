import { RunAnywhere } from '@runanywhere/core';
import { DailyExerciseType } from '../components/ExerciseModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Module } from '../types';
import { cefrToDifficulty } from '../data/modules';

export interface AIExercise {
  question: string;
  answer: string;
  wrongAnswer?: string;
  type: DailyExerciseType;
  hint?: string;
  difficulty: number;
  category: string;
  options?: string[];
  wordBank?: string[];
  blankPosition?: number;
  context?: string;
  isFallback?: boolean;
}

export interface PracticeSession {
  id: string;
  exercises: AIExercise[];
  targetLanguage: string;
  createdAt: Date;
}

const EXERCISE_PROMPTS = {
  typing: (lang: string, difficulty: number, nativeLang: string = 'English') => {
    if (difficulty <= 2) {
      return `Generate a beginner vocabulary translation exercise for ${lang}.
The translation must be in ${nativeLang}.
Output ONLY valid JSON. Do not include markdown formatting or explanations.

Example output:
{
  "phrase": "Apple",
  "translation": "Manzana",
  "distractors": ["Naranja", "Perro", "Gato"],
  "hint": "A common red fruit.",
  "category": "food"
}

Task: Generate a new exercise.`;
    } else if (difficulty <= 3) {
      return `Generate an intermediate vocabulary translation exercise for ${lang}.
The translation must be in ${nativeLang}.
Provide 3 random individual letters in ${lang} as distractors.
Output ONLY valid JSON. Do not include markdown formatting or explanations.

Example output:
{
  "phrase": "Water",
  "translation": "Agua",
  "distractors": ["x", "z", "k"],
  "hint": "Essential liquid for drinking.",
  "category": "travel"
}

Task: Generate a new exercise.`;
    } else {
      return `Generate an advanced sentence translation exercise for ${lang}.
The translation must be in ${nativeLang}.
Provide 3 grammatically incorrect or unrelated words in ${lang} as distractors.
Output ONLY valid JSON. Do not include markdown formatting or explanations.

Example output:
{
  "phrase": "Where is the train station?",
  "translation": "Dónde está la estación de tren",
  "distractors": ["aeropuerto", "cuando", "coche"],
  "hint": "Use the verb 'estar' for locations.",
  "category": "travel"
}

Task: Generate a new exercise.`;
    }
  },

  tts: (lang: string, difficulty: number, nativeLang: string = 'English') => {
    const length = difficulty <= 2 ? 'short' : difficulty === 3 ? 'medium-length' : 'long';
    return `Generate a ${length} speaking exercise for ${lang}.
The translation must be in ${nativeLang}.
Output ONLY valid JSON. Do not include markdown formatting or explanations.

Example output:
{
  "phrase": "¿Dónde está la biblioteca?",
  "translation": "Where is the library?",
  "hint": "Stress the 'te' syllable in 'biblioteca'.",
  "category": "travel"
}

Task: Generate a new exercise.`;
  },

  stt: (lang: string, difficulty: number, nativeLang: string = 'English') => {
    const length = difficulty <= 2 ? 'short' : difficulty === 3 ? 'medium-length' : 'long';
    return `Generate a ${length} listening comprehension exercise for ${lang}.
The translation must be in ${nativeLang}.
Provide 3 grammatically tricky or phonetically similar individual words as distractors.
Output ONLY valid JSON. Do not include markdown formatting or explanations.

Example output:
{
  "phrase": "El perro come carne",
  "translation": "The dog eats meat",
  "distractors": ["gato", "como", "carro"],
  "hint": "Listen closely to the verb ending.",
  "category": "daily-routines"
}

Task: Generate a new exercise.`;
  },
};

// --- Similarity Utility ---
function isSimilarToPrevious(newQuestion: string, queue: AIExercise[]): boolean {
  if (!newQuestion || queue.length === 0) return false;

  const newWords = newQuestion.toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(Boolean);
  if (newWords.length === 0) return false;

  for (const ex of queue) {
    const exWords = (ex.question || '').toLowerCase().replace(/[^\w\s]/gi, '').split(/\s+/).filter(Boolean);
    if (exWords.length === 0) continue;

    // Calculate match
    let matchCount = 0;
    const exWordsSet = new Set(exWords);
    for (const w of newWords) {
      if (exWordsSet.has(w)) matchCount++;
    }

    const similarity = matchCount / Math.max(newWords.length, exWords.length);
    if (similarity > 0.9) return true;
  }
  return false;
}




class AIPracticeService {
  private sessionHistory: PracticeSession[] = [];
  private currentDifficulty: number = 1;

  // Key for AsyncStorage
  private QUEUE_KEY = '@practice_exercise_queue_';
  // Lock to prevent concurrent generation calls which break the local LLM
  private generationLock: Promise<void> | null = null;

  // Global Background Queue Tracking
  private globalGenerationInterval: NodeJS.Timeout | null = null;
  private isGeneratingGlobally: boolean = false;
  private QUEUE_TARGET_THRESHOLD = 50;
  private BATCH_SIZE_MIN = 1;
  private BATCH_SIZE_MAX = 2;
  private INTERVAL_MS = 30 * 60 * 1000; // 30 minutes



  async generateExercise(
    type: DailyExerciseType,
    targetLanguage: string = 'Spanish',
    difficulty?: number,
    nativeLanguage: string = 'English'
  ): Promise<AIExercise> {
    const diff = difficulty || this.currentDifficulty;

    // MVP: Use hardcoded exercises for French
    if (targetLanguage === 'French') {
      return this.getFallbackExercise(type, targetLanguage);
    }

    // Await any existing generation lock to prevent LLM crash/hang
    while (this.generationLock) {
      await this.generationLock;
    }

    let releaseLock: () => void;
    this.generationLock = new Promise(resolve => { releaseLock = resolve; });

    try {
      const prompt = type === 'typing'
        ? EXERCISE_PROMPTS.typing(targetLanguage, diff, nativeLanguage)
        : (EXERCISE_PROMPTS as any)[type](targetLanguage, diff, nativeLanguage);

      const result = await RunAnywhere.generate(prompt, {
        maxTokens: 150,
        temperature: 0.7,
        systemPrompt: 'Respond with VALID JSON only. /no_think',
      });

      console.log(`[AIPracticeService] Raw LLM output for ${type}:`, result.text);

      let parsed = this.parseJSONResponse(result.text);

      if (parsed) {
        if ((type === 'tts' || type === 'stt' || type === 'typing') && parsed.phrase) {
          parsed.question = type === 'tts' ? parsed.phrase : parsed.phrase;
          parsed.answer = parsed.translation || parsed.phrase;
          if (parsed.translation && type !== 'typing') {
            parsed.hint = parsed.hint ? `${parsed.translation}\nHint: ${parsed.hint}` : parsed.translation;
          }
        }
      }

      if (parsed && parsed.question && parsed.answer) {
        let options: string[] | undefined = undefined;
        if (parsed.distractors && Array.isArray(parsed.distractors)) {
          options = parsed.distractors as string[];
        } else if (parsed.options && Array.isArray(parsed.options)) {
          options = parsed.options as string[];
        }

        const exercise: AIExercise = {
          question: parsed.question,
          answer: parsed.answer,
          wrongAnswer: parsed.wrongAnswer || undefined,
          type,
          hint: parsed.hint || undefined,
          difficulty: diff,
          category: parsed.category || 'general',
          options,
        };
        console.log(`[AIPracticeService] Parsed and valid exercise:`, exercise);
        return exercise;
      } else {
        console.log(`[AIPracticeService] Failed validation. parsed:`, parsed);
      }
    } catch (error) {
      console.error('AI Exercise generation error:', error);
    } finally {
      releaseLock!();
      this.generationLock = null;
    }

    return this.getFallbackExercise(type, targetLanguage);
  }

  // --- Background Queue Methods ---

  private getQueueKey(type: DailyExerciseType, lang: string): string {
    return `${this.QUEUE_KEY}${type}_${lang}`;
  }

  /**
   * Initializes the queue on app startup. If the queue has fewer than 2 exercises,
   * it generates them in the background.
   */
  async initializeBackgroundQueue(
    type: DailyExerciseType = 'typing',
    targetLanguage: string = 'Spanish',
    nativeLanguage: string = 'English'
  ): Promise<void> {
    try {
      const key = this.getQueueKey(type, targetLanguage);
      const data = await AsyncStorage.getItem(key);
      let queue: AIExercise[] = data ? JSON.parse(data) : [];

      // Always maintain at least 2 exercises in the queue quickly on startup
      if (queue.length < 2) {
        console.log(`[AIPracticeService] Initializing background queue for ${type} in ${targetLanguage}...`);

        const needed = 2 - queue.length;
        for (let i = 0; i < needed; i++) {
          const newExercise = await this.generateExercise(type, targetLanguage, this.currentDifficulty, nativeLanguage);
          if (!newExercise.isFallback && !isSimilarToPrevious(newExercise.question, queue)) {
            queue.push(newExercise);
          }
        }
        await AsyncStorage.setItem(key, JSON.stringify(queue));
        console.log(`[AIPracticeService] Background queue initialized with ${queue.length} exercises.`);
      }
    } catch (error) {
      console.error('[AIPracticeService] Failed to initialize queue:', error);
    }
  }

  /**
   * Starts a global continuous background loop that slowly populates all queues
   * up to the target threshold.
   */
  startGlobalBackgroundGeneration(targetLanguage: string, nativeLanguage: string) {
    if (this.globalGenerationInterval) {
      clearInterval(this.globalGenerationInterval);
    }

    // Fire first check immediately
    this.manageQueuesLoop(targetLanguage, nativeLanguage);

    this.globalGenerationInterval = setInterval(() => {
      this.manageQueuesLoop(targetLanguage, nativeLanguage);
    }, this.INTERVAL_MS);
  }

  private async manageQueuesLoop(targetLanguage: string, nativeLanguage: string) {
    if (this.isGeneratingGlobally) return;

    this.isGeneratingGlobally = true;
    try {
      const types: DailyExerciseType[] = ['typing', 'tts', 'stt'];
      const candidates: DailyExerciseType[] = [];

      // Find which queues need filling
      for (const t of types) {
        const key = this.getQueueKey(t, targetLanguage);
        const data = await AsyncStorage.getItem(key);
        const queue: AIExercise[] = data ? JSON.parse(data) : [];
        if (queue.length < this.QUEUE_TARGET_THRESHOLD) {
          candidates.push(t);
        }
      }

      if (candidates.length === 0) {
        console.log('[AIPracticeService] All queues are at or above threshold. Waiting for next interval.');
        this.isGeneratingGlobally = false;
        return;
      }

      // We will generate 1 or 2 exercises total across the needed queues
      const batchSize = Math.floor(Math.random() * (this.BATCH_SIZE_MAX - this.BATCH_SIZE_MIN + 1)) + this.BATCH_SIZE_MIN;
      console.log(`[AIPracticeService] Background queue manager generating ${batchSize} exercise(s) for ${targetLanguage}.`);

      for (let i = 0; i < batchSize; i++) {
        // Stop if no candidates left (e.g., if somehow filled quickly)
        if (candidates.length === 0) break;

        // Pick a random candidate queue
        const typeIndex = Math.floor(Math.random() * candidates.length);
        const selectedType = candidates[typeIndex];

        const key = this.getQueueKey(selectedType, targetLanguage);
        const data = await AsyncStorage.getItem(key);
        let queue: AIExercise[] = data ? JSON.parse(data) : [];

        if (queue.length >= this.QUEUE_TARGET_THRESHOLD) {
          candidates.splice(typeIndex, 1);
          continue; // Check next iteration
        }

        const newExercise = await this.generateExercise(selectedType, targetLanguage, this.currentDifficulty, nativeLanguage);
        if (newExercise && !newExercise.isFallback && !isSimilarToPrevious(newExercise.question, queue)) {
          queue.push(newExercise);
          await AsyncStorage.setItem(key, JSON.stringify(queue));
          console.log(`[AIPracticeService] Added new ${selectedType} exercise. Queue size: ${queue.length}`);
        } else {
          console.log(`[AIPracticeService] Skipping similar, fallback, or invalid exercise for ${selectedType}.`);
        }
      }

    } catch (error) {
      console.error('[AIPracticeService] Error in global manage queues loop:', error);
    } finally {
      this.isGeneratingGlobally = false;
    }
  }

  /**
   * Pops an exercise instantly from the queue. If empty, generates one as fallback.
   */
  async popExerciseFromQueue(
    type: DailyExerciseType = 'typing',
    targetLanguage: string = 'Spanish',
    nativeLanguage: string = 'English'
  ): Promise<AIExercise> {
    try {
      const key = this.getQueueKey(type, targetLanguage);
      const data = await AsyncStorage.getItem(key);
      let queue: AIExercise[] = data ? JSON.parse(data) : [];

      if (queue.length > 0) {
        const exercise = queue.shift()!;
        await AsyncStorage.setItem(key, JSON.stringify(queue));
        return exercise;
      }
    } catch (error) {
      console.error('[AIPracticeService] Failed to pop from queue:', error);
    }

    // Fallback if empty or error
    console.log(`[AIPracticeService] Queue empty for ${type}, generating on demand...`);
    return this.generateExercise(type, targetLanguage, this.currentDifficulty, nativeLanguage);
  }

  /**
   * Generates a replacement exercise in the background and pushes it to the queue.
   */
  async backgroundGenerateReplacement(
    type: DailyExerciseType = 'typing',
    targetLanguage: string = 'Spanish',
    nativeLanguage: string = 'English'
  ): Promise<void> {
    // We let startGlobalBackgroundGeneration handle the bulk of loading to respect constraints.
    // However, if we pop one and we're significantly under threshold or empty, we could fetch one.
    // For now we'll just let the continuous global loop handle refilling to prevent overload.
    // Eagerly kickstart the queue run if not generating
    this.manageQueuesLoop(targetLanguage, nativeLanguage);
  }

  // ---------------------------------

  async generatePracticeSet(
    targetLanguage: string = 'Spanish',
    count: number = 4,
    includeTypes?: DailyExerciseType[]
  ): Promise<AIExercise[]> {
    const types: DailyExerciseType[] = includeTypes || ['typing', 'tts', 'stt'];
    const exercises: AIExercise[] = [];

    const difficulty = this.currentDifficulty;

    for (let i = 0; i < Math.min(count, types.length); i++) {
      const exercise = await this.generateExercise(types[i], targetLanguage, difficulty);
      exercises.push(exercise);
    }

    return exercises;
  }

  async generateDailyChallenge(
    targetLanguage: string = 'Spanish'
  ): Promise<AIExercise[]> {
    const types: DailyExerciseType[] = ['typing', 'tts', 'stt'];
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
      // 1. Remove <think> blocks if present
      let cleanText = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

      // 2. Remove markdown code fences (```json ... ```) 
      // This regex matches ```json (content) ``` or just ``` (content) ```
      const codeFenceMatch = cleanText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeFenceMatch) {
        cleanText = codeFenceMatch[1];
      }

      // 3. Find the first valid JSON object
      // Using a regex to find the outermost curly braces
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: Try parsing the whole text if it looks like JSON
      return JSON.parse(cleanText);

    } catch (error) {
      console.error('JSON parsing error:', error);
      console.log('Raw text was:', text); // Debug log
    }
    return null;
  }

  private getFallbackExercise(type: DailyExerciseType, lang: string): AIExercise {
    // Hardcoded French exercises for MVP
    if (lang === 'French') {
      const frenchExercises: Record<DailyExerciseType, AIExercise> = {
        typing: {
          question: 'What is Good evening in French?',
          answer: 'Bonsoir',
          wrongAnswer: 'Bonjour',
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
          question: 'Listen and arrange the words you hear',
          answer: 'Merci beaucoup',
          wrongAnswer: 'Bonjour merci',
          type: 'stt',
          hint: 'Means "Thank you very much"',
          difficulty: 1,
          category: 'greetings',
        },
      };
      return { ...frenchExercises[type], isFallback: true };
    }

    const fallbacks: Record<DailyExerciseType, AIExercise> = {
      typing: {
        question: `What is Hello in ${lang}?`,
        answer: lang === 'Spanish' ? 'Hola' : 'Hello',
        wrongAnswer: lang === 'Spanish' ? 'Adiós' : 'Goodbye',
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
        question: `Listen and arrange the words you hear`,
        answer: lang === 'Spanish' ? 'Gracias' : 'Thank you',
        wrongAnswer: lang === 'Spanish' ? 'Hola' : 'Goodbye',
        type: 'stt',
        hint: 'A polite expression',
        difficulty: 1,
        category: 'greetings',
      },
    };
    return { ...fallbacks[type], isFallback: true };
  }

  /**
   * Generates an exercise scoped to a specific CEFR module's topics and category.
   */
  async generateModuleExercise(
    type: DailyExerciseType,
    targetLanguage: string,
    mod: Module,
    nativeLanguage: string = 'English',
  ): Promise<AIExercise> {
    const diff = cefrToDifficulty(mod.cefrLevel);

    // Await any existing generation lock
    while (this.generationLock) {
      await this.generationLock;
    }

    let releaseLock: () => void;
    this.generationLock = new Promise(resolve => { releaseLock = resolve; });

    try {
      const prompt = type === 'typing'
        ? EXERCISE_PROMPTS.typing(targetLanguage, diff, nativeLanguage)
        : (EXERCISE_PROMPTS as any)[type](targetLanguage, diff, nativeLanguage);

      const result = await RunAnywhere.generate(prompt, {
        maxTokens: 150,
        temperature: 0.7,
        systemPrompt: 'Respond with VALID JSON only. /no_think',
      });

      let parsed = this.parseJSONResponse(result.text);

      if (parsed) {
        if ((type === 'tts' || type === 'stt') && parsed.phrase) {
          parsed.question = type === 'tts' ? parsed.phrase : "Listen and arrange the words";
          parsed.answer = parsed.phrase;
          if (parsed.translation) {
            parsed.hint = parsed.hint ? `${parsed.translation}\nHint: ${parsed.hint}` : parsed.translation;
          }
        }
      }

      if (parsed && parsed.question && parsed.answer) {
        let options: string[] | undefined = undefined;
        if (parsed.distractors && Array.isArray(parsed.distractors)) {
          options = parsed.distractors as string[];
        } else if (parsed.options && Array.isArray(parsed.options)) {
          options = parsed.options as string[];
        }

        const exercise: AIExercise = {
          question: parsed.question,
          answer: parsed.answer,
          wrongAnswer: parsed.wrongAnswer || undefined,
          type,
          hint: parsed.hint || undefined,
          difficulty: diff,
          category: mod.category,
          options,
        };
        return exercise;
      }
    } catch (error) {
      console.error('[AIPracticeService] Module exercise generation error:', error);
    } finally {
      releaseLock!();
      this.generationLock = null;
    }

    return this.getFallbackExercise(type, targetLanguage);
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
