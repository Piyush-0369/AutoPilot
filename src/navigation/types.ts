export type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
  ToolCalling: undefined;
  SpeechToText: undefined;
  TextToSpeech: undefined;
  VoicePipeline: undefined;
  Practice: undefined;
  ConversationPractice: undefined;
  PronunciationPractice: undefined;
  GrammarPractice: undefined;
  Progress: undefined;
  Ranking: undefined;
  Profile: undefined;
  Welcome: undefined;
  Transition: { summary: { totalXP: number; accuracy: number; timeSpentMinutes: number; exercisesCompleted: number }; leveledUp?: boolean };
  // Learning Path screens
  Lesson: { lessonId: string };
  LessonRoadmap: { courseId?: string } | undefined;
  ReviewSession: undefined;
  VocabularyNotebook: undefined;
  ProgressAnalytics: undefined;
};

export interface UserProfile {
  id: string;
  name: string;
  targetLanguage: string;
  nativeLanguage: string;
  dailyGoalMinutes: number;
  createdAt: string;
}

export const STORAGE_KEYS = {
  SETUP_COMPLETE: '@setup_complete',
  USER_PROFILE: '@user_profile',
} as const;
