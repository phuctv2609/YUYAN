import React, { useEffect } from 'react';
import { Award, RotateCcw, ArrowRight } from 'lucide-react';
import { AssessmentSessionState } from './assessmentTypes';
import { calculateAssessmentResult, clearAssessmentSession } from './assessmentGenerator';
import { learningProgressService } from '../../../../services/progress/learningProgressService';

interface AssessmentResultModalProps {
  sessionState: AssessmentSessionState;
  onRetake: () => void;
  onGoDashboard: () => void;
}

export const AssessmentResultModal: React.FC<AssessmentResultModalProps> = ({
  sessionState,
  onRetake,
  onGoDashboard,
}) => {
  const result = calculateAssessmentResult(sessionState);

  // Sync to authoritative learningProgressService on completion
  useEffect(() => {
    try {
      localStorage.setItem(
        'yuyan_beginner_assessment_result',
        JSON.stringify({
          score: result.overallScore,
          totalCorrect: result.totalCorrect,
          completedAt: Date.now(),
        })
      );

      // Record to platform progress service
      learningProgressService.recordExerciseCompleted({
        type: 'listening',
        entityId: 'beginner_comprehensive_30_assessment',
        score: result.overallScore,
        durationMinutes: 15,
      });

      // Award study minutes
      learningProgressService.addStudyMinutes(15, 'Hoàn thành bài kiểm tra 30 câu 4 kỹ năng người mới');
    } catch (e) {
      console.warn('Failed to sync assessment result to progress service:', e);
    }
  }, [result.overallScore]);

  const getTier = (score: number) => {
    if (score >= 90) return { label: 'Xuất sắc — Đạt chuẩn ngữ âm Bắc Kinh!', color: 'text-emerald-500' };
    if (score >= 75) return { label: 'Tốt — Đã nắm vững nền tảng phát âm!', color: 'text-blue-500' };
    return { label: 'Cần ôn tập thêm — Hãy luyện thêm các cặp âm dễ nhầm.', color: 'text-amber-500' };
  };

  const tier = getTier(result.overallScore);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Header with Trophy Badge */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-yellow-300 text-white flex items-center justify-center mx-auto shadow-lg">
            <Award className="w-9 h-9 text-amber-900" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            Kết Quả Đánh Giá 4 Kỹ Năng
          </h2>
          <div className={`text-xs font-bold ${tier.color}`}>
            {tier.label}
          </div>
        </div>

        {/* Big Score Circle */}
        <div className="my-6 p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-center">
          <div className="text-5xl font-black text-slate-900 dark:text-white font-mono">
            {result.overallScore}
            <span className="text-2xl text-slate-400 font-normal">/100</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Đúng {result.totalCorrect} trên tổng số {result.totalQuestions} câu hỏi chuẩn
          </p>
        </div>

        {/* 4 Skill Cards Breakdown */}
        <div className="space-y-2.5 mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Chi tiết từng kỹ năng:
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {result.skillSummaries.map((skill) => (
              <div
                key={skill.skill}
                className="p-3.5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 truncate">
                    {skill.nameVi.split(' ')[0]}
                  </span>
                  <span
                    className="text-xs font-extrabold"
                    style={{ color: skill.color }}
                  >
                    {skill.correct}/{skill.total}
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(skill.correct / skill.total) * 100}%`,
                      backgroundColor: skill.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={() => {
              clearAssessmentSession();
              onRetake();
            }}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Làm lại bài kiểm tra</span>
          </button>
          <button
            onClick={onGoDashboard}
            className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <span>Về trang Người mới</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
