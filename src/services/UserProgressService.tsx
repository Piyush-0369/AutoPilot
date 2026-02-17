import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, SkillNodeStatus, SRSItem } from '../types';
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
  createdAt: '',
  updatedAt: ''
};

export const UserProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<User>(initialUser);
  const [isLoading, setIsLoading] = useState(true);

  const saveUser = useCallback(async (newUser: User) => {
    try {
      await AsyncStorage.setItem('user-storage', JSON.stringify(newUser));
      setUserState(newUser);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  }, []);

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

  const updateXP = useCallback(async (amount: number) => {
    const newUser = { ...user };
    newUser.xp += amount;
    newUser.level = calculateLevel(newUser.xp);
    newUser.updatedAt = new Date().toISOString();
    await saveUser(newUser);
  }, [user, saveUser]);

  const updateStreakStatus = useCallback(async () => {
    const result = updateStreak({
      lastActiveDate: user.lastActiveDate,
      currentStreak: user.streak,
      longestStreak: user.longestStreak
    });

    if (result.newStreak !== user.streak) {
      const newUser = {
        ...user,
        streak: result.newStreak,
        longestStreak: result.longestStreak,
        lastActiveDate: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await saveUser(newUser);
    }
  }, [user, saveUser]);

  const completeLesson = useCallback(async (lessonId: string) => {
    if (!user.completedLessons.includes(lessonId)) {
      const newUser = {
        ...user,
        completedLessons: [...user.completedLessons, lessonId],
        updatedAt: new Date().toISOString()
      };
      await saveUser(newUser);
    }
  }, [user, saveUser]);

  const unlockAchievement = useCallback(async (achievementId: string) => {
    if (!user.unlockedAchievements.includes(achievementId)) {
      const newUser = {
        ...user,
        unlockedAchievements: [...user.unlockedAchievements, achievementId],
        updatedAt: new Date().toISOString()
      };
      await saveUser(newUser);
    }
  }, [user, saveUser]);

  const updateSkillNode = useCallback(async (nodeId: string, status: SkillNodeStatus) => {
    const newUser = {
      ...user,
      skillTreeProgress: {
        ...user.skillTreeProgress,
        [nodeId]: status
      },
      updatedAt: new Date().toISOString()
    };
    await saveUser(newUser);
  }, [user, saveUser]);

  const setUser = useCallback(async (updates: Partial<User>) => {
    const newUser = {
      ...user,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    await saveUser(newUser);
  }, [user, saveUser]);

  const resetUser = useCallback(async () => {
    await saveUser(initialUser);
  }, [saveUser]);

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
    throw new Error('useUserProgress must be used within UserProgressProvider');
  }
  return context;
};
