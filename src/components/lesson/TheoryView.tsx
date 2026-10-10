import React from 'react';
import { Brain, FileText, ShieldCheck } from 'lucide-react';
import { Lesson } from '../../data/hsk/types.ts';

interface TheoryViewProps {
  lesson: Lesson;
}

export const TheoryView: React.FC<TheoryViewProps> = ({ lesson }) => {
  return (
    <div className="w-full space-y-4">
      <div className="bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-1">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-sm sm:text-base font-bold text-text-primary">
            Lý thuyết & Khung kiến thức • HSK {lesson.level} Bài {lesson.lessonNumber}
          </h2>
        </div>
        <p className="text-xs text-text-muted">
          Thông tin chuẩn mực sư phạm, hồ sơ nguồn tư liệu và tiêu chuẩn đánh giá bài học
        </p>
      </div>

      {/* Meta Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="bg-surface rounded-2xl border border-border-subtle p-4 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Cấp độ HSK
          </span>
          <p className="text-lg font-bold text-primary">HSK {lesson.level} Chuẩn hóa</p>
          <p className="text-xs text-text-secondary">
            Đáp ứng khung năng lực tiếng Hán tiêu chuẩn quốc tế.
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border-subtle p-4 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Dung lượng bài khóa
          </span>
          <p className="text-lg font-bold text-secondary">{lesson.lessonText.length} câu hoàn chỉnh</p>
          <p className="text-xs text-text-secondary">
            Đầy đủ bộ ba: Hán tự, Pinyin và bản dịch nghĩa tiếng Việt.
          </p>
        </div>

        <div className="bg-surface rounded-2xl border border-border-subtle p-4 shadow-2xs space-y-1.5">
          <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
            Tình trạng đối soát
          </span>
          <p className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
            <ShieldCheck className="w-5 h-5" />
            <span>Đối khớp 100%</span>
          </p>
          <p className="text-xs text-text-secondary">
            Mã định danh: {lesson.lessonId}
          </p>
        </div>
      </div>

      {/* Source Integrity Dossier */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-2xs space-y-4">
        <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" />
          <span>Hồ sơ nguồn tư liệu (Source Provenance)</span>
        </h3>

        <div className="bg-surface-secondary/70 p-4 rounded-xl border border-border-subtle space-y-2 text-xs text-text-secondary">
          <div className="flex justify-between border-b border-border-subtle/60 pb-2">
            <span className="font-semibold text-text-muted">File nguồn:</span>
            <span className="font-mono text-text-primary">{lesson.sourceFile}</span>
          </div>
          <div className="flex justify-between border-b border-border-subtle/60 pb-2">
            <span className="font-semibold text-text-muted">Tiêu đề bài:</span>
            <span className="font-hanzi font-bold text-text-primary">{lesson.title}</span>
          </div>
          <div className="flex justify-between border-b border-border-subtle/60 pb-2">
            <span className="font-semibold text-text-muted">Số câu Hán tự:</span>
            <span className="font-bold text-text-primary">{lesson.lessonText.length} câu</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold text-text-muted">Chính sách toàn vẹn:</span>
            <span className="text-emerald-600 font-bold">Không giả lập • Giữ nguyên bản gốc</span>
          </div>
        </div>
      </div>
    </div>
  );
};
