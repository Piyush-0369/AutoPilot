import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RunAnywhere, VoiceSessionEvent, VoiceSessionHandle } from '@runanywhere/core';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppColors } from '../theme';
import { useModelService } from '../services/ModelService';
import { useUserProgress } from '../services/UserProgressService';
import { aiPracticeService } from '../services/AIPracticeService';
import { ModelLoaderWidget, AudioVisualizer, FeedbackModal } from '../components';
import { RootStackParamList } from '../navigation/types';

type ConversationPracticeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'ConversationPractice'>;
};

export const ConversationPracticeScreen: React.FC<ConversationPracticeScreenProps> = ({ navigation }) => {
  const modelService = useModelService();
  const userProgress = useUserProgress();
  // ... state ...

  // ... (keep existing state and refs) ...

  const [selectedScenario, setSelectedScenario] = useState<typeof CONVERSATION_SCENARIOS[0] | null>(
    null
  );
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<string>('Ready');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [feedbackData, setFeedbackData] = useState({
    accuracy: 0,
    xp: 0,
    turns: 0,
  });

  const sessionRef = useRef<VoiceSessionHandle | null>(null);
  const conversationTurnsRef = useRef<number>(0);

  // ... (keep existing callbacks: showSessionResults, handleVoiceEvent) ...

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
    await userProgress.updateXP(xp);
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

    const targetLanguage = userProgress.targetLanguage || 'Spanish';

    // Customize prompt to handle language limitations (English models)
    const enhancedPrompt = `${selectedScenario.prompt}. 
    IMPORTANT: The user is learning ${targetLanguage}. 
    Since your voice and hearing are currently tuned to English, conduct the conversation mainly in English.
    Teach the user ${targetLanguage} phrases relevant to the scenario. 
    Ask them to repeat phrases, but acknowledge that you might not hear non-English words perfectly.
    Be encouraging and helpful.`;

    try {
      const config: any = {
        silenceDuration: 1.5,
        speechThreshold: 0.1,
        autoPlayTTS: true,
        continuousMode: true,
        language: 'en',
        systemPrompt: enhancedPrompt,
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
    setIsActive(false); // Ensure inactive
    // navigation.goBack(); // Optional: Go back to list or stay
  };

  const handleGenerateTopic = async () => {
    setIsGenerating(true);
    try {
      const targetLang = userProgress.targetLanguage || 'Spanish';
      const result = await aiPracticeService.generateConversationTopic(targetLang);

      if (result) {
        setSelectedScenario({
          id: 'ai-' + Date.now(),
          title: result.topic,
          icon: '✨',
          prompt: result.prompt,
          difficulty: 'Adaptive',
        });
      }
    } catch (error) {
      console.error('Failed to generate topic:', error);
      Alert.alert('Error', 'Could not generate a new topic. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!modelService.isVoiceAgentReady) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Conversation Practice</Text>
        </View>
        <ModelLoaderWidget
          title="Voice Tutor Required"
          subtitle="Download and load the AI modules (Tutor, Listening, Speaking)"
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
          modelId="llm"
          onLoad={modelService.downloadAndLoadAllModels}
        />
      </View>
    );
  }

  // Active Conversation View
  if (selectedScenario && isActive) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={stopConversation} style={styles.backButton}>
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>{selectedScenario.title}</Text>
            <Text style={styles.headerSubtitle}>Speaking Practice</Text>
          </View>
        </View>

        {/* Status Area */}
        <View style={styles.statusArea}>
          <AudioVisualizer level={audioLevel} />
          <Text style={[styles.statusTitle, { color: AppColors.primary }]}>
            {status}
          </Text>
          <Text style={styles.statusSubtitle}>Turns: {conversationTurnsRef.current}</Text>
        </View>

        {/* Conversation */}
        <ScrollView
          style={styles.conversationList}
          contentContainerStyle={styles.conversationContent}
          ref={(ref) => ref?.scrollToEnd({ animated: true })}
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
              <Text style={[
                styles.messageText,
                message.role === 'user' ? styles.userMessageText : styles.assistantMessageText
              ]}>{message.text}</Text>
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
              <Text style={styles.buttonText}>End Session</Text>
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

  // Selection View
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Conversation Practice</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.introCard}>
          <Text style={styles.introTitle}>Roleplay Scenarios</Text>
          <Text style={styles.introSubtitle}>
            Select a scenario to practice real-world conversations with your AI tutor.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Available Scenarios</Text>

        {/* Dynamic Topic Card */}
        <TouchableOpacity
          style={styles.scenarioCard}
          onPress={handleGenerateTopic}
          disabled={isGenerating}
        >
          <View style={[styles.scenarioIcon, { backgroundColor: AppColors.primary + '10' }]}>
            {isGenerating ? (
              <ActivityIndicator color={AppColors.primary} size="small" />
            ) : (
              <Text style={styles.scenarioIconText}>✨</Text>
            )}
          </View>
          <View style={styles.scenarioContent}>
            <Text style={styles.scenarioTitle}>
              {isGenerating ? 'Designing Scenario...' : 'Surprise Me! (AI)'}
            </Text>
            <Text style={styles.scenarioDifficulty}>
              Practice a unique scenario generated by AI
            </Text>
          </View>
          {!isGenerating && <Text style={[styles.scenarioArrow, { color: AppColors.primary }]}>→</Text>}
        </TouchableOpacity>

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

      </ScrollView>

      {selectedScenario && !isActive && (
        <View style={styles.selectedModal}>
          <View style={styles.selectedScenarioCard}>
            <View style={styles.selectedHeader}>
              <Text style={styles.selectedTitle}>Selected: {selectedScenario.title}</Text>
              <TouchableOpacity onPress={() => setSelectedScenario(null)}>
                <Text style={styles.clearButton}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.selectedDescription}>{selectedScenario.prompt}</Text>

            <TouchableOpacity onPress={startConversation} style={styles.buttonMargin}>
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
        </View>
      )}
    </View>
  );
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


const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#F5F7FA' },
  buttonMargin: { marginTop: 20 },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 16 : 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 20,
    color: '#374151',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  introCard: {
    marginBottom: 24,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  introSubtitle: {
    fontSize: 16,
    color: '#4B5563',
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  scenarioCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  scenarioIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scenarioIconText: {
    fontSize: 24,
  },
  scenarioContent: {
    flex: 1,
  },
  scenarioTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  scenarioDifficulty: {
    fontSize: 13,
    color: '#6B7280',
  },
  scenarioArrow: {
    fontSize: 18,
    color: '#CBD5E1',
    fontWeight: '600',
  },
  statusArea: {
    margin: 20,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: '#EFF6FF',
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginVertical: 12,
  },
  statusSubtitle: {
    fontSize: 13,
    color: '#6B7280',
  },
  conversationList: {
    flex: 1,
  },
  conversationContent: {
    padding: 20,
    paddingTop: 0,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: AppColors.primary,
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#1F2937',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    elevation: 4,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  buttonIcon: {
    fontSize: 20,
    color: '#FFFFFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  selectedModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    top: 0,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 40,
  },
  selectedScenarioCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
  },
  selectedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  selectedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  clearButton: {
    fontSize: 24,
    color: '#9CA3AF',
    fontWeight: '400',
    padding: 4,
  },
  selectedDescription: {
    fontSize: 15,
    color: '#4B5563',
    lineHeight: 24,
    marginBottom: 24,
  },
});
