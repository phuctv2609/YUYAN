import React from 'react';
import { createPortal } from 'react-dom';
import { X, Check } from 'lucide-react';
import { useYuyanAI } from '../../context/YuyanAIContext';
import { SpeechRecognitionLanguage } from '../../services/speech/speechTypes';

export const YuyanLanguageModal: React.FC = () => {
  const { isLanguageModalOpen, closeLanguageModal, voiceSettings, updateVoiceSettings } =
    useYuyanAI();

  if (!isLanguageModalOpen) return null;
  if (typeof document === 'undefined') return null;

  const sttOptions: Array<{
    id: SpeechRecognitionLanguage;
    label: string;
    sublabel: string;
    flag: string;
  }> = [
    {
      id: 'zh-CN',
      label: 'Tiếng Trung (中文)',
      sublabel: 'Nhận diện phát âm tiếng Trung Quốc phổ thông (Mandarin)',
      flag: '🇨🇳',
    },
    {
      id: 'vi-VN',
      label: 'Tiếng Việt (Việt Nam)',
      sublabel: 'Nhận diện tiếng Việt chuẩn xác cho câu hỏi và dịch thuật',
      flag: '🇻🇳',
    },
    {
      id: 'auto',
      label: 'Tự động nhận diện',
      sublabel: 'Chuyển đổi linh hoạt giữa Tiếng Trung và Tiếng Việt',
      flag: '🌐',
    },
  ];

  const responseLanguageOptions: Array<{
    id: 'auto' | 'zh' | 'vi' | 'en';
    label: string;
    sublabel: string;
    flag: string;
  }> = [
    {
      id: 'auto',
      label: 'Tự động theo câu hỏi (Khuyên dùng)',
      sublabel: 'Hỏi tiếng Trung trả lời tiếng Trung, hỏi tiếng Việt giải thích tiếng Việt',
      flag: '🎯',
    },
    {
      id: 'zh',
      label: 'Ưu tiên Tiếng Trung (中文)',
      sublabel: 'Luôn trả lời bằng tiếng Trung để tối đa hóa môi trường luyện tập',
      flag: '🇨🇳',
    },
    {
      id: 'vi',
      label: 'Ưu tiên Tiếng Việt',
      sublabel: 'Giải thích ngữ pháp và từ vựng chi tiết bằng tiếng Việt',
      flag: '🇻🇳',
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150 isolate">
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden p-5 space-y-4 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto custom-scrollbar"
        style={{ backgroundColor: 'var(--surface, #ffffff)' }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle/80">
          <div>
            <h3 className="text-sm font-bold text-text-primary">Ngôn ngữ & Phản hồi AI</h3>
            <p className="text-2xs text-text-muted">Định tuyến ngôn ngữ nhận diện và trả lời</p>
          </div>
          <button
            onClick={closeLanguageModal}
            className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Nhận diện giọng nói (STT) */}
        <div className="space-y-2">
          <label className="text-2xs font-bold uppercase tracking-wider text-primary block">
            1. Ngôn ngữ nhận diện giọng nói (Microphone)
          </label>
          <div className="space-y-1.5">
            {sttOptions.map((opt) => {
              const isSelected = voiceSettings.sttLanguage === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => updateVoiceSettings({ sttLanguage: opt.id })}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                      : 'bg-surface-secondary/40 border-border-subtle hover:bg-surface-secondary text-text-primary font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg select-none">{opt.flag}</span>
                    <div>
                      <div className="text-xs font-bold leading-tight">{opt.label}</div>
                      <div className="text-3xs text-text-muted mt-0.5 font-normal">
                        {opt.sublabel}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-primary border-primary text-white'
                        : 'border-border-subtle bg-surface'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Chính sách phản hồi AI */}
        <div className="space-y-2 pt-2 border-t border-border-subtle/80">
          <label className="text-2xs font-bold uppercase tracking-wider text-indigo-500 block">
            2. Chính sách ngôn ngữ trả lời của AI
          </label>
          <div className="space-y-1.5">
            {responseLanguageOptions.map((opt) => {
              const isSelected = (voiceSettings.preferredResponseLanguage || 'auto') === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => updateVoiceSettings({ preferredResponseLanguage: opt.id })}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold shadow-2xs'
                      : 'bg-surface-secondary/40 border-border-subtle hover:bg-surface-secondary text-text-primary font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg select-none">{opt.flag}</span>
                    <div>
                      <div className="text-xs font-bold leading-tight">{opt.label}</div>
                      <div className="text-3xs text-text-muted mt-0.5 font-normal">
                        {opt.sublabel}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? 'bg-indigo-500 border-indigo-500 text-white'
                        : 'border-border-subtle bg-surface'
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-border-subtle/80 flex justify-end">
          <button
            onClick={closeLanguageModal}
            className="px-4 py-1.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary-hover transition-colors shadow-xs"
          >
            Lưu cài đặt
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
