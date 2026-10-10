/**
 * YUYAN — Speech Synthesis (TTS) Engine
 * High-quality bilingual speech engine supporting Mandarin Chinese (Voice A)
 * and Vietnamese (Voice B) with language-aware text segmentation,
 * sequential non-overlapping queue, configurable reading modes,
 * and immediate cancellation.
 */

import { AvailableVoice, VoiceError, SpeechSegment, ReadingMode } from './speechTypes';

export interface BilingualSpeechOptions {
  text: string;
  readingMode?: ReadingMode;
  rate?: number;
  chineseVoiceUri?: string;
  vietnameseVoiceUri?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: VoiceError) => void;
  onSegmentChange?: (segment: SpeechSegment, index: number, total: number) => void;
}

export class SpeechSynthesisService {
  private static instance: SpeechSynthesisService;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private voicesLoaded: boolean = false;
  private queue: SpeechSegment[] = [];
  private activeQueueIndex: number = -1;
  private activeOptions: BilingualSpeechOptions | null = null;
  private activeSessionId: number = 0;

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
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = load;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && Boolean(window.speechSynthesis);
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking || Boolean(this.currentUtterance) || this.queue.length > 0;
  }

  public areVoicesLoaded(): boolean {
    return this.voicesLoaded;
  }

  /**
   * Returns list of detected system and cloud voices with metadata
   */
  public async getAvailableVoices(): Promise<AvailableVoice[]> {
    if (!this.isSupported()) return [];

    let vList = window.speechSynthesis.getVoices();
    if (vList.length === 0) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      vList = window.speechSynthesis.getVoices();
    }

    return vList.map((v) => {
      const langLower = (v.lang || '').toLowerCase();
      const nameLower = (v.name || '').toLowerCase();
      const isChinese =
        langLower.startsWith('zh') ||
        langLower.includes('cmn') ||
        langLower.includes('chinese') ||
        nameLower.includes('chinese') ||
        nameLower.includes('mandarin') ||
        v.name.includes('普通话') ||
        v.name.includes('中文');
      const isVietnamese =
        langLower.startsWith('vi') ||
        langLower.includes('vietnam') ||
        nameLower.includes('vietnam') ||
        nameLower.includes('tiếng việt') ||
        nameLower.includes('vietnamese');

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
      // Remove code blocks and inline code
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`([^`]+)`/g, '$1')
      // Remove markdown images and links
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove URLs
      .replace(/https?:\/\/\S+/g, '')
      // Remove bold and italic markers
      .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1')
      // Remove markdown headings
      .replace(/^#{1,6}\s+/gm, '')
      // Remove metadata prefixes like [Pinyin]:, [Nghĩa]:, [Giải thích]:
      .replace(/\[(?:Pinyin|Nghĩa|Dịch|Giải thích|Ví dụ|Lưu ý)\]:?/gi, '')
      // Remove bullet markers and numbering prefixes
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/^\s*\d+\.\s+/gm, '')
      // Remove emoji/symbol decorators
      .replace(/[💡👉⭐✨🎉👍]/g, '')
      // Clean up multiple whitespaces
      .replace(/\s+/g, ' ')
      .trim();

    return clean;
  }

  /**
   * Helper to detect if a clause consists of Chinese characters
   */
  public isChineseText(text: string): boolean {
    const hanziRegex = /[\u4e00-\u9fa5]/g;
    const matches = text.match(hanziRegex);
    return Boolean(matches && matches.length > 0);
  }

  /**
   * Language-aware text segmentation pipeline:
   * Breaks mixed Chinese-Vietnamese-English text into sequential segments
   * so that Chinese parts are spoken by Mandarin Voice A, and Vietnamese parts by Voice B.
   */
  public segmentText(rawText: string, readingMode: ReadingMode = 'all'): SpeechSegment[] {
    const sanitized = this.sanitizeForSpeech(rawText);
    if (!sanitized) return [];

    // Split text by sentence/clause boundaries while preserving delimiters
    const rawClauses = sanitized
      .split(/(?<=[。！？!?\n;；])/)
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const initialSegments: SpeechSegment[] = [];

    rawClauses.forEach((clause, idx) => {
      const hasHanzi = this.isChineseText(clause);
      const hasLatin = /[a-zA-Zà-ỹÀ-Ỹ]/.test(clause);

      // Case 1: Pure Chinese sentence/clause (Hanzi + Chinese punctuation, zero Latin)
      if (hasHanzi && !hasLatin) {
        initialSegments.push({
          id: `seg_${idx}_0`,
          text: clause,
          lang: 'zh-CN',
          isChinese: true,
        });
        return;
      }

      // Case 2: Pure Vietnamese/Western sentence (zero Hanzi)
      if (!hasHanzi) {
        initialSegments.push({
          id: `seg_${idx}_0`,
          text: clause,
          lang: 'vi-VN',
          isChinese: false,
        });
        return;
      }

      // Case 3: Mixed clause with inline Hanzi and Latin text (e.g. "Từ 好啦 có nghĩa là được rồi")
      // Match CJK characters and Chinese punctuation together
      const mixedTokens = clause
        .split(/([\u4e00-\u9fa5\u3000-\u303f\uff01-\uff0f\uff1a-\uff20]+)/)
        .filter((t) => t.trim().length > 0);

      mixedTokens.forEach((token, subIdx) => {
        const isZh = this.isChineseText(token);
        initialSegments.push({
          id: `seg_${idx}_${subIdx}`,
          text: token.trim(),
          lang: isZh ? 'zh-CN' : 'vi-VN',
          isChinese: isZh,
        });
      });
    });

    // Merge consecutive segments of the same language to produce fluent continuous speech
    const mergedSegments: SpeechSegment[] = [];
    for (const seg of initialSegments) {
      if (!seg.text) continue;
      const last = mergedSegments[mergedSegments.length - 1];
      if (last && last.lang === seg.lang) {
        last.text = `${last.text} ${seg.text}`.trim();
      } else {
        mergedSegments.push({ ...seg });
      }
    }

    // Filter segments based on the requested ReadingMode
    let filtered = mergedSegments;
    if (readingMode === 'chinese_only') {
      filtered = mergedSegments.filter((s) => s.isChinese);
    } else if (readingMode === 'vietnamese_only') {
      filtered = mergedSegments.filter((s) => !s.isChinese);
    }

    return filtered;
  }

  /**
   * Find matching voice for target language
   */
  public findVoice(lang: 'zh-CN' | 'vi-VN', preferredUri?: string): SpeechSynthesisVoice | null {
    if (typeof window === 'undefined' || !window.speechSynthesis) return null;
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
        const n = (v.name || '').toLowerCase();
        return (
          l.startsWith('zh') ||
          n.includes('chinese') ||
          n.includes('mandarin') ||
          v.name.includes('普通话') ||
          v.name.includes('中文')
        );
      });
      if (anyZh) return anyZh;
    } else if (lang === 'vi-VN') {
      // 1. Exact Vietnamese voice
      const vi = all.find((v) => {
        const l = (v.lang || '').toLowerCase().replace('_', '-');
        const n = (v.name || '').toLowerCase();
        return (
          l === 'vi-vn' ||
          l === 'vi' ||
          n.includes('vietnam') ||
          n.includes('tiếng việt')
        );
      });
      if (vi) return vi;
    }

    return null;
  }

  /**
   * Speak segmented text with language-aware sequential playback.
   * Chinese segments are spoken by Mandarin Voice A.
   * Vietnamese segments are spoken by Vietnamese Voice B.
   */
  public async speakBilingual(options: BilingualSpeechOptions): Promise<void> {
    if (!this.isSupported()) {
      options.onError?.({
        code: 'NOT_SUPPORTED',
        message: 'Trình duyệt chưa hỗ trợ bộ tổng hợp giọng nói Web Speech.',
      });
      return;
    }

    // Stop active playback and cancel queues immediately
    this.stop();

    const segments = this.segmentText(options.text, options.readingMode || 'all');
    if (segments.length === 0) {
      options.onEnd?.();
      return;
    }

    this.activeSessionId = Date.now();
    const currentSession = this.activeSessionId;
    this.queue = segments;
    this.activeQueueIndex = 0;
    this.activeOptions = options;

    options.onStart?.();
    this.playNextSegmentInQueue(currentSession);
  }

  /**
   * Internal sequential queue worker
   */
  private playNextSegmentInQueue(sessionId: number): void {
    if (sessionId !== this.activeSessionId) return; // Stale session check

    if (this.activeQueueIndex >= this.queue.length) {
      // Completed all segments
      this.isSpeaking = false;
      this.currentUtterance = null;
      this.queue = [];
      this.activeOptions?.onEnd?.();
      return;
    }

    const seg = this.queue[this.activeQueueIndex];
    const options = this.activeOptions;
    if (!options || !seg) return;

    options.onSegmentChange?.(seg, this.activeQueueIndex, this.queue.length);

    const utterance = new SpeechSynthesisUtterance(seg.text);
    utterance.lang = seg.lang;
    utterance.rate = Math.min(2.0, Math.max(0.5, options.rate ?? 1.0));

    // Select Voice A (Chinese) or Voice B (Vietnamese)
    const preferredVoiceUri = seg.isChinese
      ? options.chineseVoiceUri
      : options.vietnameseVoiceUri;
    const voice = this.findVoice(seg.lang, preferredVoiceUri);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onstart = () => {
      this.isSpeaking = true;
    };

    utterance.onend = () => {
      if (sessionId !== this.activeSessionId) return;
      this.activeQueueIndex++;
      this.playNextSegmentInQueue(sessionId);
    };

    utterance.onerror = (e) => {
      if (sessionId !== this.activeSessionId) return;
      // If manually canceled, do not propagate error
      if (e.error === 'interrupted' || e.error === 'canceled') {
        this.stop();
        return;
      }
      console.warn(`TTS error in segment ${this.activeQueueIndex}:`, e.error);
      // Advance to next segment even if one failed
      this.activeQueueIndex++;
      this.playNextSegmentInQueue(sessionId);
    };

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Legacy single-turn speak method (backward compatible)
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
    return this.speakBilingual({
      text: options.text,
      rate: options.rate,
      chineseVoiceUri: options.lang === 'zh-CN' ? options.voiceURI : undefined,
      vietnameseVoiceUri: options.lang === 'vi-VN' ? options.voiceURI : undefined,
      readingMode: options.lang === 'zh-CN' ? 'chinese_only' : options.lang === 'vi-VN' ? 'vietnamese_only' : 'all',
      onStart: options.onStart,
      onEnd: options.onEnd,
      onError: options.onError,
    });
  }

  /**
   * Stop all active speech playback immediately and clear queue
   */
  public stop(): void {
    this.activeSessionId = Date.now(); // Invalidate queue workers
    this.queue = [];
    this.activeQueueIndex = -1;
    this.activeOptions = null;
    this.isSpeaking = false;
    this.currentUtterance = null;

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
  }
}

export const speechSynthesisService = SpeechSynthesisService.getInstance();

export function sanitizeForSpeech(rawText: string): string {
  return speechSynthesisService.sanitizeForSpeech(rawText);
}
