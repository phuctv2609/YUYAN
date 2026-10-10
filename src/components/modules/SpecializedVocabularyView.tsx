import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Building2,
  TrendingUp,
  Ship,
  Truck,
  Factory,
  Cog,
  Zap,
  Bot,
  Code,
  Brain,
  DollarSign,
  Scale,
  Users,
  Megaphone,
  HardHat,
  FlaskConical,
  Microscope,
  Stethoscope,
  GraduationCap,
  Hotel,
  Car,
  Wheat,
  Leaf,
  Palette,
  Trophy,
  Radio,
  Search,
  Volume2,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Briefcase,
  Layers,
  Sparkle,
} from 'lucide-react';
import {
  specializedRepository,
  SpecializedDomain,
  SpecializedCategory,
  SpecializedTerm,
} from '../../data/repositories/specializedRepository';
import { audioManager } from '../../services/audio/audioManager';
import { DictionaryResult } from '../../services/dictionary/dictionaryTypes';
import { DictionaryDetailModal } from './dictionary/DictionaryDetailModal';
import { GeminiTutorModal } from './dictionary/GeminiTutorModal';
import { dictionaryCache } from '../../services/dictionary/dictionaryCache';
import { useToast } from '../ui/Toast';

// Icon mapping for all 26 real industries
const INDUSTRY_ICON_MAP: Record<string, React.ElementType> = {
  van_phong_doanh_nghiep: Building2,
  kinh_doanh_thuong_mai: TrendingUp,
  xuat_nhap_khau: Ship,
  logistics_chuoi_cung_ung: Truck,
  san_xuat_nha_may: Factory,
  co_khi_che_tao: Cog,
  dien_dien_tu: Zap,
  tu_dong_hoa_robot: Bot,
  cntt_phan_mem: Code,
  ai_du_lieu_cong_nghe_moi: Brain,
  tai_chinh_ke_toan_ngan_hang: DollarSign,
  luat_phap_ly: Scale,
  nhan_su: Users,
  marketing_truyen_thong: Megaphone,
  xay_dung_kien_truc: HardHat,
  hoa_hoc_vat_lieu: FlaskConical,
  khoa_hoc_nghien_cuu: Microscope,
  y_te_duoc: Stethoscope,
  giao_duc_hoc_thuat: GraduationCap,
  du_lich_khach_san_nha_hang: Hotel,
  o_to_giao_thong: Car,
  nong_nghiep_thuc_pham: Wheat,
  moi_truong_nang_luong: Leaf,
  thiet_ke_nghe_thuat_thoi_trang: Palette,
  the_thao: Trophy,
  vien_thong_mang: Radio,
};

const PAGE_SIZE = 24;

