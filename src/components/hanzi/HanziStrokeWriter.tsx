import React, { useEffect, useRef, useState, useCallback } from 'react';
import HanziWriter from 'hanzi-writer';
import {
  Play,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Edit3,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Gauge,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext.tsx';

export interface HanziStrokeWriterProps {
  character: string;
  size?: number;
  className?: string;
  showControls?: boolean;
  onCompleteQuiz?: (summary: { totalMistakes: number }) => void;
  onStrokeChange?: (currentStroke: number, totalStrokes: number) => void;
}

export type StrokeWriterMode = 'animate' | 'step' | 'quiz';

export const HanziStrokeWriter: React.FC<HanziStrokeWriterProps> = ({
  character,
  size = 260,
  className = '',
  showControls = true,
  onCompleteQuiz,
  onStrokeChange,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const writerRef = useRef<HanziWriter | null>(null);

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  const [mode, setMode] = useState<StrokeWriterMode>('animate');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStepStroke, setCurrentStepStroke] = useState(0);
  const [totalStrokes, setTotalStrokes] = useState(0);
  const [speed, setSpeed] = useState<number>(1);
  const [showOutline, setShowOutline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  // Quiz state
  const [quizMistakes, setQuizMistakes] = useState(0);
  const [quizCurrentStroke, setQuizCurrentStroke] = useState(0);
  const [isQuizCompleted, setIsQuizCompleted] = useState(false);
  const [quizFeedback, setQuizFeedback] = useState<{
    type: 'correct' | 'mistake' | 'completed' | 'info';
    message: string;
  } | null>(null);

  // Color scheme
  const strokeColor = isDark ? '#60A5FA' : '#1D4ED8';
  const radicalColor = isDark ? '#38BDF8' : '#0284C7';
  const outlineColor = isDark ? 'rgba(148, 163, 184, 0.18)' : 'rgba(148, 163, 184, 0.35)';
  const drawingColor = isDark ? '#F8FAFC' : '#0F172A';

  // Initialize or reload HanziWriter when character or theme changes
  useEffect(() => {
    if (!containerRef.current || !character) return;

    // Reset states
    setIsLoading(true);
    setLoadError(false);
    setIsPlaying(false);
    setCurrentStepStroke(0);
    setIsQuizCompleted(false);
    setQuizMistakes(0);
    setQuizCurrentStroke(0);
    setQuizFeedback(null);

    // Clear previous DOM contents
    containerRef.current.innerHTML = '';

    try {
      const writer = HanziWriter.create(containerRef.current, character, {
        width: size,
        height: size,
        padding: Math.max(10, Math.floor(size * 0.08)),
        strokeAnimationSpeed: speed,
        delayBetweenStrokes: 180,
        strokeColor,
        radicalColor,
        outlineColor,
        drawingColor,
        drawingWidth: Math.max(4, Math.floor(size * 0.04)),
        showOutline,
        showCharacter: mode !== 'quiz',
        charDataLoader: (char, onLoad, onError) => {
          // 1. First attempt: Offline bundled JSON
          fetch(`/data/strokes/${encodeURIComponent(char)}.json`)
            .then((res) => {
              if (!res.ok) throw new Error('Offline stroke data missing');
              return res.json();
            })
            .then(onLoad)
            .catch(() => {
              // 2. Second attempt: jsDelivr CDN
              fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0/${encodeURIComponent(char)}.json`)
                .then((r) => {
                  if (!r.ok) throw new Error('CDN stroke data missing');
                  return r.json();
                })
                .then(onLoad)
                .catch((err) => {
                  if (onError) onError(err);
                });
            });
        },
        onLoadCharDataSuccess: (data) => {
          setIsLoading(false);
          setTotalStrokes(data.strokes.length);
          if (onStrokeChange) onStrokeChange(0, data.strokes.length);
        },
        onLoadCharDataError: () => {
          setIsLoading(false);
          setLoadError(true);
        },
      });

      writerRef.current = writer;
    } catch {
      setIsLoading(false);
      setLoadError(true);
    }

    return () => {
      if (writerRef.current) {
        try {
          writerRef.current.cancelQuiz();
        } catch {
          // ignore
        }
        writerRef.current = null;
      }
    };
  }, [character, isDark, size]);

  // Mode switching behavior
  const startQuiz = useCallback(() => {
    const writer = writerRef.current;
    if (!writer) return;

    setMode('quiz');
    setIsPlaying(false);
    setQuizMistakes(0);
    setQuizCurrentStroke(0);
    setIsQuizCompleted(false);
    setQuizFeedback({
      type: 'info',
      message: 'Hãy dùng chuột hoặc ngón tay để vẽ từng nét theo thứ tự!',
    });

    writer.hideCharacter();
    writer.quiz({
      onMistake: (strokeData) => {
        setQuizMistakes((m) => m + 1);
        setQuizFeedback({
          type: 'mistake',
          message: `Sai hướng hoặc thứ tự! Thử lại nét ${strokeData.strokeNum + 1}`,
        });
      },
      onCorrectStroke: (strokeData) => {
        const next = strokeData.strokeNum + 1;
        setQuizCurrentStroke(next);
        setQuizFeedback({
          type: 'correct',
          message: `Chính xác nét ${next}!`,
        });
        if (onStrokeChange) onStrokeChange(next, totalStrokes);
      },
      onComplete: (summary) => {
        setIsQuizCompleted(true);
        setQuizFeedback({
          type: 'completed',
          message: `Chúc mừng! Bạn đã viết đúng chữ "${character}" (${summary.totalMistakes} lỗi).`,
        });
        if (onCompleteQuiz) onCompleteQuiz(summary);
      },
    });
  }, [character, totalStrokes, onCompleteQuiz, onStrokeChange]);

  const startAnimation = useCallback(() => {
    const writer = writerRef.current;
    if (!writer) return;

    try {
      writer.cancelQuiz();
    } catch {
      // ignore
    }

    setMode('animate');
    setIsPlaying(true);
    writer.showOutline();
    writer.animateCharacter({
      onComplete: () => {
        setIsPlaying(false);
      },
    });
  }, []);

  const startStepMode = useCallback(() => {
    const writer = writerRef.current;
    if (!writer) return;

    try {
      writer.cancelQuiz();
    } catch {
      // ignore
    }

    setMode('step');
    setIsPlaying(false);
    setCurrentStepStroke(0);
    writer.hideCharacter();
    writer.showOutline();
    writer.animateStroke(0, {
      onComplete: () => {},
    });
  }, []);

  const handleStepPrev = () => {
    const writer = writerRef.current;
    if (!writer || totalStrokes === 0) return;

    const prev = Math.max(0, currentStepStroke - 1);
    setCurrentStepStroke(prev);
    writer.hideCharacter();
    writer.animateStroke(prev, {
      onComplete: () => {},
    });
    if (onStrokeChange) onStrokeChange(prev, totalStrokes);
  };

  const handleStepNext = () => {
    const writer = writerRef.current;
    if (!writer || totalStrokes === 0) return;

    const next = Math.min(totalStrokes - 1, currentStepStroke + 1);
    setCurrentStepStroke(next);
    writer.hideCharacter();
    writer.animateStroke(next, {
      onComplete: () => {},
    });
    if (onStrokeChange) onStrokeChange(next, totalStrokes);
  };

  const handleStepReplay = () => {
    const writer = writerRef.current;
    if (!writer) return;

    writer.hideCharacter();
    writer.animateStroke(currentStepStroke, {
      onComplete: () => {},
    });
  };

  const handleToggleOutline = () => {
    const writer = writerRef.current;
    if (!writer) return;

    const next = !showOutline;
    setShowOutline(next);
    if (next) {
      writer.showOutline();
    } else {
      writer.hideOutline();
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    const writer = writerRef.current;
    if (writer) {
      writer.updateColor('strokeColor', strokeColor);
      // Re-animate if playing
      if (isPlaying) {
        writer.animateCharacter({
          onComplete: () => setIsPlaying(false),
        });
      }
    }
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Canvas Area with Mi Zi Ge (米字格) Grid */}
      <div
        className="relative rounded-3xl border-2 border-primary/30 overflow-hidden shadow-inner bg-surface dark:bg-surface-secondary flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Background Grid Lines (Mi Zi Ge) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none text-border-subtle"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Diagonals */}
          <line
            x1="0"
            y1="0"
            x2="100%"
            y2="100%"
            stroke="currentColor"
            strokeDasharray="4 4"
            strokeWidth="1.2"
            opacity={isDark ? 0.3 : 0.55}
          />
          <line
            x1="100%"
            y1="0"
            x2="0"
            y2="100%"
            stroke="currentColor"
            strokeDasharray="4 4"
            strokeWidth="1.2"
            opacity={isDark ? 0.3 : 0.55}
          />
          {/* Cross center lines */}
          <line
            x1="50%"
            y1="0"
            x2="50%"
            y2="100%"
            stroke="currentColor"
            strokeDasharray="4 4"
            strokeWidth="1.2"
            opacity={isDark ? 0.4 : 0.65}
          />
          <line
            x1="0"
            y1="50%"
            x2="100%"
            y2="50%"
            stroke="currentColor"
            strokeDasharray="4 4"
            strokeWidth="1.2"
            opacity={isDark ? 0.4 : 0.65}
          />
        </svg>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 dark:bg-surface-secondary/80 backdrop-blur-2xs z-10">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="text-xs text-text-muted mt-2 font-medium">Đang tải nét chữ...</span>
          </div>
        )}

        {/* Fallback Error View */}
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10">
            <span className="font-hanzi text-6xl text-text-primary mb-2">{character}</span>
            <div className="flex items-center gap-1.5 text-xs text-amber-500 font-semibold">
              <AlertCircle className="w-4 h-4" />
              <span>Chưa có dữ liệu hoạt họa nét</span>
            </div>
          </div>
        )}

        {/* HanziWriter Render Container */}
        <div ref={containerRef} className="relative z-0" />
      </div>

      {/* Mode Navigation Pills */}
      {showControls && !loadError && (
        <div className="w-full mt-3 space-y-3">
          {/* Tab Selector: Hoạt họa | Từng nét | Tập viết (Quiz) */}
          <div className="flex items-center justify-center p-1 bg-surface-secondary rounded-2xl border border-border-subtle max-w-[340px] mx-auto">
            <button
              onClick={startAnimation}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'animate'
                  ? 'bg-surface text-primary shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Play className="w-3.5 h-3.5" />
              <span>Hoạt họa</span>
            </button>
            <button
              onClick={startStepMode}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'step'
                  ? 'bg-surface text-primary shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Từng nét</span>
            </button>
            <button
              onClick={startQuiz}
              className={`flex-1 py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'quiz'
                  ? 'bg-surface text-secondary shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Tập viết</span>
            </button>
          </div>

          {/* Mode Sub-Controls */}
          {mode === 'animate' && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={startAnimation}
                disabled={isLoading}
                className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover active:scale-95 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <Play className="w-3.5 h-3.5" />
                <span>{isPlaying ? 'Phát lại' : 'Phát nét'}</span>
              </button>

              <button
                onClick={handleToggleOutline}
                className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  showOutline
                    ? 'border-border-subtle bg-surface text-text-primary'
                    : 'border-border-subtle bg-surface-secondary text-text-muted'
                }`}
                title={showOutline ? 'Ẩn nét mờ' : 'Hiện nét mờ'}
              >
                {showOutline ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{showOutline ? 'Nét mờ' : 'Ẩn nét'}</span>
              </button>

              <div className="flex items-center gap-1 bg-surface-secondary p-1 rounded-xl border border-border-subtle text-xs">
                <Gauge className="w-3.5 h-3.5 text-text-muted ml-1" />
                {[0.75, 1, 1.5].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSpeedChange(s)}
                    className={`px-2 py-0.5 rounded-lg font-bold text-[11px] transition-colors ${
                      speed === s
                        ? 'bg-primary text-white shadow-2xs'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === 'step' && (
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStepPrev}
                  disabled={currentStepStroke <= 0}
                  className="p-2 rounded-xl bg-surface border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Nét trước"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="px-3.5 py-1.5 bg-primary-soft rounded-xl border border-primary/20 text-xs font-bold text-primary min-w-[100px] text-center">
                  Nét {currentStepStroke + 1} / {totalStrokes}
                </div>

                <button
                  onClick={handleStepNext}
                  disabled={currentStepStroke >= totalStrokes - 1}
                  className="p-2 rounded-xl bg-surface border border-border-subtle text-text-secondary hover:text-text-primary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Nét sau"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleStepReplay}
                  className="p-2 rounded-xl bg-surface border border-border-subtle text-text-secondary hover:text-text-primary transition-colors ml-1"
                  title="Phát lại nét này"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-text-muted">
                Quan sát hướng bút và thứ tự nét vẽ chi tiết từng bước
              </p>
            </div>
          )}

          {mode === 'quiz' && (
            <div className="space-y-2 max-w-[340px] mx-auto text-center">
              <div className="flex items-center justify-between text-xs px-2">
                <span className="font-semibold text-text-secondary">
                  Tiến độ: <b className="text-primary">{quizCurrentStroke} / {totalStrokes} nét</b>
                </span>
                <span className="font-semibold text-text-muted">
                  Số lỗi: <b className="text-red-500">{quizMistakes}</b>
                </span>
              </div>

              {quizFeedback && (
                <div
                  className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-center gap-2 animate-in fade-in zoom-in-95 duration-150 ${
                    quizFeedback.type === 'completed'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400'
                      : quizFeedback.type === 'correct'
                      ? 'bg-primary-soft border-primary/30 text-primary'
                      : quizFeedback.type === 'mistake'
                      ? 'bg-red-500/10 border-red-500/30 text-red-500'
                      : 'bg-surface-secondary border-border-subtle text-text-secondary'
                  }`}
                >
                  {quizFeedback.type === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  ) : quizFeedback.type === 'mistake' ? (
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  ) : null}
                  <span>{quizFeedback.message}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 pt-1">
                {isQuizCompleted && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Hoàn thành!</span>
                  </span>
                )}
                <button
                  onClick={startQuiz}
                  className="px-3.5 py-1.5 rounded-xl bg-surface border border-border-subtle text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isQuizCompleted ? 'Luyện lại' : 'Bắt đầu lại'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
