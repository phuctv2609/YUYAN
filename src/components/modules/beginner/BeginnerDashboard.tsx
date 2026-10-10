import React from 'react';
import {
  Sparkles,
  Flame,
  Calendar,
  CheckCircle2,
  Volume2,
  ArrowRight,
  BookOpen,
  Award,
  Layers,
} from 'lucide-react';
import { useLearningProgress } from '../../../services/progress/useLearningProgress';

interface BeginnerDashboardProps {
  onNavigateTab: (tab: string) => void;
  className?: string;
}

export const BeginnerDashboard: React.FC<BeginnerDashboardProps> = ({
  onNavigateTab,
  className = '',
}) => {
  const { progress } = useLearningProgress();

  // Calculate beginner metrics based on actual learning history
  const journeyDay = progress.journeyDay > 0 ? progress.journeyDay : 1;
  const currentStreak = progress.currentStreak > 0 ? progress.currentStreak : 1;

  // Derive assessment status from localStorage or progress
  const hasCompletedAssessment = Boolean(
    typeof window !== 'undefined' &&
      localStorage.getItem('yuyan_beginner_assessment_result')
  );

  const assessmentScore = hasCompletedAssessment
    ? JSON.parse(localStorage.getItem('yuyan_beginner_assessment_result') || '{}').score || 85
    : null;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. Welcome Banner with Cute Panda Mascot (Infographic Section 1) */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-600 p-6 sm:p-8 text-white shadow-lg">
        {/* Decorative backdrop patterns */}
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 left-1/3 w-64 h-64 rounded-full bg-cyan-300/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              Khóa học Nhập môn Tiếng Trung Chuẩn Bắc Kinh
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
              Chào mừng đến với hành trình tiếng Trung của bạn!
            </h1>
            <p className="text-sm sm:text-base text-blue-50/90 leading-relaxed">
              Bắt đầu từ phát âm chuẩn, Pinyin, 4 thanh điệu đến những câu giao tiếp phản xạ đầu tiên.
            </p>
            <div className="pt-2 flex flex-wrap gap-2.5 justify-center md:justify-start">
              <button
                onClick={() => onNavigateTab('initials')}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-blue-600 font-bold text-sm shadow-md hover:bg-blue-50 active:scale-95 transition-all"
              >
                Bắt đầu học Thanh Mẫu
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => onNavigateTab('assessment')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-blue-700/60 hover:bg-blue-700/80 text-white font-medium text-sm backdrop-blur-md border border-white/20 active:scale-95 transition-all"
              >
                Kiểm tra 30 câu (4 kỹ năng)
              </button>
            </div>
          </div>

          {/* Cute Panda Mascot SVG Illustration */}
          <div className="flex-shrink-0 w-36 h-36 sm:w-44 sm:h-44 relative animate-float">
            <svg viewBox="0 0 160 160" className="w-full h-full drop-shadow-xl">
              {/* Ears */}
              <circle cx="42" cy="42" r="22" fill="#1F2937" />
              <circle cx="42" cy="42" r="14" fill="#374151" />
              <circle cx="118" cy="42" r="22" fill="#1F2937" />
              <circle cx="118" cy="42" r="14" fill="#374151" />
              {/* Head */}
              <circle cx="80" cy="85" r="52" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="2" />
              {/* Eye patches */}
              <ellipse cx="60" cy="78" rx="14" ry="18" fill="#1F2937" transform="rotate(-15 60 78)" />
              <ellipse cx="100" cy="78" rx="14" ry="18" fill="#1F2937" transform="rotate(15 100 78)" />
              {/* Eyeballs */}
              <circle cx="62" cy="76" r="6" fill="#FFFFFF" />
              <circle cx="63" cy="75" r="3" fill="#111827" />
              <circle cx="98" cy="76" r="6" fill="#FFFFFF" />
              <circle cx="97" cy="75" r="3" fill="#111827" />
              {/* Cheeks */}
              <circle cx="48" cy="94" r="8" fill="#FDA4AF" opacity="0.6" />
              <circle cx="112" cy="94" r="8" fill="#FDA4AF" opacity="0.6" />
              {/* Nose */}
              <ellipse cx="80" cy="88" rx="7" ry="5" fill="#1F2937" />
              {/* Mouth happy */}
              <path
                d="M 73,94 Q 80,102 87,94"
                fill="none"
                stroke="#1F2937"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Waving paw */}
              <g transform="translate(112, 105)">
                <ellipse cx="14" cy="14" rx="14" ry="12" fill="#1F2937" />
                <circle cx="10" cy="10" r="3" fill="#E5E7EB" />
                <circle cx="16" cy="10" r="3" fill="#E5E7EB" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* 2. Grid: Progress & Journey Card (Infographic Section 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 spans): Tiến độ tổng thể & 4 Skill stats */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Tiến độ tổng thể
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Lộ trình hoàn thiện phát âm và ngữ âm căn bản
                </p>
              </div>
              <span className="text-lg font-black text-blue-600 dark:text-blue-400">
                {hasCompletedAssessment ? '75%' : '25%'}
              </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden mb-6">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                style={{ width: hasCompletedAssessment ? '75%' : '25%' }}
              />
            </div>

            {/* 4 Skill Cards (Phát âm, Từ vựng, Ngữ pháp, Kiểm tra) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Phát âm */}
              <div
                onClick={() => onNavigateTab('initials')}
                className="flex flex-col items-center p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-center cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-blue-500 text-white flex items-center justify-center mb-2 shadow-2xs">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Phát âm
                </div>
                <div className="text-xs font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                  12 / 21 bài
                </div>
              </div>

              {/* Từ vựng */}
              <div
                onClick={() => onNavigateTab('syllables')}
                className="flex flex-col items-center p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/40 text-center cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-2xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Từ vựng
                </div>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                  8 / 20 bài
                </div>
              </div>

              {/* Ngữ pháp / Quy tắc */}
              <div
                onClick={() => onNavigateTab('rules')}
                className="flex flex-col items-center p-3.5 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/60 dark:border-purple-900/40 text-center cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-purple-500 text-white flex items-center justify-center mb-2 shadow-2xs">
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Quy tắc
                </div>
                <div className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-0.5">
                  4 / 4 bài
                </div>
              </div>

              {/* Kiểm tra */}
              <div
                onClick={() => onNavigateTab('assessment')}
                className="flex flex-col items-center p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-center cursor-pointer hover:scale-[1.02] transition-transform"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-2 shadow-2xs">
                  <Award className="w-5 h-5" />
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  Kiểm tra
                </div>
                <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                  {hasCompletedAssessment ? `${assessmentScore}/100` : 'Chưa làm'}
                </div>
              </div>
            </div>
          </div>

          {/* Bài học tiếp theo card (Matching Infographic) */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/60 dark:to-slate-850/60 rounded-3xl p-5 border border-blue-100 dark:border-slate-800 flex items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md font-mono text-lg font-black flex-shrink-0">
                b - p
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  Bài học tiếp theo
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Phân biệt Thanh mẫu b và p
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Học khẩu hình không bật hơi vs bật hơi dứt khoát
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('minimal_pairs')}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 active:scale-95 transition-all shadow-sm flex-shrink-0"
            >
              Học ngay
            </button>
          </div>
        </div>

        {/* Right Column (1 span): Hành trình học & Hoạt động gần đây */}
        <div className="space-y-4">
          {/* Hành trình học (Streak & Days) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
              Hành trình học
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-900/40 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-500" />
                  Ngày học
                </div>
                <div className="text-2xl font-black text-slate-900 dark:text-white">
                  {journeyDay}
                </div>
              </div>
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-center">
                <div className="flex items-center justify-center gap-1 text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Chuỗi ngày
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {currentStreak}
                </div>
              </div>
            </div>

            {/* Hoạt động gần đây (Matching Infographic) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Hoạt động gần đây
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Hoàn thành bài vận mẫu đơn a, o, e</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Luyện phát âm cặp âm b - p</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Học từ mới: mā, bà, tā</span>
                </div>
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Luyện nghe 4 thanh điệu chuẩn</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
