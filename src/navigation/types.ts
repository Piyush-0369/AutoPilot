export type RootStackParamList = {
  Home: undefined;
  Chat: undefined;
  ToolCalling: undefined;
  SpeechToText: undefined;
  TextToSpeech: undefined;
  VoicePipeline: undefined;
  Practice: { startExerciseType?: 'typing' | 'tts' | 'stt' } | undefined;
  ConversationPractice: undefined;
  PronunciationPractice: undefined;
  GrammarPractice: undefined;
  Progress: undefined;
  Ranking: undefined;
  Profile: undefined;
  Welcome: { assessmentResult?: string } | undefined;
  Assessment: { language: string };
  Transition: { summary: { totalXP: number; accuracy: number; timeSpentMinutes: number; exercisesCompleted: number }; leveledUp?: boolean };
};

export interface UserProfile {
  id: string;
  name: string;
  targetLanguage: string;
  nativeLanguage: string;
  proficiencyLevel?: string;
  dailyGoalMinutes: number;
  createdAt: string;
}

export const STORAGE_KEYS = {
  SETUP_COMPLETE: '@setup_complete',
  USER_PROFILE: '@user_profile',
} as const;