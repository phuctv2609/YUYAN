/**
 * YUYAN Browser SpeechSynthesis TTS Provider
 * Enforces strict Mandarin Chinese (zh-CN / 普通话) voice verification.
 * Under NO circumstance will it fall back to non-Chinese voices (en-US, vi-VN, ja-JP, etc.).
 */

import { IAudioProvider } from '../audioProvider';
import { AudioTrackMetadata, AudioServiceError, AudioVoiceInfo } from '../audioTypes';
import { AUDIO_ERRORS } from '../audioErrors';
import { sanitizeChineseSpeechText } from '../audioUtils';

export class BrowserTTSProvider implements IAudioProvider {
  public readonly name = 'BrowserTTSProvider';
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private voicesLoaded: boolean = false;
  private cachedVoices: SpeechSynthesisVoice[] = [];
  private currentRequestId: number = 0;

  constructor() {
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const load = () => {
      this.cachedVoices = window.speechSynthesis.getVoices();
      if (this.cachedVoices.length > 0) {
        this.voicesLoaded = true;
      }
    };

    load();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', load);
    }
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  public async getAvailableVoices(): Promise<AudioVoiceInfo[]> {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];

    let voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) {
      // Wait up to 500ms for browser to populate voices
      await new Promise((res) => setTimeout(res, 300));
      voices = window.speechSynthesis.getVoices();
    }

    return voices.map((v) => {
      const langLower = (v.lang || '').toLowerCase();
      const isChinese =
        langLower.startsWith('zh') ||
        langLower.includes('cmn') ||
        langLower.includes('chinese') ||
        v.name.toLowerCase().includes('chinese') ||
        v.name.includes('普通话') ||
        v.name.includes('中文');
      return {
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang,
        isDefault: v.default,
        isChinese,
      };
    });
  }

  public async findBestChineseVoice(): Promise<SpeechSynthesisVoice | null> {
    const all = window.speechSynthesis.getVoices();
    if (all.length === 0) return null;

    // Filter strictly for Chinese voices
    const chineseVoices = all.filter((v) => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      const name = (v.name || '').toLowerCase();
      return (
        lang === 'zh-cn' ||
        lang === 'zh-hans-cn' ||
        lang === 'zh-sg' ||
        lang === 'zh' ||
        lang.startsWith('zh-') ||
        name.includes('mandarin') ||
        name.includes('chinese') ||
        name.includes('普通话') ||
        name.includes('huihui') ||
        name.includes('yaoyao') ||
        name.includes('kangkang') ||
        name.includes('xiaoxiao') ||
        name.includes('tingting')
      );
    });

    if (chineseVoices.length === 0) return null;

    // Priority 1: Standard zh-CN or Mainland Mandarin
    const mainlandVoice = chineseVoices.find((v) => {
      const lang = (v.lang || '').toLowerCase().replace('_', '-');
      return lang === 'zh-cn' || lang === 'zh-hans-cn';
    });
    if (mainlandVoice) return mainlandVoice;

    // Priority 2: Any Chinese voice
    return chineseVoices[0];
  }

  public async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    const voice = await this.findBestChineseVoice();
    return voice !== null;
  }

  public async play(
    track: AudioTrackMetadata,
    onEnded: () => void,
    onError: (err: AudioServiceError) => void
  ): Promise<void> {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      onError(AUDIO_ERRORS.AUDIO_002());
      return;
    }

    // Invalidate previous requests and cancel active utterance
    this.stop();
    const requestId = ++this.currentRequestId;

    const voice = await this.findBestChineseVoice();
    if (!voice) {
      if (this.currentRequestId !== requestId) return;
      onError(AUDIO_ERRORS.AUDIO_003());
      return;
    }

    const textToSpeak = sanitizeChineseSpeechText(track.text);
    if (!textToSpeak || !textToSpeak.trim()) {
      if (this.currentRequestId !== requestId) return;
      onError({
        code: 'AUDIO_001',
        technicalReason: 'Empty Chinese speech content',
        userMessage: 'Câu này không có nội dung để đọc.',
        recoveryAction: 'Chọn câu khác trong bài học.',
      });
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.voice = voice;
    utterance.lang = voice.lang || 'zh-CN';
    utterance.rate = Math.max(0.5, Math.min(2.0, track.rate || 0.95)); // natural pace
    utterance.pitch = Math.max(0.5, Math.min(1.5, track.pitch || 1.0));

    utterance.onstart = () => {
      if (this.currentRequestId !== requestId) return;
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      if (this.currentRequestId !== requestId) return;
      this.isSpeaking = false;
      this.currentUtterance = null;
      onEnded();
    };

    utterance.onerror = (event) => {
      if (this.currentRequestId !== requestId) return;
      this.isSpeaking = false;
      this.currentUtterance = null;
      if (event.error === 'canceled' || event.error === 'interrupted') {
        // Not a true failure, cancelled due to user action
        return;
      }
      onError(AUDIO_ERRORS.AUDIO_005(`SpeechSynthesis error event: ${event.error}`));
    };

    this.currentUtterance = utterance;

    try {
      window.speechSynthesis.speak(utterance);
    } catch (err: any) {
      if (this.currentRequestId !== requestId) return;
      this.isSpeaking = false;
      onError(AUDIO_ERRORS.AUDIO_005(err?.message || 'SpeechSynthesis.speak failed'));
    }
  }

  public pause(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
    }
  }

  public resume(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.resume();
    }
  }

  public stop(): void {
    this.currentRequestId++;
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Safe ignore
      }
      this.isSpeaking = false;
      this.currentUtterance = null;
    }
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public isVoicesLoaded(): boolean {
    return this.voicesLoaded;
  }

  public getCurrentUtterance(): SpeechSynthesisUtterance | null {
    return this.currentUtterance;
  }

  public getCurrentTime(): number {
    return 0;
  }

  public getDuration(): number {
    return 0;
  }
}

export const browserTTSProvider = new BrowserTTSProvider();
