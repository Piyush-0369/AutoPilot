import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { AppColors } from '../theme';

interface LevelCardProps {
    level: number;
    currentXP: number;
    maxXP: number;
    skillsUnlocked: number;
    totalSkills: number;
}

export const LevelCard: React.FC<LevelCardProps> = ({
    level,
    currentXP,
    maxXP,
    skillsUnlocked,
    totalSkills,
}) => {
    const progress = (currentXP / maxXP) * 100;
    const levelLabel = level <= 2 ? 'Beginner' : level <= 5 ? 'Intermediate' : 'Advanced';

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.currentLevelLabel}>Current Level</Text>
            </View>

            <View style={styles.levelRow}>
                <Text style={styles.levelNumber}>Level {level}</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{levelLabel}</Text>
                </View>
            </View>

            <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                    <LinearGradient
                        colors={[AppColors.accentCyan, AppColors.accentViolet]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${progress}%` }]}
                    />
                </View>
                <Text style={styles.progressText}>
                    {currentXP} / {maxXP} XP
                </Text>
            </View>

            <Text style={styles.skillsText}>
                {skillsUnlocked} of {totalSkills} skills unlocked
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        marginHorizontal: 20,
        borderRadius: 16,
        padding: 20,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    header: {
        marginBottom: 8,
    },
    currentLevelLabel: {
        color: AppColors.textSecondary,
        fontSize: 13,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    levelNumber: {
        fontSize: 32,
        fontWeight: '700',
        color: AppColors.textPrimary,
        marginRight: 12,
    },
    badge: {
        backgroundColor: '#E0EAFF',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#2F5FED',
    },
    progressContainer: {
        marginBottom: 12,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 13,
        color: AppColors.textSecondary,
        textAlign: 'right',
    },
    skillsText: {
        fontSize: 12,
        color: AppColors.textSecondary,
    },
});
