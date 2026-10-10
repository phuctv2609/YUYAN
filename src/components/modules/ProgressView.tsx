import React from 'react';
import {
  TrendingUp,
  Flame,
  BookOpen,
  CheckCircle,
  Calendar,
  Clock,
  Trophy,
} from 'lucide-react';
import { useLearningProgress } from '../../services/progress/useLearningProgress.ts';
import { lessonRepository } from '../../data/hsk/lessonRepository.ts';

export const ProgressView: React.FC = () => {
  const { progress } = useLearningProgress();
  const allLessons = lessonRepository.getAllLessons();
  const totalLessons = allLessons.length;
  const totalSentences = allLessons.reduce((acc, l) => acc + l.lessonText.length, 0);

  const levelsStats = progress.levelStats;
  const totalCompleted = progress.totalCompletedLessons;
  const overallPercent = progress.overallPercent;

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-3 card-motion light-beam-shimmer">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-bold shadow-2xs">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Tiến độ & Thống kê học tập</h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Dữ liệu đồng bộ thời gian thực theo từng bài học và hoạt động luyện tập
              </p>
            </div>
          </div>

          {/* Journey Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-ultra-soft border border-primary-soft self-start sm:self-auto">
            <Calendar className="w-4 h-4 text-primary" />
            <div className="text-xs font-bold text-text-primary">
              {progress.journeyStartDate ? (
                <>Hành trình: <span className="text-primary font-black">Ngày {progress.journeyDay}</span></>
              ) : (
                <span className="text-text-muted">Hành trình: Chưa bắt đầu</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Primary Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Streak Card */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border-subtle shadow-2xs space-y-1 card-motion">
          <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-2">
            <Flame className="w-4 h-4 fill-amber-500" />
          </div>
          <span className="text-xs text-text-muted">Chuỗi học hiện tại</span>
          <p className="text-xl sm:text-2xl font-black text-text-primary">{progress.currentStreak} ngày</p>
          <div className="text-[10px] text-text-muted pt-0.5">
            Kỷ lục: {progress.longestStreak} ngày liên tiếp
          </div>
        </div>

        {/* Completed Lessons Card */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border-subtle shadow-2xs space-y-1 card-motion">
          <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center mb-2">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="text-xs text-text-muted">Bài đã hoàn thành</span>
          <p className="text-xl sm:text-2xl font-black text-text-primary">{totalCompleted}/{totalLessons}</p>
          <div className="text-[10px] text-text-muted pt-0.5">
            Từ vựng đã học: {progress.learnedWords.length} từ
          </div>
        </div>

        {/* Active Study Days Card */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border-subtle shadow-2xs space-y-1 card-motion">
          <div className="w-8 h-8 rounded-xl bg-secondary-fixed text-secondary flex items-center justify-center mb-2">
            <Trophy className="w-4 h-4" />
          </div>
          <span className="text-xs text-text-muted">Tổng ngày học</span>
          <p className="text-xl sm:text-2xl font-black text-text-primary">{progress.totalActiveDays} ngày</p>
          <div className="text-[10px] text-text-muted pt-0.5">
            Học hôm nay: {progress.dailyMinutesStudied} phút
          </div>
        </div>

        {/* Overall Completion Percentage Card */}
        <div className="bg-surface p-4 sm:p-5 rounded-2xl border border-border-subtle shadow-2xs space-y-1 card-motion">
          <div className="w-8 h-8 rounded-xl bg-status-success/20 text-status-success flex items-center justify-center mb-2">
            <CheckCircle className="w-4 h-4" />
          </div>
          <span className="text-xs text-text-muted">Tiến độ tổng thể</span>
          <p className="text-xl sm:text-2xl font-black text-text-primary">{overallPercent}%</p>
          <div className="text-[10px] text-text-muted pt-0.5">
            Tổng câu: {totalSentences} câu bài khóa
          </div>
        </div>
      </div>

      {/* Progress Breakdown by HSK Level (1–6) */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-2xs space-y-4 card-motion">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold text-text-primary">Tiến độ chi tiết từng cấp độ HSK</h2>
          <span className="text-xs text-text-muted">146 bài học chính thức</span>
        </div>

        <div className="space-y-3">
          {levelsStats.map((l) => (
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
                  {l.completed}/{l.total} bài ({l.percent}%)
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden border border-border-subtle">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${l.percent}%`, backgroundColor: l.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Calendar & Time Telemetry */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-bold text-text-primary flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span>Thời lượng học tập & Thống kê phiên</span>
          </h3>
          <span className="text-xs text-text-muted">
            {progress.isOnline ? 'Đã kết nối đồng bộ Supabase' : 'Chế độ lưu ngoại tuyến'}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle">
            <span className="text-[11px] text-text-muted block">Học tập hôm nay</span>
            <span className="text-base font-bold text-text-primary">{progress.dailyMinutesStudied} / {progress.dailyGoalMinutes} phút</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle">
            <span className="text-[11px] text-text-muted block">Tổng thời lượng tích lũy</span>
            <span className="text-base font-bold text-text-primary">{progress.totalStudyMinutes} phút</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-secondary border border-border-subtle">
            <span className="text-[11px] text-text-muted block">Ngày học gần nhất</span>
            <span className="text-base font-bold text-text-primary">{progress.lastStudyDate || 'Hôm nay'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
