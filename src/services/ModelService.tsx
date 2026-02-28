import React, { createContext, useContext, useState, useCallback } from 'react';
import { RunAnywhere, ModelCategory } from '@runanywhere/core';
import { LlamaCPP } from '@runanywhere/llamacpp';
import { ONNX, ModelArtifactType } from '@runanywhere/onnx';

// Model IDs - matching sample app model registry
// See: /Users/shubhammalhotra/Desktop/test-fresh/runanywhere-sdks/examples/react-native/RunAnywhereAI/App.tsx
const MODEL_IDS = {
  llm: 'qwen2.5-0.5b-instruct-q4_k_m_v2', // Changed ID to force redownload, bypassing corrupted cached Qwen3 model
} as const;

export const TTS_VOICES = {
  en: {
    id: 'vits-piper-en_US-lessac-medium',
    name: 'English (US)',
    url: 'https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/vits-piper-en_US-lessac-medium.tar.gz',
  },
  es: {
    id: 'vits-piper-es_ES-carlfm-medium',
    name: 'Spanish',
    url: 'https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/vits-piper-es_ES-carlfm-medium.tar.gz',
  },
  fr: {
    id: 'vits-piper-fr_FR-siwis-medium',
    name: 'French',
    url: 'https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/vits-piper-fr_FR-siwis-medium.tar.gz',
  },
  de: {
    id: 'vits-piper-de_DE-thorsten-medium',
    name: 'German',
    url: 'https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/vits-piper-de_DE-thorsten-medium.tar.gz',
  },
};

export const MULTILINGUAL_STT_MODEL = {
  id: 'sherpa-onnx-whisper-tiny-en-v2', // Changed ID to bypass corrupted bz2 cache
  name: 'Sherpa Whisper Tiny (English HQ)',
  url: 'https://github.com/RunanywhereAI/sherpa-onnx/releases/download/runanywhere-models-v1/sherpa-onnx-whisper-tiny.en.tar.gz?download=true',
};

export type SupportedLanguage = keyof typeof TTS_VOICES;

interface ModelServiceState {
  // Download state
  isLLMDownloading: boolean;
  isSTTDownloading: boolean;
  isTTSDownloading: boolean;

  // Error state
  modelError: string | null;

  // Load state
  isLLMLoading: boolean;
  isSTTLoading: boolean;
  isTTSLoading: boolean;

  // Loaded state
  isLLMLoaded: boolean;
  isSTTLoaded: boolean;
  isTTSLoaded: boolean;

  isVoiceAgentReady: boolean;
  activeLanguage: SupportedLanguage;
  setActiveLanguage: (lang: SupportedLanguage) => Promise<void>;
  downloadAndLoadLLM: () => Promise<void>;
  downloadAndLoadSTT: () => Promise<void>;
  downloadAndLoadTTS: () => Promise<void>;
  downloadAndLoadAllModels: () => Promise<void>;
  unloadAllModels: () => Promise<void>;
}

// Global Event Emitter for progress to prevent whole-tree Context re-renders
export const ProgressEmitter = {
  listeners: new Map<string, Array<(progress: number) => void>>(),

  emit(modelId: string, progress: number) {
    const callbacks = this.listeners.get(modelId);
    if (callbacks) {
      callbacks.forEach(cb => cb(progress));
    }
  },

  subscribe(modelId: string, callback: (progress: number) => void) {
    if (!this.listeners.has(modelId)) {
      this.listeners.set(modelId, []);
    }
    this.listeners.get(modelId)!.push(callback);

    return () => {
      const callbacks = this.listeners.get(modelId);
      if (callbacks) {
        this.listeners.set(modelId, callbacks.filter(cb => cb !== callback));
      }
    };
  }
};

const ModelServiceContext = createContext<ModelServiceState | null>(null);

export const useModelService = () => {
  const context = useContext(ModelServiceContext);
  if (!context) {
    throw new Error('useModelService must be used within ModelServiceProvider');
  }
  return context;
};

interface ModelServiceProviderProps {
  children: React.ReactNode;
}

