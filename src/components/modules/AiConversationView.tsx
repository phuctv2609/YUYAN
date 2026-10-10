import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Mail,
  Languages,
  GraduationCap,
  MessageSquare,
  Edit3,
  MoreHorizontal,
  Search,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Bot,
  Volume2,
  CheckCircle2,
  Layers,
  Split,
  FileText,
  Copy,
} from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { aiApiService } from '../../services/ai/aiApiService';
import { useYuyanAI } from '../../context/YuyanAIContext';
import { YuyanAIAvatar } from '../ai/YuyanAIAvatar';

export const LEARNING_SHORTCUTS = [
  { id: 'explain_grammar', label: 'Giải thích ngữ pháp', icon: BookOpen, prompt: 'Hãy giải thích cặn kẽ cách dùng ngữ pháp của cấu trúc: ' },
  { id: 'syntax_analysis', label: 'Phân tích câu (Cú pháp)', icon: Split, prompt: 'Hãy phân tích các thành phần cú pháp (Chủ - Vị - Tân - Bổ ngữ) của câu: ' },
  { id: 'compare_grammar', label: 'So sánh ngữ pháp', icon: Layers, prompt: 'Hãy so sánh sự giống và khác nhau giữa hai điểm ngữ pháp: ' },
  { id: 'explain_vocab', label: 'Giải nghĩa từ vựng', icon: FileText, prompt: 'Hãy giải thích chi tiết sắc thái và các cụm từ cố định của từ: ' },
  { id: 'generate_examples', label: 'Tạo câu ví dụ thực tế', icon: Sparkles, prompt: 'Hãy tạo 3 câu ví dụ thực tế song ngữ Trung-Việt có pinyin cho mẫu câu: ' },
  { id: 'create_quiz', label: 'Tạo bài trắc nghiệm', icon: CheckCircle2, prompt: 'Hãy tạo 2 câu hỏi trắc nghiệm kiểm tra độ hiểu cho điểm ngữ pháp: ' },
  { id: 'correct_writing', label: 'Sửa lỗi câu & diễn đạt', icon: Edit3, prompt: 'Hãy chỉ ra lỗi sai và sửa lại câu tiếng Trung sau cho tự nhiên nhất: ' },
  { id: 'practice_dialogue', label: 'Luyện hội thoại tình huống', icon: MessageSquare, prompt: 'Hãy đóng vai cùng tôi luyện hội thoại tình huống: ' },
  { id: 'explain_hsk', label: 'Giải thích đề thi HSK', icon: GraduationCap, prompt: 'Hãy phân tích bẫy và giải thích vì sao đáp án này đúng trong câu hỏi HSK: ' },
  { id: 'free_question', label: 'Đặt câu hỏi tự do', icon: Bot, prompt: '' },
];

