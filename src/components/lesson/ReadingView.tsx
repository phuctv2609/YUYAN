import React, { useState } from 'react';
import {
  BookOpen,
  Volume2,
  Copy,
  Check,
  Eye,
  EyeOff,
  HelpCircle,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { audioManager } from '../../services/audio/index.ts';

interface ReadingViewProps {
  level: number;
  lessonNumber: number;
  lessonTitle: string;
  readingData?: {
    hanzi: string;
    pinyin: string;
    vietnamese: string;
    vocabularyReappeared?: string;
    comprehensionQuestions?: string[];
  };
}

export const ReadingView: React.FC<ReadingViewProps> = ({
  level,
  lessonNumber,
  lessonTitle,
  readingData,
}) => {
  const { showToast } = useToast();
  const [showPinyin, setShowPinyin] = useState<boolean>(true);
  const [showVietnamese, setShowVietnamese] = useState<boolean>(true);
  const [fontSizeLevel, setFontSizeLevel] = useState<'sm' | 'md' | 'lg'>('md');
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedQuestions, setExpandedQuestions] = useState<boolean>(true);
  const [userReflections, setUserReflections] = useState<Record<number, string>>({});

  if (!readingData || !readingData.hanzi) {
    return (
      <div className="w-full p-8 text-center bg-surface rounded-2xl border border-border-subtle shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-text-primary mb-1">
          Chưa có bài đọc mở rộng cho bài này
        </h3>
        <p className="text-xs text-text-muted max-w-md mx-auto">
          Dữ liệu đoạn văn HSK {level} Bài {lessonNumber} đang được bổ sung từ giáo trình chuẩn.
        </p>
      </div>
    );
  }

  const { hanzi, pinyin, vietnamese, vocabularyReappeared, comprehensionQuestions } = readingData;

  const handleCopyPassage = () => {
    navigator.clipboard?.writeText(hanzi);
    setCopied(true);
    showToast('Đã sao chép nội dung đoạn văn chữ Hán', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePlayAudio = async () => {
    if (!hanzi) return;
    try {
      await audioManager.playText(hanzi, {
        id: `reading_hsk${level}_bai${lessonNumber}`,
        entityType: 'reading',
        entityId: `hsk${level}-bai${lessonNumber}`,
      });
    } catch (err: any) {
      showToast(err?.message || 'Không thể phát âm thanh', 'warning');
    }
  };

  const handleReflectionChange = (idx: number, text: string) => {
    setUserReflections((prev) => ({ ...prev, [idx]: text }));
  };

  // Font size classes
  const hanziSizeClass =
    fontSizeLevel === 'sm'
      ? 'text-lg sm:text-xl'
      : fontSizeLevel === 'lg'
      ? 'text-2xl sm:text-3xl'
      : 'text-xl sm:text-2xl';

  return (
    <div className="w-full space-y-4">
      {/* Top Header & Reading Controls */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h2 className="text-sm sm:text-base font-bold text-text-primary">
                Đoạn văn mở rộng • HSK {level} Bài {lessonNumber}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-secondary/15 text-secondary">
                Đọc hiểu
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Bài đọc củng cố ngữ cảnh và khả năng ứng dụng từ vựng ({lessonTitle})
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Font size toggles */}
            <div className="flex items-center bg-surface-secondary p-0.5 rounded-xl border border-border-subtle text-xs font-bold">
              <button
                onClick={() => setFontSizeLevel('sm')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  fontSizeLevel === 'sm' ? 'bg-surface text-primary shadow-2xs' : 'text-text-muted'
                }`}
                title="Cỡ chữ nhỏ"
              >
                A-
              </button>
              <button
                onClick={() => setFontSizeLevel('md')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  fontSizeLevel === 'md' ? 'bg-surface text-primary shadow-2xs' : 'text-text-muted'
                }`}
                title="Cỡ chữ chuẩn"
              >
                A
              </button>
              <button
                onClick={() => setFontSizeLevel('lg')}
                className={`px-2 py-1 rounded-lg transition-colors ${
                  fontSizeLevel === 'lg' ? 'bg-surface text-primary shadow-2xs' : 'text-text-muted'
                }`}
                title="Cỡ chữ to"
              >
                A+
              </button>
            </div>

            {/* Toggle Pinyin */}
            <button
              onClick={() => setShowPinyin(!showPinyin)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showPinyin
                  ? 'bg-primary-soft text-primary border-primary/30'
                  : 'bg-surface-secondary text-text-muted border-border-subtle hover:text-text-primary'
              }`}
            >
              {showPinyin ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Pinyin</span>
            </button>

            {/* Toggle Vietnamese */}
            <button
              onClick={() => setShowVietnamese(!showVietnamese)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                showVietnamese
                  ? 'bg-secondary/10 text-secondary border-secondary/30'
                  : 'bg-surface-secondary text-text-muted border-border-subtle hover:text-text-primary'
              }`}
            >
              {showVietnamese ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Tiếng Việt</span>
            </button>

            {/* Listen Audio */}
            <button
              onClick={handlePlayAudio}
              className="p-2 rounded-xl bg-surface-secondary text-text-secondary hover:text-primary border border-border-subtle transition-colors"
              title="Nghe audio đoạn văn"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Copy Hanzi */}
            <button
              onClick={handleCopyPassage}
              className="p-2 rounded-xl bg-surface-secondary text-text-secondary hover:text-primary border border-border-subtle transition-colors"
              title="Sao chép đoạn văn Hán tự"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Reappeared Vocabulary Card (when present in source, e.g. HSK 1) */}
      {vocabularyReappeared && (
        <div className="bg-primary-ultra-soft border border-primary/20 rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-xs sm:text-sm font-bold text-primary">
              Từ mới xuất hiện lại trong đoạn văn (生词再现)
            </h3>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed font-medium">
            {vocabularyReappeared.replace(/^十八、\s*课后短文[：:]\s*生词再现\s*/i, '')}
          </p>
        </div>
      )}

      {/* Main Reading Text Card */}
      <article className="bg-surface rounded-2xl border border-border-subtle p-5 sm:p-8 shadow-2xs space-y-6 leading-relaxed">
        {/* Chinese Text Section */}
        <div>
          <div className="flex items-center justify-between mb-3 border-b border-divider-line pb-2">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
              Nội dung đoạn văn (课文短文)
            </span>
          </div>

          <p
            className={`font-hanzi ${hanziSizeClass} text-text-primary font-normal leading-[1.85] tracking-wide text-justify select-text`}
          >
            {hanzi}
          </p>
        </div>

        {/* Pinyin Section */}
        {showPinyin && pinyin && (
          <div className="pt-4 border-t border-divider-line">
            <span className="text-[11px] font-bold text-deep-blue uppercase tracking-wider block mb-2">
              Phiên âm Pinyin
            </span>
            <p className="text-xs sm:text-sm text-deep-blue leading-relaxed font-mono whitespace-pre-line select-text">
              {pinyin}
            </p>
          </div>
        )}

        {/* Vietnamese Translation Section */}
        {showVietnamese && (
          <div className="pt-4 border-t border-divider-line">
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider block mb-2">
              Bản dịch tiếng Việt
            </span>
            {vietnamese ? (
              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed whitespace-pre-line select-text">
                {vietnamese}
              </p>
            ) : (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-secondary text-text-muted text-xs border border-border-subtle">
                <Info className="w-4 h-4 flex-shrink-0 text-amber-500" />
                <span>
                  Bản dịch tiếng Việt cho đoạn văn này chưa có trong dữ liệu nguồn của giáo trình.
                </span>
              </div>
            )}
          </div>
        )}
      </article>

      {/* Reading Comprehension Questions ("阅读理解") */}
      {comprehensionQuestions && comprehensionQuestions.length > 0 && (
        <section className="bg-surface rounded-2xl border border-border-subtle p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-secondary" />
              <h3 className="text-sm sm:text-base font-bold text-text-primary">
                Câu hỏi đọc hiểu (阅读理解)
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-secondary/15 text-secondary">
                {comprehensionQuestions.length} câu
              </span>
            </div>

            <button
              onClick={() => setExpandedQuestions(!expandedQuestions)}
              className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 font-semibold"
            >
              <span>{expandedQuestions ? 'Thu gọn' : 'Mở rộng'}</span>
              {expandedQuestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Honest Note About Source Answer Key */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-surface-secondary text-[11px] text-text-muted border border-border-subtle">
            <Info className="w-3.5 h-3.5 flex-shrink-0 text-amber-500 mt-0.5" />
            <span>
              Đáp án mẫu chưa có trong dữ liệu nguồn. Học viên có thể tự trả lời dựa trên đoạn văn phía trên để rèn luyện tư duy ngôn ngữ.
            </span>
          </div>

          {expandedQuestions && (
            <div className="space-y-3 pt-1">
              {comprehensionQuestions.map((q, idx) => {
                const cleanQuestion = q.replace(/^[•\-\*]\s*/, '');
                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-surface-secondary/60 border border-border-subtle space-y-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5 shadow-2xs">
                        {idx + 1}
                      </span>
                      <p className="font-hanzi text-sm sm:text-base font-bold text-text-primary leading-snug">
                        {cleanQuestion}
                      </p>
                    </div>

                    {/* Self-practice input */}
                    <div className="pl-8">
                      <input
                        type="text"
                        value={userReflections[idx] || ''}
                        onChange={(e) => handleReflectionChange(idx, e.target.value)}
                        placeholder="Ghi chú câu trả lời hoặc suy nghĩ của bạn..."
                        className="w-full px-3 py-2 bg-surface border border-border-subtle rounded-lg text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-secondary transition-all"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
