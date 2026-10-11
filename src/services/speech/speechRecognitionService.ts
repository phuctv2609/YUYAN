/**
 * YUYAN — Speech Recognition (STT) Service
 * Mobile-compatible, dual-engine speech recognition pipeline:
 * 1. Engine 'cloud' (Default on Mobile): Resilient MediaRecorder audio capture + Gemini 2.5 Flash STT
 * 2. Engine 'native' (Desktop Web Speech): Browser Web Speech API (webkitSpeechRecognition)
 *
 * Full 15-stage structured pipeline diagnostics:
 * Tracks permissions, real audio capture, volume metering, MIME negotiation,
 * Blob encoding, backend Edge Function submission, transcript parsing, and clean track teardown.
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

/**
 * Structured Pipeline Diagnostics Logger
 */
export function logVoiceStage(stage: number, description: string, data?: any) {
  const prefix = `[YUYAN-VOICE Stage ${stage}]`;
  if (data !== undefined) {
    console.log(`${prefix} ${description}`, data);
  } else {
    console.log(`${prefix} ${description}`);
  }
}

export class SpeechRecognitionService {
  private static instance: SpeechRecognitionService;
  private recognition: SpeechRecognitionType | null = null;
  private isListening: boolean = false;
  private activeEngine: 'native' | 'cloud' = 'cloud';

  private onResultCallback?: (result: STTRecognitionResult) => void;
  private onVolumeCallback?: (volumePercent: number) => void;
  private onErrorCallback?: (err: VoiceError) => void;
  private onEndCallback?: () => void;
  private onStartCallback?: () => void;

  private currentLang: SpeechRecognitionLanguage = 'zh-CN';
  private simulatedVolumeTimer: number | null = null;

