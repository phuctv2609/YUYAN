import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Volume2,
  BookOpen,
  ExternalLink,
  Layers,
  AlertCircle,
  BookmarkCheck,
  BookMarked,
  Save,
  Tag
} from 'lucide-react';
import {
  HskWordMasterDetail,
  hskMasterService,
  HskLearnerStatus
} from '../../../services/hsk/hskMasterService';
import { audioManager } from '../../../services/audio/index';
import { useToast } from '../../ui/Toast';
import { AiWordUsageSection } from '../common/AiWordUsageSection';

interface HskWordDetailModalProps {
  entryId: string | null;
  onClose: () => void;
  onOpenLesson?: (lvl: number, num: number) => void;
  onOpenHanzi?: (char: string) => void;
  onOpenDictionary?: (word: string) => void;
  onStatusChanged?: (entryId: string, newStatus: 'new' | 'learning' | 'learned' | 'review') => void;
}

export const HskWordDetailModal: React.FC<HskWordDetailModalProps> = ({
  entryId,
  onClose,
  onOpenLesson,
  onOpenHanzi,
  onOpenDictionary,
  onStatusChanged,
}) => {
  const { showToast } = useToast();
  const [detail, setDetail] = useState<HskWordMasterDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentStatus, setCurrentStatus] = useState<HskLearnerStatus>('new');
  const [notes, setNotes] = useState<string>('');
  const [isSavingNotes, setIsSavingNotes] = useState<boolean>(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  useEffect(() => {
    if (!entryId) return;

    let isMounted = true;
    setLoading(true);

    hskMasterService
      .getWordDetail(entryId)
      .then((data) => {
        if (!isMounted) return;
        setDetail(data);
        if (data) {
          setCurrentStatus(data.learner_status || 'new');
        }
      })
      .catch((err) => {
        console.error('Failed to load HSK word detail:', err);
        showToast('Không thể tải chi tiết từ vựng', 'error');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [entryId]);

  useEffect(() => {
    document.body.setAttribute('data-modal-open', 'true');
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.removeAttribute('data-modal-open');
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!entryId) return null;

  const handlePlayAudio = async (text: string) => {
    setIsPlayingAudio(true);
    try {
      await audioManager.playText(text, { lang: 'zh-CN', rate: 0.9 });
    } catch {
      showToast('Không thể phát âm thanh', 'error');
    } finally {
      setIsPlayingAudio(false);
    }
  };

  const handleStatusChange = async (newStatus: 'new' | 'learning' | 'learned' | 'review') => {
    if (!detail) return;
    try {
      setCurrentStatus(newStatus);
      await hskMasterService.updateLearnerStatus(
        detail.entry.id,
        detail.entry.simplified,
        newStatus,
        notes
      );
      if (onStatusChanged) {
        onStatusChanged(detail.entry.id, newStatus);
      }
      showToast(`Đã chuyển trạng thái sang "${getStatusLabel(newStatus)}"`, 'success');
    } catch (err) {
      console.error('Failed to update learner status:', err);
      showToast('Lỗi khi cập nhật trạng thái', 'error');
    }
  };

  const handleSaveNotes = async () => {
    if (!detail) return;
    setIsSavingNotes(true);
    try {
      await hskMasterService.updateLearnerStatus(
        detail.entry.id,
        detail.entry.simplified,
        currentStatus === 'all' ? 'learning' : currentStatus,
        notes
      );
      showToast('Đã lưu ghi chú học tập thành công', 'success');
    } catch (err) {
      console.error('Failed to save notes:', err);
      showToast('Không thể lưu ghi chú', 'error');
    } finally {
      setIsSavingNotes(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'learning':
        return 'Đang học';
      case 'learned':
        return 'Đã thuộc';
      case 'review':
        return 'Cần ôn lại';
      default:
        return 'Chưa học';
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-2.5 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 isolate"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-surface border border-border-subtle rounded-2xl sm:rounded-3xl shadow-2xl max-w-2xl w-full h-auto max-h-[calc(100dvh-28px)] sm:max-h-[calc(100dvh-48px)] flex flex-col overflow-hidden relative card-motion"
        role="dialog"
        aria-modal="true"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider-line bg-surface-secondary/50 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Chi tiết Từ vựng HSK Chuẩn
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-6 overscroll-contain">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-text-muted">
              <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-medium">Đang tải dữ liệu HSK & bài khóa liên kết...</p>
            </div>
          ) : !detail ? (
            <div className="py-16 text-center text-text-muted">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-amber-500" />
              <p className="text-sm font-semibold">Không tìm thấy thông tin từ vựng này.</p>
            </div>
          ) : (
            <>
              {/* Headword Hero Card */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-soft/40 via-surface to-surface-secondary border border-primary/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl sm:text-5xl font-black font-hanzi text-text-primary tracking-tight">
                      {detail.entry.simplified}
                    </span>
                    {detail.entry.traditional && detail.entry.traditional !== detail.entry.simplified && (
                      <span className="text-xl sm:text-2xl font-hanzi text-text-muted">
                        [{detail.entry.traditional}]
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-lg font-medium text-primary font-mono">
                      {detail.entry.pinyin}
                    </span>
                    <button
                      onClick={() => handlePlayAudio(detail.entry.simplified)}
                      disabled={isPlayingAudio}
                      className="p-1.5 rounded-lg bg-primary-soft text-primary hover:bg-primary hover:text-white transition-colors"
                      title="Phát âm tiếng Trung chuẩn"
                    >
                      <Volume2 className={`w-4 h-4 ${isPlayingAudio ? 'animate-pulse' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Status Selector Bar */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-bold text-text-muted uppercase tracking-wider">
                    Tiến độ ghi nhớ
                  </span>
                  <div className="flex items-center bg-surface border border-border-subtle rounded-xl p-1 gap-1 shadow-2xs">
                    <button
                      onClick={() => handleStatusChange('new')}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                        currentStatus === 'new'
                          ? 'bg-surface-secondary text-text-primary font-bold shadow-2xs'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Mới
                    </button>
                    <button
                      onClick={() => handleStatusChange('learning')}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                        currentStatus === 'learning'
                          ? 'bg-amber-500 text-white font-bold shadow-2xs'
                          : 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                      }`}
                    >
                      Đang học
                    </button>
                    <button
                      onClick={() => handleStatusChange('learned')}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                        currentStatus === 'learned'
                          ? 'bg-emerald-600 text-white font-bold shadow-2xs'
                          : 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10'
                      }`}
                    >
                      Đã thuộc
                    </button>
                    <button
                      onClick={() => handleStatusChange('review')}
                      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                        currentStatus === 'review'
                          ? 'bg-rose-500 text-white font-bold shadow-2xs'
                          : 'text-rose-600 dark:text-rose-400 hover:bg-rose-500/10'
                      }`}
                    >
                      Cần ôn
                    </button>
                  </div>
                </div>
              </div>

              {/* Framework Memberships Badges */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <BookmarkCheck className="w-3.5 h-3.5 text-primary" />
                  Phân cấp chuẩn HSK 2.0 & HSK 3.0
                </span>
                <div className="flex flex-wrap gap-2">
                  {detail.memberships.map((m, idx) => {
                    const isHsk2 = m.framework === 'hsk2';
                    return (
                      <span
                        key={idx}
                        className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs border ${
                          isHsk2
                            ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50'
                        }`}
                      >
                        <span className="font-extrabold">{isHsk2 ? 'HSK 2.0' : 'HSK 3.0'}</span>
                        <span className="opacity-80">
                          {isHsk2 ? `Cấp ${m.level_number}` : m.level_number === 7 ? 'Cấp 7–9 (Cao cấp)' : `Cấp ${m.level_number}`}
                        </span>
                        {m.is_exclusive && (
                          <span className="text-[10px] px-1 rounded bg-black/10 dark:bg-white/10 font-medium">
                            Độc quyền
                          </span>
                        )}
                      </span>
                    );
                  })}

                  {detail.entry.radical && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-secondary text-text-secondary border border-border-subtle">
                      Bộ thủ: <span className="font-hanzi font-bold text-text-primary">{detail.entry.radical}</span>
                    </span>
                  )}

                  {detail.entry.pos_vi && detail.entry.pos_vi.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-secondary text-text-secondary border border-border-subtle">
                      <Tag className="w-3 h-3 text-text-muted" />
                      {detail.entry.pos_vi.join(', ')}
                    </span>
                  )}

                  {detail.entry.classifiers && detail.entry.classifiers.length > 0 && (
                    <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-surface-secondary text-text-secondary border border-border-subtle">
                      Lượng từ: <span className="font-hanzi font-bold">{detail.entry.classifiers.join(', ')}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Meanings & Senses */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                  Nghĩa Tiếng Việt Bản Địa Hóa
                </span>
                <div className="bg-surface-secondary/40 border border-border-subtle rounded-2xl p-4 space-y-2">
                  {detail.entry.meanings_vi && detail.entry.meanings_vi.length > 0 ? (
                    <ul className="space-y-2">
                      {detail.entry.meanings_vi.map((m, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-text-primary font-medium leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{m}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-text-muted italic">Đang cập nhật nghĩa tiếng Việt...</p>
                  )}

                  {detail.entry.meanings_en && detail.entry.meanings_en.length > 0 && (
                    <div className="pt-2 border-t border-divider-line mt-3">
                      <p className="text-xs text-text-muted">
                        <strong className="font-semibold text-text-secondary">English Gloss:</strong>{' '}
                        {detail.entry.meanings_en.join('; ')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Word Usage Explanation */}
              <AiWordUsageSection
                word={detail.entry.simplified}
                pinyin={detail.entry.pinyin}
                pos={detail.entry.pos || undefined}
                meanings={detail.entry.meanings_vi}
                hskFramework={detail.memberships[0]?.framework}
                hskLevel={detail.memberships[0]?.level_number}
                autoLoad={true}
              />

              {/* Constituent Characters Breakdown */}
              {detail.hanzi_breakdown && detail.hanzi_breakdown.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-primary" />
                    Cấu tạo Hán tự & Bộ thủ
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {detail.hanzi_breakdown.map((ch, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-border-subtle bg-surface hover:border-primary/40 transition-all flex items-start gap-3"
                      >
                        <div className="w-12 h-12 rounded-xl bg-primary-soft/50 border border-primary/20 flex flex-col items-center justify-center text-primary flex-shrink-0">
                          <span className="text-2xl font-black font-hanzi">{ch.char}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-primary">{ch.pinyin}</span>
                            <span className="text-[11px] text-text-muted">{ch.stroke_count} nét</span>
                          </div>
                          <div className="text-xs text-text-secondary mt-0.5 line-clamp-1">
                            Bộ thủ: <strong className="font-hanzi text-text-primary">{ch.radical_char}</strong> ({ch.radical_name_vi})
                          </div>
                          {onOpenHanzi && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenHanzi(ch.char);
                              }}
                              className="text-[11px] font-semibold text-primary hover:underline mt-1 flex items-center gap-1"
                            >
                              Xem nét viết chữ "{ch.char}" <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* YUYAN Lesson Occurrences (Protected Core Cross-Link) */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-primary" />
                  Xuất hiện trong Bài Khóa YUYAN ({detail.lesson_occurrences.length} câu)
                </span>
                {detail.lesson_occurrences.length === 0 ? (
                  <div className="p-4 rounded-xl border border-border-subtle bg-surface-secondary/30 text-xs text-text-muted">
                    Từ vựng này chưa xuất hiện trong câu thoại bài khóa hiện có của giáo trình.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-60 overflow-y-auto custom-scrollbar">
                    {detail.lesson_occurrences.map((sent, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-border-subtle bg-surface hover:bg-surface-secondary/40 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-primary-soft text-primary">
                            HSK {sent.level} — Bài {sent.lesson_number}: {sent.lesson_title}
                          </span>
                          {onOpenLesson && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenLesson(sent.level, sent.lesson_number);
                              }}
                              className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                            >
                              Mở bài học <ExternalLink className="w-2.5 h-2.5" />
                            </button>
                          )}
                        </div>
                        <p className="font-hanzi text-base font-medium text-text-primary mb-1">
                          {sent.hanzi}
                        </p>
                        <p className="text-xs font-mono text-text-muted mb-1">
                          {sent.pinyin}
                        </p>
                        <p className="text-xs text-text-secondary italic">
                          {sent.vietnamese}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Deep CVDICT Dictionary Link */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-secondary-soft/30 to-primary-soft/30 border border-secondary/20 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center flex-shrink-0">
                    <BookMarked className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-text-primary">Tra cứu trong Từ điển CVDICT Toàn cầu</h4>
                    <p className="text-[11px] text-text-muted">
                      Đối chiếu ngữ nghĩa chi tiết, thành ngữ và cụm từ liên quan trong 122.595 mục từ.
                    </p>
                  </div>
                </div>
                {onOpenDictionary && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenDictionary(detail.entry.simplified);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-secondary text-white text-xs font-bold hover:bg-secondary-hover transition-colors flex items-center gap-1.5 flex-shrink-0 shadow-xs"
                  >
                    <span>Mở Từ điển</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Learner Notes Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase tracking-wider flex items-center justify-between">
                  <span>Ghi chú cá nhân & Mẹo nhớ</span>
                  {isSavingNotes && <span className="text-[10px] text-primary">Đang lưu...</span>}
                </label>
                <div className="flex gap-2">
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Viết ghi chú câu ví dụ, ngữ cảnh hoặc cách nhớ riêng của bạn tại đây..."
                    className="flex-1 p-3 rounded-xl border border-border-subtle bg-surface text-xs text-text-primary placeholder:text-text-muted resize-none h-20 focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-4 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors flex flex-col items-center justify-center gap-1 shadow-xs disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    <span>Lưu</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
