import React, { useState } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import { BEGINNER_TONE_SANDHI } from '../../../data/pinyin/beginnerPhoneticsData';
import { ToneContourDiagram } from './illustrations/ToneContourDiagram';
import { audioManager } from '../../../services/audio/index';

interface TonesLabProps {
  className?: string;
}

export const TonesLab: React.FC<TonesLabProps> = ({ className = '' }) => {
  const [selectedToneIdx, setSelectedToneIdx] = useState<number>(0);

  const handlePlaySound = (text: string) => {
    audioManager.playText(text);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            4 Thanh Điệu & Quy Tắc Biến Điệu (声调与变调)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Thang độ cao ngữ điệu Chao (5 bậc), thanh nhẹ và 3 quy tắc biến điệu bắt buộc (3+3, Yī, Bù).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
            4 Thanh điệu + Khinh thanh
          </span>
        </div>
      </div>

      {/* 1. Tone Contours Grid (Section 6 of Infographic) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Minh họa bốn thanh điệu (Chao Tone Contours)
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Nhấp vào ô để nghe cách phát âm từng thanh
          </span>
        </div>

        <ToneContourDiagram
          activeToneIndex={selectedToneIdx}
          onSelectTone={(idx) => setSelectedToneIdx(idx)}
        />
      </div>

      {/* 2. Neutral Tone (Khinh thanh / Thanh nhẹ) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center font-bold text-base">
            ·
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Thanh Nhẹ (Khinh thanh - 轻声)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Không mang dấu thanh điệu trên Pinyin, phát âm thật ngắn, lướt và nhẹ.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
          Thanh nhẹ thường xuất hiện ở âm tiết thứ 2 trong từ láy lặp lại (bàba, māma), trợ từ ngữ khí (ma, de, le, ne), hoặc hậu tố danh từ (zi, tou).
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { pinyin: 'māma', hanzi: '妈妈', meaning: 'mẹ', audio: '妈妈' },
            { pinyin: 'bàba', hanzi: '爸爸', meaning: 'bố', audio: '爸爸' },
            { pinyin: 'xièxie', hanzi: '谢谢', meaning: 'cảm ơn', audio: '谢谢' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
            >
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-purple-600 dark:text-purple-400 font-mono">
                    {item.pinyin}
                  </span>
                  <span className="text-xl font-bold text-slate-900 dark:text-white">
                    {item.hanzi}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.meaning}
                </div>
              </div>
              <button
                onClick={() => handlePlaySound(item.audio)}
                className="p-2 rounded-full bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 hover:bg-purple-600 hover:text-white shadow-2xs transition-colors"
                title={`Nghe: ${item.pinyin}`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Tone Sandhi Rules (Quy tắc Biến điệu) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            3 Quy Tắc Biến Điệu Bắt Buộc (变调规则)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cách viết Pinyin giữ nguyên thanh gốc, nhưng khi đọc miệng phải biến đổi theo quy luật ngữ âm học.
          </p>
        </div>

        <div className="space-y-4">
          {BEGINNER_TONE_SANDHI.map((rule) => (
            <div
              key={rule.ruleId}
              className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {rule.name}
                </span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {rule.ruleId}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {rule.description}
              </p>

              {/* Examples Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
                {rule.examples.map((ex, exIdx) => (
                  <div
                    key={exIdx}
                    className="p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between shadow-2xs"
                  >
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-slate-900 dark:text-white">
                          {ex.hanzi}
                        </span>
                        <span className="text-xs font-mono line-through text-slate-400">
                          {ex.originalPinyin}
                        </span>
                        <span className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                          ➔ {ex.actualPinyin}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {ex.meaning}
                      </div>
                    </div>
                    <button
                      onClick={() => handlePlaySound(ex.hanzi)}
                      className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-rose-500 hover:text-white transition-colors"
                      title={`Nghe phát âm: ${ex.actualPinyin}`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
