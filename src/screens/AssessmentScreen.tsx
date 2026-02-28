import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    Dimensions,
    Animated,
    StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import LinearGradient from 'react-native-linear-gradient';
import { AppColors } from '../theme';

const { width } = Dimensions.get('window');

type AssessmentScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Assessment'>;
type AssessmentScreenRouteProp = RouteProp<RootStackParamList, 'Assessment'>;

type Props = {
    navigation: AssessmentScreenNavigationProp;
    route: AssessmentScreenRouteProp;
};

type Question = {
    id: number;
    text: string;
    options: string[];
    correctIndex: number;
};

const QUIZ_DATA: Record<string, Question[]> = {
    Spanish: [
        { id: 1, text: 'Translate "Hello":', options: ['Hola', 'Adiós', 'Gracias', 'Por favor'], correctIndex: 0 },
        { id: 2, text: 'Choose the correct form: "Yo ___ estudiante."', options: ['es', 'soy', 'eres', 'somos'], correctIndex: 1 },
        { id: 3, text: 'What does "Gato" mean?', options: ['Dog', 'Cat', 'Bird', 'Fish'], correctIndex: 1 },
        { id: 4, text: 'Translate "I want an apple":', options: ['Quiero una manzana', 'Tengo una manzana', 'Como una manzana', 'Veo una manzana'], correctIndex: 0 },
    ],
    French: [
        { id: 1, text: 'Translate "Good morning":', options: ['Bonsoir', 'Bonjour', 'Salut', 'Merci'], correctIndex: 1 },
        { id: 2, text: 'Choose the correct form: "Je ___ français."', options: ['suis', 'es', 'est', 'sommes'], correctIndex: 0 },
        { id: 3, text: 'What does "Chien" mean?', options: ['Cat', 'Dog', 'House', 'Car'], correctIndex: 1 },
        { id: 4, text: 'Translate "I would like a coffee":', options: ['Je veux un café', 'Je voudrais un café', 'J\'ai un café', 'Je bois un café'], correctIndex: 1 },
    ],
    German: [
        { id: 1, text: 'Translate "Thank you":', options: ['Bitte', 'Danke', 'Hallo', 'Tschüss'], correctIndex: 1 },
        { id: 2, text: 'Choose the correct form: "Ich ___ müde."', options: ['bin', 'bist', 'ist', 'sind'], correctIndex: 0 },
        { id: 3, text: 'What does "Apfel" mean?', options: ['Orange', 'Banana', 'Apple', 'Grape'], correctIndex: 2 },
        { id: 4, text: 'Translate "Where is the station?":', options: ['Wo ist der Bahnhof?', 'Wie ist der Bahnhof?', 'Wann ist der Bahnhof?', 'Warum ist der Bahnhof?'], correctIndex: 0 },
    ],
    Italian: [
        { id: 1, text: 'Translate "Please":', options: ['Grazie', 'Prego', 'Per favore', 'Ciao'], correctIndex: 2 },
        { id: 2, text: 'Choose the correct form: "Io ___ felice."', options: ['sei', 'è', 'siamo', 'sono'], correctIndex: 3 },
        { id: 3, text: 'What does "Libro" mean?', options: ['Book', 'Pen', 'Table', 'Chair'], correctIndex: 0 },
        { id: 4, text: 'Translate "I eat an apple":', options: ['Io mangio una mela', 'Io voglio una mela', 'Io ho una mela', 'Io vedo una mela'], correctIndex: 0 },
    ],
    Portuguese: [
        { id: 1, text: 'Translate "Good afternoon":', options: ['Bom dia', 'Boa tarde', 'Boa noite', 'Olá'], correctIndex: 1 },
        { id: 2, text: 'Choose the correct form: "Eu ___ do Brasil."', options: ['é', 'são', 'sou', 'somos'], correctIndex: 2 },
        { id: 3, text: 'What does "Água" mean?', options: ['Fire', 'Earth', 'Wind', 'Water'], correctIndex: 3 },
        { id: 4, text: 'Translate "How are you?":', options: ['Tudo bem?', 'Qual é o seu nome?', 'De onde você é?', 'Quantos anos você tem?'], correctIndex: 0 },
    ],
    Japanese: [
        { id: 1, text: 'Translate "Good morning":', options: ['Konnichiwa', 'Ohayou gozaimasu', 'Konbanwa', 'Arigatou'], correctIndex: 1 },
        { id: 2, text: 'Choose the correct particle: "Watashi ___ gakusei desu."', options: ['ga', 'ni', 'wa', 'o'], correctIndex: 2 },
        { id: 3, text: 'What does "Neko" mean?', options: ['Dog', 'Cat', 'Bird', 'Fish'], correctIndex: 1 },
        { id: 4, text: 'Translate "Thank you very much":', options: ['Sumimasen', 'Douzo', 'Arigatou gozaimasu', 'Gomennasai'], correctIndex: 2 },
    ],
};

const DEFAULT_QUESTIONS: Question[] = [
    { id: 1, text: 'What is the standard word order in this language?', options: ['S-V-O', 'S-O-V', 'V-S-O', 'I don\'t know'], correctIndex: 3 },
    { id: 2, text: 'Can you introduce yourself?', options: ['Yes, fluently', 'Yes, basic', 'A few words', 'Not at all'], correctIndex: 1 },
    { id: 3, text: 'How much vocabulary do you know?', options: ['>1000 words', '500-1000 words', '100-500 words', 'Less than 100 كلمات'], correctIndex: 2 },
];

