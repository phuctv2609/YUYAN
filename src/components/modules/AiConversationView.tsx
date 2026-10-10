import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  User,
  Volume2,
  Loader2,
  Sparkles,
  AlertCircle,
  Search,
} from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { audioManager } from '../../services/audio/audioManager';
import { aiApiService, AiChatMessage } from '../../services/ai/aiApiService';
import { TUTOR_MODES, TUTOR_CATEGORIES, TutorMode } from '../../data/ai/tutorModesData';

interface Message {
  id: number;
  sender: 'ai' | 'user';
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  feedback?: string | null;
}

export const AiConversationView: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tất cả');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeMode, setActiveMode] = useState<TutorMode>(TUTOR_MODES[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      hanzi: TUTOR_MODES[0].initialHanzi,
      pinyin: TUTOR_MODES[0].initialPinyin,
      vietnamese: TUTOR_MODES[0].initialVi,
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [showPinyin, setShowPinyin] = useState(true);
  const [showVi, setShowVi] = useState(true);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();

  const filteredModes = React.useMemo(() => {
    return TUTOR_MODES.filter((m) => {
      const matchCat = selectedCategory === 'Tất cả' || m.category === selectedCategory;
      if (!matchCat) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        m.title.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.initialHanzi.toLowerCase().includes(q)
      );
    });
  }, [selectedCategory, searchQuery]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleModeChange = (m: TutorMode) => {
    setActiveMode(m);
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
    showToast(`Đã chuyển chế độ: ${m.title}`, 'info');
  };

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

  const handleSendText = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userText = text.trim();
    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      hanzi: userText,
      pinyin: '...',
      vietnamese: 'Nội dung phản hồi của bạn',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
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
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-4 card-motion light-beam-shimmer">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-bold shadow-2xs">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
                Gia sư Tiếng Trung AI Thông minh (30 Chuyên đề)
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Huấn luyện ngữ âm, phản xạ giao tiếp đời sống, công sở, thương mại, luyện thi HSK/HSKK và văn hóa Hán ngữ
              </p>
            </div>
          </div>

          {/* Visibility Controls */}
          <div className="flex items-center gap-2">
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

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-divider-line">
          {TUTOR_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all btn-motion ${
                selectedCategory === cat
                  ? 'bg-secondary text-white shadow-2xs'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Modes Selector Drawer + Chat Window */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 30 Modes Drawer (4 cols on lg) */}
        <div className="lg:col-span-4 bg-surface rounded-2xl border border-border-subtle p-4 sm:p-5 shadow-2xs space-y-3 card-motion flex flex-col h-[680px]">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              Chọn chuyên đề ({filteredModes.length}/30)
            </h3>
            <span className="text-2xs text-text-muted">Nhấn để chuyển</span>
          </div>

          {/* Mode Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo chủ đề, từ khóa..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-surface-secondary rounded-xl border border-border-subtle focus:outline-hidden focus:border-primary"
            />
          </div>

          {/* Scrollable Modes List */}
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
                    <span className="text-base">{m.icon}</span>
                    <span className="text-2xs font-bold px-1.5 py-0.5 rounded bg-surface text-text-muted border border-border-subtle">
                      {m.level}
                    </span>
                  </div>
                  <h4 className="font-bold text-text-primary text-xs leading-snug">{m.title}</h4>
                  <p className="text-2xs text-text-secondary mt-1 line-clamp-2 leading-relaxed">
                    {m.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Interactive Chat Conversation (8 cols on lg) */}
        <div className="lg:col-span-8 bg-surface rounded-2xl border border-border-subtle shadow-2xs flex flex-col h-[680px] card-motion overflow-hidden">
          {/* Active Mode Info Bar */}
          <div className="px-5 py-3.5 bg-surface-secondary border-b border-border-subtle flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">{activeMode.icon}</span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-text-primary">{activeMode.title}</h3>
                  <span className="text-2xs font-bold px-2 py-0.5 rounded-full bg-secondary-fixed text-secondary">
                    {activeMode.level}
                  </span>
                </div>
                <p className="text-2xs text-text-muted truncate max-w-md">{activeMode.scenario}</p>
              </div>
            </div>

            <button
              onClick={() => handleModeChange(activeMode)}
              className="text-2xs font-semibold px-2.5 py-1 rounded-lg bg-surface border border-border-subtle hover:bg-surface-secondary text-text-secondary hover:text-text-primary transition-colors shrink-0"
              title="Làm mới cuộc trò chuyện"
            >
              Làm mới chat
            </button>
          </div>

          {/* Messages Scroll Area */}
          <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm font-bold ${
                    msg.sender === 'user'
                      ? 'bg-secondary text-white'
                      : 'bg-primary-soft text-primary'
                  }`}
                >
                  {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div className="space-y-1.5 flex-1">
                  <div
                    className={`p-4 rounded-2xl border ${
                      msg.sender === 'user'
                        ? 'bg-secondary text-white border-transparent'
                        : 'bg-surface-secondary/70 border-border-subtle text-text-primary'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-hanzi text-base sm:text-lg font-bold leading-relaxed">
                        {msg.hanzi}
                      </p>
                      {msg.sender === 'ai' && (
                        <button
                          onClick={() => handlePlayMessageAudio(msg)}
                          className={`p-1 rounded-lg transition-colors ${
                            speakingId === msg.id
                              ? 'text-primary bg-primary-soft animate-pulse'
                              : 'text-text-muted hover:text-text-primary'
                          }`}
                          title="Phát âm tiếng Trung chuẩn"
                        >
                          <Volume2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {showPinyin && msg.pinyin && msg.pinyin !== '...' && (
                      <p
                        className={`text-xs font-mono font-medium mt-1 ${
                          msg.sender === 'user' ? 'text-white/80' : 'text-primary'
                        }`}
                      >
                        {msg.pinyin}
                      </p>
                    )}

                    {showVi && msg.vietnamese && (
                      <p
                        className={`text-xs mt-1.5 leading-relaxed ${
                          msg.sender === 'user' ? 'text-white/70' : 'text-text-secondary'
                        }`}
                      >
                        {msg.vietnamese}
                      </p>
                    )}
                  </div>

                  {/* AI Feedback Badge on User's expression */}
                  {msg.feedback && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
                      <span>
                        <strong>Gợi ý sư phạm:</strong> {msg.feedback}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-3 max-w-[80%]">
                <div className="w-8 h-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="p-4 rounded-2xl bg-surface-secondary border border-border-subtle text-xs text-text-secondary flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span>Gia sư AI Gemini đang suy nghĩ câu trả lời...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Starter Prompts Pills */}
          {activeMode.suggestedPrompts && activeMode.suggestedPrompts.length > 0 && (
            <div className="px-4 py-2 bg-surface border-t border-border-subtle/50 overflow-x-auto flex gap-2 custom-scrollbar">
              <span className="text-2xs font-bold text-text-muted shrink-0 py-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-secondary" />
                <span>Gợi ý:</span>
              </span>
              {activeMode.suggestedPrompts.map((promptText, i) => (
                <button
                  key={i}
                  onClick={() => handleSendText(promptText)}
                  className="px-2.5 py-1 text-2xs font-semibold rounded-lg bg-surface-secondary hover:bg-primary-soft hover:text-primary text-text-secondary border border-border-subtle shrink-0 transition-colors"
                >
                  {promptText}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <div className="p-3 sm:p-4 bg-surface border-t border-border-subtle">
            {errorMsg && (
              <div className="mb-2 p-2 bg-red-50 text-red-600 rounded-xl text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendText(inputVal);
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Nhập tiếng Trung, Pinyin hoặc tiếng Việt..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 text-xs bg-surface-secondary rounded-xl border border-border-subtle focus:outline-hidden focus:border-primary transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputVal.trim() || isLoading}
                className="px-4 py-2.5 bg-primary text-white rounded-xl text-xs font-bold shadow-xs hover:bg-primary-hover active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none"
              >
                <span>Gửi</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
