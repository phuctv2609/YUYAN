/**
 * YUYAN Audio State Store
 * Observable state holder for active playback, tracks, and canonical pronunciation targets.
 */

import { AudioPlaybackEvent, AudioPlaybackState, AudioTrackMetadata, AudioServiceError, PronunciationTarget } from './audioTypes';

type StateListener = (event: AudioPlaybackEvent) => void;

export class AudioStateStore {
  private currentState: AudioPlaybackState = 'idle';
  private currentTrack?: AudioTrackMetadata;
  private currentTarget?: PronunciationTarget;
  private currentTime: number = 0;
  private duration: number = 0;
  private currentError?: AudioServiceError;
  private listeners: Set<StateListener> = new Set();

  public getState(): AudioPlaybackState {
    return this.currentState;
  }

  public getTrack(): AudioTrackMetadata | undefined {
    return this.currentTrack;
  }

  public getCurrentTarget(): PronunciationTarget | undefined {
    return this.currentTarget || this.currentTrack?.target;
  }

  public getCurrentTime(): number {
    return this.currentTime;
  }

  public getDuration(): number {
    return this.duration;
  }

  public getError(): AudioServiceError | undefined {
    return this.currentError;
  }

  public subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    // Emit initial state
    listener(this.toEvent());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setState(
    state: AudioPlaybackState,
    track?: AudioTrackMetadata,
    error?: AudioServiceError
  ): void {
    this.currentState = state;
    if (track !== undefined) {
      this.currentTrack = track;
      this.currentTarget = track.target;
    }
    if (error !== undefined) this.currentError = error;
    if (state === 'idle' || state === 'stopped') {
      this.currentTime = 0;
      if (state === 'idle') {
        this.currentTarget = undefined;
      }
    }
    this.notify();
  }

  public updateProgress(currentTime: number, duration: number): void {
    this.currentTime = currentTime;
    this.duration = duration;
    this.notify();
  }

  private toEvent(): AudioPlaybackEvent {
    return {
      state: this.currentState,
      track: this.currentTrack,
      currentTarget: this.currentTarget || this.currentTrack?.target,
      currentTime: this.currentTime,
      duration: this.duration,
      error: this.currentError,
    };
  }

  private notify(): void {
    const event = this.toEvent();
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.error('Error in AudioState listener:', err);
      }
    }
  }
}

export const audioStateStore = new AudioStateStore();
