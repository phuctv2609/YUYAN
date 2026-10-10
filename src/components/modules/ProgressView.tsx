import React from 'react';
import { TrendingUp, Flame, BookOpen, Award, CheckCircle } from 'lucide-react';
import { lessonRepository } from '../../data/hsk/lessonRepository.ts';

export const ProgressView: React.FC = () => {
  const allLessons = lessonRepository.getAllLessons();
  const totalLessons = allLessons.length;
  const totalSentences = allLessons.reduce((acc, l) => acc + l.lessonText.length, 0);

  const levelsStats = [
    { level: 1, total: 15, completed: 15, color: '#FF758F' },
    { level: 2, total: 15, completed: 12, color: '#F5A623' },
    { level: 3, total: 20, completed: 6, color: '#4A90E2' },
    { level: 4, total: 20, completed: 2, color: '#50B5FF' },
    { level: 5, total: 36, completed: 0, color: '#845EC2' },
    { level: 6, total: 40, completed: 0, color: '#B042C9' },
  ];

  const totalCompleted = levelsStats.reduce((acc, l) => acc + l.completed, 0);
  const overallPercent = Math.round((totalCompleted / totalLessons) * 100);

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-3 card-motion light-beam-shimmer">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-bold shadow-2xs">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Tiến độ & Thống kê học tập</h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Theo dõi mức độ hoàn thành giáo trình HSK 1–6 và các chỉ số tích lũy
            </p>
          </div>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border-subtle shadow-2xs space-y-1 card-motion">
          <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2">
            <Flame className="w-4 h-4 fill-amber-600" />
          </div>
          <span className="text-xs text-text-muted">Chuỗi học</span>
          <p className="text-xl sm:text-2xl font-black text-text-primary">320 ngày</p>
        </div>

        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border-subtle shadow-2xs space-y-1 card-motion">
          <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-xs text-text-muted">Bài đã học</span>
          <p className="text-xl sm:text-2xl font-black text-text-primary">{totalCompleted}/{totalLessons}</p>
        </div>

        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border-subtle shadow-2xs space-y-1 card-motion">
          <div className="w-8 h-8 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center mb-2">
            <Award className="w-4 h-4" />
          </div>
          <span className="text-xs text-text-muted">Tổng câu tích lũy</span>
          <p className="text-xl sm:text-2xl font-black text-text-primary">{totalSentences} câu</p>
        </div>

        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border-subtle shadow-2xs space-y-1 card-motion">
          <div className="w-8 h-8 rounded-xl bg-status-success/20 text-status-success flex items-center justify-center mb-2">
            <CheckCircle className="w-4 h-4" />
          </div>
          <span className="text-xs text-text-muted">Tiến độ tổng</span>
          <p className="text-xl sm:text-2xl font-black text-text-primary">{overallPercent}%</p>
        </div>
      </div>

      {/* Progress Breakdown by HSK Level */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-2xs space-y-4 card-motion">
        <h2 className="text-sm sm:text-base font-bold text-text-primary">Tiến độ chi tiết từng cấp độ HSK</h2>

        <div className="space-y-3">
          {levelsStats.map((l) => {
            const pct = Math.round((l.completed / l.total) * 100);
            return (
              <div key={l.level} className="space-y-1.5 p-3 rounded-xl bg-surface-secondary/50 border border-border-subtle">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: l.color }}
                    />
                    <span className="font-bold text-text-primary">HSK {l.level}</span>
                  </div>
                  <span className="font-semibold text-text-muted">
                    {l.completed}/{l.total} bài ({pct}%)
                  </span>
                </div>
                <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden border border-border-subtle">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: l.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
