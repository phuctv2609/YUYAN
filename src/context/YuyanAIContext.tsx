/**
 * YUYAN — Global AI Assistant Context
 * Controls floating assistant visibility, chat drawer state, active conversation,
 * voice mode modal, and AI experience preferences across all pages.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { VoiceSettings, DEFAULT_VOICE_SETTINGS } from '../services/speech/speechTypes';
import { aiApiService, AiChatAttachment } from '../services/ai/aiApiService';
import { speechSynthesisService } from '../services/speech/speechSynthesisService';

export type ConversationMode = 'free_chat' | 'roleplay' | 'speaking' | 'correction' | 'hsk';

export interface ChatMessage {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  attachment?: AiChatAttachment | null;
  pinyin?: string;
  vietnamese?: string;
  feedback?: string | null;
  followUp?: string;
  isPinyinVisible?: boolean;
  isTranslationVisible?: boolean;
  isBookmarked?: boolean;
  timestamp?: string;
  isStreaming?: boolean;
}

interface YuyanAIContextValue {
  isAssistantOpen: boolean;
  isMinimized: boolean;
  isVoiceModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isLanguageModalOpen: boolean;
  messages: ChatMessage[];
  voiceSettings: VoiceSettings;
  conversationMode: ConversationMode;
  setConversationMode: (mode: ConversationMode) => void;
  activeScenario: string;
  setActiveScenario: (scenario: string) => void;
  hskLevel: number;
  setHskLevel: (level: number) => void;
  alwaysShowPinyin: boolean;
  setAlwaysShowPinyin: (show: boolean | ((prev: boolean) => boolean)) => void;
  alwaysShowTranslation: boolean;
  setAlwaysShowTranslation: (show: boolean | ((prev: boolean) => boolean)) => void;
  toggleMessagePinyin: (id: number) => void;
  toggleMessageTranslation: (id: number) => void;
  toggleMessageBookmark: (id: number) => void;
  openAssistant: (initialPrompt?: string) => void;
  closeAssistant: () => void;
  toggleAssistant: () => void;
  minimizeAssistant: () => void;
  maximizeAssistant: () => void;
  openVoiceModal: () => void;
  closeVoiceModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
  updateVoiceSettings: (newSettings: Partial<VoiceSettings>) => void;
  sendMessage: (text: string, attachment?: AiChatAttachment | null) => Promise<void>;
  appendMessage: (msg: {
    sender: 'ai' | 'user';
    text: string;
    pinyin?: string;
    vietnamese?: string;
    feedback?: string | null;
    followUp?: string;
  }) => void;
  clearMessages: () => void;
  isLoading: boolean;
}

const YuyanAIContext = createContext<YuyanAIContextValue | null>(null);

const STORAGE_CHAT_KEY = 'yuyan_ai_chat_history_v1';
const STORAGE_SETTINGS_KEY = 'yuyan_voice_settings_v1';

export const YuyanAIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAssistantOpen, setIsAssistantOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('ai') === 'open') return true;
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [isMinimized, setIsMinimized] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        if (params.get('voice') === 'open') return true;
      }
    } catch {
      // ignore
    }
    return false;
  });
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Conversation Modes & Personalization
  const [conversationMode, setConversationMode] = useState<ConversationMode>('free_chat');
  const [activeScenario, setActiveScenario] = useState<string>('Hội thoại tự do hàng ngày như bạn bè bản xứ');
  const [hskLevel, setHskLevel] = useState<number>(2);

  // On-demand visibility preferences (persisted)
  const [alwaysShowPinyin, setAlwaysShowPinyinState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('yuyan_always_show_pinyin') === 'true';
    } catch {
      return false;
    }
  });

  const [alwaysShowTranslation, setAlwaysShowTranslationState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('yuyan_always_show_translation') === 'true';
    } catch {
      return false;
    }
  });

  const setAlwaysShowPinyin = useCallback((show: boolean | ((prev: boolean) => boolean)) => {
    setAlwaysShowPinyinState((prev) => {
      const next = typeof show === 'function' ? show(prev) : show;
      try {
        localStorage.setItem('yuyan_always_show_pinyin', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  const setAlwaysShowTranslation = useCallback((show: boolean | ((prev: boolean) => boolean)) => {
    setAlwaysShowTranslationState((prev) => {
      const next = typeof show === 'function' ? show(prev) : show;
      try {
        localStorage.setItem('yuyan_always_show_translation', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SETTINGS_KEY);
      if (saved) return { ...DEFAULT_VOICE_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_VOICE_SETTINGS;
  });

  const updateVoiceSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setVoiceSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      try {
        localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  }, []);

  // Initial welcome message (Natural Chinese Conversation Partner)
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore
    }
    return [
      {
        id: 1,
        sender: 'ai',
        text: '你好！今天过得怎么样？想和我聊点什么呢？😊',
        pinyin: 'Nǐ hǎo! Jīntiān guò de zěnmeyàng? Xiǎng hé wǒ liáo diǎn shénme ne? 😊',
        vietnamese: 'Chào bạn! Hôm nay thế nào rồi? Muốn cùng mình trò chuyện về điều gì nào? 😊',
        isPinyinVisible: false,
        isTranslationVisible: false,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ];
  });

  // Save messages to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // ignore
    }
  }, [messages]);

  // Per-message visibility and bookmark toggles
  const toggleMessagePinyin = useCallback((id: number) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isPinyinVisible: !m.isPinyinVisible } : m))
    );
  }, []);

  const toggleMessageTranslation = useCallback((id: number) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isTranslationVisible: !m.isTranslationVisible } : m))
    );
  }, []);

  const toggleMessageBookmark = useCallback((id: number) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isBookmarked: !m.isBookmarked } : m))
    );
  }, []);

  const openAssistant = useCallback((initialPrompt?: string) => {
    setIsAssistantOpen(true);
    setIsMinimized(false);
    if (initialPrompt) {
      setTimeout(() => {
        void sendMessageInternal(initialPrompt);
      }, 100);
    }
  }, []);

  const closeAssistant = useCallback(() => {
    setIsAssistantOpen(false);
    setIsMinimized(false);
  }, []);

  const toggleAssistant = useCallback(() => {
    setIsAssistantOpen((prev) => !prev);
    setIsMinimized(false);
  }, []);

  const minimizeAssistant = useCallback(() => {
    setIsMinimized(true);
  }, []);

  const maximizeAssistant = useCallback(() => {
    setIsMinimized(false);
  }, []);

  const openVoiceModal = useCallback(() => {
    setIsVoiceModalOpen(true);
  }, []);

  useEffect(() => {
    const handleOpenVoice = () => openVoiceModal();
    window.addEventListener('yuyan:open-voice', handleOpenVoice);
    (window as any).__yuyanOpenVoiceModal = openVoiceModal;
    return () => {
      window.removeEventListener('yuyan:open-voice', handleOpenVoice);
      delete (window as any).__yuyanOpenVoiceModal;
    };
  }, [openVoiceModal]);

  const closeVoiceModal = useCallback(() => {
    setIsVoiceModalOpen(false);
  }, []);

  const openSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(true);
  }, []);

  const closeSettingsModal = useCallback(() => {
    setIsSettingsModalOpen(false);
  }, []);

  const openLanguageModal = useCallback(() => {
    setIsLanguageModalOpen(true);
  }, []);

  const closeLanguageModal = useCallback(() => {
    setIsLanguageModalOpen(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([
      {
        id: Date.now(),
        sender: 'ai',
        text: '你好！ cuộc hội thoại đã được làm mới. Hôm nay bạn muốn luyện chủ đề gì nào? 😊',
        pinyin: 'Nǐ hǎo! Jīntiān xiǎng liànxí shénme zhǔtí ne?',
        vietnamese: 'Chào bạn! Cuộc hội thoại đã được làm mới. Hôm nay bạn muốn luyện chủ đề gì nào? 😊',
        isPinyinVisible: alwaysShowPinyin,
        isTranslationVisible: alwaysShowTranslation,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, [alwaysShowPinyin, alwaysShowTranslation]);

  const appendMessage = useCallback(
    (msg: {
      sender: 'ai' | 'user';
      text: string;
      pinyin?: string;
      vietnamese?: string;
      feedback?: string | null;
      followUp?: string;
    }) => {
      const newMsg: ChatMessage = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        sender: msg.sender,
        text: msg.text,
        pinyin: msg.pinyin,
        vietnamese: msg.vietnamese,
        feedback: msg.feedback,
        followUp: msg.followUp,
        isPinyinVisible: alwaysShowPinyin,
        isTranslationVisible: alwaysShowTranslation,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, newMsg]);
    },
    [alwaysShowPinyin, alwaysShowTranslation]
  );

  const sendMessageInternal = async (text: string, attachment?: AiChatAttachment | null) => {
    if ((!text.trim() && !attachment) || isLoading) return;

    const userText = text.trim();
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      attachment: attachment || null,
      timestamp: nowTime,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const isAcademicQuery =
        !attachment &&
        (userText.startsWith('Giải thích') ||
          userText.startsWith('Phân tích') ||
          userText.startsWith('So sánh') ||
          userText.startsWith('Tạo câu ví dụ') ||
          userText.startsWith('Lập kế hoạch') ||
          userText.startsWith('Liệt kê'));

      if (isAcademicQuery || attachment) {
        const recentHistory = messages.slice(-6).map((m) => ({
          sender: m.sender,
          text: m.text,
        }));

        const reply = await aiApiService.sendFreeChatMessage({
          question: userText,
          history: recentHistory,
          attachment: attachment || null,
          preferredLanguage: voiceSettings.preferredResponseLanguage,
        });

        const aiMsg: ChatMessage = {
          id: Date.now() + 1,
          sender: 'ai',
          text: reply,
          isPinyinVisible: alwaysShowPinyin,
          isTranslationVisible: alwaysShowTranslation,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);

        if (voiceSettings.ttsEnabled && voiceSettings.autoPlayResponses && reply) {
          void speechSynthesisService.speakBilingual({
            text: reply,
            rate: voiceSettings.speechRate,
            chineseVoiceUri: voiceSettings.chineseVoiceUri,
            vietnameseVoiceUri: voiceSettings.vietnameseVoiceUri,
            readingMode: voiceSettings.readingMode,
          });
        }
      } else {
        // Natural Chinese Conversation Partner (1-3 sentences)
        const chatReply = await aiApiService.sendChatMessage({
          scenario: activeScenario,
          message: userText,
          conversationMode,
          hskLevel,
          messages: messages.slice(-6).map((m) => ({
            id: m.id,
            sender: m.sender,
            hanzi: m.text,
            pinyin: m.pinyin || '',
            vietnamese: m.vietnamese || '',
            feedback: m.feedback,
          })),
        });

        const aiMsg: ChatMessage = {
          id: Date.now() + 1,
          sender: 'ai',
          text: chatReply.hanzi,
          pinyin: chatReply.pinyin,
          vietnamese: chatReply.vietnamese,
          feedback: chatReply.feedback,
          followUp: chatReply.followUp,
          isPinyinVisible: alwaysShowPinyin,
          isTranslationVisible: alwaysShowTranslation,
          timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);

        if (voiceSettings.ttsEnabled && voiceSettings.autoPlayResponses && chatReply.hanzi) {
          void speechSynthesisService.speakBilingual({
            text: chatReply.hanzi,
            rate: voiceSettings.speechRate,
            chineseVoiceUri: voiceSettings.chineseVoiceUri,
            vietnameseVoiceUri: voiceSettings.vietnameseVoiceUri,
            readingMode: 'chinese_only',
          });
        }
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `⚠️ ${err?.message || 'Không thể kết nối tới máy chủ AI Gemini. Vui lòng thử lại.'}`,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = useCallback(
    async (text: string, attachment?: AiChatAttachment | null) => {
      await sendMessageInternal(text, attachment);
    },
    [isLoading, messages, voiceSettings]
  );

  return (
    <YuyanAIContext.Provider
      value={{
        isAssistantOpen,
        isMinimized,
        isVoiceModalOpen,
        isSettingsModalOpen,
        isLanguageModalOpen,
        messages,
        voiceSettings,
        conversationMode,
        setConversationMode,
        activeScenario,
        setActiveScenario,
        hskLevel,
        setHskLevel,
        alwaysShowPinyin,
        setAlwaysShowPinyin,
        alwaysShowTranslation,
        setAlwaysShowTranslation,
        toggleMessagePinyin,
        toggleMessageTranslation,
        toggleMessageBookmark,
        openAssistant,
        closeAssistant,
        toggleAssistant,
        minimizeAssistant,
        maximizeAssistant,
        openVoiceModal,
        closeVoiceModal,
        openSettingsModal,
        closeSettingsModal,
        openLanguageModal,
        closeLanguageModal,
        updateVoiceSettings,
        sendMessage,
        appendMessage,
        clearMessages,
        isLoading,
      }}
    >
      {children}
    </YuyanAIContext.Provider>
  );
};

export function useYuyanAI(): YuyanAIContextValue {
  const ctx = useContext(YuyanAIContext);
  if (!ctx) {
    throw new Error('useYuyanAI must be used within a YuyanAIProvider');
  }
  return ctx;
}
