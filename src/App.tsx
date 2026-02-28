import 'react-native-gesture-handler'; // Must be at the top!
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import { StatusBar } from 'react-native';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Note: react-native-screens is shimmed in index.js for iOS New Architecture compatibility
import { RunAnywhere, SDKEnvironment } from '@runanywhere/core';
import { LlamaCPP } from '@runanywhere/llamacpp';
import { ONNX } from '@runanywhere/onnx';
import { ModelServiceProvider, registerDefaultModels, useModelService } from './services/ModelService';
import { UserProgressProvider } from './services/UserProgressService';
import { SessionServiceProvider } from './services/SessionService';
import { AppColors } from './theme';
import {
  HomeScreen,
  ChatScreen,
  ToolCallingScreen,
  SpeechToTextScreen,
  TextToSpeechScreen,
  VoicePipelineScreen,
  PracticeScreen,
  ConversationPracticeScreen,
  PronunciationPracticeScreen,
  GrammarPracticeScreen,
  ProgressScreen,
  RankingScreen,
  ProfileScreen,
} from './screens';
import { WelcomeScreen } from './screens/WelcomeScreen';
import { AssessmentScreen } from './screens/AssessmentScreen';
import { TransitionScreen } from './screens/TransitionScreen';
import { RootStackParamList } from './navigation/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Using JS-based stack navigator instead of native-stack
// to avoid react-native-screens setColor crash with New Architecture
const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [setupComplete, setSetupComplete] = useState(false);

  useEffect(() => {

    // Initialize SDK
    const initializeSDK = async () => {
      try {
        // Initialize RunAnywhere SDK (Development mode doesn't require API key)
        await RunAnywhere.initialize({
          environment: SDKEnvironment.Development,
        });

        LlamaCPP.register();
        ONNX.register();

        // Register default models
        await registerDefaultModels();

        console.log('RunAnywhere SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize RunAnywhere SDK:', error);
      }
    };

    const init = async () => {
      await initializeSDK();
      await checkSetupStatus();
    };

    init();
  }, []);

  const checkSetupStatus = async () => {
    try {
      const value = await AsyncStorage.getItem('@setup_complete');
      setSetupComplete(value === 'true');
    } catch (e) {
      console.error('Failed to read setup status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const AutoModelLoader = () => {
    const { downloadAndLoadAllModels, modelError, isVoiceAgentReady } = useModelService();
    const [hasAttempted, setHasAttempted] = useState(false);

    useEffect(() => {
      if (!hasAttempted && !isVoiceAgentReady && !modelError) {
        console.log('Auto-loading all AI models on boot...');
        setHasAttempted(true);
        downloadAndLoadAllModels();
      }
    }, [downloadAndLoadAllModels, hasAttempted, isVoiceAgentReady, modelError]);

    return null;
  };

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#2F5FED" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <ModelServiceProvider>
        <UserProgressProvider>
          <SessionServiceProvider>
            <AutoModelLoader />
            <StatusBar barStyle="light-content" backgroundColor={AppColors.primaryDark} />
            <NavigationContainer>

              <Stack.Navigator
                screenOptions={{
                  headerShown: false,
                  headerStyle: {
                    backgroundColor: AppColors.primaryDark,
                    elevation: 0,
                    shadowOpacity: 0,
                  },
                  headerTintColor: AppColors.textPrimary,
                  headerTitleStyle: {
                    fontWeight: '700',
                    fontSize: 18,
                  },
                  cardStyle: {
                    backgroundColor: AppColors.primaryDark,
                  },
                  // iOS-like animations
                  ...TransitionPresets.SlideFromRightIOS,
                }}
                initialRouteName={setupComplete ? 'Home' : 'Welcome'}
              >
                <Stack.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Chat"
                  component={ChatScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ToolCalling"
                  component={ToolCallingScreen}
                  options={{ title: 'Interactive Tools', headerShown: true }}
                />
                <Stack.Screen
                  name="Practice"
                  component={PracticeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ConversationPractice"
                  component={ConversationPracticeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="PronunciationPractice"
                  component={PronunciationPracticeScreen}
                  options={{ title: 'Pronunciation Practice' }}
                />
                <Stack.Screen
                  name="GrammarPractice"
                  component={GrammarPracticeScreen}
                  options={{ title: 'Grammar Practice' }}
                />
                <Stack.Screen
                  name="SpeechToText"
                  component={SpeechToTextScreen}
                  options={{ title: 'Listening Lab' }}
                />
                <Stack.Screen
                  name="TextToSpeech"
                  component={TextToSpeechScreen}
                  options={{ title: 'Speaking Lab' }}
                />
                <Stack.Screen
                  name="VoicePipeline"
                  component={VoicePipelineScreen}
                  options={{ title: 'Full Conversation' }}
                />
                <Stack.Screen
                  name="Progress"
                  component={ProgressScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Ranking"
                  component={RankingScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Profile"
                  component={ProfileScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Welcome"
                  component={WelcomeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Assessment"
                  component={AssessmentScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Transition"
                  component={TransitionScreen}
                  options={{ headerShown: false }}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </SessionServiceProvider>
        </UserProgressProvider>
      </ModelServiceProvider>
    </GestureHandlerRootView>
  );
};

export default App;
const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
  },
  splash: {
    flex: 1,
    backgroundColor: '#FAFBFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});