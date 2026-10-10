import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  Copy,
  Check,
} from 'lucide-react';
import { useYuyanAI } from '../../context/YuyanAIContext';
import { useVoiceConversation } from '../../services/speech/useVoiceConversation';
import { YuyanAudioVisualizer } from './YuyanAudioVisualizer';
import { YuyanAIAvatar } from './YuyanAIAvatar';
import { YuyanMarkdownRenderer } from './YuyanMarkdownRenderer';

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

  const [copied, setCopied] = React.useState(false);

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
  if (typeof document === 'undefined') return null;

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

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200 isolate">
      <div
        role="dialog"
        aria-label="Hội thoại giọng nói Yuyan AI"
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[640px] max-h-[92vh] animate-in zoom-in-95 duration-200 isolate"
        style={{ backgroundColor: 'var(--surface, #ffffff)' }}
      >
        {/* Tier 1: Fixed Top Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-border-subtle/80 bg-surface-secondary/40 select-none">
          <div className="flex items-center gap-2.5">
            <YuyanAIAvatar size="sm" showOnlineStatus={true} />
            <div>
              <h3 className="text-sm font-bold text-text-primary leading-tight">Yuyan AI Voice</h3>
              <p className="text-2xs font-medium flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isRecording
                      ? 'bg-rose-500 animate-ping'
                      : isSpeaking
                      ? 'bg-primary animate-pulse'
                      : isGenerating
                      ? 'bg-amber-500 animate-bounce'
                      : 'bg-status-success'
                  }`}
                />
                <span className={isRecording ? 'text-rose-500 font-bold' : isSpeaking ? 'text-primary font-bold' : 'text-status-success'}>
                  {isRecording
                    ? 'Đang nghe bạn nói...'
                    : isGenerating
                    ? 'Đang phân tích câu hỏi...'
                    : isSpeaking
                    ? 'Đang phát âm song ngữ...'
                    : 'Sẵn sàng'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Language Selector trigger */}
            <button
              onClick={openLanguageModal}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface dark:bg-slate-800 border border-border-subtle text-xs font-semibold text-text-secondary hover:text-primary transition-colors"
              title="Đổi ngôn ngữ nhận diện"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>{settings.sttLanguage === 'zh-CN' ? 'ZH 🇨🇳' : 'VI 🇻🇳'}</span>
            </button>

            {/* Voice Settings trigger */}
            <button
              onClick={openSettingsModal}
              className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
              title="Cài đặt âm thanh và giọng đọc"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Close Modal */}
            <button
              onClick={() => {
                cancelRecording();
                stopSpeaking();
                closeVoiceModal();
              }}
              className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
              title="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tier 2: Dedicated Audio Visualizer & Waveform Bar (Fixed Height, Non-scrollable) */}
        <div className="flex-shrink-0 px-6 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-border-subtle flex flex-col items-center justify-center">
          <YuyanAudioVisualizer
            isActive={isRecording || isSpeaking}
            volumePercent={isRecording ? volume : isSpeaking ? 65 : 0}
            barCount={32}
          />
          <div className="mt-2 flex items-center justify-between w-full px-2 text-2xs text-text-muted">
            <span className="font-mono font-bold">{formatTimer(durationSeconds)}</span>
            <button
              onClick={openLanguageModal}
              className="hover:text-primary font-medium flex items-center gap-1"
            >
              <span>{getLanguageLabel()}</span>
              <span>▾</span>
            </button>
            <span className="text-3xs uppercase tracking-wider font-semibold text-primary">
              {settings.readingMode === 'chinese_only'
                ? 'Chỉ đọc tiếng Trung'
                : settings.readingMode === 'vietnamese_only'
                ? 'Chỉ đọc tiếng Việt'
                : 'Đọc song ngữ'}
            </span>
          </div>
        </div>

        {/* Tier 3: Independent Scrollable Conversation Feed (Never overlaps visualizer or buttons) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 bg-white dark:bg-slate-900 custom-scrollbar">
          {/* Error Banner */}
          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span className="font-medium">{error.message}</span>
              </div>
              <button
                onClick={startRecording}
                className="px-2.5 py-1 rounded-lg bg-rose-200 dark:bg-rose-800 font-bold text-2xs hover:bg-rose-300 transition-colors shrink-0"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* User's spoken transcript */}
          {(transcript || interimTranscript) && (
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 space-y-1">
              <p className="text-2xs font-bold uppercase tracking-wider text-primary">
                Bạn đang nói:
              </p>
              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                {transcript}
                {interimTranscript && (
                  <span className="text-text-muted italic ml-1 opacity-80">{interimTranscript}</span>
                )}
              </p>
            </div>
          )}

          {/* AI Response Card */}
          {lastAiResponse ? (
            <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 space-y-2.5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700 text-2xs text-text-muted">
                <span className="font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Phản hồi từ Yuyan AI:</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(lastAiResponse)}
                    className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Sao chép câu trả lời"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Render formatted Markdown */}
              <YuyanMarkdownRenderer content={lastAiResponse} fontSize="sm" />

              {/* Segmented Replay Action Buttons */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-1.5 text-2xs">
                <button
                  onClick={() => replayLastResponse('all')}
                  className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-semibold transition-colors flex items-center gap-1"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Nghe song ngữ</span>
                </button>
                <button
                  onClick={() => replayLastResponse('chinese_only')}
                  className="px-2 py-1 rounded-lg bg-surface-secondary text-text-secondary hover:text-primary font-medium transition-colors"
                >
                  Chỉ tiếng Trung
                </button>
                <button
                  onClick={() => replayLastResponse('vietnamese_only')}
                  className="px-2 py-1 rounded-lg bg-surface-secondary text-text-secondary hover:text-primary font-medium transition-colors"
                >
                  Chỉ tiếng Việt
                </button>
              </div>
            </div>
          ) : isRecording ? (
            <div className="py-8 text-center space-y-1 text-text-muted">
              <p className="text-xs font-medium">Yuyan AI đang chăm chú lắng nghe...</p>
              <p className="text-2xs">Em hãy nói bằng tiếng Trung hoặc tiếng Việt tự nhiên nhé.</p>
            </div>
          ) : isGenerating ? (
            <div className="py-8 text-center space-y-2 text-primary">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block animate-ping" />
              <p className="text-xs font-bold">Đang phân tích và xử lý câu trả lời...</p>
            </div>
          ) : (
            <div className="py-8 text-center space-y-1 text-text-muted">
              <p className="text-xs font-medium">Nhấn vào nút Micro bên dưới để bắt đầu luyện nói.</p>
              <p className="text-2xs">Hỗ trợ nhận diện tiếng Trung chuẩn xác và giải thích tiếng Việt rõ ràng.</p>
            </div>
          )}
        </div>

        {/* Tier 4: Fixed Bottom Control Bar (Fixed Height, Always Visible) */}
        <div className="flex-shrink-0 px-6 py-3 border-t border-border-subtle bg-slate-50 dark:bg-slate-800/80 flex items-center justify-between">
          {/* Cancel button */}
          <button
            onClick={() => {
              cancelRecording();
              stopSpeaking();
              closeVoiceModal();
            }}
            className="text-xs font-bold text-text-muted hover:text-text-primary px-3 py-2 rounded-xl transition-colors"
          >
            Hủy
          </button>

          {/* Central Action Microphone Button */}
          <div className="relative">
            {isRecording && (
              <span className="absolute -inset-1 rounded-full bg-rose-500/25 animate-ping" />
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
              className={`relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-all transform active:scale-95 ${
                isRecording
                  ? 'bg-rose-500 hover:bg-rose-600 ring-4 ring-rose-500/25'
                  : isSpeaking
                  ? 'bg-amber-500 hover:bg-amber-600 ring-4 ring-amber-500/25'
                  : 'bg-primary hover:bg-primary-hover'
              }`}
              title={isRecording ? 'Dừng và gửi câu hỏi' : isSpeaking ? 'Dừng phát âm' : 'Bắt đầu nói'}
            >
              {isRecording ? (
                <Square className="w-5 h-5 fill-current" />
              ) : isSpeaking ? (
                <Square className="w-5 h-5 fill-current" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>
          </div>

          {/* Replay or Language Toggle */}
          {lastAiResponse ? (
            <button
              onClick={() => replayLastResponse()}
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
    </div>,
    document.body
  );
};
