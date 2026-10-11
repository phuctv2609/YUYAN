import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Bot,
  Send,
  Sparkles,
  BookOpen,
  Layers,
  ShieldAlert,
  Loader2,
  Copy,
  Check,
} from 'lucide-react';
import { DictionaryResult } from '../../../services/dictionary/dictionaryTypes';
import { useToast } from '../../ui/Toast';
import { aiApiService } from '../../../services/ai/aiApiService';

interface GeminiTutorModalProps {
  item: DictionaryResult | null;
  onClose: () => void;
}

type TutorMode = 'context' | 'synonyms' | 'examples' | 'custom';

export const GeminiTutorModal: React.FC<GeminiTutorModalProps> = ({ item, onClose }) => {
  const { showToast } = useToast();
  const [activeMode, setActiveMode] = useState<TutorMode>('context');
  const [customQuestion, setCustomQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customResponse, setCustomResponse] = useState<string | null>(null);

  if (!item) return null;

  // Pedagogical analysis content generated from authoritative word metadata
  const getContextAnalysis = () => {
    return (
      <div className="space-y-4 text-xs text-text-primary leading-relaxed">
        <div className="p-3.5 rounded-2xl bg-primary-soft/30 border border-primary/20 space-y-1">
          <h4 className="font-bold text-primary flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Đặc điểm ngữ dụng &amp; Sắc thái biểu đạt</span>
          </h4>
          <p className="text-text-secondary">
            Từ <strong className="text-text-primary font-hanzi">{item.hanzi}</strong> ({item.pinyin})
            {item.wordType ? ` thuộc từ loại [${item.wordType}]` : ''}, mang nghĩa chính là{' '}
            <strong className="text-text-primary">&ldquo;{item.vietnamese}&rdquo;</strong>.
            {item.professionalDomains && item.professionalDomains.length > 0
              ? ' Đây là thuật ngữ có tần suất sử dụng rất cao trong môi trường công vụ, thương mại và chuyên ngành chuyên môn.'
              : ' Thường xuất hiện phổ biến trong giao tiếp chuẩn mực, văn viết và các đề thi HSK.'}
          </p>
        </div>

        <div className="space-y-2">
          <h5 className="font-bold text-text-primary">1. Ngữ cảnh sử dụng tiêu biểu:</h5>
          <ul className="list-disc list-inside space-y-1 text-text-secondary pl-1">
            <li>
              <strong>Trong văn phong thường nhật:</strong> Thể hiện sắc thái trung tính, lịch sự và rõ ràng.
            </li>
            <li>
              <strong>Trong môi trường công sở / đối tác:</strong> Dùng chính xác theo đúng ngữ pháp tiêu chuẩn, kết hợp tự nhiên với các định ngữ và bổ ngữ tương ứng.
            </li>
            {item.hanViet && (
              <li>
                <strong>Liên hệ Hán Việt:</strong> Âm Hán Việt là{' '}
                <span className="font-bold text-primary uppercase">{item.hanViet}</span>, giúp người Việt ghi nhớ nhanh chóng và nhận diện các từ ghép cùng gốc.
              </li>
            )}
          </ul>
        </div>

        {item.collocations && item.collocations.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-bold text-text-primary">2. Cụm từ cố định nên thuộc lòng:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {item.collocations.map((col, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-surface border border-border-subtle font-hanzi">
                  <span className="font-bold text-text-primary">{col}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-text-secondary">
          <strong className="text-amber-600 dark:text-amber-400">💡 Mẹo ghi nhớ sư phạm:</strong> Hãy tập đặt câu với từ này kèm theo đối tượng cụ thể (chủ ngữ + {item.hanzi} + tân ngữ) để biến từ vựng thành phản xạ tự nhiên.
        </div>
      </div>
    );
  };

  const getSynonymAnalysis = () => {
    return (
      <div className="space-y-4 text-xs text-text-primary leading-relaxed">
        <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
          <h4 className="font-bold text-text-primary flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-secondary" />
            <span>So sánh sắc thái với các từ lân cận</span>
          </h4>
          <p className="text-text-secondary">
            Từ khóa trọng tâm: <strong className="font-hanzi text-primary">{item.hanzi}</strong> ({item.pinyin}) — {item.vietnamese}.
          </p>
        </div>

        {item.synonyms && item.synonyms.length > 0 ? (
          <div className="space-y-2">
            <h5 className="font-bold text-emerald-600 dark:text-emerald-400">Từ đồng nghĩa (近义词):</h5>
            <div className="space-y-2">
              {item.synonyms.map((syn, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surface border border-border-subtle space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-hanzi font-bold text-sm text-text-primary">{syn}</span>
                    <span className="text-[10px] text-text-muted">Gần nghĩa</span>
                  </div>
                  <p className="text-[11px] text-text-secondary">
                    Có nét nghĩa tương đồng với <span className="font-hanzi font-bold">{item.hanzi}</span>, tuy nhiên cần chú ý đối tượng kết hợp và cấp độ trang trọng trong câu.
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-surface border border-border-subtle text-text-secondary space-y-2">
            <p>
              Từ <span className="font-hanzi font-bold text-text-primary">{item.hanzi}</span> mang nghĩa tương đối đặc thù và đơn nghĩa trong phạm trù học thuật / chuyên ngành.
            </p>
            <p className="text-[11px] text-text-muted">
              Không có từ đồng nghĩa thay thế hoàn toàn trong cùng ngữ cảnh hẹp. Hãy chú ý sử dụng đúng từ ngữ chính xác này để tránh gây hiểu lầm trong công việc.
            </p>
          </div>
        )}

        {item.antonyms && item.antonyms.length > 0 && (
          <div className="space-y-2">
            <h5 className="font-bold text-rose-600 dark:text-rose-400">Từ trái nghĩa (反义词):</h5>
            <div className="flex flex-wrap gap-2">
              {item.antonyms.map((ant, idx) => (
                <div key={idx} className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-hanzi font-bold text-xs">
                  {ant}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getExampleAnalysis = () => {
    return (
      <div className="space-y-4 text-xs text-text-primary leading-relaxed">
        <p className="text-text-secondary">
          3 ví dụ mẫu ứng dụng <strong className="font-hanzi text-primary">{item.hanzi}</strong> trong 3 hoàn cảnh thực tế:
        </p>

        {/* Bối cảnh 1: Giao tiếp hàng ngày */}
        <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle space-y-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 uppercase">
            Bối cảnh 1: Đời sống &amp; Giao tiếp thường ngày
          </span>
          <p className="font-hanzi text-sm font-bold text-text-primary">
            {item.examples && item.examples[0] ? item.examples[0].zh : `日常生活中，我们经常需要用到“${item.hanzi}”。`}
          </p>
          <p className="text-deep-blue text-[11px] font-semibold">
            {item.examples && item.examples[0]?.pinyin ? item.examples[0].pinyin : 'Rìcháng shēnghuó zhōng, wǒmen jīngcháng xūyào yòngdào...'}
          </p>
          <p className="text-text-secondary text-[11px]">
            {item.examples && item.examples[0]?.vi ? item.examples[0].vi : `Trong cuộc sống hàng ngày, chúng ta thường xuyên cần dùng đến "${item.vietnamese}".`}
          </p>
        </div>

        {/* Bối cảnh 2: Môi trường công sở */}
        <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle space-y-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
            Bối cảnh 2: Môi trường công sở &amp; Doanh nghiệp
          </span>
          <p className="font-hanzi text-sm font-bold text-text-primary">
            在工作汇报中，请务必确认{item.hanzi}的具体细节。
          </p>
          <p className="text-deep-blue text-[11px] font-semibold">
            Zài gōngzuò huìbào zhōng, qǐng wùbì quèrèn {item.pinyin} de jùtǐ xìjié.
          </p>
          <p className="text-text-secondary text-[11px]">
            Trong báo cáo công việc, xin hãy xác nhận chi tiết cụ thể về {item.vietnamese}.
          </p>
        </div>

        {/* Bối cảnh 3: Đàm phán & Thương mại */}
        <div className="p-3.5 rounded-2xl bg-surface border border-border-subtle space-y-1.5">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase">
            Bối cảnh 3: Hợp tác thương mại &amp; Đối tác
          </span>
          <p className="font-hanzi text-sm font-bold text-text-primary">
            双方已就有关{item.hanzi}的所有条款达成了一致意见。
          </p>
          <p className="text-deep-blue text-[11px] font-semibold">
            Shuāngfāng yǐ jiù yǒuguān {item.pinyin} de suǒyǒu tiáokuǎn dáchéng le yīzhì yìjiàn.
          </p>
          <p className="text-text-secondary text-[11px]">
            Hai bên đã đạt được thỏa thuận thống nhất về toàn bộ điều khoản liên quan đến {item.vietnamese}.
          </p>
        </div>
      </div>
    );
  };

  const handleAskCustom = async () => {
    if (!customQuestion.trim() || isLoading) return;
    setIsLoading(true);

    try {
      const response = await aiApiService.askTutorCustomQuestion({
        headword: item.hanzi,
        pinyin: item.pinyin || '',
        vietnamese: item.vietnamese || '',
        question: customQuestion.trim(),
      });
      setCustomResponse(response);
      showToast('Gia sư Gemini đã giải đáp câu hỏi của bạn', 'info');
    } catch (err: any) {
      console.error('Tutor custom Q&A failed:', err);
      setCustomResponse(`Lỗi: ${err?.message || 'Không thể kết nối tới dịch vụ AI Gemini.'}`);
      showToast('Không thể gửi câu hỏi tới Gia sư AI', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast('Đã sao chép nội dung phân tích', 'info');
    setTimeout(() => setCopied(false), 2000);
  };

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

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-3 sm:p-5 md:p-6 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 isolate"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-surface border border-border-subtle rounded-2xl sm:rounded-3xl max-w-2xl w-full h-auto max-h-[calc(100dvh-28px)] sm:max-h-[calc(100dvh-48px)] flex flex-col shadow-2xl overflow-hidden card-motion"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 sm:px-6 border-b border-border-subtle flex items-start justify-between gap-4 bg-gradient-to-r from-primary-soft/40 via-surface to-secondary-soft/30 flex-shrink-0">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">
              <Bot className="w-3.5 h-3.5" />
              <span>Gia sư AI YUYAN (Gemini Pedagogical Tutor)</span>
            </div>
            <div className="flex items-baseline gap-2 pt-1">
              <h2 className="text-2xl sm:text-3xl font-hanzi font-bold text-text-primary">
                {item.hanzi}
              </h2>
              <span className="text-base font-bold text-deep-blue">{item.pinyin}</span>
              <span className="text-xs text-text-secondary">• {item.vietnamese}</span>
            </div>
          </div>

          <button
            data-testid="gemini-modal-close-btn"
            onClick={onClose}
            className="p-2 rounded-xl bg-surface hover:bg-surface-secondary text-text-muted hover:text-text-primary border border-border-subtle transition-colors"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-1.5 px-5 sm:px-6 py-3 border-b border-border-subtle bg-surface-secondary/50 overflow-x-auto scrollbar-none flex-shrink-0">
          <button
            onClick={() => setActiveMode('context')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeMode === 'context'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ngữ cảnh &amp; Ứng dụng</span>
          </button>

          <button
            onClick={() => setActiveMode('synonyms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeMode === 'synonyms'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Phân biệt từ gần nghĩa</span>
          </button>

          <button
            onClick={() => setActiveMode('examples')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeMode === 'examples'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>3 Bối cảnh ví dụ</span>
          </button>

          <button
            onClick={() => setActiveMode('custom')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeMode === 'custom'
                ? 'bg-primary text-white shadow-xs'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Hỏi đáp tự do</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 min-h-0 custom-scrollbar overscroll-contain">
          {activeMode === 'context' && getContextAnalysis()}
          {activeMode === 'synonyms' && getSynonymAnalysis()}
          {activeMode === 'examples' && getExampleAnalysis()}
          {activeMode === 'custom' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-surface-secondary border border-border-subtle space-y-2">
                <p className="text-xs text-text-secondary leading-relaxed">
                  Bạn có thắc mắc cụ thể về cách dùng từ <strong className="font-hanzi text-text-primary">{item.hanzi}</strong> trong bài thi, công việc hay cấu trúc câu? Hãy gửi câu hỏi cho Gia sư Gemini:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAskCustom()}
                    placeholder="Ví dụ: Từ này có thể dùng làm bổ ngữ kết quả được không?..."
                    className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-surface border border-border-subtle focus:border-primary focus:outline-none text-text-primary placeholder:text-text-muted"
                  />
                  <button
                    onClick={handleAskCustom}
                    disabled={isLoading || !customQuestion.trim()}
                    className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover disabled:opacity-50 transition-colors flex items-center gap-1"
                  >
                    {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Gửi</span>
                  </button>
                </div>
              </div>

              {customResponse && (
                <div className="p-4 rounded-2xl bg-primary-soft/30 border border-primary/20 space-y-2 text-xs leading-relaxed">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary flex items-center gap-1.5">
                      <Bot className="w-3.5 h-3.5" />
                      <span>Giải đáp từ Gia sư Gemini:</span>
                    </span>
                    <button
                      onClick={() => handleCopyText(customResponse)}
                      className="p-1 rounded text-text-muted hover:text-text-primary"
                      title="Sao chép"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-text-primary">{customResponse}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with Gemini Safety & Pedagogical Notice */}
        <div className="p-4 border-t border-border-subtle bg-surface-secondary/40 flex items-center justify-between gap-3 text-[11px] text-text-muted">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>Gia sư AI cung cấp hướng dẫn sư phạm, không can thiệp hay sửa đổi cơ sở dữ liệu.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-surface border border-border-subtle text-xs font-bold text-text-secondary hover:text-text-primary transition-colors ml-auto flex-shrink-0"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
