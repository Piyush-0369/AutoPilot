import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { AppColors } from '../theme';

interface ExerciseCardProps {
    icon: string;
    label: string;
    xp: number;
    onPress?: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({ icon, label, xp, onPress }) => {
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Text style={styles.icon}>{icon}</Text>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.xpBadge}>
                <Text style={styles.xpText}>+{xp} XP</Text>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    icon: {
        fontSize: 32,
        marginBottom: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: AppColors.textPrimary,
        marginBottom: 8,
        textAlign: 'center',
    },
    xpBadge: {
        backgroundColor: AppColors.warning + '20',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    xpText: {
        fontSize: 11,
        fontWeight: '600',
        color: AppColors.warning,
    },
});
