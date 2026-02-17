import React, { createContext, useContext, useState, useCallback } from 'react';
import { Exercise, SessionAnswer, SessionSummary } from '../types';
import { calculateXP } from '../lib/engines/xpEngine';
import { adjustDifficulty } from '../lib/engines/adaptiveEngine';

interface SessionState {
    sessionId: string;
    lessonId: string;
    startTime: string;
    currentExerciseIndex: number;
    totalExercises: number;
    exercises: Exercise[];
    correctCount: number;
    incorrectCount: number;
    correctStreak: number;
    incorrectStreak: number;
    sessionXP: number;
    currentDifficulty: number;
    answers: SessionAnswer[];
}

interface SessionContextType extends SessionState {
    startSession: (lessonId: string, exercises: Exercise[]) => void;
    submitAnswer: (answer: SessionAnswer) => void;
    nextExercise: () => void;
    adjustSessionDifficulty: () => void;
    endSession: () => SessionSummary;
    resetSession: () => void;
    isSessionActive: boolean;
    getCurrentExercise: () => Exercise | null;
}

const SessionContext = createContext<SessionContextType | null>(null);

const initialState: SessionState = {
    sessionId: '',
    lessonId: '',
    startTime: '',
    currentExerciseIndex: 0,
    totalExercises: 0,
    exercises: [],
    correctCount: 0,
    incorrectCount: 0,
    correctStreak: 0,
    incorrectStreak: 0,
    sessionXP: 0,
    currentDifficulty: 1,
    answers: [],
};

export const SessionServiceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [state, setState] = useState<SessionState>(initialState);

    const startSession = useCallback((lessonId: string, exercises: Exercise[]) => {
        setState({
            sessionId: Date.now().toString(),
            lessonId,
            exercises,
            totalExercises: exercises.length,
            startTime: new Date().toISOString(),
            currentExerciseIndex: 0,
            correctCount: 0,
            incorrectCount: 0,
            correctStreak: 0,
            incorrectStreak: 0,
            sessionXP: 0,
            currentDifficulty: exercises[0]?.difficulty || 1,
            answers: [],
        });
    }, []);

    const submitAnswer = useCallback((answer: SessionAnswer) => {
        setState((prev) => {
            const newCorrectCount = answer.isCorrect ? prev.correctCount + 1 : prev.correctCount;
            const newIncorrectCount = !answer.isCorrect ? prev.incorrectCount + 1 : prev.incorrectCount;

            return {
                ...prev,
                answers: [...prev.answers, answer],
                sessionXP: prev.sessionXP + answer.xpEarned,
                correctCount: newCorrectCount,
                incorrectCount: newIncorrectCount,
                correctStreak: answer.isCorrect ? prev.correctStreak + 1 : 0,
                incorrectStreak: !answer.isCorrect ? prev.incorrectStreak + 1 : 0,
            };
        });
    }, []);

    const nextExercise = useCallback(() => {
        setState((prev) => ({
            ...prev,
            currentExerciseIndex: prev.currentExerciseIndex + 1,
        }));
    }, []);

    const adjustSessionDifficulty = useCallback(() => {
        setState((prev) => {
            const result = adjustDifficulty({
                currentDifficulty: prev.currentDifficulty,
                correctStreak: prev.correctStreak,
                incorrectStreak: prev.incorrectStreak,
                lastAnswerCorrect: prev.correctStreak > 0,
            });

            if (result.difficultyChanged) {
                console.log(`[SESSION] ${result.reason}`);
                return {
                    ...prev,
                    currentDifficulty: result.newDifficulty,
                    correctStreak: 0,
                    incorrectStreak: 0,
                };
            }

            return prev;
        });
    }, []);

    const endSession = useCallback((): SessionSummary => {
        const endTime = new Date();
        const startTime = new Date(state.startTime);
        const timeSpentMs = endTime.getTime() - startTime.getTime();

        return {
            totalXP: state.sessionXP,
            accuracy: state.totalExercises > 0 ? state.correctCount / state.totalExercises : 0,
            timeSpentMinutes: Math.round(timeSpentMs / 60000),
            exercisesCompleted: state.answers.length,
        };
    }, [state]);

    const resetSession = useCallback(() => {
        setState(initialState);
    }, []);

    const getCurrentExercise = useCallback((): Exercise | null => {
        if (state.currentExerciseIndex < state.exercises.length) {
            return state.exercises[state.currentExerciseIndex];
        }
        return null;
    }, [state.currentExerciseIndex, state.exercises]);

    const value: SessionContextType = {
        ...state,
        startSession,
        submitAnswer,
        nextExercise,
        adjustSessionDifficulty,
        endSession,
        resetSession,
        isSessionActive: state.sessionId !== '',
        getCurrentExercise,
    };

    return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSession must be used within SessionServiceProvider');
    }
    return context;
};
