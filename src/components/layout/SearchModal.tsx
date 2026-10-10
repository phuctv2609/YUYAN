import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { lessonRepository } from '../../data/hsk/lessonRepository.ts';
import { vocabularyRepository } from '../../data/repositories/vocabularyRepository.ts';
import { hanziRepository } from '../../data/repositories/hanziRepository.ts';
import { radicalRepository } from '../../data/repositories/radicalRepository.ts';
import { grammarRepository } from '../../data/repositories/grammarRepository.ts';

export interface GlobalSearchResultItem {
  id: string;
  type: 'hsk' | 'vocab' | 'hanzi' | 'radical' | 'grammar';
  labelTag: string; // e.g. [HSK], [词汇], [汉字], [部首], [语法]
  title: string;
  subtitle: string;
  meta: string;
  action: () => void;
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLesson: (level: number, lessonNumber: number) => void;
  onNavigateTab?: (tab: string, meta?: any) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectLesson,
  onNavigateTab,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const latestQueryId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Global multi-entity debounced search
  useEffect(() => {
    const queryId = ++latestQueryId.current;
    const q = query.trim().toLowerCase();
    if (!q) {
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      if (queryId !== latestQueryId.current) return;

      const items: GlobalSearchResultItem[] = [];

      // 1. [HSK] Lessons
      const lessons = lessonRepository.filterLessons({ query: q }).slice(0, 4);
      for (const l of lessons) {
        items.push({
          id: `hsk_${l.lessonId}`,
          type: 'hsk',
          labelTag: '[HSK]',
          title: `Bài ${l.lessonNumber}: ${l.title}`,
          subtitle: l.lessonText[0]?.hanzi || '',
          meta: `HSK ${l.level}`,
          action: () => {
            onSelectLesson(l.level, l.lessonNumber);
            onClose();
          },
        });
      }

      // 2. [词汇] Vocabulary
      const vocabs = vocabularyRepository.search({ query: q }).slice(0, 5);
      for (const v of vocabs) {
        items.push({
          id: `vocab_${v.id}`,
          type: 'vocab',
          labelTag: '[词汇]',
          title: `${v['汉字']} (${v['Pinyin']})`,
          subtitle: v['Nghĩa tiếng Việt'] || '',
          meta: `HSK ${v.hskLevel} • Bài ${v.lessonNumber}`,
          action: () => {
            if (onNavigateTab) onNavigateTab('dictionary');
            onClose();
          },
        });
      }

      // 3. [汉字] Hanzi
      const hanzis = hanziRepository.search({ query: q }).slice(0, 4);
      for (const h of hanzis) {
        items.push({
          id: `hanzi_${h.char}`,
          type: 'hanzi',
          labelTag: '[汉字]',
          title: `${h.char} [${h.pinyin[0]}]`,
          subtitle: h.meanings.join('; '),
          meta: `Bộ ${h.radical} • ${h.strokeCount} nét`,
          action: () => {
            if (onNavigateTab) onNavigateTab('hanzi');
            onClose();
          },
        });
      }

      // 4. [部首] Radicals
      const radicals = radicalRepository.search({ query: q }).slice(0, 3);
      for (const r of radicals) {
        items.push({
          id: `rad_${r.id}`,
          type: 'radical',
          labelTag: '[部首]',
          title: `Bộ ${r.nameVi} (${r.char})`,
          subtitle: `${r.nameZh} • Ý nghĩa: ${r.meaning}`,
          meta: `#${r.radicalNumber} • ${r.strokeCount} nét`,
          action: () => {
            if (onNavigateTab) onNavigateTab('radicals');
            onClose();
          },
        });
      }

      // 5. [语法] Grammar
      const grammars = grammarRepository.getAll().filter(
        (g) => g.title.toLowerCase().includes(q) || g.explanation.toLowerCase().includes(q)
      ).slice(0, 2);
      for (const g of grammars) {
        items.push({
          id: `gram_${g.id}`,
          type: 'grammar',
          labelTag: '[语法]',
          title: g.title,
          subtitle: g.explanation,
          meta: `HSK ${g.level} Bài ${g.lessonNumber}`,
          action: () => {
            if (onNavigateTab) onNavigateTab('grammar');
            onClose();
          },
        });
      }

      setResults(items);
    }, 120);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-start justify-center pt-16 sm:pt-24 px-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-2xl bg-surface border border-border-subtle rounded-3xl shadow-2xl overflow-hidden z-10 card-motion animate-in zoom-in-95 duration-150">
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-divider-line flex items-center gap-3">
          <Search className="w-5 h-5 text-text-muted flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm kiếm bài học, từ vựng, chữ Hán, bộ thủ, ngữ pháp..."
            className="w-full bg-transparent text-text-primary text-sm sm:text-base placeholder:text-text-muted outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="hidden sm:inline text-[11px] font-bold text-text-muted bg-surface-secondary px-2 py-0.5 rounded border border-border-subtle">
            ESC
          </span>
        </div>

        {/* Search Results Area */}
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-3 space-y-1">
          {query.trim() === '' ? (
            <div className="py-12 px-6 text-center space-y-2 text-text-muted">
              <Sparkles className="w-8 h-8 mx-auto text-primary opacity-60" />
              <p className="text-xs sm:text-sm font-semibold text-text-primary">
                Tìm kiếm toàn diện trong toàn bộ hệ thống YUYAN
              </p>
              <p className="text-xs text-text-muted max-w-md mx-auto">
                Nhập tên bài học (Bài 1, 你好), từ mới (学习), chữ Hán (学), bộ thủ (氵, Thủy), hoặc điểm ngữ pháp.
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 px-6 text-center text-text-muted space-y-1">
              <p className="text-sm font-semibold text-text-primary">Không tìm thấy kết quả phù hợp</p>
              <p className="text-xs">Thử tìm kiếm với chữ Hán, Pinyin không dấu hoặc nghĩa tiếng Việt.</p>
            </div>
          ) : (
            results.map((item) => {
              const tagColor =
                item.type === 'hsk'
                  ? 'bg-primary-soft text-primary'
                  : item.type === 'vocab'
                  ? 'bg-secondary/15 text-secondary'
                  : item.type === 'hanzi'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : item.type === 'radical'
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                  : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400';

              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between gap-3 p-3 rounded-2xl hover:bg-surface-secondary text-left transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex-shrink-0 font-hanzi ${tagColor}`}>
                      {item.labelTag}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-text-primary truncate">
                          {item.title}
                        </span>
                        <span className="text-[11px] text-text-muted flex-shrink-0">
                          {item.meta}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
