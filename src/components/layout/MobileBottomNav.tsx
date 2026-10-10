import React from 'react';
import { MOBILE_BOTTOM_NAV_IDS, getNavItemById } from '../../config/navigation.ts';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ currentTab, onSelectTab }) => {
  const items = MOBILE_BOTTOM_NAV_IDS.map((id) => getNavItemById(id)).filter(Boolean);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border-subtle flex items-center justify-around px-2 py-1.5 safe-bottom">
      {items.map((item) => {
        if (!item) return null;
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              isActive ? 'text-primary font-bold scale-105' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] tracking-tight">{item.shortLabel || item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
