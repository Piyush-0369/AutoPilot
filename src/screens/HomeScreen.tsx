import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { BottomNav } from '../components/BottomNav';
import { LevelCard } from '../components/LevelCard';
import { ExerciseCard } from '../components/ExerciseCard';
import { AIRecommendationCard } from '../components/AIRecommendationCard';
import { AILearningBuddyCard } from '../components/AILearningBuddyCard';
import { ExerciseModal, DailyExerciseType } from '../components/ExerciseModal';
import { useUserProgress } from '../services/UserProgressService';
import { calculateXP } from '../lib/engines/xpEngine';
import { AppColors } from '../theme';
import lessonsData from '../data/lessons.json';

type HomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

const DAILY_EXERCISES = [
  { type: 'typing' as DailyExerciseType, icon: '🔥', label: 'Typing', xp: 25 },
  { type: 'tts' as DailyExerciseType, icon: '🗣️', label: 'Text-to-Speech', xp: 25 },
  { type: 'stt' as DailyExerciseType, icon: '🎤', label: 'Speech-to-Text', xp: 25 },
  { type: 'written' as DailyExerciseType, icon: '🔤', label: 'Written Practice', xp: 25 },
];

const MOCK_EXERCISES: Record<DailyExerciseType, { question: string; answer: string; type: string; hint?: string }> = {
  typing: {
    question: 'Translate to Spanish: Hello',
    answer: 'Hola',
    type: 'Translation',
    hint: "It starts with 'H'",
  },
  tts: {
    question: 'Say in Spanish: Good morning',
    answer: 'Buenos días',
    type: 'Speaking',
  },
  stt: {
    question: 'Listen and type what you hear',
    answer: 'Gracias',
    type: 'Listening',
  },
  written: {
    question: 'Write in Spanish: Thank you',
    answer: 'Gracias',
    type: 'Writing',
  },
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const userProgress = useUserProgress();
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [currentExerciseType, setCurrentExerciseType] = useState<DailyExerciseType>('typing');

  useEffect(() => {
    // Update streak on app open
    userProgress.updateStreakStatus();
  }, []);

  const handleExercisePress = (type: DailyExerciseType) => {
    setCurrentExerciseType(type);
    setExerciseModalOpen(true);
  };

  const handleExerciseSubmit = async (answer: string, isCorrect: boolean, timeSpent: number) => {
    if (isCorrect) {
      const xpResult = calculateXP({
        difficulty: 1,
        isCorrect: true,
        timeSpentMs: timeSpent,
        currentStreak: userProgress.streak,
      });
      await userProgress.updateXP(xpResult.totalXP);
    }
    setExerciseModalOpen(false);
  };

  const handleContinueLearning = () => {
    navigation.navigate('Practice');
  };

  const handleAIBuddyPress = () => {
    navigation.navigate('Chat');
  };

  const nextLevelXP = userProgress.getNextLevelXP();
  const currentXPInLevel = userProgress.xp % 100;
  const totalSkills = 5;
  const unlockedSkills = Object.values(userProgress.skillTreeProgress).filter(
    (status) => status === 'mastered' || status === 'in-progress'
  ).length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.blueDot} />

        <View style={styles.headerRight}>
          <View style={styles.statContainer}>
            <Text>⚡</Text>
            <Text style={styles.statText}>{userProgress.xp}</Text>
          </View>

          <View style={styles.statContainer}>
            <Text>🔥</Text>
            <Text style={styles.statText}>{userProgress.streak}</Text>
          </View>

          <Text style={styles.bell}>🔔</Text>
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Welcome */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.userName}>
            {userProgress.name || 'Language Learner'}
          </Text>
        </View>

        {/* AI Recommendation */}
        <AIRecommendationCard
          title="AI Recommendation"
          subtitle="Practice Greetings to unlock the next skill level."
        />

        {/* Level Card */}
        <View style={{ marginTop: 20 }}>
          <LevelCard
            level={userProgress.level}
            currentXP={currentXPInLevel}
            maxXP={100}
            skillsUnlocked={unlockedSkills}
            totalSkills={totalSkills}
          />
        </View>

        {/* Continue Learning Button */}
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinueLearning}
        >
          <Text style={styles.continueButtonText}>Continue Learning</Text>
        </TouchableOpacity>

        {/* Daily Exercises */}
        <View style={styles.dailyExercisesSection}>
          <Text style={styles.dailyExercisesTitle}>Daily Exercises</Text>

          <View style={styles.exerciseRow}>
            <ExerciseCard
              icon={DAILY_EXERCISES[0].icon}
              label={DAILY_EXERCISES[0].label}
              xp={DAILY_EXERCISES[0].xp}
              onPress={() => handleExercisePress(DAILY_EXERCISES[0].type)}
            />
            <ExerciseCard
              icon={DAILY_EXERCISES[1].icon}
              label={DAILY_EXERCISES[1].label}
              xp={DAILY_EXERCISES[1].xp}
              onPress={() => handleExercisePress(DAILY_EXERCISES[1].type)}
            />
          </View>

          <View style={styles.exerciseRow}>
            <ExerciseCard
              icon={DAILY_EXERCISES[2].icon}
              label={DAILY_EXERCISES[2].label}
              xp={DAILY_EXERCISES[2].xp}
              onPress={() => handleExercisePress(DAILY_EXERCISES[2].type)}
            />
            <ExerciseCard
              icon={DAILY_EXERCISES[3].icon}
              label={DAILY_EXERCISES[3].label}
              xp={DAILY_EXERCISES[3].xp}
              onPress={() => handleExercisePress(DAILY_EXERCISES[3].type)}
            />
          </View>
        </View>

        {/* AI Learning Buddy */}
        <View style={styles.aiLearningBuddySection}>
          <AILearningBuddyCard
            suggestion="Let's practice airport conversations!"
            onPress={handleAIBuddyPress}
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Exercise Modal */}
      <ExerciseModal
        isOpen={exerciseModalOpen}
        onClose={() => setExerciseModalOpen(false)}
        exerciseType={currentExerciseType}
        exercise={MOCK_EXERCISES[currentExerciseType]}
        onSubmit={handleExerciseSubmit}
      />

      {/* BOTTOM NAV */}
      <BottomNav navigation={navigation} active="Home" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: '#FFF',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  blueDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: AppColors.primary,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },

  statText: { fontWeight: '600', marginLeft: 4 },
  bell: { fontSize: 18 },

  welcomeSection: { padding: 20 },
  welcomeText: { color: AppColors.textSecondary },
  userName: { fontSize: 28, fontWeight: '700', color: AppColors.textPrimary },

  continueButton: {
    backgroundColor: AppColors.primary,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 16,
    borderRadius: 28,
    alignItems: 'center',
  },

  continueButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 16,
  },

  dailyExercisesSection: { padding: 20 },
  dailyExercisesTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 12,
  },

  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },

  aiLearningBuddySection: { paddingHorizontal: 20 },
});
