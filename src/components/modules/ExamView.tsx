import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Award,
  Timer,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Volume2,
  Flag,
  FileCheck2,
  History,
  Bot,
  Loader2,
} from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import {
  examRepository,
  HskExamVersion,
  ExamQuestion,
  ExamAttemptRecord,
} from '../../data/repositories/examRepository';
import { audioManager } from '../../services/audio/audioManager';
import { aiApiService } from '../../services/ai/aiApiService';
import { learningProgressService } from '../../services/progress/learningProgressService';

export const ExamView: React.FC = () => {
  const { showToast } = useToast();

  // Version & Level State
  const [examVersion, setExamVersion] = useState<HskExamVersion>('hsk3');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [aiExplainingId, setAiExplainingId] = useState<number | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<number, any>>({});

  // Exam Lifecycle State
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExamStarted, setIsExamStarted] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(2400); // in seconds
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [pastAttempts, setPastAttempts] = useState<ExamAttemptRecord[]>([]);
  const [hasSavedSession, setHasSavedSession] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  // Template configuration for active version & level
  const currentTemplate = useMemo(() => {
    return examRepository.getTemplate(examVersion, selectedLevel);
  }, [examVersion, selectedLevel]);

  const paperMeta = useMemo(() => {
    return examRepository.getPaperMetadata(examVersion, selectedLevel);
  }, [examVersion, selectedLevel]);

  const handleAskAiExplanation = async (
    q: ExamQuestion,
    userChoice: number | undefined,
    isCorrect: boolean
  ) => {
    if (aiExplainingId === q.id) return;
    setAiExplainingId(q.id);
    try {
      const exp = await aiApiService.explainExamQuestion({
        question: q,
        userAnswer: userChoice,
        isCorrect,
      });
      setAiExplanations((prev) => ({ ...prev, [q.id]: exp }));
      showToast('Gia sư AI đã phân tích xong câu hỏi!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Không thể lấy phân tích AI cho câu này', 'warning');
    } finally {
      setAiExplainingId(null);
    }
  };

  // Load questions and check saved session
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    examRepository.getQuestions(examVersion, selectedLevel).then((data) => {
      if (active) {
        setQuestions(data);
        setIsLoading(false);
      }
    });

    const saved = examRepository.loadActiveSession(examVersion, selectedLevel);
    setHasSavedSession(Boolean(saved && saved.timeLeft > 0));

    examRepository.getAttempts(examVersion, selectedLevel).then((attempts) => {
      if (active) {
        setPastAttempts(attempts);
      }
    });

    return () => {
      active = false;
    };
  }, [examVersion, selectedLevel]);

  // Autosave session to localStorage
  useEffect(() => {
    if (isExamStarted && !isSubmitted && questions.length > 0) {
      examRepository.saveActiveSession({
        version: examVersion,
        level: selectedLevel,
        startedAt: Date.now(),
        durationSeconds: currentTemplate.durationMinutes * 60,
        timeLeft,
        currentQuestionIndex,
        answers: userAnswers,
        flaggedQuestionIds: Array.from(flaggedQuestions),
      });
    }
  }, [isExamStarted, isSubmitted, timeLeft, currentQuestionIndex, userAnswers, flaggedQuestions]);

  // Countdown timer
  useEffect(() => {
    if (isExamStarted && !isSubmitted && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinalSubmit(true);
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

  // Format MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Fresh Exam
  const handleStartExam = () => {
    if (questions.length === 0) {
      showToast('Đang tải dữ liệu bài thi, vui lòng đợi...', 'warning');
      return;
    }
    examRepository.clearActiveSession(examVersion, selectedLevel);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setCurrentQuestionIndex(0);
    setTimeLeft(currentTemplate.durationMinutes * 60);
    setIsExamStarted(true);
    setIsSubmitted(false);
    showToast(`Bắt đầu bài thi ${currentTemplate.titleVi}`, 'info');
  };

  // Resume Autosaved Session
  const handleResumeSavedSession = () => {
    const saved = examRepository.loadActiveSession(examVersion, selectedLevel);
    if (!saved) return;

    setUserAnswers(saved.answers || {});
    setFlaggedQuestions(new Set(saved.flaggedQuestionIds || []));
    setCurrentQuestionIndex(saved.currentQuestionIndex || 0);
    setTimeLeft(saved.timeLeft || currentTemplate.durationMinutes * 60);
    setIsExamStarted(true);
    setIsSubmitted(false);
    showToast('Đã khôi phục phiên làm bài gần nhất', 'success');
  };

  // Audio Playback for Listening questions
  const handlePlayAudio = (text: string, qId: number) => {
    setSpeakingId(qId);
    audioManager.playText(text, {
      id: `exam_audio_${qId}`,
      entityType: 'sentence',
      lang: 'zh-CN',
      rate: 0.85,
    });
    setTimeout(() => setSpeakingId(null), 2500);
  };

  // Select Option
  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted || !currentQuestion) return;
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  // Toggle Flag Question
  const handleToggleFlag = (qId: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // Calculate Deterministic Score
  const examResults = useMemo(() => {
    if (questions.length === 0) {
      return { totalScore: 0, percentage: 0, passed: false, sectionScores: {} as any };
    }

    let correctCount = 0;
    const sectionCorrect: Record<string, number> = {
      listening: 0,
      reading: 0,
      writing: 0,
    };
    const sectionTotals: Record<string, number> = {
      listening: 0,
      reading: 0,
      writing: 0,
    };

    questions.forEach((q) => {
      const sec = q.section || 'reading';
      sectionTotals[sec] = (sectionTotals[sec] || 0) + 1;
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount += 1;
        sectionCorrect[sec] = (sectionCorrect[sec] || 0) + 1;
      }
    });

    const percentage = Math.round((correctCount / questions.length) * 100);
    const calculatedScore = Math.round((correctCount / questions.length) * currentTemplate.maxScore);
    const passed = calculatedScore >= currentTemplate.passingScore;

    return {
      correctCount,
      totalQuestions: questions.length,
      totalScore: calculatedScore,
      percentage,
      passed,
      sectionScores: {
        listening: Math.round(
          ((sectionCorrect.listening || 0) / (sectionTotals.listening || 1)) * 100
        ),
        reading: Math.round(
          ((sectionCorrect.reading || 0) / (sectionTotals.reading || 1)) * 100
        ),
        writing: Math.round(
          ((sectionCorrect.writing || 0) / (sectionTotals.writing || 1)) * 100
        ),
      },
    };
  }, [questions, userAnswers, currentTemplate]);

  // Submit Exam
  const handleFinalSubmit = (auto: boolean = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitted(true);
    setShowSubmitModal(false);

    const timeSpent = currentTemplate.durationMinutes * 60 - timeLeft;

    void examRepository.saveAttempt({
      hskVersion: examVersion,
      hskLevel: selectedLevel,
      score: examResults.totalScore,
      totalQuestions: questions.length,
      timeSpentSeconds: timeSpent,
      answers: userAnswers,
      passed: examResults.passed,
    });

    void learningProgressService.recordQualifyingActivity({
      activityType: 'exam_attempt',
      entityId: `exam_${examVersion}_lvl${selectedLevel}`,
      score: examResults.totalScore,
      durationSeconds: timeSpent,
    });

    examRepository.getAttempts(examVersion, selectedLevel).then(setPastAttempts);

    if (auto) {
      showToast('Hết thời gian! Hệ thống đã tự động nộp bài.', 'warning');
    } else {
      showToast('Đã nộp bài thi thành công!', 'success');
    }
  };

  const currentQuestion = questions[currentQuestionIndex];
  const answeredCount = Object.keys(userAnswers).length;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner & Version Toggle */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-5 card-motion light-beam-shimmer">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                Hệ thống Thi Thử HSK 3.0 & 2.0 Chuẩn Quốc Tế
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Mô phỏng chân thực đề thi HSK chính quy, đồng hồ đếm ngược, tự động lưu tiến trình và phân tích đáp án chi tiết.
              </p>
            </div>
          </div>

          {/* Version Switcher */}
          {!isExamStarted && (
            <div className="flex p-1 bg-surface-secondary rounded-xl border border-border-subtle text-xs font-bold shrink-0 self-start md:self-auto">
              <button
                onClick={() => {
                  setExamVersion('hsk3');
                  setSelectedLevel(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  examVersion === 'hsk3'
                    ? 'bg-secondary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                HSK 3.0 (Cấp 1–9)
              </button>
              <button
                onClick={() => {
                  setExamVersion('hsk2');
                  setSelectedLevel(1);
                }}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  examVersion === 'hsk2'
                    ? 'bg-secondary text-white shadow-xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                HSK 2.0 (Cấp 1–6)
              </button>
            </div>
          )}
        </div>

        {/* Level Selector Pills */}
        {!isExamStarted && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-divider-line">
            <span className="text-2xs font-bold text-text-muted uppercase tracking-wider mr-1">
              Cấp độ thi:
            </span>
            {[1, 2, 3, 4, 5, 6].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all btn-motion ${
                  selectedLevel === lvl
                    ? 'bg-secondary text-white shadow-2xs'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                Cấp {lvl}
              </button>
            ))}

            {examVersion === 'hsk3' && (
              <button
                onClick={() => setSelectedLevel(7)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all btn-motion ${
                  selectedLevel === 7
                    ? 'bg-secondary text-white shadow-2xs'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                Cấp cao 7–9
              </button>
            )}
          </div>
        )}

        {/* Verified Paper Source Metadata Card */}
        {paperMeta && !isExamStarted && (
          <div className="p-3.5 rounded-xl bg-surface-secondary/60 border border-border-subtle text-2xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-status-success shrink-0" />
              <div>
                <span className="font-bold text-text-primary mr-1.5">{paperMeta.titleZh}</span>
                <span className="text-text-secondary">({paperMeta.titleVi})</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-text-muted">
              <span className="px-2 py-0.5 rounded bg-surface border border-border-subtle font-mono text-2xs font-semibold">
                Mã đề: {paperMeta.sourceId}
              </span>
              <span>{paperMeta.syllabusStandard}</span>
              <span className="text-status-success font-semibold">Đã xác minh đáp án & audio</span>
            </div>
          </div>
        )}
      </div>

      {/* STATE 1: PRE-EXAM INSTRUCTION SCREEN */}
      {!isExamStarted && (
        <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-6 card-motion animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-divider-line pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-secondary-fixed text-secondary">
                  {currentTemplate.titleZh}
                </span>
                <span className="text-2xs text-text-muted">
                  {currentTemplate.syllabusStandard}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-text-primary mt-1">
                {currentTemplate.titleVi}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {hasSavedSession && (
                <button
                  onClick={handleResumeSavedSession}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-xs hover:bg-amber-600 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Tiếp tục bài thi trước</span>
                </button>
              )}
              <button
                onClick={handleStartExam}
                disabled={isLoading}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover active:scale-95 disabled:opacity-40 transition-all flex items-center gap-2"
              >
                <span>Bắt đầu bài thi</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section Breakdown Grid */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Cấu trúc các phần thi chính thức
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {currentTemplate.sections.map((sec) => (
                <div
                  key={sec.id}
                  className="p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-text-primary">{sec.title}</span>
                    <span className="text-2xs font-bold text-primary px-2 py-0.5 rounded bg-primary-soft">
                      {sec.maxScore} điểm
                    </span>
                  </div>
                  <div className="text-2xs text-text-secondary flex justify-between">
                    <span>Số câu: {sec.questionCount}</span>
                    <span>Thời gian: {sec.durationMinutes} phút</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rules & Requirements */}
          <div className="p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle space-y-2 text-xs text-text-secondary leading-relaxed">
            <h4 className="font-bold text-text-primary flex items-center gap-1.5">
              <FileCheck2 className="w-4 h-4 text-secondary" />
              Quy chế phòng thi YUYAN:
            </h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Tổng thời gian làm bài: <strong>{currentTemplate.durationMinutes} phút</strong>.</li>
              <li>Điểm đạt tiêu chuẩn: <strong>{currentTemplate.passingScore}/{currentTemplate.maxScore} điểm</strong>.</li>
              <li>Hệ thống tự động lưu bài làm mỗi khi chọn đáp án, bạn có thể tải lại trang mà không mất dữ liệu.</li>
              <li>Khi đồng hồ đếm ngược kết thúc, hệ thống sẽ tự động khóa và nộp bài.</li>
            </ul>
          </div>

          {/* Past Attempts History */}
          {pastAttempts.length > 0 && (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" />
                Lịch sử thi cấp độ này ({pastAttempts.length} lần gần nhất)
              </h3>
              <div className="space-y-2">
                {pastAttempts.slice(0, 3).map((att, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-surface-secondary/50 border border-border-subtle flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-text-primary">
                        Điểm số: {att.score}/{currentTemplate.maxScore}
                      </span>
                      <span className="text-2xs text-text-muted ml-3">
                        {att.createdAt ? new Date(att.createdAt).toLocaleDateString('vi-VN') : ''}
                      </span>
                    </div>
                    <span
                      className={`text-2xs font-bold px-2 py-0.5 rounded ${
                        att.passed
                          ? 'bg-status-success/15 text-status-success'
                          : 'bg-red-500/15 text-red-500'
                      }`}
                    >
                      {att.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* STATE 2: ACTIVE EXAM IN PROGRESS */}
      {isExamStarted && !isSubmitted && currentQuestion && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Question Card (8 cols) */}
          <div className="lg:col-span-8 bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-6 card-motion">
            {/* Top Bar: Progress + Timer + Flag */}
            <div className="flex items-center justify-between gap-3 border-b border-divider-line pb-4">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-primary-soft text-primary">
                  Câu {currentQuestionIndex + 1}/{questions.length}
                </span>
                <span className="text-2xs text-text-muted">
                  Phần: {currentQuestion.section === 'listening' ? 'Nghe hiểu' : currentQuestion.section === 'writing' ? 'Viết' : 'Đọc hiểu'}
                </span>
              </div>

              {/* Timer & Flag Buttons */}
              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold flex items-center gap-1.5 ${
                    timeLeft <= 300
                      ? 'bg-red-500/15 text-red-500 border-red-500 animate-pulse'
                      : 'bg-surface-secondary text-text-primary border-border-subtle'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>{formatTime(timeLeft)}</span>
                </div>

                <button
                  onClick={() => handleToggleFlag(currentQuestion.id)}
                  title="Đánh dấu xem lại"
                  className={`p-2 rounded-xl border text-xs transition-colors ${
                    flaggedQuestions.has(currentQuestion.id)
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-surface-secondary text-text-muted border-border-subtle hover:text-text-primary'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Question Text & Audio Button */}
            <div className="space-y-3">
              {currentQuestion.audioPrompt && (
                <div className="p-4 rounded-xl bg-primary-soft border border-primary/20 flex items-center justify-between gap-3">
                  <div className="text-xs text-primary font-medium">
                    Nhấn nghe phát âm giọng chuẩn Bắc Kinh:
                  </div>
                  <button
                    onClick={() =>
                      handlePlayAudio(currentQuestion.audioPrompt!, currentQuestion.id)
                    }
                    disabled={speakingId === currentQuestion.id}
                    className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover flex items-center gap-1.5 transition-all"
                  >
                    <Volume2 className="w-4 h-4" />
                    <span>Nghe audio</span>
                  </button>
                </div>
              )}

              <h3 className="text-base sm:text-lg font-bold text-text-primary leading-snug">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Options List */}
            <div className="space-y-2.5">
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = userAnswers[currentQuestion.id] === optIdx;
                return (
                  <div
                    key={optIdx}
                    onClick={() => handleSelectOption(optIdx)}
                    className={`p-4 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-primary-soft border-primary text-primary font-bold shadow-xs'
                        : 'bg-surface-secondary/40 border-border-subtle hover:bg-surface-secondary text-text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-2xs ${
                          isSelected
                            ? 'bg-primary text-white'
                            : 'bg-surface text-text-muted border border-border-subtle'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{opt}</span>
                    </div>
                    {isSelected && <CheckCircle className="w-4 h-4 text-primary shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Navigation Bottom Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-divider-line">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 rounded-xl bg-surface-secondary text-text-secondary hover:text-text-primary text-xs font-semibold disabled:opacity-30 transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Câu trước</span>
              </button>

              <button
                onClick={() => setShowSubmitModal(true)}
                className="px-5 py-2 rounded-xl bg-status-success text-white text-xs font-bold shadow-xs hover:bg-emerald-600 active:scale-95 transition-all"
              >
                Nộp bài thi ({answeredCount}/{questions.length})
              </button>

              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) =>
                    Math.min(questions.length - 1, prev + 1)
                  )
                }
                disabled={currentQuestionIndex === questions.length - 1}
                className="px-4 py-2 rounded-xl bg-surface-secondary text-text-secondary hover:text-text-primary text-xs font-semibold disabled:opacity-30 transition-colors flex items-center gap-1.5"
              >
                <span>Câu tiếp</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Right Question Palette (4 cols) */}
          <div className="lg:col-span-4 bg-surface rounded-2xl border border-border-subtle p-5 shadow-2xs space-y-4 card-motion flex flex-col h-[560px]">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                Bảng câu hỏi ({answeredCount}/{questions.length})
              </h4>
              <span className="text-2xs text-text-muted">Nhấn để chuyển</span>
            </div>

            {/* Questions Grid */}
            <div className="flex-1 overflow-y-auto grid grid-cols-5 gap-2 pr-1 custom-scrollbar">
              {questions.map((q, idx) => {
                const isAnswered = userAnswers[q.id] !== undefined;
                const isFlagged = flaggedQuestions.has(q.id);
                const isCurrent = currentQuestionIndex === idx;

                let btnClass = 'bg-surface-secondary text-text-muted border-border-subtle';
                if (isCurrent) {
                  btnClass = 'bg-primary text-white border-primary shadow-xs font-bold scale-105';
                } else if (isFlagged) {
                  btnClass = 'bg-amber-500 text-white border-amber-500 font-bold';
                } else if (isAnswered) {
                  btnClass = 'bg-primary-soft text-primary border-primary/30 font-bold';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`h-9 rounded-xl border text-xs font-medium transition-all ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-2 border-t border-divider-line grid grid-cols-2 gap-2 text-2xs text-text-muted">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-primary-soft border border-primary/30" />
                <span>Đã làm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-500" />
                <span>Đánh dấu</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-surface-secondary border border-border-subtle" />
                <span>Chưa làm</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-primary" />
                <span>Đang chọn</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATE 3: SUBMIT CONFIRMATION MODAL */}
      {showSubmitModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface rounded-2xl border border-border-subtle p-6 max-w-md w-full shadow-xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-text-primary">Xác nhận nộp bài thi?</h3>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed">
              Bạn đã hoàn thành <strong>{answeredCount}</strong> trên tổng số{' '}
              <strong>{questions.length}</strong> câu hỏi. Thời gian làm bài còn{' '}
              <strong>{formatTime(timeLeft)}</strong>.
            </p>
            {answeredCount < questions.length && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-2xs text-amber-700 dark:text-amber-300">
                Chú ý: Bạn còn {questions.length - answeredCount} câu chưa trả lời. Những câu chưa làm sẽ không được tính điểm.
              </div>
            )}
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="px-4 py-2 rounded-xl bg-surface-secondary text-text-secondary hover:text-text-primary text-xs font-semibold"
              >
                Tiếp tục làm bài
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                className="px-4 py-2 rounded-xl bg-status-success text-white text-xs font-bold hover:bg-emerald-600 transition-colors"
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STATE 4: POST-EXAM RESULTS & COMPREHENSIVE ERROR ANALYSIS */}
      {isSubmitted && (
        <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-6 card-motion animate-in fade-in duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-divider-line pb-6">
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold shadow-2xs shrink-0 ${
                  examResults.passed
                    ? 'bg-status-success/15 text-status-success'
                    : 'bg-red-500/15 text-red-500'
                }`}
              >
                <Award className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-2xs font-bold px-2 py-0.5 rounded ${
                      examResults.passed
                        ? 'bg-status-success/15 text-status-success'
                        : 'bg-red-500/15 text-red-500'
                    }`}
                  >
                    {examResults.passed ? 'ĐẠT TIÊU CHUẨN' : 'CHƯA ĐẠT'}
                  </span>
                  <span className="text-2xs text-text-muted">
                    {currentTemplate.titleVi}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-text-primary mt-1">
                  Kết quả: {examResults.totalScore} / {currentTemplate.maxScore} Điểm
                </h2>
              </div>
            </div>

            <button
              onClick={handleStartExam}
              className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover transition-colors flex items-center gap-2 self-start sm:self-auto"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thi lại lần nữa</span>
            </button>
          </div>

          {/* Section Scores Card Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle">
              <div className="text-2xs text-text-muted">Phần Nghe hiểu</div>
              <div className="text-base font-bold text-text-primary mt-1">
                {examResults.sectionScores.listening}% chuẩn xác
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle">
              <div className="text-2xs text-text-muted">Phần Đọc hiểu</div>
              <div className="text-base font-bold text-text-primary mt-1">
                {examResults.sectionScores.reading}% chuẩn xác
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle">
              <div className="text-2xs text-text-muted">Tổng tỷ lệ đúng</div>
              <div className="text-base font-bold text-text-primary mt-1">
                {examResults.correctCount} / {questions.length} câu ({examResults.percentage}%)
              </div>
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Phân tích chi tiết từng câu hỏi & Lời giải sư phạm
            </h3>

            <div className="space-y-3">
              {questions.map((q, idx) => {
                const userChoice = userAnswers[q.id];
                const isCorrect = userChoice === q.correctAnswer;

                return (
                  <div
                    key={q.id}
                    className={`p-4 sm:p-5 rounded-2xl border text-xs space-y-3 ${
                      isCorrect
                        ? 'bg-surface-secondary/30 border-border-subtle'
                        : 'bg-red-500/5 border-red-500/20'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xs font-bold px-2 py-0.5 rounded bg-surface border border-border-subtle">
                        Câu {idx + 1} ({q.section === 'listening' ? 'Nghe' : 'Đọc'})
                      </span>
                      <span
                        className={`text-2xs font-bold px-2 py-0.5 rounded ${
                          isCorrect
                            ? 'bg-status-success/15 text-status-success'
                            : 'bg-red-500/15 text-red-500'
                        }`}
                      >
                        {isCorrect ? 'Chính xác' : userChoice === undefined ? 'Chưa làm' : 'Sai'}
                      </span>
                    </div>

                    <h4 className="font-bold text-text-primary leading-snug">{q.question}</h4>

                    {/* Options list showing user vs correct */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => {
                        let optStyle = 'bg-surface border-border-subtle text-text-secondary';
                        if (oIdx === q.correctAnswer) {
                          optStyle =
                            'bg-status-success/15 border-status-success text-status-success font-bold';
                        } else if (oIdx === userChoice && !isCorrect) {
                          optStyle = 'bg-red-500/15 border-red-500 text-red-500 font-bold line-through';
                        }

                        return (
                          <div
                            key={oIdx}
                            className={`p-2.5 rounded-xl border text-2xs flex items-center gap-2 ${optStyle}`}
                          >
                            <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                            <span>{opt}</span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Pedagogical Explanation */}
                    <div className="p-3 rounded-xl bg-surface-secondary/70 border border-border-subtle text-2xs text-text-secondary leading-relaxed">
                      <strong className="text-text-primary">Lời giải thích gốc: </strong>
                      {q.explanation}
                    </div>

                    {/* AI Explanation Action & Result Card */}
                    <div className="pt-1">
                      {aiExplanations[q.id] ? (
                        <div className="p-3.5 rounded-xl bg-primary-soft/40 border border-primary/20 text-2xs space-y-2 animate-in fade-in duration-150">
                          <div className="flex items-center gap-1.5 font-bold text-primary">
                            <Bot className="w-3.5 h-3.5" />
                            <span>Gia sư AI Khảo thí YUYAN (Phân tích bổ trợ):</span>
                          </div>
                          <p className="text-text-primary leading-relaxed">
                            {aiExplanations[q.id].explanation}
                          </p>
                          {aiExplanations[q.id].distractorAnalysis && (
                            <div className="text-text-secondary">
                              <strong>Phân tích phương án sai: </strong>
                              {aiExplanations[q.id].distractorAnalysis}
                            </div>
                          )}
                          {aiExplanations[q.id].grammarRule && (
                            <div className="text-text-secondary">
                              <strong>Điểm ngữ pháp mấu chốt: </strong>
                              {aiExplanations[q.id].grammarRule}
                            </div>
                          )}
                          {aiExplanations[q.id].examTip && (
                            <div className="text-amber-700 dark:text-amber-300 font-medium bg-amber-500/10 p-2 rounded-lg">
                              <strong>Mẹo làm bài thi: </strong>
                              {aiExplanations[q.id].examTip}
                            </div>
                          )}
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAskAiExplanation(q, userChoice, isCorrect)}
                          disabled={aiExplainingId === q.id}
                          className="px-3 py-1.5 rounded-xl bg-surface border border-border-subtle hover:border-primary/40 hover:bg-primary-soft text-text-secondary hover:text-primary text-2xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs"
                        >
                          {aiExplainingId === q.id ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin text-primary" />
                              <span>Gia sư AI đang phân tích...</span>
                            </>
                          ) : (
                            <>
                              <Bot className="w-3 h-3 text-primary" />
                              <span>Hỏi Gia sư AI phân tích sâu câu này</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
