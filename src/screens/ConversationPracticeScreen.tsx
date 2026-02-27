import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RunAnywhere, VoiceSessionEvent, VoiceSessionHandle } from '@runanywhere/core';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppColors } from '../theme';
import { useModelService } from '../services/ModelService';
import { useUserProgress } from '../services/UserProgressService';
import { ModelLoaderWidget, AudioVisualizer, FeedbackModal } from '../components';
import { RootStackParamList } from '../navigation/types';
import { getSTTLocale } from '../types/learningTypes';

type ConversationPracticeScreenProps = {
  // navigation is not used in this screen
};

interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const CONVERSATION_SCENARIOS = [
  {
    id: 'airport',
    title: 'At the Airport',
    icon: '✈️',
    prompt:
      'You are a helpful airline staff member. Help the learner practice common airport conversations like checking in, asking for flights, and discussing luggage.',
    difficulty: 'Beginner',
  },
  {
    id: 'restaurant',
    title: 'Restaurant Ordering',
    icon: '🍽️',
    prompt:
      'You are a friendly waiter/waitress. Help the learner practice ordering food, asking about menu items, and discussing preferences.',
    difficulty: 'Beginner',
  },
  {
    id: 'business',
    title: 'Business Meeting',
    icon: '💼',
    prompt:
      'You are a professional colleague. Help the learner practice business conversations, presentations, and professional discussions.',
    difficulty: 'Intermediate',
  },
  {
    id: 'travel',
    title: 'Travel Planning',
    icon: '🗺️',
    prompt:
      'You are a travel agent. Help the learner practice booking trips, discussing destinations, and travel plans.',
    difficulty: 'Intermediate',
  },
];

const MODEL_IDS = {
  llm: 'lfm2-350m-q8_0',
  stt: 'sherpa-onnx-whisper-tiny.en',
  tts: 'vits-piper-en_US-lessac-medium',
};

