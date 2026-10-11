import React from 'react';
import { createPortal } from 'react-dom';
import { MessageSquareText, Sparkles } from 'lucide-react';
import { useYuyanAI } from '../../context/YuyanAIContext';
import { YuyanAIAvatar } from './YuyanAIAvatar';

export const YuyanAIFloatingButton: React.FC = () => {
  const { isAssistantOpen, isMinimized, openAssistant, maximizeAssistant } = useYuyanAI();

  // If already open and not minimized, do not render floating launcher
  if (isAssistantOpen && !isMinimized) {
    return null;
  }
  if (typeof document === 'undefined') return null;

  // If already on the dedicated AI workspace tab, hide the redundant floating launcher
  if (typeof window !== 'undefined' && (window.location.pathname.startsWith('/ai') || window.location.pathname.startsWith('/hoi-thoai-ai') || window.location.pathname.startsWith('/conversation'))) {
    return null;
  }

  const handleClick = () => {
    if (isMinimized) {
      maximizeAssistant();
    } else {
      openAssistant();
    }
  };

  return createPortal(
    <div className="fixed bottom-[calc(var(--mobile-navigation-height,60px)+env(safe-area-inset-bottom,0px)+12px)] md:bottom-7 right-3.5 sm:right-5 z-launcher flex items-center gap-2 group animate-in fade-in slide-in-from-bottom-4 duration-300 isolate">
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
        className="relative group p-0.5 sm:p-1 rounded-full bg-white dark:bg-slate-900 border-2 border-primary/40 shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all focus:outline-hidden focus:ring-4 focus:ring-primary/25 cursor-pointer"
        style={{ backgroundColor: 'var(--surface, #ffffff)' }}
      >
        <div className="sm:hidden">
          <YuyanAIAvatar size="md" showOnlineStatus={true} />
        </div>
        <div className="hidden sm:block">
          <YuyanAIAvatar size="lg" showOnlineStatus={true} />
        </div>

        {/* Floating Mini Chat Badge Icon */}
        <div className="absolute -bottom-0.5 -right-0.5 sm:-bottom-1 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-white flex items-center justify-center shadow-md border-2 border-white dark:border-slate-900">
          <MessageSquareText className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
        </div>
      </button>
    </div>,
    document.body
  );
};