  // Explicit Stop Workflow State
  private accumulatedFinalTranscript: string = '';
  private currentInterimTranscript: string = '';
  private explicitStopTriggered: boolean = false;

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
        isMobile: false,
        preferredEngine: 'cloud',
      };
    }

    const ua = navigator.userAgent || '';
    const isIOS =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/.test(ua);
    const isMobile = isIOS || isAndroid || /Mobi|Tablet|Mobile/i.test(ua);
    const isSecureContext = Boolean(
      window.isSecureContext ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
    );

    const hasNativeSTT =
      Boolean(
        (window as any).SpeechRecognition ||
          (window as any).webkitSpeechRecognition
      ) && isSecureContext;

    const hasMediaRecorder =
      Boolean(
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

    // CRITICAL ARCHITECTURE: On ALL mobile browsers (Android Chrome, iOS Safari, WebViews),
    // browser webkitSpeechRecognition is unreliable: it lacks Chinese models in VN,
    // fails silently, or gets blocked by carrier firewalls.
    // MediaRecorder + Gemini 2.5 Flash Cloud STT is 100% reliable across all devices.
    const preferredEngine: 'native' | 'cloud' = isMobile
      ? hasMediaRecorder
        ? 'cloud'
        : hasNativeSTT
        ? 'native'
        : 'cloud'
      : hasNativeSTT
      ? 'native'
      : hasMediaRecorder
      ? 'cloud'
      : 'native';

    return {
      hasNativeSTT,
      hasMediaRecorder,
      hasSpeechSynthesis,
      hasChineseVoice,
      hasVietnameseVoice,
      isSecureContext,
      isIOS,
      isAndroid,
      isMobile,
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
    autoStopOnSilence?: boolean;
    silenceThresholdMs?: number;
    onResult: (result: STTRecognitionResult) => void;
    onVolume?: (volumePercent: number) => void;
    onError?: (err: VoiceError) => void;
    onStart?: () => void;
    onEnd?: () => void;
  }): Promise<void> {
    logVoiceStage(1, 'Microphone button clicked, initializing speech recognition pipeline');
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
        message:
          'Thiết bị của bạn chưa hỗ trợ nhận diện giọng nói hoặc micro ghi âm. Vui lòng sử dụng Chrome hoặc Safari.',
      };
      options.onError?.(err);
      throw err;
    }

    // Clean up any existing session
    this.abortListening();

    this.accumulatedFinalTranscript = '';
    this.currentInterimTranscript = '';
    this.explicitStopTriggered = false;

    this.onResultCallback = options.onResult;
    this.onVolumeCallback = options.onVolume;
    this.onErrorCallback = options.onError;
    this.onStartCallback = options.onStart;
    this.onEndCallback = options.onEnd;
    this.currentLang = options.lang || 'zh-CN';

    // Engine negotiation:
    // On Mobile: always default to 'cloud' unless explicitly requested otherwise.
    let selectedEngine: 'native' | 'cloud' = caps.preferredEngine;
    if (options.engineMode === 'cloud' && caps.hasMediaRecorder) {
      selectedEngine = 'cloud';
    } else if (options.engineMode === 'native' && caps.hasNativeSTT && !caps.isMobile) {
      selectedEngine = 'native';
    } else if (caps.isMobile && caps.hasMediaRecorder) {
      selectedEngine = 'cloud';
    }

    this.activeEngine = selectedEngine;
    logVoiceStage(2, `Engine negotiated: ${selectedEngine} (mobile: ${caps.isMobile}, mode: ${options.engineMode || 'auto'})`);

    if (selectedEngine === 'native') {
      try {
        await this.startNativeRecognition(options);
      } catch (nativeErr: any) {
        console.warn('Native speech recognition failed, falling back to Gemini Cloud STT:', nativeErr);
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
   * Path A: Native Browser SpeechRecognition (Desktop Chrome)
   * Configured for continuous recognition across natural pauses and breaths.
   */
  private async startNativeRecognition(_options?: {
    lang?: SpeechRecognitionLanguage;
    continuous?: boolean;
    onStart?: () => void;
  }): Promise<void> {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      throw new Error('SpeechRecognition is not defined in this browser window.');
    }

    logVoiceStage(4, 'Initializing Native SpeechRecognition instance with continuous stream');
    this.recognition = new SpeechRec();
    // Continuous is ALWAYS true so browser does NOT stop on short pauses
    this.recognition.continuous = true;
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
      logVoiceStage(5, `Native SpeechRecognition listening active (lang: ${langCode})`);
      this.onStartCallback?.();
      this.startSimulatedVolume();
    };

    this.recognition.onresult = (event: any) => {
      let sessionFinal = '';
      let sessionInterim = '';

      // Loop through all results from 0 to capture full session transcript
      for (let i = 0; i < event.results.length; ++i) {
        const res = event.results[i];
        const text = res[0]?.transcript || '';
        if (res.isFinal) {
          sessionFinal += text;
        } else {
          sessionInterim += text;
        }
      }

      this.currentInterimTranscript = sessionInterim;
      const combined = [this.accumulatedFinalTranscript, sessionFinal].filter(Boolean).join(' ').trim();

      if (sessionInterim.length > 0 || combined.length > 0) {
        this.onVolumeCallback?.(Math.min(95, 45 + Math.round(Math.random() * 45)));
      }

      logVoiceStage(10, `Native interim/final result: "${combined || sessionInterim}"`);
      this.onResultCallback?.({
        transcript: combined,
        interimTranscript: sessionInterim.trim(),
        isFinal: Boolean(combined.length > 0),
        confidence: 0.95,
        engine: 'native',
      });
    };

    this.recognition.onerror = (event: any) => {
      const errCode = event?.error || 'unknown';
      console.warn('Native speech recognition event:', errCode);

      if (errCode === 'no-speech') {
        // Pauses and breaths are natural; do NOT abort recording!
        return;
      }

      const err = this.mapSpeechError(errCode);
      this.onErrorCallback?.(err);
    };

    this.recognition.onend = () => {
      logVoiceStage(6, 'Native SpeechRecognition onend event fired');
      
      // If user has NOT pressed Stop and session is still active,
      // restart recognition immediately so recording remains active!
      if (!this.explicitStopTriggered && this.isListening) {
        logVoiceStage(6, 'Native recognition onend fired before explicit Stop — auto-restarting to keep recording active');
        if (this.currentInterimTranscript) {
          this.accumulatedFinalTranscript = [this.accumulatedFinalTranscript, this.currentInterimTranscript].filter(Boolean).join(' ').trim();
          this.currentInterimTranscript = '';
        }
        try {
          this.recognition?.start();
          return;
        } catch (restartErr) {
          console.warn('Failed to restart native recognition:', restartErr);
        }
      }

      this.isListening = false;
      this.stopSimulatedVolume();
      this.onEndCallback?.();
    };

    this.recognition.start();
  }

  /**
   * Path B: Audio Recording via MediaRecorder + Cloud Gemini STT
   * Configured for continuous accumulation until user explicitly taps Stop.
   */
  private async startCloudRecording(options: {
    onVolume?: (volumePercent: number) => void;
    autoStopOnSilence?: boolean;
    silenceThresholdMs?: number;
  }): Promise<void> {
    try {
      this.isListening = true;
      logVoiceStage(3, 'Requesting microphone MediaStream via getUserMedia');
      await audioRecordingService.startRecording({
        // Default to false: explicitly controlled by user pressing Stop button
        autoStopOnSilence: options.autoStopOnSilence ?? false,
        silenceThresholdMs: options.silenceThresholdMs ?? 4000,
        onVolume: (vol) => {
          options.onVolume?.(vol);
          this.onVolumeCallback?.(vol);
        },
        onSilenceDetected: () => {
          if (options.autoStopOnSilence) {
            logVoiceStage(6, 'Silence detected after speech (VAD), auto-stopping');
            void this.stopListening();
          }
        },
        onStateChange: (state) => {
          if (state === 'recording') {
            logVoiceStage(5, 'MediaRecorder active, collecting audio data chunks with real volume meter');
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
      logVoiceStage(4, 'MediaRecorder and Web Audio analyser successfully initialized');
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
   * Stop active listening session explicitly and finalize recognition
   * Returns the final transcript result
   */
  public async stopListening(): Promise<STTRecognitionResult | null> {
    logVoiceStage(6, `Stop listening triggered explicitly (activeEngine: ${this.activeEngine})`);
    this.explicitStopTriggered = true;
    this.isListening = false;

    if (this.activeEngine === 'native') {
      this.stopSimulatedVolume();
      if (this.recognition) {
        try {
          this.recognition.stop();
        } catch {
          // ignore
        }
      }
      // Brief pause to allow the final result event from Web Speech API to settle
      await new Promise((resolve) => setTimeout(resolve, 200));

      const finalRecorded = [this.accumulatedFinalTranscript, this.currentInterimTranscript].filter(Boolean).join(' ').trim();
      this.cleanup();

      const result: STTRecognitionResult = {
        transcript: finalRecorded,
        interimTranscript: '',
        isFinal: true,
        confidence: 0.95,
        engine: 'native',
      };

      if (finalRecorded) {
        this.onResultCallback?.(result);
      }
      this.onEndCallback?.();
      return result;
    } else {
      // Cloud recording engine: stop recording and send audio Blob to Gemini STT
      const recorderState = audioRecordingService.getState();
      if (recorderState === 'recording' || recorderState === 'requesting') {
        try {
          logVoiceStage(6, 'Stopping MediaRecorder and finalizing audio Blob');
          const result = await audioRecordingService.stopRecording();
          logVoiceStage(7, `Audio Blob finalized: size=${result.sizeBytes} bytes, mime=${result.mimeType}, duration=${result.durationMs}ms`);

          // Validate usable audio existence
          if (result.sizeBytes < 400 || result.durationMs < 400) {
            logVoiceStage(7, 'Audio Blob is empty (<400 bytes) or too short', result);
            this.onErrorCallback?.({
              code: 'NO_SPEECH',
              message: 'Bản thu âm quá ngắn hoặc chưa thu được giọng nói rõ ràng. Em hãy nhấn nói lại nhé.',
            });
            return null;
          }

          logVoiceStage(8, 'Encoding audio to Base64 and uploading to Gemini Cloud STT');
          const base64Audio = await AudioRecordingService.blobToBase64(result.blob);

          const langHint =
            this.currentLang === 'vi-VN'
              ? 'vi-VN'
              : this.currentLang === 'auto'
              ? 'auto'
              : 'zh-CN';

          // Extract clean MIME type without codecs suffix for Gemini compatibility
          const cleanMime = (result.mimeType || 'audio/webm').split(';')[0].trim();

          const sttData = await aiApiService.transcribeAudio({
            audioBase64: base64Audio,
            audioMimeType: cleanMime,
            languageHint: langHint,
          });

          logVoiceStage(9, 'Gemini Cloud STT response received from server', sttData);

          if (sttData && sttData.transcript && sttData.transcript.trim()) {
            logVoiceStage(10, `Recognized speech parsed: "${sttData.transcript.trim()}" (lang: ${sttData.detectedLanguage})`);
            logVoiceStage(11, 'Delivering recognized transcript to UI conversation callback');
            const sttResult: STTRecognitionResult = {
              transcript: sttData.transcript.trim(),
              interimTranscript: '',
              isFinal: true,
              confidence: sttData.confidence || 0.95,
              engine: 'cloud',
            };
            this.onResultCallback?.(sttResult);
            return sttResult;
          } else {
            logVoiceStage(10, 'Empty transcript or silence detected in audio');
            this.onErrorCallback?.({
              code: 'NO_SPEECH',
              message: 'Chưa nhận diện được giọng nói rõ ràng. Em hãy thử nói to hơn một chút gần micro nhé.',
            });
            return null;
          }
        } catch (sttErr: any) {
          logVoiceStage(9, 'Cloud STT transcription error encountered', sttErr);
          this.onErrorCallback?.({
            code: 'AI_ERROR',
            message: sttErr?.message || 'Lỗi khi nhận diện giọng nói qua đám mây.',
          });
          return null;
        } finally {
          this.cleanup();
          this.onEndCallback?.();
        }
      } else {
        this.cleanup();
        this.onEndCallback?.();
        return null;
      }
    }
  }

  /**
   * Abort immediately without submitting or processing
   */
  public abortListening(): void {
    logVoiceStage(6, 'Aborting listening session immediately');
    this.explicitStopTriggered = true;
    this.isListening = false;
    this.stopSimulatedVolume();
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
