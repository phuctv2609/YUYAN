import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Search,
  ExternalLink,
  BookOpen,
  Volume2,
  X,
  Layers,
  Info,
} from 'lucide-react';
import { radicalRepository } from '../../data/repositories/radicalRepository';
import { CanonicalRadical } from '../../data/models/radical';
import { audioManager } from '../../services/audio';
import { useToast } from '../ui/Toast';

interface RadicalViewProps {
  onOpenHanzi?: (char: string) => void;
  onOpenWord?: (word: string) => void;
}

export const RadicalView: React.FC<RadicalViewProps> = ({ onOpenHanzi, onOpenWord }) => {
  const { showToast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStroke, setSelectedStroke] = useState<number | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeRadical, setActiveRadical] = useState<CanonicalRadical | null>(null);

  // All 214 Kangxi radicals
  const allRadicals = useMemo(() => radicalRepository.getAll(), []);

  // Distinct semantic categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const r of allRadicals) {
      if (r.semanticCategory) set.add(r.semanticCategory);
    }
    return Array.from(set);
  }, [allRadicals]);

  // Filtered radicals
  const filteredRadicals = useMemo(() => {
    return radicalRepository.search({
      query: searchQuery,
      strokeCount: selectedStroke === 'all' ? undefined : selectedStroke,
      semanticCategory: selectedCategory === 'all' ? undefined : selectedCategory,
    });
  }, [searchQuery, selectedStroke, selectedCategory]);

  const handlePlayAudio = (char: string) => {
    audioManager.playText(char, { entityType: 'hanzi', entityId: `radical_${char}` });
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Hero */}
      <div className="bg-surface rounded-3xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-4 card-motion light-beam-shimmer">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-primary-container text-white flex items-center justify-center font-hanzi font-bold text-2xl shadow-sm flex-shrink-0">
              部
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                  214 Bộ thủ Khang Hy (部首)
                </h1>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-soft text-primary">
                  Chuẩn hóa
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Hệ thống 214 bộ thủ nguyên bản kết nối trực tiếp với chữ Hán và từ vựng HSK 1–6
              </p>
            </div>
          </div>

          <div className="text-xs text-text-muted bg-surface-secondary px-3 py-1.5 rounded-xl border border-border-subtle self-start sm:self-auto">
            Tổng cộng: <strong className="text-primary font-bold">{allRadicals.length}</strong> bộ thủ
          </div>
        </div>

        {/* Search Bar & Filters */}
        <div className="space-y-3 pt-2">
          <div className="relative">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo chữ (氵, 水), tên Hán Việt (Thủy, Nhân), số thứ tự (85), ý nghĩa (nước)..."
              className="w-full pl-10 pr-4 py-3 bg-surface-secondary/70 border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Stroke count chips (1 to 17) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
            <span className="text-text-muted text-[11px] font-medium pr-1 flex-shrink-0">
              Số nét:
            </span>
            <button
              onClick={() => setSelectedStroke('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex-shrink-0 ${
                selectedStroke === 'all'
                  ? 'bg-primary text-white shadow-2xs'
                  : 'bg-surface-secondary text-text-secondary hover:bg-border-subtle'
              }`}
            >
              Tất cả
            </button>
            {Array.from({ length: 17 }, (_, i) => i + 1).map((st) => (
              <button
                key={st}
                onClick={() => setSelectedStroke(st)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex-shrink-0 ${
                  selectedStroke === st
                    ? 'bg-primary text-white shadow-2xs'
                    : 'bg-surface-secondary text-text-secondary hover:bg-border-subtle'
                }`}
              >
                {st} nét
              </button>
            ))}
          </div>

          {/* Semantic Category Chips */}
          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
              <span className="text-text-muted text-[11px] font-medium pr-1 flex-shrink-0">
                Nhóm ý nghĩa:
              </span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex-shrink-0 ${
                  selectedCategory === 'all'
                    ? 'bg-secondary text-white shadow-2xs'
                    : 'bg-surface-secondary text-text-secondary hover:bg-border-subtle'
                }`}
              >
                Tất cả
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-colors flex-shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-secondary text-white shadow-2xs'
                      : 'bg-surface-secondary text-text-secondary hover:bg-border-subtle'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Radical Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
            Danh sách bộ thủ ({filteredRadicals.length} kết quả)
          </span>
          <span className="text-xs text-text-muted">Bấm vào bộ thủ để xem chữ Hán và từ vựng liên quan</span>
        </div>

        {filteredRadicals.length === 0 ? (
          <div className="p-12 text-center bg-surface rounded-2xl border border-border-subtle space-y-2">
            <Info className="w-8 h-8 text-text-muted mx-auto" />
            <p className="text-sm font-bold text-text-primary">Không tìm thấy bộ thủ phù hợp</p>
            <p className="text-xs text-text-muted">Vui lòng thử tìm với từ khóa hoặc số nét khác.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {filteredRadicals.map((rad) => {
              const isSelected = activeRadical?.id === rad.id;
              return (
                <div
                  key={rad.id}
                  onClick={() => setActiveRadical(rad)}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all duration-150 card-motion flex flex-col justify-between ${
                    isSelected
                      ? 'bg-primary-soft border-primary shadow-xs ring-2 ring-primary/20'
                      : 'bg-surface border-border-subtle hover:border-primary/50 hover:bg-surface-secondary/40 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-secondary text-text-muted">
                      #{rad.radicalNumber}
                    </span>
                    <span className="text-[10px] text-text-muted font-medium">
                      {rad.strokeCount} nét
                    </span>
                  </div>

                  <div className="py-2 text-center">
                    <span className="font-hanzi text-3xl font-bold text-text-primary block hover:scale-110 transition-transform">
                      {rad.char}
                    </span>
                    {rad.variants.length > 1 && (
                      <span className="text-xs text-deep-blue font-hanzi">
                        Biến thể: {rad.variants.filter((v) => v !== rad.char).join(', ')}
                      </span>
                    )}
                  </div>

                  <div className="space-y-0.5 border-t border-divider-line pt-2">
                    <p className="text-xs font-bold text-text-primary truncate" title={rad.nameVi}>
                      {rad.nameVi}
                    </p>
                    <p className="text-[11px] text-text-muted truncate" title={rad.meaning}>
                      {rad.meaning}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Radical Detail Drawer / Modal */}
      {activeRadical && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface rounded-3xl border border-border-subtle shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar p-6 sm:p-8 space-y-6 animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 border-b border-divider-line pb-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-primary-soft border border-primary/20 text-primary flex items-center justify-center font-hanzi font-bold text-4xl shadow-inner">
                  {activeRadical.char}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-bold text-text-primary">
                      {activeRadical.nameVi}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-surface-secondary text-text-muted">
                      Bộ thứ {activeRadical.radicalNumber}
                    </span>
                  </div>
                  <p className="text-xs text-deep-blue font-semibold mt-0.5">
                    Tên tiếng Trung: {activeRadical.nameZh} • Số nét: {activeRadical.strokeCount} nét
                  </p>
                  <p className="text-xs text-text-secondary mt-1">
                    Ý nghĩa: <strong className="text-text-primary">{activeRadical.meaning}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePlayAudio(activeRadical.char)}
                  className="p-2 rounded-xl bg-surface-secondary hover:bg-border-subtle text-primary transition-colors"
                  title="Phát âm bộ thủ"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setActiveRadical(null)}
                  className="p-2 rounded-xl bg-surface-secondary hover:bg-border-subtle text-text-muted hover:text-text-primary transition-colors"
                  title="Đóng"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Mnemonic Memory Hook */}
            {activeRadical.mnemonic && (
              <div className="p-4 bg-primary-ultra-soft border border-primary-container/40 rounded-2xl space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-primary">
                  <Sparkles className="w-4 h-4" />
                  <span>Ghi nhớ ý nghĩa bộ thủ (Mnemonic):</span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                  {activeRadical.mnemonic}
                </p>
              </div>
            )}

            {/* Bi-directional Link 1: Connected Hanzi Characters in HSK */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-primary" />
                  <span>Chữ Hán thuộc bộ này trong giáo trình HSK ({activeRadical.characterIds.length})</span>
                </h3>
                <span className="text-[11px] text-text-muted">Bấm vào chữ để xem chi tiết</span>
              </div>

              {activeRadical.characterIds.length === 0 ? (
                <p className="text-xs text-text-muted italic bg-surface-secondary p-3 rounded-xl">
                  Bộ thủ này chưa có chữ độc lập trong giáo trình 146 bài cơ bản.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeRadical.characterIds.map((ch) => (
                    <button
                      key={ch}
                      onClick={() => {
                        setActiveRadical(null);
                        if (onOpenHanzi) onOpenHanzi(ch);
                        else showToast(`Đang mở chi tiết chữ Hán: ${ch}`, 'info');
                      }}
                      className="px-3 py-2 bg-surface hover:bg-primary-soft text-text-primary hover:text-primary rounded-xl border border-border-subtle font-hanzi font-bold text-lg transition-all hover:scale-105 active:scale-95 shadow-2xs flex items-center gap-1.5"
                    >
                      <span>{ch}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bi-directional Link 2: Connected Vocabulary Words in HSK */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                  <Layers className="w-4 h-4 text-secondary" />
                  <span>Từ vựng HSK chứa bộ thủ này ({activeRadical.vocabularyIds.length})</span>
                </h3>
                <span className="text-[11px] text-text-muted">Bấm vào từ để tra từ điển</span>
              </div>

              {activeRadical.vocabularyIds.length === 0 ? (
                <p className="text-xs text-text-muted italic bg-surface-secondary p-3 rounded-xl">
                  Chưa ghi nhận từ vựng trực tiếp trong bài khóa HSK 1–6.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeRadical.vocabularyIds.map((w) => (
                    <button
                      key={w}
                      onClick={() => {
                        setActiveRadical(null);
                        if (onOpenWord) onOpenWord(w);
                        else showToast(`Tra từ điển cho: ${w}`, 'info');
                      }}
                      className="px-3 py-1.5 bg-surface-secondary hover:bg-border-subtle text-text-primary rounded-xl border border-border-subtle font-hanzi text-xs font-semibold transition-all hover:border-primary/40 flex items-center gap-1"
                    >
                      <span>{w}</span>
                      <ExternalLink className="w-3 h-3 text-text-muted ml-0.5" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Close action */}
            <div className="flex justify-end pt-2 border-t border-divider-line">
              <button
                onClick={() => setActiveRadical(null)}
                className="px-5 py-2.5 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary-hover transition-colors shadow-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
