import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Dimensions,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

const STEPS = [
  'welcome',
  'name',
  'native_language',
  'target_language',
  'proficiency',
  'goals',
  'daily_goal',
  'done',
];

import { LANGUAGES } from '../data/languages';

const PROFICIENCY_LEVELS = [
  {
    level: 'beginner',
    label: 'Beginner',
    description: 'Just starting out',
    icon: '🌱',
    color: '#DCFCE7',
    accent: '#16A34A',
  },
  {
    level: 'elementary',
    label: 'Elementary',
    description: 'Know some basics',
    icon: '🌿',
    color: '#FEF9C3',
    accent: '#CA8A04',
  },
  {
    level: 'intermediate',
    label: 'Intermediate',
    description: 'Can hold simple conversations',
    icon: '🌳',
    color: '#DBEAFE',
    accent: '#2563EB',
  },
  {
    level: 'advanced',
    label: 'Advanced',
    description: 'Fluent in most situations',
    icon: '🚀',
    color: '#F3E8FF',
    accent: '#7C3AED',
  },
];

const GOALS = [
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'career', label: 'Career', icon: '💼' },
  { id: 'culture', label: 'Culture', icon: '🎭' },
  { id: 'family', label: 'Family', icon: '👨‍👩‍👧' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'fun', label: 'Just for fun', icon: '🎉' },
];

const DAILY_GOALS = [
  { minutes: 5, label: '5 min', description: 'Casual', icon: '☕', xp: 20 },
  { minutes: 10, label: '10 min', description: 'Regular', icon: '🎯', xp: 50 },
  { minutes: 20, label: '20 min', description: 'Serious', icon: '💪', xp: 100 },
  { minutes: 30, label: '30 min', description: 'Intense', icon: '🔥', xp: 150 },
];

