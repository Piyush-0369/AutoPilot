import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    StatusBar,
    TouchableOpacity,
    TextInput,
    ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';
import { useUserProgress } from '../services/UserProgressService';
import { AppColors } from '../theme';

type WelcomeScreenProps = {
    navigation: StackNavigationProp<RootStackParamList, 'Welcome'>;
};

const LANGUAGES = [
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'de', name: 'German', flag: '🇩🇪' },
    { code: 'it', name: 'Italian', flag: '🇮🇹' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
];

const DAILY_GOALS = [5, 10, 15, 20, 30];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
    const userProgress = useUserProgress();
    const [step, setStep] = useState(1);
    const [name, setName] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState('');
    const [dailyGoal, setDailyGoal] = useState(10);

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = async () => {
        await userProgress.setUser({
            id: Date.now().toString(),
            name,
            targetLanguage: selectedLanguage,
            nativeLanguage: 'en',
            dailyGoalMinutes: dailyGoal,
            createdAt: new Date().toISOString(),
        });
        navigation.replace('Home');
    };

    const canProceed = () => {
        if (step === 1) return name.trim().length > 0;
        if (step === 2) return selectedLanguage !== '';
        if (step === 3) return true;
        return false;
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={[AppColors.primary, '#1E40AF']}
                style={styles.gradient}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Welcome! 👋</Text>
                    <Text style={styles.headerSubtitle}>
                        Let's personalize your learning experience
                    </Text>
                </View>

                {/* Progress Indicator */}
                <View style={styles.progressContainer}>
                    {[1, 2, 3].map((i) => (
                        <View
                            key={i}
                            style={[
                                styles.progressDot,
                                i === step && styles.progressDotActive,
                                i < step && styles.progressDotComplete,
                            ]}
                        />
                    ))}
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    showsVerticalScrollIndicator={false}
                >
                    {step === 1 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepTitle}>What's your name?</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                placeholderTextColor="#9CA3AF"
                                autoFocus
                            />
                        </View>
                    )}

                    {step === 2 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepTitle}>
                                Which language do you want to learn?
                            </Text>
                            <View style={styles.languageGrid}>
                                {LANGUAGES.map((lang) => (
                                    <TouchableOpacity
                                        key={lang.code}
                                        style={[
                                            styles.languageCard,
                                            selectedLanguage === lang.name &&
                                            styles.languageCardSelected,
                                        ]}
                                        onPress={() => setSelectedLanguage(lang.name)}
                                    >
                                        <Text style={styles.languageFlag}>{lang.flag}</Text>
                                        <Text style={styles.languageName}>{lang.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}

                    {step === 3 && (
                        <View style={styles.stepContainer}>
                            <Text style={styles.stepTitle}>Set your daily goal</Text>
                            <Text style={styles.stepSubtitle}>
                                How many minutes per day do you want to practice?
                            </Text>
                            <View style={styles.goalContainer}>
                                {DAILY_GOALS.map((goal) => (
                                    <TouchableOpacity
                                        key={goal}
                                        style={[
                                            styles.goalCard,
                                            dailyGoal === goal && styles.goalCardSelected,
                                        ]}
                                        onPress={() => setDailyGoal(goal)}
                                    >
                                        <Text
                                            style={[
                                                styles.goalValue,
                                                dailyGoal === goal && styles.goalValueSelected,
                                            ]}
                                        >
                                            {goal}
                                        </Text>
                                        <Text
                                            style={[
                                                styles.goalLabel,
                                                dailyGoal === goal && styles.goalLabelSelected,
                                            ]}
                                        >
                                            min
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )}
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    {step > 1 && (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => setStep(step - 1)}
                        >
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity
                        style={[
                            styles.nextButton,
                            !canProceed() && styles.nextButtonDisabled,
                        ]}
                        onPress={handleNext}
                        disabled={!canProceed()}
                    >
                        <Text style={styles.nextButtonText}>
                            {step === 3 ? 'Get Started' : 'Next'}
                        </Text>
                    </TouchableOpacity>
                </View>
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
    },

    header: {
        marginTop: 60,
        marginBottom: 32,
    },

    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },

    headerSubtitle: {
        fontSize: 16,
        color: '#FFFFFF',
        opacity: 0.9,
    },

    progressContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 12,
        marginBottom: 32,
    },

    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },

    progressDotActive: {
        width: 24,
        backgroundColor: '#FFFFFF',
    },

    progressDotComplete: {
        backgroundColor: '#FFFFFF',
    },

    content: {
        flex: 1,
    },

    contentContainer: {
        flexGrow: 1,
    },

    stepContainer: {
        flex: 1,
    },

    stepTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },

    stepSubtitle: {
        fontSize: 14,
        color: '#FFFFFF',
        opacity: 0.9,
        marginBottom: 24,
    },

    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: AppColors.textPrimary,
    },

    languageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },

    languageCard: {
        width: '48%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },

    languageCardSelected: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },

    languageFlag: {
        fontSize: 32,
        marginBottom: 8,
    },

    languageName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    goalContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },

    goalCard: {
        width: '30%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },

    goalCardSelected: {
        backgroundColor: '#FFFFFF',
        borderColor: '#FFFFFF',
    },

    goalValue: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },

    goalValueSelected: {
        color: AppColors.primary,
    },

    goalLabel: {
        fontSize: 12,
        color: '#FFFFFF',
        opacity: 0.9,
    },

    goalLabelSelected: {
        color: AppColors.textSecondary,
    },

    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 20,
    },

    backButton: {
        flex: 1,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },

    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },

    nextButton: {
        flex: 2,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },

    nextButtonDisabled: {
        opacity: 0.5,
    },

    nextButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: AppColors.primary,
    },
});
