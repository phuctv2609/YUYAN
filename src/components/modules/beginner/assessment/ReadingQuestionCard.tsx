import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { MultipleChoiceQuestion, UserAnswerRecord } from './assessmentTypes';

interface ReadingQuestionCardProps {
  question: MultipleChoiceQuestion;
  currentAnswer?: UserAnswerRecord;
  onAnswer: (record: UserAnswerRecord) => void;
}

export const ReadingQuestionCard: React.FC<ReadingQuestionCardProps> = ({
  question,
  currentAnswer,
  onAnswer,
}) => {
  const handleSelect = (optionId: string) => {
    const isCorrect = optionId === question.correctOptionId;
    onAnswer({
      questionId: question.id,
      skill: 'reading',
      userResponse: optionId,
      isCorrect,
      score: isCorrect ? 100 : 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Big Hanzi + 4 Pinyin Choices (Matching Infographic Section 10) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Left: Big Hanzi Display */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-8 bg-emerald-50/50 dark:bg-emerald-950/20 rounded-3xl border border-emerald-200/60 dark:border-emerald-900/40">
          <span className="text-7xl sm:text-8xl font-black text-slate-900 dark:text-white select-none">
            {question.targetText}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium">
            Nhìn chữ Hán và chọn phiên âm Pinyin đúng
          </span>
        </div>

        {/* Right: 4 Pinyin Choices Grid */}
        <div className="md:col-span-7 grid grid-cols-2 gap-3.5">
          {question.options.map((opt) => {
            const isSelected = currentAnswer?.userResponse === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                className={`p-5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center relative group shadow-xs ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-400 dark:ring-emerald-800 scale-[1.02]'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-slate-700 hover:bg-emerald-50/20'
                }`}
              >
                <span className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                  {opt.pinyin}
                </span>
                {opt.meaning && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {opt.meaning}
                  </span>
                )}

                {isSelected && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 absolute top-3 right-3" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
