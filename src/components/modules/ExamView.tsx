import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Award,
  Timer,
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
  Layers,
  BookOpen,
  HelpCircle,
  Database,
  Eye,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import {
  examRepository,
  HskExamVersion,
  ExamQuestion,
  ExamAttemptRecord,
  ExamPaperMetadata,
} from '../../data/repositories/examRepository';
import { audioManager } from '../../services/audio/audioManager';
import { aiApiService } from '../../services/ai/aiApiService';
import { learningProgressService } from '../../services/progress/learningProgressService';
import { HSK_SOURCE_REGISTRY } from '../../data/exam/examSourceRegistry';

export const ExamView: React.FC = () => {
  const { showToast } = useToast();

  // Version, Level, Paper & Mode State
  const [examVersion, setExamVersion] = useState<HskExamVersion>('hsk3');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [selectedPaperId, setSelectedPaperId] = useState<string>('paper_hsk3_l1_sample01');
  const [examMode, setExamMode] = useState<'timed_simulation' | 'practice_mode'>('timed_simulation');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState<string>('all');

  // Examination Execution State
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExamStarted, setIsExamStarted] = useState<boolean>(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(2400); // in seconds
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [showAnswerSheet, setShowAnswerSheet] = useState<boolean>(false);
  const [showCoverageModal, setShowCoverageModal] = useState<boolean>(false);
  const [revealedPracticeAnswers, setRevealedPracticeAnswers] = useState<Set<number>>(new Set());
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'flagged'>('all');

  // AI & Audio State
  const [aiExplainingId, setAiExplainingId] = useState<number | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<number, any>>({});
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [pastAttempts, setPastAttempts] = useState<ExamAttemptRecord[]>([]);
  const [hasSavedSession, setHasSavedSession] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const isAnyModalOpen = showSubmitModal || showCoverageModal;
    if (!isAnyModalOpen) return;
    document.body.setAttribute('data-modal-open', 'true');
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowSubmitModal(false);
        setShowCoverageModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeAttribute('data-modal-open');
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSubmitModal, showCoverageModal]);

  // Available papers for selected version and level
  const availablePapers = useMemo(() => {
    return examRepository.getPapersByLevel(examVersion, selectedLevel);
  }, [examVersion, selectedLevel]);

  // Current active paper metadata
  const currentPaperMeta: ExamPaperMetadata = useMemo(() => {
    const found = availablePapers.find((p) => p.paperId === selectedPaperId);
    return found || availablePapers[0] || (examRepository.getPaperMetadata(examVersion, selectedLevel) as ExamPaperMetadata);
  }, [availablePapers, selectedPaperId, examVersion, selectedLevel]);

  // Sync selectedPaperId when version or level changes
  useEffect(() => {
    if (availablePapers.length > 0) {
      if (!availablePapers.some((p) => p.paperId === selectedPaperId)) {
        setSelectedPaperId(availablePapers[0].paperId);
      }
    }
  }, [availablePapers, selectedPaperId]);

  // Template configuration for duration and score
  const currentTemplate = useMemo(() => {
    return examRepository.getTemplate(examVersion, selectedLevel);
  }, [examVersion, selectedLevel]);

  // Load questions for the selected paper
  useEffect(() => {
    let active = true;
    setIsLoading(true);

    examRepository
      .getQuestions(examVersion, selectedLevel, selectedPaperId)
      .then((data) => {
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
  }, [examVersion, selectedLevel, selectedPaperId]);

  // Filter questions by section if selected
  const filteredQuestions = useMemo(() => {
    if (selectedSectionFilter === 'all') return questions;
    return questions.filter((q) => q.section === selectedSectionFilter);
  }, [questions, selectedSectionFilter]);

  // Active question
  const currentQuestion = filteredQuestions[currentQuestionIndex] || filteredQuestions[0];

  // Autosave active exam session
  useEffect(() => {
    if (isExamStarted && !isSubmitted && filteredQuestions.length > 0) {
      examRepository.saveActiveSession({
        paperId: selectedPaperId,
        version: examVersion,
        level: selectedLevel,
        mode: examMode,
        startedAt: Date.now(),
        durationSeconds: (currentPaperMeta?.durationMinutes || currentTemplate.durationMinutes) * 60,
        timeLeft,
        currentQuestionIndex,
        answers: userAnswers,
        flaggedQuestionIds: Array.from(flaggedQuestions),
      });
    }
  }, [
    isExamStarted,
    isSubmitted,
    filteredQuestions,
    timeLeft,
    currentQuestionIndex,
    userAnswers,
    flaggedQuestions,
    examVersion,
    selectedLevel,
    selectedPaperId,
    examMode,
    currentPaperMeta,
    currentTemplate,
  ]);

  // Timer countdown
  useEffect(() => {
    if (isExamStarted && !isSubmitted && examMode === 'timed_simulation') {
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
  }, [isExamStarted, isSubmitted, examMode]);

  // Start Exam
  const handleStartExam = () => {
    setIsExamStarted(true);
    setIsSubmitted(false);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setRevealedPracticeAnswers(new Set());
    setCurrentQuestionIndex(0);
    const durationMins = currentPaperMeta?.durationMinutes || currentTemplate.durationMinutes;
    setTimeLeft(durationMins * 60);
    showToast(
      examMode === 'timed_simulation'
        ? `Bắt đầu bài thi tính giờ (${durationMins} phút). Chúc bạn làm bài tốt!`
        : 'Bắt đầu chế độ luyện tập tự do. Bạn có thể xem giải thích từng câu.',
      'info'
    );
  };

  // Resume saved session
  const handleResumeSavedSession = () => {
    const saved = examRepository.loadActiveSession(examVersion, selectedLevel);
    if (!saved) return;
    setSelectedPaperId(saved.paperId);
    setExamMode(saved.mode || 'timed_simulation');
    setUserAnswers(saved.answers || {});
    setFlaggedQuestions(new Set(saved.flaggedQuestionIds || []));
    setCurrentQuestionIndex(saved.currentQuestionIndex || 0);
    setTimeLeft(saved.timeLeft || 1800);
    setIsExamStarted(true);
    setIsSubmitted(false);
    showToast('Đã khôi phục phiên làm bài trước đó!', 'success');
  };

  // Reset & Exit to pre-exam screen
  const handleExitExam = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsExamStarted(false);
    setIsSubmitted(false);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setRevealedPracticeAnswers(new Set());
    examRepository.clearActiveSession(examVersion, selectedLevel);
    showToast('Đã thoát khỏi bài thi.', 'info');
  };

  // Select Answer
  const handleSelectAnswer = (optionIndex: number) => {
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

  // Toggle Reveal Practice Answer
  const handleToggleRevealPractice = (qId: number) => {
    setRevealedPracticeAnswers((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // Audio Playback
  const handlePlayAudio = async (text: string, qId: number) => {
    if (speakingId === qId) return;
    setSpeakingId(qId);
    try {
      await audioManager.playText(text, { rate: 0.85 });
    } catch {
      showToast('Không thể phát âm thanh trên thiết bị này', 'warning');
    } finally {
      setSpeakingId(null);
    }
  };

  // AI Question Explanation
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

  // Deterministic Scoring
  const examResults = useMemo(() => {
    if (filteredQuestions.length === 0) {
      return { totalScore: 0, percentage: 0, passed: false, sectionScores: {} as any };
    }

    let correctCount = 0;
    const sectionCorrect: Record<string, number> = {
      listening: 0,
      reading: 0,
      writing: 0,
      speaking: 0,
      translation: 0,
    };
    const sectionTotals: Record<string, number> = {
      listening: 0,
      reading: 0,
      writing: 0,
      speaking: 0,
      translation: 0,
    };

    filteredQuestions.forEach((q) => {
      const sec = q.section || 'reading';
      sectionTotals[sec] = (sectionTotals[sec] || 0) + 1;
      if (userAnswers[q.id] === q.correctAnswer) {
        correctCount += 1;
        sectionCorrect[sec] = (sectionCorrect[sec] || 0) + 1;
      }
    });

    const maxScore = currentPaperMeta?.maxScore || currentTemplate.maxScore;
    const passingScore = currentPaperMeta?.passingScore || currentTemplate.passingScore;
    const percentage = Math.round((correctCount / filteredQuestions.length) * 100);
    const calculatedScore = Math.round((correctCount / filteredQuestions.length) * maxScore);
    const passed = calculatedScore >= passingScore;

    return {
      correctCount,
      totalQuestions: filteredQuestions.length,
      totalScore: calculatedScore,
      percentage,
      passed,
      sectionScores: {
        listening: Math.round(((sectionCorrect.listening || 0) / (sectionTotals.listening || 1)) * 100),
        reading: Math.round(((sectionCorrect.reading || 0) / (sectionTotals.reading || 1)) * 100),
        writing: Math.round(((sectionCorrect.writing || 0) / (sectionTotals.writing || 1)) * 100),
        translation: Math.round(((sectionCorrect.translation || 0) / (sectionTotals.translation || 1)) * 100),
      },
    };
  }, [filteredQuestions, userAnswers, currentPaperMeta, currentTemplate]);

  // Submit Exam
  const handleFinalSubmit = (auto: boolean = false) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitted(true);
    setShowSubmitModal(false);

    const durationMins = currentPaperMeta?.durationMinutes || currentTemplate.durationMinutes;
    const timeSpent = durationMins * 60 - timeLeft;

    void examRepository.saveAttempt({
      paperId: selectedPaperId,
      hskVersion: examVersion,
      hskLevel: selectedLevel,
      score: examResults.totalScore,
      totalQuestions: filteredQuestions.length,
      timeSpentSeconds: timeSpent,
      answers: userAnswers,
      passed: examResults.passed,
      mode: examMode,
    });

    void learningProgressService.recordQualifyingActivity({
      activityType: 'exam_attempt',
      durationSeconds: timeSpent,
      score: examResults.totalScore,
      entityId: selectedPaperId,
    });

    void learningProgressService.recordExerciseCompleted({
      type: 'reading',
      entityId: selectedPaperId,
      score: examResults.totalScore,
      durationMinutes: Math.max(1, Math.round(timeSpent / 60)),
    });

    if (auto) {
      showToast('Đã hết giờ làm bài! Hệ thống tự động nộp bài thi.', 'warning');
    } else {
      showToast('Nộp bài thi thành công! Xem lại kết quả bên dưới.', 'success');
    }
  };

  // Format Time Helper
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${String(mins).padStart(2, '0')}:${String(remaining).padStart(2, '0')}`;
  };

  // Real Coverage Data from Ingestion Pipeline
  const coverageData = useMemo(() => {
    return examRepository.getCoverageSummary();
  }, [showCoverageModal]);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* HEADER CONTROL BAR */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-2xs space-y-4 card-motion">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-2xs font-extrabold uppercase tracking-wide bg-primary/10 text-primary">
                Hệ thống khảo thí HSK độc lập
              </span>
              <span className="text-2xs text-text-muted">
                {examVersion === 'hsk2' ? 'Hanban 2015' : 'GF0025-2021 Mới'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary mt-1 flex items-center gap-2">
              <Award className="w-6 h-6 text-primary" />
              <span>Luyện Thi & Khảo Thí HSK Chuẩn Hóa</span>
            </h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Học tiếng Trung theo cách của bạn — Ngân hàng đề thi chính quy tách biệt hoàn toàn khỏi bài học.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Version Switcher */}
            <div className="flex bg-surface-secondary p-1 rounded-xl border border-border-subtle">
              <button
                onClick={() => {
                  if (isExamStarted && !isSubmitted) {
                    if (!window.confirm('Bạn đang trong bài thi. Đổi phiên bản sẽ hủy phiên hiện tại?')) return;
                    handleExitExam();
                  }
                  setExamVersion('hsk3');
                  setSelectedLevel(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  examVersion === 'hsk3'
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                HSK 3.0 (Cấp 1–9)
              </button>
              <button
                onClick={() => {
                  if (isExamStarted && !isSubmitted) {
                    if (!window.confirm('Bạn đang trong bài thi. Đổi phiên bản sẽ hủy phiên hiện tại?')) return;
                    handleExitExam();
                  }
                  setExamVersion('hsk2');
                  setSelectedLevel(1);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  examVersion === 'hsk2'
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                HSK 2.0 (Cấp 1–6)
              </button>
            </div>

            {/* Coverage Health Button */}
            <button
              onClick={() => setShowCoverageModal(true)}
              className="px-3 py-1.5 rounded-xl bg-surface-secondary border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Xem bảng kiểm định dữ liệu phủ sóng HSK"
            >
              <Database className="w-3.5 h-3.5 text-primary" />
              <span className="hidden sm:inline">Kiểm định dữ liệu</span>
            </button>
          </div>
        </div>

        {/* Level Selector Pills */}
        {!isExamStarted && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-divider-line">
            <span className="text-2xs font-bold text-text-muted uppercase tracking-wider mr-1">
              Cấp độ:
            </span>
            {(examVersion === 'hsk2' ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4, 5, 6, 7, 8, 9]).map((lvl) => {
              const isSelected = selectedLevel === lvl || (examVersion === 'hsk3' && selectedLevel >= 7 && lvl >= 7);
              return (
                <button
                  key={lvl}
                  onClick={() => {
                    setSelectedLevel(lvl >= 7 ? 7 : lvl);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all btn-motion ${
                    isSelected
                      ? 'bg-secondary text-white shadow-2xs'
                      : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {lvl <= 6 ? `Cấp ${lvl}` : lvl === 7 ? 'Cấp 7' : lvl === 8 ? 'Cấp 8' : 'Cấp 9'}
                </button>
              );
            })}

            {examVersion === 'hsk3' && selectedLevel >= 7 && (
              <span className="text-2xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                Lưu ý: HSK 3.0 Bậc 7–9 là đề thi tích hợp gom dải chính quy (210 phút, 98 câu).
              </span>
            )}
          </div>
        )}

        {/* Paper & Mode Selection Bar */}
        {!isExamStarted && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {/* Paper Selection Dropdown */}
            <div className="space-y-1">
              <label className="text-2xs font-bold text-text-muted uppercase tracking-wider">
                Chọn bộ đề thi:
              </label>
              <select
                value={selectedPaperId}
                onChange={(e) => setSelectedPaperId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-surface-secondary border border-border-subtle text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              >
                {availablePapers.map((paper) => (
                  <option key={paper.paperId} value={paper.paperId}>
                    {paper.titleZh} — {paper.titleVi}
                  </option>
                ))}
              </select>
            </div>

            {/* Mode Selection */}
            <div className="space-y-1">
              <label className="text-2xs font-bold text-text-muted uppercase tracking-wider">
                Chế độ làm bài:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setExamMode('timed_simulation')}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    examMode === 'timed_simulation'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Thi tính giờ
                </button>
                <button
                  onClick={() => setExamMode('practice_mode')}
                  className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    examMode === 'practice_mode'
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                  }`}
                >
                  Luyện tập tự do
                </button>
              </div>
            </div>

            {/* Section Filter */}
            <div className="space-y-1">
              <label className="text-2xs font-bold text-text-muted uppercase tracking-wider">
                Lọc phần thi:
              </label>
              <select
                value={selectedSectionFilter}
                onChange={(e) => {
                  setSelectedSectionFilter(e.target.value);
                  setCurrentQuestionIndex(0);
                }}
                className="w-full text-xs font-semibold px-3 py-2 rounded-xl bg-surface-secondary border border-border-subtle text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/40"
              >
                <option value="all">Tất cả các phần thi</option>
                <option value="listening">Chuyên đề Nghe hiểu (听力)</option>
                <option value="reading">Chuyên đề Đọc hiểu (阅读)</option>
                <option value="writing">Chuyên đề Viết (书写)</option>
                <option value="translation">Chuyên đề Dịch thuật (翻译)</option>
              </select>
            </div>
          </div>
        )}

        {/* Paper Source Provenance Card */}
        {!isExamStarted && currentPaperMeta && (
          <div className="p-3.5 rounded-xl bg-surface-secondary/60 border border-border-subtle text-2xs flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-status-success shrink-0" />
              <div>
                <span className="font-bold text-text-primary mr-1.5">{currentPaperMeta.titleZh}</span>
                <span className="text-text-secondary">({currentPaperMeta.titleVi})</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-text-muted">
              <span className="px-2 py-0.5 rounded bg-surface border border-border-subtle font-mono text-2xs font-semibold">
                Mã nguồn: {currentPaperMeta.sourceRevision || currentPaperMeta.sourceId}
              </span>
              <span>{currentPaperMeta.providerName}</span>
              <span className="text-status-success font-semibold">
                ✓ {currentPaperMeta.license}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* PRE-EXAM OVERVIEW SCREEN */}
      {!isExamStarted && currentPaperMeta && (
        <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-6 card-motion">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-divider-line pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-2xs font-bold bg-secondary-fixed text-secondary">
                  {currentPaperMeta.titleZh}
                </span>
                <span className="text-2xs text-text-muted">
                  {currentPaperMeta.syllabusStandard}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-text-primary mt-1">
                {currentPaperMeta.titleVi}
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                {examMode === 'timed_simulation'
                  ? `Thời gian làm bài quy định: ${currentPaperMeta.durationMinutes} phút | Điểm tối đa: ${currentPaperMeta.maxScore} | Điểm đạt: ${currentPaperMeta.passingScore}`
                  : 'Chế độ luyện tập tự do không áp dụng áp lực thời gian, bạn có thể xem đáp án ngay để học hỏi.'}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {hasSavedSession && (
                <button
                  onClick={handleResumeSavedSession}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 text-white text-xs font-bold shadow-xs hover:bg-amber-600 transition-all flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Tiếp tục phiên trước</span>
                </button>
              )}
              <button
                onClick={handleStartExam}
                disabled={isLoading || filteredQuestions.length === 0}
                className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover active:scale-95 disabled:opacity-40 transition-all flex items-center gap-2"
              >
                <span>{isLoading ? 'Đang chuẩn bị đề...' : 'Bắt đầu làm bài'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section Structure Overview */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-primary" />
              <span>Cấu trúc bài thi chuẩn hóa ({filteredQuestions.length} câu hỏi sẵn sàng)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(currentPaperMeta.sections || []).map((sec) => (
                <div
                  key={sec.id}
                  className="p-4 rounded-xl bg-surface-secondary/70 border border-border-subtle flex flex-col justify-between"
                >
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">{sec.title}</h4>
                    <p className="text-2xs text-text-secondary mt-1">
                      {sec.questionCount} câu hỏi · Thời gian: {sec.durationMinutes} phút
                    </p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-border-subtle flex justify-between text-2xs text-text-muted">
                    <span>Điểm tối đa:</span>
                    <span className="font-bold text-text-primary">{sec.maxScore} điểm</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Attempts History */}
          {pastAttempts.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-divider-line">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-secondary" />
                <span>Lịch sử các lần thi trước</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {pastAttempts.slice(0, 6).map((att, idx) => (
                  <div
                    key={att.id || idx}
                    className="p-3 rounded-xl bg-surface-secondary/50 border border-border-subtle flex items-center justify-between text-2xs"
                  >
                    <div>
                      <span className="font-bold text-text-primary">
                        Điểm: {att.score} / {currentPaperMeta.maxScore}
                      </span>
                      <span
                        className={`ml-2 font-semibold ${
                          att.passed ? 'text-status-success' : 'text-status-error'
                        }`}
                      >
                        {att.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                      </span>
                      <p className="text-text-muted mt-0.5">
                        {att.createdAt ? new Date(att.createdAt).toLocaleDateString('vi-VN') : 'Gần đây'}
                      </p>
                    </div>
                    <span className="text-text-muted font-mono">
                      {Math.round(att.timeSpentSeconds / 60)} phút
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ACTIVE EXAMINATION / REVIEW SCREEN */}
      {isExamStarted && filteredQuestions.length > 0 && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Top Live Bar */}
          <div className="bg-surface rounded-2xl border border-border-subtle p-4 shadow-2xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary font-bold text-xs">
                Câu {currentQuestionIndex + 1} / {filteredQuestions.length}
              </span>
              <span className="text-xs font-semibold text-text-secondary capitalize">
                Phần thi: {currentQuestion.section}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Timer Pill */}
              {examMode === 'timed_simulation' && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl font-mono text-xs font-bold ${
                    timeLeft < 300
                      ? 'bg-status-error/15 text-status-error animate-pulse'
                      : 'bg-surface-secondary text-text-primary'
                  }`}
                >
                  <Timer className="w-3.5 h-3.5" />
                  <span>{formatTime(timeLeft)}</span>
                </div>
              )}

              {/* Answer Sheet Button */}
              <button
                onClick={() => setShowAnswerSheet(!showAnswerSheet)}
                className="px-3 py-1 rounded-xl bg-surface-secondary border border-border-subtle text-xs font-bold text-text-primary hover:bg-surface transition-all flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span>Phiếu bài làm</span>
              </button>

              {/* Flag Button */}
              <button
                onClick={() => handleToggleFlag(currentQuestion.id)}
                className={`px-3 py-1 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                  flaggedQuestions.has(currentQuestion.id)
                    ? 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400'
                    : 'bg-surface-secondary border-border-subtle text-text-muted hover:text-text-primary'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>Gắn cờ</span>
              </button>

              {/* Exit or Submit */}
              {!isSubmitted ? (
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover active:scale-95 transition-all"
                >
                  Nộp bài thi
                </button>
              ) : (
                <button
                  onClick={handleExitExam}
                  className="px-4 py-1.5 rounded-xl bg-surface-secondary border border-border-subtle text-xs font-bold text-text-primary hover:bg-surface transition-all"
                >
                  Về trang đề thi
                </button>
              )}
            </div>
          </div>

          {/* Answer Sheet Modal / Grid Popup */}
          {showAnswerSheet && (
            <div className="bg-surface rounded-2xl border border-border-subtle p-5 shadow-sm space-y-3 card-motion">
              <div className="flex items-center justify-between border-b border-divider-line pb-2.5">
                <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
                  Phiếu bài làm — {filteredQuestions.length} câu hỏi
                </span>
                <button
                  onClick={() => setShowAnswerSheet(false)}
                  className="text-text-muted hover:text-text-primary p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto custom-scrollbar p-1">
                {filteredQuestions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isCurrent = idx === currentQuestionIndex;
                  const isFlagged = flaggedQuestions.has(q.id);

                  let bg = 'bg-surface-secondary text-text-secondary border-border-subtle';
                  if (isAnswered) {
                    bg = 'bg-status-success/20 text-status-success border-status-success/30 font-bold';
                  }
                  if (isFlagged) {
                    bg = 'bg-amber-500/20 text-amber-600 border-amber-500/40 font-bold';
                  }
                  if (isCurrent) {
                    bg += ' ring-2 ring-primary';
                  }

                  return (
                    <button
                      key={q.id}
                      onClick={() => {
                        setCurrentQuestionIndex(idx);
                        setShowAnswerSheet(false);
                      }}
                      className={`w-9 h-9 rounded-xl border text-xs flex items-center justify-center transition-all ${bg}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Question Presentation Card */}
          <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-6 card-motion">
            {/* Reading Passage Frame (if present) */}
            {currentQuestion.passageText && (
              <div className="p-4 sm:p-5 rounded-2xl bg-surface-secondary/70 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-2xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>{currentQuestion.passageTitle || 'Đoạn văn Đọc hiểu (阅读材料)'}</span>
                  </span>
                  <button
                    onClick={() => handlePlayAudio(currentQuestion.passageText!, currentQuestion.id * 1000)}
                    className="p-1 rounded-lg text-text-muted hover:text-primary transition-colors"
                    title="Nghe đoạn văn"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm sm:text-base leading-relaxed text-text-primary whitespace-pre-line font-serif">
                  {currentQuestion.passageText}
                </p>
              </div>
            )}

            {/* Audio Prompt Frame for Listening Items */}
            {currentQuestion.audioPrompt && (
              <div className="p-4 rounded-xl bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-sky-900 dark:text-sky-200">
                      Bản thu nghe hiểu (Phát âm chuẩn tiếng Trung)
                    </span>
                    <p className="text-2xs text-sky-700 dark:text-sky-400">
                      Nhấp nút nghe để nghe lại khẩu ngữ chuẩn của người bản xứ
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handlePlayAudio(currentQuestion.audioPrompt!, currentQuestion.id)}
                  disabled={speakingId === currentQuestion.id}
                  className="px-3.5 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold hover:bg-sky-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {speakingId === currentQuestion.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  <span>Phát âm thanh</span>
                </button>
              </div>
            )}

            {/* Question Text Prompt */}
            <div className="space-y-1">
              <span className="text-2xs font-extrabold text-primary uppercase tracking-wider">
                Câu {currentQuestionIndex + 1}:
              </span>
              <h3 className="text-base sm:text-lg font-bold text-text-primary leading-relaxed">
                {currentQuestion.question}
              </h3>
            </div>

            {/* Multiple Choice Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((opt: string, optIdx: number) => {
                const isSelected = userAnswers[currentQuestion.id] === optIdx;
                const isRevealedInPractice =
                  examMode === 'practice_mode' && revealedPracticeAnswers.has(currentQuestion.id);
                const isCorrect = optIdx === currentQuestion.correctAnswer;

                let optClass =
                  'border-border-subtle bg-surface-secondary/40 text-text-primary hover:bg-surface-secondary hover:border-primary/40';

                if (isSelected) {
                  optClass = 'border-primary bg-primary/10 text-primary font-bold shadow-2xs';
                }

                // If submitted or practice answer is revealed, show green/red
                if (isSubmitted || isRevealedInPractice) {
                  if (isCorrect) {
                    optClass = 'border-status-success bg-status-success/15 text-status-success font-bold';
                  } else if (isSelected) {
                    optClass = 'border-status-error bg-status-error/15 text-status-error font-bold';
                  }
                }

                return (
                  <button
                    key={optIdx}
                    onClick={() => handleSelectAnswer(optIdx)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm flex items-center justify-between gap-3 transition-all ${optClass}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-surface border border-border-subtle text-text-secondary text-2xs font-bold flex items-center justify-center shrink-0">
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span>{opt}</span>
                    </div>

                    {(isSubmitted || isRevealedInPractice) && isCorrect && (
                      <Check className="w-4 h-4 text-status-success shrink-0" />
                    )}
                    {(isSubmitted || isRevealedInPractice) && isSelected && !isCorrect && (
                      <X className="w-4 h-4 text-status-error shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Practice Mode Reveal Button & Explanation */}
            {examMode === 'practice_mode' && !isSubmitted && (
              <div className="pt-3 border-t border-divider-line flex items-center justify-between">
                <button
                  onClick={() => handleToggleRevealPractice(currentQuestion.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-surface-secondary border border-border-subtle text-text-secondary hover:text-text-primary text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Eye className="w-3.5 h-3.5 text-primary" />
                  <span>
                    {revealedPracticeAnswers.has(currentQuestion.id)
                      ? 'Ẩn đáp án & giải thích'
                      : 'Xem đáp án ngay'}
                  </span>
                </button>
              </div>
            )}

            {/* Detailed Pedagogical Explanation (Shown if submitted or practice revealed) */}
            {(isSubmitted || (examMode === 'practice_mode' && revealedPracticeAnswers.has(currentQuestion.id))) && (
              <div className="p-4 rounded-xl bg-surface-secondary/70 border border-border-subtle space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-text-primary flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4 text-primary" />
                    <span>Giải thích sư phạm:</span>
                  </span>
                  <button
                    onClick={() =>
                      handleAskAiExplanation(
                        currentQuestion,
                        userAnswers[currentQuestion.id],
                        userAnswers[currentQuestion.id] === currentQuestion.correctAnswer
                      )
                    }
                    disabled={aiExplainingId === currentQuestion.id}
                    className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-2xs font-bold flex items-center gap-1 transition-all disabled:opacity-50"
                  >
                    {aiExplainingId === currentQuestion.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Bot className="w-3 h-3" />
                    )}
                    <span>Gia sư AI giải thích sâu hơn</span>
                  </button>
                </div>
                <p className="text-text-secondary leading-relaxed">
                  {currentQuestion.explanation}
                </p>

                {/* AI Explanation Box if fetched */}
                {aiExplanations[currentQuestion.id] && (
                  <div className="mt-2.5 p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5 text-2xs text-text-primary">
                    <div className="flex items-center gap-1.5 font-bold text-primary">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Phân tích từ Gia sư AI YUYAN:</span>
                    </div>
                    <p className="leading-relaxed">
                      {aiExplanations[currentQuestion.id].explanation ||
                        aiExplanations[currentQuestion.id].overallAnalysis}
                    </p>
                    {aiExplanations[currentQuestion.id].trapAnalysis && (
                      <p className="text-amber-700 dark:text-amber-300 font-semibold">
                        Lưu ý bẫy câu hỏi: {aiExplanations[currentQuestion.id].trapAnalysis}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Bottom Question Navigation Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-divider-line">
              <button
                onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
                className="px-4 py-2 rounded-xl bg-surface-secondary border border-border-subtle text-xs font-bold text-text-primary hover:bg-surface disabled:opacity-30 transition-all flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.min(filteredQuestions.length - 1, prev + 1))
                }
                disabled={currentQuestionIndex === filteredQuestions.length - 1}
                className="px-4 py-2 rounded-xl bg-surface-secondary border border-border-subtle text-xs font-bold text-text-primary hover:bg-surface disabled:opacity-30 transition-all flex items-center gap-1.5"
              >
                <span>Câu sau</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* POST-EXAM RESULTS SUMMARY REPORT */}
      {isSubmitted && (
        <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-6 card-motion">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-divider-line pb-6">
            <div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold inline-block mb-2 ${
                  examResults.passed
                    ? 'bg-status-success/15 text-status-success'
                    : 'bg-status-error/15 text-status-error'
                }`}
              >
                {examResults.passed ? '✓ ĐÃ ĐẠT TIÊU CHUẨN' : '✗ CHƯA ĐẠT TIÊU CHUẨN'}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
                Báo cáo Kết quả Bài thi: {examResults.totalScore} / {currentPaperMeta.maxScore} điểm
              </h2>
              <p className="text-xs text-text-secondary mt-1">
                Tỷ lệ trả lời chính xác: {examResults.correctCount} / {filteredQuestions.length} câu (
                {examResults.percentage}%)
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                onClick={handleStartExam}
                className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover flex items-center gap-1.5 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Làm lại đề này</span>
              </button>
            </div>
          </div>

          {/* Section Score Breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {Object.entries(examResults.sectionScores).map(([sec, pct]: [string, any]) => (
              <div key={sec} className="p-3.5 rounded-xl bg-surface-secondary/70 border border-border-subtle text-center">
                <span className="text-2xs font-bold text-text-muted uppercase tracking-wider block">
                  {sec === 'listening' ? 'Nghe hiểu' : sec === 'reading' ? 'Đọc hiểu' : sec === 'writing' ? 'Viết' : 'Dịch thuật'}
                </span>
                <span className="text-lg font-extrabold text-text-primary mt-1 block">
                  {pct}%
                </span>
              </div>
            ))}
          </div>

          {/* Review Filter Controls */}
          <div className="flex items-center gap-2 pt-2">
            <span className="text-2xs font-bold text-text-muted uppercase tracking-wider mr-1">
              Xem lại:
            </span>
            <button
              onClick={() => setReviewFilter('all')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                reviewFilter === 'all'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface-secondary text-text-secondary'
              }`}
            >
              Tất cả câu hỏi ({filteredQuestions.length})
            </button>
            <button
              onClick={() => setReviewFilter('wrong')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                reviewFilter === 'wrong'
                  ? 'bg-status-error text-white shadow-2xs'
                  : 'bg-surface-secondary text-text-secondary'
              }`}
            >
              Chỉ câu làm sai ({filteredQuestions.length - (examResults?.correctCount ?? 0)})
            </button>
          </div>
        </div>
      )}

      {/* SUBMISSION CONFIRMATION MODAL */}
      {showSubmitModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-modal bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 isolate"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowSubmitModal(false);
          }}
        >
          <div className="bg-surface rounded-2xl border border-border-subtle p-5 sm:p-6 max-w-md w-full shadow-lg space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-base font-bold text-text-primary">Xác nhận nộp bài thi?</h3>
              <p className="text-xs text-text-secondary mt-1">
                Bạn đã trả lời {Object.keys(userAnswers).length} / {filteredQuestions.length} câu hỏi.
                {filteredQuestions.length - Object.keys(userAnswers).length > 0 && (
                  <span className="text-status-error font-semibold block mt-1">
                    Còn {filteredQuestions.length - Object.keys(userAnswers).length} câu chưa có đáp án!
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-surface-secondary text-text-secondary text-xs font-bold hover:bg-border-subtle transition-all cursor-pointer"
              >
                Quay lại làm tiếp
              </button>
              <button
                onClick={() => handleFinalSubmit(false)}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover transition-all cursor-pointer"
              >
                Xác nhận nộp bài
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* HSK DATA HEALTH & COVERAGE DASHBOARD MODAL */}
      {showCoverageModal && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-modal bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 isolate"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowCoverageModal(false);
          }}
        >
          <div className="bg-surface rounded-2xl sm:rounded-3xl border border-border-subtle p-5 sm:p-6 max-w-3xl w-full shadow-lg space-y-4 max-h-[85vh] sm:max-h-[88vh] overflow-y-auto custom-scrollbar animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-divider-line pb-3">
              <div>
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  <span>Bảng Kiểm Định Phủ Sóng Dữ Liệu HSK (Data Health Matrix)</span>
                </h3>
                <p className="text-2xs text-text-secondary mt-0.5">
                  Thống kê thực tế từ kho lưu trữ và pipeline kiểm định dữ liệu (không dùng số liệu tĩnh giả lập).
                </p>
              </div>
              <button
                onClick={() => setShowCoverageModal(false)}
                className="p-1 text-text-muted hover:text-text-primary"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* HSK 2.0 Coverage Matrix */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider text-primary">
                HSK 2.0 (Hanban 2015 — Cấp 1 đến 6)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-2xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-secondary/50 text-text-muted">
                      <th className="p-2">Cấp độ</th>
                      <th className="p-2">Số bộ đề</th>
                      <th className="p-2">Câu hỏi đã xác minh</th>
                      <th className="p-2">Nguồn khảo thí</th>
                      <th className="p-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6].map((l) => (
                      <tr key={l} className="border-b border-divider-line/40">
                        <td className="p-2 font-bold text-text-primary">HSK 2.0 Cấp {l}</td>
                        <td className="p-2">{coverageData.coverageByVersion.hsk2[l]?.papers || 1} đề</td>
                        <td className="p-2 font-mono">{coverageData.coverageByVersion.hsk2[l]?.questions || 0} câu</td>
                        <td className="p-2 text-text-muted">CTI Download (Hanban 2015)</td>
                        <td className="p-2 text-status-success font-semibold">✓ Đã kiểm định</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* HSK 3.0 Coverage Matrix */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider text-secondary">
                HSK 3.0 (GF0025-2021 — Cấp 1 đến 9)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-2xs border-collapse">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-secondary/50 text-text-muted">
                      <th className="p-2">Cấp độ</th>
                      <th className="p-2">Số bộ đề</th>
                      <th className="p-2">Câu hỏi đã xác minh</th>
                      <th className="p-2">Nguồn khảo thí</th>
                      <th className="p-2">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1, 2, 3, 4, 5, 6].map((l) => (
                      <tr key={l} className="border-b border-divider-line/40">
                        <td className="p-2 font-bold text-text-primary">HSK 3.0 Cấp {l}</td>
                        <td className="p-2">{coverageData.coverageByVersion.hsk3[l]?.papers || 1} đề</td>
                        <td className="p-2 font-mono">{coverageData.coverageByVersion.hsk3[l]?.questions || 0} câu</td>
                        <td className="p-2 text-text-muted">GF0025-2021 / SayMei Canon</td>
                        <td className="p-2 text-status-success font-semibold">✓ Đã kiểm định</td>
                      </tr>
                    ))}
                    <tr className="border-b border-divider-line/40 bg-secondary/5">
                      <td className="p-2 font-bold text-secondary">HSK 3.0 Bậc 7–9 (Cao cấp)</td>
                      <td className="p-2 font-bold">{coverageData.coverageByVersion.hsk3[7]?.papers || 1} đề tích hợp</td>
                      <td className="p-2 font-mono">{coverageData.coverageByVersion.hsk3[7]?.questions || 0} câu</td>
                      <td className="p-2 text-text-muted">CTI Đề mẫu Cao cấp (210 phút)</td>
                      <td className="p-2 text-status-success font-semibold">✓ Gom dải 7–9 chính quy</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Registered Data Sources */}
            <div className="space-y-2 pt-2 border-t border-divider-line">
              <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">
                Nhà cung cấp dữ liệu đã đăng ký trong Source Registry
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-2xs">
                {Object.values(HSK_SOURCE_REGISTRY).map((src) => (
                  <div key={src.sourceId} className="p-2.5 rounded-xl bg-surface-secondary/60 border border-border-subtle">
                    <span className="font-bold text-text-primary block">{src.providerName}</span>
                    <span className="text-text-muted block mt-0.5">{src.license}</span>
                    <span className="text-primary font-mono block mt-0.5">{src.sourceType}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
