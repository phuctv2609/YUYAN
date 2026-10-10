/**
 * YUYAN — Speech Recognition (STT) Service
 * Web Speech API integration with real-time interim results,
 * Web Audio Analyser volume tracking for responsive waveform visualization,
 * strict media track release, and comprehensive Vietnamese error handling.
 */

import {
  SpeechRecognitionLanguage,
  STTRecognitionResult,
  VoiceError,
} from './speechTypes';

type SpeechRecognitionType = any;

export class SpeechRecognitionService {
  private static instance: SpeechRecognitionService;
  private recognition: SpeechRecognitionType | null = null;
  private isListening: boolean = false;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private animFrameId: number | null = null;

  private onResultCallback?: (result: STTRecognitionResult) => void;
  private onVolumeCallback?: (volumePercent: number) => void;
  private onErrorCallback?: (err: VoiceError) => void;
  private onEndCallback?: () => void;
  private onStartCallback?: () => void;

  public static getInstance(): SpeechRecognitionService {
    if (!SpeechRecognitionService.instance) {
      SpeechRecognitionService.instance = new SpeechRecognitionService();
    }
    return SpeechRecognitionService.instance;
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return Boolean(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Start listening for speech input
   */
  public async startListening(options: {
    lang?: SpeechRecognitionLanguage;
    continuous?: boolean;
    onResult: (result: STTRecognitionResult) => void;
    onVolume?: (volumePercent: number) => void;
    onError?: (err: VoiceError) => void;
    onStart?: () => void;
    onEnd?: () => void;
  }): Promise<void> {
    if (!this.isSupported()) {
      const err: VoiceError = {
        code: 'NOT_SUPPORTED',
        message:
          'Trình duyệt này chưa hỗ trợ nhận diện giọng nói Web Speech. Vui lòng sử dụng Chrome, Edge hoặc Safari.',
      };
      options.onError?.(err);
      throw err;
    }

    // Clean up any lingering active sessions
    this.stopListening();

    this.onResultCallback = options.onResult;
    this.onVolumeCallback = options.onVolume;
    this.onErrorCallback = options.onError;
    this.onStartCallback = options.onStart;
    this.onEndCallback = options.onEnd;

    const SpeechRec =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    try {
      this.recognition = new SpeechRec();
      this.recognition.continuous = options.continuous ?? false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      // Map language
      const langCode =
        options.lang === 'vi-VN'
          ? 'vi-VN'
          : options.lang === 'auto'
          ? 'zh-CN' // default to Mandarin for Chinese learning app
          : 'zh-CN';
      this.recognition.lang = langCode;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.onStartCallback?.();
      };

      this.recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        let confidence = 0.9;

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const text = res[0]?.transcript || '';
          if (res.isFinal) {
            finalTranscript += text;
            confidence = res[0]?.confidence || 0.9;
          } else {
            interimTranscript += text;
          }
        }

        this.onResultCallback?.({
          transcript: finalTranscript.trim(),
          interimTranscript: interimTranscript.trim(),
          isFinal: Boolean(finalTranscript.length > 0),
          confidence,
        });
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition error event:', event.error);
        const err = this.mapSpeechError(event.error);
        this.onErrorCallback?.(err);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.stopVolumeAnalysis();
        this.onEndCallback?.();
      };

      // Start Web Audio analyser for real-time waveform if volume callback provided
      if (options.onVolume && typeof navigator?.mediaDevices?.getUserMedia === 'function') {
        try {
          await this.startVolumeAnalysis();
        } catch {
          // Microphone access for volume analysis may fail or be denied; continue STT
        }
      }

      this.recognition.start();
    } catch (startErr: any) {
      this.cleanup();
      const err: VoiceError = {
        code: 'AUDIO_CAPTURE',
        message: 'Không thể khởi động micro thu âm. Vui lòng kiểm tra quyền thiết bị.',
        technicalError: startErr?.message,
      };
      this.onErrorCallback?.(err);
      throw err;
    }
  }

  /**
   * Stop active speech recognition safely
   */
  public stopListening(): void {
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // ignore already stopped
      }
    }
    this.cleanup();
  }

  /**
   * Abort immediately without firing further result events
   */
  public abortListening(): void {
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // ignore
      }
    }
    this.cleanup();
  }

  /**
   * Real-time Volume Analyzer using Web Audio API
   */
  private async startVolumeAnalysis(): Promise<void> {
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(this.micStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.5;
      source.connect(this.analyser);

      const bufferLength = this.analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!this.analyser || !this.isListening) return;

        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        // Normalize 0..255 to percentage 0..100
        const volumePercent = Math.min(100, Math.round((average / 128) * 100));

        this.onVolumeCallback?.(volumePercent);
        this.animFrameId = requestAnimationFrame(updateVolume);
      };

      this.animFrameId = requestAnimationFrame(updateVolume);
    } catch {
      // Ignore if separate volume stream fails
    }
  }

  private stopVolumeAnalysis(): void {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch {
        // ignore
      }
      this.audioContext = null;
    }
    this.analyser = null;
  }

  private cleanup(): void {
    this.isListening = false;
    this.stopVolumeAnalysis();
    this.recognition = null;
  }

  private mapSpeechError(errorCode: string): VoiceError {
    switch (errorCode) {
      case 'not-allowed':
      case 'permission-denied':
        return {
          code: 'PERMISSION_DENIED',
          message:
            'Quyền truy cập micro đã bị từ chối. Vui lòng cho phép quyền micro trên thanh địa chỉ trình duyệt để nói chuyện cùng Yuyan AI.',
        };
      case 'no-speech':
        return {
          code: 'NO_SPEECH',
          message:
            'Chưa thu được giọng nói. Vui lòng nói to và rõ hơn gần microphone.',
        };
      case 'audio-capture':
        return {
          code: 'AUDIO_CAPTURE',
          message:
            'Không tìm thấy microphone hoặc thiết bị thu âm đang bận bởi ứng dụng khác.',
        };
      case 'network':
        return {
          code: 'NETWORK',
          message:
            'Lỗi kết nối mạng trong quá trình nhận diện giọng nói. Vui lòng kiểm tra đường truyền Internet.',
        };
      case 'aborted':
        return {
          code: 'ABORTED',
          message: 'Đã hủy phiên nhận diện giọng nói.',
        };
      default:
        return {
          code: 'UNKNOWN',
          message: `Lỗi nhận diện giọng nói: ${errorCode}`,
        };
    }
  }
}

export const speechRecognitionService = SpeechRecognitionService.getInstance();
