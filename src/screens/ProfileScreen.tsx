import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { BottomNav } from '../components/BottomNav';
import { useUserProgress } from '../services/UserProgressService';
import { AppColors } from '../theme';
import achievementsData from '../data/achievements.json';
import { Achievement } from '../types';
import { LANGUAGES } from '../data/languages';

type ProfileScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Profile'>;
};

const achievements = achievementsData as Achievement[];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ navigation }) => {
  const userProgress = useUserProgress();
  const [isLanguageModalVisible, setIsLanguageModalVisible] = useState(false);

  const targetLanguageLabel = LANGUAGES.find(l => l.code === userProgress.targetLanguage)?.label || userProgress.targetLanguage || 'Spanish';

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
              Learning {targetLanguageLabel}
            </Text>

            {/* Level Progress */}
            <View style={styles.levelProgressContainer}>
              <View style={styles.levelHeader}>
                <Text style={styles.levelText}>Level {userProgress.level}</Text>
                <Text style={styles.xpText}>{userProgress.xp} / {userProgress.xp + userProgress.getNextLevelXP()} XP</Text>
              </View>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    { width: `${userProgress.getProgressPercent()}%` }
                  ]}
                />
              </View>
            </View>
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

          {/* Weekly Activity */}
          <Text style={styles.sectionTitle}>Weekly Activity</Text>
          <View style={styles.chartCard}>
            <View style={styles.chartContainer}>
              {userProgress.weeklyXpHistory?.map((val, idx) => {
                const maxVal = Math.max(...(userProgress.weeklyXpHistory || [100]), 100);
                const heightPercent = Math.max((val / maxVal) * 100, 5); // Ensure min height of 5%
                const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                // Determine if it's the current day (mocked as the last element with data or just the 6th index for now)
                const isToday = idx === 6;

                return (
                  <View key={idx} style={styles.chartBarCol}>
                    <Text style={styles.chartBarValue}>{val}</Text>
                    <View style={styles.chartBarBackground}>
                      <View style={[
                        styles.chartBarFill,
                        { height: `${heightPercent}%` },
                        isToday && styles.chartBarFillToday
                      ]} />
                    </View>
                    <Text style={[styles.chartBarLabel, isToday && styles.chartBarLabelToday]}>
                      {days[idx]}
                    </Text>
                  </View>
                );
              })}
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
                      <View style={styles.lockedIconContainer}>
                        <Text style={styles.lockedIcon}>🔒</Text>
                      </View>
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
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setIsLanguageModalVisible(true)}
          >
            <Text style={styles.settingText}>Target Language</Text>
            <Text style={styles.settingValue}>
              {targetLanguageLabel}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={isLanguageModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsLanguageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Target Language</Text>
              <TouchableOpacity onPress={() => setIsLanguageModalVisible(false)}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll}>
              {LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[
                    styles.languageOption,
                    userProgress.targetLanguage === lang.code && styles.languageOptionSelected,
                  ]}
                  onPress={() => {
                    userProgress.setUser({ targetLanguage: lang.code });
                    setIsLanguageModalVisible(false);
                  }}
                >
                  <Text style={styles.languageFlag}>{lang.flag}</Text>
                  <Text style={[
                    styles.languageLabel,
                    userProgress.targetLanguage === lang.code && styles.languageLabelSelected
                  ]}>
                    {lang.label}
                  </Text>
                  {userProgress.targetLanguage === lang.code && (
                    <Text style={styles.languageCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
    color: AppColors.primary,
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
    color: AppColors.primaryMid,
    marginBottom: 4,
  },

  userLanguage: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 20,
  },

  levelProgressContainer: {
    width: '100%',
    paddingHorizontal: 8,
  },

  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  levelText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primaryMid,
  },

  xpText: {
    fontSize: 13,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },

  progressBarBackground: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 5,
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
    color: AppColors.primaryMid,
    marginBottom: 4,
  },

  sectionSubtitle: {
    fontSize: 13,
    color: AppColors.textSecondary,
    marginBottom: 16,
  },

  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 20,
  },

  chartBarCol: {
    alignItems: 'center',
    flex: 1,
  },

  chartBarValue: {
    fontSize: 10,
    color: AppColors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },

  chartBarBackground: {
    width: 12,
    height: 100,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
    justifyContent: 'flex-end',
    marginBottom: 8,
  },

  chartBarFill: {
    width: '100%',
    backgroundColor: '#93C5FD',
    borderRadius: 6,
  },

  chartBarFillToday: {
    backgroundColor: AppColors.primary,
  },

  chartBarLabel: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },

  chartBarLabelToday: {
    color: AppColors.primary,
    fontWeight: '700',
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
    opacity: 0.8,
    backgroundColor: '#F9FAFB',
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
    color: AppColors.primaryMid,
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
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },

  lockedIconContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 36, height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
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
    color: AppColors.primaryMid,
  },

  settingValue: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: AppColors.primaryMid,
  },
  modalCloseText: {
    fontSize: 20,
    color: AppColors.textSecondary,
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  languageOptionSelected: {
    backgroundColor: '#F0F9FF',
  },
  languageFlag: {
    fontSize: 24,
    marginRight: 16,
  },
  languageLabel: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  languageLabelSelected: {
    fontWeight: '600',
    color: AppColors.primary,
  },
  languageCheck: {
    fontSize: 18,
    color: AppColors.primary,
    fontWeight: 'bold',
  },
});
