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
import skillTreeData from '../data/skillTree.json';
import { SkillNode } from '../types';

type ProgressScreenProps = {
  navigation: StackNavigationProp<RootStackParamList, 'Progress'>;
};

const skillNodes = skillTreeData as SkillNode[];

export const ProgressScreen: React.FC<ProgressScreenProps> = ({ navigation }) => {
  const userProgress = useUserProgress();

  const getNodeStatus = (nodeId: string) => {
    return userProgress.skillTreeProgress[nodeId] || 'locked';
  };

  const getStatusColor = (status: string) => {
    if (status === 'mastered') return '#10B981';
    if (status === 'in-progress') return '#3B82F6';
    return '#9CA3AF';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'mastered') return '✅';
    if (status === 'in-progress') return '🔄';
    return '🔒';
  };

  const masteredCount = Object.values(userProgress.skillTreeProgress).filter(
    (s) => s === 'mastered'
  ).length;
  const inProgressCount = Object.values(userProgress.skillTreeProgress).filter(
    (s) => s === 'in-progress'
  ).length;
  const totalNodes = skillNodes.length;
  const progressPercent = Math.round((masteredCount / totalNodes) * 100);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Progress</Text>
      </View>

      {/* CONTENT */}
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Stats Cards */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{progressPercent}%</Text>
              <Text style={styles.statLabel}>Overall Progress</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{masteredCount}</Text>
              <Text style={styles.statLabel}>Skills Mastered</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{userProgress.totalMinutesLearned}</Text>
              <Text style={styles.statLabel}>Hours Learned</Text>
            </View>
          </View>

          {/* Skill Tree */}
          <Text style={styles.sectionTitle}>Skill Tree</Text>

          {skillNodes.map((node) => {
            const status = getNodeStatus(node.id);
            const isLocked = status === 'locked';

            return (
              <View
                key={node.id}
                style={[
                  styles.skillNode,
                  isLocked && styles.skillNodeLocked,
                ]}
              >
                <View style={styles.skillNodeHeader}>
                  <View
                    style={[
                      styles.skillIconContainer,
                      { backgroundColor: getStatusColor(status) + '20' },
                    ]}
                  >
                    <Text style={styles.skillIcon}>{node.icon}</Text>
                    <Text style={styles.statusIcon}>
                      {getStatusIcon(status)}
                    </Text>
                  </View>
                  <View style={styles.skillInfo}>
                    <Text
                      style={[
                        styles.skillTitle,
                        isLocked && styles.skillTitleLocked,
                      ]}
                    >
                      {node.title}
                    </Text>
                    <Text style={styles.skillDescription}>
                      {node.description}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(status) },
                    ]}
                  >
                    {status === 'mastered'
                      ? 'Mastered'
                      : status === 'in-progress'
                        ? 'In Progress'
                        : 'Locked'}
                  </Text>
                </View>

                {node.prerequisites.length > 0 && isLocked && (
                  <Text style={styles.prerequisiteText}>
                    Requires: {node.prerequisites.join(', ')}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <BottomNav navigation={navigation} active="Progress" />
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

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },

  statCard: {
    flex: 1,
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
    fontSize: 24,
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
    marginBottom: 16,
  },

  skillNode: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  skillNodeLocked: {
    opacity: 0.6,
  },

  skillNodeHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },

  skillIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },

  skillIcon: {
    fontSize: 28,
  },

  statusIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    fontSize: 16,
  },

  skillInfo: {
    flex: 1,
  },

  skillTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: AppColors.textPrimary,
    marginBottom: 4,
  },

  skillTitleLocked: {
    color: AppColors.textSecondary,
  },

  skillDescription: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },

  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },

  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  prerequisiteText: {
    fontSize: 11,
    color: AppColors.textSecondary,
    fontStyle: 'italic',
  },
});
