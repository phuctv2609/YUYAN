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
  | 'listening'
  | 'recording'
  | 'transcribing'
  | 'submitting_to_ai'
  | 'generating_response'
  | 'speaking'
  | 'completed'
  | 'paused'
  | 'ended'
  | 'error';

export type ReadingMode = 'all' | 'chinese_only' | 'vietnamese_only';

export interface SpeechSegment {
  id: string;
  text: string;
  lang: 'zh-CN' | 'vi-VN';
  isChinese: boolean;
  voiceURI?: string;
}

export interface VoiceSettings {
  ttsEnabled: boolean;
  speechRate: number; // 0.75 | 1.0 | 1.25 | 1.5
  showPinyin: boolean;
  showVietnamese: boolean;
  continuousMode: boolean;
  autoPlayResponses: boolean;
  readingMode: ReadingMode;
  preferredResponseLanguage: 'auto' | 'zh' | 'vi' | 'en';
  sttLanguage: SpeechRecognitionLanguage;
  sttEngineMode?: STTEngineMode;
  chineseVoiceUri?: string;
  vietnameseVoiceUri?: string;
}

export type STTEngineMode = 'auto' | 'native' | 'cloud';

export interface MobileVoiceCapabilities {
  hasNativeSTT: boolean;
  hasMediaRecorder: boolean;
  hasSpeechSynthesis: boolean;
  hasChineseVoice: boolean;
  hasVietnameseVoice: boolean;
  isSecureContext: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  preferredEngine: 'native' | 'cloud';
}

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  ttsEnabled: true,
  speechRate: 1.0,
  showPinyin: true,
  showVietnamese: true,
  continuousMode: false,
  autoPlayResponses: true,
  readingMode: 'all',
  preferredResponseLanguage: 'auto',
  sttLanguage: 'zh-CN',
  sttEngineMode: 'auto',
};

export interface STTRecognitionResult {
  transcript: string;
  interimTranscript: string;
  isFinal: boolean;
  confidence: number;
  engine?: 'native' | 'cloud';
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
