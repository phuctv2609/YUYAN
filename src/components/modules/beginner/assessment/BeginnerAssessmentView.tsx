import React, { useState } from 'react';
import {
  Volume2,
  Mic,
  BookOpen,
  Edit3,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
  RotateCcw,
} from 'lucide-react';
import {
  AssessmentSessionState,
  UserAnswerRecord,
} from './assessmentTypes';
import {
  initializeAssessmentSession,
  saveAssessmentSession,
  clearAssessmentSession,
} from './assessmentGenerator';
import { AssessmentDonutChart } from './AssessmentDonutChart';
import { ListeningQuestionCard } from './ListeningQuestionCard';
import { SpeakingQuestionCard } from './SpeakingQuestionCard';
import { ReadingQuestionCard } from './ReadingQuestionCard';
import { WritingQuestionCard } from './WritingQuestionCard';
import { AssessmentResultModal } from './AssessmentResultModal';

interface BeginnerAssessmentViewProps {
  onGoDashboard?: () => void;
  className?: string;
}

export const BeginnerAssessmentView: React.FC<BeginnerAssessmentViewProps> = ({
  onGoDashboard,
  className = '',
}) => {
  const [session, setSession] = useState<AssessmentSessionState>(() =>
    initializeAssessmentSession()
  );
  const [showResultModal, setShowResultModal] = useState<boolean>(false);

  const currentQ = session.questions[session.currentIndex] || session.questions[0];
  const totalQuestions = session.questions.length;
  const currentAnswer = session.answers[currentQ.id];

  const handleAnswerQuestion = (answer: UserAnswerRecord) => {
    const updatedAnswers = {
      ...session.answers,
      [answer.questionId]: answer,
    };
    const updatedState: AssessmentSessionState = {
      ...session,
      answers: updatedAnswers,
    };
    setSession(updatedState);
    saveAssessmentSession(updatedState);
  };

  const handleNext = () => {
    if (session.currentIndex < totalQuestions - 1) {
      const nextIdx = session.currentIndex + 1;
      const updatedState = { ...session, currentIndex: nextIdx };
      setSession(updatedState);
      saveAssessmentSession(updatedState);
    } else {
      // Submit assessment
      const finalState = { ...session, isFinished: true, completedAt: Date.now() };
      setSession(finalState);
      saveAssessmentSession(finalState);
      setShowResultModal(true);
    }
  };

  const handlePrev = () => {
    if (session.currentIndex > 0) {
      const prevIdx = session.currentIndex - 1;
      const updatedState = { ...session, currentIndex: prevIdx };
      setSession(updatedState);
      saveAssessmentSession(updatedState);
    }
  };

  const handleJumpToQuestion = (idx: number) => {
    const updatedState = { ...session, currentIndex: idx };
    setSession(updatedState);
    saveAssessmentSession(updatedState);
  };

  const handleRetake = () => {
    clearAssessmentSession();
    const fresh = initializeAssessmentSession();
    setSession(fresh);
    setShowResultModal(false);
  };

  // Helper badge color per skill
  const getSkillMeta = (skill: string) => {
    switch (skill) {
      case 'listening':
        return { label: 'Nghe', color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800', icon: Volume2 };
      case 'speaking':
        return { label: 'Nói', color: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800', icon: Mic };
      case 'reading':
        return { label: 'Đọc', color: 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800', icon: BookOpen };
      case 'writing':
        return { label: 'Viết', color: 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800', icon: Edit3 };
      default:
        return { label: 'Khác', color: 'text-slate-600 bg-slate-50 border-slate-200', icon: Sparkles };
    }
  };

  const skillMeta = getSkillMeta(currentQ.skill);
  const SkillIcon = skillMeta.icon;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            Bài Kiểm Tra Toàn Diện 30 Câu (4 Kỹ Năng)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Đánh giá toàn diện Nghe (8 câu), Nói (8 câu), Đọc (7 câu) và Viết (7 câu) chuẩn khung Hán ngữ.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRetake}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại từ đầu</span>
          </button>
        </div>
      </div>

      {/* Main 3-Column Layout (Matching Infographic Section 9) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (3 cols): Question Stepper List (Câu 1 - Câu 30) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Danh sách 30 câu hỏi
            </span>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
              {Object.keys(session.answers).length}/30 đã làm
            </span>
          </div>

          <div className="max-h-[560px] overflow-y-auto space-y-1.5 pr-1">
            {session.questions.map((q, idx) => {
              const meta = getSkillMeta(q.skill);
              const isCurrent = idx === session.currentIndex;
              const isAnswered = Boolean(session.answers[q.id]);
              const QIcon = meta.icon;

              return (
                <button
                  key={q.id}
                  onClick={() => handleJumpToQuestion(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all ${
                    isCurrent
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300 dark:ring-blue-800 font-bold'
                      : isAnswered
                      ? 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 hover:bg-slate-100'
                      : 'bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] ${
                      isCurrent ? 'bg-white/20 text-white' : meta.color
                    }`}>
                      <QIcon className="w-3 h-3" />
                    </span>
                    <span className="text-xs">
                      Câu {idx + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-semibold ${
                      isCurrent ? 'bg-white/20 text-white' : meta.color
                    }`}>
                      {meta.label}
                    </span>
                    {isAnswered && (
                      <CheckCircle2 className={`w-3.5 h-3.5 ${isCurrent ? 'text-white' : 'text-emerald-500'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Center Column (6 cols): Question Card & Interaction */}
        <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          {/* Question Title & Prompt */}
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2 mb-1.5">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${skillMeta.color}`}>
                <SkillIcon className="w-3.5 h-3.5" />
                <span>Câu {session.currentIndex + 1} / 30 ({skillMeta.label})</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              {currentQ.prompt}
            </h3>
          </div>

          {/* Render Active Skill Question Component */}
          {currentQ.skill === 'listening' && (
            <ListeningQuestionCard
              question={currentQ as any}
              currentAnswer={currentAnswer}
              onAnswer={handleAnswerQuestion}
            />
          )}

          {currentQ.skill === 'speaking' && (
            <SpeakingQuestionCard
              question={currentQ as any}
              currentAnswer={currentAnswer}
              onAnswer={handleAnswerQuestion}
            />
          )}

          {currentQ.skill === 'reading' && (
            <ReadingQuestionCard
              question={currentQ as any}
              currentAnswer={currentAnswer}
              onAnswer={handleAnswerQuestion}
            />
          )}

          {currentQ.skill === 'writing' && (
            <WritingQuestionCard
              question={currentQ as any}
              currentAnswer={currentAnswer}
              onAnswer={handleAnswerQuestion}
            />
          )}

          {/* Bottom Stepper Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handlePrev}
              disabled={session.currentIndex === 0}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Câu trước</span>
            </button>

            <button
              onClick={handleNext}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <span>{session.currentIndex === totalQuestions - 1 ? 'Nộp bài kiểm tra' : 'Câu tiếp theo'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column (3 cols): Donut Chart "Phân bố câu hỏi" (Exact Match Infographic Section 9) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col items-center">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 text-center">
            Phân bố câu hỏi (30 câu)
          </h3>

          {/* SVG Donut Chart */}
          <AssessmentDonutChart size={180} />

          <div className="w-full mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1.5 text-center">
            <p>
              * Hoàn thành toàn bộ 30 câu hỏi để nhận chứng chỉ sơ cấp và điểm tiến độ.
            </p>
            <p>
              * Tiến độ làm bài được tự động lưu lại trên thiết bị.
            </p>
          </div>
        </div>
      </div>

      {/* Result Modal */}
      {showResultModal && (
        <AssessmentResultModal
          sessionState={session}
          onRetake={handleRetake}
          onGoDashboard={() => {
            setShowResultModal(false);
            onGoDashboard?.();
          }}
        />
      )}
    </div>
  );
};
