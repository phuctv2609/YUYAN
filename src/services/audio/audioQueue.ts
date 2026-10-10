/**
 * YUYAN Audio Playback Queue
 * Manages playlist, track order, and sequential auto-advance.
 */

import { AudioTrackMetadata } from './audioTypes';

export class AudioQueue {
  private queue: AudioTrackMetadata[] = [];
  private currentIndex: number = -1;
  private autoAdvance: boolean = false;

  public setQueue(tracks: AudioTrackMetadata[], startIndex: number = 0, autoAdvance: boolean = false): void {
    this.queue = [...tracks];
    this.currentIndex = Math.max(0, Math.min(startIndex, tracks.length - 1));
    this.autoAdvance = autoAdvance;
  }

  public getCurrentTrack(): AudioTrackMetadata | undefined {
    if (this.currentIndex >= 0 && this.currentIndex < this.queue.length) {
      return this.queue[this.currentIndex];
    }
    return undefined;
  }

  public getNextTrack(): AudioTrackMetadata | undefined {
    if (this.currentIndex + 1 < this.queue.length) {
      this.currentIndex++;
      return this.queue[this.currentIndex];
    }
    return undefined;
  }

  public getPreviousTrack(): AudioTrackMetadata | undefined {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      return this.queue[this.currentIndex];
    }
    return undefined;
  }

  public hasNext(): boolean {
    return this.currentIndex + 1 < this.queue.length;
  }

  public hasPrevious(): boolean {
    return this.currentIndex > 0;
  }

  public isAutoAdvanceEnabled(): boolean {
    return this.autoAdvance;
  }

  public clear(): void {
    this.queue = [];
    this.currentIndex = -1;
    this.autoAdvance = false;
  }

  public size(): number {
    return this.queue.length;
  }

  public getCurrentIndex(): number {
    return this.currentIndex;
  }
}

export const audioQueue = new AudioQueue();
