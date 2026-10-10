import React from 'react';
import { MessageSquareText, Sparkles } from 'lucide-react';
import { useYuyanAI } from '../../context/YuyanAIContext';
import { YuyanAIAvatar } from './YuyanAIAvatar';

export const YuyanAIFloatingButton: React.FC = () => {
  const { isAssistantOpen, isMinimized, openAssistant, maximizeAssistant } = useYuyanAI();

  // If already open and not minimized, do not render floating bubble
  if (isAssistantOpen && !isMinimized) {
    return null;
  }

  const handleClick = () => {
    if (isMinimized) {
      maximizeAssistant();
    } else {
      openAssistant();
    }
  };

  return (
    <div className="fixed bottom-20 md:bottom-7 right-5 z-40 flex items-center gap-2 group animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Tooltip Badge "Hỏi Yuyan AI" */}
      <div
        onClick={handleClick}
        className="cursor-pointer hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/90 dark:bg-slate-800/95 text-white text-xs font-bold shadow-lg backdrop-blur-xs border border-white/10 opacity-90 group-hover:opacity-100 group-hover:-translate-x-1 transition-all select-none"
      >
        <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
        <span>Hỏi Yuyan AI</span>
      </div>

      {/* Floating Circular Trigger */}
      <button
        onClick={handleClick}
        aria-label="Mở trợ lý ảo Yuyan AI"
        className="relative group p-1 rounded-full bg-surface dark:bg-slate-900 border-2 border-primary/40 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all focus:outline-hidden focus:ring-4 focus:ring-primary/25"
      >
        <YuyanAIAvatar size="lg" showOnlineStatus={true} />

        {/* Floating Mini Chat Badge Icon */}
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-surface dark:border-slate-900">
          <MessageSquareText className="w-3.5 h-3.5" />
        </div>
      </button>
    </div>
  );
};
