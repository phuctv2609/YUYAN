import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Bot,
  Send,
  User,
  Volume2,
  Loader2,
  Sparkles,
  AlertCircle,
  Search,
  MessageSquare,
  Layers,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { audioManager } from '../../services/audio/audioManager';
import { aiApiService, AiChatMessage } from '../../services/ai/aiApiService';
import { TUTOR_MODES, TUTOR_CATEGORIES, TutorMode } from '../../data/ai/tutorModesData';
import {
  contextRetrievalService,
  FullLearningContext,
} from '../../services/ai/contextRetrievalService';
import { ContextIndexItem } from '../../data/ai/contextCatalogIndex';

interface Message {
  id: number;
  sender: 'ai' | 'user';
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  feedback?: string | null;
}

const FREE_CHAT_SUGGESTIONS = [
  'Phân biệt 不 (bù) và 没 (méi) khác nhau thế nào?',
  'Hướng dẫn dùng câu chữ 把 (bǎ) chuẩn ngữ pháp',
  'Sửa lỗi giúp tôi: 我在越南工作两年了。',
  'Khi nào dùng phó từ 就 (jiù) và 才 (cái)?',
  'Dịch sang tiếng Trung: "Rất mong được hợp tác lâu dài với quý công ty"',
  'Giải thích câu chữ 被 (bèi) và cho 3 ví dụ',
];

