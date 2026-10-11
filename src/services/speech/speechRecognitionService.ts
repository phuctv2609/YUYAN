/**
 * YUYAN — Speech Recognition (STT) Service
 * Mobile-compatible, dual-engine speech recognition pipeline:
 * 1. Engine 'native': Browser Web Speech API (webkitSpeechRecognition)
 * 2. Engine 'cloud': Resilient MediaRecorder audio capture + Gemini 2.5 Flash STT
 *
 * Designed specifically to avoid mobile OS microphone exclusivity locks,
 * support iOS Safari / Android Chrome / WebViews, handle secure-context checks,
 * and release all hardware media tracks cleanly.
 */

import {
  SpeechRecognitionLanguage,
  STTRecognitionResult,
  VoiceError,
  MobileVoiceCapabilities,
  STTEngineMode,
} from './speechTypes';
import { audioRecordingService, AudioRecordingService } from '../audio/audioRecordingService';
import { aiApiService } from '../ai/aiApiService';

type SpeechRecognitionType = any;

export class SpeechRecognitionService {
  private static instance: SpeechRecognitionService;
  private recognition: SpeechRecognitionType | null = null;
  private isListening: boolean = false;
  private activeEngine: 'native' | 'cloud' = 'native';

  private onResultCallback?: (result: STTRecognitionResult) => void;
  private onVolumeCallback?: (volumePercent: number) => void;
  private onErrorCallback?: (err: VoiceError) => void;
  private onEndCallback?: () => void;
  private onStartCallback?: () => void;

  private currentLang: SpeechRecognitionLanguage = 'zh-CN';
  private simulatedVolumeTimer: number | null = null;

  public static getInstance(): SpeechRecognitionService {
    if (!SpeechRecognitionService.instance) {
      SpeechRecognitionService.instance = new SpeechRecognitionService();
    }
    return SpeechRecognitionService.instance;
  }

