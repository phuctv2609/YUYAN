/**
 * YUYAN Static Pre-recorded Audio Provider
 * Plays pre-recorded static audio tracks (MP3/WAV/AAC) with HTML5 Audio.
 */

import { IAudioProvider } from '../audioProvider';
import { AudioTrackMetadata, AudioServiceError } from '../audioTypes';
import { AUDIO_ERRORS } from '../audioErrors';

export class StaticAudioProvider implements IAudioProvider {
  public readonly name = 'StaticAudioProvider';
  private audioElement: HTMLAudioElement | null = null;
  private currentTrackId: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
    }
  }

  public async isAvailable(): Promise<boolean> {
    return typeof window !== 'undefined' && this.audioElement !== null;
  }

  public resolveTrackUrl(track: AudioTrackMetadata): string | null {
    // If track metadata already has a dedicated audio URL or path
    if ((track as any).audioUrl) {
      return (track as any).audioUrl;
    }
    // Check known audio directory conventions: /audio/hsk{level}/{entityType}_{id}.mp3
    return null;
  }

  public async play(
    track: AudioTrackMetadata,
    onEnded: () => void,
    onError: (err: AudioServiceError) => void
  ): Promise<void> {
    if (!this.audioElement) {
      onError(AUDIO_ERRORS.AUDIO_006('HTMLAudioElement is not initialized in this environment.'));
      return;
    }

    const url = this.resolveTrackUrl(track);
    if (!url) {
      onError(AUDIO_ERRORS.AUDIO_001(`Static audio file not found for ${track.entityType}:${track.entityId}`));
      return;
    }

    this.stop();
    this.currentTrackId = track.id;
    this.audioElement.src = url;
    this.audioElement.playbackRate = track.rate || 1.0;

    this.audioElement.onended = () => {
      this.currentTrackId = null;
      onEnded();
    };

    this.audioElement.onerror = () => {
      const mediaErr = this.audioElement?.error;
      this.currentTrackId = null;
      onError(
        AUDIO_ERRORS.AUDIO_006(
          `HTML5 Audio Error code: ${mediaErr?.code || 'unknown'} for URL: ${url}`
        )
      );
    };

    try {
      await this.audioElement.play();
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        onError(AUDIO_ERRORS.AUDIO_007('Autoplay blocked. User gesture required.'));
      } else {
        onError(AUDIO_ERRORS.AUDIO_004(`Failed to play static audio: ${err.message}`));
      }
    }
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
      this.currentTrackId = null;
    }
  }

  public getCurrentTrackId(): string | null {
    return this.currentTrackId;
  }

  public getCurrentTime(): number {
    return this.audioElement ? this.audioElement.currentTime : 0;
  }

  public getDuration(): number {
    return this.audioElement ? this.audioElement.duration || 0 : 0;
  }
}

export const staticAudioProvider = new StaticAudioProvider();