export const AiConversationView: React.FC = () => {
  const { showToast } = useToast();

  // Primary Tab: 'free_chat' | 'scenarios' | 'context_library'
  const [activeMainTab, setActiveMainTab] = useState<'free_chat' | 'scenarios' | 'context_library'>('free_chat');

  // Scenarios State
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [scenarioSearchQuery, setScenarioSearchQuery] = useState<string>('');
  const [activeMode, setActiveMode] = useState<TutorMode>(TUTOR_MODES[0]);

  // Context Library State
  const [contextDomain, setContextDomain] = useState<string>('all');
  const [contextLevel, setContextLevel] = useState<string>('all');
  const [contextSearchQuery, setContextSearchQuery] = useState<string>('');
  const [activeContextItem, setActiveContextItem] = useState<FullLearningContext | null>(null);

  // Chat State
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      hanzi: '你好！我是 YUYAN AI 汉语导师。无论是语法疑问、词汇辨析、病句修改还是口语对话，我都可以为你解答。请问你想了解什么？',
      pinyin: 'Nǐ hǎo! Wǒ shì YUYAN AI hànyǔ dǎoshī. Wúlùn shì yǔfǎ yíwèn, cíhuì biànxī, bìngjù xiūgǎi háishì kǒuyǔ duìhuà, wǒ dōu kěyǐ wèi nǐ jiědá. Qǐngwèn nǐ xiǎng liǎojiě shénme?',
      vietnamese: 'Xin chào! Tôi là Gia sư Tiếng Trung AI YUYAN. Dù là thắc mắc ngữ pháp, phân biệt từ vựng, sửa câu sai hay hội thoại, tôi đều có thể giải đáp cho bạn. Bạn muốn tìm hiểu điều gì?',
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [showPinyin, setShowPinyin] = useState(true);
  const [showVi, setShowVi] = useState(true);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const filteredModes = useMemo(() => {
    return TUTOR_MODES.filter((m) => {
      const matchCat = selectedCategory === 'Tất cả' || m.category === selectedCategory;
      if (!matchCat) return false;
      if (!scenarioSearchQuery.trim()) return true;
      const q = scenarioSearchQuery.toLowerCase().trim();
      return (
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.initialHanzi.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, scenarioSearchQuery]);

  // Context Library Search Results
  const contextIndexResults = useMemo(() => {
    return contextRetrievalService.searchIndex({
      query: contextSearchQuery,
      domainId: contextDomain,
      level: contextLevel,
      limit: 60,
    });
  }, [contextSearchQuery, contextDomain, contextLevel]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Scenario Mode Switch
  const handleModeChange = (m: TutorMode) => {
    setActiveMode(m);
    setActiveContextItem(null);
    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        hanzi: m.initialHanzi,
        pinyin: m.initialPinyin,
        vietnamese: m.initialVi,
      },
    ]);
    setErrorMsg(null);
    setActiveMainTab('scenarios');
    showToast(`Đã chuyển chuyên đề: ${m.title}`, 'info');
  };

  // Launch Context from 10,000+ Library
  const handleActivateContext = async (ctx: ContextIndexItem) => {
    setIsLoading(true);
    try {
      const full = await contextRetrievalService.getContextDetails(ctx.id);
      setActiveContextItem(full);
      setActiveMainTab('free_chat');

      setMessages([
        {
          id: Date.now(),
          sender: 'ai',
          hanzi: `我们现在开始【${ctx.task}】。学习目标：${ctx.objective}`,
          pinyin: 'Wǒmen xiànzài kāishǐ cǐ xiàng rènwù. Xúexí mùbiāo yǐ shèdìng.',
          vietnamese: `Chúng ta bắt đầu chuyên đề: ${ctx.task}. Mục tiêu: ${ctx.objective}. Hãy đặt câu hỏi hoặc bắt đầu làm bài luyện tập!`,
        },
      ]);
      showToast(`Đã kích hoạt ngữ cảnh: ${ctx.id}`, 'success');
    } catch {
      showToast('Không thể tải chi tiết ngữ cảnh', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset Conversation
  const handleResetChat = () => {
    setActiveContextItem(null);
    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        hanzi: '你好！会话已重置。请问你今天想探讨什么汉语知识？',
        pinyin: 'Nǐ hǎo! Huìhuà yǐ chóngzhì. Qǐngwèn nǐ jīntiān xiǎng tàntǎo shénme hànyǔ zhīshi?',
        vietnamese: 'Xin chào! Cuộc trò chuyện đã được làm mới. Hôm nay bạn muốn tìm hiểu kiến thức tiếng Trung nào?',
      },
    ]);
    setErrorMsg(null);
    showToast('Đã làm mới cuộc hội thoại', 'info');
  };

  // Speech Audio Playback
  const handlePlayMessageAudio = (msg: Message) => {
    setSpeakingId(msg.id);
    audioManager.playText(msg.hanzi, {
      id: `conv_${msg.id}`,
      entityType: 'sentence',
      entityId: `conv_${msg.id}`,
      lang: 'zh-CN',
      rate: 0.9,
    });
    setTimeout(() => setSpeakingId(null), 2000);
  };

  // Send Message (Dispatches to free-chat or scenario chat)
  const handleSendText = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userText = text.trim();
    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      hanzi: userText,
      pinyin: '...',
      vietnamese: 'Nội dung câu hỏi của bạn',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      if (activeMainTab === 'scenarios' && !activeContextItem) {
        // Scenario roleplay chat
        const chatHistory: AiChatMessage[] = messages.slice(-8).map((m) => ({
          id: m.id,
          sender: m.sender,
          hanzi: m.hanzi,
          pinyin: m.pinyin,
          vietnamese: m.vietnamese,
        }));

        const reply = await aiApiService.sendChatMessage({
          scenario: `${activeMode.title} (${activeMode.scenario})`,
          message: userText,
          messages: chatHistory,
        });

        const aiReply: Message = {
          id: Date.now() + 1,
          sender: 'ai',
          hanzi: reply.hanzi,
          pinyin: reply.pinyin || '',
          vietnamese: reply.vietnamese || '',
          feedback: reply.feedback || null,
        };
        setMessages((prev) => [...prev, aiReply]);
      } else {
        // Free-Question Q&A Chat (with context item if active)
        const historyForFree = messages.slice(-8).map((m) => ({
          sender: m.sender,
          text: m.hanzi,
        }));

        const answerText = await aiApiService.sendFreeChatMessage({
          question: userText,
          history: historyForFree,
          contextItem: activeContextItem || undefined,
        });

        const aiReply: Message = {
          id: Date.now() + 1,
          sender: 'ai',
          hanzi: answerText,
          pinyin: '',
          vietnamese: 'Phản hồi sư phạm từ Gia sư AI YUYAN',
          feedback: null,
        };
        setMessages((prev) => [...prev, aiReply]);
      }
    } catch (err: any) {
      console.error('AI chat failed:', err);
      setErrorMsg(err?.message || 'Không thể kết nối tới Gia sư AI Gemini.');
      showToast('Lỗi gửi tin nhắn tới AI', 'warning');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Banner */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-5 card-motion light-beam-shimmer">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-bold shadow-2xs shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                Gia sư Tiếng Trung AI Đa năng YUYAN
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Hỏi đáp tự do không giới hạn, 30 kịch bản thực chiến chuyên sâu và Thư viện 12,050 ngữ cảnh học tập.
              </p>
            </div>
          </div>

          {/* Visibility Controls */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => setShowPinyin(!showPinyin)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold btn-motion transition-colors ${
                showPinyin
                  ? 'bg-primary-soft text-primary border-primary/30'
                  : 'bg-surface text-text-muted border-border-subtle'
              }`}
            >
              Pinyin: {showPinyin ? 'Bật' : 'Tắt'}
            </button>
            <button
              onClick={() => setShowVi(!showVi)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold btn-motion transition-colors ${
                showVi
                  ? 'bg-primary-soft text-primary border-primary/30'
                  : 'bg-surface text-text-muted border-border-subtle'
              }`}
            >
              Tiếng Việt: {showVi ? 'Bật' : 'Tắt'}
            </button>
          </div>
        </div>

        {/* 3 Main Mode Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-divider-line">
          <button
            onClick={() => setActiveMainTab('free_chat')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMainTab === 'free_chat'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Hỏi đáp Tự do (Free Q&A)</span>
          </button>

          <button
            onClick={() => setActiveMainTab('scenarios')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMainTab === 'scenarios'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>30 Kịch bản Thực chiến</span>
          </button>

          <button
            onClick={() => setActiveMainTab('context_library')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMainTab === 'context_library'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
            }`}
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Thư viện 12,050 Ngữ cảnh</span>
          </button>
        </div>
      </div>

      {/* VIEW: CONTEXT LIBRARY EXPLORER */}
      {activeMainTab === 'context_library' && (
        <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-2xs space-y-5 animate-in fade-in duration-150">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-divider-line pb-4">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-text-primary">
                Kho Ngữ cảnh Học tập Định vị Sư phạm ({contextRetrievalService.getTotalCount()} Ngữ cảnh)
              </h2>
              <p className="text-xs text-text-secondary mt-0.5">
                Trải rộng qua 28 chuyên đề: Ngữ âm, Chữ Hán, Từ vựng, Ngữ pháp, Lỗi can thiệp tiếng Việt, Công sở, IT, Đàm phán và Luyện thi.
              </p>
            </div>

            {/* Domain & Level Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={contextDomain}
                onChange={(e) => setContextDomain(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-surface-secondary text-xs text-text-primary border border-border-subtle font-medium focus:outline-hidden"
              >
                <option value="all">Tất cả chuyên đề (28)</option>
                {contextRetrievalService.getDomainMetadata().map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.count})
                  </option>
                ))}
              </select>

              <select
                value={contextLevel}
                onChange={(e) => setContextLevel(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-surface-secondary text-xs text-text-primary border border-border-subtle font-medium focus:outline-hidden"
              >
                <option value="all">Mọi cấp độ</option>
                <option value="HSK1">HSK 1</option>
                <option value="HSK2">HSK 2</option>
                <option value="HSK3">HSK 3</option>
                <option value="HSK4">HSK 4</option>
                <option value="HSK5">HSK 5</option>
                <option value="HSK6">HSK 6</option>
                <option value="HSK7-9">HSK 7–9</option>
              </select>
            </div>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={contextSearchQuery}
              onChange={(e) => setContextSearchQuery(e.target.value)}
              placeholder="Tìm kiếm ngữ cảnh (vd: phát âm, thanh điệu, đàm phán, câu chữ 把, bệnh câu...)"
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface-secondary text-xs text-text-primary border border-border-subtle focus:outline-hidden focus:border-primary"
            />
          </div>

          {/* Contexts Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[580px] overflow-y-auto custom-scrollbar pr-1">
            {contextIndexResults.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle hover:bg-surface-secondary hover:border-primary/40 transition-all flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-2xs font-mono font-bold px-2 py-0.5 rounded bg-primary-soft text-primary">
                      {item.id}
                    </span>
                    <span className="text-2xs font-bold px-2 py-0.5 rounded bg-secondary-fixed text-secondary">
                      {item.level}
                    </span>
                  </div>
                  <h3 className="text-xs font-bold text-text-primary line-clamp-2">
                    {item.task}
                  </h3>
                  <p className="text-2xs text-text-secondary line-clamp-2">
                    {item.objective}
                  </p>
                </div>

                <button
                  onClick={() => handleActivateContext(item)}
                  className="w-full py-1.5 rounded-lg bg-surface hover:bg-primary hover:text-white text-primary text-xs font-bold border border-border-subtle shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Luyện tập với AI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: CHAT INTERFACE (FREE CHAT OR SCENARIO CHAT) */}
      {activeMainTab !== 'context_library' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Drawer (Only when in 'scenarios' mode) */}
          {activeMainTab === 'scenarios' && (
            <div className="lg:col-span-4 bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3 card-motion flex flex-col h-[700px]">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
                  Chọn chuyên đề ({filteredModes.length}/30)
                </h3>
                <span className="text-2xs text-text-muted">Nhấn để đổi vai</span>
              </div>

              {/* Search Scenario */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="text"
                  value={scenarioSearchQuery}
                  onChange={(e) => setScenarioSearchQuery(e.target.value)}
                  placeholder="Tìm chủ đề..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-secondary rounded-xl border border-border-subtle focus:outline-hidden focus:border-primary"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar text-2xs">
                {TUTOR_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-1 rounded-lg shrink-0 font-semibold transition-all ${
                      selectedCategory === cat
                        ? 'bg-secondary text-white'
                        : 'bg-surface-secondary text-text-muted hover:text-text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Modes List */}
              <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {filteredModes.map((m) => {
                  const isSelected = activeMode.id === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => handleModeChange(m)}
                      className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-secondary-fixed/50 border-secondary shadow-xs'
                          : 'bg-surface-secondary/40 border-border-subtle hover:bg-surface-secondary hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-2xs font-bold px-1.5 py-0.5 rounded bg-surface text-secondary border border-border-subtle">
                          {m.level}
                        </span>
                        <span className="text-2xs text-text-muted truncate max-w-[120px]">
                          {m.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-text-primary text-xs leading-snug">
                        {m.title}
                      </h4>
                      <p className="text-2xs text-text-secondary mt-0.5 line-clamp-1">
                        {m.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Right/Center: Chat Window */}
          <div
            className={`${
              activeMainTab === 'scenarios' ? 'lg:col-span-8' : 'lg:col-span-12'
            } bg-surface rounded-2xl border border-border-subtle shadow-2xs flex flex-col h-[700px] card-motion`}
          >
            {/* Chat Header Status */}
            <div className="p-4 sm:p-5 border-b border-divider-line flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-bold">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-text-primary">
                      {activeContextItem
                        ? `Ngữ cảnh: ${activeContextItem.task}`
                        : activeMainTab === 'scenarios'
                        ? activeMode.title
                        : 'Hỏi đáp Tự do Tiếng Trung'}
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
                  </div>
                  <p className="text-2xs text-text-muted">
                    {activeContextItem
                      ? `Mục tiêu: ${activeContextItem.objective}`
                      : activeMainTab === 'scenarios'
                      ? activeMode.scenario
                      : 'Hỏi bất kỳ câu hỏi nào về ngữ pháp, từ vựng, sửa câu, dịch thuật'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleResetChat}
                title="Làm mới hội thoại"
                className="p-2 rounded-xl bg-surface-secondary text-text-muted hover:text-text-primary border border-border-subtle text-xs transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
            </div>

            {/* Quick Suggestion Chips (Free Chat Mode) */}
            {activeMainTab === 'free_chat' && !activeContextItem && (
              <div className="px-4 py-2 bg-surface-secondary/50 border-b border-border-subtle flex gap-1.5 overflow-x-auto no-scrollbar text-2xs">
                {FREE_CHAT_SUGGESTIONS.map((sug, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendText(sug)}
                    className="px-2.5 py-1 rounded-lg bg-surface border border-border-subtle text-text-secondary hover:text-primary hover:border-primary shrink-0 transition-colors"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Starter Prompts (Scenario Mode) */}
            {activeMainTab === 'scenarios' && activeMode.suggestedPrompts && (
              <div className="px-4 py-2 bg-surface-secondary/50 border-b border-border-subtle flex gap-1.5 overflow-x-auto no-scrollbar text-2xs">
                {activeMode.suggestedPrompts.map((p: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleSendText(p)}
                    className="px-2.5 py-1 rounded-lg bg-surface border border-border-subtle text-text-secondary hover:text-secondary hover:border-secondary shrink-0 transition-colors"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}

            {/* Scrollable Messages Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
              {messages.map((msg) => {
                const isAi = msg.sender === 'ai';
                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 ${isAi ? '' : 'flex-row-reverse'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                        isAi
                          ? 'bg-primary-soft text-primary'
                          : 'bg-secondary-fixed text-secondary'
                      }`}
                    >
                      {isAi ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>

                    <div
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 space-y-2 text-xs shadow-2xs leading-relaxed ${
                        isAi
                          ? 'bg-surface-secondary/70 border border-border-subtle text-text-primary rounded-tl-xs'
                          : 'bg-primary text-white rounded-tr-xs'
                      }`}
                    >
                      {/* Hanzi Content */}
                      <div className="text-sm font-medium whitespace-pre-wrap">{msg.hanzi}</div>

                      {/* Pinyin (if AI and enabled) */}
                      {isAi && showPinyin && msg.pinyin && (
                        <div className="text-2xs font-mono text-secondary dark:text-secondary-fixed">
                          {msg.pinyin}
                        </div>
                      )}

                      {/* Vietnamese Translation (if AI and enabled) */}
                      {isAi && showVi && msg.vietnamese && (
                        <div className="text-2xs text-text-secondary dark:text-text-muted border-t border-border-subtle pt-1.5 mt-1">
                          {msg.vietnamese}
                        </div>
                      )}

                      {/* Pedagogical Feedback Banner */}
                      {isAi && msg.feedback && (
                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-2xs mt-2 flex items-start gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                          <div>
                            <strong>Nhận xét sư phạm: </strong>
                            <span>{msg.feedback}</span>
                          </div>
                        </div>
                      )}

                      {/* Audio Playback Button (AI messages only) */}
                      {isAi && (
                        <div className="pt-1 flex items-center justify-end">
                          <button
                            onClick={() => handlePlayMessageAudio(msg)}
                            disabled={speakingId === msg.id}
                            className="p-1.5 rounded-lg text-text-muted hover:text-primary hover:bg-surface border border-transparent hover:border-border-subtle transition-colors"
                            title="Nghe phát âm chuẩn"
                          >
                            <Volume2
                              className={`w-3.5 h-3.5 ${
                                speakingId === msg.id ? 'animate-pulse text-primary' : ''
                              }`}
                            />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-bold text-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3.5 rounded-2xl bg-surface-secondary/70 border border-border-subtle flex items-center gap-2 text-xs text-text-muted">
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    <span>Gia sư AI đang soạn câu trả lời...</span>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-3 sm:p-4 border-t border-divider-line bg-surface flex items-center gap-2">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendText(inputVal);
                  }
                }}
                disabled={isLoading}
                placeholder={
                  activeContextItem
                    ? `Nhập câu trả lời hoặc câu hỏi cho ${activeContextItem.task}...`
                    : activeMainTab === 'scenarios'
                    ? `Nói chuyện với ${activeMode.title}...`
                    : 'Đặt câu hỏi bất kỳ về tiếng Trung (hoặc dán đoạn văn cần sửa)...'
                }
                className="flex-1 px-4 py-2.5 rounded-xl bg-surface-secondary text-xs text-text-primary border border-border-subtle focus:outline-hidden focus:border-primary disabled:opacity-50"
              />
              <button
                onClick={() => handleSendText(inputVal)}
                disabled={isLoading || !inputVal.trim()}
                className="px-4 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover active:scale-95 disabled:opacity-40 transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Gửi</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
