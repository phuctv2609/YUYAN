import React, { useState } from 'react';
import {
  Mic,
  Send,
  Volume2,
  Play,
  Star,
  ArrowRight,
  TrendingUp,
  Award,
  BookMarked,
  FileSpreadsheet,
  Bot,
  Briefcase,
  Paperclip,
  Headphones,
  BookOpen,
  Edit3,
  X,
  LayoutGrid,
} from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { useYuyanAI } from '../../context/YuyanAIContext';
import { speechSynthesisService } from '../../services/speech/speechSynthesisService';

export interface AiConversationViewProps {
  onSelectTab?: (tab: string) => void;
  onOpenMoreFeatures?: () => void;
}

export const AiConversationView: React.FC<AiConversationViewProps> = ({
  onSelectTab,
  onOpenMoreFeatures,
}) => {
  const { showToast } = useToast();
  const { openAssistant, openVoiceModal } = useYuyanAI();

  const [inputVal, setInputVal] = useState('');
  const [playingAudioKey, setPlayingAudioKey] = useState<string | null>(null);
  const [favoriteWords, setFavoriteWords] = useState<Record<string, boolean>>({});
  const [isHeroDismissed, setIsHeroDismissed] = useState(false);

  const handlePlayAudio = (key: string, text: string) => {
    if (playingAudioKey === key) {
      speechSynthesisService.stop();
      setPlayingAudioKey(null);
      return;
    }
    setPlayingAudioKey(key);
    void speechSynthesisService.speakBilingual({
      text,
      readingMode: 'chinese_only',
      onEnd: () => setPlayingAudioKey(null),
      onError: () => setPlayingAudioKey(null),
    });
  };

  const handleToggleFavorite = (word: string) => {
    setFavoriteWords((prev) => {
      const next = { ...prev, [word]: !prev[word] };
      showToast(next[word] ? `Đã lưu từ "${word}" vào sổ từ vựng yêu thích` : `Đã bỏ lưu "${word}"`, 'info');
      return next;
    });
  };

  const handleSubmitQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    const query = inputVal.trim();
    setInputVal('');
    openAssistant(query);
  };

  const handleQuickChipClick = (scenarioPrompt: string) => {
    openAssistant(scenarioPrompt);
  };

  const handleNavigate = (tab: string) => {
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

  const featuredVocab = [
    { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'xin chào', key: 'vocab_1' },
    { hanzi: '谢谢', pinyin: 'xièxie', meaning: 'cảm ơn', key: 'vocab_2' },
    { hanzi: '再见', pinyin: 'zàijiàn', meaning: 'tạm biệt', key: 'vocab_3' },
    { hanzi: '名字', pinyin: 'míngzi', meaning: 'tên', key: 'vocab_4' },
    { hanzi: '学生', pinyin: 'xuésheng', meaning: 'học sinh', key: 'vocab_5' },
  ];

  return (
    <div className="max-w-[1440px] mx-auto p-3 sm:p-6 lg:p-8 space-y-6 animate-in fade-in duration-200 select-none">
      {/* 1. TOP 3-COLUMN BENTO GRID MATCHING REFERENCE IMAGE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7/12 on LG, 8/12 on XL): Interactive Conversation Hero Card */}
        <div className="lg:col-span-7 xl:col-span-7 rounded-3xl bg-gradient-to-br from-sky-100 via-sky-50 to-indigo-100/70 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950/40 border border-sky-200/70 dark:border-sky-900/40 p-5 sm:p-7 shadow-sm flex flex-col justify-between relative overflow-hidden min-h-[380px]">
          {/* Ambient art overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-400 via-transparent to-transparent" />

          {/* Dismiss button (matching X icon on reference image) */}
          {!isHeroDismissed && (
            <button
              onClick={() => setIsHeroDismissed(true)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/70 dark:bg-slate-800/70 hover:bg-white dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors z-20 shadow-2xs"
              title="Ẩn thông báo chào mừng"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Top Section: Character Visual + Speech Bubbles */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 z-10">
            {/* Traditional Hanfu Chinese Girl Avatar Illustration */}
            <div className="relative shrink-0 select-none">
              <div className="w-24 h-24 sm:w-32 sm:h-32 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-white dark:border-slate-700 shadow-md bg-gradient-to-tr from-sky-400 to-indigo-300 flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80"
                  alt="Yuyan AI Tutor"
                  className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-500"
                />
              </div>
              <span className="absolute -bottom-1.5 -right-1.5 px-2 py-0.5 rounded-full bg-primary text-white text-[10px] font-bold shadow-xs">
                Yuyan AI
              </span>
            </div>

            {/* Conversation Bubbles */}
            <div className="flex-1 space-y-2.5 w-full">
              {/* Bubble 1: "你好！" */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-sky-200/60 dark:border-slate-700 shadow-2xs backdrop-blur-xs flex items-center justify-between gap-3">
                <div>
                  <div className="font-hanzi text-base sm:text-lg font-bold text-slate-800 dark:text-white leading-tight">
                    你好！
                  </div>
                  <div className="text-2xs font-mono font-medium text-teal-600 dark:text-teal-400">
                    Nǐ hǎo!
                  </div>
                  <div className="text-2xs text-slate-500 dark:text-slate-400 italic">
                    Xin chào!
                  </div>
                </div>
                <button
                  onClick={() => handlePlayAudio('bubble_1', '你好！')}
                  className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                    playingAudioKey === 'bubble_1'
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-primary border-sky-200/80 hover:scale-105 shadow-2xs'
                  }`}
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Bubble 2: "你今天想学习什么？" */}
              <div className="p-3 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-slate-800/90 border border-sky-200/60 dark:border-slate-700 shadow-2xs backdrop-blur-xs flex items-center justify-between gap-3">
                <div>
                  <div className="font-hanzi text-base sm:text-lg font-bold text-slate-800 dark:text-white leading-tight">
                    你今天想学习什么？
                  </div>
                  <div className="text-2xs font-mono font-medium text-teal-600 dark:text-teal-400">
                    Nǐ jīntiān xiǎng xuéxí shénme?
                  </div>
                  <div className="text-2xs text-slate-500 dark:text-slate-400 italic">
                    Hôm nay bạn muốn học gì?
                  </div>
                </div>
                <button
                  onClick={() => handlePlayAudio('bubble_2', '你今天想学习什么？')}
                  className={`w-8 h-8 rounded-full border transition-all flex items-center justify-center shrink-0 ${
                    playingAudioKey === 'bubble_2'
                      ? 'bg-primary text-white border-primary shadow-xs'
                      : 'bg-white dark:bg-slate-700 text-primary border-sky-200/80 hover:scale-105 shadow-2xs'
                  }`}
                  title="Nghe phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Middle: 4 Quick Scenario Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 pb-3 z-10">
            {[
              {
                id: 'speaking',
                zh: '练习口语',
                vi: 'Luyện nói',
                icon: Mic,
                prompt: 'Chúng ta hãy luyện giao tiếp khẩu ngữ tiếng Trung nhé!',
              },
              {
                id: 'vocab',
                zh: '学新词',
                vi: 'Học từ mới',
                icon: BookOpen,
                prompt: 'Hãy dạy tôi 3 từ vựng tiếng Trung hữu ích hôm nay kèm ví dụ.',
              },
              {
                id: 'grammar',
                zh: '语法讲解',
                vi: 'Giải thích ngữ pháp',
                icon: Edit3,
                prompt: 'Giải thích điểm ngữ pháp quan trọng trong tiếng Trung giao tiếp.',
              },
              {
                id: 'listening',
                zh: '听力练习',
                vi: 'Luyện nghe',
                icon: Headphones,
                prompt: 'Tạo một đoạn hội thoại ngắn để tôi luyện nghe và trả lời câu hỏi.',
              },
            ].map((chip) => {
              const Icon = chip.icon;
              return (
                <button
                  key={chip.id}
                  onClick={() => handleQuickChipClick(chip.prompt)}
                  className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-slate-800/80 border border-sky-200/60 dark:border-slate-700 hover:border-primary/50 hover:bg-white dark:hover:bg-slate-800 shadow-2xs text-center transition-all group active:scale-95"
                >
                  <div className="w-7 h-7 mx-auto rounded-lg bg-sky-50 dark:bg-slate-700 text-primary flex items-center justify-center mb-1 group-hover:scale-110 transition-transform">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="font-hanzi font-bold text-xs text-slate-800 dark:text-white leading-tight">
                    {chip.zh}
                  </div>
                  <div className="text-[10px] text-text-muted leading-tight mt-0.5">
                    {chip.vi}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom: Interactive Search & Chat Composer Bar */}
          <form
            onSubmit={handleSubmitQuestion}
            className="relative z-10 flex items-center gap-2 bg-white dark:bg-slate-800 rounded-full border border-sky-300/70 dark:border-slate-700 p-1.5 shadow-md focus-within:border-primary transition-all"
          >
            <button
              type="button"
              onClick={openVoiceModal}
              className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 hover:text-primary hover:bg-primary-soft transition-colors flex items-center justify-center shrink-0"
              title="Luyện nói bằng giọng nói"
            >
              <Mic className="w-4 h-4" />
            </button>

            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Nhập câu hỏi bằng tiếng Trung hoặc tiếng Việt..."
              className="flex-1 bg-transparent px-2 text-xs sm:text-sm text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none min-w-0"
            />

            <button
              type="button"
              onClick={() => openAssistant('Phân tích và giải thích giúp tôi nội dung này')}
              className="p-2 text-slate-400 hover:text-primary transition-colors shrink-0"
              title="Đính kèm tệp tin"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <button
              type="submit"
              disabled={!inputVal.trim()}
              className="w-9 h-9 rounded-full bg-primary hover:bg-primary-hover disabled:opacity-40 text-white flex items-center justify-center transition-all shrink-0 active:scale-95 shadow-xs"
              title="Gửi câu hỏi"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Middle Column (3/12): "Bài học hôm nay" (Today's Lesson Card) */}
        <div className="lg:col-span-5 xl:col-span-3 rounded-3xl bg-surface border border-border-subtle p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary">Bài học hôm nay</h3>
              <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                HSK 2
              </span>
            </div>

            {/* Scenic Chinese Pagoda Thumbnail with Play Button */}
            <div
              onClick={() => handleNavigate('lesson')}
              className="relative h-32 rounded-2xl overflow-hidden cursor-pointer group shadow-2xs border border-border-subtle mb-3"
            >
              <img
                src="https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=600&q=80"
                alt="Chinese Pagoda Scenic"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-white/90 text-primary flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </div>
            </div>

            {/* Lesson Title & Translation */}
            <div className="space-y-1">
              <h4 className="font-hanzi font-bold text-sm text-text-primary leading-snug">
                第1课 你好，你叫什么名字？
              </h4>
              <p className="text-2xs font-mono text-text-muted">
                Dì 1 kè Nǐ hǎo, nǐ jiào shénme míngzi?
              </p>
              <p className="text-2xs text-text-secondary">
                Bài 1: Xin chào, bạn tên là gì?
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-divider-line space-y-3">
            <div className="flex items-center justify-between text-2xs text-text-muted">
              <span>Tiến độ hoàn thành</span>
              <span className="font-bold text-text-primary">0%</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-surface-secondary overflow-hidden">
              <div className="h-full bg-primary rounded-full w-0" />
            </div>

            <button
              onClick={() => handleNavigate('lesson')}
              className="w-full py-2.5 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              <span>Bắt đầu học</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (2/12 on XL, 12/12 on LG): "Từ vựng nổi bật" */}
        <div className="lg:col-span-12 xl:col-span-2 rounded-3xl bg-surface border border-border-subtle p-5 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-text-primary">Từ vựng nổi bật</h3>
              <button
                onClick={() => handleNavigate('vocabulary')}
                className="text-2xs text-primary hover:underline font-semibold flex items-center gap-0.5"
              >
                <span>Xem thêm</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Vocabulary list */}
            <div className="space-y-2">
              {featuredVocab.map((v) => {
                const isFav = Boolean(favoriteWords[v.hanzi]);
                return (
                  <div
                    key={v.key}
                    className="p-2.5 rounded-2xl bg-surface-secondary/70 border border-border-subtle hover:border-primary/40 transition-colors flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-hanzi font-bold text-xs text-text-primary leading-tight">
                        {v.hanzi}
                      </div>
                      <div className="text-[10px] font-mono text-teal-600 dark:text-teal-400 leading-tight">
                        {v.pinyin}
                      </div>
                      <div className="text-[10px] text-text-muted leading-tight truncate">
                        {v.meaning}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handlePlayAudio(v.key, v.hanzi)}
                        className="p-1 rounded-md text-text-muted hover:text-primary transition-colors"
                        title="Nghe phát âm"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleToggleFavorite(v.hanzi)}
                        className={`p-1 rounded-md transition-colors ${
                          isFav ? 'text-amber-500' : 'text-text-muted hover:text-amber-500'
                        }`}
                        title={isFav ? 'Đã lưu' : 'Lưu từ vựng'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-500' : ''}`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM CORE FEATURE CARDS ROW (Matching Bottom Strip in Reference Image) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Các chuyên mục học tập trọng tâm
          </h2>
          <span className="text-2xs text-text-muted">Chọn nhanh chuyên mục để luyện tập</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {[
            {
              id: 'progress',
              title: 'Lộ trình học cá nhân',
              desc: 'Theo mục tiêu của bạn',
              icon: TrendingUp,
              color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
            },
            {
              id: 'exam',
              title: 'Thi thử HSK',
              desc: 'Đánh giá trình độ thật',
              icon: Award,
              color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300',
            },
            {
              id: 'dictionary',
              title: 'Từ điển thông minh',
              desc: 'Tra cứu nhanh chóng',
              icon: BookMarked,
              color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
            },
            {
              id: 'hanzi',
              title: 'Hán tự và bộ thủ',
              desc: 'Học viết từng nét bút',
              icon: FileSpreadsheet,
              color: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300',
            },
            {
              id: 'ai',
              title: 'AI hội thoại',
              desc: 'Luyện nói như bản xứ',
              icon: Bot,
              color: 'bg-primary-soft text-primary',
            },
            {
              id: 'specialized',
              title: 'Thư viện chủ đề',
              desc: 'Giao tiếp, du lịch, công việc',
              icon: Briefcase,
              color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/40 dark:text-teal-300',
            },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.id}
                onClick={() => handleNavigate(card.id)}
                className="group p-3.5 rounded-2xl bg-surface border border-border-subtle hover:border-primary/50 shadow-2xs hover:shadow-md transition-all text-left flex flex-col justify-between gap-3 active:scale-98"
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform ${card.color}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors leading-tight">
                    {card.title}
                  </h3>
                  <p className="text-2xs text-text-muted mt-0.5 leading-snug">
                    {card.desc}
                  </p>
                </div>
              </button>
            );
          })}

          {/* "Thêm >" Action Card: Open More Features Modal on Desktop & Mobile */}
          <button
            onClick={() => {
              if (onOpenMoreFeatures) {
                onOpenMoreFeatures();
              } else {
                handleNavigate('beginner');
              }
            }}
            className="group p-3.5 rounded-2xl bg-surface-secondary/70 border border-dashed border-border-subtle hover:border-primary/50 text-left flex flex-col justify-between gap-3 transition-all active:scale-98 cursor-pointer"
            title="Khám phá thêm tất cả tính năng YUYAN"
          >
            <div className="w-9 h-9 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors leading-tight flex items-center gap-1">
                <span>Thêm</span>
                <span className="text-primary font-bold">&gt;</span>
              </h3>
              <p className="text-2xs text-text-muted mt-0.5 leading-snug">
                Khám phá thêm
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
