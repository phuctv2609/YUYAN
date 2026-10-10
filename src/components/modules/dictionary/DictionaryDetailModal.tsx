import React, { useEffect, useState } from 'react';
import {
  X,
  Volume2,
  BookOpen,
  Star,
  ExternalLink,
  Bot,
  Layers,
  GraduationCap,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { DictionaryResult } from '../../../services/dictionary/dictionaryTypes';
import { cvdictProvider, CVDICTWordDetail } from '../../../services/dictionary/providers/cvdictProvider';
import { AiWordUsageSection } from '../common/AiWordUsageSection';

interface DictionaryDetailModalProps {
  item: DictionaryResult | null;
  onClose: () => void;
  onPlayAudio: (hanzi: string, pinyin?: string) => void;
  isFavorite: boolean;
  onToggleFavorite: (item: DictionaryResult) => void;
  onOpenLesson?: (lvl: number, num: number) => void;
  onOpenHanzi?: (char: string) => void;
  onOpenSpecialized?: (domainId: string) => void;
  onAskGemini: (item: DictionaryResult) => void;
  isAudioPlaying?: boolean;
}

export const DictionaryDetailModal: React.FC<DictionaryDetailModalProps> = ({
  item,
  onClose,
  onPlayAudio,
  isFavorite,
  onToggleFavorite,
  onOpenLesson,
  onOpenHanzi,
  onAskGemini,
  isAudioPlaying,
}) => {
  const [enrichment, setEnrichment] = useState<CVDICTWordDetail | null>(null);
  const [loadingEnrichment, setLoadingEnrichment] = useState(false);

  useEffect(() => {
    if (!item) {
      setEnrichment(null);
      return;
    }

    let isMounted = true;
    if (item.id) {
      setLoadingEnrichment(true);
      cvdictProvider.getWordDetail(item.id)
        .then((detail) => {
          if (isMounted) {
            setEnrichment(detail);
            setLoadingEnrichment(false);
          }
        })
        .catch(() => {
          if (isMounted) setLoadingEnrichment(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [item?.id]);

  if (!item) return null;

  const characters = item.hanzi.split('').filter((ch) => /[\u4e00-\u9fa5]/.test(ch));
  const hasDiffTraditional = Boolean(item.traditional && item.traditional !== item.hanzi);
  const hskMatches = enrichment?.hsk_matches || [];
  const lessonOccurrences = enrichment?.lesson_occurrences || [];
  const hanziBreakdown = enrichment?.hanzi_breakdown || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-surface border border-border-subtle rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden card-motion"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-border-subtle flex items-start justify-between gap-4 bg-surface-secondary/40">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary-soft text-primary uppercase">
                {item.source.label}
              </span>
              {item.qualityStatus === 'review_required' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Cần rà soát dịch thuật
                </span>
              )}
              {item.qualityStatus === 'verified' && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Đạt chuẩn
                </span>
              )}
              {hskMatches.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary-soft text-secondary">
                  HSK {hskMatches[0].hsk_level}
                </span>
              )}
            </div>

            <div className="flex items-baseline gap-3 flex-wrap pt-1">
              <h2 className="text-3xl sm:text-4xl font-hanzi font-bold text-text-primary tracking-wide">
                {item.hanzi}
              </h2>
              {hasDiffTraditional && (
                <span className="text-sm font-hanzi text-text-muted bg-surface px-2 py-0.5 rounded-md border border-border-subtle" title="Chữ phồn thể">
                  Phồn thể: {item.traditional}
                </span>
              )}
              <span className="text-lg sm:text-xl font-bold text-deep-blue tracking-normal">
                {item.pinyin}
              </span>
            </div>

            {item.hanViet && (
              <p className="text-xs font-semibold text-text-secondary">
                Âm Hán Việt: <span className="text-text-primary uppercase">{item.hanViet}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => onPlayAudio(item.hanzi, item.pinyin)}
              className={`p-2.5 rounded-xl border border-border-subtle transition-all duration-150 ${
                isAudioPlaying
                  ? 'bg-primary text-white scale-105'
                  : 'bg-surface text-text-secondary hover:text-primary hover:bg-primary-soft'
              }`}
              title="Phát âm tiếng Trung chuẩn (zh-CN)"
              aria-label="Phát âm"
            >
              <Volume2 className={`w-5 h-5 ${isAudioPlaying ? 'animate-pulse' : ''}`} />
            </button>

            <button
              onClick={() => onToggleFavorite(item)}
              className={`p-2.5 rounded-xl border border-border-subtle transition-all duration-150 ${
                isFavorite
                  ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                  : 'bg-surface text-text-muted hover:text-amber-500 hover:bg-amber-500/5'
              }`}
              title={isFavorite ? 'Bỏ lưu từ' : 'Lưu từ vào sổ tay'}
              aria-label="Lưu từ"
            >
              <Star className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>

            <button
              data-testid="detail-modal-close-btn"
              onClick={onClose}
              className="p-2.5 rounded-xl bg-surface hover:bg-surface-secondary text-text-muted hover:text-text-primary border border-border-subtle transition-colors"
              title="Đóng"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 custom-scrollbar">
          {/* 1. Definitions & Senses */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-primary" />
              <span>Giải nghĩa tiếng Việt (Senses)</span>
            </h3>
            <div className="bg-surface-secondary/60 p-4 rounded-2xl border border-border-subtle/80 space-y-2.5">
              {item.definitions && item.definitions.length > 0 ? (
                <ul className="space-y-2 text-sm text-text-primary">
                  {item.definitions.map((def, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-primary-soft text-primary font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed font-medium">
                        {def.definitionVi || def.definition}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-base font-bold text-text-primary leading-snug">
                  {item.vietnamese}
                </p>
              )}
            </div>
          </div>

          {/* AI Word Usage Explanation */}
          <AiWordUsageSection
            word={item.hanzi}
            pinyin={item.pinyin}
            pos={[]}
            meanings={item.definitions?.map(d => d.definitionVi || d.definition) || (item.vietnamese ? [item.vietnamese] : [])}
            hskFramework="HSK"
            hskLevel={hskMatches[0]?.hsk_level}
            autoLoad={true}
          />

          {/* 2. Related HSK Vocabulary Links */}
          {hskMatches.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-secondary" />
                <span>Liên kết Giáo trình HSK Chuẩn ({hskMatches.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hskMatches.map((hskItem, idx) => (
                  <div
                    key={`hsk-match-${idx}`}
                    className="p-3 rounded-2xl bg-surface border border-border-subtle flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary-soft text-secondary">
                          HSK {hskItem.hsk_level}
                        </span>
                        {hskItem.part_of_speech && (
                          <span className="text-[10px] text-text-muted">
                            ({hskItem.part_of_speech})
                          </span>
                        )}
                      </div>
                      <p className="font-hanzi text-base font-bold text-text-primary mt-1">
                        {hskItem.hanzi} • {hskItem.pinyin}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">{hskItem.vietnamese}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Lesson Occurrences (Xuất hiện trong bài học) */}
          {lessonOccurrences.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Xuất hiện trong bài khóa ({lessonOccurrences.length} bài)</span>
              </h3>
              <div className="space-y-2">
                {lessonOccurrences.map((occ, idx) => (
                  <div
                    key={`lesson-occ-${idx}`}
                    className="p-3.5 rounded-2xl bg-surface border border-border-subtle flex items-start justify-between gap-3 hover:border-primary/40 transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          HSK {occ.level} Bài {occ.lesson_number}
                        </span>
                        <span className="text-xs font-bold text-text-primary">
                          {occ.lesson_title}
                        </span>
                      </div>
                      <p className="font-hanzi text-sm font-semibold text-text-primary">
                        {occ.hanzi}
                      </p>
                      <p className="text-xs text-text-muted">{occ.vietnamese}</p>
                    </div>
                    {onOpenLesson && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenLesson(occ.level, occ.lesson_number);
                        }}
                        className="px-2.5 py-1.5 rounded-xl bg-primary-soft hover:bg-primary-soft/80 text-primary text-xs font-bold transition-colors whitespace-nowrap flex-shrink-0"
                      >
                        Đến bài học →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Character Breakdown (Chiết tự từng chữ Hán) */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span>Phân tích Hán tự đơn ({characters.length} chữ)</span>
            </h3>
            {loadingEnrichment ? (
              <div className="flex items-center gap-2 py-3 text-xs text-text-muted">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span>Đang tải phân tích bộ thủ và nét...</span>
              </div>
            ) : hanziBreakdown.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {hanziBreakdown.map((ch, idx) => (
                  <div
                    key={`hanzi-breakdown-${idx}`}
                    onClick={() => {
                      if (onOpenHanzi) {
                        onClose();
                        onOpenHanzi(ch.char);
                      }
                    }}
                    className="p-3 rounded-2xl bg-surface border border-border-subtle hover:border-primary/50 hover:bg-primary-soft/10 cursor-pointer transition-all space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-hanzi text-2xl font-bold text-text-primary">{ch.char}</span>
                        {ch.pinyin && ch.pinyin.length > 0 && (
                          <span className="text-xs font-bold text-deep-blue">{ch.pinyin.join(', ')}</span>
                        )}
                      </div>
                      <span className="text-[10px] text-text-muted">
                        {ch.stroke_count} nét
                      </span>
                    </div>
                    <div className="text-xs text-text-secondary">
                      {ch.radical_name_vi && (
                        <span>Bộ: {ch.radical_char} ({ch.radical_name_vi}) • </span>
                      )}
                      <span>{ch.meanings?.[0] || 'Chữ Hán chuẩn'}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {characters.map((ch, idx) => (
                  <button
                    key={`ch-fallback-${idx}`}
                    onClick={() => {
                      if (onOpenHanzi) {
                        onClose();
                        onOpenHanzi(ch);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface border border-border-subtle hover:border-primary/50 transition-colors"
                  >
                    <span className="font-hanzi text-xl font-bold text-text-primary">{ch}</span>
                    <span className="text-xs text-primary font-medium flex items-center gap-0.5">
                      Xem chữ Hán <ExternalLink className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 5. Attribution & License Notice */}
          <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle text-xs text-text-secondary space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-text-primary">Nguồn dữ liệu từ điển:</span>
              <a
                href="https://github.com/ph0ngp/CVDICT"
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline flex items-center gap-1 font-semibold"
              >
                ph0ngp/CVDICT <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="leading-relaxed">
              Dữ liệu được phát hành bởi tác giả <strong>Phong Phan</strong> theo giấy phép{' '}
              <a
                href="https://creativecommons.org/licenses/by-sa/4.0/"
                target="_blank"
                rel="noreferrer"
                className="text-primary font-semibold hover:underline"
              >
                Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)
              </a>
              , chuyển dịch từ kho dữ liệu CC-CEDICT.
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-border-subtle bg-surface-secondary/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAskGemini(item)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-xs"
            >
              <Bot className="w-4 h-4" />
              <span>Hỏi Trợ lý AI Gemini</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-surface hover:bg-surface-secondary text-text-primary text-xs font-bold border border-border-subtle transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
