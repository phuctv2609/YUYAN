/**
 * YUYAN — React Hook for Real-Time AI Voice Conversation
 * Manages full voice state machine:
 * idle → requesting_permission → recording → transcribing → generating_response → speaking → ready
 * Coordinates Speech Recognition (STT), Gemini AI Chat API, and Speech Synthesis (TTS).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  VoiceConversationState,
  VoiceSettings,
  DEFAULT_VOICE_SETTINGS,
  VoiceError,
  STTRecognitionResult,
} from './speechTypes';
import { speechRecognitionService } from './speechRecognitionService';
import { speechSynthesisService } from './speechSynthesisService';
import { aiApiService } from '../ai/aiApiService';

const SETTINGS_STORAGE_KEY = 'yuyan_voice_settings_v1';

export function useVoiceConversation(options?: {
  scenario?: string;
  onNewMessage?: (msg: { sender: 'user' | 'ai'; text: string }) => void;
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
  const [error, setError] = useState<VoiceError | null>(null);

  const durationTimerRef = useRef<number | null>(null);
  const activeTranscriptRef = useRef<string>('');
  const stateRef = useRef<VoiceConversationState>(state);
  stateRef.current = state;

  const settingsRef = useRef<VoiceSettings>(settings);
  settingsRef.current = settings;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationTimerRef.current) {
        window.clearInterval(durationTimerRef.current);
      }
      speechRecognitionService.abortListening();
      speechSynthesisService.stop();
    };
  }, []);

  /**
   * Start Speech Recording (Microphone Push-to-Talk)
   */
  const startRecording = useCallback(async () => {
    // If AI is currently speaking, stop TTS first so microphone doesn't capture it
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
        continuous: false,
        onStart: () => {
          setState('recording');
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
        },
        onError: (err) => {
          console.warn('Voice recording error:', err);
          if (durationTimerRef.current) {
            window.clearInterval(durationTimerRef.current);
            durationTimerRef.current = null;
          }
          setError(err);
          setState('error');
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
  const stopRecordingAndSend = useCallback(() => {
    if (durationTimerRef.current) {
      window.clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    speechRecognitionService.stopListening();
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
        if (options?.scenario) {
          const res = await aiApiService.sendChatMessage({
            scenario: options.scenario,
            message: text,
          });
          aiReplyText = res.hanzi;
        } else {
          aiReplyText = await aiApiService.sendFreeChatMessage({
            question: text,
          });
        }

        setLastAiResponse(aiReplyText);
        options?.onNewMessage?.({ sender: 'ai', text: aiReplyText });

        // Speak AI Response
        if (settingsRef.current.ttsEnabled && aiReplyText) {
          setState('speaking');
          await speechSynthesisService.speak({
            text: aiReplyText,
            rate: settingsRef.current.speechRate,
            voiceURI: settingsRef.current.chineseVoiceUri,
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
   * Replay last spoken AI response
   */
  const replayLastResponse = useCallback(async () => {
    if (!lastAiResponse) return;
    setState('speaking');
    await speechSynthesisService.speak({
      text: lastAiResponse,
      rate: settings.speechRate,
      voiceURI: settings.chineseVoiceUri,
      onStart: () => setState('speaking'),
      onEnd: () => setState('ready'),
      onError: () => setState('ready'),
    });
  }, [lastAiResponse, settings.speechRate, settings.chineseVoiceUri]);

  return {
    state,
    volume,
    durationSeconds,
    transcript,
    interimTranscript,
    lastAiResponse,
    error,
    settings,
    updateSettings,
    startRecording,
    stopRecordingAndSend,
    cancelRecording,
    processUserQuery,
    stopSpeaking,
    replayLastResponse,
  };
}