  /**
   * Device and platform capabilities detection
   */
  public getCapabilities(): MobileVoiceCapabilities {
    if (typeof window === 'undefined') {
      return {
        hasNativeSTT: false,
        hasMediaRecorder: false,
        hasSpeechSynthesis: false,
        hasChineseVoice: false,
        hasVietnameseVoice: false,
        isSecureContext: false,
        isIOS: false,
        isAndroid: false,
        preferredEngine: 'cloud',
      };
    }

    const ua = navigator.userAgent || '';
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isSecureContext = Boolean(window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    const hasNativeSTT = Boolean(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    ) && isSecureContext;

    const hasMediaRecorder = Boolean(
      typeof navigator?.mediaDevices?.getUserMedia === 'function' &&
      typeof MediaRecorder !== 'undefined'
    ) && isSecureContext;

    const hasSpeechSynthesis = Boolean(window.speechSynthesis);

    let hasChineseVoice = false;
    let hasVietnameseVoice = false;
    if (hasSpeechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      hasChineseVoice = voices.some((v) => (v.lang || '').toLowerCase().startsWith('zh'));
      hasVietnameseVoice = voices.some((v) => (v.lang || '').toLowerCase().startsWith('vi'));
    }

    // On iOS Safari / in-app browsers, MediaRecorder + Gemini cloud STT is vastly more reliable
    // than webkitSpeechRecognition which frequently cuts out or blocks continuous listening.
    const preferredEngine = hasNativeSTT && !isIOS ? 'native' : hasMediaRecorder ? 'cloud' : hasNativeSTT ? 'native' : 'cloud';

    return {
      hasNativeSTT,
      hasMediaRecorder,
      hasSpeechSynthesis,
      hasChineseVoice,
      hasVietnameseVoice,
      isSecureContext,
      isIOS,
      isAndroid,
      preferredEngine,
    };
  }

  /**
   * Overall speech input support: true if either Native Web Speech or Cloud Recorder is supported
   */
  public isSupported(): boolean {
    const caps = this.getCapabilities();
    return caps.hasNativeSTT || caps.hasMediaRecorder;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public getActiveEngine(): 'native' | 'cloud' {
    return this.activeEngine;
  }

  /**
   * Start listening for speech input using negotiated engine
   */
  public async startListening(options: {
    lang?: SpeechRecognitionLanguage;
    engineMode?: STTEngineMode;
    continuous?: boolean;
    onResult: (result: STTRecognitionResult) => void;
    onVolume?: (volumePercent: number) => void;
    onError?: (err: VoiceError) => void;
    onStart?: () => void;
    onEnd?: () => void;
  }): Promise<void> {
    const caps = this.getCapabilities();

    if (!caps.isSecureContext) {
      const err: VoiceError = {
        code: 'NOT_SUPPORTED',
        message: 'Trình duyệt yêu cầu kết nối bảo mật (HTTPS) để sử dụng micro ghi âm.',
      };
      options.onError?.(err);
      throw err;
    }

    if (!caps.hasNativeSTT && !caps.hasMediaRecorder) {
      const err: VoiceError = {
        code: 'NOT_SUPPORTED',
        message: 'Thiết bị của bạn chưa hỗ trợ nhận diện giọng nói hoặc micro ghi âm. Vui lòng sử dụng Chrome hoặc Safari.',
      };
      options.onError?.(err);
      throw err;
    }

    // Clean up any existing session
    this.stopListening();

    this.onResultCallback = options.onResult;
    this.onVolumeCallback = options.onVolume;
    this.onErrorCallback = options.onError;
    this.onStartCallback = options.onStart;
    this.onEndCallback = options.onEnd;
    this.currentLang = options.lang || 'zh-CN';

    // Determine engine: 'auto' | 'native' | 'cloud'
    let selectedEngine: 'native' | 'cloud' = caps.preferredEngine;
    if (options.engineMode === 'native' && caps.hasNativeSTT) {
      selectedEngine = 'native';
    } else if (options.engineMode === 'cloud' && caps.hasMediaRecorder) {
      selectedEngine = 'cloud';
    }
    this.activeEngine = selectedEngine;

    if (selectedEngine === 'native') {
      try {
        await this.startNativeRecognition(options);
      } catch (nativeErr: any) {
        console.warn('Native speech recognition failed, attempting cloud recorder fallback:', nativeErr);
        // Seamless fallback to cloud recorder if media recorder is available
        if (caps.hasMediaRecorder) {
          this.activeEngine = 'cloud';
          await this.startCloudRecording(options);
        } else {
          throw nativeErr;
        }
      }
    } else {
      await this.startCloudRecording(options);
    }
  }

  /**
   * Path A: Native Browser SpeechRecognition
   */
  private async startNativeRecognition(options: {
    lang?: SpeechRecognitionLanguage;
    continuous?: boolean;
    onStart?: () => void;
  }): Promise<void> {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      throw new Error('SpeechRecognition is not defined in this browser window.');
    }

    this.recognition = new SpeechRec();
    this.recognition.continuous = options.continuous ?? false;
    this.recognition.interimResults = true;
    this.recognition.maxAlternatives = 1;

    const langCode =
      this.currentLang === 'vi-VN'
        ? 'vi-VN'
        : this.currentLang === 'auto'
        ? 'zh-CN'
        : 'zh-CN';
    this.recognition.lang = langCode;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.onStartCallback?.();
      this.startSimulatedVolume();
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

      // Boost volume reading on active interim result
      if (interimTranscript.length > 0 || finalTranscript.length > 0) {
        this.onVolumeCallback?.(Math.min(95, 45 + Math.round(Math.random() * 45)));
      }

      this.onResultCallback?.({
        transcript: finalTranscript.trim(),
        interimTranscript: interimTranscript.trim(),
        isFinal: Boolean(finalTranscript.length > 0),
        confidence,
        engine: 'native',
      });
    };

    this.recognition.onerror = (event: any) => {
      const errCode = event?.error || 'unknown';
      console.warn('Native speech recognition error:', errCode);

      // On mobile no-speech is gentle, don't crash the session
      if (errCode === 'no-speech') {
        this.onErrorCallback?.({
          code: 'NO_SPEECH',
          message: 'Chưa thu được giọng nói. Em hãy nói to và rõ hơn gần microphone nhé.',
        });
        return;
      }

      const err = this.mapSpeechError(errCode);
      this.onErrorCallback?.(err);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.stopSimulatedVolume();
      this.onEndCallback?.();
    };

    // Note: WE DO NOT call startVolumeAnalysis() here to avoid mobile hardware microphone contention!
    this.recognition.start();
  }

