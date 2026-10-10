/**
 * YUYAN — Canonical Speech & Voice Interaction Types
 * Defines interfaces for Speech-to-Text (STT), Text-to-Speech (TTS),
 * Voice Conversation State Machine, and AI Experience Settings.
 */

export type SpeechRecognitionLanguage = 'zh-CN' | 'vi-VN' | 'auto';

export type VoiceConversationState =
  | 'idle'
  | 'requesting_permission'
  | 'ready'
  | 'recording'
  | 'transcribing'
  | 'awaiting_confirmation'
  | 'generating_response'
  | 'speaking'
  | 'paused'
  | 'error';

export interface VoiceSettings {
  ttsEnabled: boolean;
  speechRate: number; // 0.75 | 1.0 | 1.25
  showPinyin: boolean;
  showVietnamese: boolean;
  continuousMode: boolean;
  sttLanguage: SpeechRecognitionLanguage;
  chineseVoiceUri?: string;
  vietnameseVoiceUri?: string;
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  ttsEnabled: true,
  speechRate: 1.0,
  showPinyin: true,
  showVietnamese: true,
  continuousMode: false,
  sttLanguage: 'zh-CN',
};

export interface STTRecognitionResult {
  transcript: string;
  interimTranscript: string;
  isFinal: boolean;
  confidence: number;
}

export interface VoiceError {
  code:
    | 'NOT_SUPPORTED'
    | 'PERMISSION_DENIED'
    | 'NO_SPEECH'
    | 'AUDIO_CAPTURE'
    | 'NETWORK'
    | 'ABORTED'
    | 'TTS_ERROR'
    | 'AI_ERROR'
    | 'UNKNOWN';
  message: string;
  technicalError?: string;
}

export interface AvailableVoice {
  voiceURI: string;
  name: string;
  lang: string;
  isDefault: boolean;
  isChinese: boolean;
  isVietnamese: boolean;
}
