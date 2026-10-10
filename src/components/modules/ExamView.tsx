import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Award,
  Timer,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Loader2,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { examRepository, ExamQuestion, ExamAttemptRecord } from '../../data/repositories';
import { audioManager } from '../../services/audio/audioManager';
import { learningProgressService } from '../../services/progress/learningProgressService';

interface HskLevelConfig {
  durationMinutes: number;
  passingScore: number;
  maxScore: number;
  titleZh: string;
}

const HSK_CONFIGS: Record<number, HskLevelConfig> = {
  1: { durationMinutes: 40, passingScore: 120, maxScore: 200, titleZh: 'HSK 1 级' },
  2: { durationMinutes: 55, passingScore: 120, maxScore: 200, titleZh: 'HSK 2 级' },
  3: { durationMinutes: 90, passingScore: 180, maxScore: 300, titleZh: 'HSK 3 级' },
  4: { durationMinutes: 105, passingScore: 180, maxScore: 300, titleZh: 'HSK 4 级' },
  5: { durationMinutes: 125, passingScore: 180, maxScore: 300, titleZh: 'HSK 5 级' },
  6: { durationMinutes: 140, passingScore: 180, maxScore: 300, titleZh: 'HSK 6 级' },
};

export const ExamView: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [examMode, setExamMode] = useState<'official' | 'quick'>('official');
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExamStarted, setIsExamStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [timeLeft, setTimeLeft] = useState(2400); // default 40 mins
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [pastAttempts, setPastAttempts] = useState<ExamAttemptRecord[]>([]);

  const { showToast } = useToast();
  const timerRef = useRef<number | null>(null);

  const currentConfig = useMemo(() => HSK_CONFIGS[selectedLevel] || HSK_CONFIGS[1], [selectedLevel]);

  // Load questions dynamically from Supabase
  useEffect(() => {
    let active = true;
    setIsLoading(true);
    examRepository.getQuestionsByLevel(selectedLevel).then((data) => {
      if (active) {
        setQuestions(data);
        setIsLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [selectedLevel]);

  // Load past attempts for selected level
  useEffect(() => {
    let active = true;
    examRepository.getAttempts(selectedLevel).then((data) => {
      if (active) {
        setPastAttempts(data);
      }
    });
    return () => {
      active = false;
    };
  }, [selectedLevel]);

  // Timer countdown
  useEffect(() => {
    if (isExamStarted && !isSubmitted && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isExamStarted, isSubmitted, timeLeft]);

  const totalTimeSeconds = useMemo(() => {
    return examMode === 'official' ? currentConfig.durationMinutes * 60 : 15 * 60;
  }, [examMode, currentConfig]);

  const handleStartExam = () => {
    setIsExamStarted(true);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setTimeLeft(totalTimeSeconds);
    setIsSubmitted(false);
    showToast(`Bắt đầu bài thi HSK ${selectedLevel} (${examMode === 'official' ? 'Chuẩn Hanban' : 'Luyện nhanh'})`, 'info');
  };

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optionIndex,
    }));
  };

  const recordAttempt = async () => {
    let correct = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correct++;
      }
    });
    const finalScore = Math.round((correct / (questions.length || 1)) * currentConfig.maxScore);
    const spentSecs = Math.max(60, totalTimeSeconds - timeLeft);
    await examRepository.saveAttempt({
      hskLevel: selectedLevel,
      score: finalScore,
      totalQuestions: questions.length,
      timeSpentSeconds: spentSecs,
      answers: userAnswers,
    });
    void learningProgressService.recordQualifyingActivity({
      activityType: 'exam_attempt',
      entityId: `exam_hsk${selectedLevel}`,
      score: finalScore,
      durationSeconds: spentSecs,
    });
    const updated = await examRepository.getAttempts(selectedLevel);
    setPastAttempts(updated);
  };

  const handleAutoSubmit = () => {
    setIsSubmitted(true);
    setShowSubmitModal(false);
    recordAttempt();
    showToast('Hết thời gian làm bài! Hệ thống đã tự động chấm điểm và lưu kết quả.', 'warning');
  };

  const handleManualSubmit = () => {
    setIsSubmitted(true);
    setShowSubmitModal(false);
    recordAttempt();
    showToast('Đã nộp bài thành công! Xem kết quả chi tiết bên dưới.', 'success');
  };

  const handlePlayAudio = (text: string, id: string) => {
    setSpeakingId(id);
    audioManager.playText(text, {
      id,
      entityType: 'sentence',
      entityId: id,
    });
    setTimeout(() => setSpeakingId(null), 1500);
  };

  // Score calculation
  let correctCount = 0;
  questions.forEach((q, idx) => {
    if (userAnswers[idx] === q.correctAnswer) {
      correctCount++;
    }
  });
  const scaledScore = Math.round((correctCount / (questions.length || 1)) * currentConfig.maxScore);
  const isPassed = scaledScore >= currentConfig.passingScore;
  const scorePercent = Math.round((correctCount / (questions.length || 1)) * 100);

  const sectionBreakdown = useMemo(() => {
    if (!isSubmitted || questions.length === 0) return [];
    const map: Record<string, { label: string; total: number; correct: number }> = {
      hanzi_pinyin: { label: 'Phát âm & Pinyin', total: 0, correct: 0 },
      meaning: { label: 'Ý nghĩa từ vựng', total: 0, correct: 0 },
      fill: { label: 'Điền từ ngữ pháp', total: 0, correct: 0 },
      reading: { label: 'Đọc hiểu đoạn văn', total: 0, correct: 0 },
    };

    questions.forEach((q, idx) => {
      const t = q.type || 'meaning';
      if (!map[t]) map[t] = { label: 'Tổng hợp', total: 0, correct: 0 };
      map[t].total++;
      if (userAnswers[idx] === q.correctAnswer) {
        map[t].correct++;
      }
    });

    return Object.values(map).filter((item) => item.total > 0);
  }, [isSubmitted, questions, userAnswers]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (!isExamStarted) {
    return (
      <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        <div className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-10 shadow-sm text-center space-y-6 card-motion">
          <div className="w-16 h-16 rounded-3xl bg-primary-soft text-primary flex items-center justify-center mx-auto shadow-sm">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ngân hàng 480 câu hỏi Supabase</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              Đề thi thử HSK Chuẩn Quốc Tế
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary mt-1 max-w-md mx-auto">
              Đánh giá thực lực tiếng Trung với ngân hàng câu hỏi chuẩn cấu trúc ngữ pháp và từ vựng HSK 1–6.
            </p>
          </div>

          {/* Level Selector */}
          <div className="flex flex-wrap justify-center gap-2.5">
            {[1, 2, 3, 4, 5, 6].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all btn-motion ${
                  selectedLevel === lvl
                    ? 'bg-primary text-white shadow-xs scale-105'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-border-subtle'
                }`}
              >
                HSK {lvl}
              </button>
            ))}
          </div>

          {/* Mode Selector */}
          <div className="inline-flex p-1 bg-surface-secondary rounded-2xl border border-border-subtle">
            <button
              onClick={() => setExamMode('official')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                examMode === 'official' ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Thi Chuẩn Hanban ({currentConfig.durationMinutes} phút)
            </button>
            <button
              onClick={() => setExamMode('quick')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                examMode === 'quick' ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Luyện Nhanh (15 phút)
            </button>
          </div>

          <div className="bg-primary-ultra-soft p-5 rounded-2xl border border-primary-soft max-w-md mx-auto text-xs text-text-secondary text-left space-y-2">
            <p className="font-bold text-text-primary flex items-center justify-between">
              <span>Quy chế bài thi HSK {selectedLevel}:</span>
              <span className="text-primary font-hanzi">{currentConfig.titleZh}</span>
            </p>
            <p>• Thời lượng: {examMode === 'official' ? `${currentConfig.durationMinutes} phút` : '15 phút'} (Đồng hồ đếm ngược)</p>
            <p>• Số lượng: {questions.length} câu hỏi chính thức</p>
            <p>• Thang điểm chuẩn: {currentConfig.maxScore} điểm (Điểm đạt: ≥ {currentConfig.passingScore} điểm)</p>
          </div>

          {/* Past Attempts History */}
          {pastAttempts.length > 0 && (
            <div className="bg-surface-secondary/50 p-4 rounded-2xl border border-border-subtle max-w-md mx-auto text-left space-y-2.5">
              <div className="flex items-center justify-between text-xs font-bold text-text-primary">
                <span>Lịch sử thi gần đây (HSK {selectedLevel})</span>
                <span className="text-text-muted">{pastAttempts.length} lần thi</span>
              </div>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {pastAttempts.slice(0, 5).map((att, idx) => {
                  const passed = att.score >= currentConfig.passingScore;
                  const dateStr = att.createdAt
                    ? new Date(att.createdAt).toLocaleDateString('vi-VN', {
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Vừa xong';
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-surface border border-border-subtle text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${passed ? 'bg-status-success' : 'bg-red-500'}`} />
                        <span className="text-text-secondary">{dateStr}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-text-primary">
                          {att.score}/{currentConfig.maxScore}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            passed
                              ? 'bg-status-success-soft text-status-success'
                              : 'bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {passed ? 'Đạt' : 'Chưa đạt'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <button
            onClick={handleStartExam}
            disabled={isLoading || questions.length === 0}
            className="px-8 py-3.5 bg-secondary hover:bg-coral-hover disabled:opacity-50 text-white text-sm font-bold rounded-2xl shadow-md btn-motion active:scale-95 inline-flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang tải đề thi HSK {selectedLevel}...</span>
              </>
            ) : (
              <>
                <span>Bắt đầu tính giờ thi HSK {selectedLevel}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestionIndex];

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Exam Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-4 sm:p-5 rounded-2xl border border-border-subtle shadow-sm card-motion">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-lg bg-primary-soft text-primary font-bold text-xs">
            HSK {selectedLevel} • {currentConfig.titleZh}
          </span>
          <h2 className="text-sm sm:text-base font-bold text-text-primary">
            Câu {currentQuestionIndex + 1} / {questions.length}
          </h2>
        </div>

        {/* Live Countdown Timer */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border font-bold text-sm ${
            timeLeft < 300
              ? 'bg-red-500/10 text-red-600 border-red-500/30 animate-pulse'
              : 'bg-surface text-text-primary border-border-subtle'
          }`}
        >
          <Timer className="w-4 h-4" />
          <span>{formatTimer(timeLeft)}</span>
        </div>

        {!isSubmitted ? (
          <button
            onClick={() => setShowSubmitModal(true)}
            className="px-4 py-2 bg-secondary hover:bg-coral-hover text-white text-xs font-bold rounded-xl shadow-xs btn-motion"
          >
            Nộp bài thi
          </button>
        ) : (
          <button
            onClick={handleStartExam}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 btn-motion"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Làm lại đề</span>
          </button>
        )}
      </div>

      {/* Results Banner (when submitted) */}
      {isSubmitted && (
        <div
          className={`p-6 rounded-3xl border shadow-sm space-y-3 ${
            isPassed
              ? 'bg-status-success-soft/30 border-status-success/30 text-status-success'
              : 'bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400'
          }`}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isPassed ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                <h3 className="text-lg font-extrabold">
                  {isPassed ? 'CHÚC MỪNG: BẠN ĐÃ ĐẠT CHUẨN HSK!' : 'KẾT QUẢ: CHƯA ĐẠT CHUẨN HSK'}
                </h3>
              </div>
              <p className="text-xs text-text-secondary">
                {isPassed
                  ? `Bạn đã vượt qua điểm chuẩn (${currentConfig.passingScore}/${currentConfig.maxScore}) của kỳ thi HSK ${selectedLevel}.`
                  : `Bạn cần đạt tối thiểu ${currentConfig.passingScore}/${currentConfig.maxScore} điểm để vượt qua HSK ${selectedLevel}. Hãy ôn lại các câu làm sai bên dưới.`}
              </p>
            </div>

            <div className="bg-surface px-5 py-3 rounded-2xl border border-border-subtle text-right">
              <div className="text-2xl font-black text-text-primary">
                {scaledScore} / {currentConfig.maxScore}
              </div>
              <div className="text-xs text-text-muted">
                {correctCount}/{questions.length} câu đúng ({scorePercent}%)
              </div>
            </div>
          </div>

          {sectionBreakdown.length > 0 && (
            <div className="pt-3 border-t border-current/15 grid grid-cols-2 sm:grid-cols-4 gap-2">
              {sectionBreakdown.map((sec, idx) => {
                const pct = Math.round((sec.correct / sec.total) * 100);
                return (
                  <div key={idx} className="bg-surface/90 p-2.5 rounded-xl border border-border-subtle text-text-primary space-y-1">
                    <div className="text-[11px] font-semibold text-text-secondary truncate">{sec.label}</div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-extrabold text-xs">{sec.correct}/{sec.total}</span>
                      <span className="text-[10px] font-bold text-primary">{pct}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Main Question Card */}
      {currentQ && (
        <div className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-sm space-y-6 card-motion">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                {currentQ.type === 'hanzi_pinyin'
                  ? 'Phát âm & Pinyin'
                  : currentQ.type === 'meaning'
                  ? 'Ý nghĩa từ vựng'
                  : currentQ.type === 'fill'
                  ? 'Điền từ vào câu'
                  : 'Đọc hiểu đoạn văn'}
              </span>
              <button
                onClick={() => handlePlayAudio(currentQ.question, `exam_q_${currentQ.id}`)}
                className={`p-2 rounded-xl transition-all ${
                  speakingId === `exam_q_${currentQ.id}` ? 'bg-primary text-white' : 'bg-surface-secondary text-text-muted hover:text-primary'
                }`}
                title="Phát âm câu hỏi"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-text-primary leading-relaxed">
              {currentQ.question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="grid grid-cols-1 gap-3">
            {currentQ.options.map((option, optIdx) => {
              const isSelected = userAnswers[currentQuestionIndex] === optIdx;
              const isCorrect = isSubmitted && optIdx === currentQ.correctAnswer;
              const isWrongSelected = isSubmitted && isSelected && !isCorrect;

              let optionStyle = 'bg-surface-secondary/70 hover:bg-surface-secondary border-border-subtle text-text-primary';

              if (isSubmitted) {
                if (isCorrect) {
                  optionStyle = 'bg-status-success-soft border-status-success text-status-success font-bold';
                } else if (isWrongSelected) {
                  optionStyle = 'bg-red-500/10 border-red-500 text-red-600 dark:text-red-400 font-bold';
                }
              } else if (isSelected) {
                optionStyle = 'bg-primary-soft border-primary text-primary font-bold shadow-xs';
              }

              return (
                <button
                  key={optIdx}
                  onClick={() => handleSelectOption(optIdx)}
                  disabled={isSubmitted}
                  className={`w-full text-left p-4 rounded-2xl border text-sm transition-all btn-motion flex items-center justify-between ${optionStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs bg-surface border border-border-subtle">
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span>{option}</span>
                  </div>

                  {isSubmitted && isCorrect && <CheckCircle className="w-4 h-4 text-status-success flex-shrink-0" />}
                  {isSubmitted && isWrongSelected && <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Explanation (when submitted) */}
          {isSubmitted && currentQ.explanation && (
            <div className="mt-4 p-4 rounded-2xl bg-surface-secondary/50 border border-border-subtle text-xs space-y-1">
              <div className="font-bold text-text-primary">Giải thích chi tiết:</div>
              <p className="text-text-secondary leading-relaxed">{currentQ.explanation}</p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-4 border-t border-border-subtle">
            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 rounded-xl border border-border-subtle text-xs font-bold text-text-secondary disabled:opacity-30 hover:bg-surface-secondary flex items-center gap-1.5 btn-motion"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Câu trước</span>
            </button>

            <span className="text-xs text-text-muted font-medium">
              {currentQuestionIndex + 1} / {questions.length}
            </span>

            <button
              onClick={() => setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))}
              disabled={currentQuestionIndex === questions.length - 1}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold disabled:opacity-30 hover:bg-primary-hover flex items-center gap-1.5 btn-motion shadow-xs"
            >
              <span>Câu tiếp</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Question Navigator Palette */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-5 shadow-sm space-y-3 card-motion">
        <div className="flex items-center justify-between pb-2 border-b border-divider-line">
          <span className="text-xs font-bold text-text-primary">Bảng câu hỏi ({questions.length} câu)</span>
          {isSubmitted && (
            <span className="text-xs font-bold text-primary">
              Điểm: {scaledScore}/{currentConfig.maxScore} ({scorePercent}%)
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
          {questions.map((q, idx) => {
            const isAnswered = typeof userAnswers[idx] === 'number';
            const isCurrent = currentQuestionIndex === idx;
            let btnStyle = 'bg-surface-secondary text-text-secondary border-border-subtle';

            if (isSubmitted) {
              const isCorrect = userAnswers[idx] === q.correctAnswer;
              btnStyle = isCorrect
                ? 'bg-status-success text-white border-transparent'
                : 'bg-red-500 text-white border-transparent';
            } else if (isAnswered) {
              btnStyle = 'bg-primary-soft text-primary border-primary';
            }

            return (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-8 h-8 rounded-xl border text-xs font-bold transition-all btn-motion ${btnStyle} ${
                  isCurrent ? 'ring-2 ring-primary ring-offset-2' : ''
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-surface rounded-3xl p-6 sm:p-8 max-w-sm w-full border border-border-subtle shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Xác nhận nộp bài?</h3>
              <p className="text-xs text-text-secondary mt-1">
                Bạn đã hoàn thành {Object.keys(userAnswers).length}/{questions.length} câu hỏi.
                Hệ thống sẽ chấm điểm và phân tích kết quả bài làm theo thang điểm {currentConfig.maxScore}.
              </p>
            </div>
            <div className="flex gap-2.5 justify-center">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-border-subtle text-xs font-semibold text-text-secondary hover:bg-surface-secondary"
              >
                Làm tiếp
              </button>
              <button
                onClick={handleManualSubmit}
                className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-coral-hover shadow-xs"
              >
                Nộp bài ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
