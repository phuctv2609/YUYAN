import React from 'react';
import { Quote, Lightbulb, CheckCircle } from 'lucide-react';
import { Lesson } from '../../data/hsk/types.ts';

interface GrammarViewProps {
  lesson: Lesson;
}

export const GrammarView: React.FC<GrammarViewProps> = ({ lesson }) => {
  // Extract grammar sections from lesson metadata if present
  const grammarSections = lesson.sections?.filter(
    (s) =>
      s.title.includes('NGỮ PHÁP') ||
      s.title.includes('语言点') ||
      s.title.includes('CHÚ THÍCH') ||
      s.title.includes('注释')
  ) || [];

  // Generate pattern highlights from sentences
  const sampleSentences = lesson.lessonText.slice(0, 6);

  return (
    <div className="w-full space-y-4">
      <div className="bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb className="w-5 h-5 text-secondary" />
          <h2 className="text-sm sm:text-base font-bold text-text-primary">
            Ngữ pháp & Điểm ngôn ngữ • HSK {lesson.level} Bài {lesson.lessonNumber}
          </h2>
        </div>
        <p className="text-xs text-text-muted">
          Tổng hợp mẫu câu, cấu trúc ngữ pháp và điểm chú thích quan trọng trong bài &quot;{lesson.title}&quot;
        </p>
      </div>

      {grammarSections.length > 0 ? (
        <div className="space-y-4">
          {grammarSections.map((sec, idx) => (
            <div
              key={idx}
              className="bg-surface rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-2xs space-y-3"
            >
              <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
                <Quote className="w-4 h-4 text-primary" />
                <span>{sec.title}</span>
              </h3>

              {sec.items && sec.items.length > 0 && (
                <ul className="space-y-2 text-xs sm:text-sm text-text-secondary">
                  {sec.items.map((item, i) => (
                    <li
                      key={i}
                      className="p-3 rounded-xl bg-surface-secondary/70 border border-border-subtle leading-relaxed flex items-start gap-2"
                    >
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="p-3.5 bg-secondary-fixed/30 rounded-xl border border-secondary/20 text-xs text-text-secondary leading-relaxed">
            <strong className="text-secondary font-bold block mb-1">
              Phân tích cấu trúc câu trực tiếp từ Bài khóa:
            </strong>
            Các cấu trúc ngữ pháp chính của HSK {lesson.level} Bài {lesson.lessonNumber} được lồng ghép trực tiếp qua ngữ cảnh giao tiếp sau đây.
          </div>

          <div className="space-y-3">
            {sampleSentences.map((s) => (
              <div
                key={s.index}
                className="p-4 rounded-xl bg-surface-secondary/60 border border-border-subtle space-y-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-primary bg-primary-soft px-2 py-0.5 rounded">
                    Mẫu câu #{s.index}
                  </span>
                </div>
                <p className="font-hanzi text-base sm:text-lg font-bold text-text-primary">
                  {s.hanzi}
                </p>
                <p className="text-xs font-semibold text-deep-blue">{s.pinyin}</p>
                <p className="text-xs text-text-secondary">{s.vietnamese}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