export const SetupScreen = ({ onComplete }: { onComplete: (data: any) => void }) => {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [nativeLanguage, setNativeLanguage] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string | null>(null);
  const [proficiency, setProficiency] = useState<string | null>(null);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [dailyGoal, setDailyGoal] = useState<number | null>(null);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -30,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const goNext = () => {
    animateTransition(() => setStep((s) => s + 1));
  };

  const goBack = () => {
    if (step === 0) return;
    animateTransition(() => setStep((s) => s - 1));
  };

  const toggleGoal = (id: string) => {
    setSelectedGoals((prev: string[]) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
    const setupData = {
      name,
      nativeLanguage,
      targetLanguage,
      proficiency,
      goals: selectedGoals,
      dailyGoalMinutes: dailyGoal,
      setupCompletedAt: new Date().toISOString(),
    };
    try {
      await AsyncStorage.setItem('@setup_complete', 'true');
      await AsyncStorage.setItem('@user_profile', JSON.stringify(setupData));
      onComplete(setupData);
    } catch (e) {
      console.error('Failed to save setup:', e);
    }
  };

  const canProceed = () => {
    switch (STEPS[step]) {
      case 'name': return name.trim().length >= 2;
      case 'native_language': return nativeLanguage !== null;
      case 'target_language': return targetLanguage !== null && targetLanguage !== nativeLanguage;
      case 'proficiency': return proficiency !== null;
      case 'goals': return selectedGoals.length >= 1;
      case 'daily_goal': return dailyGoal !== null;
      default: return true;
    }
  };

  const progress = step / (STEPS.length - 1);

  const renderStep = () => {
    switch (STEPS[step]) {
      // ─── WELCOME ─────────────────────────────────────────────
      case 'welcome':
        return (
          <View style={styles.stepContainer}>
            <View style={styles.welcomeIllustration}>
              <LinearGradient
                colors={['#2F5FED', '#6B94FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.welcomeGradientCircle}
              />
              <View style={styles.welcomeInnerCircle}>
                <Text style={styles.welcomeEmoji}>🌍</Text>
              </View>
              <View style={styles.welcomeOrbit1}>
                <View style={styles.orbitDot} />
              </View>
              <View style={styles.welcomeOrbit2}>
                <View style={[styles.orbitDot, { backgroundColor: '#FCD34D' }]} />
              </View>
            </View>

            <Text style={styles.welcomeTitle}>Welcome to</Text>
            <Text style={styles.welcomeAppName}>LinguaAI</Text>
            <Text style={styles.welcomeTagline}>
              Your personal AI language tutor.{'\n'}
              Let's get you set up in just a minute.
            </Text>

            <View style={styles.welcomeFeatures}>
              {[
                { icon: '🤖', text: 'AI-powered conversations' },
                { icon: '📈', text: 'Personalised learning path' },
                { icon: '🎯', text: 'Track your daily goals' },
              ].map((f) => (
                <View key={f.text} style={styles.featureRow}>
                  <Text style={styles.featureIcon}>{f.icon}</Text>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>
        );

      // ─── NAME ─────────────────────────────────────────────────
      case 'name':
        return (
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.stepContainer}
          >
            <Text style={styles.stepEmoji}>👋</Text>
            <Text style={styles.stepTitle}>What's your name?</Text>
            <Text style={styles.stepSubtitle}>
              We'll personalise your experience just for you.
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your name"
                placeholderTextColor="#9CA3AF"
                value={name}
                onChangeText={setName}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={() => canProceed() && goNext()}
              />
              {name.length >= 2 && (
                <View style={styles.inputCheck}>
                  <Text style={styles.inputCheckText}>✓</Text>
                </View>
              )}
            </View>
          </KeyboardAvoidingView>
        );

      // ─── NATIVE LANGUAGE ──────────────────────────────────────
      case 'native_language':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>🗣️</Text>
            <Text style={styles.stepTitle}>Your native language?</Text>
            <Text style={styles.stepSubtitle}>
              Select the language you speak at home.
            </Text>
            <ScrollView
              style={styles.listScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.languageGrid}>
                {LANGUAGES.map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageCard,
                      nativeLanguage === lang.code && styles.languageCardActive,
                    ]}
                    onPress={() => setNativeLanguage(lang.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text
                      style={[
                        styles.languageLabel,
                        nativeLanguage === lang.code && styles.languageLabelActive,
                      ]}
                    >
                      {lang.label}
                    </Text>
                    {nativeLanguage === lang.code && (
                      <View style={styles.selectedDot} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        );

      // ─── TARGET LANGUAGE ──────────────────────────────────────
      case 'target_language':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>🎓</Text>
            <Text style={styles.stepTitle}>What do you want{'\n'}to learn?</Text>
            <Text style={styles.stepSubtitle}>
              Pick the language you'd love to master.
            </Text>
            <ScrollView
              style={styles.listScroll}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.languageGrid}>
                {LANGUAGES.filter((l) => l.code !== nativeLanguage).map((lang) => (
                  <TouchableOpacity
                    key={lang.code}
                    style={[
                      styles.languageCard,
                      targetLanguage === lang.code && styles.languageCardActive,
                    ]}
                    onPress={() => setTargetLanguage(lang.code)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.languageFlag}>{lang.flag}</Text>
                    <Text
                      style={[
                        styles.languageLabel,
                        targetLanguage === lang.code && styles.languageLabelActive,
                      ]}
                    >
                      {lang.label}
                    </Text>
                    {targetLanguage === lang.code && (
                      <View style={styles.selectedDot} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        );

      // ─── PROFICIENCY ──────────────────────────────────────────
      case 'proficiency':
        const targetLang = LANGUAGES.find((l) => l.code === targetLanguage);
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>{targetLang?.flag || '📊'}</Text>
            <Text style={styles.stepTitle}>
              Your {targetLang?.label} level?
            </Text>
            <Text style={styles.stepSubtitle}>
              Be honest — we'll tailor everything to where you are.
            </Text>
            <View style={styles.proficiencyList}>
              {PROFICIENCY_LEVELS.map((p) => (
                <TouchableOpacity
                  key={p.level}
                  style={[
                    styles.proficiencyCard,
                    proficiency === p.level && {
                      borderColor: p.accent,
                      borderWidth: 2,
                      backgroundColor: p.color,
                    },
                  ]}
                  onPress={() => setProficiency(p.level)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.proficiencyIconBox,
                      { backgroundColor: p.color },
                    ]}
                  >
                    <Text style={styles.proficiencyIcon}>{p.icon}</Text>
                  </View>
                  <View style={styles.proficiencyText}>
                    <Text style={styles.proficiencyLabel}>{p.label}</Text>
                    <Text style={styles.proficiencyDesc}>{p.description}</Text>
                  </View>
                  {proficiency === p.level ? (
                    <View style={[styles.radioFilled, { backgroundColor: p.accent }]}>
                      <Text style={styles.radioCheck}>✓</Text>
                    </View>
                  ) : (
                    <View style={styles.radioEmpty} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      // ─── GOALS ────────────────────────────────────────────────
      case 'goals':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>🎯</Text>
            <Text style={styles.stepTitle}>Why are you learning?</Text>
            <Text style={styles.stepSubtitle}>
              Select all that apply — your AI tutor will focus on these.
            </Text>
            <View style={styles.goalsGrid}>
              {GOALS.map((g) => {
                const active = selectedGoals.includes(g.id);
                return (
                  <TouchableOpacity
                    key={g.id}
                    style={[styles.goalCard, active && styles.goalCardActive]}
                    onPress={() => toggleGoal(g.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.goalIcon}>{g.icon}</Text>
                    <Text style={[styles.goalLabel, active && styles.goalLabelActive]}>
                      {g.label}
                    </Text>
                    {active && <View style={styles.goalCheckBadge}><Text style={styles.goalCheckText}>✓</Text></View>}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      // ─── DAILY GOAL ───────────────────────────────────────────
      case 'daily_goal':
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepEmoji}>⏱️</Text>
            <Text style={styles.stepTitle}>Daily practice goal</Text>
            <Text style={styles.stepSubtitle}>
              Consistency beats intensity. Pick what fits your life.
            </Text>
            <View style={styles.dailyGoalList}>
              {DAILY_GOALS.map((d) => {
                const active = dailyGoal === d.minutes;
                return (
                  <TouchableOpacity
                    key={d.minutes}
                    style={[styles.dailyGoalCard, active && styles.dailyGoalCardActive]}
                    onPress={() => setDailyGoal(d.minutes)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.dailyGoalIcon}>{d.icon}</Text>
                    <View style={styles.dailyGoalTextBlock}>
                      <Text style={[styles.dailyGoalMinutes, active && styles.dailyGoalMinutesActive]}>
                        {d.label} / day
                      </Text>
                      <Text style={styles.dailyGoalDesc}>{d.description}</Text>
                    </View>
                    <View style={[styles.xpPill, active && styles.xpPillActive]}>
                      <Text style={[styles.xpPillText, active && styles.xpPillTextActive]}>
                        ⚡ {d.xp} XP
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      // ─── DONE ─────────────────────────────────────────────────
      case 'done':
        const selectedTarget = LANGUAGES.find((l) => l.code === targetLanguage);
        return (
          <View style={[styles.stepContainer, { alignItems: 'center' }]}>
            <LinearGradient
              colors={['#2F5FED', '#6B94FF']}
              style={styles.doneCircle}
            >
              <Text style={styles.doneCheckmark}>✓</Text>
            </LinearGradient>
            <Text style={styles.doneTitle}>You're all set,{'\n'}{name}! 🎉</Text>
            <Text style={styles.doneSubtitle}>
              Your AI tutor is ready to help you{'\n'}
              master {selectedTarget?.label} {selectedTarget?.flag}
            </Text>
            <View style={styles.doneSummaryCard}>
              <SummaryRow icon="🗺️" label="Learning" value={`${selectedTarget?.flag} ${selectedTarget?.label}`} />
              <SummaryRow icon="📊" label="Level" value={proficiency ? proficiency.charAt(0).toUpperCase() + proficiency.slice(1) : ''} />
              <SummaryRow icon="🎯" label="Goals" value={selectedGoals.length > 0 ? `${selectedGoals.length} selected` : '—'} />
              <SummaryRow icon="⏱️" label="Daily goal" value={`${dailyGoal} min / day`} last />
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  const isLastStep = STEPS[step] === 'done';
  const isWelcome = STEPS[step] === 'welcome';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Progress bar */}
      {!isWelcome && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarTrack}>
            <Animated.View
              style={[styles.progressBarFill, { width: `${progress * 100}%` }]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {step} / {STEPS.length - 1}
          </Text>
        </View>
      )}

      {/* Back button */}
      {step > 0 && !isLastStep && (
        <TouchableOpacity style={styles.backButton} onPress={goBack}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
      )}

      {/* Step content */}
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {renderStep()}
      </Animated.View>

      {/* CTA Button */}
      <View style={styles.footer}>
        {isLastStep ? (
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleComplete}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#2F5FED', '#4B7BFF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Start Learning →</Text>
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.ctaButton, !canProceed() && styles.ctaButtonDisabled]}
            onPress={canProceed() ? goNext : undefined}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canProceed() ? ['#2F5FED', '#4B7BFF'] : ['#D1D5DB', '#D1D5DB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={[styles.ctaText, !canProceed() && styles.ctaTextDisabled]}>
                {isWelcome ? "Let's Begin →" : 'Continue →'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ─── Summary Row ─────────────────────────────────────────────────────────────
const SummaryRow = ({ icon, label, value, last }: { icon: string, label: string, value: string, last?: boolean }) => (
  <View style={[styles.summaryRow, !last && styles.summaryRowBorder]}>
    <Text style={styles.summaryIcon}>{icon}</Text>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={styles.summaryValue}>{value}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
    paddingTop: StatusBar.currentHeight || 44,
  },

  // Progress
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 8,
    marginBottom: 4,
    gap: 10,
  },
  progressBarTrack: {
    flex: 1,
    height: 5,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2F5FED',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
    width: 36,
    textAlign: 'right',
  },

  // Back button
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 20,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 18,
    color: '#374151',
  },

  // Content
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  stepContainer: {
    flex: 1,
  },

  // Footer
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 12,
  },
  ctaButton: {
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#2F5FED',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  ctaTextDisabled: {
    color: '#9CA3AF',
  },

  // ── Welcome ──────────────────────────────────────────────
  welcomeIllustration: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 180,
    marginTop: 12,
    marginBottom: 28,
  },
  welcomeGradientCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.15,
    position: 'absolute',
  },
  welcomeInnerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2F5FED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 8,
  },
  welcomeEmoji: {
    fontSize: 52,
  },
  welcomeOrbit1: {
    position: 'absolute',
    top: 14,
    right: width / 2 - 110,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0EAFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeOrbit2: {
    position: 'absolute',
    bottom: 18,
    left: width / 2 - 120,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  orbitDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2F5FED',
  },
  welcomeTitle: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 4,
  },
  welcomeAppName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 14,
  },
  welcomeTagline: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  welcomeFeatures: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  featureIcon: {
    fontSize: 22,
  },
  featureText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1A',
  },

  // ── Shared step header ────────────────────────────────────
  stepEmoji: {
    fontSize: 52,
    marginBottom: 16,
    marginTop: 8,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
    marginBottom: 8,
    lineHeight: 36,
  },
  stepSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 24,
  },

  // ── Name input ────────────────────────────────────────────
  inputWrapper: {
    position: 'relative',
    marginTop: 8,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  inputCheck: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -14,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputCheckText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ── Language grid ─────────────────────────────────────────
  listScroll: {
    flex: 1,
    marginTop: 4,
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: 16,
  },
  languageCard: {
    width: (width - 48 - 20) / 3,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  languageCardActive: {
    borderColor: '#2F5FED',
    backgroundColor: '#EEF2FF',
  },
  languageFlag: {
    fontSize: 28,
  },
  languageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
  },
  languageLabelActive: {
    color: '#2F5FED',
  },
  selectedDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#2F5FED',
  },

  // ── Proficiency ───────────────────────────────────────────
  proficiencyList: {
    gap: 12,
  },
  proficiencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  proficiencyIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proficiencyIcon: {
    fontSize: 26,
  },
  proficiencyText: {
    flex: 1,
  },
  proficiencyLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  proficiencyDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  radioEmpty: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioFilled: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCheck: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ── Goals grid ────────────────────────────────────────────
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    width: (width - 48 - 12) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  goalCardActive: {
    borderColor: '#2F5FED',
    backgroundColor: '#EEF2FF',
  },
  goalIcon: {
    fontSize: 32,
  },
  goalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    textAlign: 'center',
  },
  goalLabelActive: {
    color: '#2F5FED',
  },
  goalCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2F5FED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalCheckText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Daily goal ────────────────────────────────────────────
  dailyGoalList: {
    gap: 12,
  },
  dailyGoalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#F3F4F6',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  dailyGoalCardActive: {
    borderColor: '#2F5FED',
    backgroundColor: '#EEF2FF',
  },
  dailyGoalIcon: {
    fontSize: 28,
  },
  dailyGoalTextBlock: {
    flex: 1,
  },
  dailyGoalMinutes: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  dailyGoalMinutesActive: {
    color: '#2F5FED',
  },
  dailyGoalDesc: {
    fontSize: 13,
    color: '#6B7280',
  },
  xpPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  xpPillActive: {
    backgroundColor: '#DBEAFE',
  },
  xpPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
  },
  xpPillTextActive: {
    color: '#1D4ED8',
  },

  // ── Done screen ───────────────────────────────────────────
  doneCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
    shadowColor: '#2F5FED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  doneCheckmark: {
    fontSize: 44,
    color: '#FFFFFF',
  },
  doneTitle: {
    fontSize: 30,
    fontWeight: '800',
    color: '#1A1A1A',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 12,
    lineHeight: 38,
  },
  doneSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  doneSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 12,
  },
  summaryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryIcon: {
    fontSize: 20,
    width: 28,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
  },
});