/**
 * YUYAN — Speech Synthesis (TTS) Service
 * High-quality voice synthesis for Mandarin Chinese (zh-CN) & Vietnamese (vi-VN),
 * intelligent Markdown sanitization, speech rate adjustment, and non-overlapping playback.
 */

import { AvailableVoice, VoiceError } from './speechTypes';

export class SpeechSynthesisService {
  private static instance: SpeechSynthesisService;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;

  public static getInstance(): SpeechSynthesisService {
    if (!SpeechSynthesisService.instance) {
      SpeechSynthesisService.instance = new SpeechSynthesisService();
    }
    return SpeechSynthesisService.instance;
  }

  constructor() {
    this.initVoices();
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const load = () => {
      this.voices = window.speechSynthesis.getVoices();
      if (this.voices.length > 0) {
        this.voicesLoaded = true;
      }
    };

    load();
    if (typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', load);
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(window.speechSynthesis);
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking || Boolean(this.currentUtterance);
  }

  public areVoicesLoaded(): boolean {
    return this.voicesLoaded;
  }

  /**
   * Returns list of detected system and cloud voices
   */
  public async getAvailableVoices(): Promise<AvailableVoice[]> {
    if (!this.isSupported()) return [];

    let vList = window.speechSynthesis.getVoices();
    if (vList.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      vList = window.speechSynthesis.getVoices();
    }

    return vList.map((v) => {
      const langLower = (v.lang || '').toLowerCase();
      const isChinese =
        langLower.startsWith('zh') ||
        langLower.includes('cmn') ||
        langLower.includes('chinese') ||
        v.name.toLowerCase().includes('chinese') ||
        v.name.includes('普通话') ||
        v.name.includes('中文');
      const isVietnamese =
        langLower.startsWith('vi') ||
        langLower.includes('vietnam') ||
        v.name.toLowerCase().includes('vietnam') ||
        v.name.toLowerCase().includes('tiếng việt');

      return {
        voiceURI: v.voiceURI,
        name: v.name,
        lang: v.lang,
        isDefault: v.default,
        isChinese,
        isVietnamese,
      };
    });
  }

  /**
   * Sanitizes Markdown syntax, URLs, and metadata tags before TTS speech
   */
  public sanitizeForSpeech(rawText: string): string {
    if (!rawText) return '';

    let clean = rawText
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove URLs
      .replace(/https?:\/\/\S+/g, '')
      // Remove bold and italic markers
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
      // Remove markdown headings
      .replace(/^#{1,6}\s+/gm, '')
      // Remove metadata prefixes like [Pinyin]:, [Nghĩa]:, [Giải thích]:
      .replace(/\[(?:Pinyin|Nghĩa|Dịch|Giải thích|Ví dụ|Lưu ý)\]:?/gi, '')
      // Remove bullet markers
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Clean up multiple whitespaces
      .replace(/\s+/g, ' ')
      .trim();

    return clean;
  }

  /**
   * Find matching voice for target language
   */
  private findVoice(lang: 'zh-CN' | 'vi-VN', preferredUri?: string): SpeechSynthesisVoice | null {
    const all = window.speechSynthesis.getVoices();
    if (all.length === 0) return null;

    if (preferredUri) {
      const match = all.find((v) => v.voiceURI === preferredUri);
      if (match) return match;
    }

    if (lang === 'zh-CN') {
      // 1. Standard zh-CN Mainland Mandarin
      const zhCn = all.find((v) => {
        const l = (v.lang || '').toLowerCase().replace('_', '-');
        return l === 'zh-cn' || l === 'zh-hans-cn' || l === 'cmn-hans-cn';
      });
      if (zhCn) return zhCn;

      // 2. Any Chinese voice
      const anyZh = all.find((v) => {
        const l = (v.lang || '').toLowerCase();
        return l.startsWith('zh') || v.name.toLowerCase().includes('chinese') || v.name.includes('普通话');
      });
      if (anyZh) return anyZh;
    } else if (lang === 'vi-VN') {
      // Vietnamese voice
      const vi = all.find((v) => {
        const l = (v.lang || '').toLowerCase().replace('_', '-');
        return l === 'vi-vn' || l === 'vi' || v.name.toLowerCase().includes('vietnam');
      });
      if (vi) return vi;
    }

    return null;
  }

  /**
   * Speak text in Chinese (zh-CN) or Vietnamese (vi-VN)
   */
  public async speak(options: {
    text: string;
    lang?: 'zh-CN' | 'vi-VN';
    rate?: number;
    voiceURI?: string;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: VoiceError) => void;
  }): Promise<void> {
    if (!this.isSupported()) {
      options.onError?.({
        code: 'NOT_SUPPORTED',
        message: 'Trình duyệt chưa hỗ trợ bộ tổng hợp giọng nói Web Speech.',
      });
      return;
    }

    // Cancel any ongoing speech to avoid overlapping
    this.stop();

    const sanitized = this.sanitizeForSpeech(options.text);
    if (!sanitized) {
      options.onEnd?.();
      return;
    }

    const lang = options.lang || (this.isChineseText(sanitized) ? 'zh-CN' : 'vi-VN');
    const utterance = new SpeechSynthesisUtterance(sanitized);
    utterance.lang = lang;
    utterance.rate = Math.min(2.0, Math.max(0.5, options.rate ?? 1.0));

    const matchedVoice = this.findVoice(lang, options.voiceURI);
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      options.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeaking = false;
      this.currentUtterance = null;
      // Do not report error if cancelled intentionally by user
      if (e.error === 'interrupted' || e.error === 'canceled') {
        options.onEnd?.();
        return;
      }
      options.onError?.({
        code: 'TTS_ERROR',
        message: 'Lỗi phát âm thanh giọng đọc.',
        technicalError: e.error,
      });
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Stop all active speech playback immediately
   */
  public stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    this.isSpeaking = false;
    this.currentUtterance = null;
  }

  /**
   * Helper to detect if a text primarily consists of Chinese characters
   */
  public isChineseText(text: string): boolean {
    const hanziRegex = /[\u4e00-\u9fa5]/g;
    const matches = text.match(hanziRegex);
    return Boolean(matches && matches.length > 0);
  }
}

export const speechSynthesisService = SpeechSynthesisService.getInstance();

export function sanitizeForSpeech(rawText: string): string {
  return speechSynthesisService.sanitizeForSpeech(rawText);
}
