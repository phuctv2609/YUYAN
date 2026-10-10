import React, { useEffect } from 'react';
import {
  Mic,
  X,
  Volume2,
  Square,
  RotateCcw,
  Globe,
  Settings,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useYuyanAI } from '../../context/YuyanAIContext';
import { useVoiceConversation } from '../../services/speech/useVoiceConversation';
import { YuyanAudioVisualizer } from './YuyanAudioVisualizer';
import { YuyanAIAvatar } from './YuyanAIAvatar';

export const YuyanVoiceModal: React.FC = () => {
  const {
    isVoiceModalOpen,
    closeVoiceModal,
    openLanguageModal,
    openSettingsModal,
    sendMessage,
  } = useYuyanAI();

  const {
    state,
    volume,
    durationSeconds,
    transcript,
    interimTranscript,
    lastAiResponse,
    error,
    settings,
    startRecording,
    stopRecordingAndSend,
    cancelRecording,
    stopSpeaking,
    replayLastResponse,
  } = useVoiceConversation({
    onNewMessage: (msg) => {
      // Synchronize with main chat messages
      void sendMessage(msg.text);
    },
  });

  // Automatically start recording when modal opens
  useEffect(() => {
    if (isVoiceModalOpen) {
      void startRecording();
    } else {
      cancelRecording();
      stopSpeaking();
    }
  }, [isVoiceModalOpen]);

  if (!isVoiceModalOpen) return null;

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getLanguageLabel = () => {
    if (settings.sttLanguage === 'zh-CN') return 'Tiếng Trung (中文)';
    if (settings.sttLanguage === 'vi-VN') return 'Tiếng Việt (Việt Nam)';
    return 'Tự động nhận diện';
  };

  const isRecording = state === 'recording';
  const isSpeaking = state === 'speaking';
  const isGenerating = state === 'generating_response';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-surface dark:bg-slate-900 rounded-3xl border border-border-subtle shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-subtle/80 bg-surface-secondary/40">
          <div className="flex items-center gap-2.5">
            <YuyanAIAvatar size="sm" showOnlineStatus={true} />
            <div>
              <h3 className="text-sm font-bold text-text-primary leading-tight">Yuyan AI</h3>
              <p className="text-2xs text-status-success font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-status-success animate-pulse" />
                <span>
                  {isRecording
                    ? 'Đang nghe...'
                    : isGenerating
                    ? 'Đang xử lý...'
                    : isSpeaking
                    ? 'Đang phát âm...'
                    : 'Sẵn sàng'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Selector Dropdown trigger */}
            <button
              onClick={openLanguageModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface dark:bg-slate-800 border border-border-subtle text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>{settings.sttLanguage === 'zh-CN' ? 'ZH' : 'VI'}</span>
            </button>

            {/* Voice Settings trigger */}
            <button
              onClick={openSettingsModal}
              className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
              title="Cài đặt âm thanh"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Close Modal */}
            <button
              onClick={closeVoiceModal}
              className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 flex flex-col items-center justify-between gap-6 overflow-y-auto">
          {/* Audio Waveform Visualization */}
          <div className="w-full flex flex-col items-center pt-2">
            <YuyanAudioVisualizer
              isActive={isRecording || isSpeaking}
              volumePercent={isRecording ? volume : isSpeaking ? 65 : 0}
              barCount={30}
            />

            {/* Timer */}
            <div className="mt-3 font-mono text-xs font-bold text-text-muted">
              {formatTimer(durationSeconds)}
            </div>

            {/* Recognition Language Indicator Badge */}
            <button
              onClick={openLanguageModal}
              className="mt-2 text-2xs font-semibold text-text-secondary hover:text-primary flex items-center gap-1 px-3 py-1 rounded-full bg-surface-secondary/70 border border-border-subtle"
            >
              <span>{getLanguageLabel()}</span>
              <span className="text-2xs text-text-muted">▾</span>
            </button>
          </div>

          {/* Transcript / Content Feedback Box */}
          <div className="w-full min-h-[110px] p-4 rounded-2xl bg-surface-secondary/50 dark:bg-slate-800/40 border border-border-subtle flex flex-col justify-center text-center">
            {error ? (
              <div className="flex flex-col items-center gap-1.5 text-status-error text-xs">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">{error.message}</span>
                <button
                  onClick={startRecording}
                  className="mt-1 px-3 py-1 rounded-lg bg-status-error/10 hover:bg-status-error/20 text-status-error font-bold text-2xs"
                >
                  Thử lại
                </button>
              </div>
            ) : transcript || interimTranscript ? (
              <div className="space-y-1">
                <p className="text-2xs font-bold uppercase tracking-wider text-primary">
                  Bạn đang nói:
                </p>
                <p className="text-sm font-semibold text-text-primary leading-relaxed">
                  {transcript}
                  <span className="text-text-muted italic">{interimTranscript}</span>
                </p>
              </div>
            ) : lastAiResponse ? (
              <div className="space-y-1">
                <p className="text-2xs font-bold uppercase tracking-wider text-indigo-500 flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Phản hồi từ Yuyan AI:</span>
                </p>
                <p className="text-sm text-text-primary leading-relaxed font-hanzi">
                  {lastAiResponse}
                </p>
              </div>
            ) : isRecording ? (
              <p className="text-xs text-text-secondary italic">
                Hãy nói bằng tiếng Trung hoặc tiếng Việt, Yuyan AI đang lắng nghe...
              </p>
            ) : isGenerating ? (
              <p className="text-xs text-primary font-semibold animate-pulse">
                Đang xử lý nội dung hội thoại cùng Gemini...
              </p>
            ) : (
              <p className="text-xs text-text-muted">
                Nhấn vào nút Micro bên dưới để bắt đầu luyện nói.
              </p>
            )}
          </div>

          {/* Bottom Action Controls */}
          <div className="w-full flex items-center justify-between px-4 pb-2">
            {/* Cancel Action */}
            <button
              onClick={() => {
                cancelRecording();
                closeVoiceModal();
              }}
              className="text-xs font-bold text-text-muted hover:text-text-primary px-3 py-2 rounded-xl transition-colors"
            >
              Hủy
            </button>

            {/* Primary Microphone / State Action Button */}
            <div className="relative">
              {isRecording && (
                <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
              )}
              <button
                onClick={() => {
                  if (isRecording) {
                    stopRecordingAndSend();
                  } else if (isSpeaking) {
                    stopSpeaking();
                  } else {
                    void startRecording();
                  }
                }}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform active:scale-95 ${
                  isRecording
                    ? 'bg-primary hover:bg-primary-hover ring-4 ring-primary/25'
                    : isSpeaking
                    ? 'bg-indigo-600 hover:bg-indigo-700'
                    : 'bg-primary hover:bg-primary-hover'
                }`}
              >
                {isRecording ? (
                  <Square className="w-6 h-6 fill-current" />
                ) : isSpeaking ? (
                  <Volume2 className="w-6 h-6 animate-pulse" />
                ) : (
                  <Mic className="w-7 h-7" />
                )}
              </button>
            </div>

            {/* Replay or Switch Language Action */}
            {lastAiResponse ? (
              <button
                onClick={replayLastResponse}
                className="text-xs font-bold text-primary hover:text-primary-hover px-3 py-2 rounded-xl flex items-center gap-1 transition-colors"
                title="Phát lại phản hồi"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Phát lại</span>
              </button>
            ) : (
              <button
                onClick={openLanguageModal}
                className="text-xs font-bold text-text-secondary hover:text-text-primary px-3 py-2 rounded-xl transition-colors"
              >
                {settings.sttLanguage === 'zh-CN' ? 'ZH ↔ VI' : 'VI ↔ ZH'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
