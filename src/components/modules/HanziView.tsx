import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Volume2,
  Layers,
  Eraser,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Eye,
  EyeOff,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';
import { hanziRepository } from '../../data/repositories/hanziRepository';
import { radicalRepository } from '../../data/repositories/radicalRepository';
import { CanonicalHanzi } from '../../data/models/hanzi';
import { audioManager } from '../../services/audio';
import { useToast } from '../ui/Toast';
import { HanziStrokeWriter } from '../hanzi/HanziStrokeWriter.tsx';

interface HanziViewProps {
  initialChar?: string;
  onOpenWord?: (word: string) => void;
  onOpenRadical?: (radicalNum: number) => void;
}

const PAGE_SIZE = 48;

export const HanziView: React.FC<HanziViewProps> = ({
  initialChar = '学',
  onOpenWord,
  onOpenRadical,
}) => {
  const { showToast } = useToast();

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<number | 'all'>('all');
  const [selectedRadical, setSelectedRadical] = useState<number | 'all'>('all');
  const [strokeRange, setStrokeRange] = useState<'all' | '1-4' | '5-8' | '9-12' | '13+'>('all');

  // Pagination & Server Results
  const [characters, setCharacters] = useState<CanonicalHanzi[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active Character selection & detail
  const [selectedChar, setSelectedChar] = useState<string>(initialChar);
  const [activeHanzi, setActiveHanzi] = useState<CanonicalHanzi | null>(null);

  // Practice Mode state
  const [practiceTab, setPracticeTab] = useState<'stroke_writer' | 'freehand'>('stroke_writer');
  const [showGhostGuide, setShowGhostGuide] = useState<boolean>(true);

  // Canvas drawing state
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);

  // Radicals list for filter
  const allRadicals = useMemo(() => radicalRepository.getAll(), []);

  // Stroke range helper
  const strokeLimits = useMemo(() => {
    switch (strokeRange) {
      case '1-4': return { min: 1, max: 4 };
      case '5-8': return { min: 5, max: 8 };
      case '9-12': return { min: 9, max: 12 };
      case '13+': return { min: 13, max: 64 };
      default: return { min: undefined, max: undefined };
    }
  }, [strokeRange]);

  // Load Active Character data
  useEffect(() => {
    let isMounted = true;
    const local = hanziRepository.getByChar(selectedChar);
    if (local) {
      setActiveHanzi(local);
    } else {
      hanziRepository.fetchByChar(selectedChar).then((fetched) => {
        if (isMounted && fetched) {
          setActiveHanzi(fetched);
        }
      });
    }
    return () => { isMounted = false; };
  }, [selectedChar]);

  // Perform Server Search
  const fetchCharacters = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await hanziRepository.searchServer({
        query: searchQuery.trim(),
        hskLevel: selectedLevel === 'all' ? undefined : selectedLevel,
        radicalNumber: selectedRadical === 'all' ? undefined : selectedRadical,
        minStrokes: strokeLimits.min,
        maxStrokes: strokeLimits.max,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      });

      setCharacters(res.characters);
      setTotalCount(res.total);

      // If activeHanzi is null and we have results, set the first one
      if (!activeHanzi && res.characters.length > 0) {
        setSelectedChar(res.characters[0].char);
        setActiveHanzi(res.characters[0]);
      }
    } catch (err) {
      console.error('Error fetching characters:', err);
      showToast('Lỗi khi tải danh sách Hán tự', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedLevel, selectedRadical, strokeLimits, page, activeHanzi, showToast]);

  // Reset page to 0 when filters change
  useEffect(() => {
    setPage(0);
  }, [searchQuery, selectedLevel, selectedRadical, strokeRange]);

  // Fetch when filters or page change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCharacters();
    }, 150);
    return () => clearTimeout(timer);
  }, [fetchCharacters]);

  // Connected Radical entity
  const connectedRadical = useMemo(() => {
    if (!activeHanzi) return undefined;
    return radicalRepository.getByNumber(activeHanzi.radicalNumber);
  }, [activeHanzi]);

  // Audio pronunciation
  const handlePlayAudio = (char: string) => {
    audioManager.playText(char, { entityType: 'hanzi', entityId: `hanzi_${char}` });
  };

  // Canvas Drawing: Tian Zi Ge grid helper
  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.clearRect(0, 0, width, height);

    // Tian Zi Ge grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);

    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();

    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    // Diagonal lines for Mi Zi Ge (米字格)
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();

    ctx.setLineDash([]);
  }, []);

  // Initialize Canvas when character changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGrid(ctx, canvas.width, canvas.height);
    setDrawingHistory([]);
  }, [selectedChar, drawGrid]);

  const saveCanvasState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const state = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setDrawingHistory((prev) => [...prev.slice(-15), state]);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    saveCanvasState();
    setIsDrawing(true);

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 14;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const undoLastStroke = () => {
    const canvas = canvasRef.current;
    if (!canvas || drawingHistory.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const previousState = drawingHistory[drawingHistory.length - 1];
    setDrawingHistory((prev) => prev.slice(0, -1));
    ctx.putImageData(previousState, 0, 0);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawGrid(ctx, canvas.width, canvas.height);
    setDrawingHistory([]);
    showToast('Đã xóa bảng tập viết', 'info');
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-xs space-y-5 card-motion light-beam-shimmer">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-secondary to-coral-soft text-white flex items-center justify-center font-hanzi font-bold text-2xl shadow-sm flex-shrink-0">
              字
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary tracking-tight">
                  Kho Hán tự Chuẩn hóa (汉字)
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-secondary/15 text-secondary">
                  {totalCount.toLocaleString()} chữ Hán
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-primary/10 text-primary">
                  214 Bộ thủ Khang Hy
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Tra cứu chi tiết từng chữ Hán, chiết tự, âm Hán-Việt, số nét, thứ tự nét hoạt họa và bảng viết tay
              </p>
            </div>
          </div>
        </div>

        {/* 2. Search & Multi-Filters Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
          {/* Search Input (5 cols) */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              data-testid="hanzi-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm chữ (学, 你), Pinyin (xue), Hán-Việt (học, sinh)..."
              className="w-full pl-10 pr-9 py-2.5 bg-input-bg border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-inner"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary p-0.5"
                title="Xóa tìm kiếm"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* HSK Level Filter (3 cols) */}
          <div className="md:col-span-3 flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setSelectedLevel('all')}
              className={`px-2.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                selectedLevel === 'all'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              Tất cả HSK
            </button>
            {[1, 2, 3, 4, 5, 6].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setSelectedLevel(lvl)}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  selectedLevel === lvl
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                }`}
              >
                HSK {lvl}
              </button>
            ))}
          </div>

          {/* Radical Filter Dropdown (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={selectedRadical}
              onChange={(e) => setSelectedRadical(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="w-full py-2.5 px-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="all">Tất cả Bộ thủ (214)</option>
              {allRadicals.map((r) => (
                <option key={r.radicalNumber} value={r.radicalNumber}>
                  #{r.radicalNumber} {r.char} - {r.nameVi}
                </option>
              ))}
            </select>
          </div>

          {/* Stroke Count Filter (2 cols) */}
          <div className="md:col-span-2">
            <select
              value={strokeRange}
              onChange={(e) => setStrokeRange(e.target.value as any)}
              className="w-full py-2.5 px-3 bg-surface-secondary border border-border-subtle rounded-xl text-xs font-medium text-text-primary focus:outline-none focus:border-primary"
            >
              <option value="all">Số nét: Tất cả</option>
              <option value="1-4">1 – 4 nét</option>
              <option value="5-8">5 – 8 nét</option>
              <option value="9-12">9 – 12 nét</option>
              <option value="13+">13+ nét</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Character Grid Arena & Pagination (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
              Danh mục ({totalCount.toLocaleString()} chữ)
            </span>
            <div className="flex items-center gap-1 text-xs text-text-secondary">
              <span>Trang {page + 1} / {totalPages}</span>
              <div className="flex items-center gap-0.5 ml-2">
                <button
                  disabled={page === 0 || isLoading}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="p-1 rounded-lg border border-border-subtle bg-surface hover:bg-surface-secondary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Trang trước"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  disabled={page >= totalPages - 1 || isLoading}
                  onClick={() => setPage((p) => p + 1)}
                  className="p-1 rounded-lg border border-border-subtle bg-surface hover:bg-surface-secondary disabled:opacity-30 disabled:pointer-events-none transition-colors"
                  title="Trang sau"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Character Matrix */}
          <div className="bg-surface rounded-2xl border border-border-subtle p-3 min-h-[520px] max-h-[660px] overflow-y-auto custom-scrollbar">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-80 space-y-2 text-text-muted">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">Đang nạp Hán tự...</span>
              </div>
            ) : characters.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-80 space-y-2 text-text-muted p-6 text-center">
                <BookOpen className="w-8 h-8 opacity-40 mb-1" />
                <span className="text-xs font-semibold text-text-primary">Không tìm thấy Hán tự phù hợp</span>
                <span className="text-[11px] text-text-secondary">
                  Thử đổi từ khóa hoặc đặt lại bộ lọc HSK / Bộ thủ
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {characters.map((h) => {
                  const isSelected = (activeHanzi?.char || selectedChar) === h.char;
                  return (
                    <button
                      key={h.char}
                      data-testid="hanzi-grid-item"
                      onClick={() => {
                        setSelectedChar(h.char);
                        setActiveHanzi(h);
                      }}
                      className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-primary-soft text-primary font-bold border-primary shadow-xs ring-2 ring-primary/20 scale-105'
                          : 'bg-surface hover:bg-surface-secondary text-text-primary border-border-subtle hover:border-primary/40'
                      }`}
                    >
                      <span className="font-hanzi text-2xl">{h.char}</span>
                      <span className="text-[10px] text-deep-blue font-medium mt-0.5 truncate max-w-full">
                        {h.pinyin[0] || ''}
                      </span>
                      {h.hanViet && (
                        <span className="text-[9px] text-text-muted uppercase truncate max-w-full">
                          {h.hanViet}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Character Master Details & Practice Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {activeHanzi ? (
            <div className="space-y-5">
              {/* Character Identity Card */}
              <div className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Big Hanzi & Main Info */}
                  <div className="flex items-start gap-4">
                    <div className="w-20 h-20 rounded-2xl bg-surface-secondary border border-border-subtle flex items-center justify-center font-hanzi font-bold text-5xl text-primary shadow-inner flex-shrink-0">
                      {activeHanzi.char}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xl sm:text-2xl font-bold text-text-primary font-hanzi">
                          {activeHanzi.char}
                        </span>
                        {activeHanzi.traditional && activeHanzi.traditional !== activeHanzi.char && (
                          <span className="text-xs px-2 py-0.5 rounded-lg bg-surface-secondary text-text-secondary border border-border-subtle">
                            Phồn thể: <span className="font-hanzi font-bold">{activeHanzi.traditional}</span>
                          </span>
                        )}
                        {activeHanzi.hanViet && (
                          <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 uppercase">
                            Hán-Việt: {activeHanzi.hanViet}
                          </span>
                        )}
                        {activeHanzi.hskLevels && activeHanzi.hskLevels.length > 0 && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-secondary-soft text-secondary">
                            HSK {activeHanzi.hskLevels.join(', ')}
                          </span>
                        )}
                      </div>

                      {/* Pinyin with Audio */}
                      <div className="flex items-center gap-2">
                        <span className="text-base sm:text-lg font-bold text-deep-blue">
                          {activeHanzi.pinyin.join(', ')}
                        </span>
                        <button
                          onClick={() => handlePlayAudio(activeHanzi.char)}
                          className="p-1.5 rounded-xl bg-primary-soft text-primary hover:bg-primary hover:text-white transition-colors"
                          title="Phát âm chữ Hán"
                          aria-label="Phát âm chữ Hán"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Vietnamese Meaning */}
                      <p className="text-xs sm:text-sm font-semibold text-text-primary pt-0.5">
                        {activeHanzi.meanings.join('; ')}
                      </p>
                    </div>
                  </div>

                  {/* Radical & Stroke Count Stats */}
                  <div className="flex sm:flex-col gap-2 flex-wrap text-right">
                    <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-subtle text-left sm:text-right">
                      <span className="text-[10px] text-text-muted block">Bộ thủ</span>
                      <button
                        onClick={() => {
                          if (onOpenRadical) onOpenRadical(activeHanzi.radicalNumber);
                          else setSelectedRadical(activeHanzi.radicalNumber);
                        }}
                        className="font-bold text-xs text-primary hover:underline flex items-center gap-1 sm:justify-end"
                      >
                        <span className="font-hanzi text-sm">{activeHanzi.radical}</span>
                        <span>#{activeHanzi.radicalNumber}</span>
                        {connectedRadical && <span>({connectedRadical.nameVi})</span>}
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-surface-secondary border border-border-subtle text-left sm:text-right">
                      <span className="text-[10px] text-text-muted block">Số nét & Cấu trúc</span>
                      <span className="font-bold text-xs text-text-primary">
                        {activeHanzi.strokeCount} nét · {activeHanzi.structureNameVi}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Decomposition & Memory Mnemonic */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-subtle/80 text-xs">
                  <div className="p-3 rounded-xl bg-surface-secondary/60 border border-border-subtle/60 space-y-1">
                    <div className="flex items-center gap-1.5 text-text-muted font-bold text-[11px] uppercase tracking-wider">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Chiết tự (Cấu tạo chữ)</span>
                    </div>
                    <p className="font-hanzi text-sm font-bold text-text-primary">
                      {activeHanzi.decomposition}
                    </p>
                  </div>

                  {activeHanzi.mnemonic ? (
                    <div className="p-3 rounded-xl bg-primary-soft/40 border border-primary/20 space-y-1">
                      <div className="flex items-center gap-1.5 text-primary font-bold text-[11px] uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Mẹo ghi nhớ</span>
                      </div>
                      <p className="text-text-secondary text-xs italic">
                        {activeHanzi.mnemonic}
                      </p>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-surface-secondary/60 border border-border-subtle/60 space-y-1">
                      <div className="flex items-center gap-1.5 text-text-muted font-bold text-[11px] uppercase tracking-wider">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Cấu trúc</span>
                      </div>
                      <p className="text-text-secondary text-xs">
                        {activeHanzi.structureNameVi}
                      </p>
                    </div>
                  )}
                </div>

                {/* Connected Words in HSK & Specialized */}
                {activeHanzi.vocabularyIds && activeHanzi.vocabularyIds.length > 0 && (
                  <div className="pt-2 border-t border-border-subtle/80 space-y-2">
                    <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider block">
                      Từ vựng chứa chữ &ldquo;{activeHanzi.char}&rdquo; ({activeHanzi.vocabularyIds.length} từ):
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {activeHanzi.vocabularyIds.map((vocabWord, idx) => (
                        <button
                          key={`${vocabWord}-${idx}`}
                          onClick={() => {
                            if (onOpenWord) onOpenWord(vocabWord);
                          }}
                          className="px-2.5 py-1 rounded-xl bg-surface-secondary hover:bg-primary-soft text-text-primary hover:text-primary border border-border-subtle text-xs font-medium font-hanzi transition-colors flex items-center gap-1"
                          title="Tra cứu từ này trong Từ điển"
                        >
                          <span>{vocabWord}</span>
                          <ExternalLink className="w-3 h-3 opacity-60" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Practice Arena: Stroke Order Animation & Freehand Canvas */}
              <div className="bg-surface rounded-3xl border border-border-subtle p-6 shadow-xs space-y-4">
                {/* Practice Mode Switcher */}
                <div className="flex items-center justify-between border-b border-border-subtle pb-3 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPracticeTab('stroke_writer')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        practiceTab === 'stroke_writer'
                          ? 'bg-primary text-white shadow-2xs'
                          : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Thứ tự nét hoạt họa
                    </button>
                    <button
                      onClick={() => setPracticeTab('freehand')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        practiceTab === 'freehand'
                          ? 'bg-primary text-white shadow-2xs'
                          : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      Bảng tập viết tay tự do
                    </button>
                  </div>

                  <span className="text-[11px] text-text-muted">
                    {practiceTab === 'stroke_writer'
                      ? 'Nạp dữ liệu vector nét tự động'
                      : 'Lưới Điền Tự Cách (田字格)'}
                  </span>
                </div>

                {/* Tab 1: HanziStrokeWriter */}
                {practiceTab === 'stroke_writer' ? (
                  <div className="flex flex-col items-center justify-center p-4">
                    <HanziStrokeWriter
                      character={activeHanzi.char}
                      size={280}
                      showControls={true}
                    />
                  </div>
                ) : (
                  /* Tab 2: Freehand Tian Zi Ge Canvas */
                  <div className="flex flex-col items-center space-y-4 p-2">
                    <div className="relative border-2 border-border-subtle rounded-2xl overflow-hidden bg-white shadow-inner flex items-center justify-center">
                      {/* Ghost Guide Character */}
                      {showGhostGuide && (
                        <div className="absolute inset-0 flex items-center justify-center font-hanzi text-8xl text-slate-200/50 pointer-events-none select-none">
                          {activeHanzi.char}
                        </div>
                      )}

                      <canvas
                        ref={canvasRef}
                        width={280}
                        height={280}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="touch-none cursor-crosshair z-10"
                      />
                    </div>

                    {/* Canvas Controls */}
                    <div className="flex items-center gap-2 flex-wrap justify-center text-xs">
                      <button
                        onClick={undoLastStroke}
                        disabled={drawingHistory.length === 0}
                        className="px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-border-subtle disabled:opacity-40 text-text-secondary font-bold flex items-center gap-1.5 transition-colors"
                        title="Hoàn tác nét vừa vẽ"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Hoàn tác</span>
                      </button>

                      <button
                        onClick={clearCanvas}
                        className="px-3 py-1.5 rounded-xl bg-surface-secondary hover:bg-rose-500/10 hover:text-rose-600 text-text-secondary font-bold flex items-center gap-1.5 transition-colors"
                        title="Xóa toàn bộ nét"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span>Xóa bảng</span>
                      </button>

                      <button
                        onClick={() => setShowGhostGuide((v) => !v)}
                        className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition-colors ${
                          showGhostGuide
                            ? 'bg-primary-soft text-primary'
                            : 'bg-surface-secondary text-text-secondary'
                        }`}
                        title="Bật/tắt chữ mẫu mờ"
                      >
                        {showGhostGuide ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        <span>Chữ mẫu mờ</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-surface rounded-3xl border border-border-subtle p-12 text-center text-text-muted">
              <BookOpen className="w-10 h-10 opacity-30 mx-auto mb-2" />
              <p className="text-xs">Chọn một chữ Hán ở danh sách bên trái để xem chi tiết</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
