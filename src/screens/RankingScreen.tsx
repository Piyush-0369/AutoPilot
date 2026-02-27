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

  const [activeTab, setActiveTab] = React.useState('Global');

  const combinedLeaderboard = [...MOCK_LEADERBOARD, {
    rank: 5, userId: 'you', name: 'You', xp: userProgress.xp, level: userProgress.level, streak: userProgress.streak
  }].sort((a, b) => b.xp - a.xp).map((entry, index) => ({ ...entry, rank: index + 1 }));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* TABS */}
        <View style={styles.tabsContainer}>
          {['Global', 'Friends', 'AI Rivals'].map(tab => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.resetContainer}>
          <Text style={styles.resetText}>⏱ Weekly reset in 2 days 14 hours</Text>
        </View>

        <View style={styles.listContainer}>
          {combinedLeaderboard.map((entry) => (
            <View key={entry.userId} style={[styles.row, entry.userId === 'you' && styles.rowActive]}>
              <View style={styles.rankCol}>
                {entry.rank === 1 ? <Text style={styles.medal}>🥇</Text> :
                  entry.rank === 2 ? <Text style={styles.medal}>🥈</Text> :
                    entry.rank === 3 ? <Text style={styles.medal}>🥉</Text> :
                      <Text style={styles.rankNumber}>{entry.rank}</Text>}
              </View>
              <View style={styles.userCol}>
                <View style={[styles.avatar, entry.userId === 'you' && styles.avatarYou]}>
                  <Text style={[styles.avatarText, entry.userId === 'you' && styles.avatarTextYou]}>{entry.name.charAt(0)}</Text>
                </View>
                <Text style={[styles.nameText, entry.userId === 'you' && styles.nameTextYou]}>{entry.name}</Text>
              </View>
              <View style={styles.trendCol}>
                <Text style={entry.userId === 'you' ? styles.trendUp : styles.trendNeutral}>
                  {entry.userId === 'you' ? '↗' : '—'}
                </Text>
              </View>
              <View style={styles.xpCol}>
                <Text style={[styles.xpText, entry.userId === 'you' && styles.xpTextYou]}>
                  {entry.xp.toLocaleString()} XP
                </Text>
              </View>
            </View>
          ))}
        </View>
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: AppColors.primaryDark,
  },

  scrollContent: {
    paddingBottom: 40,
  },

  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'space-around',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },

  activeTab: {
    backgroundColor: AppColors.primary + '15',
  },

  tabText: {
    color: AppColors.textSecondary,
    fontWeight: '600',
    fontSize: 14,
  },

  activeTabText: {
    color: AppColors.primary,
  },

  resetContainer: {
    paddingTop: 20,
    paddingBottom: 10,
    alignItems: 'center',
  },

  resetText: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },

  listContainer: {
    backgroundColor: '#FFF',
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    overflow: 'hidden',
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  rowActive: {
    backgroundColor: AppColors.primary + '0A',
  },

  rankCol: {
    width: 40,
    alignItems: 'center',
  },

  medal: {
    fontSize: 20,
  },

  rankNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primaryDark,
  },

  userCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  avatarYou: {
    backgroundColor: AppColors.primary,
  },

  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primaryDark,
  },

  avatarTextYou: {
    color: '#FFF',
  },

  nameText: {
    fontSize: 15,
    fontWeight: '600',
    color: AppColors.primaryDark,
  },

  nameTextYou: {
    color: AppColors.primary,
  },

  trendCol: {
    width: 30,
    alignItems: 'center',
  },

  trendUp: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },

  trendNeutral: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.textSecondary,
  },

  xpCol: {
    width: 80,
    alignItems: 'flex-end',
  },

  xpText: {
    fontSize: 14,
    fontWeight: '700',
    color: AppColors.primaryDark,
  },

  xpTextYou: {
    color: AppColors.primary,
  },
});
