/**
 * YUYAN — Global AI Assistant Context
 * Controls floating assistant visibility, chat drawer state, active conversation,
 * voice mode modal, and AI experience preferences across all pages.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { VoiceSettings, DEFAULT_VOICE_SETTINGS } from '../services/speech/speechTypes';
import { aiApiService, AiChatAttachment } from '../services/ai/aiApiService';
import { speechSynthesisService } from '../services/speech/speechSynthesisService';

export interface ChatMessage {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  attachment?: AiChatAttachment | null;
  pinyin?: string;
  vietnamese?: string;
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

  // Initial welcome message
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
        text: 'Xin chào! Mình là Yuyan AI. Em muốn luyện gì hôm nay? 😊',
        pinyin: 'Nǐ hǎo! Wǒ shì Yuyan AI. Nǐ jīntiān xiǎng liànxí shénme?',
        vietnamese: 'Xin chào! Mình là Yuyan AI. Em muốn luyện gì hôm nay? 😊',
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

  const openAssistant = useCallback((initialPrompt?: string) => {
    setIsAssistantOpen(true);
    setIsMinimized(false);
    if (initialPrompt) {
      // Send the initial prompt if requested
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
        text: 'Xin chào! Cuộc hội thoại đã được làm mới. Em muốn hỏi về từ vựng, ngữ pháp hay luyện thi HSK? 😊',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  }, []);

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
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);

      // Auto-play AI response if enabled in voice settings
      if (voiceSettings.ttsEnabled && voiceSettings.autoPlayResponses && reply) {
        void speechSynthesisService.speakBilingual({
          text: reply,
          rate: voiceSettings.speechRate,
          chineseVoiceUri: voiceSettings.chineseVoiceUri,
          vietnameseVoiceUri: voiceSettings.vietnameseVoiceUri,
          readingMode: voiceSettings.readingMode,
        });
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
