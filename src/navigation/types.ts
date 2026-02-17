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
};
