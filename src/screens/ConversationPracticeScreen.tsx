// ============================================================
// Conversation Practice Screen — Elevated AI Language Lab
// ============================================================
// The flagship feature: an immersive, curriculum-integrated
// conversation simulator with structured stages, per-turn AI
// feedback, adaptive coaching, and detailed session reports.

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Animated,
  Platform,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RunAnywhere, VoiceSessionEvent, VoiceSessionHandle } from '@runanywhere/core';
import { AppColors } from '../theme';
import { useModelService } from '../services/ModelService';
import { useUserProgress } from '../services/UserProgressService';
import { ModelLoaderWidget, AudioVisualizer } from '../components';
import { ConversationFeedbackOverlay } from '../components/ConversationFeedbackOverlay';
import { ConversationReportCard } from '../components/ConversationReportCard';
import { conversationSessionService } from '../services/ConversationSessionService';
import { conversationIntelligenceService } from '../services/ConversationIntelligenceService';
import { learningPathService } from '../services/LearningPathService';
import { getSTTLocale } from '../types/learningTypes';
import { getVocabularyForLanguage } from '../data/seedData';
import type {
  LearningScenario,
  ConversationMode,
  ConversationTurnFeedback,
  ConversationSessionReport,
  VocabularyEntry,
} from '../types/learningTypes';

// ============================================================
// Sub-view Types
// ============================================================
type ScreenView = 'selection' | 'vocab-preview' | 'active' | 'report';

interface ConversationMessage {
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  feedback?: ConversationTurnFeedback;
}

