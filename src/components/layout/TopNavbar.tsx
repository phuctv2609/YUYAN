import React, { useState, useEffect } from 'react';
import { Search, Flame, Bell, ChevronDown, Menu, Sun, Moon } from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { learnerRepository, StudentProfile } from '../../data/repositories/learnerRepository.ts';
import { LearnerAvatar } from '../ui/LearnerAvatar.tsx';

interface TopNavbarProps {
  onOpenMobileMenu: () => void;
  onOpenSearchModal?: () => void;
  onSelectTab?: (tab: string) => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onOpenMobileMenu, onOpenSearchModal, onSelectTab }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profile, setProfile] = useState<StudentProfile>(() => learnerRepository.getProfile());
  const { showToast } = useToast();
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const unsub = learnerRepository.subscribe((newProfile) => {
      setProfile(newProfile);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (onOpenSearchModal) {
          onOpenSearchModal();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearchModal]);

  return (
    <header className="fixed top-0 right-0 left-0 md:left-[260px] h-[68px] z-20 bg-surface border-b border-border-subtle flex justify-between items-center px-3 sm:px-6 md:px-8">
      {/* Left: Mobile Menu Toggle & Global Search */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink min-w-0">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary md:hidden flex-shrink-0"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={onOpenSearchModal}
          className="relative w-28 xs:w-40 sm:w-60 md:w-80 lg:w-96 cursor-pointer flex-shrink"
        >
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            id="global-search-input"
            readOnly
            onClick={onOpenSearchModal}
            className="w-full h-10 pl-8 sm:pl-9 pr-3 sm:pr-14 bg-input-bg border border-border-subtle rounded-full text-xs sm:text-sm text-text-primary placeholder:text-text-muted cursor-pointer hover:border-primary-container focus:outline-none transition-all truncate"
            placeholder="Tìm bài học..."
            type="text"
          />
          <div className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-text-muted bg-surface border border-border-subtle rounded-md shadow-2xs">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right: Streak Telemetry, Notifications & User Info */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        {/* Streak Chip */}
        <div
          onClick={() => showToast(`Bạn đã duy trì chuỗi học ${profile.studyStreakDays} ngày liên tiếp!`, 'success')}
          className="flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-amber-500/10 dark:bg-amber-500/15 rounded-full border border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-2xs cursor-pointer hover:bg-amber-500/20 transition-colors"
          title={`Chuỗi học liên tiếp ${profile.studyStreakDays} ngày`}
        >
          <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
          <span className="text-xs sm:text-sm font-bold whitespace-nowrap">{profile.studyStreakDays}d</span>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-text-secondary hover:bg-surface-secondary transition-colors"
            title="Thông báo"
            aria-label="Xem thông báo"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 w-2 h-2 rounded-full bg-secondary ring-2 ring-surface"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 bg-surface rounded-2xl shadow-xl border border-border-subtle p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-divider-line mb-3">
                <span className="font-bold text-sm text-text-primary">Thông báo mới</span>
                <span className="text-xs text-secondary font-medium">1 mới</span>
              </div>
              <div className="text-xs text-text-secondary space-y-2">
                <div className="p-2.5 bg-primary-ultra-soft rounded-lg border border-primary-soft">
                  <p className="font-semibold text-text-primary">Chào mừng trở lại, {profile.displayName}!</p>
                  <p className="mt-0.5 text-text-secondary">Tiếp tục hoàn thành mục tiêu HSK {profile.targetHskLevel} hôm nay để giữ vững chuỗi học.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Theme Switcher */}
        <button
          onClick={() => {
            const next = resolvedTheme === 'dark' ? 'light' : 'dark';
            setTheme(next);
            showToast(`Đã chuyển sang ${next === 'dark' ? 'Giao diện Tối' : 'Giao diện Sáng'}`, 'info');
          }}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors btn-motion"
          title={`Giao diện hiện tại: ${resolvedTheme === 'dark' ? 'Tối' : 'Sáng'} (Nhấn để chuyển)`}
          aria-label="Chuyển đổi giao diện Sáng / Tối"
        >
          {resolvedTheme === 'dark' ? (
            <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
          ) : (
            <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          )}
        </button>

        {/* User Profile Capsule: Fully visible on both mobile and desktop */}
        <div className="relative">
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-1.5 sm:gap-2.5 pl-1 pr-1.5 sm:pr-2.5 py-1 rounded-full hover:bg-surface-secondary transition-colors cursor-pointer border border-transparent hover:border-border-subtle"
            title={`${profile.displayName} (${profile.schoolEmail})`}
          >
            <LearnerAvatar profile={profile} size="sm" />
            <div className="text-left max-w-[65px] xs:max-w-[90px] sm:max-w-[120px] md:max-w-[150px]">
              <div className="text-xs font-bold text-text-primary leading-tight truncate">{profile.displayName}</div>
              <div className="text-[10px] text-text-muted leading-tight truncate hidden xs:block">
                HSK {profile.targetHskLevel}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-surface rounded-2xl shadow-xl border border-border-subtle p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-divider-line mb-1">
                <p className="font-bold text-sm text-text-primary truncate">{profile.displayName}</p>
                <p className="text-xs text-text-muted truncate">{profile.schoolEmail}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onSelectTab) onSelectTab('progress');
                }}
                className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
              >
                Hồ sơ & Tiến độ học tập
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onSelectTab) onSelectTab('settings');
                }}
                className="w-full text-left px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-lg transition-colors"
              >
                Cài đặt & Giao diện
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
