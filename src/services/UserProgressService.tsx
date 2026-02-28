import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, SkillNodeStatus } from '../types';
import { calculateLevel, getXPForNextLevel, getProgressToNextLevel } from '../lib/engines/xpEngine';
import { updateStreak } from '../lib/engines/streakEngine';

interface UserContextType extends User {
  isLoading: boolean;
  updateXP: (amount: number) => Promise<void>;
  updateStreakStatus: () => Promise<void>;
  completeLesson: (lessonId: string) => Promise<void>;
  unlockAchievement: (achievementId: string) => Promise<void>;
  updateSkillNode: (nodeId: string, status: SkillNodeStatus) => Promise<void>;
  resetUser: () => Promise<void>;
  setUser: (user: Partial<User>) => Promise<void>;
  loadUser: () => Promise<void>;
  getNextLevelXP: () => number;
  getProgressPercent: () => number;
}

const UserContext = createContext<UserContextType | null>(null);

const initialUser: User = {
  id: '',
  name: '',
  targetLanguage: '',
  nativeLanguage: 'en',
  dailyGoalMinutes: 10,
  xp: 0,
  level: 1,
  streak: 0,
  lastActiveDate: '',
  longestStreak: 0,
  totalMinutesLearned: 0,
  achievements: [],
  unlockedAchievements: [],
  completedLessons: [],
  skillTreeProgress: {},
  srsItems: {},
  weeklyXpHistory: [120, 300, 150, 450, 200, 500, 50],
  createdAt: '',
  updatedAt: ''
};

export const UserProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User>(initialUser);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  const loadUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const stored = await AsyncStorage.getItem('user-storage');
      if (stored) {
        const parsed = JSON.parse(stored);
        setUserState(parsed);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUserState(initialUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Auto-save effect: Whenever 'user' changes, save it.
  useEffect(() => {
    const saveUserToStorage = async () => {
      if (isLoading) return; // Don't save if we are still loading (prevents overwriting with initialUser)

      try {
        await AsyncStorage.setItem('user-storage', JSON.stringify(user));
      } catch (error) {
        console.error('Error auto-saving user:', error);
      }
    };

    saveUserToStorage();
  }, [user, isLoading]);

  // Helper to ensure functional updates
  const setAtomicUser = (updateFn: (prev: User) => User) => {
    setUserState(prev => {
      const newState = updateFn(prev);
      // Ensure updatedAt is set on every mutation if not already handled
      if (newState !== prev) {
        return {
          ...newState,
          updatedAt: new Date().toISOString()
        };
      }
      return prev;
    });
  };

  const updateXP = useCallback(async (amount: number) => {
    setAtomicUser(prev => {
      const newXP = prev.xp + amount;
      return {
        ...prev,
        xp: newXP,
        level: calculateLevel(newXP)
      };
    });
  }, []);

  const updateStreakStatus = useCallback(async () => {
    setAtomicUser(prev => {
      const result = updateStreak({
        lastActiveDate: prev.lastActiveDate,
        currentStreak: prev.streak,
        longestStreak: prev.longestStreak
      });

      if (result.newStreak !== prev.streak) {
        return {
          ...prev,
          streak: result.newStreak,
          longestStreak: result.longestStreak,
          lastActiveDate: new Date().toISOString(),
        };
      }
      return prev;
    });
  }, []);

  const completeLesson = useCallback(async (lessonId: string) => {
    setAtomicUser(prev => {
      if (!prev.completedLessons.includes(lessonId)) {
        return {
          ...prev,
          completedLessons: [...prev.completedLessons, lessonId],
        };
      }
      return prev;
    });
  }, []);

  const unlockAchievement = useCallback(async (achievementId: string) => {
    setAtomicUser(prev => {
      if (!prev.unlockedAchievements.includes(achievementId)) {
        return {
          ...prev,
          unlockedAchievements: [...prev.unlockedAchievements, achievementId],
        };
      }
      return prev;
    });
  }, []);

  const updateSkillNode = useCallback(async (nodeId: string, status: SkillNodeStatus) => {
    setAtomicUser(prev => {
      return {
        ...prev,
        skillTreeProgress: {
          ...prev.skillTreeProgress,
          [nodeId]: status
        },
      };
    });
  }, []);

  const setUser = useCallback(async (updates: Partial<User>) => {
    setAtomicUser(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetUser = useCallback(async () => {
    setUserState(initialUser);
    // Auto-save effect will pick this up
  }, []);

  const getNextLevelXP = useCallback((): number => {
    return getXPForNextLevel(user.xp);
  }, [user.xp]);

  const getProgressPercent = useCallback((): number => {
    return Math.round(getProgressToNextLevel(user.xp) * 100);
  }, [user.xp]);

  const value: UserContextType = {
    ...user,
    isLoading,
    updateXP,
    updateStreakStatus,
    completeLesson,
    unlockAchievement,
    updateSkillNode,
    resetUser,
    setUser,
    loadUser,
    getNextLevelXP,
    getProgressPercent
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUserProgress = () => {
  const context = useContext(UserContext);
  if (!context) {
    // Provide a fallback user object to avoid crashes if provider is missing
    return {
      ...initialUser,
      isLoading: false,
      updateXP: async () => { },
      updateStreakStatus: async () => { },
      completeLesson: async () => { },
      unlockAchievement: async () => { },
      updateSkillNode: async () => { },
      resetUser: async () => { },
      setUser: async () => { },
      loadUser: async () => { },
      getNextLevelXP: () => 0,
      getProgressPercent: () => 0,
    };
  }
  return context;
};