// ============================================================
// Component
// ============================================================
export const ConversationPracticeScreen: React.FC = () => {
  const modelService = useModelService();
  const userProgress = useUserProgress();

  // View state
  const [currentView, setCurrentView] = useState<ScreenView>('selection');

  // Selection state
  const [unlockedScenarios, setUnlockedScenarios] = useState<LearningScenario[]>([]);
  const [lockedScenarios, setLockedScenarios] = useState<LearningScenario[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<LearningScenario | null>(null);
  const [selectedMode, setSelectedMode] = useState<ConversationMode>('formal');

  // Vocab preview state
  const [previewVocab, setPreviewVocab] = useState<VocabularyEntry[]>([]);
  const [currentVocabIdx, setCurrentVocabIdx] = useState(0);

  // Active conversation state
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Ready');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentFeedback, setCurrentFeedback] = useState<ConversationTurnFeedback | null>(null);
  const [showFeedbackOverlay, setShowFeedbackOverlay] = useState(false);
  const [stageProgress, setStageProgress] = useState(0);
  const [coachingHint, setCoachingHint] = useState<string | null>(null);

  // Report state
  const [sessionReport, setSessionReport] = useState<ConversationSessionReport | null>(null);

  // Refs
  const sessionRef = useRef<VoiceSessionHandle | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const turnCountRef = useRef(0);

  // ============================================================
  // LOAD SCENARIOS
  // ============================================================
  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    const targetLang = userProgress.targetLanguage || 'ja';
    const langCode = targetLang.length <= 3 ? targetLang : getSTTLocale(targetLang);

    try {
      const result = await learningPathService.getUnlockedScenarios('default', langCode);
      setUnlockedScenarios(result.unlocked);
      setLockedScenarios(result.locked);
    } catch (e) {
      // Fallback: show all scenarios for the language
      const all = learningPathService.getScenariosForLanguage(langCode);
      setUnlockedScenarios(all);
    }
  };

  // ============================================================
  // SCENARIO SELECTION
  // ============================================================
  const handleSelectScenario = (scenario: LearningScenario) => {
    setSelectedScenario(scenario);
    setSelectedMode(scenario.conversationMode);
  };

  const handleStartPreview = () => {
    if (!selectedScenario) return;

    // Load vocabulary for preview
    const allVocab = getVocabularyForLanguage(selectedScenario.languageCode);
    const scenarioVocab = allVocab.filter(v =>
      selectedScenario.vocabularyIds.includes(v.id)
    );

    if (scenarioVocab.length > 0) {
      setPreviewVocab(scenarioVocab);
      setCurrentVocabIdx(0);
      setCurrentView('vocab-preview');
    } else {
      // Skip preview if no vocab
      handleStartConversation();
    }
  };

  // ============================================================
  // CONVERSATION LIFECYCLE
  // ============================================================
  const handleStartConversation = async () => {
    if (!selectedScenario) return;

    // Initialize session service
    conversationSessionService.startSession(selectedScenario, selectedMode);

    setCurrentView('active');
    setIsActive(true);
    setConversation([]);
    setStatus('Starting...');
    turnCountRef.current = 0;
    setCoachingHint(null);

    const targetLanguage = userProgress.targetLanguage || 'Spanish';
    const sttLocale = getSTTLocale(targetLanguage);

    // Build stage-aware system prompt
    const stagePrompt = conversationSessionService.buildStagePrompt(targetLanguage);

    try {
      const config: any = {
        silenceDuration: 1.5,
        speechThreshold: 0.1,
        autoPlayTTS: true,
        continuousMode: true,
        language: sttLocale,
        systemPrompt: stagePrompt,
        onEvent: handleVoiceEvent,
      };

      sessionRef.current = await RunAnywhere.startVoiceSession(config);
    } catch (error) {
      console.error('Voice session error:', error);
      Alert.alert('Error', `Failed to start conversation: ${error}`);
      setIsActive(false);
      setCurrentView('selection');
    }
  };

  const handleStopConversation = async () => {
    try {
      if (sessionRef.current) {
        await sessionRef.current.stop();
        sessionRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping session:', error);
    }
    await finalizeSession();
  };

  const finalizeSession = async () => {
    setIsActive(false);

    // Generate report
    const report = await conversationSessionService.endSession();
    if (report) {
      setSessionReport(report);

      // Award XP
      await userProgress.completeConversation(report.xpEarned, report.overallScore);

      // Feed back into SRS
      await learningPathService.recordConversationResult('default', report.scenarioId, {
        weakVocabulary: report.weakVocabulary,
        strongVocabulary: report.strongVocabulary,
        overallScore: report.overallScore,
      });

      setCurrentView('report');
    } else {
      setCurrentView('selection');
    }
  };

  // ============================================================
  // VOICE EVENT HANDLER
  // ============================================================
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
          const msg: ConversationMessage = {
            role: 'user', text: event.transcription, timestamp: new Date(),
          };
          setConversation(prev => [...prev, msg]);
        }
        setStatus('Thinking...');
        setAudioLevel(0.4);
        break;
      case 'responded':
        if (event.response) {
          handleTurnComplete(
            conversation[conversation.length - 1]?.text || '',
            event.response,
          );
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
        break;
      case 'stopped':
        setIsActive(false);
        setStatus('Session ended');
        finalizeSession();
        break;
    }
  }, [conversation]);

  // ============================================================
  // PER-TURN ANALYSIS
  // ============================================================
  const handleTurnComplete = async (userText: string, aiResponse: string) => {
    if (!selectedScenario) return;

    turnCountRef.current += 1;
    const targetLanguage = userProgress.targetLanguage || 'Spanish';

    // Add AI message
    const assistantMsg: ConversationMessage = {
      role: 'assistant', text: aiResponse, timestamp: new Date(),
    };
    setConversation(prev => [...prev, assistantMsg]);

    // Run intelligence analysis
    const stageName = conversationSessionService.getCurrentStageName();
    const feedback = await conversationIntelligenceService.analyzeTurn(
      userText, aiResponse, turnCountRef.current, stageName,
      selectedScenario, targetLanguage,
    );

    // Record turn in session service
    const stageChanged = conversationSessionService.recordTurn(feedback);
    setStageProgress(conversationSessionService.getOverallProgress());

    // Show feedback overlay
    setCurrentFeedback(feedback);
    setShowFeedbackOverlay(true);

    // Check adaptive coaching
    const allFeedback = conversationSessionService.getSession()?.turnFeedback || [];
    const struggling = conversationIntelligenceService.detectStruggling(allFeedback);
    if (struggling.isStruggling && struggling.hint) {
      setCoachingHint(struggling.hint);
    } else {
      setCoachingHint(null);
    }

    // Auto scroll
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 300);
  };

  // ============================================================
  // RENDER: Model Loader
  // ============================================================
  if (!modelService.isVoiceAgentReady) {
    return (
      <ModelLoaderWidget
        title="Voice Agent Required"
        subtitle="Download and load all models (LLM, STT, TTS)"
        icon="pipeline"
        accentColor={AppColors.accentCyan}
        isDownloading={
          modelService.isLLMDownloading || modelService.isSTTDownloading || modelService.isTTSDownloading
        }
        isLoading={
          modelService.isLLMLoading || modelService.isSTTLoading || modelService.isTTSLoading
        }
        progress={
          (modelService.llmDownloadProgress + modelService.sttDownloadProgress + modelService.ttsDownloadProgress) / 3
        }
        onLoad={modelService.downloadAndLoadAllModels}
      />
    );
  }

  // ============================================================
  // RENDER: Report View
  // ============================================================
  if (currentView === 'report' && sessionReport) {
    return (
      <ConversationReportCard
        report={sessionReport}
        onPracticeAgain={() => {
          setSessionReport(null);
          handleStartConversation();
        }}
        onClose={() => {
          setSessionReport(null);
          setSelectedScenario(null);
          setCurrentView('selection');
          loadScenarios();
        }}
      />
    );
  }

  // ============================================================
  // RENDER: Vocabulary Preview
  // ============================================================
  if (currentView === 'vocab-preview') {
    const vocab = previewVocab[currentVocabIdx];
    return (
      <View style={styles.container}>
        <View style={styles.previewHeader}>
          <TouchableOpacity onPress={() => setCurrentView('selection')}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.previewTitle}>Vocabulary Preview</Text>
          <Text style={styles.previewCounter}>{currentVocabIdx + 1}/{previewVocab.length}</Text>
        </View>

        <View style={styles.previewCard}>
          <Text style={styles.previewWord}>{vocab?.nativeScript || vocab?.word}</Text>
          <Text style={styles.previewPhonetic}>{vocab?.phonetic}</Text>
          <Text style={styles.previewMeaning}>{vocab?.meaning}</Text>
          {vocab?.exampleSentence && (
            <View style={styles.previewExample}>
              <Text style={styles.previewExampleSentence}>{vocab.exampleSentence}</Text>
              <Text style={styles.previewExampleTranslation}>{vocab.exampleTranslation}</Text>
            </View>
          )}
        </View>

        <View style={styles.previewActions}>
          {currentVocabIdx < previewVocab.length - 1 ? (
            <TouchableOpacity onPress={() => setCurrentVocabIdx(i => i + 1)}>
              <LinearGradient colors={[AppColors.accentCyan, '#06B6D4']} style={styles.previewNextBtn}>
                <Text style={styles.previewNextText}>Next Word →</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleStartConversation}>
              <LinearGradient colors={[AppColors.accentGreen, '#059669']} style={styles.previewNextBtn}>
                <Text style={styles.previewNextText}>🎤 Start Conversation</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleStartConversation} style={styles.previewSkip}>
            <Text style={styles.previewSkipText}>Skip Preview</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ============================================================
  // RENDER: Active Conversation
  // ============================================================
  if (currentView === 'active' && selectedScenario) {
    const session = conversationSessionService.getSession();
    const currentStage = conversationSessionService.getCurrentStage();

    return (
      <View style={styles.container}>
        {/* Stage Progress Bar */}
        <View style={styles.stageBar}>
          {selectedScenario.stages.map((stage, idx) => {
            const isActive = idx === (session?.currentStageIndex ?? 0);
            const isComplete = idx < (session?.currentStageIndex ?? 0);
            return (
              <View key={stage.name} style={styles.stageSegment}>
                <View style={[
                  styles.stageDot,
                  isComplete && styles.stageDotComplete,
                  isActive && styles.stageDotActive,
                ]}>
                  <Text style={styles.stageDotText}>
                    {isComplete ? '✓' : idx + 1}
                  </Text>
                </View>
                <Text style={[
                  styles.stageLabel,
                  isActive && styles.stageLabelActive,
                ]}>{stage.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Context Banner */}
        {currentStage && (
          <View style={styles.contextBanner}>
            <Text style={styles.contextText}>{currentStage.description}</Text>
            {currentStage.objectives.length > 0 && (
              <Text style={styles.contextObjective}>
                🎯 {currentStage.objectives[0]}
              </Text>
            )}
          </View>
        )}

        {/* Status Area */}
        <View style={styles.statusArea}>
          <AudioVisualizer level={audioLevel} />
          <Text style={[styles.statusTitle, { color: AppColors.accentCyan }]}>{status}</Text>
          <Text style={styles.statusSubtitle}>Turn {turnCountRef.current}</Text>
        </View>

        {/* Coaching Hint */}
        {coachingHint && (
          <View style={styles.coachingBanner}>
            <Text style={styles.coachingIcon}>💡</Text>
            <Text style={styles.coachingText}>{coachingHint}</Text>
          </View>
        )}

        {/* Conversation Messages */}
        <ScrollView
          ref={scrollRef}
          style={styles.conversationList}
          contentContainerStyle={styles.conversationContent}
        >
          {conversation.map((message, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                message.role === 'user' ? styles.userBubble : styles.assistantBubble,
              ]}
            >
              <Text style={styles.messageText}>{message.text}</Text>
            </View>
          ))}
        </ScrollView>

        {/* End Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleStopConversation}>
            <LinearGradient
              colors={['#EF4444', '#DC2626']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonIcon}>⏹</Text>
              <Text style={styles.buttonText}>End Conversation</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Feedback Overlay */}
        <ConversationFeedbackOverlay
          feedback={currentFeedback}
          visible={showFeedbackOverlay}
          onDismiss={() => setShowFeedbackOverlay(false)}
        />
      </View>
    );
  }

  // ============================================================
  // RENDER: Scenario Selection (Default)
  // ============================================================
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>🌍 Conversation Lab</Text>
        <Text style={styles.subtitle}>
          Practice real conversations with AI in your target language
        </Text>

        {/* Mode Selector */}
        {selectedScenario && (
          <View style={styles.modeSelector}>
            <Text style={styles.modeSelectorLabel}>Conversation Style:</Text>
            <View style={styles.modeButtons}>
              {(['formal', 'casual', 'professional'] as ConversationMode[]).map(mode => (
                <TouchableOpacity
                  key={mode}
                  style={[styles.modeBtn, selectedMode === mode && styles.modeBtnActive]}
                  onPress={() => setSelectedMode(mode)}
                >
                  <Text style={[styles.modeBtnText, selectedMode === mode && styles.modeBtnTextActive]}>
                    {mode === 'formal' ? '🎩' : mode === 'casual' ? '😊' : '💼'}{' '}
                    {mode.charAt(0).toUpperCase() + mode.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Unlocked Scenarios */}
        <Text style={styles.sectionTitle}>Available Scenarios</Text>
        {unlockedScenarios.length === 0 && (
          <Text style={styles.emptyText}>
            Complete lessons to unlock conversation scenarios!
          </Text>
        )}
        {unlockedScenarios.map(scenario => (
          <TouchableOpacity
            key={scenario.id}
            onPress={() => handleSelectScenario(scenario)}
            style={[
              styles.scenarioCard,
              selectedScenario?.id === scenario.id && styles.scenarioCardSelected,
            ]}
            activeOpacity={0.8}
          >
            <View style={styles.scenarioIcon}>
              <Text style={styles.scenarioIconText}>{scenario.icon}</Text>
            </View>
            <View style={styles.scenarioContent}>
              <Text style={styles.scenarioTitle}>{scenario.title}</Text>
              <Text style={styles.scenarioDescription}>{scenario.description}</Text>
              <View style={styles.scenarioMeta}>
                <View style={styles.scenarioBadge}>
                  <Text style={styles.scenarioBadgeText}>{scenario.difficulty}</Text>
                </View>
                <Text style={styles.scenarioTime}>⏱ ~{scenario.estimatedMinutes}min</Text>
                <Text style={styles.scenarioTurns}>💬 {scenario.maxTurns} turns</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Locked Scenarios */}
        {lockedScenarios.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>🔒 Locked</Text>
            {lockedScenarios.map(scenario => (
              <View key={scenario.id} style={[styles.scenarioCard, styles.scenarioCardLocked]}>
                <View style={[styles.scenarioIcon, { opacity: 0.4 }]}>
                  <Text style={styles.scenarioIconText}>{scenario.icon}</Text>
                </View>
                <View style={styles.scenarioContent}>
                  <Text style={[styles.scenarioTitle, { opacity: 0.5 }]}>{scenario.title}</Text>
                  <Text style={[styles.scenarioDescription, { opacity: 0.4 }]}>
                    Complete prerequisite lessons to unlock
                  </Text>
                </View>
                <Text style={styles.lockIcon}>🔒</Text>
              </View>
            ))}
          </>
        )}

        {/* Selected Scenario Detail */}
        {selectedScenario && (
          <View style={styles.detailCard}>
            <Text style={styles.detailTitle}>📍 {selectedScenario.contextDescription}</Text>
            <Text style={styles.detailPersonality}>
              You'll talk with: {selectedScenario.aiPersonality}
            </Text>
            <View style={styles.detailObjectives}>
              <Text style={styles.detailObjectivesLabel}>Objectives:</Text>
              {selectedScenario.objectives.map((obj, i) => (
                <Text key={i} style={styles.detailObjectiveItem}>• {obj}</Text>
              ))}
            </View>
            <View style={styles.detailStages}>
              <Text style={styles.detailStagesLabel}>Conversation Flow:</Text>
              <View style={styles.stageChips}>
                {selectedScenario.stages.map((stage, i) => (
                  <View key={i} style={styles.stageChip}>
                    <Text style={styles.stageChipText}>{stage.label}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Start Button */}
      {selectedScenario && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity onPress={handleStartPreview}>
            <LinearGradient
              colors={[AppColors.accentCyan, '#06B6D4']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
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

// ============================================================
// STYLES
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.primaryDark },
  scrollView: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 100 },

  // Header
  title: { fontSize: 28, fontWeight: '800', color: AppColors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: AppColors.textSecondary, marginBottom: 24 },

  // Mode Selector
  modeSelector: { marginBottom: 20 },
  modeSelectorLabel: { fontSize: 13, fontWeight: '600', color: AppColors.textSecondary, marginBottom: 8 },
  modeButtons: { flexDirection: 'row', gap: 8 },
  modeBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: AppColors.surfaceCard,
    alignItems: 'center', borderWidth: 1, borderColor: AppColors.textMuted + '20',
  },
  modeBtnActive: { backgroundColor: AppColors.accentCyan + '20', borderColor: AppColors.accentCyan },
  modeBtnText: { fontSize: 12, color: AppColors.textSecondary, fontWeight: '600' },
  modeBtnTextActive: { color: AppColors.accentCyan },

  // Section
  sectionTitle: { fontSize: 16, fontWeight: '700', color: AppColors.textPrimary, marginBottom: 12 },
  emptyText: { fontSize: 14, color: AppColors.textMuted, textAlign: 'center', paddingVertical: 20 },

  // Scenario Card
  scenarioCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: AppColors.surfaceCard,
    borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: AppColors.textMuted + '15',
  },
  scenarioCardSelected: { borderColor: AppColors.accentCyan, borderWidth: 2, backgroundColor: AppColors.accentCyan + '10' },
  scenarioCardLocked: { opacity: 0.6 },
  scenarioIcon: {
    width: 56, height: 56, borderRadius: 14, backgroundColor: AppColors.accentCyan + '15',
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  scenarioIconText: { fontSize: 28 },
  scenarioContent: { flex: 1 },
  scenarioTitle: { fontSize: 15, fontWeight: '700', color: AppColors.textPrimary, marginBottom: 3 },
  scenarioDescription: { fontSize: 12, color: AppColors.textSecondary, marginBottom: 6 },
  scenarioMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scenarioBadge: {
    backgroundColor: AppColors.accentCyan + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  scenarioBadgeText: { fontSize: 10, fontWeight: '700', color: AppColors.accentCyan },
  scenarioTime: { fontSize: 11, color: AppColors.textMuted },
  scenarioTurns: { fontSize: 11, color: AppColors.textMuted },
  lockIcon: { fontSize: 18 },

  // Detail Card
  detailCard: {
    marginTop: 20, backgroundColor: AppColors.accentCyan + '10', borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: AppColors.accentCyan + '30',
  },
  detailTitle: { fontSize: 14, color: AppColors.textPrimary, fontStyle: 'italic', marginBottom: 8, lineHeight: 20 },
  detailPersonality: { fontSize: 13, color: AppColors.accentCyan, fontWeight: '600', marginBottom: 10 },
  detailObjectives: { marginBottom: 10 },
  detailObjectivesLabel: { fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 4 },
  detailObjectiveItem: { fontSize: 13, color: AppColors.textPrimary, paddingLeft: 4, marginBottom: 2 },
  detailStages: {},
  detailStagesLabel: { fontSize: 12, fontWeight: '700', color: AppColors.textSecondary, marginBottom: 6 },
  stageChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  stageChip: { backgroundColor: AppColors.surfaceCard, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  stageChipText: { fontSize: 11, color: AppColors.textSecondary, fontWeight: '600' },

  // Active View - Stage Bar
  stageBar: {
    flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12,
    paddingVertical: 12, backgroundColor: AppColors.surfaceCard,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 8 : 52,
  },
  stageSegment: { alignItems: 'center', flex: 1 },
  stageDot: {
    width: 28, height: 28, borderRadius: 14, backgroundColor: AppColors.textMuted + '30',
    justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  stageDotComplete: { backgroundColor: AppColors.accentGreen },
  stageDotActive: { backgroundColor: AppColors.accentCyan, transform: [{ scale: 1.15 }] },
  stageDotText: { fontSize: 11, color: '#FFF', fontWeight: '700' },
  stageLabel: { fontSize: 9, color: AppColors.textMuted, fontWeight: '600' },
  stageLabelActive: { color: AppColors.accentCyan },

  // Context Banner
  contextBanner: {
    marginHorizontal: 12, marginTop: 8, backgroundColor: AppColors.accentCyan + '10',
    borderRadius: 12, padding: 10, borderLeftWidth: 3, borderLeftColor: AppColors.accentCyan,
  },
  contextText: { fontSize: 12, color: AppColors.textSecondary },
  contextObjective: { fontSize: 12, color: AppColors.accentCyan, fontWeight: '600', marginTop: 4 },

  // Status Area
  statusArea: {
    padding: 24, backgroundColor: AppColors.surfaceCard, borderRadius: 20, margin: 12,
    borderWidth: 1, borderColor: AppColors.accentCyan + '40', alignItems: 'center',
    shadowColor: AppColors.accentCyan, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2, shadowRadius: 16, elevation: 6,
  },
  statusTitle: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  statusSubtitle: { fontSize: 13, color: AppColors.textSecondary, marginTop: 2 },

  // Coaching
  coachingBanner: {
    flexDirection: 'row', marginHorizontal: 12, marginTop: 8, backgroundColor: '#F59E0B15',
    borderRadius: 12, padding: 10, alignItems: 'center', gap: 8,
    borderLeftWidth: 3, borderLeftColor: '#F59E0B',
  },
  coachingIcon: { fontSize: 16 },
  coachingText: { flex: 1, fontSize: 13, color: '#F59E0B', fontWeight: '600' },

  // Conversation
  conversationList: { flex: 1 },
  conversationContent: { paddingHorizontal: 12, paddingBottom: 8 },
  messageBubble: { maxWidth: '85%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, marginVertical: 4 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: AppColors.accentCyan + '25', borderBottomRightRadius: 4 },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: AppColors.surfaceCard, borderBottomLeftRadius: 4 },
  messageText: { fontSize: 14, color: AppColors.textPrimary, lineHeight: 20 },

  // Buttons
  buttonContainer: {
    padding: 16, backgroundColor: AppColors.surfaceCard + 'CC',
    borderTopWidth: 1, borderTopColor: AppColors.textMuted + '15',
  },
  button: {
    flexDirection: 'row', height: 56, borderRadius: 28, justifyContent: 'center',
    alignItems: 'center', gap: 10, elevation: 8,
    shadowColor: AppColors.accentCyan, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4, shadowRadius: 20,
  },
  buttonIcon: { fontSize: 22 },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  // Vocab Preview
  previewHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16, paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 56,
  },
  backArrow: { fontSize: 24, color: AppColors.textPrimary },
  previewTitle: { fontSize: 17, fontWeight: '700', color: AppColors.textPrimary },
  previewCounter: { fontSize: 14, color: AppColors.textSecondary, fontWeight: '600' },
  previewCard: {
    flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32,
    margin: 20, backgroundColor: AppColors.surfaceCard, borderRadius: 24,
    borderWidth: 1, borderColor: AppColors.accentCyan + '30',
  },
  previewWord: { fontSize: 36, fontWeight: '800', color: AppColors.textPrimary, marginBottom: 8 },
  previewPhonetic: { fontSize: 16, color: AppColors.accentCyan, fontWeight: '600', marginBottom: 12 },
  previewMeaning: { fontSize: 18, color: AppColors.textSecondary, marginBottom: 20 },
  previewExample: { backgroundColor: AppColors.primaryDark + '80', borderRadius: 12, padding: 14, width: '100%' },
  previewExampleSentence: { fontSize: 14, color: AppColors.textPrimary, marginBottom: 4 },
  previewExampleTranslation: { fontSize: 12, color: AppColors.textMuted, fontStyle: 'italic' },
  previewActions: { padding: 20, gap: 12 },
  previewNextBtn: {
    height: 52, borderRadius: 26, justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: AppColors.accentCyan,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12,
  },
  previewNextText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  previewSkip: { height: 40, justifyContent: 'center', alignItems: 'center' },
  previewSkipText: { fontSize: 14, color: AppColors.textMuted },
});
