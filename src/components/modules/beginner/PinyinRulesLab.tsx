import React, { useState } from 'react';
import { Volume2, Sparkles } from 'lucide-react';
import { BEGINNER_PINYIN_RULES } from '../../../data/pinyin/beginnerPhoneticsData';
import { audioManager } from '../../../services/audio/index';

interface PinyinRulesLabProps {
  className?: string;
}

export const PinyinRulesLab: React.FC<PinyinRulesLabProps> = ({ className = '' }) => {
  const [selectedRuleId, setSelectedRuleId] = useState<string>('rule_u_umlaut_drop_dots');

  const currentRule =
    BEGINNER_PINYIN_RULES.find((r) => r.id === selectedRuleId) ||
    BEGINNER_PINYIN_RULES[0];

  const handlePlaySound = (text: string) => {
    audioManager.playText(text);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            Quy Tắc Chính Tả Pinyin Đặc Biệt (拼写规则)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            4 quy tắc chính tả căn bản bắt buộc phải nắm vững khi học và viết chữ Hán Pinyin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
            4 Quy tắc trọng tâm
          </span>
        </div>
      </div>

      {/* 4 Tabs (Matching Infographic Section 7) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {BEGINNER_PINYIN_RULES.map((rule) => {
          const isSelected = rule.id === selectedRuleId;
          return (
            <button
              key={rule.id}
              onClick={() => setSelectedRuleId(rule.id)}
              className={`p-3.5 rounded-2xl font-bold text-xs sm:text-sm text-center transition-all ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-300 dark:ring-blue-800'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {rule.title}
            </button>
          );
        })}
      </div>

      {/* Active Rule Details Card (Matching Infographic Section 7) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            {currentRule.title}
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
            {currentRule.summary}
          </p>
        </div>

        {/* Detailed Explanation and Rules Box */}
        <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-xs text-slate-700 dark:text-slate-300 leading-relaxed space-y-2">
          <div className="font-semibold text-blue-900 dark:text-blue-300">
            Nội dung quy tắc:
          </div>
          <p>{currentRule.explanation}</p>
        </div>

        {/* Examples Section (Matching Infographic Section 7: j/q/x vs n/l cards) */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
            Ví dụ minh họa & cách phát âm:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {currentRule.examples.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between hover:bg-blue-50/50 dark:hover:bg-slate-750 transition-colors shadow-2xs group"
              >
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-black text-blue-600 dark:text-blue-400 font-mono">
                      {item.spelled}
                    </span>
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      {item.hanzi}
                    </span>
                  </div>
                  {item.actual && (
                    <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                      Gốc: {item.actual}
                    </div>
                  )}
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {item.meaning}
                  </div>
                </div>

                <button
                  onClick={() => handlePlaySound(item.hanzi)}
                  className="p-2.5 rounded-full bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white shadow-2xs transition-colors"
                  title={`Nghe mẫu ${item.spelled}`}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
