import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Volume2, Gauge, Repeat, Play, Square } from 'lucide-react';
import { useYuyanAI } from '../../context/YuyanAIContext';
import { speechSynthesisService } from '../../services/speech/speechSynthesisService';
import { AvailableVoice, ReadingMode } from '../../services/speech/speechTypes';

export const YuyanVoiceSettingsModal: React.FC = () => {
  const { isSettingsModalOpen, closeSettingsModal, voiceSettings, updateVoiceSettings } =
    useYuyanAI();
  const [voices, setVoices] = useState<AvailableVoice[]>([]);
  const [isPlayingChinesePreview, setIsPlayingChinesePreview] = useState(false);
  const [isPlayingVietnamesePreview, setIsPlayingVietnamesePreview] = useState(false);

  useEffect(() => {
    if (isSettingsModalOpen) {
      void speechSynthesisService.getAvailableVoices().then((list) => {
        setVoices(list);
      });
    }
  }, [isSettingsModalOpen]);

  if (!isSettingsModalOpen) return null;
  if (typeof document === 'undefined') return null;

  const chineseVoices = voices.filter((v) => v.isChinese);
  const vietnameseVoices = voices.filter((v) => v.isVietnamese);

  const handleTestChineseVoice = async () => {
    if (isPlayingChinesePreview) {
      speechSynthesisService.stop();
      setIsPlayingChinesePreview(false);
      return;
    }
    speechSynthesisService.stop();
    setIsPlayingChinesePreview(true);
    setIsPlayingVietnamesePreview(false);
    await speechSynthesisService.speakBilingual({
      text: '你好！我是 Yuyan AI，很高兴与你一起学习中文。今天我们学习新的语法。',
      readingMode: 'chinese_only',
      rate: voiceSettings.speechRate,
      chineseVoiceUri: voiceSettings.chineseVoiceUri,
      onEnd: () => setIsPlayingChinesePreview(false),
      onError: () => setIsPlayingChinesePreview(false),
    });
  };

  const handleTestVietnameseVoice = async () => {
    if (isPlayingVietnamesePreview) {
      speechSynthesisService.stop();
      setIsPlayingVietnamesePreview(false);
      return;
    }
    speechSynthesisService.stop();
    setIsPlayingVietnamesePreview(true);
    setIsPlayingChinesePreview(false);
    await speechSynthesisService.speakBilingual({
      text: 'Xin chào bạn! Mình là trợ lý học tiếng Trung YUYAN. Chúc bạn học tập thật tốt!',
      readingMode: 'vietnamese_only',
      rate: voiceSettings.speechRate,
      vietnameseVoiceUri: voiceSettings.vietnameseVoiceUri,
      onEnd: () => setIsPlayingVietnamesePreview(false),
      onError: () => setIsPlayingVietnamesePreview(false),
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 isolate">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden p-5 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar"
        style={{ backgroundColor: 'var(--surface, #ffffff)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle/80">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">⚙️</span>
            <div>
              <h3 className="text-sm font-bold text-text-primary">Cài đặt Giọng đọc & AI</h3>
              <p className="text-2xs text-text-muted">Cấu hình song ngữ Trung - Việt & chế độ đọc</p>
            </div>
          </div>
          <button
            onClick={() => {
              speechSynthesisService.stop();
              closeSettingsModal();
            }}
            className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* 1. Bật/tắt TTS & Tự động phát âm */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-primary" />
              <div>
                <span className="font-bold text-text-primary block">Giọng đọc AI (TTS)</span>
                <span className="text-2xs text-text-muted">Tự động phát âm câu trả lời</span>
              </div>
            </div>
            <button
              onClick={() => updateVoiceSettings({ ttsEnabled: !voiceSettings.ttsEnabled })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                voiceSettings.ttsEnabled ? 'bg-primary' : 'bg-border-subtle dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                  voiceSettings.ttsEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 2. Chọn Giọng đọc Tiếng Trung (Voice A) */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-surface-secondary/40 border border-border-subtle">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary flex items-center gap-1.5">
                <span>🇨🇳</span>
                <span>Giọng đọc Tiếng Trung (Voice A)</span>
              </span>
              <button
                onClick={handleTestChineseVoice}
                className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-bold text-2xs flex items-center gap-1 transition-colors"
              >
                {isPlayingChinesePreview ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{isPlayingChinesePreview ? 'Dừng' : 'Nghe thử'}</span>
              </button>
            </div>
            <select
              value={voiceSettings.chineseVoiceUri || ''}
              onChange={(e) => updateVoiceSettings({ chineseVoiceUri: e.target.value || undefined })}
              className="w-full p-2 rounded-xl bg-surface dark:bg-slate-800 border border-border-subtle text-xs font-medium text-text-primary focus:outline-hidden focus:border-primary"
            >
              <option value="">Tự động chọn giọng chuẩn (Standard Mandarin)</option>
              {chineseVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* 3. Chọn Giọng đọc Tiếng Việt (Voice B) */}
          <div className="space-y-1.5 p-3 rounded-2xl bg-surface-secondary/40 border border-border-subtle">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary flex items-center gap-1.5">
                <span>🇻🇳</span>
                <span>Giọng đọc Tiếng Việt (Voice B)</span>
              </span>
              <button
                onClick={handleTestVietnameseVoice}
                className="px-2 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-2xs flex items-center gap-1 transition-colors"
              >
                {isPlayingVietnamesePreview ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                <span>{isPlayingVietnamesePreview ? 'Dừng' : 'Nghe thử'}</span>
              </button>
            </div>
            <select
              value={voiceSettings.vietnameseVoiceUri || ''}
              onChange={(e) => updateVoiceSettings({ vietnameseVoiceUri: e.target.value || undefined })}
              className="w-full p-2 rounded-xl bg-surface dark:bg-slate-800 border border-border-subtle text-xs font-medium text-text-primary focus:outline-hidden focus:border-primary"
            >
              <option value="">Tự động chọn giọng Tiếng Việt (Vietnamese Standard)</option>
              {vietnameseVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          {/* 4. Chế độ phân đoạn đọc (Reading Mode) */}
          <div className="space-y-1.5">
            <label className="font-bold text-text-primary block">Chế độ đọc phản hồi (Phân đoạn song ngữ)</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'all' as ReadingMode, label: 'Đọc toàn bộ', icon: '🌐', desc: 'Song ngữ' },
                { id: 'chinese_only' as ReadingMode, label: 'Chỉ tiếng Trung', icon: '🇨🇳', desc: 'Bỏ qua tiếng Việt' },
                { id: 'vietnamese_only' as ReadingMode, label: 'Chỉ tiếng Việt', icon: '🇻🇳', desc: 'Bỏ qua chữ Hán' },
              ].map((m) => {
                const isSelected = (voiceSettings.readingMode || 'all') === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => updateVoiceSettings({ readingMode: m.id })}
                    className={`p-2 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                        : 'bg-surface-secondary/40 border-border-subtle hover:bg-surface-secondary text-text-secondary'
                    }`}
                  >
                    <div className="text-base">{m.icon}</div>
                    <div className="text-2xs font-bold leading-tight mt-1">{m.label}</div>
                    <div className="text-3xs text-text-muted mt-0.5">{m.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Tốc độ nói */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Gauge className="w-4 h-4 text-indigo-500" />
              <div>
                <span className="font-bold text-text-primary block">Tốc độ phát âm</span>
                <span className="text-2xs text-text-muted">Nhịp đọc phù hợp khi luyện nghe</span>
              </div>
            </div>
            <select
              value={voiceSettings.speechRate}
              onChange={(e) => updateVoiceSettings({ speechRate: parseFloat(e.target.value) })}
              className="px-2.5 py-1 rounded-xl bg-surface-secondary border border-border-subtle text-xs font-semibold text-text-primary focus:outline-hidden focus:border-primary"
            >
              <option value={0.75}>Chậm (0.75x)</option>
              <option value={1.0}>Chuẩn (1.0x)</option>
              <option value={1.25}>Hơi nhanh (1.25x)</option>
              <option value={1.5}>Nhanh (1.5x)</option>
            </select>
          </div>

          {/* 6. Bật hội thoại liên tục */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Repeat className="w-4 h-4 text-amber-500" />
              <div>
                <span className="font-bold text-text-primary block">Hội thoại liên tục</span>
                <span className="text-2xs text-text-muted">Tự động lắng nghe sau khi AI nói xong</span>
              </div>
            </div>
            <button
              onClick={() => updateVoiceSettings({ continuousMode: !voiceSettings.continuousMode })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                voiceSettings.continuousMode ? 'bg-primary' : 'bg-border-subtle dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                  voiceSettings.continuousMode ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-border-subtle/80 flex justify-end">
          <button
            onClick={() => {
              speechSynthesisService.stop();
              closeSettingsModal();
            }}
            className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover transition-colors shadow-xs"
          >
            Đã xong
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
