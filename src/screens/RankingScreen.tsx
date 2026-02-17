import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { BottomNav } from '../components/BottomNav';
import { useUserProgress } from '../services/UserProgressService';
import { AppColors } from '../theme';
import { LeaderboardEntry } from '../types';

type RankingScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Ranking'>;
};

// Mock leaderboard data
const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, userId: '1', name: 'Maria Garcia', xp: 5420, level: 54, streak: 127 },
  { rank: 2, userId: '2', name: 'John Smith', xp: 4890, level: 48, streak: 89 },
  { rank: 3, userId: '3', name: 'Sophie Chen', xp: 4320, level: 43, streak: 76 },
  { rank: 4, userId: '4', name: 'Ahmed Hassan', xp: 3850, level: 38, streak: 65 },
  { rank: 5, userId: '5', name: 'Emma Wilson', xp: 3420, level: 34, streak: 54 },
];

export const RankingScreen: React.FC<RankingScreenProps> = ({ navigation }) => {
  const userProgress = useUserProgress();

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return AppColors.textSecondary;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>

      {/* CONTENT */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* User Rank Card */}
          <View style={styles.userRankCard}>
            <View style={styles.userRankHeader}>
              <Text style={styles.userRankTitle}>Your Rank</Text>
              <View style={styles.userRankBadge}>
                <Text style={styles.userRankText}>#42</Text>
              </View>
            </View>
            <View style={styles.userRankStats}>
              <View style={styles.userRankStat}>
                <Text style={styles.userRankStatValue}>{userProgress.xp}</Text>
                <Text style={styles.userRankStatLabel}>XP</Text>
              </View>
              <View style={styles.userRankStat}>
                <Text style={styles.userRankStatValue}>{userProgress.level}</Text>
                <Text style={styles.userRankStatLabel}>Level</Text>
              </View>
              <View style={styles.userRankStat}>
                <Text style={styles.userRankStatValue}>{userProgress.streak}</Text>
                <Text style={styles.userRankStatLabel}>Streak</Text>
              </View>
            </View>
          </View>

          {/* Leaderboard */}
          <Text style={styles.sectionTitle}>Top Learners</Text>

          {MOCK_LEADERBOARD.map((entry) => (
            <View key={entry.userId} style={styles.leaderboardItem}>
              <View style={styles.rankContainer}>
                <Text
                  style={[
                    styles.rankText,
                    { color: getRankColor(entry.rank) },
                  ]}
                >
                  {getRankIcon(entry.rank)}
                </Text>
              </View>

              <View style={styles.userInfo}>
                <View style={styles.avatarSmall}>
                  <Text style={styles.avatarSmallText}>
                    {entry.name.charAt(0)}
                  </Text>
                </View>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>{entry.name}</Text>
                  <View style={styles.userStats}>
                    <Text style={styles.userStat}>⚡ {entry.xp} XP</Text>
                    <Text style={styles.userStat}>🔥 {entry.streak} days</Text>
                  </View>
                </View>
              </View>

              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>Lv {entry.level}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <BottomNav navigation={navigation} active="Ranking" />
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

  userRankCard: {
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

  userRankHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  userRankTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },

  userRankBadge: {
    backgroundColor: AppColors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },

  userRankText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primary,
  },

  userRankStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  userRankStat: {
    alignItems: 'center',
  },

  userRankStatValue: {
    fontSize: 24,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },

  userRankStatLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.textPrimary,
    marginBottom: 16,
  },

  leaderboardItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  rankContainer: {
    width: 40,
    alignItems: 'center',
  },

  rankText: {
    fontSize: 20,
    fontWeight: '700',
  },

  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: AppColors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  avatarSmallText: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.primary,
  },

  userDetails: {
    flex: 1,
  },

  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },

  userStats: {
    flexDirection: 'row',
    gap: 12,
  },

  userStat: {
    fontSize: 11,
    color: AppColors.textSecondary,
  },

  levelBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },

  levelText: {
    fontSize: 12,
    fontWeight: '600',
    color: AppColors.textPrimary,
  },
});