export const SpecializedVocabularyView: React.FC = () => {
  const { showToast } = useToast();

  // 1. Industries / Domains state
  const [domains, setDomains] = useState<SpecializedDomain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string>('van_phong_doanh_nghiep');
  const [industrySearch, setIndustrySearch] = useState<string>('');

  // 2. Subcategories state
  const [categories, setCategories] = useState<SpecializedCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  // 3. Terms & Pagination state
  const [terms, setTerms] = useState<SpecializedTerm[]>([]);
  const [totalTerms, setTotalTerms] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 4. Audio & Modals state
  const [activeSpeechId, setActiveSpeechId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<DictionaryResult | null>(null);
  const [geminiItem, setGeminiItem] = useState<DictionaryResult | null>(null);
  const [favorites, setFavorites] = useState<string[]>(() => dictionaryCache.getFavorites());

  // Load all 26 industries on mount
  useEffect(() => {
    let isMounted = true;
    async function loadIndustries() {
      setIsLoading(true);
      const list = await specializedRepository.getDomains();
      if (isMounted) {
        setDomains(list);
        if (list.length > 0 && !selectedDomainId) {
          setSelectedDomainId(list[0].id);
        }
        setIsLoading(false);
      }
    }
    loadIndustries();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load subcategories when selected domain changes
  useEffect(() => {
    let isMounted = true;
    async function loadSubcategories() {
      if (!selectedDomainId || selectedDomainId === 'all') {
        setCategories([]);
        setSelectedCategoryId('all');
        return;
      }
      const catList = await specializedRepository.getCategories(selectedDomainId);
      if (isMounted) {
        setCategories(catList);
        setSelectedCategoryId('all');
        setCurrentPage(1);
      }
    }
    loadSubcategories();
    return () => {
      isMounted = false;
    };
  }, [selectedDomainId]);

  // Reset page when search or subcategory changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategoryId, searchQuery]);

  // Server-side fetch terms when filters or page change
  useEffect(() => {
    let isMounted = true;
    async function loadVocabulary() {
      setIsLoading(true);
      const offset = (currentPage - 1) * PAGE_SIZE;
      try {
        const res = await specializedRepository.getTerms({
          domainId: selectedDomainId === 'all' ? undefined : selectedDomainId,
          categoryId: selectedCategoryId === 'all' ? undefined : selectedCategoryId,
          query: searchQuery.trim(),
          limit: PAGE_SIZE,
          offset,
        });

        if (isMounted) {
          setTerms(res.terms);
          setTotalTerms(res.total);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    const timer = setTimeout(loadVocabulary, 120);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [selectedDomainId, selectedCategoryId, searchQuery, currentPage]);

  const currentDomain = useMemo(() => {
    if (selectedDomainId === 'all') return null;
    return domains.find((d) => d.id === selectedDomainId) || null;
  }, [domains, selectedDomainId]);

  const filteredDomains = useMemo(() => {
    if (!industrySearch.trim()) return domains;
    const q = industrySearch.toLowerCase().trim();
    return domains.filter(
      (d) =>
        d.nameVi.toLowerCase().includes(q) ||
        d.nameZh.toLowerCase().includes(q) ||
        (d.nameEn && d.nameEn.toLowerCase().includes(q))
    );
  }, [domains, industrySearch]);

  const totalPages = Math.max(1, Math.ceil(totalTerms / PAGE_SIZE));

  const handlePlayAudio = useCallback((term: SpecializedTerm) => {
    setActiveSpeechId(term.id);
    audioManager.playText(term.hanzi, {
      id: `specialized_${term.id}`,
      entityType: 'vocabulary',
      entityId: term.id,
      pinyin: term.pinyin,
    });
    setTimeout(() => {
      setActiveSpeechId((curr) => (curr === term.id ? null : curr));
    }, 1200);
  }, []);

  const termToDictResult = useCallback(
    (term: SpecializedTerm): DictionaryResult => {
      const examples = [];
      if (term.sampleSentenceZh) {
        examples.push({
          zh: term.sampleSentenceZh,
          pinyin: term.sampleSentencePinyin || undefined,
          vi: term.sampleSentenceVi || undefined,
        });
      }

      return {
        id: `prof_${term.id}`,
        hanzi: term.hanzi,
        simplified: term.hanzi,
        traditional: term.traditional,
        pinyin: term.pinyin,
        vietnamese: term.vietnamese,
        hanViet: term.hanViet,
        wordType: term.partOfSpeech || '专业词组',
        professionalDomains: [term.domainId],
        professionalCategories: [term.categoryId],
        subcategory: term.subcategory,
        definitions: [
          {
            definition: term.vietnamese,
            definitionVi: term.vietnamese,
            wordType: term.partOfSpeech || '专业词组',
            examples,
          },
        ],
        examples,
        collocations: term.collocations || [],
        synonyms: term.synonyms || [],
        antonyms: term.antonyms || [],
        relatedTerms: term.relatedTerms || [],
        source: {
          type: 'professional',
          provider: 'YUYAN Từ vựng Chuyên ngành (10.000 thuật ngữ)',
          label: `Chuyên ngành · ${term.industry || currentDomain?.nameVi || ''}`,
          version: '2.0.0',
        },
        isInternal: true,
        isApproved: true,
      };
    },
    [currentDomain]
  );

  const handleToggleFavorite = (term: SpecializedTerm) => {
    const dictResult = termToDictResult(term);
    const isNowFav = dictionaryCache.toggleFavoriteItem(dictResult);
    setFavorites(dictionaryCache.getFavorites());
    showToast(
      isNowFav ? `Đã lưu "${term.hanzi}" vào sổ tay từ vựng` : `Đã bỏ lưu "${term.hanzi}" khỏi sổ tay`,
      'info'
    );
  };

  const getIndustryIcon = (slug: string) => {
    return INDUSTRY_ICON_MAP[slug] || Briefcase;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* 1. HERO BANNER */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-surface to-surface-secondary border border-border-subtle rounded-3xl p-6 sm:p-8 shadow-sm">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DỮ LIỆU THỰC TẾ · 26 LĨNH VỰC · 10.000 THUẬT NGỮ</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-text-primary tracking-tight">
              Từ Vựng Tiếng Trung Chuyên Ngành
            </h1>
            <p className="text-sm sm:text-base text-text-secondary max-w-3xl leading-relaxed">
              Hệ thống 10.000 từ vựng và cụm từ chuyên môn thực tế chuẩn hóa từ 26 lĩnh vực then chốt: xuất nhập khẩu,
              sản xuất chế tạo, CNTT, AI, tự động hóa, tài chính ngân hàng, logistics, pháp lý, y tế và nhiều ngành công nghiệp khác.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
            <div className="bg-surface/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-border-subtle text-center">
              <div className="text-xs text-text-muted font-medium">Lĩnh vực</div>
              <div className="text-xl font-extrabold text-primary">26</div>
            </div>
            <div className="bg-surface/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-border-subtle text-center">
              <div className="text-xs text-text-muted font-medium">Chủ đề con</div>
              <div className="text-xl font-extrabold text-text-primary">500</div>
            </div>
            <div className="bg-surface/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-border-subtle text-center col-span-2 sm:col-span-1">
              <div className="text-xs text-text-muted font-medium">Tổng thuật ngữ</div>
              <div data-testid="spec-total-count" className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                10.000
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. REAL 26 INDUSTRIES EXPLORER */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-text-primary">26 Lĩnh Vực Chuyên Ngành Thực Tế</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-surface-secondary text-text-muted border border-border-subtle font-medium">
              {filteredDomains.length} / {domains.length}
            </span>
          </div>

          {/* Fast industry filter input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={industrySearch}
              onChange={(e) => setIndustrySearch(e.target.value)}
              placeholder="Lọc nhanh ngành nghề..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl text-xs bg-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary"
            />
          </div>
        </div>

        {/* 26 Industries Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
          {filteredDomains.map((dom) => {
            const Icon = getIndustryIcon(dom.id);
            const isSelected = dom.id === selectedDomainId;
            return (
              <button
                key={dom.id}
                data-testid={`industry-card-${dom.id}`}
                onClick={() => setSelectedDomainId(dom.id)}
                className={`flex flex-col items-start p-3 rounded-2xl border text-left transition-all duration-200 group relative ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-md shadow-primary/25 scale-[1.02]'
                    : 'bg-surface hover:bg-surface-secondary text-text-primary border-border-subtle hover:border-primary/40'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-surface-secondary text-text-muted border border-border-subtle'
                    }`}
                  >
                    {dom.termCount || 400} từ
                  </span>
                </div>
                <div className="font-bold text-xs line-clamp-1 leading-snug">{dom.nameVi}</div>
                <div className={`text-[11px] font-medium mt-0.5 ${isSelected ? 'text-white/80' : 'text-text-muted'}`}>
                  {dom.nameZh}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. ACTIVE INDUSTRY DETAILS & SUBCATEGORIES */}
      {currentDomain && (
        <div className="bg-surface border border-border-subtle rounded-2xl p-5 space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-border-subtle">
            <div className="flex items-center gap-3">
              {React.createElement(getIndustryIcon(currentDomain.id), {
                className: 'w-6 h-6 text-primary flex-shrink-0',
              })}
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-extrabold text-text-primary">{currentDomain.nameVi}</h3>
                  <span className="text-xs text-text-muted font-chinese">({currentDomain.nameZh})</span>
                </div>
                {currentDomain.descriptionVi && (
                  <p className="text-xs text-text-secondary mt-0.5">{currentDomain.descriptionVi}</p>
                )}
              </div>
            </div>

            <div className="text-xs text-text-muted font-medium bg-surface-secondary px-3 py-1.5 rounded-xl border border-border-subtle self-start md:self-auto">
              {categories.length} nhóm chủ đề con · {currentDomain.termCount || 400} thuật ngữ
            </div>
          </div>

          {/* Subcategory Pills */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>Chủ đề con ({categories.length}):</span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto scrollbar-thin pr-1">
              <button
                data-testid="subcat-all"
                onClick={() => setSelectedCategoryId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  selectedCategoryId === 'all'
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-border-subtle hover:border-primary/40'
                }`}
              >
                Tất cả chủ đề ({currentDomain.termCount || 400})
              </button>

              {categories.map((cat) => {
                const isCatActive = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    data-testid={`subcat-${cat.id}`}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      isCatActive
                        ? 'bg-primary text-white shadow-sm font-semibold'
                        : 'bg-surface-secondary text-text-secondary hover:text-text-primary border border-border-subtle hover:border-primary/40'
                    }`}
                  >
                    <span>{cat.nameVi}</span>
                    <span className={`ml-1.5 text-[10px] ${isCatActive ? 'text-white/80' : 'text-text-muted'}`}>
                      ({cat.termCount})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. SEARCH & VOCABULARY LIST SECTION */}
      <div className="space-y-4">
        {/* Search input & pagination summary */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm thuật ngữ (chữ Hán, pinyin hoặc tiếng Việt)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl text-sm bg-surface border border-border-subtle focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-text-primary shadow-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-text-muted hover:text-text-primary"
              >
                Xóa
              </button>
            )}
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs text-text-secondary">
            <span>
              Tìm thấy <strong className="text-text-primary">{totalTerms}</strong> thuật ngữ
            </span>
            <span className="text-text-muted">·</span>
            <span>
              Trang <strong className="text-text-primary">{currentPage}</strong> / {totalPages}
            </span>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <div className="text-sm text-text-muted font-medium">Đang tải dữ liệu từ vựng chuyên ngành...</div>
          </div>
        ) : terms.length === 0 ? (
          /* Empty state */
          <div className="bg-surface border border-border-subtle rounded-3xl p-12 text-center space-y-3">
            <Briefcase className="w-12 h-12 text-text-muted mx-auto opacity-50" />
            <div className="text-base font-bold text-text-primary">Không tìm thấy thuật ngữ phù hợp</div>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              Không có thuật ngữ nào khớp với từ khóa &ldquo;{searchQuery}&rdquo; trong nhóm này. Hãy thử tìm từ khóa khác
              hoặc chọn lại nhóm chủ đề.
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-primary-soft text-primary text-xs font-bold hover:bg-primary hover:text-white transition-colors"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        ) : (
          /* 5. VOCABULARY CARDS GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {terms.map((term) => {
              const isFav = favorites.includes(`prof_${term.id}`);
              const isAudioPlaying = activeSpeechId === term.id;

              return (
                <div
                  key={term.id}
                  data-testid="vocab-card"
                  className="bg-surface hover:bg-surface-secondary/40 border border-border-subtle hover:border-primary/40 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md space-y-4 group"
                >
                  {/* Card Header: Industry & Subcategory badge + Favorite toggle */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-primary/10 text-primary text-[11px] font-semibold">
                        {term.industry || currentDomain?.nameVi}
                      </span>
                      {term.subcategory && (
                        <span className="px-2 py-0.5 rounded-lg bg-surface-secondary text-text-secondary border border-border-subtle text-[11px] font-medium">
                          {term.subcategory}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold">
                        {term.partOfSpeech || 'Chuyên ngành'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleToggleFavorite(term)}
                      title={isFav ? 'Bỏ lưu' : 'Lưu vào sổ tay'}
                      className={`p-1.5 rounded-xl transition-colors ${
                        isFav
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
                          : 'text-text-muted hover:text-amber-500 hover:bg-surface-secondary'
                      }`}
                    >
                      {isFav ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Hanzi, Pinyin & Audio Button */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-2xl font-extrabold text-text-primary tracking-wide font-chinese group-hover:text-primary transition-colors">
                        {term.hanzi}
                      </span>
                      <button
                        onClick={() => handlePlayAudio(term)}
                        title="Nghe phát âm chuẩn"
                        className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                          isAudioPlaying
                            ? 'bg-primary text-white scale-110 shadow-sm'
                            : 'bg-primary-soft text-primary hover:bg-primary hover:text-white'
                        }`}
                      >
                        <Volume2 className={`w-4 h-4 ${isAudioPlaying ? 'animate-pulse' : ''}`} />
                      </button>
                    </div>
                    <div className="text-xs font-semibold text-primary">{term.pinyin}</div>
                  </div>

                  {/* Vietnamese Definition & Han-Viet */}
                  <div className="space-y-1 bg-surface-secondary/60 rounded-xl p-3 border border-border-subtle">
                    <div className="text-sm font-bold text-text-primary line-clamp-2">
                      {term.vietnamese}
                    </div>
                    {term.hanViet && (
                      <div className="text-[11px] text-text-muted">
                        Hán-Việt: <span className="font-medium text-text-secondary">{term.hanViet}</span>
                      </div>
                    )}
                  </div>

                  {/* Example Sentence Preview */}
                  {term.sampleSentenceZh && (
                    <div className="text-xs space-y-1 bg-surface rounded-xl p-2.5 border border-border-subtle">
                      <div className="text-text-primary font-chinese font-medium">
                        {term.sampleSentenceZh}
                      </div>
                      {term.sampleSentenceVi && (
                        <div className="text-text-muted text-[11px] italic">
                          {term.sampleSentenceVi}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Card Actions: Detail Drawer & Gemini AI Tutor */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border-subtle">
                    <button
                      data-testid="btn-view-detail"
                      onClick={() => setDetailItem(termToDictResult(term))}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-secondary hover:bg-border-subtle text-text-primary transition-colors text-center"
                    >
                      Xem chi tiết
                    </button>
                    <button
                      data-testid="btn-ask-ai"
                      onClick={() => setGeminiItem(termToDictResult(term))}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all text-center flex items-center justify-center gap-1.5"
                    >
                      <Sparkle className="w-3.5 h-3.5" />
                      <span>Hỏi AI</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 6. SERVER-SIDE PAGINATION CONTROLS */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-border-subtle">
            <div className="text-xs text-text-muted">
              Đang hiển thị {Math.min((currentPage - 1) * PAGE_SIZE + 1, totalTerms)} -{' '}
              {Math.min(currentPage * PAGE_SIZE, totalTerms)} trong tổng số {totalTerms} thuật ngữ
            </div>

            <div className="flex items-center gap-1.5">
              {/* First Page */}
              <button
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1 || isLoading}
                title="Về trang đầu"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary bg-surface border border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-secondary transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>

              {/* Prev Page */}
              <button
                data-testid="btn-prev-page"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1 || isLoading}
                title="Trang trước"
                className="px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary bg-surface border border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-secondary transition-colors"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Trước</span>
              </button>

              {/* Page Indicator */}
              <div data-testid="page-indicator" className="px-3 py-1.5 rounded-xl bg-surface-secondary text-xs font-bold text-text-primary border border-border-subtle">
                {currentPage} / {totalPages}
              </div>

              {/* Next Page */}
              <button
                data-testid="btn-next-page"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || isLoading}
                title="Trang sau"
                className="px-3 py-1.5 rounded-xl flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary bg-surface border border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-secondary transition-colors"
              >
                <span>Sau</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Last Page */}
              <button
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages || isLoading}
                title="Đến trang cuối"
                className="w-8 h-8 rounded-xl flex items-center justify-center text-text-secondary hover:text-text-primary bg-surface border border-border-subtle disabled:opacity-40 disabled:cursor-not-allowed hover:bg-surface-secondary transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 7. DICTIONARY DETAIL MODAL */}
      <DictionaryDetailModal
        item={detailItem}
        onClose={() => setDetailItem(null)}
        onPlayAudio={(hanzi, pinyin) => {
          audioManager.playText(hanzi, { pinyin });
        }}
        isFavorite={detailItem ? favorites.includes(detailItem.id) : false}
        onToggleFavorite={(item) => {
          const isNowFav = dictionaryCache.toggleFavoriteItem(item);
          setFavorites(dictionaryCache.getFavorites());
          showToast(isNowFav ? `Đã lưu "${item.hanzi}" vào sổ tay` : `Đã bỏ lưu "${item.hanzi}"`, 'info');
        }}
        onAskGemini={(item) => {
          setDetailItem(null);
          setGeminiItem(item);
        }}
        onOpenSpecialized={(domainId) => {
          setSelectedDomainId(domainId);
          setDetailItem(null);
        }}
      />

      {/* 8. GEMINI AI PEDAGOGICAL TUTOR MODAL */}
      <GeminiTutorModal
        item={geminiItem}
        onClose={() => setGeminiItem(null)}
      />
    </div>
  );
};
export default SpecializedVocabularyView;
