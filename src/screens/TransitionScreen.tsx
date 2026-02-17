import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { AppColors } from '../theme';
import { SessionSummary } from '../types';

type TransitionScreenProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Transition'>;
    route: RouteProp<RootStackParamList, 'Transition'>;
};

export const TransitionScreen: React.FC<TransitionScreenProps> = ({ navigation, route }) => {
    const { summary, leveledUp } = route.params || {
        summary: {
            totalXP: 0,
            accuracy: 0,
            timeSpentMinutes: 0,
            exercisesCompleted: 0,
        },
        leveledUp: false,
    };

    const handleContinue = () => {
        navigation.navigate('Home');
    };

    const getAccuracyColor = (accuracy: number) => {
        if (accuracy >= 0.9) return '#10B981';
        if (accuracy >= 0.7) return '#3B82F6';
        if (accuracy >= 0.5) return '#F59E0B';
        return '#EF4444';
    };

    const getAccuracyLabel = (accuracy: number) => {
        if (accuracy >= 0.9) return 'Excellent!';
        if (accuracy >= 0.7) return 'Great!';
        if (accuracy >= 0.5) return 'Good!';
        return 'Keep practicing!';
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={[AppColors.primary, '#1E40AF']}
                style={styles.gradient}
            >
                {/* Celebration */}
                <View style={styles.celebrationContainer}>
                    <Text style={styles.celebrationIcon}>
                        {leveledUp ? '🎉' : summary.accuracy >= 0.9 ? '🌟' : '✨'}
                    </Text>
                    <Text style={styles.celebrationTitle}>
                        {leveledUp ? 'Level Up!' : 'Session Complete!'}
                    </Text>
                    {leveledUp && (
                        <Text style={styles.celebrationSubtitle}>
                            You've reached a new level!
                        </Text>
                    )}
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>⚡</Text>
                        <Text style={styles.statValue}>{summary.totalXP}</Text>
                        <Text style={styles.statLabel}>XP Earned</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>🎯</Text>
                        <Text
                            style={[
                                styles.statValue,
                                { color: getAccuracyColor(summary.accuracy) },
                            ]}
                        >
                            {Math.round(summary.accuracy * 100)}%
                        </Text>
                        <Text style={styles.statLabel}>
                            {getAccuracyLabel(summary.accuracy)}
                        </Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>⏱️</Text>
                        <Text style={styles.statValue}>{summary.timeSpentMinutes}</Text>
                        <Text style={styles.statLabel}>Minutes</Text>
                    </View>

                    <View style={styles.statCard}>
                        <Text style={styles.statIcon}>📝</Text>
                        <Text style={styles.statValue}>{summary.exercisesCompleted}</Text>
                        <Text style={styles.statLabel}>Exercises</Text>
                    </View>
                </View>

                {/* Encouragement */}
                <View style={styles.encouragementContainer}>
                    <Text style={styles.encouragementText}>
                        {summary.accuracy >= 0.9
                            ? "Perfect! You're mastering this!"
                            : summary.accuracy >= 0.7
                                ? 'Great work! Keep it up!'
                                : summary.accuracy >= 0.5
                                    ? 'Good effort! Practice makes perfect!'
                                    : "Don't give up! You're learning!"}
                    </Text>
                </View>

                {/* Continue Button */}
                <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>
            </LinearGradient>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    gradient: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },

    celebrationContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },

    celebrationIcon: {
        fontSize: 80,
        marginBottom: 16,
    },

    celebrationTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },

    celebrationSubtitle: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.9,
    },

    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 32,
    },

    statCard: {
        width: '47%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
    },

    statIcon: {
        fontSize: 32,
        marginBottom: 8,
    },

    statValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },

    statLabel: {
        fontSize: 13,
        color: '#FFFFFF',
        opacity: 0.9,
    },

    encouragementContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
    },

    encouragementText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'center',
    },

    continueButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 18,
        alignItems: 'center',
    },

    continueButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: AppColors.primary,
    },
});
