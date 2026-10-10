import React, { useState, useMemo, useEffect } from 'react';
import { Search, Volume2, Star, Check, Sparkles, Filter, AlertCircle, BookOpen } from 'lucide-react';
import { LessonVocabulary, RawVocabularyItem } from '../../data/hsk/types.ts';
import { useToast } from '../ui/Toast.tsx';
import { audioManager } from '../../services/audio/index.ts';
import { learningProgressService } from '../../services/progress/learningProgressService.ts';

interface VocabularyViewProps {
  level: number;
  lessonNumber: number;
  lessonTitle: string;
  vocabularyData?: LessonVocabulary;
}

export const VocabularyView: React.FC<VocabularyViewProps> = ({
  level,
  lessonNumber,
  lessonTitle,
  vocabularyData,
}) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedQuery, setDebouncedQuery] = useState<string>('');
  const [selectedPos, setSelectedPos] = useState<string>('all');
  const [savedWords, setSavedWords] = useState<Set<string>>(() => {
    const snap = learningProgressService.getSnapshot();
    return new Set([...snap.bookmarkedIds, ...snap.learnedWords]);
  });
  const [copiedWord, setCopiedWord] = useState<string | null>(null);

  // Debounce search query by 280ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim().toLowerCase());
    }, 280);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const items: RawVocabularyItem[] = useMemo(() => {
    return vocabularyData?.vocabulary || [];
  }, [vocabularyData]);

  // Extract unique parts of speech
  const partsOfSpeech = useMemo(() => {
    const set = new Set<string>();
    items.forEach((item) => {
      const pos = item['Từ loại']?.trim();
      if (pos) set.add(pos);
    });
    return Array.from(set);
  }, [items]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Pos filter
      if (selectedPos !== 'all' && item['Từ loại']?.trim() !== selectedPos) {
        return false;
      }

      // Query filter
      if (!debouncedQuery) return true;

      const hanzi = (item['汉字'] || '').toLowerCase();
      const pinyin = (item['Pinyin'] || '').toLowerCase();
      const meaning = (item['Nghĩa tiếng Việt'] || '').toLowerCase();
      const collocation = (item['Cách kết hợp tự nhiên'] || item['Cụm từ cố định / collocation'] || '').toLowerCase();

      return (
        hanzi.includes(debouncedQuery) ||
        pinyin.includes(debouncedQuery) ||
        meaning.includes(debouncedQuery) ||
        collocation.includes(debouncedQuery)
      );
    });
  }, [items, debouncedQuery, selectedPos]);

  const handleToggleSave = async (hanzi: string) => {
    const isNowBookmarked = await learningProgressService.toggleBookmark(hanzi, 'vocab');
    if (isNowBookmarked) {
      void learningProgressService.markWordLearned(hanzi);
      setSavedWords((prev) => new Set([...prev, hanzi]));
      showToast(`Đã lưu từ "${hanzi}" vào sổ từ vựng`, 'success');
    } else {
      setSavedWords((prev) => {
        const next = new Set(prev);
        next.delete(hanzi);
        return next;
      });
      showToast(`Đã bỏ lưu từ "${hanzi}"`, 'info');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedWord(text);
    showToast(`Đã sao chép "${text}"`, 'info');
    setTimeout(() => setCopiedWord(null), 2000);
  };

  const handlePlayAudio = async (hanzi: string) => {
    if (!hanzi) return;
    try {
      await audioManager.playText(hanzi, {
        id: `vocab_${hanzi}`,
        entityType: 'vocabulary',
        entityId: hanzi,
      });
    } catch (err: any) {
      showToast(err?.message || 'Không thể phát âm thanh', 'warning');
    }
  };

  if (!items || items.length === 0) {
    return (
      <div className="w-full p-8 text-center bg-surface rounded-2xl border border-border-subtle shadow-2xs">
        <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center mx-auto mb-3">
          <BookOpen className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-text-primary mb-1">
          Chưa có dữ liệu Từ mới cho bài học này
        </h3>
        <p className="text-xs text-text-muted max-w-md mx-auto">
          Dữ liệu từ mới HSK {level} Bài {lessonNumber} đang được đồng bộ từ nguồn giáo trình gốc.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Controls & Search Header */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm sm:text-base font-bold text-text-primary">
                Từ mới: HSK {level} • Bài {lessonNumber}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-soft text-primary">
                {items.length} từ
              </span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Từ vựng chuẩn theo tài liệu giảng dạy chính thức ({lessonTitle})
            </p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo chữ Hán, Pinyin, nghĩa..."
              className="w-full pl-9 pr-8 py-2 bg-input-bg border border-border-subtle rounded-xl text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs font-bold p-0.5"
                title="Xóa tìm kiếm"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Filter chips for Part of Speech */}
        {partsOfSpeech.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1">
            <span className="text-[11px] font-semibold text-text-muted flex items-center gap-1 flex-shrink-0 mr-1">
              <Filter className="w-3 h-3" /> Từ loại:
            </span>
            <button
              onClick={() => setSelectedPos('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedPos === 'all'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-border-subtle'
              }`}
            >
              Tất cả ({items.length})
            </button>
            {partsOfSpeech.map((pos) => {
              const count = items.filter((i) => i['Từ loại']?.trim() === pos).length;
              return (
                <button
                  key={pos}
                  onClick={() => setSelectedPos(pos)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedPos === pos
                      ? 'bg-primary text-white shadow-2xs'
                      : 'bg-surface-secondary text-text-secondary hover:text-text-primary hover:bg-border-subtle'
                  }`}
                >
                  {pos} ({count})
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Empty Search Result */}
      {filteredItems.length === 0 ? (
        <div className="p-8 text-center bg-surface rounded-2xl border border-border-subtle shadow-2xs">
          <AlertCircle className="w-8 h-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm font-bold text-text-primary">
            Không tìm thấy từ vựng nào khớp với &quot;{searchQuery}&quot;
          </p>
          <p className="text-xs text-text-muted mt-1">
            Thử tìm bằng chữ Hán, Pinyin không dấu hoặc nghĩa tiếng Việt khác.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedPos('all');
            }}
            className="mt-3 px-3 py-1.5 rounded-lg bg-surface-secondary text-primary hover:bg-primary-soft text-xs font-semibold transition-colors"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (Screens >= 768px) */}
          <div className="hidden md:block bg-surface rounded-2xl border border-border-subtle shadow-2xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-surface-secondary/70 border-b border-border-subtle text-text-secondary font-bold select-none">
                    <th className="py-3 px-4 w-12 text-center">STT</th>
                    <th className="py-3 px-4 w-28">Hán tự</th>
                    <th className="py-3 px-4 w-32">Pinyin</th>
                    <th className="py-3 px-4 w-28">Từ loại</th>
                    <th className="py-3 px-4 min-w-[180px]">Nghĩa tiếng Việt</th>
                    <th className="py-3 px-4 min-w-[200px]">Cách kết hợp tự nhiên</th>
                    <th className="py-3 px-4 w-24 text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle">
                  {filteredItems.map((item, idx) => {
                    const stt = item['STT'] ?? idx + 1;
                    const hanzi = item['汉字'] || '';
                    const pinyin = item['Pinyin'] || '';
                    const pos = item['Từ loại'] || '';
                    const meaning = item['Nghĩa tiếng Việt'] || '';
                    const collocation =
                      item['Cách kết hợp tự nhiên'] ||
                      item['Cụm từ cố định / collocation'] ||
                      '';
                    const isSaved = savedWords.has(hanzi);

                    return (
                      <tr
                        key={`${hanzi}-${idx}`}
                        className="hover:bg-primary-ultra-soft/40 transition-colors group"
                      >
                        <td className="py-3 px-4 text-center text-text-muted font-medium">
                          {stt}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleCopy(hanzi)}
                            className="text-left font-hanzi text-xl font-bold text-text-primary hover:text-primary transition-colors flex items-center gap-1.5"
                            title="Nhấn để sao chép"
                          >
                            <span>{hanzi}</span>
                            {copiedWord === hanzi && (
                              <Check className="w-3.5 h-3.5 text-emerald-600 inline" />
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-4 font-semibold text-deep-blue text-sm">
                          {pinyin}
                        </td>
                        <td className="py-3 px-4">
                          {pos && (
                            <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold bg-surface-secondary text-text-secondary border border-border-subtle">
                              {pos}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-medium text-text-primary leading-relaxed">
                          {meaning}
                        </td>
                        <td className="py-3 px-4 text-text-secondary leading-relaxed">
                          {collocation ? (
                            <span className="font-hanzi text-xs bg-surface-secondary/70 px-2 py-1 rounded-lg inline-block border border-border-subtle/60">
                              {collocation}
                            </span>
                          ) : (
                            <span className="text-text-muted italic text-[11px]">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handlePlayAudio(hanzi)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-secondary transition-colors"
                              title="Nghe phát âm"
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleToggleSave(hanzi)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isSaved
                                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                                  : 'text-text-muted hover:text-amber-500 hover:bg-surface-secondary'
                              }`}
                              title={isSaved ? 'Đã lưu' : 'Lưu từ'}
                            >
                              <Star
                                className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`}
                              />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (Screens < 768px) */}
          <div className="md:hidden space-y-2.5">
            {filteredItems.map((item, idx) => {
              const stt = item['STT'] ?? idx + 1;
              const hanzi = item['汉字'] || '';
              const pinyin = item['Pinyin'] || '';
              const pos = item['Từ loại'] || '';
              const meaning = item['Nghĩa tiếng Việt'] || '';
              const collocation =
                item['Cách kết hợp tự nhiên'] ||
                item['Cụm từ cố định / collocation'] ||
                '';
              const isSaved = savedWords.has(hanzi);

              return (
                <div
                  key={`${hanzi}-${idx}`}
                  className="bg-surface rounded-2xl border border-border-subtle p-3.5 shadow-2xs space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-baseline gap-2.5 flex-wrap">
                      <span className="text-[11px] font-bold text-text-muted bg-surface-secondary px-1.5 py-0.5 rounded">
                        #{stt}
                      </span>
                      <button
                        onClick={() => handleCopy(hanzi)}
                        className="font-hanzi text-2xl font-bold text-text-primary hover:text-primary transition-colors flex items-center gap-1"
                      >
                        <span>{hanzi}</span>
                        {copiedWord === hanzi && (
                          <Check className="w-3.5 h-3.5 text-emerald-600 inline" />
                        )}
                      </button>
                      <span className="text-sm font-bold text-deep-blue">
                        {pinyin}
                      </span>
                      {pos && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary-soft text-primary">
                          {pos}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handlePlayAudio(hanzi)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface-secondary"
                        title="Nghe"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleSave(hanzi)}
                        className={`p-1.5 rounded-lg ${
                          isSaved
                            ? 'text-amber-500 bg-amber-50'
                            : 'text-text-muted hover:text-amber-500'
                        }`}
                        title="Lưu"
                      >
                        <Star
                          className={`w-4 h-4 ${isSaved ? 'fill-amber-400' : ''}`}
                        />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-text-primary leading-relaxed">
                    {meaning}
                  </p>

                  {collocation && (
                    <div className="p-2 rounded-xl bg-surface-secondary/80 border border-border-subtle text-xs text-text-secondary">
                      <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider block mb-0.5">
                        Kết hợp tự nhiên:
                      </span>
                      <span className="font-hanzi font-medium text-text-primary">
                        {collocation}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
