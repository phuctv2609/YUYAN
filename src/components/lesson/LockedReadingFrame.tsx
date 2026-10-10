import React, { useState, useEffect, useRef } from 'react';
import { Volume2, Mic, Star, User, ChevronUp, ChevronDown, RotateCcw, Sparkles } from 'lucide-react';
import { Sentence } from '../../data/hsk/types.ts';
import { FontSize } from './StudyControls.tsx';
import { useToast } from '../ui/Toast.tsx';
import { audioManager } from '../../services/audio/index.ts';
import { parseDialogueSentence } from '../../data/hsk/dialogueParser.ts';

interface LockedReadingFrameProps {
  sentences: Sentence[];
  selectedSentenceIndex: number;
  onSelectSentence: (index: number) => void;
  showHanzi: boolean;
  showPinyin: boolean;
  showVietnamese: boolean;
  fontSize: FontSize;
  onTogglePinyin?: () => void;
  onToggleVietnamese?: () => void;
}

export const LockedReadingFrame: React.FC<LockedReadingFrameProps> = ({
  sentences,
  selectedSentenceIndex,
  onSelectSentence,
  showHanzi,
  showPinyin,
  showVietnamese,
  fontSize,
  onTogglePinyin,
  onToggleVietnamese,
}) => {
  const { showToast } = useToast();
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [bookmarkedSet, setBookmarkedSet] = useState<Set<number>>(new Set());
  const [animatingDirection, setAnimatingDirection] = useState<'next' | 'prev' | null>(null);

  // Quick peek temporary toggles when user wants to check pinyin/meaning for this single card
  const [tempShowPinyin, setTempShowPinyin] = useState<boolean>(false);
  const [tempShowVietnamese, setTempShowVietnamese] = useState<boolean>(false);

  const prevIndexRef = useRef<number>(selectedSentenceIndex);

  // Subscribe to audio state
  useEffect(() => {
    const unsub = audioManager.subscribe((event) => {
      if (event.state === 'playing') {
        setIsAudioPlaying(true);
      } else if (event.state === 'ended' || event.state === 'stopped' || event.state === 'idle' || event.state === 'error') {
        setIsAudioPlaying(false);
      }
    });
    return unsub;
  }, []);

  // Detect navigation direction for smooth frame transition
  useEffect(() => {
    if (selectedSentenceIndex > prevIndexRef.current) {
      setAnimatingDirection('next');
    } else if (selectedSentenceIndex < prevIndexRef.current) {
      setAnimatingDirection('prev');
    }
    prevIndexRef.current = selectedSentenceIndex;

    // Reset temporary reveals on sentence change
    setTempShowPinyin(false);
    setTempShowVietnamese(false);

    const timer = setTimeout(() => {
      setAnimatingDirection(null);
    }, 320);

    return () => clearTimeout(timer);
  }, [selectedSentenceIndex]);

  // Current active sentence & adjacent sentences
  const currentIndex = Math.max(1, Math.min(sentences.length, selectedSentenceIndex));
  const activeSentence = sentences.find((s) => s.index === currentIndex) || sentences[0];
  const nextSentence = sentences.find((s) => s.index === currentIndex + 1);
  const prevSentence = sentences.find((s) => s.index === currentIndex - 1);

  if (!activeSentence) {
    return null;
  }

  const parsedActive = parseDialogueSentence(activeSentence);
  const parsedNext = nextSentence ? parseDialogueSentence(nextSentence) : null;

  const getFontSizeClasses = () => {
    switch (fontSize) {
      case 'sm':
        return 'text-2xl sm:text-3xl leading-[1.6]';
      case 'lg':
        return 'text-4xl sm:text-5xl leading-[1.8]';
      case 'md':
      default:
        return 'text-3xl sm:text-4xl leading-[1.7]';
    }
  };

  const handlePlayActiveAudio = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const textToSpeak = parsedActive.spokenContent.hanzi;
    if (!textToSpeak || !textToSpeak.trim()) {
      showToast('Câu này không có nội dung để đọc.', 'warning');
      return;
    }

    try {
      await audioManager.playText(textToSpeak, {
        id: `sentence_${activeSentence.index}`,
        entityType: 'sentence',
        entityId: String(activeSentence.index),
        pinyin: parsedActive.spokenContent.pinyin,
      });
    } catch (err: any) {
      showToast(err?.message || 'Thiết bị chưa có giọng đọc tiếng Trung phù hợp.', 'warning');
    }
  };

  const handleNext = () => {
    if (currentIndex < sentences.length) {
      audioManager.stop();
      onSelectSentence(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 1) {
      audioManager.stop();
      onSelectSentence(currentIndex - 1);
    }
  };

  const handleMicClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    showToast('Tính năng nhận diện giọng nói và chấm điểm phát âm đang được tích hợp qua Web Speech API', 'info');
  };

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newSet = new Set(bookmarkedSet);
    if (newSet.has(currentIndex)) {
      newSet.delete(currentIndex);
      showToast(`Đã bỏ lưu câu ${currentIndex}`, 'info');
    } else {
      newSet.add(currentIndex);
      showToast(`Đã lưu câu ${currentIndex} vào mục yêu thích`, 'success');
    }
    setBookmarkedSet(newSet);
  };

  const isBookmarked = bookmarkedSet.has(currentIndex);
  const isPinyinVisible = showPinyin || tempShowPinyin;
  const isVietnameseVisible = showVietnamese || tempShowVietnamese;

  return (
    <div className="w-full flex flex-col space-y-4 select-none">
      {/* Top Stepper & Quick Sentence Navigator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 bg-surface rounded-2xl border border-border-subtle shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
            Khung đọc tự lập (Tự đọc)
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-soft text-primary">
            Câu {String(currentIndex).padStart(2, '0')} / {String(sentences.length).padStart(2, '0')}
          </span>
        </div>

        {/* Sentence Navigation Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevious}
            disabled={currentIndex <= 1}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              currentIndex <= 1
                ? 'opacity-40 cursor-not-allowed border-border-subtle text-text-muted'
                : 'border-border-subtle bg-surface hover:bg-surface-secondary text-text-primary active:scale-95'
            }`}
            title={prevSentence ? `Câu trước đó (Câu ${prevSentence.index})` : 'Câu trước'}
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Câu trước</span>
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex >= sentences.length}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              currentIndex >= sentences.length
                ? 'opacity-40 cursor-not-allowed border-border-subtle text-text-muted'
                : 'border-primary/40 bg-primary-soft text-primary hover:bg-primary-hover hover:text-white active:scale-95 shadow-2xs'
            }`}
            title="Câu kế tiếp (Phím tắt: Mũi tên xuống / Phải)"
          >
            <span>Câu tiếp theo</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Sentence Picker Strip */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 px-1 scrollbar-none">
        {sentences.map((s) => (
          <button
            key={s.index}
            onClick={() => {
              audioManager.stop();
              onSelectSentence(s.index);
            }}
            className={`flex-shrink-0 w-8 h-8 rounded-xl text-xs font-bold transition-all ${
              s.index === currentIndex
                ? 'bg-primary text-white shadow-2xs scale-105 ring-2 ring-primary/30'
                : 'bg-surface border border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
            }`}
          >
            {s.index}
          </button>
        ))}
      </div>

      {/* 
        LOCKED READING VIEWPORT
        Fixed, stable container with overflow-hidden.
        Page itself does NOT scroll when navigating sentences.
      */}
      <div className="relative overflow-hidden w-full rounded-2xl bg-gradient-to-b from-surface via-surface to-surface-secondary/30 border border-border-subtle shadow-2xs p-3 sm:p-6 min-h-[360px] sm:min-h-[400px]">
        
        {/* Animated Card & Content (Moves as ONE cohesive object) */}
        <div
          className={`transition-all duration-300 ease-out transform ${
            animatingDirection === 'next'
              ? 'translate-y-0 opacity-100'
              : animatingDirection === 'prev'
              ? 'translate-y-0 opacity-100'
              : 'translate-y-0 opacity-100'
          }`}
        >
          {/* Active Sentence Card */}
          <article
            data-testid="sentence-card"
            data-sentence-index={activeSentence.index}
            className="p-5 sm:p-7 rounded-2xl bg-surface border-2 border-primary-container shadow-xs transition-all"
          >
            {/* Card Header: Badges, Speaker, Audio, Mic, Star */}
            <div className="flex items-center justify-between gap-3 pb-4 mb-4 border-b border-border-subtle/70">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-primary-soft text-primary">
                  Câu {String(activeSentence.index).padStart(2, '0')}
                </span>

                {parsedActive.speaker && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                    <User className="w-3.5 h-3.5" />
                    <span>{parsedActive.speaker.hanzi}</span>
                    {parsedActive.speaker.vietnamese && (
                      <span className="text-[11px] text-text-muted font-normal">
                        ({parsedActive.speaker.vietnamese})
                      </span>
                    )}
                  </span>
                )}

                {isAudioPlaying && (
                  <span className="text-xs text-primary font-medium flex items-center gap-1.5 bg-primary/10 px-2.5 py-0.5 rounded-full">
                    <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                    Đang phát âm
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  data-testid="sentence-mic-btn"
                  onClick={handleMicClick}
                  className="p-2 rounded-xl text-text-muted hover:text-secondary hover:bg-secondary/10 transition-colors"
                  title="Luyện đọc câu này"
                  aria-label="Luyện đọc câu này"
                >
                  <Mic className="w-4 h-4" />
                </button>

                <button
                  onClick={handleBookmarkToggle}
                  className={`p-2 rounded-xl transition-colors ${
                    isBookmarked
                      ? 'text-amber-500 bg-amber-500/10'
                      : 'text-text-muted hover:text-amber-500 hover:bg-surface-secondary'
                  }`}
                  title={isBookmarked ? 'Bỏ lưu' : 'Lưu câu'}
                  aria-label="Lưu câu yêu thích"
                >
                  <Star className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                </button>

                <button
                  onClick={handlePlayActiveAudio}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-primary text-white shadow-2xs hover:bg-primary-hover active:scale-95 transition-all"
                  title="Nghe phát âm chuẩn câu thoại (giọng Bắc Kinh)"
                  aria-label={`Nghe câu ${activeSentence.index}`}
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hanzi Spoken Content */}
            <div className="space-y-3 py-1">
              {showHanzi ? (
                <div
                  data-testid="sentence-hanzi"
                  className={`font-hanzi font-semibold text-text-primary tracking-wide whitespace-pre-wrap select-text ${getFontSizeClasses()}`}
                >
                  {parsedActive.spokenContent.hanzi}
                </div>
              ) : (
                <div
                  data-testid="sentence-hanzi-hidden"
                  className="py-2 px-3 rounded-lg bg-surface-secondary/80 text-xs text-text-muted italic border border-dashed border-border-subtle inline-block"
                >
                  Hán tự đang ẩn (Bấm nút 'Hán tự' ở trên để hiện)
                </div>
              )}

              {/* Pinyin Content & Helper Toggle */}
              {isPinyinVisible ? (
                <div
                  data-testid="sentence-pinyin"
                  className="font-sans text-base sm:text-lg text-deep-blue font-medium leading-relaxed whitespace-pre-wrap select-text"
                >
                  {parsedActive.spokenContent.pinyin}
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (onTogglePinyin) onTogglePinyin();
                    else setTempShowPinyin(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-text-muted hover:text-primary bg-surface-secondary/60 hover:bg-primary-soft border border-dashed border-border-subtle transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hiện gợi ý Pinyin</span>
                </button>
              )}

              {/* Vietnamese Translation & Helper Toggle */}
              {isVietnameseVisible ? (
                <div
                  data-testid="sentence-vietnamese"
                  className="text-sm sm:text-base text-text-secondary leading-relaxed pt-1 whitespace-pre-wrap select-text"
                >
                  {parsedActive.spokenContent.vietnamese}
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (onToggleVietnamese) onToggleVietnamese();
                    else setTempShowVietnamese(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold text-text-muted hover:text-primary bg-surface-secondary/60 hover:bg-primary-soft border border-dashed border-border-subtle transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Hiện nghĩa Tiếng Việt</span>
                </button>
              )}
            </div>

            {/* Bottom Card Controls */}
            <div className="mt-6 pt-4 border-t border-border-subtle/60 flex items-center justify-between text-xs text-text-muted">
              <span>Nhấn vào câu hoặc dùng phím điều hướng để chuyển câu</span>
              <button
                onClick={handlePlayActiveAudio}
                className="inline-flex items-center gap-1.5 text-primary font-semibold hover:underline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nghe lại câu này</span>
              </button>
            </div>
          </article>
        </div>

        {/* 
          PARTIALLY VISIBLE NEXT SENTENCE PEEK CARD
          Rendered below the active card.
          Clicking promotes it to the active position.
        */}
        {nextSentence && parsedNext && (
          <div
            onClick={handleNext}
            className="mt-4 pt-1 cursor-pointer transition-all duration-300 transform opacity-65 hover:opacity-90 scale-[0.98] hover:scale-100"
            title="Nhấn để chuyển sang câu kế tiếp"
          >
            <article
              data-testid="sentence-card"
              data-sentence-index={nextSentence.index}
              className="p-4 sm:p-5 rounded-2xl bg-surface/80 border border-dashed border-border-subtle hover:border-primary/50 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-3 text-xs text-text-muted pb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold px-2 py-0.5 rounded bg-surface-secondary text-text-muted text-[11px]">
                    Câu {String(nextSentence.index).padStart(2, '0')} (Kế tiếp)
                  </span>
                  {parsedNext.speaker && (
                    <span className="text-[11px] font-medium text-text-secondary">
                      {parsedNext.speaker.hanzi}
                    </span>
                  )}
                </div>
                <span className="text-primary font-semibold text-[11px] hover:underline flex items-center gap-1">
                  <span>Chuyển sang câu này</span>
                  <ChevronDown className="w-3 h-3" />
                </span>
              </div>

              {showHanzi && (
                <div
                  data-testid="sentence-hanzi"
                  className="font-hanzi text-lg sm:text-xl text-text-secondary/80 line-clamp-1"
                >
                  {parsedNext.spokenContent.hanzi}
                </div>
              )}

              {isPinyinVisible && (
                <div
                  data-testid="sentence-pinyin"
                  className="text-xs text-text-muted line-clamp-1 mt-1 font-sans"
                >
                  {parsedNext.spokenContent.pinyin}
                </div>
              )}

              {isVietnameseVisible && (
                <div
                  data-testid="sentence-vietnamese"
                  className="text-xs text-text-muted/80 line-clamp-1 mt-0.5"
                >
                  {parsedNext.spokenContent.vietnamese}
                </div>
              )}
            </article>
          </div>
        )}
      </div>
    </div>
  );
};
