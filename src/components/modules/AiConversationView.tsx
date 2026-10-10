import React, { useState } from 'react';
import { Bot, Send, User, Volume2, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { audioManager } from '../../services/audio/audioManager';
import { aiApiService, AiChatMessage } from '../../services/ai/aiApiService';

interface Message {
  id: number;
  sender: 'ai' | 'user';
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  feedback?: string | null;
}

const scenarios = [
  {
    id: 'greeting',
    title: 'Chào hỏi & Làm quen',
    icon: '👋',
    initialHanzi: '你好！很高兴和你聊天。你今天想练习什么话题？',
    initialPinyin: 'Nǐ hǎo! Hěn gāoxìng hé nǐ liáotiān. Nǐ jīntiān xiǎng liànxí shénme huàtí?',
    initialVi: 'Xin chào! Rất vui được trò chuyện với bạn. Hôm nay bạn muốn luyện tập chủ đề gì?',
  },
  {
    id: 'restaurant',
    title: 'Gọi món tại nhà hàng',
    icon: '🍜',
    initialHanzi: '欢迎光临！请问几位？你想吃点什么？',
    initialPinyin: 'Huānyíng guānglín! Qǐngwèn jǐ wèi? Nǐ xiǎng chī diǎn shénme?',
    initialVi: 'Kính chào quý khách! Xin hỏi có mấy người ạ? Bạn muốn dùng món gì?',
  },
  {
    id: 'directions',
    title: 'Hỏi đường đi tàu điện ngầm',
    icon: '🗺️',
    initialHanzi: '你好！请问你需要问路吗？地铁站就在前面。',
    initialPinyin: 'Nǐ hǎo! Qǐngwèn nǐ xūyào wèn lù ma? Dìtiě zhàn jiù zài qiánmiàn.',
    initialVi: 'Xin chào! Bạn cần hỏi đường phải không? Trạm tàu điện ngầm ngay phía trước.',
  },
  {
    id: 'shopping',
    title: 'Mua sắm & Hỏi giá',
    icon: '🛍️',
    initialHanzi: '你好！这件衣服很适合你，想试穿一下吗？',
    initialPinyin: 'Nǐ hǎo! Zhè jiàn yīfu hěn shìhé nǐ, xiǎng shìchuān yíxià ma?',
    initialVi: 'Xin chào! Bộ quần áo này rất hợp với bạn, bạn có muốn mặc thử không?',
  },
];

export const AiConversationView: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState(scenarios[0]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: 'ai',
      hanzi: scenarios[0].initialHanzi,
      pinyin: scenarios[0].initialPinyin,
      vietnamese: scenarios[0].initialVi,
    },
  ]);
  const [inputVal, setInputVal] = useState('');
  const [showPinyin, setShowPinyin] = useState(true);
  const [showVi, setShowVi] = useState(true);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleScenarioChange = (s: typeof scenarios[0]) => {
    setActiveScenario(s);
    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        hanzi: s.initialHanzi,
        pinyin: s.initialPinyin,
        vietnamese: s.initialVi,
      },
    ]);
    setErrorMsg(null);
    showToast(`Đã chuyển bối cảnh: ${s.title}`, 'info');
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
    setTimeout(() => setSpeakingId(null), 1500);
  };

  const handleSend = async () => {
    if (!inputVal.trim() || isLoading) return;

    const userText = inputVal.trim();
    const userMsg: Message = {
      id: Date.now(),
      sender: 'user',
      hanzi: userText,
      pinyin: '...',
      vietnamese: 'Câu trả lời của bạn',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const chatHistory: AiChatMessage[] = messages.map((m) => ({
        id: m.id,
        sender: m.sender,
        hanzi: m.hanzi,
        pinyin: m.pinyin,
        vietnamese: m.vietnamese,
      }));

      const reply = await aiApiService.sendChatMessage({
        scenario: activeScenario.title,
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
      showToast('Gia sư AI Gemini đã gửi phản hồi', 'info');
    } catch (err: any) {
      console.error('AI chat failed:', err);
      setErrorMsg(err?.message || 'Không thể kết nối tới dịch vụ AI Gemini.');
      showToast('Lỗi gửi tin nhắn tới AI', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-4 card-motion light-beam-shimmer">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-bold shadow-2xs">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Gia sư Hội thoại AI Thông minh</h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Luyện đối đáp phản xạ tiếng Trung theo ngữ cảnh với gợi ý phiên âm và dịch nghĩa
              </p>
            </div>
          </div>

          {/* Visibility Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPinyin(!showPinyin)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold btn-motion ${
                showPinyin ? 'bg-primary-soft text-primary border-primary/30' : 'bg-surface text-text-muted border-border-subtle'
              }`}
            >
              Pinyin: {showPinyin ? 'Bật' : 'Tắt'}
            </button>
            <button
              onClick={() => setShowVi(!showVi)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold btn-motion ${
                showVi ? 'bg-primary-soft text-primary border-primary/30' : 'bg-surface text-text-muted border-border-subtle'
              }`}
            >
              Dịch: {showVi ? 'Bật' : 'Tắt'}
            </button>
          </div>
        </div>

        {/* Scenarios Pills */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-divider-line">
          {scenarios.map((s) => (
            <button
              key={s.id}
              onClick={() => handleScenarioChange(s)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all btn-motion flex items-center gap-1.5 ${
                activeScenario.id === s.id
                  ? 'bg-secondary text-white shadow-2xs'
                  : 'bg-surface-secondary text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>{s.icon}</span>
              <span>{s.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-4 sm:p-6 shadow-2xs min-h-[420px] flex flex-col justify-between space-y-4 card-motion">
        <div className="space-y-4 overflow-y-auto max-h-[460px] custom-scrollbar pr-1">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-start gap-3 ${m.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-2xs ${
                  m.sender === 'ai' ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                {m.sender === 'ai' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-lg space-y-1 relative group ${
                  m.sender === 'ai'
                    ? 'bg-primary-ultra-soft border border-primary-soft text-text-primary rounded-tl-sm'
                    : 'bg-secondary text-white rounded-tr-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-hanzi text-base sm:text-lg font-bold leading-relaxed">{m.hanzi}</p>
                  <button
                    onClick={() => handlePlayMessageAudio(m)}
                    className={`p-1.5 rounded-lg transition-all flex-shrink-0 ${
                      speakingId === m.id
                        ? 'bg-primary text-white scale-110'
                        : m.sender === 'ai'
                        ? 'text-text-muted hover:text-primary hover:bg-surface'
                        : 'text-white/70 hover:text-white hover:bg-white/10'
                    }`}
                    title="Phát âm tiếng Trung"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
                {showPinyin && m.pinyin && m.pinyin !== '...' && (
                  <p className={`font-sans text-xs font-medium ${m.sender === 'ai' ? 'text-deep-blue' : 'text-white/80'}`}>
                    {m.pinyin}
                  </p>
                )}
                {showVi && (
                  <p className={`text-xs ${m.sender === 'ai' ? 'text-text-secondary' : 'text-white/90'}`}>
                    {m.vietnamese}
                  </p>
                )}

                {/* Pedagogical Feedback from AI */}
                {m.feedback && (
                  <div className="mt-2.5 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                    <div>
                      <span className="font-bold">Góp ý sư phạm: </span>
                      <span>{m.feedback}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing Indicator */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-in fade-in duration-200">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold text-xs shadow-2xs bg-primary">
                <Bot className="w-5 h-5 animate-pulse" />
              </div>
              <div className="p-3.5 rounded-2xl bg-primary-ultra-soft border border-primary-soft text-text-primary rounded-tl-sm flex items-center gap-2.5 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                <span className="font-medium text-text-secondary">Gia sư AI Gemini đang suy nghĩ phản hồi...</span>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="flex items-center gap-2 pt-3 border-t border-divider-line">
          <input
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSend()}
            disabled={isLoading}
            placeholder={isLoading ? 'Đang chờ Gia sư AI phản hồi...' : 'Nhập câu tiếng Trung hoặc tiếng Việt để đối đáp cùng AI...'}
            className="flex-1 h-11 px-4 rounded-xl bg-input-bg border border-border-subtle text-xs sm:text-sm text-text-primary focus:outline-none focus:border-primary disabled:opacity-50 shadow-inner"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputVal.trim()}
            className="w-11 h-11 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-hover shadow-xs active:scale-95 transition-transform disabled:opacity-50 disabled:cursor-not-allowed btn-motion"
            title="Gửi tin nhắn"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};
