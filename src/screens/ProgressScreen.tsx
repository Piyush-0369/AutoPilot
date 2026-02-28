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



  const handleNodePress = async (nodeId: string, status: string, prerequisites: string[]) => {
    // If mastered, allow review (e.g., go to Practice)
    if (status === 'mastered') {
      navigation.navigate('Practice');
      return;
    }

    // If in-progress, continue
    if (status === 'in-progress') {
      navigation.navigate('Practice');
      return;
    }

    // If locked, check prerequisites
    if (status === 'locked') {
      // Simple logic: if prerequisites are met, unlock it!
      // In a real app, you'd check if prerequisites are MASTERED.
      const canUnlock = prerequisites.every(preId =>
        userProgress.skillTreeProgress[preId] === 'mastered'
      );

      if (canUnlock || prerequisites.length === 0) {
        // Unlock it
        await userProgress.updateSkillNode(nodeId, 'in-progress');
      } else {
        // Shake animation or alert?
        // Alert.alert("Locked", "Complete previous skills first!");
      }
    }
  };

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
              <Text style={styles.statValue}>{Math.round((Object.values(userProgress.skillTreeProgress).filter(
                (s) => s === 'mastered'
              ).length / skillNodes.length) * 100)}%</Text>
              <Text style={styles.statLabel}>Overall Progress</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{Object.values(userProgress.skillTreeProgress).filter(
                (s) => s === 'mastered'
              ).length}</Text>
              <Text style={styles.statLabel}>Skills Mastered</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {Math.floor(userProgress.totalMinutesLearned / 60)}h {userProgress.totalMinutesLearned % 60}m
              </Text>
              <Text style={styles.statLabel}>Time Learned</Text>
            </View>
          </View>

          {/* Course Progress Ring */}
          <View style={styles.courseProgressContainer}>
            <View style={styles.progressRingWrapper}>
              {/* Very primitive CSS-based ring approximation using colored borders */}
              <View style={[styles.progressRingOuter, { borderColor: '#E5E7EB' }]} />
              <View style={[styles.progressRingInner, {
                borderTopColor: AppColors.primary,
                borderRightColor: AppColors.primary,
                borderBottomColor: AppColors.primary,
                borderLeftColor: 'transparent',
                transform: [{ rotate: '45deg' }]
              }]} />
              <View style={styles.progressRingContent}>
                <Text style={styles.progressRingPercent}>
                  {Math.round((Object.values(userProgress.skillTreeProgress).filter(
                    (s) => s === 'mastered'
                  ).length / skillNodes.length) * 100)}%
                </Text>
                <Text style={styles.progressRingLabel}>Mastery</Text>
              </View>
            </View>
          </View>

          {/* Skill Tree Path */}
          <Text style={styles.sectionTitle}>Learning Path</Text>
          <View style={styles.pathContainer}>

            {skillNodes.map((node, index) => {
              const status = getNodeStatus(node.id);
              const isLocked = status === 'locked';

              // Create snake-like path
              const isEven = index % 2 === 0;
              const alignmentStyle = isEven ? styles.nodeRowLeft : styles.nodeRowRight;

              return (
                <View key={node.id} style={[styles.nodeWrapper, alignmentStyle]}>

                  {/* Connector line to the next node if it's not the last one */}
                  {index < skillNodes.length - 1 && (
                    <View style={[styles.pathConnector, isEven ? styles.connectorRight : styles.connectorLeft]} />
                  )}

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleNodePress(node.id, status, node.prerequisites)}
                    style={[
                      styles.pathNodeBox,
                      isLocked && styles.skillNodeLocked,
                      { borderColor: getStatusColor(status) }
                    ]}
                  >
                    <View
                      style={[
                        styles.skillIconContainerPath,
                        { backgroundColor: getStatusColor(status) },
                      ]}
                    >
                      <Text style={styles.skillIconPath}>{node.icon}</Text>
                      {status === 'locked' && (
                        <View style={styles.lockOverlayPath}>
                          <Text style={styles.lockIconPath}>🔒</Text>
                        </View>
                      )}
                      {status === 'mastered' && (
                        <View style={styles.checkBadge}>
                          <Text style={styles.checkIcon}>✓</Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.pathNodeInfo}>
                      <Text
                        style={[
                          styles.skillTitlePath,
                          isLocked && styles.skillTitleLocked,
                        ]}
                      >
                        {node.title}
                      </Text>
                      {!isLocked && status === 'in-progress' && (
                        <View style={styles.progressPill}>
                          <Text style={styles.progressPillText}>In Progress</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              );

            })}
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* BOTTOM NAV */}
      <BottomNav navigation={navigation} active="Progress" />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSpacer: { height: 80 },
  container: { flex: 1, backgroundColor: '#F5F7FA' },

  header: {
    padding: 20,
    backgroundColor: '#FFF',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },

  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: AppColors.primaryDark,
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
    fontWeight: '500',
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: AppColors.primaryDark,
    marginBottom: 20,
    marginTop: 10,
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
    backgroundColor: '#F9FAFB',
  },

  // Ring Styles
  courseProgressContainer: {
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressRingWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  progressRingOuter: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 10,
  },
  progressRingInner: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 10,
  },
  progressRingContent: {
    alignItems: 'center',
    backgroundColor: '#FFF',
    width: 100, height: 100,
    borderRadius: 50,
    justifyContent: 'center',
  },
  progressRingPercent: {
    fontSize: 24,
    fontWeight: '800',
    color: AppColors.primary,
  },
  progressRingLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '600',
  },

  // Path Styles
  pathContainer: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  nodeWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 24,
  },
  nodeRowLeft: {
    alignItems: 'flex-start',
    paddingLeft: '10%',
  },
  nodeRowRight: {
    alignItems: 'flex-end',
    paddingRight: '10%',
  },
  pathConnector: {
    position: 'absolute',
    width: 40,
    height: 60,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#E5E7EB',
    top: 50,
    zIndex: -1,
  },
  connectorRight: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    borderTopWidth: 0, borderLeftWidth: 0,
    right: '25%', width: '50%',
  },
  connectorLeft: {
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 20,
    borderTopWidth: 0, borderRightWidth: 0,
    borderLeftWidth: 4,
    left: '25%', width: '50%',
  },

  pathNodeBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    width: 220,
    borderWidth: 3,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },

  skillIconContainerPath: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },

  skillIconPath: {
    fontSize: 30,
    color: '#FFF',
  },

  checkBadge: {
    position: 'absolute',
    bottom: -4, right: -4,
    backgroundColor: '#FFF',
    width: 20, height: 20,
    borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
    elevation: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 2,
  },
  checkIcon: {
    color: '#10B981', fontSize: 12, fontWeight: 'bold'
  },

  lockOverlayPath: {
    position: 'absolute',
    width: '100%', height: '100%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    borderRadius: 30,
    justifyContent: 'center', alignItems: 'center',
  },
  lockIconPath: { fontSize: 24 },

  pathNodeInfo: {
    flex: 1,
  },

  skillTitlePath: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primaryDark,
    marginBottom: 4,
  },

  skillTitleLocked: {
    color: AppColors.textSecondary,
  },

  progressPill: {
    backgroundColor: AppColors.primary + '20',
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 12, alignSelf: 'flex-start',
  },
  progressPillText: {
    color: AppColors.primary, fontSize: 10, fontWeight: '700'
  }
});
