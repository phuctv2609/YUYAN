/**
 * YUYAN Audio System Types
 * Strict standard for Mandarin Chinese (普通话 - zh-CN)
 */

export type AudioPlaybackState =
  | 'idle'
  | 'loading'
  | 'playing'
  | 'paused'
  | 'stopped'
  | 'ended'
  | 'error'
  | 'unsupported';

/**
 * Canonical Pronunciation Target
 * Strictly separates phonetic units from vocabulary and supplemental examples.
 */
export interface PronunciationTarget {
  type:
    | 'initial'
    | 'final'
    | 'tone'
    | 'syllable'
    | 'character'
    | 'word'
    | 'sentence'
    | 'passage';
  text: string;
  pinyin?: string;
  hanzi?: string;
  itemId?: string;
  lessonId?: string;
}

export interface AudioTrackMetadata {
  id: string;
  text: string;
  pinyin?: string;
  entityType:
    | 'lesson'
    | 'sentence'
    | 'vocabulary'
    | 'reading'
    | 'hanzi'
    | 'exam'
    | 'example'
    | 'initial'
    | 'final'
    | 'tone'
    | 'syllable'
    | 'character'
    | 'word'
    | 'passage';
  entityId: string;
  lang: 'zh-CN';
  voice?: string;
  rate?: number;
  pitch?: number;
  target?: PronunciationTarget;
}

export interface AudioVoiceInfo {
  voiceURI: string;
  name: string;
  lang: string;
  isDefault: boolean;
  isChinese: boolean;
}

export interface AudioPlaybackEvent {
  state: AudioPlaybackState;
  track?: AudioTrackMetadata;
  currentTarget?: PronunciationTarget;
  currentTime?: number;
  duration?: number;
  error?: AudioServiceError;
}

export interface AudioServiceError {
  code: string;
  technicalReason: string;
  userMessage: string;
  recoveryAction: string;
}
