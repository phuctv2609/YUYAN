import React from 'react';
import { X, Check } from 'lucide-react';
import { useYuyanAI } from '../../context/YuyanAIContext';
import { SpeechRecognitionLanguage } from '../../services/speech/speechTypes';

export const YuyanLanguageModal: React.FC = () => {
  const { isLanguageModalOpen, closeLanguageModal, voiceSettings, updateVoiceSettings } =
    useYuyanAI();

  if (!isLanguageModalOpen) return null;

  const options: Array<{
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

  const handleSelect = (lang: SpeechRecognitionLanguage) => {
    updateVoiceSettings({ sttLanguage: lang });
    closeLanguageModal();
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-surface dark:bg-slate-900 rounded-3xl border border-border-subtle shadow-xl overflow-hidden p-5 space-y-4 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle/80">
          <h3 className="text-sm font-bold text-text-primary">Chọn ngôn ngữ nhận diện</h3>
          <button
            onClick={closeLanguageModal}
            className="p-1 rounded-full text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          {options.map((opt) => {
            const isSelected = voiceSettings.sttLanguage === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? 'bg-primary/10 border-primary text-primary font-bold shadow-2xs'
                    : 'bg-surface-secondary/40 border-border-subtle hover:bg-surface-secondary text-text-primary font-medium'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl select-none">{opt.flag}</span>
                  <div>
                    <div className="text-xs font-bold leading-tight">{opt.label}</div>
                    <div className="text-2xs text-text-muted mt-0.5 font-normal">
                      {opt.sublabel}
                    </div>
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border ${
                    isSelected
                      ? 'bg-primary border-primary text-white'
                      : 'border-border-subtle bg-surface'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
