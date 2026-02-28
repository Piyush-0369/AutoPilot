import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { BottomNav } from '../components/BottomNav';
import { LevelCard } from '../components/LevelCard';
import { ExerciseCard } from '../components/ExerciseCard';
import { AIRecommendationCard } from '../components/AIRecommendationCard';
import { AILearningBuddyCard } from '../components/AILearningBuddyCard';
import { DailyExerciseType } from '../components/ExerciseModal';
import { useUserProgress } from '../services/UserProgressService';
import { AppColors } from '../theme';

type HomeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Home'>;
};

const DAILY_EXERCISES = [
  { type: 'typing' as DailyExerciseType, icon: '🔥', label: 'Typing', xp: 25 },
  { type: 'tts' as DailyExerciseType, icon: '🗣️', label: 'Speaking', xp: 25 },
  { type: 'stt' as DailyExerciseType, icon: '🎤', label: 'Listening', xp: 25 },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const userProgress = useUserProgress();

  useEffect(() => {
    userProgress.updateStreakStatus();
  }, [userProgress]);

  const handleExercisePress = (type: DailyExerciseType) => {
    navigation.navigate('Practice', { startExerciseType: type });
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

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back</Text>
          <Text style={styles.userName}>
            {userProgress.name || 'Language Learner'}
          </Text>
        </View>

        <AIRecommendationCard
          title="AI Recommendation"
          subtitle={`Practice ${userProgress.targetLanguage || 'English'} to unlock the next skill level.`}
        />

        <View style={{ marginTop: 20 }}>
          <LevelCard
            level={userProgress.level}
            currentXP={currentXPInLevel}
            maxXP={100}
            skillsUnlocked={unlockedSkills}
            totalSkills={totalSkills}
          />
        </View>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinueLearning}
        >
          <Text style={styles.continueButtonText}>Continue Learning</Text>
        </TouchableOpacity>

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
          </View>
        </View>

        <View style={styles.aiLearningBuddySection}>
          <AILearningBuddyCard
            suggestion={`Let's practice ${(userProgress.targetLanguage || 'English').toLowerCase()} together!`}
            onPress={handleAIBuddyPress}
          />
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

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
  userName: { fontSize: 28, fontWeight: '700', color: AppColors.primary },

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
    color: AppColors.primaryDark,
    marginBottom: 12,
  },

  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 12,
  },

  aiLearningBuddySection: { paddingHorizontal: 20 },

  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 16,
    alignItems: 'center',
    elevation: 5,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primary,
  },
});
