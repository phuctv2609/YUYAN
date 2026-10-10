import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Search,
  BookMarked,
  Volume2,
  X,
  BookOpen,
  Star,
  History,
  ExternalLink,
  Loader2,
  Trash2,
  GraduationCap,
  Info
} from 'lucide-react';
import { dictionaryEngine } from '../../services/dictionary/dictionaryEngine';
import { dictionaryCache, SearchHistoryItem } from '../../services/dictionary/dictionaryCache';
import {
  DictionaryResult,
  DictionarySearchState,
  DictionaryFilter,
} from '../../services/dictionary/dictionaryTypes';
import { DictionaryDetailModal } from './dictionary/DictionaryDetailModal';
import { GeminiTutorModal } from './dictionary/GeminiTutorModal';
import { useToast } from '../ui/Toast';
import { audioManager } from '../../services/audio/index';

export interface DictionaryViewProps {
  initialQuery?: string;
  onOpenLesson?: (lvl: number, num: number) => void;
  onOpenHanzi?: (char: string) => void;
  onOpenSpecialized?: (domainId: string) => void;
}

const SAMPLE_QUERIES = ['你好', '学习', '中国', '海关', '工作', '朋友', '谢谢', 'xin chào', 'học tập'];

export const DictionaryView: React.FC<DictionaryViewProps> = ({
  initialQuery = '',
  onOpenLesson,
  onOpenHanzi,
  onOpenSpecialized,
}) => {
  const { showToast } = useToast();

  // Search input & results state
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<DictionaryResult[]>([]);
  const [_searchState, setSearchState] = useState<DictionarySearchState>('idle');
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [totalMatches, setTotalMatches] = useState(0);

  // Active filter tab
  const [activeTab, setActiveTab] = useState<'all' | 'hsk' | 'favorites' | 'history'>('all');
  const [selectedHskLevel, setSelectedHskLevel] = useState<number | 'all'>('all');

  // Audio playing text
  const [activeAudioText, setActiveAudioText] = useState<string | null>(null);

  // Local storage state for history & favorites
  const [history, setHistory] = useState<SearchHistoryItem[]>(() => dictionaryCache.getHistory());
  const [favorites, setFavorites] = useState<string[]>(() => dictionaryCache.getFavorites());

  // Modals state
  const [detailItem, setDetailItem] = useState<DictionaryResult | null>(null);
  const [geminiItem, setGeminiItem] = useState<DictionaryResult | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<number | null>(null);

  // Keyboard shortcut Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Programmatic search listener for quick actions and automated verification
  useEffect(() => {
    const handleSetQuery = (e: CustomEvent<{ query: string }>) => {
      if (typeof e.detail?.query === 'string') {
        setQuery(e.detail.query);
      }
    };
    window.addEventListener('yuyan:dict-search' as any, handleSetQuery);
    return () => window.removeEventListener('yuyan:dict-search' as any, handleSetQuery);
  }, []);

  // Execute search through DictionaryEngine
  const executeSearch = useCallback(
    async (searchQuery: string, newOffset: number = 0, append: boolean = false) => {
      const trimmed = searchQuery.trim();
      if (!trimmed) {
        setResults([]);
        setSearchState('idle');
        setIsLoading(false);
        setHasMore(false);
        setTotalMatches(0);
        return;
      }

      setIsLoading(true);
      if (!append) {
        setSearchState('searching_internal');
      }

      try {
        const filter: DictionaryFilter = {};
        if (selectedHskLevel !== 'all') {
          filter.hskLevel = selectedHskLevel;
        }

        const data = await dictionaryEngine.search(trimmed, {
          filter,
          limit: 30,
          offset: newOffset,
          onStateChange: (state) => {
            if (!append) setSearchState(state);
          },
          onPartialResults: (partial) => {
            if (!append) {
              setResults(partial);
              const totalCnt = (partial[0]?.metadata as any)?.totalCount || partial.length;
              setTotalMatches(totalCnt);
            }
          },
        });

        // Record history
        if (data.length > 0 && !append) {
          dictionaryCache.addHistory(trimmed, data[0].id, data[0].hanzi);
          setHistory(dictionaryCache.getHistory());
        }

        const totalCnt = (data[0]?.metadata as any)?.totalCount || data.length;
        setTotalMatches(totalCnt);

        if (append) {
          setResults((prev) => [...prev, ...data]);
        } else {
          setResults(data);
        }

        setOffset(newOffset);
        setHasMore(data.length === 30 && (newOffset + 30 < totalCnt));
      } catch (err) {
        console.warn('Search execution failed:', err);
        setSearchState('error');
      } finally {
        setIsLoading(false);
      }
    },
    [selectedHskLevel]
  );

  // Trigger debounced search when query changes
  useEffect(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    if (query.trim()) {
      debounceTimerRef.current = window.setTimeout(() => {
        executeSearch(query, 0, false);
      }, 250);
    } else {
      setResults([]);
      setSearchState('idle');
      setIsLoading(false);
      setHasMore(false);
      setTotalMatches(0);
    }

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query, executeSearch]);

  // Programmatic event listener for automated verification and quick links
  useEffect(() => {
    const handleDictSearch = (e: CustomEvent<{ query: string }>) => {
      if (typeof e.detail?.query === 'string') {
        setQuery(e.detail.query);
      }
    };
    window.addEventListener('yuyan:dict-search' as any, handleDictSearch);
    return () => window.removeEventListener('yuyan:dict-search' as any, handleDictSearch);
  }, []);

  // Load more results
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      executeSearch(query, offset + 30, true);
    }
  };

  // Play pronunciation via central AudioManager
  const handlePlayAudio = async (text: string) => {
    setActiveAudioText(text);
    try {
      await audioManager.playText(text, { lang: 'zh-CN', rate: 0.9 });
    } catch {
      showToast('Không thể phát âm thanh trên thiết bị này', 'error');
    } finally {
      setActiveAudioText(null);
    }
  };

  // Toggle Favorite
  const handleToggleFavorite = (item: DictionaryResult) => {
    const isNowFav = dictionaryCache.toggleFavorite(item.id);
    setFavorites(dictionaryCache.getFavorites());
    if (isNowFav) {
      showToast(`Đã lưu "${item.hanzi}" vào sổ tay`, 'success');
    } else {
      showToast(`Đã bỏ lưu "${item.hanzi}"`, 'info');
    }
  };

  // Clear search history
  const handleClearHistory = () => {
    dictionaryCache.clearHistory();
    setHistory([]);
    showToast('Đã xóa toàn bộ lịch sử tìm kiếm', 'info');
  };

  // Filtered results based on active tab
  const displayResults = useMemo(() => {
    if (activeTab === 'favorites') {
      return results.filter((r) => favorites.includes(r.id));
    }
    if (activeTab === 'hsk') {
      return results.filter((r) => r.hskLevel || (r.hskLevels && r.hskLevels.length > 0));
    }
    return results;
  }, [results, activeTab, favorites]);

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 bg-background pb-16">
      {/* Top Banner / Attribution Header */}
      <section className="bg-surface border-b border-border-subtle py-4 px-4 sm:px-8 shadow-2xs">
        <div className="max-w-5xl mx-auto space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary-soft text-primary">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                  Từ điển Hán – Việt Toàn diện
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-text-secondary mt-1">
                Tra cứu hơn <strong>122.000+</strong> từ ngữ &amp; cụm từ tiếng Trung hiện đại, liên kết giáo trình HSK 1–6 và bài khóa YUYAN.
              </p>
            </div>

            {/* Source & Attribution Badge */}
            <div className="flex items-center gap-2 bg-surface-secondary/70 px-3 py-1.5 rounded-2xl border border-border-subtle text-xs text-text-muted">
              <Info className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span>Nguồn: <strong>CVDICT</strong> (CC BY-SA 4.0 · Phong Phan)</span>
              <a
                href="https://github.com/ph0ngp/CVDICT"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline font-bold inline-flex items-center gap-0.5 ml-1"
                title="Xem mã nguồn mở CVDICT trên GitHub"
              >
                GitHub <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Search Box Input */}
          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-text-muted absolute left-4 pointer-events-none" />
              <input
                id="dict-search-input"
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (debounceTimerRef.current) window.clearTimeout(debounceTimerRef.current);
                    executeSearch(query, 0, false);
                  }
                }}
                placeholder="Nhập chữ Hán (你好), Pinyin (xuexi / xuéxí), hoặc tiếng Việt (học tập, xin chào)..."
                className="w-full pl-12 pr-28 py-3.5 sm:py-4 rounded-2xl bg-surface border border-border-subtle focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm sm:text-base font-medium text-text-primary placeholder:text-text-muted shadow-xs outline-none transition-all"
                autoFocus
              />

              <div className="absolute right-3 flex items-center gap-2">
                {query && (
                  <button
                    onClick={() => {
                      setQuery('');
                      searchInputRef.current?.focus();
                    }}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
                    title="Xóa tìm kiếm"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div className="hidden sm:flex items-center px-2 py-1 rounded-lg bg-surface-secondary border border-border-subtle text-[11px] font-bold text-text-muted">
                  Ctrl K
                </div>
              </div>
            </div>
          </div>

          {/* Quick Query Pills */}
          <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pt-1">
            <span className="text-[11px] font-bold text-text-muted uppercase whitespace-nowrap">
              Gợi ý tra cứu:
            </span>
            {SAMPLE_QUERIES.map((sample) => (
              <button
                key={sample}
                onClick={() => setQuery(sample)}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-surface-secondary hover:bg-primary-soft hover:text-primary text-text-secondary border border-border-subtle/80 transition-all whitespace-nowrap"
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main
        data-current-query={query}
        data-search-loading={isLoading ? 'true' : 'false'}
        className="max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-4 flex-1 flex flex-col min-h-0"
      >
        {/* Navigation Tabs & Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface hover:bg-surface-secondary text-text-secondary'
              }`}
            >
              Tất cả từ ({totalMatches > 0 ? totalMatches.toLocaleString() : results.length})
            </button>

            <button
              onClick={() => setActiveTab('hsk')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'hsk'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface hover:bg-surface-secondary text-text-secondary'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Chuẩn HSK</span>
            </button>

            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'favorites'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface hover:bg-surface-secondary text-text-secondary'
              }`}
            >
              <Star className="w-4 h-4" />
              <span>Đã lưu ({favorites.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface hover:bg-surface-secondary text-text-secondary'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Lịch sử</span>
            </button>
          </div>

          {/* Level Filter (when searching HSK) */}
          {activeTab === 'hsk' && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-text-muted font-medium">Cấp độ:</span>
              <select
                value={selectedHskLevel}
                onChange={(e) => setSelectedHskLevel(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="px-2 py-1 rounded-lg bg-surface border border-border-subtle text-text-primary text-xs font-bold"
              >
                <option value="all">Tất cả HSK</option>
                {[1, 2, 3, 4, 5, 6].map((lvl) => (
                  <option key={lvl} value={lvl}>
                    HSK {lvl}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Tab View: History */}
        {activeTab === 'history' ? (
          <div className="bg-surface rounded-3xl border border-border-subtle p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <h2 className="text-base font-bold text-text-primary">Lịch sử tra cứu gần đây</h2>
              </div>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-600 font-bold transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa lịch sử</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 text-text-muted text-sm">
                Chưa có lịch sử tra cứu nào được lưu.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {history.map((h, idx) => (
                  <button
                    key={`${h.query}-${idx}`}
                    onClick={() => {
                      setQuery(h.query);
                      setActiveTab('all');
                    }}
                    className="p-3 rounded-2xl bg-surface-secondary/50 border border-border-subtle hover:border-primary/50 text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <span className="font-hanzi text-base font-bold text-text-primary group-hover:text-primary">
                        {h.hanzi || h.query}
                      </span>
                      {h.hanzi && h.hanzi !== h.query && (
                        <p className="text-xs text-text-muted">Từ khóa: &ldquo;{h.query}&rdquo;</p>
                      )}
                    </div>
                    <Search className="w-4 h-4 text-text-muted group-hover:text-primary transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Tab View: Results List */
          <div className="space-y-4 flex-1">
            {/* Loading Indicator */}
            {isLoading && results.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-sm font-semibold text-text-muted">
                  Đang truy vấn hơn 122.000 mục từ CVDICT...
                </p>
              </div>
            )}

            {/* Empty State */}
            {!isLoading && query.trim() !== '' && displayResults.length === 0 && (
              <div className="text-center py-16 bg-surface rounded-3xl border border-border-subtle p-8 space-y-3 shadow-xs">
                <BookMarked className="w-10 h-10 text-text-muted mx-auto" />
                <h3 className="text-base font-bold text-text-primary">
                  Không tìm thấy kết quả phù hợp cho &ldquo;{query}&rdquo;
                </h3>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  Bạn có thể thử tìm bằng chữ Hán giản thể, phiên âm Pinyin không dấu (ví dụ: <code className="text-primary font-bold">xuexi</code>) hoặc từ đồng nghĩa tiếng Việt.
                </p>
              </div>
            )}

            {/* Results Grid / List */}
            {displayResults.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {displayResults.map((item) => {
                  const isFav = favorites.includes(item.id);
                  const isPlaying = activeAudioText === item.hanzi;
                  const hasDiffTrad = Boolean(item.traditional && item.traditional !== item.hanzi);

                  return (
                    <div
                      key={item.id}
                      data-testid="dict-card"
                      data-hanzi={item.hanzi}
                      className="bg-surface rounded-2xl sm:rounded-3xl border border-border-subtle p-4 sm:p-5 hover:border-primary/50 transition-all card-motion flex flex-col justify-between gap-3 shadow-2xs group"
                    >
                      {/* Card Header: Hanzi, Traditional, Pinyin & Badges */}
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-baseline gap-2.5 flex-wrap">
                              <span
                                onClick={() => setDetailItem(item)}
                                className="font-hanzi text-2xl sm:text-3xl font-bold text-text-primary hover:text-primary cursor-pointer transition-colors"
                              >
                                {item.hanzi}
                              </span>

                              {hasDiffTrad && (
                                <span className="font-hanzi text-xs text-text-muted bg-surface-secondary px-2 py-0.5 rounded-md border border-border-subtle" title="Chữ phồn thể">
                                  繁: {item.traditional}
                                </span>
                              )}

                              <span className="text-sm sm:text-base font-bold text-deep-blue">
                                {item.pinyin}
                              </span>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handlePlayAudio(item.hanzi)}
                              className={`p-2 rounded-xl transition-all ${
                                isPlaying
                                  ? 'bg-primary text-white scale-105'
                                  : 'bg-surface-secondary hover:bg-primary-soft text-text-secondary hover:text-primary'
                              }`}
                              title="Nghe phát âm chuẩn (zh-CN)"
                              aria-label={`Nghe phát âm ${item.hanzi}`}
                            >
                              <Volume2 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleToggleFavorite(item)}
                              className={`p-2 rounded-xl transition-all ${
                                isFav
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                                  : 'bg-surface-secondary text-text-muted hover:text-amber-500 hover:bg-amber-500/10'
                              }`}
                              title={isFav ? 'Bỏ lưu' : 'Lưu từ'}
                              aria-label="Lưu từ"
                            >
                              <Star className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                        </div>

                        {/* Meanings */}
                        <div className="text-sm text-text-secondary font-medium leading-relaxed">
                          {item.definitions && item.definitions.length > 0 ? (
                            <div className="space-y-1">
                              {item.definitions.slice(0, 3).map((def, idx) => (
                                <p key={idx} className="line-clamp-2">
                                  {item.definitions!.length > 1 && (
                                    <span className="font-bold text-text-muted mr-1.5">{idx + 1}.</span>
                                  )}
                                  {def.definitionVi || def.definition}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <p className="line-clamp-2">{item.vietnamese}</p>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Badges & Detail Trigger */}
                      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border-subtle/70">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary uppercase">
                            {item.source.type === 'cvdict' ? 'CVDICT' : item.source.type === 'hsk' ? 'Giáo trình HSK' : item.source.type === 'lesson' ? 'Bài khóa' : item.source.label || 'Từ điển'}
                          </span>
                          {item.hskLevel && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-soft text-secondary">
                              HSK {item.hskLevel}
                            </span>
                          )}
                          {item.hasEnglishLeakage && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                              Cần rà soát
                            </span>
                          )}
                        </div>

                        <button
                          data-testid="dict-card-detail-btn"
                          onClick={() => setDetailItem(item)}
                          className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1"
                        >
                          Chi tiết &amp; Bài học →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination / Load More Button */}
            {hasMore && (
              <div className="text-center pt-4 pb-6">
                <button
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-2xl bg-surface border border-border-subtle hover:border-primary text-text-primary text-xs sm:text-sm font-bold shadow-xs hover:bg-surface-secondary transition-all inline-flex items-center gap-2"
                >
                  {isLoading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                  <span>
                    Xem thêm kết quả (Đã tải {results.length} / {totalMatches.toLocaleString()} từ)
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Word Detail Modal */}
      {detailItem && (
        <DictionaryDetailModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onPlayAudio={handlePlayAudio}
          isFavorite={favorites.includes(detailItem.id)}
          onToggleFavorite={handleToggleFavorite}
          onOpenLesson={onOpenLesson}
          onOpenHanzi={onOpenHanzi}
          onOpenSpecialized={onOpenSpecialized}
          onAskGemini={(it) => {
            setDetailItem(null);
            setGeminiItem(it);
          }}
          isAudioPlaying={activeAudioText === detailItem.hanzi}
        />
      )}

      {/* Gemini AI Tutor Modal */}
      {geminiItem && (
        <GeminiTutorModal
          item={geminiItem}
          onClose={() => setGeminiItem(null)}
        />
      )}
    </div>
  );
};
