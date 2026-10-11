/**
 * YUYAN — React Hook for Real-Time AI Voice Conversation
 * Explicit state machine:
 * idle → requesting_permission → recording → transcribing → submitting_to_ai → generating_response → speaking → completed → ready
 * Coordinates Dual-Engine Speech Recognition (Native / Gemini Cloud STT),
 * Gemini AI Chat API, and Mobile-Unlocked Speech Synthesis (TTS).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  VoiceConversationState,
  VoiceSettings,
  DEFAULT_VOICE_SETTINGS,
  VoiceError,
  STTRecognitionResult,
  MobileVoiceCapabilities,
  STTEngineMode,
} from './speechTypes';
import { speechRecognitionService, logVoiceStage } from './speechRecognitionService';
import { speechSynthesisService } from './speechSynthesisService';
import { aiApiService } from '../ai/aiApiService';

const SETTINGS_STORAGE_KEY = 'yuyan_voice_settings_v1';

export function useVoiceConversation(options?: {
  scenario?: string;
  conversationMode?: 'free_chat' | 'roleplay' | 'speaking' | 'correction' | 'hsk';
  hskLevel?: number;
  onNewMessage?: (msg: {
    sender: 'user' | 'ai';
    text: string;
    pinyin?: string;
    vietnamese?: string;
    feedback?: string | null;
    followUp?: string;
  }) => void;
}) {
  // Voice Settings with LocalStorage persistence
  const [settings, setSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(saved) };
      }
    } catch {
      // ignore
    }
    return DEFAULT_VOICE_SETTINGS;
  });

  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Voice State Machine
  const [state, setState] = useState<VoiceConversationState>('ready');
  const [volume, setVolume] = useState<number>(0);
  const [durationSeconds, setDurationSeconds] = useState<number>(0);
  const [transcript, setTranscript] = useState<string>('');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [lastAiResponse, setLastAiResponse] = useState<string>('');
  const [lastAiPinyin, setLastAiPinyin] = useState<string>('');
  const [lastAiVietnamese, setLastAiVietnamese] = useState<string>('');
  const [error, setError] = useState<VoiceError | null>(null);
  const [capabilities, setCapabilities] = useState<MobileVoiceCapabilities>(() =>
    speechRecognitionService.getCapabilities()
  );
  const [activeEngine, setActiveEngine] = useState<'native' | 'cloud'>(() =>
    speechRecognitionService.getActiveEngine()
  );

  const durationTimerRef = useRef<number | null>(null);
  const activeTranscriptRef = useRef<string>('');
  const stateRef = useRef<VoiceConversationState>(state);
  stateRef.current = state;

  const settingsRef = useRef<VoiceSettings>(settings);
  settingsRef.current = settings;

  // Refresh capabilities on mount
  useEffect(() => {
    const caps = speechRecognitionService.getCapabilities();
    setCapabilities(caps);
    setActiveEngine(speechRecognitionService.getActiveEngine());
  }, []);

  // Mobile Page Lifecycle: suspend on background/app switch to prevent stuck audio tracks
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (stateRef.current === 'recording') {
          cancelRecording();
        }
        speechSynthesisService.stop();
      }
    };

    const handlePageHide = () => {
      speechRecognitionService.abortListening();
      speechSynthesisService.stop();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
      if (durationTimerRef.current) {
        window.clearInterval(durationTimerRef.current);
      }
      speechRecognitionService.abortListening();
      speechSynthesisService.stop();
    };
  }, []);

  /**
   * Start Speech Recording (Microphone Push-to-Talk)
   * Must be called from user touch/click to unlock mobile audio
   */
  const startRecording = useCallback(async () => {
    logVoiceStage(1, 'User tapped Microphone action button');

    // 1. Mobile user gesture audio unlock
    speechSynthesisService.unlockAudioOnUserGesture();

    // 2. Stop any existing playback
    speechSynthesisService.stop();

    setError(null);
    setState('requesting_permission');
    setTranscript('');
    setInterimTranscript('');
    activeTranscriptRef.current = '';
    setDurationSeconds(0);

    try {
      await speechRecognitionService.startListening({
        lang: settingsRef.current.sttLanguage,
        engineMode: settingsRef.current.sttEngineMode || 'auto',
        continuous: false,
        onStart: () => {
          setState('recording');
          setActiveEngine(speechRecognitionService.getActiveEngine());
          // Start timer
          if (durationTimerRef.current) window.clearInterval(durationTimerRef.current);
          durationTimerRef.current = window.setInterval(() => {
            setDurationSeconds((sec) => sec + 1);
          }, 1000);
        },
        onVolume: (vol) => {
          setVolume(vol);
        },
        onResult: (res: STTRecognitionResult) => {
          if (res.transcript) {
            activeTranscriptRef.current = res.transcript;
            setTranscript(res.transcript);
          }
          setInterimTranscript(res.interimTranscript);
          if (res.engine) {
            setActiveEngine(res.engine);
          }
        },
        onError: (err) => {
          console.warn('Voice recording error:', err);
          if (durationTimerRef.current) {
            window.clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
          }
          if (err.code === 'NO_SPEECH') {
            // Friendly prompt to speak again
            setError(err);
            setState('ready');
          } else {
            setError(err);
            setState('error');
          }
        },
        onEnd: () => {
          if (durationTimerRef.current) {
            window.clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
          }
          setVolume(0);

          // If transcript captured, automatically proceed to AI generation
          if (activeTranscriptRef.current.trim().length > 0) {
            void processUserQuery(activeTranscriptRef.current.trim());
          } else {
            // Prevent deadlock: reset to ready state so user can retry immediately
            setState('ready');
          }
        },
      });
    } catch (err: any) {
      if (durationTimerRef.current) {
        window.clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }
      setError({
        code: err?.code || 'AUDIO_CAPTURE',
        message: err?.message || 'Không thể bắt đầu ghi âm',
      });
      setState('error');
    }
  }, []);

  /**
   * Stop Recording explicitly and submit recognized speech
   */
  const stopRecordingAndSend = useCallback(async () => {
    logVoiceStage(6, 'User tapped Stop action button to finalize turn');
    if (durationTimerRef.current) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    setState('transcribing');
    await speechRecognitionService.stopListening();
  }, []);

  /**
   * Cancel recording without submitting
   */
  const cancelRecording = useCallback(() => {
    logVoiceStage(6, 'Recording cancelled by user');
    if (durationTimerRef.current) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    speechRecognitionService.abortListening();
    setVolume(0);
    setTranscript('');
    setInterimTranscript('');
    activeTranscriptRef.current = '';
    setError(null);
    setState('ready');
  }, []);

  /**
   * Process recognized speech query with AI and speak response
   */
  const processUserQuery = useCallback(
    async (text: string) => {
      if (!text.trim()) {
        setState('ready');
        return;
      }

      setState('submitting_to_ai');
      logVoiceStage(11, `Displaying user transcript in conversation feed: "${text}"`);
      options?.onNewMessage?.({ sender: 'user', text });

      setState('generating_response');
      logVoiceStage(12, `Submitting user speech query to AI chat service: "${text}"`);

      try {
        let aiReplyText = '';
        let aiPinyin = '';
        let aiVietnamese = '';
        let feedback: string | null = null;
        let followUp: string | undefined = undefined;

        // Use natural conversation endpoint
        const chatRes = await aiApiService.sendChatMessage({
          scenario: options?.scenario || 'Hội thoại tự do hàng ngày',
          message: text,
          conversationMode: options?.conversationMode || 'free_chat',
          hskLevel: options?.hskLevel || 2,
        });

        aiReplyText = chatRes.hanzi;
        aiPinyin = chatRes.pinyin;
        aiVietnamese = chatRes.vietnamese;
        feedback = chatRes.feedback || null;
        followUp = chatRes.followUp;

        logVoiceStage(13, `AI response generated: "${aiReplyText}"`);
        setLastAiResponse(aiReplyText);
        setLastAiPinyin(aiPinyin);
        setLastAiVietnamese(aiVietnamese);

        // Notify parent context with full metadata
        logVoiceStage(14, 'Rendering AI response in conversation UI card');
        options?.onNewMessage?.({
          sender: 'ai',
          text: aiReplyText,
          pinyin: aiPinyin,
          vietnamese: aiVietnamese,
          feedback,
          followUp,
        });

        // Speak AI Response
        if (settingsRef.current.ttsEnabled && aiReplyText) {
          logVoiceStage(15, `Starting bilingual speech synthesis for: "${aiReplyText}"`);
          setState('speaking');
          await speechSynthesisService.speakBilingual({
            text: aiReplyText,
            rate: settingsRef.current.speechRate,
            chineseVoiceUri: settingsRef.current.chineseVoiceUri,
            vietnameseVoiceUri: settingsRef.current.vietnameseVoiceUri,
            readingMode: settingsRef.current.readingMode,
            onStart: () => {
              setState('speaking');
            },
            onEnd: () => {
              logVoiceStage(15, 'Bilingual speech synthesis playback completed');
              setState('completed');
              setTimeout(() => {
                setState((curr) => (curr === 'completed' ? 'ready' : curr));
              }, 300);
            },
            onError: (ttsErr) => {
              console.warn('TTS playback error, recovering:', ttsErr);
              setState('ready');
            },
          });
        } else {
          setState('completed');
          setTimeout(() => {
            setState((curr) => (curr === 'completed' ? 'ready' : curr));
          }, 200);
        }
      } catch (chatErr: any) {
        console.error('AI chat error during voice turn:', chatErr);
        setError({
          code: 'AI_ERROR',
          message: chatErr?.message || 'Không thể nhận phản hồi từ AI. Vui lòng thử lại.',
        });
        setState('error');
      }
    },
    [options]
  );

  /**
   * Switch STT recognition engine (native / cloud)
   */
  const switchEngineMode = useCallback(
    (mode: STTEngineMode) => {
      updateSettings({ sttEngineMode: mode });
      if (mode === 'native' && capabilities.hasNativeSTT) {
        setActiveEngine('native');
      } else {
        setActiveEngine('cloud');
      }
    },
    [capabilities.hasNativeSTT, updateSettings]
  );

  /**
   * Stop speech synthesis manually
   */
  const stopSpeaking = useCallback(() => {
    speechSynthesisService.stop();
    if (stateRef.current === 'speaking') {
      setState('ready');
    }
  }, []);

  /**
   * Replay last AI response with custom reading mode
   */
  const replayLastResponse = useCallback(
    async (mode?: 'all' | 'chinese_only' | 'vietnamese_only') => {
      if (!lastAiResponse) return;
      speechSynthesisService.stop();
      setState('speaking');
      try {
        await speechSynthesisService.speakBilingual({
          text: lastAiResponse,
          rate: settingsRef.current.speechRate,
          chineseVoiceUri: settingsRef.current.chineseVoiceUri,
          vietnameseVoiceUri: settingsRef.current.vietnameseVoiceUri,
          readingMode: mode || settingsRef.current.readingMode,
          onStart: () => {
            setState('speaking');
          },
          onEnd: () => {
            setState('ready');
          },
          onError: () => {
            setState('ready');
          },
        });
      } catch {
        setState('ready');
      }
    },
    [lastAiResponse]
  );

  return {
    state,
    volume,
    durationSeconds,
    transcript,
    interimTranscript,
    lastAiResponse,
    lastAiPinyin,
    lastAiVietnamese,
    error,
    settings,
    capabilities,
    activeEngine,
    updateSettings,
    switchEngineMode,
    startRecording,
    stopRecordingAndSend,
    cancelRecording,
    stopSpeaking,
    replayLastResponse,
  };
}
