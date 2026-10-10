/**
 * YUYAN Centralized Audio Manager
 * Strictly enforces Mandarin Chinese (zh-CN) audio with priority waterfall:
 * 1. Static Pre-recorded Audio
 * 2. Cached Audio
 * 3. Secure External TTS
 * 4. Verified Browser zh-CN SpeechSynthesis
 * 5. Explicit Informative Error (NO English/Vietnamese voice fallback)
 */

import { AudioPlaybackState, AudioTrackMetadata, AudioServiceError, AudioPlaybackEvent, PronunciationTarget } from './audioTypes';
import { audioStateStore } from './audioState';
import { audioQueue } from './audioQueue';
import { staticAudioProvider } from './providers/staticAudioProvider';
import { browserTTSProvider } from './providers/browserTTSProvider';
import { externalTTSProvider } from './providers/externalTTSProvider';
import { IAudioProvider } from './audioProvider';
import { AUDIO_ERRORS } from './audioErrors';
import { sanitizeChineseSpeechText } from './audioUtils';

export class AudioManager {
  private currentRequestId: number = 0;
  private activeProvider: IAudioProvider | null = null;
  private currentTrack?: AudioTrackMetadata;
  private playbackRate: number = 1.0;

  constructor() {
    // Stop all audio on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => this.cleanup());
    }
  }

  public getPlaybackRate(): number {
    return this.playbackRate;
  }

  public setPlaybackRate(rate: number): void {
    this.playbackRate = rate;
  }

  /**
   * Subscribe to audio playback state changes
   */
  public subscribe(listener: (event: AudioPlaybackEvent) => void): () => void {
    return audioStateStore.subscribe(listener);
  }

  public getState(): AudioPlaybackState {
    return audioStateStore.getState();
  }

  public getCurrentTrack(): AudioTrackMetadata | undefined {
    return this.currentTrack;
  }

  public getCurrentTarget(): PronunciationTarget | undefined {
    return audioStateStore.getCurrentTarget();
  }

  /**
   * Plays a canonical PronunciationTarget (initial, final, tone, syllable, character, word, sentence, passage).
   * Guarantees DISPLAY === AUDIO target without unwanted example-word substitution.
   */
  public async playTarget(
    target: PronunciationTarget,
    options?: Partial<AudioTrackMetadata>
  ): Promise<void> {
    const cleanText = sanitizeChineseSpeechText(target.text);
    if (!cleanText) {
      this.handleError(AUDIO_ERRORS.AUDIO_001('Mục tiêu phát âm trống'));
      return;
    }

    const track: AudioTrackMetadata = {
      id: options?.id || `target_${target.type}_${Date.now()}`,
      text: cleanText,
      pinyin: target.pinyin || options?.pinyin,
      entityType: target.type as any,
      entityId: target.itemId || `target_${target.type}`,
      lang: 'zh-CN',
      rate: options?.rate || this.playbackRate,
      pitch: options?.pitch || 1.0,
      voice: options?.voice,
      target: target,
    };

    await this.playTrack(track);
  }

  /**
   * Plays a Chinese text snippet as Mandarin speech.
   */
  public async playText(
    text: string,
    metadata?: Partial<AudioTrackMetadata>
  ): Promise<void> {
    const cleanText = sanitizeChineseSpeechText(text);
    if (!cleanText) {
      this.handleError(AUDIO_ERRORS.AUDIO_001('Văn bản tiếng Trung trống'));
      return;
    }

    const track: AudioTrackMetadata = {
      id: metadata?.id || `text_${Date.now()}`,
      text: cleanText,
      pinyin: metadata?.pinyin,
      entityType: metadata?.entityType || 'sentence',
      entityId: metadata?.entityId || 'adhoc',
      lang: 'zh-CN',
      rate: metadata?.rate || this.playbackRate,
      pitch: metadata?.pitch || 1.0,
      voice: metadata?.voice,
    };

    await this.playTrack(track);
  }

  /**
   * Plays a single track using the strict priority waterfall.
   */
  public async playTrack(track: AudioTrackMetadata): Promise<void> {
    const requestId = ++this.currentRequestId;

    // 1. Stop current audio immediately
    this.stopPlaybackInternal();

    this.currentTrack = track;
    audioStateStore.setState('loading', track);

    // 2. Select provider through waterfall
    let provider: IAudioProvider | null = null;

    // Check if static audio is available for this entity
    if (await staticAudioProvider.isAvailable() && staticAudioProvider.resolveTrackUrl(track)) {
      provider = staticAudioProvider;
    } else if (await externalTTSProvider.isAvailable()) {
      provider = externalTTSProvider;
    } else if (await browserTTSProvider.isAvailable()) {
      provider = browserTTSProvider;
    }

    // Check if stale request
    if (this.currentRequestId !== requestId) {
      return;
    }

    if (!provider) {
      // Check if browser has speech synthesis but lacking Chinese voice
      const hasChinese = await browserTTSProvider.isAvailable();
      if (!hasChinese) {
        this.handleError(
          AUDIO_ERRORS.AUDIO_003(
            'Trình duyệt/hệ điều hành chưa cài đặt giọng đọc tiếng Trung (zh-CN). Vui lòng thêm gói tiếng Trung trong cài đặt giọng nói.'
          )
        );
      } else {
        this.handleError(AUDIO_ERRORS.AUDIO_002());
      }
      return;
    }

    this.activeProvider = provider;
    audioStateStore.setState('playing', track);

    try {
      await provider.play(
        track,
        () => {
          // Playback finished naturally
          if (this.currentRequestId === requestId) {
            audioStateStore.setState('ended', track);
            this.handleTrackEnded();
          }
        },
        (err: AudioServiceError) => {
          // Playback failed
          if (this.currentRequestId === requestId) {
            this.handleError(err);
          }
        }
      );
    } catch (err: any) {
      if (this.currentRequestId === requestId) {
        this.handleError(AUDIO_ERRORS.AUDIO_005(err?.message));
      }
    }
  }

  /**
   * Enqueues a list of tracks and begins playback.
   */
  public async playQueue(
    tracks: AudioTrackMetadata[],
    startIndex: number = 0,
    autoAdvance: boolean = true
  ): Promise<void> {
    if (tracks.length === 0) return;
    audioQueue.setQueue(tracks, startIndex, autoAdvance);
    const initialTrack = audioQueue.getCurrentTrack();
    if (initialTrack) {
      await this.playTrack(initialTrack);
    }
  }

  public async next(): Promise<void> {
    const nextTrack = audioQueue.getNextTrack();
    if (nextTrack) {
      await this.playTrack(nextTrack);
    } else {
      this.stop();
    }
  }

  public async previous(): Promise<void> {
    const prevTrack = audioQueue.getPreviousTrack();
    if (prevTrack) {
      await this.playTrack(prevTrack);
    }
  }

  public pause(): void {
    if (this.activeProvider) {
      this.activeProvider.pause();
      audioStateStore.setState('paused', this.currentTrack);
    }
  }

  public resume(): void {
    if (this.activeProvider) {
      this.activeProvider.resume();
      audioStateStore.setState('playing', this.currentTrack);
    }
  }

  public stop(): void {
    this.currentRequestId++;
    this.stopPlaybackInternal();
    audioStateStore.setState('stopped', this.currentTrack);
  }

  /**
   * Reset on route navigation or lesson switch
   */
  public cleanup(): void {
    this.stop();
    audioQueue.clear();
    this.currentTrack = undefined;
    audioStateStore.setState('idle');
  }

  private stopPlaybackInternal(): void {
    if (this.activeProvider) {
      try {
        this.activeProvider.stop();
      } catch (e) {
        console.warn('Error stopping audio provider:', e);
      }
      this.activeProvider = null;
    }
  }

  private handleTrackEnded(): void {
    if (audioQueue.isAutoAdvanceEnabled() && audioQueue.hasNext()) {
      this.next();
    }
  }

  private handleError(error: AudioServiceError): void {
    this.stopPlaybackInternal();
    audioStateStore.setState('error', this.currentTrack, error);
    console.warn(`[YUYAN Audio Error ${error.code}]:`, error.technicalReason);
  }
}

export const audioManager = new AudioManager();
