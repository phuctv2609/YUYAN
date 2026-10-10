import React, { useState, useEffect } from 'react';
import { CheckCircle2, Sparkles } from 'lucide-react';
import { WritingQuestion, UserAnswerRecord } from './assessmentTypes';

interface WritingQuestionCardProps {
  question: WritingQuestion;
  currentAnswer?: UserAnswerRecord;
  onAnswer: (record: UserAnswerRecord) => void;
}

export const WritingQuestionCard: React.FC<WritingQuestionCardProps> = ({
  question,
  currentAnswer,
  onAnswer,
}) => {
  const [inputValue, setInputValue] = useState<string>(currentAnswer?.userResponse || '');

  useEffect(() => {
    setInputValue(currentAnswer?.userResponse || '');
  }, [question.id, currentAnswer]);

  // Virtual tone vowel buttons
  const toneVowels = [
    ['ā', 'á', 'ǎ', 'à'],
    ['ō', 'ó', 'ǒ', 'ò'],
    ['ē', 'é', 'ě', 'è'],
    ['ī', 'í', 'ǐ', 'ì'],
    ['ū', 'ú', 'ǔ', 'ù'],
    ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  ];

  const handleAppendChar = (char: string) => {
    const updated = inputValue + char;
    setInputValue(updated);
    evaluateAnswer(updated);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    evaluateAnswer(val);
  };

  const normalizePinyin = (input: string): string => {
    return input.trim().toLowerCase().replace(/\s+/g, '');
  };

  const evaluateAnswer = (val: string) => {
    const norm = normalizePinyin(val);
    const correctNorm = normalizePinyin(question.correctPinyin);
    const acceptable = (question.acceptableAlternatives || []).map((a) => normalizePinyin(a));

    const isMatch = norm === correctNorm || acceptable.includes(norm);

    onAnswer({
      questionId: question.id,
      skill: 'writing',
      userResponse: val,
      isCorrect: isMatch,
      score: isMatch ? 100 : 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Big Hanzi + Pinyin Input (Matching Infographic Section 10) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Big Hanzi */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-8 bg-amber-50/50 dark:bg-amber-950/20 rounded-3xl border border-amber-200/60 dark:border-amber-900/40">
          <span className="text-7xl sm:text-8xl font-black text-slate-900 dark:text-white select-none">
            {question.targetHanzi}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Nghĩa: {question.meaning}
          </span>
        </div>

        {/* Right: Pinyin Input & Virtual Tone Keys */}
        <div className="md:col-span-7 space-y-4">
          <div className="relative">
            <input
              type="text"
              value={inputValue}
              onChange={handleChange}
              placeholder="Nhập pinyin (ví dụ: dà hoặc da4)..."
              className="w-full px-5 py-4 text-2xl font-black font-mono rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50 dark:focus:ring-amber-900/40 outline-hidden transition-all text-slate-900 dark:text-white"
            />
            {currentAnswer?.isCorrect && (
              <CheckCircle2 className="w-6 h-6 text-emerald-500 absolute right-4 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Virtual Tone Vowels Helper Keyboard */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Bàn phím thanh điệu nhanh (Nhấp để chèn):
            </div>
            <div className="grid grid-cols-6 gap-1.5 font-mono">
              {toneVowels.map((row, rIdx) => (
                <div key={rIdx} className="flex gap-1 justify-center">
                  {row.map((char) => (
                    <button
                      key={char}
                      type="button"
                      onClick={() => handleAppendChar(char)}
                      className="w-8 h-8 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:text-amber-700 border border-slate-200 dark:border-slate-600 transition-colors shadow-2xs flex items-center justify-center"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              ))}
            </div>
            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2 text-center">
              * Mẹo: Bạn cũng có thể gõ số thanh điệu phía sau (ví dụ: <code>da4</code> hệ thống tự nhận là <code>dà</code>).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
