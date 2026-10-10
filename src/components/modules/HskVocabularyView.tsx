import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Volume2,
  CheckCircle2,
  Clock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Grid,
  List as ListIcon,
  X
} from 'lucide-react';
import {
  hskMasterService,
  HskFramework,
  HskListType,
  HskLearnerStatus,
  HskMasterEntry,
  HSK2_LEVELS,
  HSK3_LEVELS,
  COMMON_POS_OPTIONS
} from '../../services/hsk/hskMasterService';
import { HskWordDetailModal } from './hsk/HskWordDetailModal';
import { audioManager } from '../../services/audio/index';
import { useToast } from '../ui/Toast';

export interface HskVocabularyViewProps {
  initialFramework?: HskFramework;
  initialLevelCode?: string;
  onOpenLesson?: (lvl: number, num: number) => void;
  onOpenHanzi?: (char: string) => void;
  onOpenDictionary?: (word: string) => void;
}

const PAGE_SIZE = 24;

export const HskVocabularyView: React.FC<HskVocabularyViewProps> = ({
  initialFramework = 'hsk2',
  initialLevelCode = 'old-1',
  onOpenLesson,
  onOpenHanzi,
  onOpenDictionary,
}) => {
  const { showToast } = useToast();

  // Framework and Level Selection
  const [framework, setFramework] = useState<HskFramework>(initialFramework);
  const [levelCode, setLevelCode] = useState<string>(initialLevelCode);
  const [listType, setListType] = useState<HskListType>('exclusive');

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [posFilter, setPosFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<HskLearnerStatus>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Pagination & Data State
  const [items, setItems] = useState<HskMasterEntry[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);

  // Audio & Modal State
  const [activeAudioText, setActiveAudioText] = useState<string | null>(null);
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null);

  const debounceTimerRef = useRef<number | null>(null);

  // Active level list based on framework
  const currentLevels = framework === 'hsk2' ? HSK2_LEVELS : HSK3_LEVELS;

  // Handle switching framework
  const handleFrameworkChange = (newFramework: HskFramework) => {
    setFramework(newFramework);
    setLevelCode(newFramework === 'hsk2' ? 'old-1' : 'new-1');
    setPage(1);
  };

  // Fetch words with debounce for search
  const fetchWords = useCallback(async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * PAGE_SIZE;
      const res = await hskMasterService.searchWords({
        framework,
        levelCode: levelCode === 'all' ? null : levelCode,
        listType,
        query: searchQuery,
        pos: posFilter,
        status: statusFilter,
        limit: PAGE_SIZE,
        offset,
      });

      setItems(res.items);
      setTotalCount(res.totalCount);
    } catch (err) {
      console.error('Failed to search HSK words:', err);
      showToast('Không thể tải danh sách từ vựng HSK', 'error');
    } finally {
      setLoading(false);
    }
  }, [framework, levelCode, listType, searchQuery, posFilter, statusFilter, page, showToast]);

  // Trigger search on filter changes with debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(() => {
      fetchWords();
    }, 200);

    return () => {
      if (debounceTimerRef.current) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [fetchWords]);

  // Programmatic event listener for automated verification and quick links
  useEffect(() => {
    const handleHskSearch = (e: CustomEvent<{ query: string; framework?: HskFramework; levelCode?: string }>) => {
      if (typeof e.detail?.query === 'string') {
        if (e.detail.framework) setFramework(e.detail.framework);
        setLevelCode(e.detail.levelCode !== undefined ? e.detail.levelCode : 'all');
        setSearchQuery(e.detail.query);
        setPage(1);
      }
    };
    window.addEventListener('yuyan:hsk-search' as any, handleHskSearch);
    return () => window.removeEventListener('yuyan:hsk-search' as any, handleHskSearch);
  }, []);

  // Audio pronunciation playback
  const handlePlayAudio = async (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    setActiveAudioText(text);
    try {
      await audioManager.playText(text, { lang: 'zh-CN', rate: 0.9 });
    } catch {
      showToast('Không thể phát âm thanh trên thiết bị này', 'error');
    } finally {
      setActiveAudioText(null);
    }
  };

  // Quick learner status toggle on card
  const handleQuickStatusCycle = async (
    e: React.MouseEvent,
    entry: HskMasterEntry
  ) => {
    e.stopPropagation();
    const cycleMap: Record<string, 'new' | 'learning' | 'learned' | 'review'> = {
      new: 'learning',
      learning: 'learned',
      learned: 'review',
      review: 'new',
    };
    const nextStatus = cycleMap[entry.learner_status] || 'learning';

    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) =>
        item.id === entry.id ? { ...item, learner_status: nextStatus } : item
      )
    );

    try {
      await hskMasterService.updateLearnerStatus(entry.id, entry.simplified, nextStatus);
      showToast(`Đã chuyển "${entry.simplified}" sang "${getStatusLabel(nextStatus)}"`, 'success');
    } catch (err) {
      console.error('Quick status toggle failed:', err);
      // Revert on error
      setItems((prev) =>
        prev.map((item) =>
          item.id === entry.id ? { ...item, learner_status: entry.learner_status } : item
        )
      );
      showToast('Lỗi khi lưu trạng thái học', 'error');
    }
  };

  const getStatusLabel = (st: string) => {
    switch (st) {
      case 'learning':
        return 'Đang học';
      case 'learned':
        return 'Đã thuộc';
      case 'review':
        return 'Cần ôn';
      default:
        return 'Chưa học';
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'learning':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
            <Clock className="w-2.5 h-2.5" /> Đang học
          </span>
        );
      case 'learned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-2.5 h-2.5" /> Đã thuộc
          </span>
        );
      case 'review':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
            <RotateCcw className="w-2.5 h-2.5" /> Cần ôn
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-secondary text-text-muted border border-border-subtle">
            Mới
          </span>
        );
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-surface rounded-3xl p-6 sm:p-8 border border-border-subtle shadow-xs relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                HSK Chuẩn Hóa
              </span>
              <span className="text-xs text-text-muted font-medium">
                Nguồn: drkameleon/complete-hsk-vocabulary (MIT License)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-text-primary tracking-tight">
              Từ Vựng HSK 2.0 & HSK 3.0
            </h1>
            <p className="text-xs sm:text-sm text-text-secondary max-w-2xl leading-relaxed">
              Phân tách rành mạch hai hệ thống thi tiêu chuẩn HSK 2.0 (6 cấp độ, 4.991 từ) và HSK 3.0 (7 cấp độ, 10.969 từ).
              Bản địa hóa 100% tiếng Việt, liên kết trực tiếp bài khóa giáo trình và từ điển CVDICT.
            </p>
          </div>

          {/* Quick Stats Pill */}
          <div className="flex items-center gap-4 bg-surface-secondary/70 border border-border-subtle rounded-2xl p-4 flex-shrink-0">
            <div className="text-center">
              <div className="text-2xl font-black text-text-primary font-mono">{totalCount.toLocaleString()}</div>
              <div className="text-[10px] font-bold uppercase text-text-muted">Từ phù hợp</div>
            </div>
            <div className="w-px h-8 bg-divider-line" />
            <div className="text-center">
              <div className="text-2xl font-black text-primary font-mono">
                {framework === 'hsk2' ? '4.991' : '10.969'}
              </div>
              <div className="text-[10px] font-bold uppercase text-text-muted">
                {framework === 'hsk2' ? 'Tổng HSK 2.0' : 'Tổng HSK 3.0'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Framework Selector Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-divider-line pb-4">
        <div className="flex items-center p-1 bg-surface-secondary/80 rounded-2xl border border-border-subtle">
          <button
            data-testid="hsk-tab-hsk2"
            onClick={() => handleFrameworkChange('hsk2')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              framework === 'hsk2'
                ? 'bg-surface text-primary shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            HSK 2.0 (Hệ 6 Cấp độ • 4.991 từ)
          </button>
          <button
            data-testid="hsk-tab-hsk3"
            onClick={() => handleFrameworkChange('hsk3')}
            className={`px-4 sm:px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              framework === 'hsk3'
                ? 'bg-surface text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            HSK 3.0 (Tiêu chuẩn mới 2021 • 10.969 từ)
          </button>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-surface border border-border-subtle rounded-xl p-1 self-end sm:self-auto">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'grid' ? 'bg-primary-soft text-primary' : 'text-text-muted hover:text-text-primary'
            }`}
            title="Dạng lưới"
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-1.5 rounded-lg transition-colors ${
              viewMode === 'list' ? 'bg-primary-soft text-primary' : 'text-text-muted hover:text-text-primary'
            }`}
            title="Dạng danh sách"
          >
            <ListIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Level Selector Pills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Chọn cấp độ {framework === 'hsk2' ? 'HSK 2.0' : 'HSK 3.0'}
          </span>
          {levelCode !== 'all' && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-text-muted font-medium mr-1">Chế độ từ vựng:</span>
              <button
                onClick={() => {
                  setListType('exclusive');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  listType === 'exclusive'
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                Độc quyền (Riêng cấp này)
              </button>
              <button
                onClick={() => {
                  setListType('inclusive');
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors ${
                  listType === 'inclusive'
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                Tích lũy (Từ cấp 1 đến cấp này)
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            data-testid="hsk-level-all"
            onClick={() => {
              setLevelCode('all');
              setPage(1);
            }}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
              levelCode === 'all'
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
            }`}
          >
            <span>Tất cả cấp độ</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
              levelCode === 'all' ? 'bg-white/20 text-white' : 'bg-surface-secondary text-text-muted'
            }`}>
              {framework === 'hsk2' ? '4.991' : '10.969'}
            </span>
          </button>

          {currentLevels.map((lvl) => {
            const isSelected = levelCode === lvl.code;
            const count = listType === 'exclusive' ? lvl.exclusiveCount : lvl.cumulativeCount;
            return (
              <button
                key={lvl.code}
                onClick={() => {
                  setLevelCode(lvl.code);
                  setPage(1);
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                  isSelected
                    ? framework === 'hsk2'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-surface border-border-subtle text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                }`}
              >
                <span>{lvl.shortLabel}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-surface-secondary text-text-muted'
                }`}>
                  {count.toLocaleString()} từ
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface rounded-2xl p-3 sm:p-4 border border-border-subtle shadow-xs grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        {/* Search Input */}
        <div className="relative sm:col-span-5">
          <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            data-testid="hsk-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo chữ Hán, Pinyin hoặc nghĩa tiếng Việt..."
            className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-border-subtle bg-surface text-xs text-text-primary placeholder:text-text-muted focus:outline-hidden focus:ring-2 focus:ring-primary/30"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setPage(1);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* POS Filter */}
        <div className="sm:col-span-3">
          <select
            value={posFilter}
            onChange={(e) => {
              setPosFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-2.5 rounded-xl border border-border-subtle bg-surface text-xs text-text-primary focus:outline-hidden focus:ring-2 focus:ring-primary/30"
          >
            {COMMON_POS_OPTIONS.map((pos) => (
              <option key={pos.code} value={pos.code}>
                {pos.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-4 flex items-center gap-1.5 overflow-x-auto">
          {(
            [
              { code: 'all', label: 'Tất cả' },
              { code: 'new', label: 'Mới' },
              { code: 'learning', label: 'Đang học' },
              { code: 'learned', label: 'Đã thuộc' },
              { code: 'review', label: 'Cần ôn' },
            ] as const
          ).map((st) => (
            <button
              key={st.code}
              onClick={() => {
                setStatusFilter(st.code);
                setPage(1);
              }}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                statusFilter === st.code
                  ? 'bg-primary-soft text-primary font-bold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content: Word Cards Grid / List */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center gap-3 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-xs font-semibold">Đang truy vấn cơ sở dữ liệu từ vựng HSK...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="py-20 text-center bg-surface rounded-3xl border border-border-subtle p-8">
          <Search className="w-10 h-10 text-text-muted mx-auto mb-3 opacity-40" />
          <h3 className="text-base font-bold text-text-primary mb-1">Không tìm thấy từ vựng phù hợp</h3>
          <p className="text-xs text-text-secondary max-w-sm mx-auto mb-4">
            Thử điều chỉnh từ khóa tìm kiếm hoặc chọn cấp độ khác.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setPosFilter('all');
              setStatusFilter('all');
              setLevelCode('all');
            }}
            className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover transition-colors"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((entry) => (
            <div
              key={entry.id}
              data-testid="hsk-card"
              onClick={() => setSelectedEntryId(entry.id)}
              className="group bg-surface hover:bg-surface-secondary/40 border border-border-subtle hover:border-primary/40 rounded-2xl p-4 transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-sm flex flex-col justify-between gap-3 relative"
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-hanzi text-text-primary group-hover:text-primary transition-colors">
                      {entry.simplified}
                    </span>
                    {entry.traditional && entry.traditional !== entry.simplified && (
                      <span className="text-xs font-hanzi text-text-muted">
                        [{entry.traditional}]
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-mono font-medium text-primary mt-0.5">
                    {entry.pinyin}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => handlePlayAudio(e, entry.simplified)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-soft transition-colors"
                    title="Phát âm"
                  >
                    <Volume2 className={`w-4 h-4 ${activeAudioText === entry.simplified ? 'animate-pulse text-primary' : ''}`} />
                  </button>

                  <button
                    onClick={(e) => handleQuickStatusCycle(e, entry)}
                    className="transition-transform active:scale-95"
                    title="Nhấn để đổi trạng thái học"
                  >
                    {getStatusBadge(entry.learner_status)}
                  </button>
                </div>
              </div>

              {/* Card Meanings */}
              <div className="flex-1">
                <p className="text-xs text-text-secondary font-medium line-clamp-2 leading-relaxed">
                  {entry.meanings_vi && entry.meanings_vi.length > 0
                    ? entry.meanings_vi.join('; ')
                    : entry.meanings_en?.join('; ') || 'Đang cập nhật nghĩa...'}
                </p>
              </div>

              {/* Card Footer Badges */}
              <div className="flex items-center justify-between pt-2 border-t border-divider-line text-[11px] text-text-muted">
                <div className="flex items-center gap-1">
                  {entry.pos_vi && entry.pos_vi.length > 0 ? (
                    <span className="px-1.5 py-0.5 rounded bg-surface-secondary text-[10px] font-semibold">
                      {entry.pos_vi[0]}
                    </span>
                  ) : null}
                  {entry.radical ? (
                    <span className="text-[10px] font-mono text-text-muted">
                      Bộ {entry.radical}
                    </span>
                  ) : null}
                </div>

                <span
                  data-testid="hsk-detail-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEntryId(entry.id);
                  }}
                  className="text-[11px] font-bold text-primary group-hover:underline flex items-center gap-0.5"
                >
                  Chi tiết &gt;
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List Mode View */
        <div className="bg-surface rounded-2xl border border-border-subtle divide-y divide-divider-line overflow-hidden shadow-2xs">
          {items.map((entry) => (
            <div
              key={entry.id}
              onClick={() => setSelectedEntryId(entry.id)}
              className="p-3.5 sm:px-5 flex items-center justify-between gap-4 hover:bg-surface-secondary/40 transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-16 flex-shrink-0">
                  <span className="text-xl font-black font-hanzi text-text-primary group-hover:text-primary transition-colors">
                    {entry.simplified}
                  </span>
                  {entry.traditional && entry.traditional !== entry.simplified && (
                    <span className="text-[11px] font-hanzi text-text-muted ml-1">
                      [{entry.traditional}]
                    </span>
                  )}
                </div>

                <div className="w-24 flex-shrink-0 text-xs font-mono font-medium text-primary">
                  {entry.pinyin}
                </div>

                <div className="flex-1 min-w-0 text-xs text-text-secondary truncate">
                  {entry.meanings_vi && entry.meanings_vi.length > 0
                    ? entry.meanings_vi.join('; ')
                    : entry.meanings_en?.join('; ')}
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {entry.pos_vi && entry.pos_vi.length > 0 && (
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-secondary text-text-muted">
                    {entry.pos_vi[0]}
                  </span>
                )}

                <button
                  onClick={(e) => handlePlayAudio(e, entry.simplified)}
                  className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-primary-soft transition-colors"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <button
                  onClick={(e) => handleQuickStatusCycle(e, entry)}
                  className="transition-transform active:scale-95"
                >
                  {getStatusBadge(entry.learner_status)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-divider-line">
          <div className="text-xs text-text-muted">
            Trang <span className="font-bold text-text-primary">{page}</span> / {totalPages} (Tổng{' '}
            <span className="font-bold text-text-primary">{totalCount.toLocaleString()}</span> từ)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="px-3 py-2 rounded-xl border border-border-subtle bg-surface text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 shadow-2xs"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Trước</span>
            </button>

            <span className="text-xs font-bold px-2 py-1 bg-surface-secondary rounded-lg font-mono">
              {page}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="px-3 py-2 rounded-xl border border-border-subtle bg-surface text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1 shadow-2xs"
            >
              <span>Sau</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedEntryId && (
        <HskWordDetailModal
          entryId={selectedEntryId}
          onClose={() => setSelectedEntryId(null)}
          onOpenLesson={onOpenLesson}
          onOpenHanzi={onOpenHanzi}
          onOpenDictionary={onOpenDictionary}
          onStatusChanged={(id, newStatus) => {
            setItems((prev) =>
              prev.map((item) => (item.id === id ? { ...item, learner_status: newStatus } : item))
            );
          }}
        />
      )}
    </div>
  );
};
