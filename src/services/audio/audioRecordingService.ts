/**
 * YUYAN — Unified Audio Recording Service
 * Cross-platform, resilient audio recording with mime negotiation,
 * real-time volume analysis, strict stream track cleanup, and non-empty Blob validation.
 */

export type RecordingState = 'idle' | 'requesting' | 'recording' | 'processing' | 'stopped' | 'error';

export interface RecordingResult {
  blob: Blob;
  url: string;
  durationMs: number;
  mimeType: string;
  sizeBytes: number;
}

export interface AudioRecordingError {
  code: 'PERMISSION_DENIED' | 'DEVICE_NOT_FOUND' | 'DEVICE_BUSY' | 'UNSUPPORTED' | 'RECORDING_EMPTY' | 'UNKNOWN';
  message: string;
  technicalError?: string;
}

export class AudioRecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private chunks: Blob[] = [];
  private state: RecordingState = 'idle';
  private startTime: number = 0;
  private durationInterval: number | null = null;
  private animFrameId: number | null = null;
  private currentMimeType: string = '';
  private onVolumeCallback?: (volume: number) => void;
  private onDurationCallback?: (seconds: number) => void;
  private onStateCallback?: (state: RecordingState) => void;

  /**
   * Detects the best supported audio MIME type supported by browser MediaRecorder
   */
  public getSupportedMimeType(): string {
    if (typeof MediaRecorder === 'undefined') return '';

    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav',
    ];

    for (const type of candidates) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return '';
  }

  public getState(): RecordingState {
    return this.state;
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' &&
      Boolean(navigator?.mediaDevices?.getUserMedia) &&
      typeof MediaRecorder !== 'undefined';
  }

  /**
   * Start audio capture from device microphone
   */
  public async startRecording(options?: {
    onVolume?: (volumePercent: number) => void;
    onDuration?: (elapsedSeconds: number) => void;
    onStateChange?: (state: RecordingState) => void;
  }): Promise<void> {
    if (!this.isSupported()) {
      const err: AudioRecordingError = {
        code: 'UNSUPPORTED',
        message: 'Trình duyệt của bạn chưa hỗ trợ ghi âm trực tiếp qua Web Audio.',
      };
      this.setState('error');
      throw err;
    }

    // Ensure previous session is completely stopped & cleaned up
    this.cleanup();

    this.onVolumeCallback = options?.onVolume;
    this.onDurationCallback = options?.onDuration;
    this.onStateCallback = options?.onStateChange;

    this.setState('requesting');
    this.chunks = [];

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      this.mediaStream = stream;
    } catch (err: any) {
      this.setState('error');
      const errName = err?.name || '';
      if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
        throw {
          code: 'PERMISSION_DENIED',
          message: 'Quyền truy cập Microphone bị từ chối. Vui lòng cấp quyền trên thanh địa chỉ trình duyệt để luyện nói.',
          technicalError: err?.message,
        } as AudioRecordingError;
      }
      if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
        throw {
          code: 'DEVICE_NOT_FOUND',
          message: 'Không tìm thấy thiết bị microphone nào được kết nối với máy tính/điện thoại.',
          technicalError: err?.message,
        } as AudioRecordingError;
      }
      if (errName === 'NotReadableError' || errName === 'TrackStartError') {
        throw {
          code: 'DEVICE_BUSY',
          message: 'Microphone đang bị một ứng dụng khác (Zoom, Meet, Zalo) chiếm quyền sử dụng.',
          technicalError: err?.message,
        } as AudioRecordingError;
      }
      throw {
        code: 'UNKNOWN',
        message: `Lỗi kết nối microphone: ${err?.message || 'Không xác định'}`,
        technicalError: err?.message,
      } as AudioRecordingError;
    }

    // Setup Volume Analyser
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        const audioCtx = new AudioContextClass();
        this.audioContext = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        this.analyser = analyser;

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const meter = () => {
          if (this.state === 'recording' && this.analyser) {
            this.analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const avg = sum / dataArray.length;
            const volumePercent = Math.min(100, Math.round((avg / 128) * 100));
            if (this.onVolumeCallback) {
              this.onVolumeCallback(volumePercent);
            }
            this.animFrameId = requestAnimationFrame(meter);
          }
        };
        meter();
      }
    } catch {
      // AudioContext failure is non-fatal for recording itself
    }

    // Determine MIME
    this.currentMimeType = this.getSupportedMimeType();
    const recorderOptions: MediaRecorderOptions = {};
    if (this.currentMimeType) {
      recorderOptions.mimeType = this.currentMimeType;
    }

    const recorder = new MediaRecorder(stream, recorderOptions);
    this.mediaRecorder = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        this.chunks.push(event.data);
      }
    };

    recorder.start(200); // 200ms chunk slices
    this.startTime = Date.now();
    this.setState('recording');

    // Duration timer
    this.durationInterval = window.setInterval(() => {
      if (this.state === 'recording' && this.onDurationCallback) {
        const elapsedSec = Math.floor((Date.now() - this.startTime) / 1000);
        this.onDurationCallback(elapsedSec);
      }
    }, 500);
  }

  /**
   * Stop active recording and return validated Audio result
   */
  public async stopRecording(): Promise<RecordingResult> {
    if (!this.mediaRecorder || this.state !== 'recording') {
      throw {
        code: 'UNSUPPORTED',
        message: 'Không có phiên ghi âm nào đang diễn ra.',
      } as AudioRecordingError;
    }

    this.setState('processing');
    const durationMs = Math.max(200, Date.now() - this.startTime);

    return new Promise<RecordingResult>((resolve, reject) => {
      const recorder = this.mediaRecorder!;

      recorder.onstop = () => {
        const mime = this.currentMimeType || 'audio/webm';
        const blob = new Blob(this.chunks, { type: mime });

        // Clean up tracks immediately
        this.cleanupTracks();

        if (blob.size < 128) {
          this.setState('error');
          reject({
            code: 'RECORDING_EMPTY',
            message: 'Bản thu âm rỗng hoặc thời lượng quá ngắn (dưới 0.5s). Vui lòng nói to rõ hơn.',
          } as AudioRecordingError);
          return;
        }

        const url = URL.createObjectURL(blob);
        this.setState('stopped');

        resolve({
          blob,
          url,
          durationMs,
          mimeType: mime,
          sizeBytes: blob.size,
        });
      };

      try {
        recorder.stop();
      } catch (err: any) {
        this.cleanup();
        this.setState('error');
        reject({
          code: 'UNKNOWN',
          message: 'Không thể hoàn tất file ghi âm.',
          technicalError: err?.message,
        } as AudioRecordingError);
      }
    });
  }

  /**
   * Cancel and discard current recording session
   */
  public cancelRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      try {
        this.mediaRecorder.stop();
      } catch {
        // Safe ignore
      }
    }
    this.cleanup();
    this.setState('idle');
  }

  /**
   * Helper: Convert audio Blob to Base64 (pure base64 data string)
   */
  public static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Strip data:audio/xxx;base64, prefix
        const base64Data = result.split(',')[1] || result;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private setState(state: RecordingState): void {
    this.state = state;
    if (this.onStateCallback) {
      this.onStateCallback(state);
    }
  }

  private cleanupTracks(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.mediaStream = null;
    }

    if (this.durationInterval) {
      clearInterval(this.durationInterval);
      this.durationInterval = null;
    }

    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }

    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
    this.analyser = null;

    if (this.onVolumeCallback) {
      this.onVolumeCallback(0);
    }
  }

  public cleanup(): void {
    this.cleanupTracks();
    this.mediaRecorder = null;
    this.chunks = [];
    this.onVolumeCallback = undefined;
    this.onDurationCallback = undefined;
    this.onStateCallback = undefined;
  }
}

export const audioRecordingService = new AudioRecordingService();
