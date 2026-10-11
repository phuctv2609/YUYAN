/**
 * YUYAN — React Hook for Real-Time AI Voice Conversation
 * Mobile-compatible, robust voice conversation state machine:
 * idle → requesting_permission → recording → transcribing → generating_response → speaking → ready
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
import { speechRecognitionService } from './speechRecognitionService';
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
    setCapabilities(speechRecognitionService.getCapabilities());
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
            // Gentle reset rather than scary failure
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
          } else if (stateRef.current === 'recording') {
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

      setState('generating_response');
      options?.onNewMessage?.({ sender: 'user', text });

      try {
        let aiReplyText = '';
        let aiPinyin = '';
        let aiVietnamese = '';
        let feedback: string | null = null;
        let followUp: string | undefined = undefined;

        // Use natural chat endpoint by default
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

        setLastAiResponse(aiReplyText);
        setLastAiPinyin(aiPinyin);
        setLastAiVietnamese(aiVietnamese);

        // Notify parent with full metadata
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
              setState('ready');
              // If continuous mode enabled, listen again after AI completes
              if (settingsRef.current.continuousMode) {
                setTimeout(() => {
                  if (stateRef.current === 'ready') {
                    void startRecording();
                  }
                }, 800);
              }
            },
            onError: () => {
              setState('ready');
            },
          });
        } else {
          setState('ready');
        }
      } catch (aiErr: any) {
        console.error('AI voice query failed:', aiErr);
        setError({
          code: 'AI_ERROR',
          message: aiErr?.message || 'Lỗi kết nối tới Gia sư AI Gemini.',
        });
        setState('error');
      }
    },
    [options, startRecording]
  );

  /**
   * Stop active TTS playback
   */
  const stopSpeaking = useCallback(() => {
    speechSynthesisService.stop();
    setState('ready');
  }, []);

  /**
   * Replay last spoken AI response with optional custom reading mode
   */
  const replayLastResponse = useCallback(
    async (customMode?: import('./speechTypes').ReadingMode) => {
      if (!lastAiResponse) return;
      speechSynthesisService.unlockAudioOnUserGesture();
      setState('speaking');
      await speechSynthesisService.speakBilingual({
        text: lastAiResponse,
        rate: settings.speechRate,
        chineseVoiceUri: settings.chineseVoiceUri,
        vietnameseVoiceUri: settings.vietnameseVoiceUri,
        readingMode: customMode || settings.readingMode,
        onStart: () => setState('speaking'),
        onEnd: () => setState('ready'),
        onError: () => setState('ready'),
      });
    },
    [lastAiResponse, settings.speechRate, settings.chineseVoiceUri, settings.vietnameseVoiceUri, settings.readingMode]
  );

  const switchEngineMode = useCallback((mode: STTEngineMode) => {
    updateSettings({ sttEngineMode: mode });
  }, [updateSettings]);

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
    switchEngineMode,
    updateSettings,
    startRecording,
    stopRecordingAndSend,
    cancelRecording,
    processUserQuery,
    stopSpeaking,
    replayLastResponse,
  };
}
