import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Headphones,
  Mic,
  PenTool,
  MoveHorizontal,
  AlertCircle,
  Award,
  BookMarked,
  Briefcase,
  Layers,
  FileSpreadsheet,
  Quote,
  GraduationCap,
  TrendingUp,
  Settings,
  Sparkles,
  ArrowRight,
  Bot,
} from 'lucide-react';

export interface MoreFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tabId: string) => void;
}

interface FeatureItem {
  id: string;
  name: string;
  desc: string;
  badge?: string;
  category: 'practice' | 'reference' | 'personal';
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const ALL_FEATURES: FeatureItem[] = [
  // Luyện tập đa giác quan
  {
    id: 'listening',
    name: 'Luyện nghe',
    desc: 'Hội thoại chuẩn Bắc Kinh theo cấp độ có kiểm tra',
    category: 'practice',
    icon: Headphones,
    color: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-200/60 dark:border-sky-800/40',
  },
  {
    id: 'speaking',
    name: 'Luyện nói',
    desc: 'Luyện phát âm câu mẫu chuẩn giọng bản xứ với AI chấm âm',
    category: 'practice',
    icon: Mic,
    color: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40',
  },
  {
    id: 'writing',
    name: 'Luyện viết Hán tự',
    desc: 'Tập tô & viết Hán tự trực tiếp trên màn hình theo thứ tự nét bút',
    category: 'practice',
    icon: PenTool,
    color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40',
  },
  {
    id: 'sentence-ordering',
    name: 'Xếp câu ngữ pháp',
    desc: 'Sắp xếp trật tự từ tiếng Trung chuẩn ngữ pháp và ngữ cảnh',
    category: 'practice',
    icon: MoveHorizontal,
    color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
  },
  {
    id: 'mistakes',
    name: 'Sổ câu sai',
    desc: 'Ghi nhớ và ôn tập các câu làm sai theo phương pháp ngắt quãng SRS',
    category: 'practice',
    icon: AlertCircle,
    color: 'bg-orange-500/15 text-orange-600 dark:text-orange-400 border-orange-200/60 dark:border-orange-800/40',
  },
  {
    id: 'exam',
    name: 'Thi thử HSK',
    desc: 'Đề thi mô phỏng HSK 1–6 chính thức có tính điểm thật và áp lực thời gian',
    badge: 'HSK 1-6',
    category: 'practice',
    icon: Award,
    color: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-200/60 dark:border-purple-800/40',
  },

  // Tra cứu & Kho tri thức
  {
    id: 'dictionary',
    name: 'Từ điển CVDICT',
    desc: 'Tra cứu 122.595 mục từ Hán-Việt với Pinyin, giải nghĩa & câu ví dụ',
    badge: '122K+ từ',
    category: 'reference',
    icon: BookMarked,
    color: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-200/60 dark:border-indigo-800/40',
  },
  {
    id: 'specialized',
    name: 'Từ vựng chuyên ngành',
    desc: '10.000 từ vựng và thuật ngữ thực tế từ 26 lĩnh vực then chốt',
    badge: '26 Ngành',
    category: 'reference',
    icon: Briefcase,
    color: 'bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-200/60 dark:border-teal-800/40',
  },
  {
    id: 'radicals',
    name: '214 Bộ thủ Khang Hy',
    desc: 'Đầy đủ 214 bộ thủ Khang Hy tra cứu nhanh với biến thể và giải nghĩa',
    category: 'reference',
    icon: Layers,
    color: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-200/60 dark:border-cyan-800/40',
  },
  {
    id: 'hanzi',
    name: 'Hán tự chi tiết',
    desc: '1.059 Hán tự chi tiết kèm thứ tự nét động, âm Hán-Việt và bộ thủ',
    category: 'reference',
    icon: FileSpreadsheet,
    color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40',
  },
  {
    id: 'grammar',
    name: 'Ngữ pháp trọng tâm',
    desc: 'Các điểm ngữ pháp HSK trọng tâm, giải thích công thức và so sánh cấu trúc',
    category: 'reference',
    icon: Quote,
    color: 'bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-200/60 dark:border-violet-800/40',
  },
  {
    id: 'beginner',
    name: 'Người mới bắt đầu',
    desc: 'Pinyin, thanh điệu, quy tắc biến điệu và những mẫu câu vỡ lòng',
    badge: 'Cơ bản',
    category: 'reference',
    icon: GraduationCap,
    color: 'bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-200/60 dark:border-pink-800/40',
  },

  // Cá nhân hóa & Trợ lý
  {
    id: 'ai',
    name: 'AI Hội thoại',
    desc: 'Luyện giao tiếp phản xạ 24/7 với gia sư AI bản xứ theo 5 chế độ',
    badge: 'Trực tuyến',
    category: 'personal',
    icon: Bot,
    color: 'bg-primary-soft text-primary border-primary/30',
  },
  {
    id: 'progress',
    name: 'Tiến độ học tập',
    desc: 'Thống kê ghi nhớ SRS, chuỗi học liên tục và biểu đồ hoàn thành HSK',
    category: 'personal',
    icon: TrendingUp,
    color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40',
  },
  {
    id: 'settings',
    name: 'Cài đặt & Hồ sơ',
    desc: 'Tùy chỉnh thông tin tài khoản, mục tiêu HSK, giọng đọc và giao diện',
    category: 'personal',
    icon: Settings,
    color: 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-200/60 dark:border-slate-800/40',
  },
];

export const MoreFeaturesModal: React.FC<MoreFeaturesModalProps> = ({
  isOpen,
  onClose,
  onSelectTab,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'practice' | 'reference' | 'personal'>('all');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredFeatures = ALL_FEATURES.filter((item) => {
    const matchesSearch =
      !searchQuery.trim() ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleChoose = (tabId: string) => {
    onSelectTab(tabId);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-modal flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Khám phá thêm tính năng YUYAN"
    >
      <div className="bg-surface border border-border-subtle rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text-primary">
                Khám phá thêm tính năng YUYAN
              </h2>
              <p className="text-xs text-text-muted">
                Truy cập nhanh toàn bộ 15+ công cụ và chuyên mục học tiếng Trung
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row gap-2.5 flex-shrink-0">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm tính năng, công cụ học tập..."
              className="w-full h-10 pl-9 pr-3 bg-input-bg border border-border-subtle rounded-xl text-xs sm:text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          <div className="flex gap-1.5 p-1 bg-surface-secondary rounded-xl overflow-x-auto text-xs shrink-0 select-none">
            {[
              { id: 'all', label: 'Tất cả' },
              { id: 'practice', label: 'Luyện tập' },
              { id: 'reference', label: 'Tra cứu' },
              { id: 'personal', label: 'Cá nhân' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  activeCategory === cat.id
                    ? 'bg-surface text-primary shadow-2xs font-bold'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feature Grid Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 space-y-3 min-h-[280px]">
          {filteredFeatures.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-xs">
              Không tìm thấy tính năng nào phù hợp với từ khóa "{searchQuery}"
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredFeatures.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleChoose(item.id)}
                    className="p-3.5 rounded-2xl bg-surface border border-border-subtle hover:border-primary/50 hover:bg-surface-secondary/70 shadow-2xs hover:shadow-md transition-all text-left flex flex-col justify-between group active:scale-98"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-110 ${item.color}`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        {item.badge && (
                          <span className="text-3xs font-extrabold px-1.5 py-0.5 rounded-md bg-secondary/15 text-secondary">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h3 className="text-xs sm:text-sm font-bold text-text-primary group-hover:text-primary transition-colors leading-tight">
                        {item.name}
                      </h3>
                      <p className="text-2xs text-text-muted mt-1 leading-snug line-clamp-2">
                        {item.desc}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-divider-line flex items-center justify-between text-3xs font-semibold text-text-muted group-hover:text-primary transition-colors">
                      <span>Mở tính năng</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
