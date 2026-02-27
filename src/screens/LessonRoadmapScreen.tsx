// ============================================================
// Lesson Roadmap Screen — Visual Learning Path
// ============================================================
// Displays the course → units → lessons hierarchy as a visual
// scrollable roadmap with unlock/complete/in-progress status.

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    Platform,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { AppColors } from '../theme';
import { useUserProgress } from '../services/UserProgressService';
import { learningPathService } from '../services/LearningPathService';
import type { UserLessonProgress } from '../types/learningTypes';
import { RootStackParamList } from '../navigation/types';

type LessonRoadmapScreenProps = {
    navigation: StackNavigationProp<RootStackParamList, 'LessonRoadmap'>;
};

export const LessonRoadmapScreen: React.FC<LessonRoadmapScreenProps> = ({ navigation }) => {
    const userProgress = useUserProgress();
    const [isLoading, setIsLoading] = useState(true);
    const [course, setCourse] = useState<any>(null);
    const [units, setUnits] = useState<any[]>([]);
    const [lessonsByUnit, setLessonsByUnit] = useState<Record<string, any[]>>({});
    const [progressMap, setProgressMap] = useState<Record<string, UserLessonProgress>>({});
    const [courseStats, setCourseStats] = useState({ totalLessons: 0, completedLessons: 0, progressPercent: 0, totalXP: 0 });

    useEffect(() => {
        loadRoadmap();
    }, []);

    const loadRoadmap = async () => {
        setIsLoading(true);
        try {
            const targetLang = (userProgress.targetLanguage || 'Japanese').toLowerCase();
            const lang = learningPathService.getLanguageByCode(targetLang);

            if (!lang) {
                setIsLoading(false);
                return;
            }

            const courses = learningPathService.getCoursesForLanguage(lang.id);
            if (courses.length === 0) {
                setIsLoading(false);
                return;
            }

            const selectedCourse = courses[0];
            setCourse(selectedCourse);

            const courseUnits = learningPathService.getUnitsForCourse(selectedCourse.id);
            setUnits(courseUnits);

            const lessonsMap: Record<string, any[]> = {};
            for (const unit of courseUnits) {
                lessonsMap[unit.id] = learningPathService.getLessonsForUnit(unit.id);
            }
            setLessonsByUnit(lessonsMap);

            // Load progress
            const userId = 'default';
            const progress = await learningPathService.getLessonProgress(userId);
            setProgressMap(progress);

            const stats = await learningPathService.getCourseProgress(userId, selectedCourse.id);
            setCourseStats(stats);
        } catch (e) {
            console.error('[Roadmap] Load error:', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLessonPress = async (lessonId: string) => {
        const isUnlocked = await learningPathService.isLessonUnlocked('default', lessonId);
        if (isUnlocked) {
            navigation.navigate('Lesson', { lessonId });
        }
    };

    const getLessonStatus = (lessonId: string): 'locked' | 'unlocked' | 'in-progress' | 'completed' => {
        const progress = progressMap[lessonId];
        if (progress?.isCompleted) return 'completed';
        if (progress?.teachCompleted || progress?.guidedPracticeCompleted) return 'in-progress';
        // First lesson in the course is always unlocked
        const allLessons = Object.values(lessonsByUnit).flat();
        if (allLessons[0]?.id === lessonId) return 'unlocked';
        // Check if previous lesson is completed
        for (const lessons of Object.values(lessonsByUnit)) {
            const idx = lessons.findIndex((l: any) => l.id === lessonId);
            if (idx > 0 && progressMap[lessons[idx - 1].id]?.isCompleted) return 'unlocked';
            if (idx === 0) {
                // First lesson in a unit  — check previous units' last lesson
                return 'unlocked'; // Simplified: unlock first lesson of each unit
            }
        }
        return 'locked';
    };

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={AppColors.accentCyan} />
                <Text style={styles.loadingText}>Loading roadmap...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}>{course?.title || 'Learning Path'}</Text>
                    <Text style={styles.headerSubtitle}>
                        {courseStats.completedLessons}/{courseStats.totalLessons} lessons complete
                    </Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                    <LinearGradient
                        colors={[AppColors.accentCyan, AppColors.accentGreen]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${courseStats.progressPercent}%` }]}
                    />
                </View>
                <Text style={styles.progressText}>
                    {courseStats.progressPercent}% • {courseStats.totalXP} XP earned
                </Text>
            </View>

            {/* Units & Lessons */}
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {units.map((unit, unitIdx) => (
                    <View key={unit.id} style={styles.unitSection}>
                        {/* Unit Header */}
                        <View style={styles.unitHeader}>
                            <Text style={styles.unitIcon}>{unit.icon}</Text>
                            <View style={styles.unitInfo}>
                                <Text style={styles.unitTitle}>Unit {unitIdx + 1}: {unit.title}</Text>
                                <Text style={styles.unitDescription}>{unit.description}</Text>
                            </View>
                        </View>

                        {/* Lessons in this unit */}
                        {(lessonsByUnit[unit.id] || []).map((lesson: any, lessonIdx: number) => {
                            const status = getLessonStatus(lesson.id);
                            const progress = progressMap[lesson.id];

                            return (
                                <View key={lesson.id} style={styles.lessonRow}>
                                    {/* Connecting line */}
                                    {lessonIdx > 0 && (
                                        <View style={[
                                            styles.connector,
                                            status === 'completed' && { backgroundColor: AppColors.accentGreen },
                                        ]} />
                                    )}

                                    <TouchableOpacity
                                        style={[
                                            styles.lessonNode,
                                            status === 'completed' && styles.lessonCompleted,
                                            status === 'in-progress' && styles.lessonInProgress,
                                            status === 'locked' && styles.lessonLocked,
                                        ]}
                                        onPress={() => handleLessonPress(lesson.id)}
                                        disabled={status === 'locked'}
                                        activeOpacity={0.8}
                                    >
                                        <View style={[
                                            styles.lessonDot,
                                            status === 'completed' && styles.dotCompleted,
                                            status === 'in-progress' && styles.dotInProgress,
                                            status === 'locked' && styles.dotLocked,
                                        ]}>
                                            <Text style={styles.lessonDotText}>
                                                {status === 'completed' ? '✓' : status === 'locked' ? '🔒' : lessonIdx + 1}
                                            </Text>
                                        </View>
                                        <View style={styles.lessonContent}>
                                            <Text style={[
                                                styles.lessonTitle,
                                                status === 'locked' && styles.lessonTitleLocked,
                                            ]}>
                                                {lesson.title}
                                            </Text>
                                            <Text style={styles.lessonMeta}>
                                                {lesson.estimatedMinutes} min • {lesson.xpReward} XP
                                                {progress?.bestScore ? ` • Best: ${progress.bestScore}%` : ''}
                                            </Text>
                                        </View>
                                        {status !== 'locked' && (
                                            <Text style={styles.lessonArrow}>→</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                ))}

                {/* End of course */}
                <View style={styles.courseEndCard}>
                    <Text style={styles.courseEndEmoji}>🎓</Text>
                    <Text style={styles.courseEndText}>Complete all lessons to finish the course!</Text>
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
    loadingText: { marginTop: 16, fontSize: 16, color: AppColors.textSecondary },
    header: {
        flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14,
        paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 14 : 56,
        backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
    },
    backButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', marginRight: 12 },
    backButtonText: { fontSize: 20, color: '#374151', fontWeight: '600' },
    headerCenter: { flex: 1 },
    headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    headerSubtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    progressContainer: { paddingHorizontal: 20, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
    progressBarBg: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
    progressBarFill: { height: 8, borderRadius: 4 },
    progressText: { fontSize: 13, color: AppColors.textMuted, fontWeight: '500' },
    scrollView: { flex: 1 },
    scrollContent: { padding: 20, paddingBottom: 40 },
    unitSection: { marginBottom: 32 },
    unitHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
    unitIcon: { fontSize: 28 },
    unitInfo: { flex: 1 },
    unitTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
    unitDescription: { fontSize: 13, color: '#6B7280', marginTop: 2 },
    lessonRow: { position: 'relative', paddingLeft: 20 },
    connector: { position: 'absolute', left: 36, top: -16, width: 3, height: 16, backgroundColor: '#E5E7EB', borderRadius: 2 },
    lessonNode: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14,
        marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB', elevation: 1, shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 4,
    },
    lessonCompleted: { borderColor: AppColors.accentGreen + '50', backgroundColor: AppColors.accentGreen + '08' },
    lessonInProgress: { borderColor: AppColors.accentCyan + '50', backgroundColor: AppColors.accentCyan + '08' },
    lessonLocked: { opacity: 0.55 },
    lessonDot: {
        width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
        backgroundColor: AppColors.accentCyan + '15', marginRight: 14,
    },
    dotCompleted: { backgroundColor: AppColors.accentGreen },
    dotInProgress: { backgroundColor: AppColors.accentCyan },
    dotLocked: { backgroundColor: '#D1D5DB' },
    lessonDotText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
    lessonContent: { flex: 1 },
    lessonTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
    lessonTitleLocked: { color: '#9CA3AF' },
    lessonMeta: { fontSize: 12, color: '#9CA3AF', marginTop: 3 },
    lessonArrow: { fontSize: 16, color: '#CBD5E1', fontWeight: '600' },
    courseEndCard: {
        alignItems: 'center', padding: 24, backgroundColor: '#FFFFFF', borderRadius: 20,
        borderWidth: 1, borderColor: '#E5E7EB',
    },
    courseEndEmoji: { fontSize: 40, marginBottom: 12 },
    courseEndText: { fontSize: 15, color: AppColors.textSecondary, textAlign: 'center' },
});