  /**
   * Path B: Mobile Audio Recording via MediaRecorder + Cloud Gemini STT
   */
  private async startCloudRecording(options: {
    onVolume?: (volumePercent: number) => void;
  }): Promise<void> {
    try {
      this.isListening = true;
      await audioRecordingService.startRecording({
        onVolume: (vol) => {
          options.onVolume?.(vol);
          this.onVolumeCallback?.(vol);
        },
        onStateChange: (state) => {
          if (state === 'recording') {
            this.onStartCallback?.();
          } else if (state === 'error') {
            this.isListening = false;
            this.onErrorCallback?.({
              code: 'AUDIO_CAPTURE',
              message: 'Không thể truy cập microphone. Vui lòng cấp quyền trong cài đặt trình duyệt.',
            });
          }
        },
      });
    } catch (recordErr: any) {
      this.isListening = false;
      const err: VoiceError = {
        code: recordErr?.code === 'PERMISSION_DENIED' ? 'PERMISSION_DENIED' : 'AUDIO_CAPTURE',
        message: recordErr?.message || 'Không thể bắt đầu ghi âm qua microphone.',
        technicalError: recordErr?.technicalError,
      };
      this.onErrorCallback?.(err);
      throw err;
    }
  }

  /**
   * Stop active listening session safely and retrieve final transcript
   */
  public async stopListening(): Promise<void> {
    if (this.activeEngine === 'native') {
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch {
          // ignore already stopped
        }
      }
      this.cleanup();
    } else {
      // Cloud recording engine: stop recording and send to Gemini STT
      if (audioRecordingService.getState() === 'recording') {
        this.isListening = false;
        try {
          const result = await audioRecordingService.stopRecording();
          const base64Audio = await AudioRecordingService.blobToBase64(result.blob);

          // Invoke Gemini Speech-to-Text
          const langHint =
            this.currentLang === 'vi-VN'
              ? 'vi-VN'
              : this.currentLang === 'auto'
              ? 'auto'
              : 'zh-CN';

          const sttData = await aiApiService.transcribeAudio({
            audioBase64: base64Audio,
            audioMimeType: result.mimeType,
            languageHint: langHint,
          });

          if (sttData && sttData.transcript) {
            this.onResultCallback?.({
              transcript: sttData.transcript.trim(),
              interimTranscript: '',
              isFinal: true,
              confidence: sttData.confidence || 0.95,
              engine: 'cloud',
            });
          } else {
            this.onErrorCallback?.({
              code: 'NO_SPEECH',
              message: 'Chưa thu được giọng nói rõ ràng. Em hãy thử nói to hơn một chút nhé.',
            });
          }
        } catch (sttErr: any) {
          console.warn('Cloud STT transcription error:', sttErr);
          this.onErrorCallback?.({
            code: 'AI_ERROR',
            message: sttErr?.message || 'Lỗi khi nhận diện giọng nói qua đám mây.',
          });
        } finally {
          this.cleanup();
          this.onEndCallback?.();
        }
      } else {
        this.cleanup();
      }
    }
  }

  /**
   * Abort immediately without submitting or processing
   */
  public abortListening(): void {
    if (this.activeEngine === 'native') {
      if (this.recognition) {
        try {
          this.recognition.abort();
        } catch {
          // ignore
        }
      }
    } else {
      audioRecordingService.cancelRecording();
    }
    this.cleanup();
  }

  /**
   * Simulated organic waveform pulsing when native speech recognition is active
   */
  private startSimulatedVolume(): void {
    this.stopSimulatedVolume();
    this.simulatedVolumeTimer = window.setInterval(() => {
      if (!this.isListening) return;
      // Gentle breathing wave 15..35%
      const baseWave = 15 + Math.round(Math.sin(Date.now() / 200) * 12);
      this.onVolumeCallback?.(Math.max(5, baseWave));
    }, 120);
  }

  private stopSimulatedVolume(): void {
    if (this.simulatedVolumeTimer) {
      clearInterval(this.simulatedVolumeTimer);
      this.simulatedVolumeTimer = null;
    }
    this.onVolumeCallback?.(0);
  }

  private cleanup(): void {
    this.isListening = false;
    this.stopSimulatedVolume();
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
            'Lỗi kết nối mạng trong quá trình nhận diện giọng nói. Bạn có thể chuyển sang chế độ Ghi âm AI.',
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
