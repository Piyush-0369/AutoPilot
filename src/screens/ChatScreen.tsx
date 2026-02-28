import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RunAnywhere } from '@runanywhere/core';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppColors } from '../theme';
import { useModelService } from '../services/ModelService';
import { useUserProgress } from '../services/UserProgressService';
import { ChatMessageBubble, ChatMessage, ModelLoaderWidget } from '../components';
import { RootStackParamList } from '../navigation/types';

type ChatScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Chat'>;
};

export const ChatScreen: React.FC<ChatScreenProps> = ({ navigation }) => {
  const modelService = useModelService();
  const { targetLanguage } = useUserProgress();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const streamCancelRef = useRef<(() => void) | null>(null);
  const responseRef = useRef(''); // Track response for closure

  useEffect(() => {
    // Scroll to bottom when messages change
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, currentResponse]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isGenerating) return;

    // Add user message
    const userMessage: ChatMessage = {
      text,
      isUser: true,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsGenerating(true);
    setCurrentResponse('');

    try {
      // Per docs: https://docs.runanywhere.ai/react-native/quick-start#6-stream-responses
      const streamResult = await RunAnywhere.generateStream(text, {
        maxTokens: 256, // Optimized for faster mobile generation speed
        temperature: 0.6, // Lowered for more concise/direct language replies
      });

      streamCancelRef.current = streamResult.cancel;
      responseRef.current = '';

      // Stream tokens as they arrive
      for await (const token of streamResult.stream) {
        responseRef.current += token;
        // Filter out <think> blocks (reasoning models) so user only sees final answer
        const cleanText = responseRef.current
          .replace(/<think>[\s\S]*?<\/think>/g, '') // Remove completed think blocks
          .replace(/<think>[\s\S]*/g, '') // Hide incomplete think blocks
          .trimStart(); // ongoing stream clean
        setCurrentResponse(cleanText);
      }

      // Get final metrics
      await streamResult.result;

      const cleanFinalText = responseRef.current
        .replace(/<think>[\s\S]*?<\/think>/g, '')
        .trim();

      // Add assistant message (use ref to get final text due to closure)
      const assistantMessage: ChatMessage = {
        text: cleanFinalText,
        isUser: false,
        timestamp: new Date(),
        tokensPerSecond: undefined,
        totalTokens: undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setCurrentResponse('');
      responseRef.current = '';
      setIsGenerating(false);
    } catch (error) {
      const errorMessage: ChatMessage = {
        text: `Error: ${error}`,
        isUser: false,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
      setCurrentResponse('');
      setIsGenerating(false);
    }
  };

  const handleStop = () => {
    if (streamCancelRef.current) {
      streamCancelRef.current();
      if (responseRef.current) {
        const message: ChatMessage = {
          text: responseRef.current,
          isUser: false,
          timestamp: new Date(),
          wasCancelled: true,
        };
        setMessages((prev) => [...prev, message]);
      }
      setCurrentResponse('');
      responseRef.current = '';
      setIsGenerating(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const renderSuggestionChip = (text: string) => (
    <TouchableOpacity
      key={text}
      style={styles.suggestionChip}
      onPress={() => {
        setInputText(text);
        // handleSend(); // Better to let user review before sending
      }}
    >
      <Text style={styles.suggestionText}>{text}</Text>
    </TouchableOpacity>
  );

  if (!modelService.isLLMLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI Tutor</Text>
        </View>
        <ModelLoaderWidget
          title="AI Tutor Core Required"
          subtitle="Download the AI learning brain to start chatting"
          icon="chat"
          accentColor={AppColors.primary}
          isDownloading={modelService.isLLMDownloading}
          isLoading={modelService.isLLMLoading}
          modelId="llm"
          onLoad={modelService.downloadAndLoadLLM}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>AI Tutor</Text>
          <View style={styles.onlineBadge}>
            <View style={styles.onlineDot} />
            <Text style={styles.onlineText}>Online</Text>
          </View>
        </View>
        <TouchableOpacity onPress={handleClearChat} style={styles.clearButton}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
      </View>

      {messages.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Text style={styles.emptyIcon}>🎓</Text>
          </View>
          <Text style={styles.emptyTitle}>
            {targetLanguage ? `Practice ${targetLanguage}` : 'Language Tutor'}
          </Text>
          <Text style={styles.emptySubtitle}>
            I'm here to help you learn! Ask me anything or try one of these:
          </Text>
          <View style={styles.suggestionsContainer}>
            {renderSuggestionChip(`How do you say "Hello" in ${targetLanguage || 'Spanish'}?`)}
            {renderSuggestionChip('Teach me 3 useful travel phrases')}
            {renderSuggestionChip(`Correct my grammar: "Me gusta el gato"`)}
            {renderSuggestionChip('Explain the difference between Ser and Estar')}
          </View>
        </View>
      ) : (
        <FlatList
          style={styles.messageListContainer}
          ref={flatListRef}
          data={[
            ...messages,
            ...(isGenerating
              ? [{ text: currentResponse || '...', isUser: false, timestamp: new Date() }]
              : []),
          ]}
          renderItem={({ item, index }) => (
            <ChatMessageBubble
              message={item as ChatMessage}
              isStreaming={isGenerating && index === messages.length}
            />
          )}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor="#9CA3AF"
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            editable={!isGenerating}
            multiline
          />
          {isGenerating ? (
            <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
              <View style={styles.stopIcon}>
                <Text style={styles.stopIconText}>⏹</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={handleSend} disabled={!inputText.trim()}>
              <LinearGradient
                colors={inputText.trim() ? [AppColors.primary, '#4B7BFF'] : ['#E5E7EB', '#E5E7EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.sendButton}
              >
                <Text style={styles.sendIcon}>📤</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, backgroundColor: '#F5F7FA' },
  messageListContainer: { flex: 1 },
  stopIconText: { color: '#DC2626', fontSize: 16 },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 50,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
  },
  backButtonText: {
    fontSize: 20,
    color: '#374151',
    fontWeight: '600',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineText: {
    fontSize: 11,
    color: '#6B7280',
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  messageList: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#EFF6FF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyIcon: {
    fontSize: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  suggestionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  suggestionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  suggestionText: {
    fontSize: 13,
    color: '#374151',
  },
  inputContainer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: AppColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  sendIcon: {
    fontSize: 20,
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  stopIcon: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