export const AiConversationView: React.FC = () => {
  const { showToast } = useToast();
  const { openAssistant, openVoiceModal } = useYuyanAI();

  // AI Connection Health Status
  const [healthStatus, setHealthStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [activeAiModel, setActiveAiModel] = useState<string>('gemini-flash-lite-latest');
  const [sampleQuestionsSetIndex, setSampleQuestionsSetIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    aiApiService
      .checkHealth(false)
      .then((res) => {
        if (!mounted) return;
        if (res.configured) {
          setHealthStatus('connected');
          if (res.model) setActiveAiModel(res.model);
        } else {
          setHealthStatus('error');
        }
      })
      .catch(() => {
        if (mounted) setHealthStatus('connected');
      });
    return () => {
      mounted = false;
    };
  }, []);

  // 6 Core Functions from reference design
  const functionCards = [
    {
      id: 'vocab',
      title: 'Giải thích từ vựng',
      desc: 'Nghĩa, cách dùng, ví dụ',
      icon: BookOpen,
      iconBg: 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300',
      prompt: 'Hãy giải thích chi tiết ý nghĩa, cách dùng, các cụm từ cố định và cho ví dụ câu cho từ vựng: ',
    },
    {
      id: 'grammar',
      title: 'Giải thích ngữ pháp',
      desc: 'Phân tích, so sánh',
      icon: Mail,
      iconBg: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300',
      prompt: 'Hãy giải thích cặn kẽ cấu trúc ngữ pháp, điều kiện áp dụng và so sánh cách dùng của: ',
    },
    {
      id: 'translate',
      title: 'Dịch Trung ↔ Việt',
      desc: 'Tự nhiên, chính xác',
      icon: Languages,
      iconBg: 'bg-rose-100 text-rose-600 dark:bg-rose-900/40 dark:text-rose-300',
      prompt: 'Dịch câu văn/đoạn văn sau sang tiếng Trung tự nhiên và phân tích các từ ngữ hay: ',
    },
    {
      id: 'hsk',
      title: 'Phân tích đề HSK',
      desc: 'Chiến lược, mẹo làm bài',
      icon: GraduationCap,
      iconBg: 'bg-sky-100 text-sky-600 dark:bg-sky-900/40 dark:text-sky-300',
      prompt: 'Hãy phân tích phương pháp làm bài và bẫy thường gặp trong câu hỏi thi HSK này: ',
    },
    {
      id: 'conversation',
      title: 'Luyện hội thoại',
      desc: 'Tình huống thực tế',
      icon: MessageSquare,
      iconBg: 'bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-300',
      prompt: 'Hãy đóng vai cùng tôi luyện hội thoại giao tiếp tiếng Trung theo tình huống thực tế: ',
    },
    {
      id: 'writing',
      title: 'Sửa lỗi & viết lại',
      desc: 'Câu văn, bài luận',
      icon: Edit3,
      iconBg: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300',
      prompt: 'Hãy sửa lỗi ngữ pháp, dùng từ và viết lại câu tiếng Trung sau cho tự nhiên nhất: ',
    },
  ];

  // Quick suggestions list
  const quickSuggestions = [
    {
      id: '1',
      icon: Search,
      text: 'Giải thích cách dùng 了, 过, 着',
      prompt: 'Giải thích sự khác biệt và cách dùng của 3 trợ từ động thái 了 (le), 过 (guo), 着 (zhe) kèm ví dụ so sánh song ngữ.',
    },
    {
      id: '2',
      icon: MessageSquare,
      text: 'Tạo 5 câu hội thoại trong nhà hàng',
      prompt: 'Tạo đoạn hội thoại 5 câu thực tế khi đi ăn tại nhà hàng Trung Quốc (gọi món, hỏi giá, thanh toán) kèm pinyin và dịch nghĩa.',
    },
    {
      id: '3',
      icon: GraduationCap,
      text: 'Phân tích đề HSK 3.0 cấp 4',
      prompt: 'Hướng dẫn chiến lược và những điểm ngữ pháp trọng tâm thường xuất hiện trong đề thi HSK 3.0 Cấp 4.',
    },
    {
      id: '4',
      icon: Languages,
      text: 'Dịch đoạn văn này sang tiếng Trung',
      prompt: 'Dịch đoạn văn sau sang tiếng Trung trang trọng và tự nhiên: "Rất vui được đón tiếp đoàn đại biểu đến thăm và làm việc."',
    },
    {
      id: '5',
      icon: Sparkles,
      text: 'Lập kế hoạch học HSK trong 3 tháng',
      prompt: 'Lập lộ trình ôn thi chứng chỉ HSK trong vòng 3 tháng hiệu quả cho người học từ trình độ sơ cấp.',
    },
  ];

  // Question sample sets (can rotate via "Đổi câu hỏi")
  const sampleQuestionSets = [
    [
      {
        id: 'q1',
        title: '这个词怎么用？',
        subtitle: 'Giải thích chi tiết với ví dụ',
        tag: 'Từ vựng',
        bgGradient: 'from-amber-500/20 via-sky-500/10 to-indigo-500/20',
        prompt: 'Giải thích chi tiết cách dùng từ "终于" và phân biệt với "到底". Cho 3 ví dụ thực tế.',
      },
      {
        id: 'q2',
        title: '帮我分析这道HSK题',
        subtitle: 'Phân tích đáp án và mẹo làm bài',
        tag: 'Luyện thi HSK',
        bgGradient: 'from-blue-500/20 via-cyan-500/10 to-teal-500/20',
        prompt: 'Phân tích mẹo làm bài phần Đọc hiểu HSK và cách tìm từ khóa nhanh chóng trong đoạn văn dài.',
      },
      {
        id: 'q3',
        title: '我们来练习对话吧',
        subtitle: 'Luyện hội thoại theo chủ đề',
        tag: 'Giao tiếp',
        bgGradient: 'from-emerald-500/20 via-teal-500/10 to-sky-500/20',
        prompt: 'Chúng ta hãy luyện hội thoại tiếng Trung chủ đề: Hỏi đường đến ga tàu cao tốc.',
      },
    ],
    [
      {
        id: 'q4',
        title: '把字句怎么用？',
        subtitle: 'Chinh phục câu chữ 把',
        tag: 'Ngữ pháp',
        bgGradient: 'from-purple-500/20 via-pink-500/10 to-rose-500/20',
        prompt: 'Giải thích toàn diện cấu trúc câu chữ 把 trong tiếng Trung: các điều kiện bắt buộc và lỗi người Việt hay mắc phải.',
      },
      {
        id: 'q5',
        title: '商贸中文邮件怎么写？',
        subtitle: 'Viết email thương mại',
        tag: 'Thương mại',
        bgGradient: 'from-indigo-500/20 via-blue-500/10 to-sky-500/20',
        prompt: 'Hướng dẫn viết một email thương mại bằng tiếng Trung gửi đối tác để báo giá sản phẩm và đề nghị gặp mặt đàm phán.',
      },
      {
        id: 'q6',
        title: '成语背后的故事',
        subtitle: 'Học thành ngữ qua điển cố',
        tag: 'Văn hóa',
        bgGradient: 'from-amber-500/20 via-orange-500/10 to-yellow-500/20',
        prompt: 'Kể nguồn gốc và giải thích cách dùng thành ngữ "画蛇添足" (Vẽ rắn thêm chân) trong giao tiếp hàng ngày.',
      },
    ],
  ];

  const handleCopyMessage = (text: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('Đã sao chép nội dung vào bộ nhớ tạm', 'info');
    }
  };

  const currentSampleQuestions = sampleQuestionSets[sampleQuestionsSetIndex % sampleQuestionSets.length];

  const handleRotateQuestions = () => {
    setSampleQuestionsSetIndex((prev) => prev + 1);
    showToast('Đã đổi bộ câu hỏi gợi ý mới', 'info');
  };

  const handleSelectPrompt = (prompt: string) => {
    openAssistant(prompt);
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 space-y-7 animate-in fade-in duration-300">
      {/* 1. HERO BANNER — Matching Reference Visual Direction */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-100 via-sky-50 to-indigo-100/60 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950/40 border border-sky-200/60 dark:border-sky-900/40 p-6 sm:p-8 md:p-10 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Soft Background Art & Chinese Mountain Motif */}
        <div className="absolute inset-0 pointer-events-none opacity-25 dark:opacity-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-sky-400 via-transparent to-transparent" />

        {/* Left Content */}
        <div className="space-y-4 max-w-xl z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 dark:bg-slate-800/80 border border-sky-200/70 dark:border-slate-700 shadow-2xs backdrop-blur-xs">
            <span
              className={`w-2 h-2 rounded-full ${
                healthStatus === 'connected' ? 'bg-status-success animate-pulse' : 'bg-amber-500'
              }`}
            />
            <span className="text-2xs font-bold text-text-secondary">
              Yuyan AI • {healthStatus === 'connected' ? `Trực tuyến (${activeAiModel})` : 'Đang kết nối...'}
            </span>
            {healthStatus === 'error' && (
              <button
                onClick={() => {
                  setHealthStatus('checking');
                  aiApiService.checkHealth(true).then((r) => setHealthStatus(r.configured ? 'connected' : 'error'));
                }}
                className="text-2xs text-primary font-bold hover:underline ml-1"
              >
                Thử lại câu này
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight leading-tight">
              Xin chào! 👋
              <br />
              <span className="text-primary dark:text-sky-400">Em cần mình hỗ trợ gì hôm nay?</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium">
              Học tiếng Trung theo cách của bạn. Yuyan AI luôn đồng hành cùng em trên hành trình chinh phục tiếng Trung 💙
            </p>
          </div>

          <div className="pt-2 flex flex-wrap gap-3 justify-center md:justify-start">
            <button
              onClick={() => openAssistant()}
              className="px-5 py-2.5 rounded-2xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-hover hover:shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>Mở trò chuyện AI</span>
            </button>

            <button
              onClick={openVoiceModal}
              className="px-5 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-primary dark:text-sky-300 border border-sky-200 dark:border-slate-700 text-xs font-bold shadow-xs hover:bg-sky-50 dark:hover:bg-slate-700 transition-all active:scale-95 flex items-center gap-2"
            >
              <Volume2 className="w-4 h-4 text-primary" />
              <span>Luyện nói bằng giọng nói</span>
            </button>
          </div>
        </div>

        {/* Right Hero Assistant Character with Speech Bubble */}
        <div className="relative z-10 flex flex-col items-center shrink-0">
          {/* Friendly Speech Bubble */}
          <div className="absolute -top-7 -left-12 sm:-left-20 hidden sm:block bg-white/95 dark:bg-slate-800/95 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-2xl rounded-br-xs border border-sky-200 dark:border-slate-700 shadow-md text-2xs font-bold max-w-[190px] text-center leading-snug animate-in fade-in duration-500">
            Hỏi bất kỳ điều gì về tiếng Trung, mình luôn sẵn sàng hỗ trợ!
          </div>

          {/* Large Hero Teacher Avatar */}
          <YuyanAIAvatar size="hero" showOnlineStatus={true} />
        </div>
      </div>

      {/* 2. CORE FUNCTION CARDS ROW (6 Core Cards + "Thêm >") */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Chức năng trợ lý thông minh
          </h2>
          <span className="text-2xs text-text-muted">Chọn nhanh tính năng để bắt đầu</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {functionCards.map((fc) => {
            const Icon = fc.icon;
            return (
              <button
                key={fc.id}
                onClick={() => handleSelectPrompt(fc.prompt)}
                className="group p-4 rounded-2xl bg-surface dark:bg-slate-900 border border-border-subtle hover:border-primary/50 shadow-2xs hover:shadow-md transition-all text-left flex flex-col justify-between gap-3 active:scale-98"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${fc.iconBg}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors leading-tight">
                    {fc.title}
                  </h3>
                  <p className="text-2xs text-text-muted mt-0.5 leading-snug">
                    {fc.desc}
                  </p>
                </div>
              </button>
            );
          })}

          {/* "Thêm >" Action Card */}
          <button
            onClick={() => handleSelectPrompt('Liệt kê tất cả các khả năng giảng dạy và hỗ trợ mà Yuyan AI có thể cung cấp.')}
            className="group p-4 rounded-2xl bg-surface-secondary/60 dark:bg-slate-800/50 border border-dashed border-border-subtle hover:border-primary/50 text-left flex flex-col justify-between gap-3 transition-all active:scale-98"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center text-text-muted shrink-0 group-hover:scale-110 transition-transform">
              <MoreHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors leading-tight">
                Thêm &gt;
              </h3>
              <p className="text-2xs text-text-muted mt-0.5 leading-snug">
                Khám phá thêm
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 3. TWO COLUMNS SECTION: Gợi ý nhanh & Ví dụ câu hỏi */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 Cols): Gợi ý nhanh */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Gợi ý nhanh
            </h2>
            <span className="text-2xs text-text-muted">Nhấn để hỏi ngay</span>
          </div>

          <div className="space-y-2">
            {quickSuggestions.map((qs) => {
              const Icon = qs.icon;
              return (
                <button
                  key={qs.id}
                  onClick={() => handleSelectPrompt(qs.prompt)}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-surface dark:bg-slate-900 border border-border-subtle hover:border-primary/40 hover:bg-surface-secondary/60 shadow-2xs transition-all text-left group active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold text-text-secondary group-hover:text-primary transition-colors">
                      {qs.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyMessage(qs.prompt);
                      }}
                      role="button"
                      tabIndex={0}
                      className="p-1 rounded-md text-text-muted hover:text-primary hover:bg-surface-secondary transition-colors"
                      title="Sao chép câu hỏi"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column (7 Cols): Ví dụ câu hỏi */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">
              Ví dụ câu hỏi
            </h2>
            <button
              onClick={handleRotateQuestions}
              className="flex items-center gap-1 text-2xs font-bold text-primary hover:text-primary-hover transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Đổi câu hỏi</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {currentSampleQuestions.map((sq) => {
              return (
                <div
                  key={sq.id}
                  onClick={() => handleSelectPrompt(sq.prompt)}
                  className="group cursor-pointer rounded-2xl border border-border-subtle hover:border-primary/50 bg-surface dark:bg-slate-900 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col active:scale-98"
                >
                  {/* Decorative Visual Top */}
                  <div className={`h-28 w-full bg-gradient-to-br ${sq.bgGradient} flex items-center justify-center p-3 relative select-none`}>
                    <span className="px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-900/80 text-primary dark:text-sky-300 text-2xs font-extrabold shadow-xs absolute top-2.5 left-2.5">
                      {sq.tag}
                    </span>
                    <p className="font-hanzi text-base font-bold text-slate-800 dark:text-white text-center leading-snug drop-shadow-xs group-hover:scale-105 transition-transform">
                      "{sq.title}"
                    </p>
                  </div>

                  {/* Card Content */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <p className="text-xs font-bold text-text-primary group-hover:text-primary transition-colors">
                      {sq.subtitle}
                    </p>
                    <span className="text-2xs text-text-muted mt-2 font-medium flex items-center gap-1 group-hover:text-primary">
                      <span>Bấm để hỏi</span>
                      <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
