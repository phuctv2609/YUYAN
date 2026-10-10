import React, { useState, useEffect } from 'react';
import { X, Flame } from 'lucide-react';
import { MAIN_NAV_ITEMS, SECONDARY_NAV_ITEMS } from '../../config/navigation.ts';
import { learnerRepository, StudentProfile } from '../../data/repositories/learnerRepository.ts';
import { LearnerAvatar } from '../ui/LearnerAvatar.tsx';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const [profile, setProfile] = useState<StudentProfile>(() => learnerRepository.getProfile());

  useEffect(() => {
    const unsub = learnerRepository.subscribe((p) => {
      setProfile(p);
    });
    return () => unsub();
  }, []);
  const sidebarContent = (
    <div className="h-full flex flex-col bg-surface border-r border-border-subtle select-none">
      {/* Brand Header */}
      <div className="p-5 pb-4 border-b border-divider-line flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-secondary to-hsk-1 flex items-center justify-center text-white shadow-sm flex-shrink-0 font-hanzi font-bold text-xl">
            语
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-text-primary text-lg">Yuyan</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-coral-soft text-secondary font-semibold font-hanzi">
                语言
              </span>
            </div>
            <span className="text-xs text-text-muted">Học tiếng Trung thông minh</span>
          </div>
        </div>

        {isOpenMobile && onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary md:hidden"
            aria-label="Đóng menu"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Nav List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1">
        {MAIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectTab(item.id);
                if (onCloseMobile) onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ease-out active:scale-[0.98] ${
                isActive
                  ? 'bg-primary-soft text-primary shadow-2xs'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-primary' : 'text-text-muted'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary/15 text-secondary font-bold uppercase tracking-wider">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Secondary Links & Learner Profile Card */}
      <div className="p-3 border-t border-divider-line space-y-2 bg-surface">
        <div className="space-y-1">
          {SECONDARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  if (onCloseMobile) onCloseMobile();
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-2 text-sm font-medium rounded-xl transition-colors ${
                  isActive
                    ? 'bg-primary-soft text-primary font-semibold'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0 text-text-muted" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Learner Profile Card */}
        <div
          onClick={() => {
            onSelectTab('settings');
            if (onCloseMobile) onCloseMobile();
          }}
          className="p-2.5 rounded-xl bg-surface-secondary/70 hover:bg-surface-secondary border border-border-subtle cursor-pointer transition-all flex items-center gap-2.5 group"
          title="Xem hồ sơ & Cài đặt"
        >
          <LearnerAvatar profile={profile} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <p className="text-xs font-bold text-text-primary truncate">{profile.displayName}</p>
              <div className="flex items-center gap-0.5 text-amber-500 font-bold text-[10px] flex-shrink-0">
                <Flame className="w-3 h-3 fill-amber-500" />
                <span>{profile.studyStreakDays}d</span>
              </div>
            </div>
            <p className="text-[11px] text-text-muted truncate">{profile.schoolEmail}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-[260px] flex-col z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-[280px] max-w-[85vw] h-full z-10 shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