export const AssessmentScreen: React.FC<Props> = ({ navigation, route }) => {
    const { language } = route.params;
    const targetLanguage = language || 'General';

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [showResult, setShowResult] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(1));

    const questions = QUIZ_DATA[targetLanguage] || DEFAULT_QUESTIONS;
    const currentQuestion = questions[currentQuestionIndex];

    const handleAnswer = (selectedIndex: number) => {
        // Determine accuracy based on type of question. Here we assume simple correct/incorrect.
        let isCorrect = selectedIndex === currentQuestion.correctIndex;

        // For default questions, simple heuristic (higher index = less proficiency, usually)
        if (!QUIZ_DATA[targetLanguage]) {
            // Just a mock scoring for unknown languages
            isCorrect = selectedIndex < 2;
        }

        if (isCorrect) {
            setScore(score + 1);
        }

        // Fade out
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
        }).start(() => {
            if (currentQuestionIndex < questions.length - 1) {
                setCurrentQuestionIndex(currentQuestionIndex + 1);
                // Fade in
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }).start();
            } else {
                setShowResult(true);
            }
        });
    };

    const getProficiencyResult = () => {
        const percentage = score / questions.length;
        if (percentage > 0.8) return 'Advanced';
        if (percentage >= 0.5) return 'Intermediate';
        return 'Beginner';
    };

    const finishAssessment = () => {
        const level = getProficiencyResult();
        navigation.navigate({
            name: 'Welcome',
            params: { assessmentResult: level.toLowerCase() },
            merge: true,
        });
    };

    if (showResult) {
        const finalLevel = getProficiencyResult();
        return (
            <View style={styles.container}>
                <StatusBar barStyle="light-content" />
                <LinearGradient
                    colors={['#2F5FED', '#1E40AF']}
                    style={styles.gradient}
                >
                    <View style={styles.resultContent}>
                        <Text style={styles.resultIcon}>🎉</Text>
                        <Text style={styles.resultTitle}>Assessment Complete!</Text>
                        <Text style={styles.resultSubtitle}>
                            Based on your answers, we recommend starting at:
                        </Text>

                        <View style={styles.levelCard}>
                            <Text style={styles.levelText}>{finalLevel}</Text>
                            <Text style={styles.levelDesc}>
                                {finalLevel === 'Beginner' ? 'We will start from the basics.' :
                                    finalLevel === 'Intermediate' ? 'We will focus on expanding your vocabulary and conversation skills.' :
                                        'We will challenge you with advanced topics and fluent dialogues.'}
                            </Text>
                        </View>

                        <TouchableOpacity style={styles.continueButton} onPress={finishAssessment}>
                            <Text style={styles.continueButtonText}>Continue Setup</Text>
                        </TouchableOpacity>
                    </View>
                </LinearGradient>
            </View>
        );
    }

    const progress = (currentQuestionIndex / questions.length) * 100;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header with Progress Bar */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => finishAssessment()} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{currentQuestionIndex + 1}/{questions.length}</Text>
            </View>

            {/* Main Content */}
            <Animated.View style={[styles.questionContainer, { opacity: fadeAnim }]}>
                <Text style={styles.questionCounter}>Question {currentQuestionIndex + 1}</Text>
                <Text style={styles.questionText}>{currentQuestion.text}</Text>

                <View style={styles.optionsContainer}>
                    {currentQuestion.options.map((option, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.optionButton}
                            onPress={() => handleAnswer(index)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.optionText}>{option}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Animated.View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFBFF',
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        marginBottom: 40,
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 20,
        color: '#6B7280',
        fontWeight: '600',
    },
    progressContainer: {
        flex: 1,
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        marginHorizontal: 16,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#2F5FED',
        borderRadius: 4,
    },
    progressText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
        width: 32,
        textAlign: 'center',
    },
    questionContainer: {
        flex: 1,
        paddingHorizontal: 24,
    },
    questionCounter: {
        fontSize: 14,
        fontWeight: '700',
        color: '#2F5FED',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 12,
    },
    questionText: {
        fontSize: 28,
        fontWeight: '800',
        color: '#1A1A1A',
        marginBottom: 40,
        lineHeight: 36,
    },
    optionsContainer: {
        gap: 16,
    },
    optionButton: {
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    optionText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        textAlign: 'center',
    },
    resultContent: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    resultIcon: {
        fontSize: 64,
        marginBottom: 24,
    },
    resultTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    resultSubtitle: {
        fontSize: 16,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: 32,
        textAlign: 'center',
        lineHeight: 24,
    },
    levelCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 32,
        width: '100%',
        alignItems: 'center',
        marginBottom: 48,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    levelText: {
        fontSize: 36,
        fontWeight: '900',
        color: '#2F5FED',
        marginBottom: 12,
    },
    levelDesc: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    continueButton: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 18,
        paddingHorizontal: 48,
        borderRadius: 30,
        width: '100%',
    },
    continueButtonText: {
        color: '#2F5FED',
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
    },
});
