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

  const masteredCount = Object.values(userProgress.skillTreeProgress).filter(
    (s) => s === 'mastered'
  ).length;
  const inProgressCount = Object.values(userProgress.skillTreeProgress).filter(
    (s) => s === 'in-progress'
  ).length;
  const totalNodes = skillNodes.length;
  const progressPercent = Math.round((masteredCount / totalNodes) * 100);

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

  const layers = Array.from(new Set(skillNodes.map(n => n.position?.y || 0))).sort((a,b) => a-b);
  const [activeTab, setActiveTab] = React.useState('Grammar');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Skill Tree</Text>
      </View>

      {/* CONTENT */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* TABS */}
        <View style={styles.tabsContainer}>
          {['Grammar', 'Vocabulary', 'Speaking'].map(tab => (
            <TouchableOpacity 
              key={tab} 
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* PROGRESS */}
        <View style={styles.progressSection}>
          <View style={styles.progressRow}>
            <Text style={styles.progressTitle}>Overall Progress</Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBarBg}>
             <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
          </View>
          <View style={styles.progressStats}>
            <Text style={styles.progressStatText}>{masteredCount} of {totalNodes} skills mastered</Text>
            <Text style={styles.progressStatXp}>⚡ {userProgress.xp} XP</Text>
          </View>
        </View>

        {/* TREE */}
        <View style={styles.treeContainer}>
           <View style={styles.treeLine} />
           {layers.map((layer) => {
             const nodesInLayer = skillNodes.filter(n => (n.position?.y || 0) === layer).sort((a,b) => (a.position?.x || 0) - (b.position?.x || 0));
             return (
               <View key={`layer-${layer}`} style={styles.layerRow}>
                 {nodesInLayer.map((node) => {
                    const status = getNodeStatus(node.id);
                    const isLocked = status === 'locked';
                    const isActive = status === 'in-progress';
                    const isMastered = status === 'mastered';
                    
                    const nodeColor = isMastered ? AppColors.primary : isActive ? AppColors.primaryMid : '#E5E7EB';
                    
                    return (
                      <View key={node.id} style={styles.nodeWrapper}>
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => handleNodePress(node.id, status, node.prerequisites)}
                          style={[
                            styles.nodeCircle, 
                            { backgroundColor: nodeColor, borderColor: isActive ? AppColors.primaryLight : '#FFF' },
                            isActive && styles.nodeCircleActive
                          ]}
                        >
                          {isMastered ? (
                            <Text style={styles.nodeIconWhite}>✓</Text>
                          ) : isLocked ? (
                            <Text style={styles.nodeIcon}>🔒</Text>
                          ) : (
                            <Text style={styles.nodeIconWhite}>{node.icon || 'star'}</Text>
                          )}
                        </TouchableOpacity>
                        <Text style={[styles.nodeTitle, isLocked && styles.nodeTitleLocked]}>{node.title}</Text>
                      </View>
                    );
                 })}
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
    marginBottom: 20,
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
  
  progressSection: {
    marginHorizontal: 20,
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  
  progressTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primaryDark,
  },
  
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: AppColors.primary,
  },

  progressBarBg: {
    height: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 5,
    marginBottom: 12,
    overflow: 'hidden',
  },

  progressBarFill: {
    height: '100%',
    backgroundColor: AppColors.primary,
    borderRadius: 5,
  },

  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  progressStatText: {
    fontSize: 12,
    color: AppColors.textSecondary,
  },
  
  progressStatXp: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },

  treeContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    position: 'relative',
  },

  treeLine: {
    position: 'absolute',
    top: 20,
    bottom: 40,
    width: 6,
    backgroundColor: '#E5E7EB',
    left: '50%',
    marginLeft: -3,
    zIndex: -1,
  },

  layerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 60,
    marginBottom: 50,
    width: '100%',
  },

  nodeWrapper: {
    alignItems: 'center',
  },

  nodeCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    borderWidth: 5,
    borderColor: '#FFF',
  },

  nodeCircleActive: {
    borderWidth: 6,
    transform: [{ scale: 1.1 }],
    elevation: 8,
  },

  nodeIconWhite: {
    fontSize: 32,
    color: '#FFF',
    fontWeight: 'bold',
  },

  nodeIcon: {
    fontSize: 32,
  },

  nodeTitle: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '700',
    color: AppColors.primaryDark,
  },
  
  nodeTitleLocked: {
    color: AppColors.textSecondary,
  },
});
