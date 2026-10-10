import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  Copy,
  Check,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  Tag
} from 'lucide-react';
import {
  aiWordUsageService,
  AiWordUsageExplanation,
  FetchWordUsageOptions
} from '../../../services/ai/aiWordUsageService';
import { audioManager } from '../../../services/audio/index';
import { useToast } from '../../ui/Toast';

interface AiWordUsageSectionProps {
  word: string;
  pinyin?: string;
  pos?: string[];
  meanings?: string[];
  hskFramework?: string;
  hskLevel?: string | number;
  autoLoad?: boolean;
}

export const AiWordUsageSection: React.FC<AiWordUsageSectionProps> = ({
  word,
  pinyin,
  pos,
  meanings,
  hskFramework,
  hskLevel,
  autoLoad = true,
}) => {
  const { showToast } = useToast();
  const [data, setData] = useState<AiWordUsageExplanation | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [isCached, setIsCached] = useState<boolean>(false);
  const [expanded, setExpanded] = useState<boolean>(true);
  const [playingSentenceIdx, setPlayingSentenceIdx] = useState<number | null>(null);
  const [copiedSentenceIdx, setCopiedSentenceIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);

  const fetchUsage = async (forceRefresh = false) => {
    if (!word) return;
    setLoading(true);
    setError(null);

    const opts: FetchWordUsageOptions = {
      word,
      pinyin,
      pos,
      meanings,
      hskFramework,
      hskLevel,
      skipCache: forceRefresh,
    };

    try {
      const res = await aiWordUsageService.getWordUsage(opts);
      if (res.success && res.data) {
        setData(res.data);
        setIsCached(Boolean(res.cached));
      } else {
        setError({
          code: res.error || 'UNKNOWN_ERROR',
          message: res.message || 'Không thể tạo nội dung giải thích.',
        });
      }
    } catch (err: any) {
      setError({
        code: 'NETWORK_ERROR',
        message: err?.message || 'Lỗi mạng khi kết nối tới dịch vụ AI.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad && word) {
      fetchUsage();
    } else {
      setData(null);
      setError(null);
    }
  }, [word]);

  const handlePlaySentence = async (text: string, idx: number) => {
    setPlayingSentenceIdx(idx);
    try {
      await audioManager.playText(text, { lang: 'zh-CN', rate: 0.9 });
    } catch {
      showToast('Không thể phát âm thanh', 'error');
    } finally {
      setPlayingSentenceIdx(null);
    }
  };

  const handleCopySentence = async (text: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSentenceIdx(idx);
      showToast('Đã sao chép câu ví dụ', 'success');
      setTimeout(() => setCopiedSentenceIdx(null), 2000);
    } catch {
      showToast('Không thể sao chép văn bản', 'error');
    }
  };

  const handleCopyAll = async () => {
    if (!data) return;
    try {
      const formatted = `=== AI GIẢI THÍCH CÁCH DÙNG: ${data.word} (${data.pinyin}) ===\n` +
        `Nghĩa cốt lõi: ${data.coreMeaning}\n` +
        `Từ loại: ${data.partOfSpeech}\n\n` +
        `Cấu trúc ngữ pháp:\n` +
        data.grammarPatterns.map((gp) => `• ${gp.pattern}: ${gp.explanation}`).join('\n') +
        `\n\nVí dụ thực tế:\n` +
        data.exampleSentences.map((s, i) => `${i + 1}. ${s.simplified}\n   ${s.pinyin}\n   Dịch: ${s.vietnamese}`).join('\n\n') +
        `\n\nLưu ý quan trọng: ${data.commonPitfalls}\n` +
        `Cụm từ thường gặp: ${data.collocations.join(', ')}`;

      await navigator.clipboard.writeText(formatted);
      setCopiedAll(true);
      showToast('Đã sao chép toàn bộ giải thích AI', 'success');
      setTimeout(() => setCopiedAll(false), 2000);
    } catch {
      showToast('Không thể sao chép nội dung', 'error');
    }
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-b from-primary/5 via-surface to-surface overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 flex items-center justify-between gap-3 border-b border-primary/10 bg-primary/5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="text-sm font-bold text-text-primary tracking-tight">
                AI Giải Thích Cách Dùng
              </h4>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/15 text-primary uppercase tracking-wider">
                AI Tham Khảo
              </span>
              {isCached && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-secondary text-text-muted border border-border-subtle">
                  Bộ nhớ đệm
                </span>
              )}
            </div>
            <p className="text-[11px] text-text-muted truncate mt-0.5">
              Phân tích ngữ cảnh & câu ví dụ sư phạm (tách biệt với nghĩa từ điển gốc)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {data && (
            <>
              <button
                onClick={handleCopyAll}
                className="p-1.5 rounded-lg bg-surface hover:bg-surface-secondary text-text-muted hover:text-text-primary border border-border-subtle transition-colors"
                title="Sao chép toàn bộ giải thích"
                aria-label="Sao chép toàn bộ"
              >
                {copiedAll ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => fetchUsage(true)}
                disabled={loading}
                className="p-1.5 rounded-lg bg-surface hover:bg-surface-secondary text-text-muted hover:text-text-primary border border-border-subtle transition-colors disabled:opacity-50"
                title="Tạo lại phân tích"
                aria-label="Tạo lại"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-primary' : ''}`} />
              </button>
            </>
          )}
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg bg-surface hover:bg-surface-secondary text-text-muted hover:text-text-primary border border-border-subtle transition-colors"
            title={expanded ? 'Thu gọn' : 'Mở rộng'}
            aria-label={expanded ? 'Thu gọn' : 'Mở rộng'}
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Body Area */}
      {expanded && (
        <div className="p-4 sm:p-5 space-y-4 text-xs sm:text-sm">
          {/* Loading State */}
          {loading && (
            <div className="py-8 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-3 border-primary/20 border-t-primary animate-spin" />
                <Sparkles className="w-4 h-4 text-primary absolute inset-0 m-auto" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-text-primary">
                  Đang phân tích cách dùng từ qua AI...
                </p>
                <p className="text-xs text-text-muted">
                  Đang tạo cấu trúc ngữ pháp, 3 câu ví dụ thực tế và lưu ý người học
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {!loading && error && (
            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-text-primary space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 flex-1">
                  <h5 className="font-bold text-amber-600 dark:text-amber-400">
                    {error.code === 'AI_UNCONFIGURED'
                      ? 'Tính năng AI chưa được cấu hình'
                      : 'Không thể tải giải thích từ AI'}
                  </h5>
                  <p className="text-xs text-text-secondary leading-relaxed">
                    {error.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-end">
                <button
                  onClick={() => fetchUsage(true)}
                  className="px-3 py-1.5 rounded-lg bg-surface font-semibold text-xs text-text-primary border border-border-subtle hover:bg-surface-secondary flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Thử lại
                </button>
              </div>
            </div>
          )}

          {/* Empty / Not yet requested */}
          {!loading && !error && !data && (
            <div className="py-6 flex flex-col items-center justify-center gap-3 text-center">
              <p className="text-xs text-text-muted">
                Chưa có phân tích cho từ này. Bạn có thể yêu cầu AI tạo phân tích ngay.
              </p>
              <button
                onClick={() => fetchUsage()}
                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs shadow-sm hover:bg-primary-hover flex items-center gap-1.5 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Tạo giải thích cách dùng với AI
              </button>
            </div>
          )}

          {/* Data Content */}
          {!loading && data && (
            <div className="space-y-4">
              {/* 1. Core Meaning & POS */}
              <div className="bg-surface p-3.5 rounded-xl border border-border-subtle space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-text-primary flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    Nghĩa Cốt Lõi & Sắc Thái
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-surface-secondary text-[11px] font-semibold text-text-secondary border border-border-subtle">
                    {data.partOfSpeech}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-text-secondary leading-relaxed font-medium">
                  {data.coreMeaning}
                </p>
              </div>

              {/* 2. Grammar Patterns */}
              {data.grammarPatterns && data.grammarPatterns.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-secondary" />
                    Cấu Trúc Ngữ Pháp Thông Dụng
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {data.grammarPatterns.map((gp, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-surface border border-border-subtle flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-3"
                      >
                        <span className="font-hanzi font-bold text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-md flex-shrink-0 self-start">
                          {gp.pattern}
                        </span>
                        <span className="text-xs text-text-secondary leading-relaxed">
                          {gp.explanation}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Example Sentences (At least 3) */}
              {data.exampleSentences && data.exampleSentences.length > 0 && (
                <div className="space-y-2.5">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    Câu Ví Dụ Thực Tế ({data.exampleSentences.length})
                  </span>
                  <div className="space-y-2">
                    {data.exampleSentences.map((sent, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-surface border border-border-subtle hover:border-primary/40 transition-colors space-y-1.5 group"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-hanzi font-bold text-base sm:text-lg text-text-primary leading-snug">
                            {sent.simplified}
                          </p>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handlePlaySentence(sent.simplified, idx)}
                              className={`p-1.5 rounded-lg border border-border-subtle transition-colors ${
                                playingSentenceIdx === idx
                                  ? 'bg-primary text-white scale-105'
                                  : 'bg-surface-secondary text-text-muted hover:text-primary hover:bg-primary-soft'
                              }`}
                              title="Nghe phát âm chuẩn"
                              aria-label="Phát âm câu"
                            >
                              <Volume2 className={`w-3.5 h-3.5 ${playingSentenceIdx === idx ? 'animate-pulse' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleCopySentence(sent.simplified, idx)}
                              className="p-1.5 rounded-lg bg-surface-secondary text-text-muted hover:text-text-primary border border-border-subtle transition-colors"
                              title="Sao chép câu"
                              aria-label="Sao chép câu"
                            >
                              {copiedSentenceIdx === idx ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <p className="text-xs font-semibold text-deep-blue tracking-wide">
                          {sent.pinyin}
                        </p>

                        <div className="flex items-baseline justify-between gap-2 pt-0.5">
                          <p className="text-xs text-text-secondary font-medium leading-relaxed">
                            {sent.vietnamese}
                          </p>
                          {sent.context && (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-surface-secondary text-text-muted flex-shrink-0 font-medium">
                              {sent.context}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Common Pitfalls / Collocations */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {data.commonPitfalls && (
                  <div className="p-3.5 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1.5">
                    <span className="font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5 text-xs">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Lưu Ý & Lỗi Thường Gặp
                    </span>
                    <p className="text-xs text-text-secondary leading-relaxed font-medium">
                      {data.commonPitfalls}
                    </p>
                  </div>
                )}

                {data.collocations && data.collocations.length > 0 && (
                  <div className="p-3.5 rounded-xl border border-border-subtle bg-surface space-y-2">
                    <span className="font-bold text-text-primary flex items-center gap-1.5 text-xs">
                      <Tag className="w-3.5 h-3.5 text-secondary" />
                      Cụm Từ Thường Gặp
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {data.collocations.map((col, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 rounded-lg bg-surface-secondary text-[11px] font-medium text-text-secondary border border-border-subtle"
                        >
                          {col}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Lesson Notes if available */}
              {data.lessonNotes && (
                <div className="p-2.5 rounded-xl bg-surface-secondary/50 border border-border-subtle text-[11px] text-text-muted">
                  <strong className="text-text-secondary">Gợi ý học tập:</strong> {data.lessonNotes}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