export const ModelServiceProvider: React.FC<ModelServiceProviderProps> = ({ children }) => {
  // Download state
  const [isLLMDownloading, setIsLLMDownloading] = useState(false);
  const [isSTTDownloading, setIsSTTDownloading] = useState(false);
  const [isTTSDownloading, setIsTTSDownloading] = useState(false);

  // Error state
  const [modelError, setModelError] = useState<string | null>(null);

  // Load state
  const [isLLMLoading, setIsLLMLoading] = useState(false);
  const [isSTTLoading, setIsSTTLoading] = useState(false);
  const [isTTSLoading, setIsTTSLoading] = useState(false);

  // Loaded state
  const [isLLMLoaded, setIsLLMLoaded] = useState(false);
  const [isSTTLoaded, setIsSTTLoaded] = useState(false);
  const [isTTSLoaded, setIsTTSLoaded] = useState(false);

  // Active language
  const [activeLanguage, setActiveLanguageState] = useState<SupportedLanguage>('en');

  const isVoiceAgentReady = isLLMLoaded && isSTTLoaded && isTTSLoaded;

  // Check if model is downloaded (per docs: use getModelInfo and check localPath)
  const checkModelDownloaded = useCallback(async (modelId: string): Promise<boolean> => {
    try {
      const modelInfo = await RunAnywhere.getModelInfo(modelId);
      return !!modelInfo?.localPath;
    } catch {
      return false;
    }
  }, []);

  // Update language and unload current TTS if necessary
  const setActiveLanguage = useCallback(async (lang: SupportedLanguage) => {
    if (activeLanguage === lang) return;

    try {
      if (isTTSLoaded) {
        await RunAnywhere.unloadTTSModel();
        setIsTTSLoaded(false);
      }
    } catch (err) {
      console.warn('Failed to unload previous TTS:', err);
    }

    setActiveLanguageState(lang);
  }, [activeLanguage, isTTSLoaded]);

  // Download and load LLM
  const downloadAndLoadLLM = useCallback(async () => {
    if (isLLMDownloading || isLLMLoading) return;

    try {
      const isDownloaded = await checkModelDownloaded(MODEL_IDS.llm);

      if (!isDownloaded) {
        setIsLLMDownloading(true);

        // Download with progress - emit to subscribers instead of updating Context state
        await RunAnywhere.downloadModel(MODEL_IDS.llm, (progress) => {
          ProgressEmitter.emit('llm', progress.progress * 100);
        });

        setIsLLMDownloading(false);
      }

      // Load the model (per docs: get localPath first, then load)
      setIsLLMLoading(true);
      const modelInfo = await RunAnywhere.getModelInfo(MODEL_IDS.llm);
      if (modelInfo?.localPath) {
        await RunAnywhere.loadModel(modelInfo.localPath);
        setIsLLMLoaded(true);
      }
      setIsLLMLoading(false);
    } catch (error) {
      console.error('LLM download/load error:', error);
      setModelError(`LLM Error: ${error}`);
      setIsLLMDownloading(false);
      setIsLLMLoading(false);
    }
  }, [isLLMDownloading, isLLMLoading, checkModelDownloaded]);

  // Download and load STT
  const downloadAndLoadSTT = useCallback(async () => {
    if (isSTTDownloading || isSTTLoading) return;

    try {
      const isDownloaded = await checkModelDownloaded(MULTILINGUAL_STT_MODEL.id);

      if (!isDownloaded) {
        setIsSTTDownloading(true);

        await RunAnywhere.downloadModel(MULTILINGUAL_STT_MODEL.id, (progress) => {
          ProgressEmitter.emit('stt', progress.progress * 100);
        });

        setIsSTTDownloading(false);
      }

      // Load the STT model (per docs: loadSTTModel(localPath, 'whisper'))
      setIsSTTLoading(true);
      const modelInfo = await RunAnywhere.getModelInfo(MULTILINGUAL_STT_MODEL.id);
      if (modelInfo?.localPath) {
        await RunAnywhere.loadSTTModel(modelInfo.localPath, 'whisper');
        setIsSTTLoaded(true);
      }
      setIsSTTLoading(false);
    } catch (error) {
      console.error('STT download/load error:', error);
      setModelError(`STT Error: ${error}`);
      setIsSTTDownloading(false);
      setIsSTTLoading(false);
    }
  }, [isSTTDownloading, isSTTLoading, checkModelDownloaded]);

  // Download and load TTS
  const downloadAndLoadTTS = useCallback(async () => {
    if (isTTSDownloading || isTTSLoading) return;

    try {
      const currentVoice = TTS_VOICES[activeLanguage];
      const isDownloaded = await checkModelDownloaded(currentVoice.id);

      if (!isDownloaded) {
        setIsTTSDownloading(true);

        await RunAnywhere.downloadModel(currentVoice.id, (progress) => {
          ProgressEmitter.emit('tts', progress.progress * 100);
        });

        setIsTTSDownloading(false);
      }

      // Load the TTS model (per docs: loadTTSModel(localPath, 'piper'))
      setIsTTSLoading(true);
      const modelInfo = await RunAnywhere.getModelInfo(currentVoice.id);
      if (modelInfo?.localPath) {
        await RunAnywhere.loadTTSModel(modelInfo.localPath, 'piper');
        setIsTTSLoaded(true);
      }
      setIsTTSLoading(false);
    } catch (error) {
      console.error('TTS download/load error:', error);
      setModelError(`TTS Error: ${error}`);
      setIsTTSDownloading(false);
      setIsTTSLoading(false);
    }
  }, [isTTSDownloading, isTTSLoading, activeLanguage, checkModelDownloaded]);

  // Download and load all models (Sequentially to prevent OOM)
  const downloadAndLoadAllModels = useCallback(async () => {
    try {
      // 1. STT (Smallest, 80MB)
      console.log('Starting STT model pipeline...');
      await downloadAndLoadSTT();

      // 2. TTS (Medium, 100MB)
      console.log('Starting TTS model pipeline...');
      await downloadAndLoadTTS();

      // 3. LLM (Largest, ~600MB) - Load last to prioritize basic voice IO working safely
      console.log('Starting LLM model pipeline...');
      await downloadAndLoadLLM();

      console.log('All model pipelines completed sequentially.');
    } catch (err) {
      console.error('Failed during sequential model pipeline:', err);
    }
  }, [downloadAndLoadLLM, downloadAndLoadSTT, downloadAndLoadTTS]);

  // Unload all models
  const unloadAllModels = useCallback(async () => {
    try {
      await RunAnywhere.unloadModel();
      await RunAnywhere.unloadSTTModel();
      await RunAnywhere.unloadTTSModel();
      setIsLLMLoaded(false);
      setIsSTTLoaded(false);
      setIsTTSLoaded(false);
    } catch (error) {
      console.error('Error unloading models:', error);
    }
  }, []);

  const value: ModelServiceState = {
    isLLMDownloading,
    isSTTDownloading,
    isTTSDownloading,
    modelError,
    isLLMLoading,
    isSTTLoading,
    isTTSLoading,
    isLLMLoaded,
    isSTTLoaded,
    isTTSLoaded,
    isVoiceAgentReady,
    activeLanguage,
    setActiveLanguage,
    downloadAndLoadLLM,
    downloadAndLoadSTT,
    downloadAndLoadTTS,
    downloadAndLoadAllModels,
    unloadAllModels,
  };

  return (
    <ModelServiceContext.Provider value={value}>
      {children}
    </ModelServiceContext.Provider>
  );
};

