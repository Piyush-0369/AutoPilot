import React, { useState } from 'react';
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
import { useUserProgress } from '../services/UserProgressService';
import { AppColors } from '../theme';
import lessonsData from '../data/lessons.json';
import { Lesson } from '../types';

type PracticeScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Practice'>;
};

const lessons = lessonsData as Lesson[];

export const PracticeScreen: React.FC<PracticeScreenProps> = ({ navigation }) => {
  const userProgress = useUserProgress();

  const handleLessonPress = (lesson: Lesson) => {
    // Navigate to PracticeSession screen (to be created in Phase 4)
    // navigation.navigate('PracticeSession', { lessonId: lesson.id });
    console.log('Starting lesson:', lesson.title);
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty === 1) return '#10B981';
    if (difficulty === 2) return '#3B82F6';
    if (difficulty === 3) return '#F59E0B';
    if (difficulty === 4) return '#EF4444';
    return '#8B5CF6';
  };

  const getDifficultyLabel = (difficulty: number) => {
    const labels = ['', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];
    return labels[difficulty] || 'Unknown';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Practice</Text>
        <View style={styles.headerRight}>
          <View style={styles.statContainer}>
            <Text>⚡</Text>
            <Text style={styles.statText}>{userProgress.xp}</Text>
          </View>
        </View>
      </View>

      {/* CONTENT */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Available Lessons</Text>
          <Text style={styles.sectionSubtitle}>
            Choose a lesson to start practicing
          </Text>

          {lessons.map((lesson) => {
            const isCompleted = userProgress.completedLessons.includes(lesson.id);
            const isLocked = lesson.prerequisites.some(
              (prereq) => !userProgress.completedLessons.includes(prereq)
            );

            return (
              <TouchableOpacity
                key={lesson.id}
                style={[
                  styles.lessonCard,
                  isLocked && styles.lessonCardLocked,
                ]}
                onPress={() => !isLocked && handleLessonPress(lesson)}
                disabled={isLocked}
              >
                <View style={styles.lessonHeader}>
                  <View style={styles.lessonIconContainer}>
                    <Text style={styles.lessonIcon}>
                      {isCompleted ? '✅' : isLocked ? '🔒' : '📚'}
                    </Text>
                  </View>
                  <View style={styles.lessonInfo}>
                    <Text
                      style={[
                        styles.lessonTitle,
                        isLocked && styles.lessonTitleLocked,
                      ]}
                    >
                      {lesson.title}
                    </Text>
                    <Text style={styles.lessonDescription}>
                      {lesson.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.lessonMeta}>
                  <View
                    style={[
                      styles.difficultyBadge,
                      {
                        backgroundColor:
                          getDifficultyColor(lesson.difficulty) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.difficultyText,
                        { color: getDifficultyColor(lesson.difficulty) },
                      ]}
                    >
                      {getDifficultyLabel(lesson.difficulty)}
                    </Text>
                  </View>

                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>
                      ⏱️ {lesson.estimatedMinutes} min
                    </Text>
                    <Text style={styles.metaText}>
                      📝 {lesson.exercises.length} exercises
                    </Text>
                  </View>
                </View>

                {lesson.learningObjectives.length > 0 && (
                  <View style={styles.objectivesContainer}>
                    <Text style={styles.objectivesTitle}>
                      You'll learn:
                    </Text>
                    {lesson.learningObjectives.slice(0, 2).map((obj, idx) => (
                      <Text key={idx} style={styles.objectiveText}>
                        • {obj}
                      </Text>
                    ))}
                  </View>
                )}

                {isLocked && (
                  <View style={styles.lockedOverlay}>
                    <Text style={styles.lockedText}>
                      Complete previous lessons to unlock
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <BottomNav navigation={navigation} active="Practice" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFF',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },

  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  statText: { fontWeight: '600', marginLeft: 4 },

  content: {
    padding: 20,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 20,
  },

  lessonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  lessonCardLocked: {
    opacity: 0.6,
  },

  lessonHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  lessonIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  lessonIcon: {
    fontSize: 24,
  },

  lessonInfo: {
    flex: 1,
  },

  lessonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },

  lessonTitleLocked: {
    color: AppColors.textSecondary,
  },

  lessonDescription: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },

  lessonMeta: {
    marginBottom: 12,
  },

  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 8,
  },

  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },

  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },

  metaText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },

  objectivesContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },

  objectivesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 6,
  },

  objectiveText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 2,
  },

  lockedOverlay: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
  },

  lockedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    textAlign: 'center',
  },
});