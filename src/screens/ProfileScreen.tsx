import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { BottomNav } from '../components/BottomNav';
import { useUserProgress } from '../services/UserProgressService';
import { AppColors } from '../theme';
import achievementsData from '../data/achievements.json';
import { Achievement } from '../types';

type ProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
};

const achievements = achievementsData as Achievement[];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const userProgress = useUserProgress();

  const getRarityColor = (rarity: string) => {
    if (rarity === 'legendary') return '#8B5CF6';
    if (rarity === 'epic') return '#EF4444';
    if (rarity === 'rare') return '#3B82F6';
    return '#10B981';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>

      {/* CONTENT */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* User Card */}
          <View style={styles.userCard}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>
                {userProgress.name?.charAt(0).toUpperCase() || '👤'}
              </Text>
            </View>
            <Text style={styles.userName}>
              {userProgress.name || 'Language Learner'}
            </Text>
            <Text style={styles.userLanguage}>
              Learning {userProgress.targetLanguage || 'Spanish'}
            </Text>
          </View>

          {/* Stats Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userProgress.xp}</Text>
              <Text style={styles.statLabel}>Total XP</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userProgress.level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userProgress.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{userProgress.longestStreak}</Text>
              <Text style={styles.statLabel}>Longest Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {userProgress.completedLessons.length}
              </Text>
              <Text style={styles.statLabel}>Lessons Done</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>
                {userProgress.totalMinutesLearned}
              </Text>
              <Text style={styles.statLabel}>Minutes</Text>
            </View>
          </View>

          {/* Achievements */}
          <Text style={styles.sectionTitle}>Achievements</Text>
          <Text style={styles.sectionSubtitle}>
            {userProgress.unlockedAchievements.length} of {achievements.length}{' '}
            unlocked
          </Text>

          <View style={styles.achievementsGrid}>
            {achievements.map((achievement) => {
              const isUnlocked = userProgress.unlockedAchievements.includes(
                achievement.id
              );

              return (
                <View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    !isUnlocked && styles.achievementCardLocked,
                  ]}
                >
                  <View
                    style={[
                      styles.achievementIconContainer,
                      {
                        backgroundColor:
                          getRarityColor(achievement.rarity) + '20',
                      },
                    ]}
                  >
                    <Text style={styles.achievementIcon}>
                      {achievement.icon}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.achievementTitle,
                      !isUnlocked && styles.achievementTitleLocked,
                    ]}
                  >
                    {achievement.title}
                  </Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                  <View
                    style={[
                      styles.rarityBadge,
                      {
                        backgroundColor:
                          getRarityColor(achievement.rarity) + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.rarityText,
                        { color: getRarityColor(achievement.rarity) },
                      ]}
                    >
                      {achievement.rarity}
                    </Text>
                  </View>
                  {!isUnlocked && (
                    <View style={styles.lockedOverlay}>
                      <Text style={styles.lockedIcon}>🔒</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          {/* Settings */}
          <Text style={styles.sectionTitle}>Settings</Text>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Daily Goal</Text>
            <Text style={styles.settingValue}>
              {userProgress.dailyGoalMinutes} min
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingItem}>
            <Text style={styles.settingText}>Target Language</Text>
            <Text style={styles.settingValue}>
              {userProgress.targetLanguage || 'Spanish'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <BottomNav navigation={navigation} active="Profile" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    padding: 20,
    backgroundColor: '#FFF',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.textPrimary,
  },

  content: {
    padding: 20,
  },

  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: AppColors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },

  userLanguage: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },

  statBox: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.primary,
    marginBottom: 4,
  },

  statLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    textAlign: 'center',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 16,
  },

  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },

  achievementCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    position: 'relative',
  },

  achievementCardLocked: {
    opacity: 0.5,
  },

  achievementIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },

  achievementIcon: {
    fontSize: 24,
  },

  achievementTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },

  achievementTitleLocked: {
    color: AppColors.textSecondary,
  },

  achievementDescription: {
    fontSize: 11,
    color: AppColors.textSecondary,
    marginBottom: 8,
  },

  rarityBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },

  rarityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'capitalize',
  },

  lockedOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },

  lockedIcon: {
    fontSize: 16,
  },

  settingItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  settingText: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },

  settingValue: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
});
