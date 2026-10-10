import React, { useState, useEffect } from 'react';
import {
  AlarmClock,
  Sparkles,
  Play,
  Volume2,
  Donut,
  Star,
  Flame,
  Bookmark,
  ArrowRight,
  Check,
  Mic,
  PenTool,
  Bot,
  Award,
  Heart,
  AlertTriangle,
} from 'lucide-react';
import { lessonRepository } from '../../data/hsk/lessonRepository.ts';
import { learnerRepository, LearnerProfile } from '../../data/repositories/learnerRepository.ts';
import { progressRepository, LearnerProgressStats } from '../../data/repositories/progressRepository.ts';
import { mistakeRepository, LearnerMistake } from '../../data/repositories/mistakeRepository.ts';
import { audioManager } from '../../services/audio/index.ts';
import { useToast } from '../ui/Toast.tsx';

interface DashboardViewProps {
  onStartLesson: (level: number, lessonNumber: number) => void;
  onOpenPractice: (practiceType: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onStartLesson, onOpenPractice }) => {
  const { showToast } = useToast();
  const [profile, setProfile] = useState<LearnerProfile>(() => learnerRepository.getProfile());
  const [stats, setStats] = useState<LearnerProgressStats>(() => progressRepository.getStats());
  const [mistakes, setMistakes] = useState<LearnerMistake[]>(() => mistakeRepository.getUnresolved());

  useEffect(() => {
    const unsubP = learnerRepository.subscribe(setProfile);
    const unsubS = progressRepository.subscribe(setStats);
    const unsubM = mistakeRepository.subscribe(setMistakes);
    return () => {
      unsubP();
      unsubS();
      unsubM();
    };
  }, []);

  const resumeLevel = profile.lastStudiedLesson?.level || 1;
  const resumeLessonNum = profile.lastStudiedLesson?.lessonNumber || 1;
  const currentResumeLesson = lessonRepository.getLesson(resumeLevel, resumeLessonNum) || lessonRepository.getAllLessons()[0];

  const hskLevels = [
    { level: 1, name: 'Cơ bản', words: '0 - 150 từ', color: '#FF758F', bg: 'from-[#FFF5F7] dark:from-surface-secondary to-surface', border: 'border-[#FFD5DC] dark:border-border-subtle' },
    { level: 2, name: 'Sơ cấp', words: '150 - 300 từ', color: '#D97706', bg: 'from-[#FEF9EE] dark:from-surface-secondary to-surface', border: 'border-2 border-[#F5A623] dark:border-amber-500/60', active: true },
    { level: 3, name: 'Trung cấp 1', words: '300 - 600 từ', color: '#4A90E2', bg: 'from-[#F2F8FE] dark:from-surface-secondary to-surface', border: 'border-[#CFE4FC] dark:border-border-subtle' },
    { level: 4, name: 'Trung cấp 2', words: '600 - 1200 từ', color: '#0284C7', bg: 'from-[#F4FAFF] dark:from-surface-secondary to-surface', border: 'border-[#D5EEFF] dark:border-border-subtle' },
    { level: 5, name: 'Cao cấp 1', words: '1200 - 2500 từ', color: '#845EC2', bg: 'from-[#F9F6FE] dark:from-surface-secondary to-surface', border: 'border-[#E9E0F8] dark:border-border-subtle' },
    { level: 6, name: 'Thành thạo', words: '2500+ từ', color: '#B042C9', bg: 'from-[#FCF5FD] dark:from-surface-secondary to-surface', border: 'border-[#F4DBFA] dark:border-border-subtle' },
  ];

  return (
    <div className="min-h-full p-4 sm:p-8 max-w-[1440px] mx-auto select-none">
      {/* Welcome Greeting Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary tracking-tight">
              Xin chào, {profile.name}!
            </h1>
            <span className="text-2xl">👋</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs text-text-secondary">
              Mục tiêu: HSK {profile.targetHskLevel} • {profile.dailyGoalMinutes} phút/ngày
            </span>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-primary-soft text-primary">
              {stats.journeyStartDate ? `Hành trình: Ngày ${stats.journeyDay}` : 'Hành trình: Chưa bắt đầu'}
            </span>
          </div>
        </div>

        {mistakes.length > 0 && (
          <button
            onClick={() => onOpenPractice('mistakes')}
            className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 rounded-xl border border-amber-200 dark:border-amber-900 text-xs font-bold flex items-center gap-2 hover:bg-amber-100 transition-colors shadow-2xs self-start sm:self-auto"
          >
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Có {mistakes.length} câu sai cần ôn lại</span>
          </button>
        )}
      </div>

      {/* Hero Banner with Chinese Inspiration Quote */}
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-[#FFF5F6] via-[#F5F8FF] to-[#EAF4FF] dark:from-surface-secondary dark:via-surface-elevated dark:to-surface border border-[#E4EEF8] dark:border-border-subtle p-5 sm:p-7 mb-8 shadow-2xs light-beam-shimmer">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/80 dark:bg-surface/80 backdrop-blur-xs rounded-full border border-border-subtle text-secondary text-xs font-semibold mb-3 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Truyền cảm hứng học tập mỗi ngày</span>
          </div>
          <h2 className="font-hanzi text-xl sm:text-2xl md:text-3xl font-bold text-text-primary tracking-wide leading-snug mb-2">
            每天进步一点点 你会看到不一样的自己
          </h2>
          <p className="text-sm sm:text-base text-deep-blue font-medium italic">
            "Mỗi ngày tiến bộ một chút, bạn sẽ thấy một phiên bản khác của chính mình."
          </p>
        </div>

        {/* Ambient Decorative Hanzi */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-80 pointer-events-none hidden md:flex items-center justify-end pr-10">
          <div className="text-[120px] font-hanzi font-black text-primary/10 select-none leading-none">学</div>
        </div>
      </div>

      {/* Bento Grid Row: "Tiếp tục học" & "Tiến độ của bạn" */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 mb-8">
        {/* Module 1: Tiếp tục học */}
        <div className="lg:col-span-7 bg-surface rounded-[18px] p-5 sm:p-6 border border-border-subtle shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                <h3 className="text-base sm:text-lg font-bold text-text-primary">Tiếp tục học</h3>
              </div>
              <button
                onClick={() => onStartLesson(currentResumeLesson?.level || 1, currentResumeLesson?.lessonNumber || 1)}
                className="text-xs text-primary hover:text-primary-hover font-semibold flex items-center gap-0.5"
              >
                <span>Xem giáo trình</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inner Lesson Card */}
            <div className="flex items-center gap-3 sm:gap-4 p-4 rounded-xl bg-surface-secondary border border-border-subtle">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-surface p-2 border border-border-subtle flex-shrink-0 flex items-center justify-center shadow-2xs">
                <AlarmClock className="w-7 h-7 sm:w-8 sm:h-8 text-deep-blue" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    HSK {currentResumeLesson?.level || 1}
                  </span>
                  <span className="text-xs text-text-muted">Bài {currentResumeLesson?.lessonNumber || 1}</span>
                </div>
                <h4 className="font-hanzi font-bold text-base sm:text-lg text-text-primary truncate">
                  {currentResumeLesson?.title}
                </h4>
                <p className="text-xs text-text-secondary truncate mt-0.5">
                  {currentResumeLesson?.sourceFile}
                </p>
              </div>

              <button
                onClick={() => {
                  if (currentResumeLesson) {
                    audioManager.playText(currentResumeLesson.title, {
                      id: `dash_lesson_${currentResumeLesson.lessonId}`,
                      entityType: 'lesson',
                      entityId: currentResumeLesson.lessonId,
                    });
                  }
                }}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface border border-border-subtle text-primary hover:text-primary-hover flex items-center justify-center shadow-2xs hover:scale-105 active:scale-95 transition-all"
                title="Nghe phát âm tiêu đề bài đọc"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress & Action CTA */}
          <div className="mt-5 pt-4 border-t border-divider-line flex items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1.5 text-xs">
                <span className="text-text-muted">Tiến độ bài học</span>
                <span className="font-bold text-text-primary">
                  {stats.completedLessons.includes(`hsk${currentResumeLesson?.level}-bai${String(currentResumeLesson?.lessonNumber).padStart(2, '0')}`) ? '100%' : 'Chưa hoàn thành'}
                </span>
              </div>
              <div className="w-full h-2.5 bg-surface-secondary border border-border-subtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-container to-primary rounded-full transition-all duration-300"
                  style={{
                    width: stats.completedLessons.includes(`hsk${currentResumeLesson?.level}-bai${String(currentResumeLesson?.lessonNumber).padStart(2, '0')}`)
                      ? '100%'
                      : '0%',
                  }}
                />
              </div>
            </div>

            <button
              onClick={() => onStartLesson(currentResumeLesson?.level || 1, currentResumeLesson?.lessonNumber || 1)}
              className="px-4 sm:px-5 py-2.5 bg-secondary hover:bg-coral-hover text-white text-xs sm:text-sm font-semibold rounded-full shadow-2xs hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center gap-1.5 flex-shrink-0"
            >
              <span>Học tiếp</span>
              <Play className="w-3.5 h-3.5 fill-white" />
            </button>
          </div>
        </div>

        {/* Module 2: Tiến độ của bạn */}
        <div className="lg:col-span-5 bg-surface rounded-[18px] p-5 sm:p-6 border border-border-subtle shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Donut className="w-5 h-5 text-status-success" />
                <h3 className="text-base sm:text-lg font-bold text-text-primary">Tiến độ của bạn</h3>
              </div>
              <button
                onClick={() => showToast(`Mục tiêu học tập: Hoàn thành HSK ${profile.targetHskLevel}`, 'info')}
                className="text-text-muted hover:text-text-primary"
                title="Mục tiêu học tập"
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              </button>
            </div>

            {/* Circular Metric */}
            {(() => {
              const targetCompleted = stats.completedLessons.filter((k) => k.startsWith(`hsk${profile.targetHskLevel}-`)).length;
              const targetTotal = profile.targetHskLevel === 1 || profile.targetHskLevel === 2 ? 15 : profile.targetHskLevel === 3 || profile.targetHskLevel === 4 ? 20 : profile.targetHskLevel === 5 ? 36 : 40;
              const targetPercent = Math.min(100, Math.round((targetCompleted / targetTotal) * 100));

              return (
                <div className="flex items-center gap-5 sm:gap-6 py-2">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" fill="none" r="15.915" stroke="currentColor" className="text-border-subtle" strokeWidth="3.5" />
                      <circle
                        cx="18"
                        cy="18"
                        fill="none"
                        r="15.915"
                        stroke="#FF4D6D"
                        strokeDasharray={`${targetPercent}, 100`}
                        strokeLinecap="round"
                        strokeWidth="3.5"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-lg sm:text-xl font-extrabold text-text-primary leading-none">
                        {targetPercent}%
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-text-muted font-bold mt-0.5">
                        HSK {profile.targetHskLevel}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="text-sm sm:text-base font-bold text-text-primary">Mục tiêu HSK {profile.targetHskLevel}</div>
                    <p className="text-xs text-text-secondary mt-0.5">Đã hoàn thành {targetCompleted}/{targetTotal} bài học</p>
                    <span className="inline-block mt-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/15 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      {targetPercent >= 100 ? 'Đã thành thạo cấp độ' : `${stats.totalCompletedLessons} / 146 bài toàn khóa`}
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Telemetry Badges */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-divider-line">
            <div className="flex items-center gap-2.5 sm:gap-3 p-3 bg-surface-secondary rounded-xl border border-border-subtle">
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <Flame className="w-4 h-4 fill-amber-500" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-text-primary leading-tight">
                  {stats.currentStreak}
                </div>
                <div className="text-[11px] text-text-muted">Ngày liên tiếp</div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 p-3 bg-surface-secondary rounded-xl border border-border-subtle">
              <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary flex items-center justify-center flex-shrink-0">
                <Bookmark className="w-4 h-4 fill-primary" />
              </div>
              <div>
                <div className="text-sm sm:text-base font-bold text-text-primary leading-tight">
                  {stats.learnedWords.length}
                </div>
                <div className="text-[11px] text-text-muted">Từ đã học</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section: Chọn mục tiêu học tập (6 HSK Cards) */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-text-primary">Chọn mục tiêu học tập</h3>
            <p className="text-xs sm:text-sm text-text-secondary">Lựa chọn cấp độ HSK phù hợp để tùy biến lộ trình</p>
          </div>
          <span className="text-xs text-text-muted font-medium hidden sm:inline">HSK 3.0 Chuẩn mới</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-3.5">
          {hskLevels.map((lvl) => (
            <div
              key={lvl.level}
              onClick={() => onStartLesson(lvl.level, 1)}
              className={`bg-surface rounded-2xl p-4 ${lvl.border} bg-gradient-to-b ${lvl.bg} hover:shadow-md transition-all cursor-pointer group text-center relative`}
            >
              {lvl.active && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shadow-2xs">
                  Đang học
                </div>
              )}
              <div
                className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold mb-2"
                style={{ color: lvl.color, backgroundColor: `${lvl.color}20` }}
              >
                HSK {lvl.level}
              </div>
              <div className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">
                {lvl.name}
              </div>
              <div className="text-[11px] text-text-muted mt-1">{lvl.words}</div>
              <div className="mt-3 w-6 h-6 rounded-full bg-surface border border-border-subtle mx-auto flex items-center justify-center text-text-muted group-hover:bg-primary group-hover:text-white transition-all shadow-2xs">
                {lvl.active ? <Check className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section: Tính năng luyện tập chuyên sâu */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-text-primary">Tính năng luyện tập chuyên sâu</h3>
            <p className="text-xs sm:text-sm text-text-secondary">Phương pháp đa giác quan: Nghe, Nói, Viết và AI đối thoại thực tế</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1 */}
          <div
            onClick={() => onOpenPractice('speaking')}
            className="bg-surface rounded-2xl p-5 border border-border-subtle shadow-2xs hover:border-secondary/40 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-coral-soft text-secondary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Mic className="w-5 h-5" />
              </div>
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-primary-soft text-primary mb-1.5">
                AI Chấm âm
              </div>
              <h4 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-secondary transition-colors">
                Luyện nghe - nói
              </h4>
              <p className="text-xs text-text-secondary mt-1">
                Nhận diện giọng nói thông minh, đánh giá chính xác 4 thanh điệu chuẩn bản xứ.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-divider-line flex items-center justify-between">
              <span className="text-xs text-text-muted">12 bài đang chờ</span>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-secondary group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* Card 2 */}
          <div
            onClick={() => onOpenPractice('writing')}
            className="bg-surface rounded-2xl p-5 border border-border-subtle shadow-2xs hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <PenTool className="w-5 h-5" />
              </div>
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 mb-1.5">
                Mǐzìgé 米字格
              </div>
              <h4 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-status-success transition-colors">
                Luyện viết Hán tự
              </h4>
              <p className="text-xs text-text-secondary mt-1">
                Xem hoạt họa thứ tự nét bút, viết tay trực tiếp trên màn hình và nhận chấm điểm.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-divider-line flex items-center justify-between">
              <span className="text-xs text-text-muted">Bộ thủ & Nét bút</span>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-status-success group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* Card 3 */}
          <div
            onClick={() => onOpenPractice('ai')}
            className="bg-surface rounded-2xl p-5 border border-border-subtle shadow-2xs hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Bot className="w-5 h-5" />
              </div>
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 mb-1.5">
                Phản xạ 24/7
              </div>
              <h4 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-primary transition-colors">
                AI Hội thoại
              </h4>
              <p className="text-xs text-text-secondary mt-1">
                Đóng vai theo ngữ cảnh nhà hàng, sân bay, công sở với gia sư AI thân thiện.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-divider-line flex items-center justify-between">
              <span className="text-xs text-text-muted">45 kịch bản</span>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* Card 4 */}
          <div
            onClick={() => onOpenPractice('exam')}
            className="bg-surface rounded-2xl p-5 border border-border-subtle shadow-2xs hover:border-purple-500/40 hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5" />
              </div>
              <div className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/15 text-purple-600 dark:text-purple-400 mb-1.5">
                Đề Chuẩn HSK
              </div>
              <h4 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Thi thử HSK
              </h4>
              <p className="text-xs text-text-secondary mt-1">
                Mô phỏng phòng thi thật với áp lực thời gian, chấm điểm chi tiết và giải thích đáp án.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-divider-line flex items-center justify-between">
              <span className="text-xs text-text-muted">Đề thi HSK 1 - 6</span>
              <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer Banner */}
      <footer className="border-t border-border-subtle pt-6 pb-20 md:pb-8 flex flex-col sm:flex-row items-center justify-between text-text-muted text-xs gap-3">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-text-primary">Yuyan 语言</span>
          <span>• Hệ thống học tiếng Trung thông minh toàn diện</span>
        </div>
        <div className="flex items-center gap-1 text-secondary font-medium">
          <span className="font-hanzi">语言，让世界更近</span>
          <Heart className="w-3.5 h-3.5 fill-secondary" />
        </div>
      </footer>
    </div>
  );
};