/**
 * Register default models with the SDK
 * Models match the sample app: /Users/shubhammalhotra/Desktop/test-fresh/runanywhere-sdks/examples/react-native/RunAnywhereAI/App.tsx
 */
export const registerDefaultModels = async () => {
  // Qwen2.5-0.5B-Instruct-GGUF (Q4_K_M) - Multilingual & Lightweight
  // NOTE: Qwen3 architecture is NOT yet supported by the RunAnywhere SDK's llama.cpp backend
  await LlamaCPP.addModel({
    id: MODEL_IDS.llm,
    name: 'Qwen2.5 0.5B Q4_K_M',
    url: 'https://huggingface.co/Qwen/Qwen2.5-0.5B-Instruct-GGUF/resolve/main/qwen2.5-0.5b-instruct-q4_k_m.gguf?download=true',
    memoryRequirement: 450_000_000,
  });

  // SmolLM2-360M-GGUF (Secondary - Fallback)
  await LlamaCPP.addModel({
    id: 'smollm2-360m-q8_0',
    name: 'SmolLM2 360M Q8_0',
    url: 'https://huggingface.co/prithivMLmods/SmolLM2-360M-GGUF/resolve/main/SmolLM2-360M.Q8_0.gguf?download=true',
    memoryRequirement: 500_000_000,
  });

  // Optionally keep other models for fallback
  await LlamaCPP.addModel({
    id: 'lfm2-350m-q8_0',
    name: 'LiquidAI LFM2 350M Q8_0',
    url: 'https://huggingface.co/LiquidAI/LFM2-350M-GGUF/resolve/main/LFM2-350M-Q8_0.gguf?download=true',
    memoryRequirement: 400_000_000,
  });

  // STT Model - Whisper
  await ONNX.addModel({
    id: MULTILINGUAL_STT_MODEL.id,
    name: MULTILINGUAL_STT_MODEL.name,
    url: MULTILINGUAL_STT_MODEL.url,
    modality: ModelCategory.SpeechRecognition,
    artifactType: ModelArtifactType.TarGzArchive,
    memoryRequirement: 75_000_000,
  });

  // TTS Model - Piper TTS (US English - Medium quality)
  // Additional Piper voices dynamically added
  for (const langKey of Object.keys(TTS_VOICES)) {
    const voice = TTS_VOICES[langKey as SupportedLanguage];
    await ONNX.addModel({
      id: voice.id,
      name: `Piper TTS (${voice.name})`,
      url: voice.url,
      modality: ModelCategory.SpeechSynthesis,
      artifactType: ModelArtifactType.TarGzArchive,
      memoryRequirement: 65_000_000,
    });
  }
};
