import React, { useEffect, useState } from 'react';
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
  Radio,
  Cpu,
  Loader2,
  ChevronLeft,
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
    appendMessage,
    conversationMode,
    activeScenario,
    hskLevel,
  } = useYuyanAI();

  const {
    state,
    volume,
    durationSeconds,
    transcript,
    interimTranscript,
    lastAiResponse,
    lastAiPinyin,
    lastAiVietnamese,
    error,
    settings,
    capabilities,
    activeEngine,
    switchEngineMode,
    startRecording,
    stopRecordingAndSend,
    cancelRecording,
    stopSpeaking,
    replayLastResponse,
  } = useVoiceConversation({
    scenario: activeScenario,
    conversationMode,
    hskLevel,
    onNewMessage: (msg) => {
      // Synchronize with main chat messages without triggering duplicate AI calls
      appendMessage({
        sender: msg.sender,
        text: msg.text,
        pinyin: msg.pinyin,
        vietnamese: msg.vietnamese,
        feedback: msg.feedback,
        followUp: msg.followUp,
      });
    },
  });

  const [copied, setCopied] = useState(false);

  // Mobile background scroll lock & cleanup
  useEffect(() => {
    if (isVoiceModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
        cancelRecording();
        stopSpeaking();
      };
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
  const isTranscribing = state === 'transcribing';
  const isRequesting = state === 'requesting_permission';

  const handleCopy = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200 isolate"
      role="dialog"
      aria-modal="true"
      aria-label="Hội thoại giọng nói Yuyan AI"
    >
      <div
        className="relative w-full h-[100dvh] sm:h-[640px] sm:max-h-[92vh] sm:max-w-lg bg-surface text-text-primary sm:rounded-3xl rounded-none border-0 sm:border border-border-subtle shadow-2xl flex flex-col overflow-hidden isolate"
        style={{ backgroundColor: 'var(--surface, #ffffff)' }}
      >
        {/* Tier 1: Fixed Top Header with Safe Area support */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 sm:px-5 pt-[max(12px,env(safe-area-inset-top))] sm:pt-3.5 pb-2.5 border-b border-border-subtle/80 bg-surface-secondary/50 select-none">
          <div className="flex items-center gap-2 min-w-0">
            {/* Mobile Back / Close Button */}
            <button
              onClick={() => {
                cancelRecording();
                stopSpeaking();
                closeVoiceModal();
              }}
              className="sm:hidden p-1.5 -ml-1 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface transition-colors active:scale-95 flex-shrink-0"
              aria-label="Quay lại"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <YuyanAIAvatar size="sm" showOnlineStatus={true} />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="text-xs sm:text-sm font-bold text-text-primary leading-tight whitespace-nowrap">Yuyan AI</h3>
                {/* Engine Badge */}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-tight uppercase flex items-center gap-0.5 shrink-0 ${
                    activeEngine === 'cloud'
                      ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                      : 'bg-primary/15 text-primary border border-primary/30'
                  }`}
                  title={
                    activeEngine === 'cloud'
                      ? 'Đang dùng bộ ghi âm AI Gemini (Tương thích cao cho di động)'
                      : 'Đang dùng bộ nhận diện giọng nói Web Speech của trình duyệt'
                  }
                >
                  {activeEngine === 'cloud' ? <Cpu className="w-2.5 h-2.5" /> : <Radio className="w-2.5 h-2.5" />}
                  <span className="hidden min-[380px]:inline">{activeEngine === 'cloud' ? 'AI Cloud' : 'Web Speech'}</span>
                </span>
              </div>
              <p className="text-2xs font-medium flex items-center gap-1 mt-0.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isRecording
                      ? 'bg-rose-500 animate-ping'
                      : isSpeaking
                      ? 'bg-primary animate-pulse'
                      : isGenerating || isTranscribing
                      ? 'bg-amber-500 animate-bounce'
                      : 'bg-status-success'
                  }`}
                />
                <span
                  className={`truncate ${
                    isRecording
                      ? 'text-rose-500 font-bold'
                      : isSpeaking
                      ? 'text-primary font-bold'
                      : isGenerating || isTranscribing
                      ? 'text-amber-500 font-bold'
                      : 'text-status-success'
                  }`}
                >
                  {isRecording
                    ? 'Đang nghe...'
                    : isTranscribing
                    ? 'Đang nhận diện...'
                    : isGenerating
                    ? 'Đang suy nghĩ...'
                    : isSpeaking
                    ? 'Đang phát âm...'
                    : isRequesting
                    ? 'Xin quyền micro...'
                    : 'Sẵn sàng'}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Language Selector trigger */}
            <button
              onClick={openLanguageModal}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-surface dark:bg-slate-800 border border-border-subtle text-xs font-semibold text-text-secondary hover:text-primary transition-colors cursor-pointer active:scale-95"
              title="Đổi ngôn ngữ nhận diện"
            >
              <Globe className="w-3.5 h-3.5 text-primary" />
              <span>{settings.sttLanguage === 'zh-CN' ? 'ZH 🇨🇳' : 'VI 🇻🇳'}</span>
            </button>

            {/* Voice Settings trigger */}
            <button
              onClick={openSettingsModal}
              className="p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
              title="Cài đặt âm thanh và giọng đọc"
              aria-label="Cài đặt âm thanh"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Desktop Close Modal */}
            <button
              onClick={() => {
                cancelRecording();
                stopSpeaking();
                closeVoiceModal();
              }}
              className="hidden sm:inline-flex p-1.5 rounded-full text-text-muted hover:text-text-primary hover:bg-surface transition-colors cursor-pointer"
              title="Đóng cửa sổ"
              aria-label="Đóng cửa sổ"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tier 2: Dedicated Audio Visualizer & Waveform Bar (Fixed Height, Non-scrollable) */}
        <div className="flex-shrink-0 px-3.5 sm:px-6 py-2 bg-surface-secondary/30 border-b border-border-subtle flex flex-col items-center justify-center">
          <YuyanAudioVisualizer
            isActive={isRecording || isSpeaking}
            volumePercent={isRecording ? volume : isSpeaking ? 65 : 0}
            barCount={capabilities.isIOS || capabilities.isAndroid ? 24 : 32}
            className="h-10 sm:h-12"
          />
          <div className="mt-1 flex items-center justify-between w-full px-1 text-2xs text-text-muted">
            <span className="font-mono font-bold text-text-primary">{formatTimer(durationSeconds)}</span>
            <button
              onClick={openLanguageModal}
              className="hover:text-primary font-medium flex items-center gap-0.5 cursor-pointer truncate max-w-[150px]"
            >
              <span className="truncate">{getLanguageLabel()}</span>
              <span className="shrink-0">▾</span>
            </button>
            <span className="text-3xs uppercase tracking-wider font-semibold text-primary shrink-0">
              {settings.readingMode === 'chinese_only'
                ? 'Chỉ tiếng Trung'
                : settings.readingMode === 'vietnamese_only'
                ? 'Chỉ tiếng Việt'
                : 'Song ngữ'}
            </span>
          </div>
        </div>

        {/* Tier 3: Independent Scrollable Conversation Feed (Never overlaps visualizer or buttons) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3.5 bg-surface custom-scrollbar">
          {/* Missing Voice Notice if device lacks voices */}
          {!capabilities.hasChineseVoice && (
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-2xs flex items-center justify-between gap-2">
              <span className="leading-snug">
                💡 Thiết bị chưa cài giọng đọc tiếng Trung trong hệ thống. Bạn có thể bật thêm giọng đọc trong Cài đặt hoặc đọc bằng chữ.
              </span>
              <button
                onClick={openSettingsModal}
                className="underline font-bold shrink-0 text-primary"
              >
                Cài đặt
              </button>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold">{error.message}</p>
                  {error.code === 'PERMISSION_DENIED' && (
                    <p className="text-2xs opacity-90">
                      Trên điện thoại, bạn hãy nhấn vào biểu tượng ổ khóa hoặc icon micro trên thanh địa chỉ trình duyệt để cấp quyền micro nhé.
                    </p>
                  )}
                  {error.code === 'NETWORK' && (
                    <button
                      onClick={() => switchEngineMode('cloud')}
                      className="text-2xs font-bold text-primary underline block cursor-pointer"
                    >
                      Bấm vào đây để chuyển sang Ghi âm AI Cloud
                    </button>
                  )}
                </div>
              </div>
              <button
                onClick={() => void startRecording()}
                className="px-3 py-1.5 rounded-xl bg-rose-200 dark:bg-rose-800 font-bold text-2xs hover:bg-rose-300 transition-colors shrink-0 cursor-pointer"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* User's spoken transcript card */}
          {(transcript || interimTranscript) && (
            <div className="p-3.5 rounded-2xl bg-primary-soft border border-primary/25 space-y-1 animate-in fade-in duration-150">
              <div className="flex items-center justify-between text-2xs font-bold uppercase tracking-wider text-primary">
                <span>Bạn đang nói:</span>
                <span className="text-3xs font-normal lowercase opacity-70">
                  {activeEngine === 'cloud' ? 'AI Cloud STT' : 'Web Speech STT'}
                </span>
              </div>
              <p className="text-sm font-semibold text-text-primary leading-relaxed">
                {transcript}
                {interimTranscript && (
                  <span className="text-text-muted italic ml-1 opacity-80">{interimTranscript}</span>
                )}
              </p>
            </div>
          )}

          {/* AI Response Card */}
          {lastAiResponse ? (
            <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between pb-2 border-b border-border-subtle text-2xs text-text-muted">
                <span className="font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Phản hồi từ Yuyan AI:</span>
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopy(lastAiResponse)}
                    className="p-1.5 rounded-lg hover:bg-surface transition-colors cursor-pointer"
                    title="Sao chép câu trả lời"
                    aria-label="Sao chép"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-status-success" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Chinese Hanzi & Pinyin display */}
              <div className="space-y-1">
                <div className="text-base sm:text-lg font-bold font-hanzi text-text-primary leading-relaxed">
                  {lastAiResponse}
                </div>
                {lastAiPinyin && (
                  <div className="text-xs font-mono font-medium text-teal-600 dark:text-teal-400">
                    {lastAiPinyin}
                  </div>
                )}
                {lastAiVietnamese && (
                  <div className="text-xs text-text-muted italic">
                    {lastAiVietnamese}
                  </div>
                )}
              </div>

              {/* Segmented Replay Action Buttons */}
              <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center gap-1.5 text-2xs">
                <button
                  onClick={() => replayLastResponse('all')}
                  className="px-3 py-1.5 rounded-xl bg-primary/15 text-primary hover:bg-primary/25 font-bold transition-colors flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Nghe song ngữ</span>
                </button>
                <button
                  onClick={() => replayLastResponse('chinese_only')}
                  className="px-2.5 py-1.5 rounded-xl bg-surface text-text-secondary hover:text-primary font-semibold transition-colors cursor-pointer active:scale-95"
                >
                  Chỉ tiếng Trung
                </button>
                <button
                  onClick={() => replayLastResponse('vietnamese_only')}
                  className="px-2.5 py-1.5 rounded-xl bg-surface text-text-secondary hover:text-primary font-semibold transition-colors cursor-pointer active:scale-95"
                >
                  Chỉ tiếng Việt
                </button>
              </div>
            </div>
          ) : isRecording ? (
            <div className="py-8 text-center space-y-1.5 text-text-muted animate-in fade-in duration-150">
              <p className="text-sm font-semibold text-text-primary">Yuyan AI đang chăm chú lắng nghe...</p>
              <p className="text-xs text-text-muted">Em hãy nói bằng tiếng Trung hoặc tiếng Việt tự nhiên nhé.</p>
              <p className="text-2xs text-text-muted opacity-75">Nói xong, nhấn vào nút dừng để gửi câu hỏi.</p>
            </div>
          ) : isTranscribing ? (
            <div className="py-8 text-center space-y-2 text-primary animate-in fade-in duration-150">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              <p className="text-xs font-bold">Đang chuyển đổi giọng nói thành văn bản...</p>
            </div>
          ) : isGenerating ? (
            <div className="py-8 text-center space-y-2 text-primary animate-in fade-in duration-150">
              <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block animate-ping" />
              <p className="text-xs font-bold">Đang phân tích câu hỏi và soạn câu trả lời...</p>
            </div>
          ) : (
            <div className="py-8 text-center space-y-2 text-text-muted">
              <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-1">
                <Mic className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-text-primary">Luyện nói tiếng Trung tự nhiên</p>
              <p className="text-xs max-w-xs mx-auto text-text-muted">
                Nhấn vào nút Micro lớn bên dưới để bắt đầu nói. AI sẽ nhận diện giọng nói và đàm thoại song ngữ cùng bạn.
              </p>
            </div>
          )}
        </div>

        {/* Tier 4: Fixed Bottom Control Bar with Mobile Safe Area Insets */}
        <div className="flex-shrink-0 px-6 pt-3 pb-[max(16px,env(safe-area-inset-bottom))] border-t border-border-subtle bg-surface-secondary/70 flex items-center justify-between select-none">
          {/* Cancel button */}
          <button
            onClick={() => {
              cancelRecording();
              stopSpeaking();
              closeVoiceModal();
            }}
            className="text-xs font-bold text-text-muted hover:text-text-primary px-3 py-2.5 rounded-xl transition-colors min-h-[44px] flex items-center cursor-pointer"
          >
            Đóng
          </button>

          {/* Central Action Microphone Button (Touch Target >= 64px) */}
          <div className="relative">
            {isRecording && (
              <span className="absolute -inset-1.5 rounded-full bg-rose-500/25 animate-ping pointer-events-none" />
            )}
            <button
              onClick={() => {
                if (isRecording) {
                  void stopRecordingAndSend();
                } else if (isSpeaking) {
                  stopSpeaking();
                } else {
                  void startRecording();
                }
              }}
              className={`relative w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all transform active:scale-90 cursor-pointer ${
                isRecording
                  ? 'bg-rose-500 hover:bg-rose-600 ring-4 ring-rose-500/30'
                  : isSpeaking
                  ? 'bg-amber-500 hover:bg-amber-600 ring-4 ring-amber-500/30'
                  : isGenerating || isTranscribing
                  ? 'bg-slate-400 cursor-wait'
                  : 'bg-primary hover:bg-primary-hover ring-4 ring-primary/20'
              }`}
              title={isRecording ? 'Dừng và gửi' : isSpeaking ? 'Dừng phát âm' : 'Bắt đầu nói'}
              aria-label={isRecording ? 'Dừng thu âm và gửi' : isSpeaking ? 'Dừng phát âm' : 'Bắt đầu thu âm'}
            >
              {isRecording ? (
                <Square className="w-5 h-5 fill-current" />
              ) : isSpeaking ? (
                <Square className="w-5 h-5 fill-current" />
              ) : isGenerating || isTranscribing ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <Mic className="w-7 h-7" />
              )}
            </button>
          </div>

          {/* Replay or Language Toggle */}
          {lastAiResponse ? (
            <button
              onClick={() => replayLastResponse()}
              className="text-xs font-bold text-primary hover:text-primary-hover px-3 py-2.5 rounded-xl flex items-center gap-1 transition-colors min-h-[44px] cursor-pointer"
              title="Phát lại phản hồi"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Phát lại</span>
            </button>
          ) : (
            <button
              onClick={openLanguageModal}
              className="text-xs font-bold text-text-secondary hover:text-text-primary px-3 py-2.5 rounded-xl transition-colors min-h-[44px] flex items-center cursor-pointer"
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
