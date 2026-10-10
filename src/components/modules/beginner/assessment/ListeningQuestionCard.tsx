import React, { useState } from 'react';
import { Volume2, Play, Pause, CheckCircle2 } from 'lucide-react';
import { MultipleChoiceQuestion, UserAnswerRecord } from './assessmentTypes';
import { audioManager } from '../../../../services/audio/index';

interface ListeningQuestionCardProps {
  question: MultipleChoiceQuestion;
  currentAnswer?: UserAnswerRecord;
  onAnswer: (record: UserAnswerRecord) => void;
}

export const ListeningQuestionCard: React.FC<ListeningQuestionCardProps> = ({
  question,
  currentAnswer,
  onAnswer,
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const handlePlayAudio = () => {
    if (!question.audioPrompt) return;
    setIsPlaying(true);
    audioManager.playText(question.audioPrompt);
    setTimeout(() => {
      setIsPlaying(false);
    }, 1500);
  };

  const handleSelectOption = (optionId: string) => {
    const isCorrect = optionId === question.correctOptionId;
    onAnswer({
      questionId: question.id,
      skill: 'listening',
      userResponse: optionId,
      isCorrect,
      score: isCorrect ? 100 : 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Audio Player Bar (Matching Infographic Section 9 & 10) */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
        <button
          onClick={handlePlayAudio}
          className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 active:scale-95 text-white flex items-center justify-center shadow-md transition-all flex-shrink-0"
          title="Nghe âm thanh câu hỏi"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>

        {/* Audio Visual waveform bar */}
        <div className="flex-1 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
            <span>{isPlaying ? '0:01' : '0:00'}</span>
            <span>0:02</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className={`h-full bg-blue-500 rounded-full transition-all duration-300 ${
                isPlaying ? 'w-2/3' : 'w-0'
              }`}
            />
          </div>
        </div>

        <button
          onClick={handlePlayAudio}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-colors flex items-center gap-1.5 shadow-2xs"
        >
          <Volume2 className="w-4 h-4 text-blue-500" />
          <span>Nghe lại</span>
        </button>
      </div>

      {/* 4 Answer Options Grid (A, B, C, D) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {question.options.map((opt) => {
          const isSelected = currentAnswer?.userResponse === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelectOption(opt.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between group shadow-xs ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 ring-2 ring-blue-400 dark:ring-blue-800'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 hover:bg-blue-50/20'
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50'
                  }`}
                >
                  {opt.label}
                </span>
                <div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white font-mono">
                    {opt.pinyin}
                  </div>
                  {opt.meaning && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {opt.meaning}
                    </div>
                  )}
                </div>
              </div>

              {isSelected && (
                <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
