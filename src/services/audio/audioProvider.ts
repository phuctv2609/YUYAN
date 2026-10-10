/**
 * YUYAN Audio Provider Base Interface
 */

import { AudioTrackMetadata, AudioServiceError } from './audioTypes';

export interface IAudioProvider {
  readonly name: string;
  isAvailable(): Promise<boolean>;
  play(track: AudioTrackMetadata, onEnded: () => void, onError: (err: AudioServiceError) => void): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  getCurrentTime(): number;
  getDuration(): number;
}
