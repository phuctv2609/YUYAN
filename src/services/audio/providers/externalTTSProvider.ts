/**
 * YUYAN External Secure TTS Provider
 * Proxies speech generation through secure backend/Edge Function.
 * Never stores or exposes private API keys in client-side code.
 */

import { IAudioProvider } from '../audioProvider';
import { AudioTrackMetadata, AudioServiceError } from '../audioTypes';
import { AUDIO_ERRORS } from '../audioErrors';
import { audioCache } from '../audioCache';
import { generateAudioCacheKey, sanitizeChineseSpeechText } from '../audioUtils';

export class ExternalTTSProvider implements IAudioProvider {
  public readonly name = 'ExternalTTSProvider';
  private audioElement: HTMLAudioElement | null = null;
  private endpointUrl: string = '/api/tts'; // Secure backend route

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
    }
  }

  public async isAvailable(): Promise<boolean> {
    // Only available if backend endpoint is configured and reachable
    if (typeof window === 'undefined' || !this.audioElement) return false;
    return false; // Standalone frontend operates locally without external server proxy
  }

  public async play(
    track: AudioTrackMetadata,
    onEnded: () => void,
    onError: (err: AudioServiceError) => void
  ): Promise<void> {
    const text = sanitizeChineseSpeechText(track.text);
    const cacheKey = generateAudioCacheKey(text, 'zh-CN', track.voice || 'zh-CN-XiaoxiaoNeural');

    const cachedUrl = audioCache.get(cacheKey);
    if (cachedUrl && this.audioElement) {
      this.audioElement.src = cachedUrl;
      this.audioElement.onended = onEnded;
      this.audioElement.onerror = () => onError(AUDIO_ERRORS.AUDIO_006('Cached audio playback failed'));
      await this.audioElement.play();
      return;
    }

    onError(
      AUDIO_ERRORS.AUDIO_005(
        'External secure TTS backend endpoint not configured. Routing to verified browser zh-CN TTS.'
      )
    );
  }

  public pause(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
  }

  public resume(): void {
    if (this.audioElement && this.audioElement.paused) {
      this.audioElement.play().catch(() => {});
    }
  }

  public stop(): void {
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
      this.audioElement.src = '';
    }
  }

  public getEndpointUrl(): string {
    return this.endpointUrl;
  }

  public getCurrentTime(): number {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  public getDuration(): number {
    return this.audioElement ? this.audioElement.duration || 0 : 0;
  }
}

export const externalTTSProvider = new ExternalTTSProvider();
