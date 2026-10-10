import React from 'react';
import { Home, GraduationCap, Languages, Bot, LayoutGrid } from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenMoreFeatures: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenMoreFeatures,
}) => {
  const items = [
    { id: 'dashboard', label: 'Trang chủ', icon: Home },
    { id: 'lesson', label: 'HSK', icon: GraduationCap },
    { id: 'vocabulary', label: 'Từ vựng', icon: Languages },
    { id: 'ai', label: 'AI', icon: Bot },
    { id: 'more', label: 'Thêm', icon: LayoutGrid, isAction: true },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-nav-bottom bg-surface/95 backdrop-blur-md border-t border-border-subtle flex items-center justify-around px-2 py-1.5 safe-bottom">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.isAction) {
                onOpenMoreFeatures();
              } else {
                onSelectTab(item.id);
              }
            }}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-xl transition-all ${
              isActive ? 'text-primary font-bold scale-105' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
            <span className="text-[10px] tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
