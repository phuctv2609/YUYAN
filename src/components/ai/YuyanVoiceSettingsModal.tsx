import React, { useState } from 'react';
import { X, Volume2, Gauge, BookOpen, Globe, Repeat, Play } from 'lucide-react';
import { useYuyanAI } from '../../context/YuyanAIContext';
import { speechSynthesisService } from '../../services/speech/speechSynthesisService';

export const YuyanVoiceSettingsModal: React.FC = () => {
  const { isSettingsModalOpen, closeSettingsModal, voiceSettings, updateVoiceSettings } =
    useYuyanAI();
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);

  if (!isSettingsModalOpen) return null;

  const handleTestVoice = async () => {
    setIsPlayingPreview(true);
    await speechSynthesisService.speak({
      text: '你好！我是 Yuyan AI，很高兴与你一起学习中文。',
      rate: voiceSettings.speechRate,
      lang: 'zh-CN',
      onEnd: () => setIsPlayingPreview(false),
      onError: () => setIsPlayingPreview(false),
    });
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-surface dark:bg-slate-900 rounded-3xl border border-border-subtle shadow-xl overflow-hidden p-5 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle/80">
          <div className="flex items-center gap-2">
            <span className="text-base select-none">⚙️</span>
            <h3 className="text-sm font-bold text-text-primary">Cài đặt AI</h3>
          </div>
          <button
            onClick={closeSettingsModal}
            className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* 1. Giọng nói phản hồi (TTS) */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Volume2 className="w-4 h-4 text-primary" />
              <div>
                <span className="font-bold text-text-primary block">Giọng nói phản hồi</span>
                <span className="text-2xs text-text-muted">Phát âm thanh câu trả lời từ AI</span>
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

          {/* 2. Tốc độ nói */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Gauge className="w-4 h-4 text-indigo-500" />
              <div>
                <span className="font-bold text-text-primary block">Tốc độ nói</span>
                <span className="text-2xs text-text-muted">Điều chỉnh nhịp đọc phù hợp</span>
              </div>
            </div>
            <select
              value={voiceSettings.speechRate}
              onChange={(e) => updateVoiceSettings({ speechRate: parseFloat(e.target.value) })}
              className="px-2.5 py-1 rounded-xl bg-surface-secondary border border-border-subtle text-xs font-semibold text-text-primary focus:outline-hidden focus:border-primary"
            >
              <option value={0.75}>Chậm (0.75x)</option>
              <option value={1.0}>Bình thường (1.0x)</option>
              <option value={1.25}>Nhanh (1.25x)</option>
            </select>
          </div>

          {/* 3. Hiển thị Pinyin */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <BookOpen className="w-4 h-4 text-emerald-500" />
              <div>
                <span className="font-bold text-text-primary block">Hiển thị Pinyin</span>
                <span className="text-2xs text-text-muted">Phiên âm bính âm kèm thanh điệu</span>
              </div>
            </div>
            <button
              onClick={() => updateVoiceSettings({ showPinyin: !voiceSettings.showPinyin })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                voiceSettings.showPinyin ? 'bg-primary' : 'bg-border-subtle dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                  voiceSettings.showPinyin ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. Hiển thị bản dịch tiếng Việt */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-rose-500" />
              <div>
                <span className="font-bold text-text-primary block">Hiển thị bản dịch Tiếng Việt</span>
                <span className="text-2xs text-text-muted">Nghĩa và ngữ cảnh tiếng Việt</span>
              </div>
            </div>
            <button
              onClick={() => updateVoiceSettings({ showVietnamese: !voiceSettings.showVietnamese })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                voiceSettings.showVietnamese ? 'bg-primary' : 'bg-border-subtle dark:bg-slate-700'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform ${
                  voiceSettings.showVietnamese ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 5. Bật chế độ hội thoại liên tục */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Repeat className="w-4 h-4 text-amber-500" />
              <div>
                <span className="font-bold text-text-primary block">Bật chế độ hội thoại liên tục</span>
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

        {/* Test Speech Button */}
        <div className="pt-3 border-t border-border-subtle/80 flex items-center justify-between">
          <button
            onClick={handleTestVoice}
            disabled={isPlayingPreview}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
          >
            <Play className={`w-3.5 h-3.5 ${isPlayingPreview ? 'animate-spin' : ''}`} />
            <span>{isPlayingPreview ? 'Đang phát thử...' : 'Nghe thử giọng đọc'}</span>
          </button>

          <button
            onClick={closeSettingsModal}
            className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover shadow-xs transition-colors"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
};