export const ConversationPracticeScreen: React.FC<ConversationPracticeScreenProps> = () => {
  const modelService = useModelService();
  const userProgress = useUserProgress();

  const [selectedScenario, setSelectedScenario] = useState<typeof CONVERSATION_SCENARIOS[0] | null>(
    null
  );
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<string>('Ready');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    accuracy: 0,
    xp: 0,
    turns: 0,
  });

  const sessionRef = useRef<VoiceSessionHandle | null>(null);
  const conversationTurnsRef = useRef<number>(0);

  const showSessionResults = useCallback(async () => {
    // Calculate accuracy and XP
    const turns = conversationTurnsRef.current;
    const accuracy = Math.min(100, 75 + turns * 5); // Rough calculation based on turns
    const baseXP = 25;
    const bonusXP = Math.min(25, turns * 5);
    const xp = baseXP + bonusXP;

    setFeedbackData({
      accuracy,
      xp,
      turns,
    });
    setShowFeedback(true);

    // Award XP to user
    await userProgress.completeActivity('conversation', accuracy, 60000); // Approximate 1 min
  }, [userProgress]);

  const handleVoiceEvent = useCallback((event: VoiceSessionEvent) => {
    switch (event.type) {
      case 'started':
        setStatus('Listening...');
        setAudioLevel(0.2);
        break;

      case 'listening':
        setStatus('Listening...');
        setAudioLevel(0.3);
        break;

      case 'speechStarted':
        setStatus('Hearing you...');
        setAudioLevel(0.7);
        break;

      case 'speechEnded':
        setAudioLevel(0.1);
        break;

      case 'transcribed':
        if (event.transcription) {
          const userMessage: ConversationMessage = {
            role: 'user',
            text: event.transcription,
            timestamp: new Date(),
          };
          setConversation((prev) => [...prev, userMessage]);
        }
        setStatus('Thinking...');
        setAudioLevel(0.4);
        break;

      case 'responded':
        if (event.response) {
          const assistantMessage: ConversationMessage = {
            role: 'assistant',
            text: event.response,
            timestamp: new Date(),
          };
          setConversation((prev) => [...prev, assistantMessage]);
          conversationTurnsRef.current += 1;
        }
        setStatus('Speaking...');
        setAudioLevel(0.8);
        break;

      case 'turnCompleted':
        setStatus('Listening...');
        setAudioLevel(0.3);
        break;

      case 'error':
        setStatus(`Error: ${event.error}`);
        console.error('Voice session error:', event.error);
        break;

      case 'stopped':
        setIsActive(false);
        setStatus('Session ended');
        showSessionResults();
        break;

      default:
        break;
    }
  }, [showSessionResults]);

  const startConversation = async () => {
    if (!selectedScenario) {
      Alert.alert('Please select a scenario first');
      return;
    }

    setIsActive(true);
    setConversation([]);
    setStatus('Starting...');
    conversationTurnsRef.current = 0;

<<<<<<< Updated upstream
=======
    const targetLanguage = userProgress.targetLanguage || 'Spanish';
    const sttLocale = getSTTLocale(targetLanguage);

    // Use target language for conversation when STT supports it
    const enhancedPrompt = `${selectedScenario.prompt}.
    IMPORTANT: The user is learning ${targetLanguage}.
    Teach the user ${targetLanguage} phrases relevant to the scenario.
    When the user speaks in ${targetLanguage}, acknowledge their effort.
    Correct any mistakes gently and explain the grammar.
    Mix ${targetLanguage} phrases with English explanations.
    Be encouraging and helpful.`;

>>>>>>> Stashed changes
    try {
      const config: any = {
        silenceDuration: 1.5,
        speechThreshold: 0.1,
        autoPlayTTS: true,
        continuousMode: true,
<<<<<<< Updated upstream
        language: 'en',
        systemPrompt: selectedScenario.prompt,
=======
        language: sttLocale,
        systemPrompt: enhancedPrompt,
>>>>>>> Stashed changes
        onEvent: handleVoiceEvent,
      };
      
      sessionRef.current = await RunAnywhere.startVoiceSession(config);
    } catch (error) {
      console.error('Voice session error:', error);
      Alert.alert('Error', `Failed to start conversation: ${error}`);
      setIsActive(false);
      setStatus('Ready');
    }
  };

  const stopConversation = async () => {
    try {
      if (sessionRef.current) {
        await sessionRef.current.stop();
        sessionRef.current = null;
      }
      setIsActive(false);
    } catch (error) {
      console.error('Error stopping session:', error);
    }
  };

  const handleFeedbackClose = () => {
    setShowFeedback(false);
    setSelectedScenario(null);
    setConversation([]);
  };

  if (!modelService.isVoiceAgentReady) {
    return (
      <ModelLoaderWidget
        title="Voice Agent Required"
        subtitle="Download and load all models (LLM, STT, TTS)"
        icon="pipeline"
        accentColor={AppColors.accentCyan}
        isDownloading={
          modelService.isLLMDownloading ||
          modelService.isSTTDownloading ||
          modelService.isTTSDownloading
        }
        isLoading={
          modelService.isLLMLoading ||
          modelService.isSTTLoading ||
          modelService.isTTSLoading
        }
        progress={
          (modelService.llmDownloadProgress +
            modelService.sttDownloadProgress +
            modelService.ttsDownloadProgress) /
          3
        }
        onLoad={modelService.downloadAndLoadAllModels}
      />
    );
  }

  if (selectedScenario && isActive) {
    return (
      <View style={styles.container}>
        {/* Status Area */}
        <View style={styles.statusArea}>
          <AudioVisualizer level={audioLevel} />
          <Text style={[styles.statusTitle, { color: AppColors.accentCyan }]}>
            {status}
          </Text>
          <Text style={styles.statusSubtitle}>Turns: {conversationTurnsRef.current}</Text>
        </View>

        {/* Conversation */}
        <ScrollView
          style={styles.conversationList}
          contentContainerStyle={styles.conversationContent}
        >
          {conversation.map((message, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                message.role === 'user'
                  ? styles.userBubble
                  : styles.assistantBubble,
              ]}
            >
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Control Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={stopConversation}>
            <LinearGradient
              colors={[AppColors.error, '#DC2626']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonIcon}>⏹</Text>
              <Text style={styles.buttonText}>End Conversation</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <FeedbackModal
          visible={showFeedback}
          title="Conversation Complete!"
          icon="🎉"
          accuracy={feedbackData.accuracy}
          xpEarned={feedbackData.xp}
          feedback={[
            { label: 'Turns', value: feedbackData.turns },
            { label: 'Accuracy', value: `${feedbackData.accuracy}%`, type: 'positive' },
            { label: 'XP Earned', value: feedbackData.xp, type: 'positive' },
          ]}
          onClose={handleFeedbackClose}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.title}>Conversation Practice</Text>
        <Text style={styles.subtitle}>
          Select a scenario and practice real conversations with AI
        </Text>

        <Text style={styles.sectionTitle}>Available Scenarios</Text>
        {CONVERSATION_SCENARIOS.map((scenario) => (
          <TouchableOpacity
            key={scenario.id}
            onPress={() => setSelectedScenario(scenario)}
            style={styles.scenarioCard}
            activeOpacity={0.8}
          >
            <View style={styles.scenarioIcon}>
              <Text style={styles.scenarioIconText}>{scenario.icon}</Text>
            </View>
            <View style={styles.scenarioContent}>
              <Text style={styles.scenarioTitle}>{scenario.title}</Text>
              <Text style={styles.scenarioDifficulty}>{scenario.difficulty}</Text>
            </View>
            <Text style={styles.scenarioArrow}>→</Text>
          </TouchableOpacity>
        ))}

        {selectedScenario && (
          <View style={styles.selectedScenarioCard}>
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedTitle}>Selected: {selectedScenario.title}</Text>
              <TouchableOpacity onPress={() => setSelectedScenario(null)}>
                <Text style={styles.clearButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.selectedDescription}>{selectedScenario.prompt}</Text>
          </View>
        )}
      </ScrollView>

      {selectedScenario && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={startConversation}>
            <LinearGradient
              colors={[AppColors.accentCyan, '#06B6D4']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonIcon}>🎤</Text>
              <Text style={styles.buttonText}>Start Conversation</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.primaryDark,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  scenarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '1A',
  },
  scenarioIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: AppColors.accentCyan + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scenarioIconText: {
    fontSize: 32,
  },
  scenarioContent: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 2,
  },
  scenarioDifficulty: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  scenarioArrow: {
    fontSize: 16,
    color: AppColors.accentCyan,
  },
  selectedScenarioCard: {
    backgroundColor: AppColors.accentCyan + '20',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: AppColors.accentCyan + '40',
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  clearButton: {
    fontSize: 20,
    color: AppColors.textMuted,
  },
  selectedDescription: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  statusArea: {
    padding: 32,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: AppColors.accentCyan + '80',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: AppColors.accentCyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  statusSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  conversationList: {
    flex: 1,
    marginBottom: 16,
  },
  conversationContent: {
    paddingHorizontal: 16,
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginVertical: 8,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: AppColors.accentCyan + '30',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.surfaceCard,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 14,
    color: AppColors.textPrimary,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 16,
    backgroundColor: AppColors.surfaceCard + 'CC',
    borderTopWidth: 1,
    borderTopColor: AppColors.textMuted + '1A',
  },
  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    elevation: 8,
    shadowColor: AppColors.accentCyan,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
  },
  buttonIcon: {
    fontSize: 24,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
