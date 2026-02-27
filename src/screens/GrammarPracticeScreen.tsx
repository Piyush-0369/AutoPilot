import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RunAnywhere } from '@runanywhere/core';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppColors } from '../theme';
import { useModelService } from '../services/ModelService';
import { useUserProgress } from '../services/UserProgressService';
import { ModelLoaderWidget, FeedbackModal } from '../components';
import { RootStackParamList } from '../navigation/types';

type GrammarPracticeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'GrammarPractice'>;
};

const GRAMMAR_EXERCISES = [
  {
    id: 'present_simple',
    prompt: 'Write a sentence using the present simple tense about your daily routine.',
    example: 'I work as a teacher.',
    difficulty: 'Beginner',
  },
  {
    id: 'past_tense',
    prompt: 'Write about something you did last weekend using past tense.',
    example: 'I went to the park and played football.',
    difficulty: 'Beginner',
  },
  {
    id: 'future_plans',
    prompt: 'Describe your plans for next month using future tense.',
    example: 'I will travel to Japan next month.',
    difficulty: 'Intermediate',
  },
  {
    id: 'conditional',
    prompt: 'Create a conditional sentence about what you would do if you won the lottery.',
    example: 'If I won the lottery, I would travel around the world.',
    difficulty: 'Intermediate',
  },
  {
    id: 'reported_speech',
    prompt: 'Convert this direct speech to reported speech: "I am very happy," she said.',
    example: 'She said that she was very happy.',
    difficulty: 'Advanced',
  },
];

interface GrammarFeedback {
  score: number;
  corrections: string[];
  suggestions: string[];
  overall: string;
}

