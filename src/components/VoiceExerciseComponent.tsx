import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  NativeModules,
  Platform,
  PermissionsAndroid,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { RunAnywhere } from '@runanywhere/core';
import { useModelService } from '../services/ModelService';
import { AppColors } from '../theme';

const { NativeAudioModule } = NativeModules;

interface VoiceExerciseComponentProps {
  exerciseType: 'tts' | 'stt';
  question: string;
  expectedAnswer: string;
  onAnswerSubmit: (answer: string, isCorrect: boolean) => void;
  hideInstructions?: boolean;
  targetLanguage?: string;
}

const getLanguageCode = (lang?: string): string => {
  if (!lang) return 'en';
  const l = lang.toLowerCase();
  switch (l) {
    case 'spanish': return 'es';
    case 'french': return 'fr';
    case 'german': return 'de';
    case 'italian': return 'it';
    case 'japanese': return 'ja';
    case 'korean': return 'ko';
    case 'chinese':
    case 'mandarin': return 'zh';
    case 'russian': return 'ru';
    case 'portuguese': return 'pt';
    case 'dutch': return 'nl';
    default: return 'en';
  }
};

export const VoiceExerciseComponent: React.FC<VoiceExerciseComponentProps> = ({
  exerciseType,
  question,
  expectedAnswer,
  onAnswerSubmit,
  hideInstructions,
  targetLanguage,
}) => {
  const modelService = useModelService();

  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const audioLevelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const recordingStartRef = useRef<number>(0);

  useEffect(() => {
    return () => {
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
      }
      if (isRecording && NativeAudioModule) {
        NativeAudioModule.cancelRecording().catch(() => { });
      }
      if (isPlaying && NativeAudioModule) {
        NativeAudioModule.stopPlayback().catch(() => { });
      }
    };
  }, [isRecording, isPlaying]);

  const startRecording = async () => {
    try {
      if (!NativeAudioModule) {
        console.error('[VoiceExercise] NativeAudioModule not available');
        return;
      }

      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'This app needs access to your microphone.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          return;
        }
      }

      await NativeAudioModule.startRecording();
      recordingStartRef.current = Date.now();
      setIsRecording(true);
      setUserAnswer('');

      audioLevelIntervalRef.current = setInterval(async () => {
        try {
          const levelResult = await NativeAudioModule.getAudioLevel();
          setAudioLevel(levelResult.level || 0);
        } catch (e) { }
      }, 100);
    } catch (error) {
      console.error('[VoiceExercise] Recording error:', error);
    }
  };

  const stopRecordingAndTranscribe = async () => {
    try {
      if (audioLevelIntervalRef.current) {
        clearInterval(audioLevelIntervalRef.current);
        audioLevelIntervalRef.current = null;
      }

      const result = await NativeAudioModule.stopRecording();
      setIsRecording(false);
      setAudioLevel(0);
      setIsTranscribing(true);

      const audioBase64 = result.audioBase64;
      if (!audioBase64) {
        throw new Error('No audio data received');
      }

      const isModelLoaded = await RunAnywhere.isSTTModelLoaded();
      if (!isModelLoaded) {
        throw new Error('STT model not loaded');
      }

      const langCode = getLanguageCode(targetLanguage);
      const transcribeResult = await RunAnywhere.transcribe(audioBase64, {
        sampleRate: 16000,
        language: langCode,
      });

      if (transcribeResult.text) {
        setUserAnswer(transcribeResult.text);
      } else {
        setUserAnswer('(No speech detected)');
      }

      setIsTranscribing(false);
    } catch (error) {
      console.error('[VoiceExercise] Transcription error:', error);
      setIsTranscribing(false);
    }
  };

  const synthesizeAndPlay = async (text: string) => {
    setIsSynthesizing(true);
    try {
      const langCode = getLanguageCode(targetLanguage);
      const result = await RunAnywhere.synthesize(text, {
        voice: langCode === 'en' ? 'default' : langCode,
        language: langCode,
        rate: 1.0,
        pitch: 1.0,
        volume: 1.0,
      });

      const tempPath = await RunAnywhere.Audio.createWavFromPCMFloat32(
        result.audio,
        result.sampleRate || 22050
      );

      setIsSynthesizing(false);
      setIsPlaying(true);

      if (NativeAudioModule) {
        await NativeAudioModule.playAudio(tempPath);

        setTimeout(() => {
          setIsPlaying(false);
        }, result.duration * 1000 + 500);
      }
    } catch (error) {
      console.error('[VoiceExercise] TTS error:', error);
      setIsSynthesizing(false);
    }
  };

  const handleSubmit = () => {
    if (exerciseType === 'stt') {
      const correct = userAnswer.toLowerCase().trim() === expectedAnswer.toLowerCase().trim();
      setIsCorrect(correct);
      setShowResult(true);
      setTimeout(() => {
        onAnswerSubmit(userAnswer, correct);
      }, 2000);
    } else {
      setShowResult(true);
      setIsCorrect(true);
      setTimeout(() => {
        onAnswerSubmit(expectedAnswer, true);
      }, 2000);
    }
  };

  const renderSTTExercise = () => (
    <View style={styles.voiceContainer}>
      <Text style={styles.instructionText}>
        Press the microphone and speak the answer aloud
      </Text>

      <TouchableOpacity
        style={[styles.micButton, isRecording && styles.micButtonActive]}
        onPress={isRecording ? stopRecordingAndTranscribe : startRecording}
        disabled={isTranscribing}
      >
        <LinearGradient
          colors={isRecording ? [AppColors.error, '#DC2626'] : [AppColors.accentViolet, '#7C3AED']}
          style={styles.micGradient}
        >
          {isTranscribing ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎤'}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {isRecording && (
        <View style={styles.audioLevelContainer}>
          <View style={[styles.audioLevelBar, { width: `${audioLevel * 100}%` }]} />
        </View>
      )}

      {userAnswer ? (
        <View style={styles.recognizedTextContainer}>
          <Text style={styles.recognizedLabel}>You said:</Text>
          <Text style={styles.recognizedText}>{userAnswer}</Text>
        </View>
      ) : null}

      {userAnswer && !showResult && (
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Check Answer</Text>
        </TouchableOpacity>
      )}

      {showResult && (
        <View style={[styles.resultContainer, isCorrect ? styles.resultSuccess : styles.resultError]}>
          <Text style={styles.resultIcon}>{isCorrect ? '✅' : '❌'}</Text>
          <Text style={styles.resultText}>
            {isCorrect ? 'Correct!' : `Expected: ${expectedAnswer}`}
          </Text>
        </View>
      )}
    </View>
  );

  const renderTTSExercise = () => (
    <View style={styles.voiceContainer}>
      {!hideInstructions && (
        <Text style={styles.instructionText}>
          Listen to the phrase, then practice speaking it
        </Text>
      )}

      {question ? (
        <View style={styles.questionBox}>
          <Text style={styles.questionText}>{question}</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.micButton, isPlaying && styles.micButtonActive]}
        onPress={() => !isPlaying && synthesizeAndPlay(expectedAnswer)}
        disabled={isSynthesizing || isPlaying}
      >
        <LinearGradient
          colors={[AppColors.accentPink, '#DB2777']}
          style={styles.micGradient}
        >
          {isSynthesizing ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <Text style={styles.micIcon}>{isPlaying ? '🔊' : '▶️'}</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {isPlaying && (
        <Text style={styles.playingText}>Playing...</Text>
      )}

      {!hideInstructions && (
        <>
          <Text style={styles.practiceText}>
            Now practice saying it aloud!
          </Text>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>I've Practiced</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      {!modelService.isSTTLoaded && exerciseType === 'stt' && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>⚠️ STT model not loaded</Text>
          <Text style={styles.warningSubtext}>Please download the speech recognition model first</Text>
        </View>
      )}

      {!modelService.isTTSLoaded && exerciseType === 'tts' && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>⚠️ TTS model not loaded</Text>
          <Text style={styles.warningSubtext}>Please download the voice synthesis model first</Text>
        </View>
      )}

      {exerciseType === 'stt' ? renderSTTExercise() : renderTTSExercise()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  warningContainer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  warningSubtext: {
    fontSize: 12,
    color: '#92400E',
    marginTop: 4,
  },
  voiceContainer: {
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  micButton: {
    marginVertical: 16,
  },
  micButtonActive: {
    transform: [{ scale: 1.1 }],
  },
  micGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micIcon: {
    fontSize: 32,
  },
  audioLevelContainer: {
    width: 200,
    height: 8,
    backgroundColor: AppColors.surfaceCard,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 16,
  },
  audioLevelBar: {
    height: '100%',
    backgroundColor: AppColors.accentViolet,
  },
  recognizedTextContainer: {
    backgroundColor: AppColors.surfaceCard,
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  recognizedLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    marginBottom: 4,
  },
  recognizedText: {
    fontSize: 16,
    color: AppColors.textPrimary,
    fontWeight: '500',
  },
  questionBox: {
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 16,
  },
  questionText: {
    fontSize: 16,
    color: AppColors.primaryMid,
    fontWeight: '500',
    textAlign: 'center',
  },
  playingText: {
    fontSize: 14,
    color: AppColors.accentPink,
    marginBottom: 8,
  },
  practiceText: {
    fontSize: 14,
    color: AppColors.textSecondary,
    marginBottom: 16,
  },
  submitButton: {
    backgroundColor: AppColors.primary,
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    width: '100%',
  },
  resultSuccess: {
    backgroundColor: '#DCFCE7',
  },
  resultError: {
    backgroundColor: '#FEE2E2',
  },
  resultIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
});
