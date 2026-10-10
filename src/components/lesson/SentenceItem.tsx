import React, { useState, useEffect } from 'react';
import { Volume2, Mic, Star, User } from 'lucide-react';
import { Sentence } from '../../data/hsk/types.ts';
import { FontSize } from './StudyControls.tsx';
import { useToast } from '../ui/Toast.tsx';
import { audioManager } from '../../services/audio/index.ts';
import { parseDialogueSentence } from '../../data/hsk/dialogueParser.ts';
import { learningProgressService } from '../../services/progress/learningProgressService.ts';

interface SentenceItemProps {
  sentence: Sentence;
  isSelected: boolean;
  onSelect: () => void;
  showHanzi: boolean;
  showPinyin: boolean;
  showVietnamese: boolean;
  fontSize: FontSize;
}

export const SentenceItem: React.FC<SentenceItemProps> = ({
  sentence,
  isSelected,
  onSelect,
  showHanzi,
  showPinyin,
  showVietnamese,
  fontSize,
}) => {
  const bookmarkKey = `sent_${sentence.hanzi.replace(/\s+/g, '')}`;
  const [isBookmarked, setIsBookmarked] = useState(() => learningProgressService.isBookmarked(bookmarkKey));
  const { showToast } = useToast();

  useEffect(() => {
    setIsBookmarked(learningProgressService.isBookmarked(bookmarkKey));
    const unsubscribe = learningProgressService.subscribe(() => {
      setIsBookmarked(learningProgressService.isBookmarked(bookmarkKey));
    });
    return unsubscribe;
  }, [bookmarkKey]);

  const parsed = parseDialogueSentence(sentence);

  const getFontSizeClasses = () => {
    switch (fontSize) {
      case 'sm':
        return 'text-xl sm:text-2xl leading-[1.6]';
      case 'lg':
        return 'text-3xl sm:text-4xl leading-[1.8]';
      case 'md':
      default:
        return 'text-2xl sm:text-[28px] leading-[1.7]';
    }
  };

  const handlePlayAudio = async (e: React.MouseEvent) => {
    e.stopPropagation();
    // Only synthesize the spoken dialogue, never the speaker prefix
    const textToSpeak = parsed.spokenContent.hanzi;
    if (!textToSpeak) return;

    try {
      await audioManager.playText(textToSpeak, {
        id: `sentence_${sentence.index}`,
        entityType: 'sentence',
        entityId: String(sentence.index),
        pinyin: parsed.spokenContent.pinyin,
      });
    } catch (err: any) {
      showToast(err?.message || 'Không thể phát âm thanh', 'warning');
    }
  };

  const handleMicClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    showToast('Tính năng nhận diện giọng nói và chấm điểm phát âm đang được tích hợp qua Web Speech API', 'info');
  };

  const handleBookmarkToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextBookmarked = await learningProgressService.toggleBookmark(bookmarkKey, 'sentence');
    setIsBookmarked(nextBookmarked);
    showToast(
      nextBookmarked ? `Đã lưu câu ${sentence.index} vào mục yêu thích` : `Đã bỏ lưu câu ${sentence.index}`,
      'success'
    );
  };

  const paddedIndex = String(sentence.index).padStart(2, '0');

  return (
    <article
      data-testid="sentence-card"
      data-sentence-index={sentence.index}
      onClick={onSelect}
      className={`p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'bg-primary-ultra-soft border-2 border-primary-container shadow-xs'
          : 'bg-surface border border-border-subtle hover:border-primary-container/60 hover:bg-surface-secondary/40 shadow-2xs'
      }`}
    >
      <div className="flex items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Audio Play Button */}
          <button
            onClick={handlePlayAudio}
            className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-transform active:scale-95 ${
              isSelected
                ? 'bg-primary text-white shadow-2xs hover:bg-primary-hover'
                : 'bg-surface-secondary text-text-secondary hover:bg-primary-soft hover:text-primary'
            }`}
            title="Nghe phát âm chuẩn câu thoại (giọng Bắc Kinh)"
            aria-label={`Nghe câu ${paddedIndex}`}
          >
            <Volume2 className="w-4 h-4" />
          </button>

          <div className="space-y-2 flex-1 min-w-0">
            {/* Sentence Header Badges & Speaker Tag */}
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                  isSelected ? 'bg-primary-soft text-primary' : 'bg-surface-secondary text-text-muted'
                }`}
              >
                Câu {paddedIndex}
              </span>

              {parsed.speaker && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                  <User className="w-3 h-3" />
                  <span>{parsed.speaker.hanzi}</span>
                  {parsed.speaker.vietnamese && (
                    <span className="text-[10px] text-text-muted font-normal">({parsed.speaker.vietnamese})</span>
                  )}
                </span>
              )}

              {isSelected && (
                <span className="text-xs text-primary font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  Đang chọn
                </span>
              )}
            </div>

            {/* Hanzi Block (Spoken text only) */}
            {showHanzi ? (
              <div
                data-testid="sentence-hanzi"
                className={`font-hanzi font-semibold text-text-primary tracking-wide whitespace-pre-wrap ${getFontSizeClasses()}`}
              >
                {parsed.spokenContent.hanzi}
              </div>
            ) : (
              <div
                data-testid="sentence-hanzi-hidden"
                className="py-2 px-3 rounded-lg bg-surface-secondary/80 text-xs text-text-muted italic border border-dashed border-border-subtle inline-block"
              >
                Hán tự đang ẩn (Bấm nút 'Hán tự' ở trên để hiện)
              </div>
            )}

            {/* Pinyin Block (Spoken text only) */}
            {showPinyin && (
              <div
                data-testid="sentence-pinyin"
                className="font-sans text-sm sm:text-base text-deep-blue font-medium leading-relaxed whitespace-pre-wrap"
              >
                {parsed.spokenContent.pinyin}
              </div>
            )}

            {/* Vietnamese Translation (Spoken text only) */}
            {showVietnamese && (
              <div
                data-testid="sentence-vietnamese"
                className="text-xs sm:text-sm text-text-secondary leading-relaxed pt-0.5 whitespace-pre-wrap"
              >
                {parsed.spokenContent.vietnamese}
              </div>
            )}
          </div>
        </div>

        {/* Micro Actions: Voice Practice & Star Bookmark */}
        <div className="flex items-center gap-1 flex-shrink-0 text-text-muted">
          <button
            data-testid="sentence-mic-btn"
            onClick={handleMicClick}
            className="p-1.5 sm:p-2 rounded-lg hover:bg-surface-secondary hover:text-secondary transition-colors"
            title="Luyện đọc câu này"
            aria-label="Luyện đọc câu này"
          >
            <Mic className="w-4 h-4" />
          </button>
          <button
            data-testid="sentence-bookmark-btn"
            onClick={handleBookmarkToggle}
            className={`p-1.5 sm:p-2 rounded-lg hover:bg-surface-secondary transition-colors ${
              isBookmarked ? 'text-amber-500' : 'hover:text-amber-500'
            }`}
            title="Lưu câu yêu thích"
            aria-label="Lưu câu yêu thích"
          >
            <Star className={`w-4 h-4 ${isBookmarked ? 'fill-amber-500' : ''}`} />
          </button>
        </div>
      </div>
    </article>
  );
};