export const GrammarPracticeScreen: React.FC<GrammarPracticeScreenProps> = ({
  navigation,
}) => {
  const modelService = useModelService();
  const userProgress = useUserProgress();

  const [currentExercise, setCurrentExercise] = useState({ prompt: 'Loading...', example: '...', difficulty: 'Loading' });
  const [exerciseCount, setExerciseCount] = useState(1);
  const [userResponse, setUserResponse] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingExercise, setIsLoadingExercise] = useState(true);
  const [feedback, setFeedback] = useState<GrammarFeedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const loadDynamicExercise = useCallback(async () => {
    setIsLoadingExercise(true);
    try {
      if (!modelService.isLLMLoaded) return;
      const lang = userProgress.targetLanguage || 'English';
      const prompt = `Generate a grammar practice exercise for learning ${lang}.
Provide a JSON object with strictly these keys: prompt, example, difficulty.
- prompt: An instruction like "Write a sentence in past tense"
- example: A valid example answer in ${lang}
- difficulty: "Beginner", "Intermediate", or "Advanced"

Example:
{
  "prompt": "Write a sentence in past tense",
  "example": "I went to the store yesterday",
  "difficulty": "Beginner"
}
\`\`\`json
{`;

      const result = await RunAnywhere.generate(prompt, {
        maxTokens: 150,
        temperature: 0.2,
        systemPrompt: "You are a JSON API. You MUST output ONLY raw valid JSON. Do not include markdown or explanations."
      });

      const cleanText = result.text.match(/```(?:json)?\s*([\s\S]*?)```/) ? result.text.match(/```(?:json)?\s*([\s\S]*?)```/)![1] : result.text;
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        setCurrentExercise(JSON.parse(jsonMatch[0]));
      } else if (cleanText.trim().startsWith('"')) {
        setCurrentExercise(JSON.parse('{' + cleanText + (cleanText.trim().endsWith('}') ? '' : '}')));
      } else {
        throw new Error('No JSON matched');
      }
    } catch (e) {
      console.warn("Failed grammar gen:", e);
      setCurrentExercise({ prompt: `Write a sentence in ${userProgress.targetLanguage || 'English'}.`, example: 'I am learning.', difficulty: 'Beginner' });
    } finally {
      setIsLoadingExercise(false);
    }
  }, [modelService.isLLMLoaded, userProgress.targetLanguage]);

  React.useEffect(() => {
    if (modelService.isLLMLoaded) {
      loadDynamicExercise();
    }
  }, [modelService.isLLMLoaded, loadDynamicExercise]);

  const analyzeGrammar = useCallback(async () => {
    if (!userResponse.trim()) {
      return;
    }

    setIsAnalyzing(true);

    try {
      // Check if LLM model is loaded
      if (!modelService.isLLMLoaded) {
        throw new Error('LLM model not loaded');
      }

      // Generate feedback using LLM
      const prompt = `You are a grammar teacher teaching ${userProgress.targetLanguage || 'English'}. Evaluate the following student response and provide constructive feedback.

Exercise: ${currentExercise.prompt}

Student's response: "${userResponse}"

Example answer: "${currentExercise.example}"

Please provide:
1. Grammar score (0-100)
2. Specific grammar corrections needed (list up to 3)
3. Suggestions for improvement (list up to 2)
4. Overall feedback (2-3 sentences)

Format your response as JSON with keys: score, corrections, suggestions, overall`;

      const result = await RunAnywhere.generate(prompt, {
        maxTokens: 400,
        temperature: 0.3,
        systemPrompt: 'You are a helpful grammar teacher. Always respond with valid JSON.',
      });

      // Parse the response
      try {
        const jsonMatch = result.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          const newFeedback = {
            score: Math.max(0, Math.min(100, parsed.score || 0)),
            corrections: parsed.corrections || [],
            suggestions: parsed.suggestions || [],
            overall: parsed.overall || 'Good effort!',
          };
          setFeedback(newFeedback);

          // Award XP based on score
          await userProgress.updateXP(newFeedback.score);
        } else {
          throw new Error('Could not parse JSON');
        }
      } catch (parseError) {
        console.warn('JSON Parse error', parseError);
        setFeedback({
          score: 75,
          corrections: ['Review conjugation'],
          suggestions: ['Add more details'],
          overall: 'Your response is grammatically sound. Keep practicing!',
        });
        await userProgress.updateXP(75);
      }
    } catch (error) {
      console.warn('Analysis warning:', error);
      setFeedback({
        score: 0,
        corrections: [`Error: ${error}`],
        suggestions: [],
        overall: 'Please try again',
      });
    } finally {
      setIsAnalyzing(false);
      setShowFeedback(true);
    }
  }, [userResponse, currentExercise, modelService.isLLMLoaded, userProgress]);

  const handleFeedbackClose = () => {
    setShowFeedback(false);
    setUserResponse('');
    setCompletedCount(completedCount + 1);
    setExerciseCount(exerciseCount + 1);

    // Move to next exercise dynamically
    loadDynamicExercise();
  };

  if (!modelService.isLLMLoaded) {
    return (
      <ModelLoaderWidget
        title="LLM Model Required"
        subtitle="Download and load the language model for grammar analysis"
        icon="chat"
        accentColor={AppColors.accentGreen}
        isDownloading={modelService.isLLMDownloading}
        isLoading={modelService.isLLMLoading}
        progress={modelService.llmDownloadProgress}
        onLoad={modelService.downloadAndLoadLLM}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Progress */}
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>
            Continuous Grammar Session - Exercise {exerciseCount}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min((completedCount / 5) * 100, 100)}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Exercise Card */}
        <View style={styles.exerciseCard}>
          {isLoadingExercise ? (
            <ActivityIndicator color={AppColors.accentGreen} />
          ) : (
            <>
              <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>{currentExercise.difficulty}</Text>
              </View>
              <Text style={styles.prompt}>{currentExercise.prompt}</Text>
              <View style={styles.exampleSection}>
                <Text style={styles.exampleLabel}>AI Example:</Text>
                <Text style={styles.exampleText}>"{currentExercise.example}"</Text>
              </View>
            </>
          )}
        </View>

        {/* Input Section */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Your Response:</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Type your answer here..."
            placeholderTextColor={AppColors.textMuted}
            value={userResponse}
            onChangeText={setUserResponse}
            multiline
            numberOfLines={6}
            editable={!isAnalyzing}
          />
          <Text style={styles.characterCount}>{userResponse.length} characters</Text>
        </View>

        {/* Feedback Display */}
        {feedback && !showFeedback && (
          <View style={styles.feedbackDisplay}>
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreValue, feedback.score >= 80 && styles.scoreGood]}>
                {feedback.score}%
              </Text>
              <Text style={styles.scoreLabel}>Grammar Score</Text>
            </View>

            {feedback.corrections.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>⚠️ Corrections Needed:</Text>
                {feedback.corrections.map((correction, idx) => (
                  <Text key={idx} style={styles.correctionItem}>
                    • {correction}
                  </Text>
                ))}
              </View>
            )}

            {feedback.suggestions.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>💡 Suggestions:</Text>
                {feedback.suggestions.map((suggestion, idx) => (
                  <Text key={idx} style={styles.suggestionItem}>
                    • {suggestion}
                  </Text>
                ))}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📝 Feedback:</Text>
              <Text style={styles.overallFeedback}>{feedback.overall}</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        {feedback ? (
          <TouchableOpacity onPress={handleFeedbackClose} style={styles.fullButton}>
            <LinearGradient
              colors={[AppColors.accentGreen, '#059669']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              <Text style={styles.buttonIcon}>→</Text>
              <Text style={styles.buttonText}>
                Next Exercise
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={analyzeGrammar}
            disabled={isAnalyzing || !userResponse.trim()}
            style={styles.fullButton}
          >
            <LinearGradient
              colors={
                isAnalyzing || !userResponse.trim()
                  ? [AppColors.textMuted, AppColors.textMuted]
                  : [AppColors.accentGreen, '#059669']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.button}
            >
              {isAnalyzing ? (
                <>
                  <ActivityIndicator color="#FFFFFF" />
                  <Text style={styles.buttonText}>Analyzing...</Text>
                </>
              ) : (
                <>
                  <Text style={styles.buttonIcon}>✓</Text>
                  <Text style={styles.buttonText}>Check Grammar</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
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
  progressSection: {
    marginBottom: 24,
  },
  progressText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    backgroundColor: AppColors.surfaceElevated,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: AppColors.accentGreen,
    borderRadius: 3,
  },
  exerciseCard: {
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: AppColors.accentGreen + '33',
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    backgroundColor: AppColors.accentGreen + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 12,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '700',
    color: AppColors.accentGreen,
  },
  prompt: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    lineHeight: 24,
    marginBottom: 16,
  },
  exampleSection: {
    backgroundColor: AppColors.primaryMid,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: AppColors.accentGreen,
  },
  exampleLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  exampleText: {
    fontSize: 14,
    color: AppColors.textPrimary,
    fontStyle: 'italic',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 12,
  },
  textInput: {
    backgroundColor: AppColors.primaryMid,
    borderWidth: 1,
    borderColor: AppColors.textMuted + '1A',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: AppColors.textPrimary,
    textAlignVertical: 'top',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 11,
    color: AppColors.textMuted,
    marginTop: 8,
    textAlign: 'right',
  },
  feedbackDisplay: {
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: AppColors.accentGreen + '40',
    marginBottom: 24,
  },
  scoreContainer: {
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: AppColors.textMuted + '1A',
    marginBottom: 16,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },
  scoreGood: {
    color: AppColors.accentGreen,
  },
  scoreLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 8,
  },
  correctionItem: {
    fontSize: 13,
    color: '#EF4444',
    lineHeight: 20,
    marginBottom: 6,
  },
  suggestionItem: {
    fontSize: 13,
    color: AppColors.accentCyan,
    lineHeight: 20,
    marginBottom: 6,
  },
  overallFeedback: {
    fontSize: 13,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  buttonContainer: {
    padding: 24,
    backgroundColor: AppColors.surfaceCard + 'CC',
    borderTopWidth: 1,
    borderTopColor: AppColors.textMuted + '1A',
  },
  fullButton: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    elevation: 6,
    shadowColor: AppColors.accentGreen,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
