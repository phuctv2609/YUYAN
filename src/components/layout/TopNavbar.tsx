import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Flame,
  Bell,
  ChevronDown,
  Menu,
  Sun,
  Moon,
  Edit3,
  User,
  Save,
  X,
  Loader2,
  Bot,
  GraduationCap,
  CheckCheck,
  Trash2,
  Settings,
} from 'lucide-react';
import { useToast } from '../ui/Toast.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { learnerRepository, StudentProfile, validateStudentProfile, PRESET_AVATARS } from '../../data/repositories/learnerRepository.ts';
import { LearnerAvatar } from '../ui/LearnerAvatar.tsx';

interface TopNavbarProps {
  currentTab?: string;
  onOpenMobileMenu: () => void;
  onOpenSearchModal?: () => void;
  onSelectTab?: (tab: string) => void;
  onOpenMoreFeatures?: () => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  type: 'streak' | 'lesson' | 'ai' | 'system';
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Chào mừng trở lại!',
    message: 'Tiếp tục hoàn thành mục tiêu học hôm nay để giữ vững chuỗi học tập.',
    time: 'Vừa xong',
    isRead: false,
    type: 'lesson',
  },
  {
    id: 'notif-2',
    title: 'Chuỗi ngày học liên tiếp 🔥',
    message: 'Hoàn thành ít nhất 1 bài học hôm nay để giữ vững chuỗi thành tích nhé!',
    time: '2 giờ trước',
    isRead: false,
    type: 'streak',
  },
  {
    id: 'notif-3',
    title: 'Trợ lý AI YUYAN sẵn sàng',
    message: 'Luyện tập hội thoại tiếng Trung tự nhiên cùng AI YUYAN bất cứ lúc nào.',
    time: '1 ngày trước',
    isRead: true,
    type: 'ai',
  },
];

export const TopNavbar: React.FC<TopNavbarProps> = ({
  currentTab = 'dashboard',
  onOpenMobileMenu,
  onOpenSearchModal,
  onSelectTab,
  onOpenMoreFeatures,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [profile, setProfile] = useState<StudentProfile>(() => learnerRepository.getProfile());
  const { showToast } = useToast();
  const { resolvedTheme, setTheme } = useTheme();

  const notificationRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Quick edit modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editDisplayName, setEditDisplayName] = useState(profile.displayName);
  const [editSchoolEmail, setEditSchoolEmail] = useState(profile.schoolEmail);
  const [editAvatar, setEditAvatar] = useState(profile.avatar || '');
  const [validationErrors, setValidationErrors] = useState<{ displayName?: string; schoolEmail?: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const unsub = learnerRepository.subscribe((newProfile) => {
      setProfile(newProfile);
    });
    return () => unsub();
  }, []);

  // Click outside to dismiss dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Keyboard shortcut listener: Ctrl+K for search, Escape to close modals/menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (onOpenSearchModal) {
          onOpenSearchModal();
        }
      } else if (e.key === 'Escape') {
        if (showNotifications) setShowNotifications(false);
        if (showProfileMenu) setShowProfileMenu(false);
        if (isEditModalOpen && !isSaving) {
          setIsEditModalOpen(false);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearchModal, isEditModalOpen, isSaving, showNotifications, showProfileMenu]);

  const handleOpenEditModal = () => {
    setEditDisplayName(profile.displayName);
    setEditSchoolEmail(profile.schoolEmail);
    setEditAvatar(profile.avatar || '');
    setValidationErrors({});
    setShowProfileMenu(false);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    if (isSaving) return;
    setIsEditModalOpen(false);
    setValidationErrors({});
  };

  const handleSaveQuickProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;

    const result = validateStudentProfile({
      displayName: editDisplayName,
      schoolEmail: editSchoolEmail,
    });

    if (!result.isValid) {
      setValidationErrors(result.errors);
      showToast('Vui lòng kiểm tra lại thông tin hồ sơ', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const res = await learnerRepository.updateProfileAsync({
        displayName: editDisplayName.trim(),
        name: editDisplayName.trim(),
        schoolEmail: editSchoolEmail.trim(),
        avatar: editAvatar.trim() || undefined,
      });

      if (!res.success) {
        showToast(res.error || 'Cập nhật hồ sơ thất bại', 'error');
        return;
      }

      setIsEditModalOpen(false);
      setValidationErrors({});
      showToast('Cập nhật thông tin tài khoản thành công!', 'success');
      if (res.emailConfirmationPending) {
        showToast('Một email xác thực đã được gửi đến địa chỉ mới.', 'info');
      }
    } catch (err: any) {
      showToast(err?.message || 'Có lỗi xảy ra khi lưu thông tin', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('Đã đánh dấu tất cả thông báo là đã đọc', 'info');
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
    showToast('Đã xóa tất cả thông báo', 'info');
  };

  return (
    <header className="fixed top-0 right-0 left-0 md:left-[260px] h-[68px] z-20 bg-surface/95 backdrop-blur-md border-b border-border-subtle flex justify-between items-center px-2.5 sm:px-6 md:px-6 lg:px-8 select-none transition-colors">
      {/* Left: Mobile Navigation Trigger, Brand Badge (mobile/tablet), and Smart Global Search */}
      <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0 max-w-xl pr-1.5 sm:pr-2">
        {/* Hamburger Menu Trigger (Visible on mobile/tablet) */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="p-1.5 sm:p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary md:hidden flex-shrink-0 transition-colors cursor-pointer"
          aria-label="Mở menu điều hướng"
          title="Menu điều hướng"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Brand Badge (Visible on mobile/tablet where sidebar is in drawer mode) */}
        <div className="flex md:hidden items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-secondary to-hsk-1 flex items-center justify-center text-white shadow-2xs font-hanzi font-bold text-sm sm:text-base select-none">
            语
          </div>
          <div className="hidden sm:flex flex-col select-none leading-none">
            <div className="flex items-center gap-1">
              <span className="font-bold text-text-primary text-sm sm:text-base">Yuyan</span>
              <span className="text-[9px] px-1 py-0.5 rounded bg-coral-soft text-secondary font-semibold font-hanzi">
                语言
              </span>
            </div>
            <span className="text-[9px] text-text-muted truncate mt-0.5">
              Học tiếng Trung thông minh
            </span>
          </div>
        </div>

        {/* Smart Search Field (Desktop & Tablet) */}
        <div
          onClick={onOpenSearchModal}
          className="hidden md:flex relative flex-1 min-w-0 max-w-xs md:max-w-sm lg:max-w-md xl:max-w-lg cursor-pointer group"
          title="Tìm kiếm thông minh (Phím tắt: Ctrl + K)"
        >
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 absolute left-2.5 sm:left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-hover:text-primary transition-colors pointer-events-none" />
          <input
            id="global-search-input"
            readOnly
            onClick={onOpenSearchModal}
            className="w-full h-8 sm:h-10 pl-7 sm:pl-9 pr-3 lg:pr-20 bg-input-bg group-hover:bg-surface-secondary border border-border-subtle group-hover:border-primary/40 focus:border-primary rounded-full text-xs sm:text-sm text-text-primary placeholder:text-text-muted cursor-pointer transition-all shadow-2xs truncate select-none"
            placeholder="Tìm bài học, từ vựng, ngữ pháp..."
            type="text"
          />
          <div className="hidden lg:flex absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 items-center pointer-events-none">
            <kbd className="px-1.5 py-0.5 text-[10px] font-semibold text-text-muted bg-surface dark:bg-surface-secondary border border-border-subtle rounded-md shadow-2xs">
              Ctrl + K
            </kbd>
          </div>
        </div>
      </div>

      {/* Center Spacer: Open, uncluttered layout matching modern redesign */}
      <div className="flex-1 hidden md:block" />

      {/* Right: Search (mobile), AI Quick Access, Streak Telemetry, Notifications, Theme Switcher & Profile */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-2.5 lg:gap-3 flex-shrink-0">
        {/* Mobile Search Icon Button (< 768px) */}
        <button
          type="button"
          onClick={onOpenSearchModal}
          className="p-1.5 sm:p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-secondary md:hidden flex-shrink-0 transition-colors cursor-pointer"
          title="Tìm kiếm thông minh (Ctrl + K)"
          aria-label="Tìm kiếm"
        >
          <Search className="w-4.5 h-4.5" />
        </button>

        {/* AI hội thoại Button: Prominent, high-contrast brand blue access */}
        <button
          data-testid="top-navbar-ai-btn"
          type="button"
          onClick={() => onSelectTab && onSelectTab('ai')}
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 lg:px-4 lg:py-2 rounded-full font-bold text-xs sm:text-sm transition-all duration-150 active:scale-95 shadow-xs cursor-pointer flex-shrink-0 border border-transparent ${
            currentTab === 'ai'
              ? 'bg-[#004573] dark:bg-blue-600 text-white shadow-md ring-2 ring-sky-400/50'
              : 'bg-[#0062a1] hover:bg-[#004f82] dark:bg-[#2563eb] dark:hover:bg-[#1d4ed8] text-white hover:shadow-md'
          }`}
          style={{
            backgroundColor:
              currentTab === 'ai'
                ? 'var(--ai-button-active-bg, #004573)'
                : 'var(--ai-button-bg, #0062a1)',
            color: '#ffffff',
          }}
          title="Mở AI hội thoại - Trợ lý luyện nói tiếng Trung thông minh"
          aria-label="AI hội thoại"
        >
          <Bot className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 flex-shrink-0 text-white" />
          <span className="hidden lg:inline text-white">AI hội thoại</span>
          <span className="inline lg:hidden text-white font-bold text-[11px] sm:text-xs">AI</span>
        </button>

        {/* Streak Chip (Chuỗi ngày học) - Visible on tablet/desktop, compact in drawer for phones */}
        <div
          onClick={() => {
            showToast(`Bạn đã duy trì chuỗi học ${profile.studyStreakDays} ngày liên tiếp!`, 'success');
            if (onSelectTab) onSelectTab('progress');
          }}
          className="hidden sm:flex items-center gap-1 sm:gap-1.5 px-2 py-1 sm:px-3 sm:py-1.5 bg-amber-500/10 dark:bg-amber-500/15 rounded-full border border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-2xs cursor-pointer hover:bg-amber-500/20 transition-all active:scale-95 flex-shrink-0"
          title={`Chuỗi học liên tiếp: ${profile.studyStreakDays} ngày`}
        >
          <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 fill-amber-500 flex-shrink-0" />
          <span className="text-[11px] sm:text-sm font-bold whitespace-nowrap">{profile.studyStreakDays}d</span>
        </div>

        {/* Notifications Popover (Thông báo) */}
        <div className="relative" ref={notificationRef}>
          <button
            type="button"
            onClick={() => {
              setShowNotifications((prev) => !prev);
              setShowProfileMenu(false);
            }}
            className={`relative w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
              showNotifications
                ? 'bg-surface-secondary text-text-primary'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-secondary'
            }`}
            title="Thông báo"
            aria-label="Xem thông báo"
            aria-expanded={showNotifications}
          >
            <Bell className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 sm:top-1 sm:right-1 min-w-[14px] sm:min-w-[16px] h-3.5 sm:h-4 px-0.5 sm:px-1 rounded-full bg-red-500 text-white text-[9px] sm:text-[10px] font-bold flex items-center justify-center ring-2 ring-surface animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-surface rounded-2xl shadow-xl border border-border-subtle z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface-secondary/40">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-text-primary">Thông báo mới</span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      unreadCount > 0
                        ? 'bg-secondary/15 text-secondary'
                        : 'bg-surface-secondary text-text-muted'
                    }`}
                  >
                    {unreadCount > 0 ? `${unreadCount} mới` : 'Đã đọc hết'}
                  </span>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllAsRead}
                    className="flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-dark transition-colors cursor-pointer"
                    title="Đánh dấu tất cả là đã đọc"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Đã đọc</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="max-h-[360px] overflow-y-auto custom-scrollbar divide-y divide-border-subtle/50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-text-muted">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Không có thông báo nào</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    return (
                      <div
                        key={n.id}
                        onClick={() => handleMarkAsRead(n.id)}
                        className={`p-3.5 transition-colors cursor-pointer flex gap-3 items-start ${
                          n.isRead
                            ? 'bg-transparent hover:bg-surface-secondary/50'
                            : 'bg-primary-ultra-soft/70 hover:bg-primary-ultra-soft'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            n.type === 'streak'
                              ? 'bg-amber-500/10 text-amber-500'
                              : n.type === 'ai'
                              ? 'bg-primary-soft text-primary'
                              : 'bg-secondary/10 text-secondary'
                          }`}
                        >
                          {n.type === 'streak' ? (
                            <Flame className="w-4 h-4 fill-amber-500" />
                          ) : n.type === 'ai' ? (
                            <Bot className="w-4 h-4" />
                          ) : (
                            <GraduationCap className="w-4 h-4" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <h4
                              className={`text-xs truncate ${
                                n.isRead ? 'font-medium text-text-primary' : 'font-bold text-text-primary'
                              }`}
                            >
                              {n.title}
                            </h4>
                            <span className="text-[10px] text-text-muted flex-shrink-0">{n.time}</span>
                          </div>
                          <p className="text-xs text-text-secondary leading-relaxed line-clamp-2">
                            {n.message}
                          </p>
                        </div>

                        {!n.isRead && (
                          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="px-4 py-2.5 border-t border-border-subtle bg-surface-secondary/30 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={handleClearNotifications}
                    className="flex items-center gap-1.5 text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa tất cả</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-text-secondary hover:text-text-primary font-medium cursor-pointer"
                  >
                    Đóng
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Theme Switcher (Chuyển sáng/tối chỉ 1 nút) */}
        <button
          type="button"
          onClick={() => {
            const next = resolvedTheme === 'dark' ? 'light' : 'dark';
            setTheme(next);
            showToast(`Đã chuyển sang ${next === 'dark' ? 'Giao diện Tối' : 'Giao diện Sáng'}`, 'info');
          }}
          className="w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors btn-motion cursor-pointer flex-shrink-0"
          title={`Giao diện hiện tại: ${resolvedTheme === 'dark' ? 'Tối' : 'Sáng'} (Nhấn để chuyển)`}
          aria-label="Chuyển đổi giao diện Sáng / Tối"
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 text-amber-400" />
          ) : (
            <Moon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 lg:w-5 lg:h-5 text-text-secondary" />
          )}
        </button>

        {/* User Profile Capsule (Ảnh đại diện và menu tài khoản) */}
        <div className="relative" ref={profileMenuRef}>
          <div
            onClick={() => {
              setShowProfileMenu((prev) => !prev);
              setShowNotifications(false);
            }}
            className="flex items-center gap-1 sm:gap-2 lg:gap-2.5 pl-0.5 sm:pl-1 pr-0.5 sm:pr-2 lg:pr-2.5 py-0.5 sm:py-1 rounded-full hover:bg-surface-secondary transition-colors cursor-pointer border border-transparent hover:border-border-subtle"
            title={`${profile.displayName} (${profile.schoolEmail})`}
            aria-expanded={showProfileMenu}
          >
            <LearnerAvatar profile={profile} size="sm" />
            <div className="text-left hidden lg:block max-w-[80px] xl:max-w-[130px]">
              <div className="text-xs font-bold text-text-primary leading-tight truncate">
                {profile.displayName}
              </div>
              <div className="text-[10px] text-text-muted leading-tight truncate">
                HSK {profile.targetHskLevel}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0 hidden lg:block" />
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-60 bg-surface rounded-2xl shadow-xl border border-border-subtle p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2.5 border-b border-border-subtle mb-1">
                <p className="font-bold text-sm text-text-primary truncate">{profile.displayName}</p>
                <p className="text-xs text-text-muted truncate">{profile.schoolEmail}</p>
                <div className="mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-soft text-primary">
                  Mục tiêu HSK {profile.targetHskLevel}
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenEditModal}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-primary hover:bg-primary-soft rounded-xl transition-colors text-left cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Chỉnh sửa tên & email</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onSelectTab) onSelectTab('settings');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-xl transition-colors text-left cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <span>Cài đặt hồ sơ & Tài khoản</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  if (onSelectTab) onSelectTab('progress');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-xl transition-colors text-left cursor-pointer"
              >
                <Flame className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>Tiến độ học tập</span>
              </button>
              {onOpenMoreFeatures && (
                <button
                  type="button"
                  onClick={() => {
                    setShowProfileMenu(false);
                    onOpenMoreFeatures();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-xl transition-colors text-left cursor-pointer"
                >
                  <User className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                  <span>Khám phá thêm tính năng</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Profile Edit Modal */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) {
              handleCloseEditModal();
            }
          }}
        >
          <div
            className="w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-border-subtle p-5 sm:p-6 space-y-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-edit-profile-title"
          >
            <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 id="modal-edit-profile-title" className="text-base font-bold text-text-primary">
                    Chỉnh sửa tên & email
                  </h3>
                  <p className="text-xs text-text-muted">Cập nhật thông tin tài khoản mà không chuyển trang</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseEditModal}
                disabled={isSaving}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50 cursor-pointer"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickProfile} className="space-y-4">
              {/* Avatar selection preview */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-text-secondary">Ảnh đại diện</label>
                <div className="flex items-center gap-3">
                  <LearnerAvatar
                    profile={{
                      ...profile,
                      displayName: editDisplayName || profile.displayName,
                      avatar: editAvatar || undefined,
                    }}
                    size="lg"
                  />
                  <div className="flex-1 flex flex-wrap gap-1.5">
                    {PRESET_AVATARS.map((av) => {
                      const isSelected = editAvatar === av.url;
                      return (
                        <button
                          key={av.id}
                          type="button"
                          onClick={() => setEditAvatar(av.url)}
                          className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all p-0.5 flex items-center justify-center text-[10px] font-bold cursor-pointer ${
                            isSelected
                              ? 'border-primary ring-2 ring-primary/30 scale-105 bg-primary-soft text-primary'
                              : 'border-border-subtle hover:border-primary/50 text-text-muted bg-surface-secondary'
                          }`}
                          title={av.label}
                        >
                          {av.url ? (
                            <img src={av.url} alt={av.label} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span>Tên</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Display Name Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="quick-display-name" className="text-xs font-bold text-text-secondary">
                    Tên hiển thị <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10px] text-text-muted">
                    {editDisplayName.trim().length}/60 ký tự
                  </span>
                </div>
                <input
                  id="quick-display-name"
                  type="text"
                  value={editDisplayName}
                  onChange={(e) => {
                    setEditDisplayName(e.target.value);
                    if (validationErrors.displayName) {
                      setValidationErrors((prev: any) => ({ ...prev, displayName: undefined }));
                    }
                  }}
                  disabled={isSaving}
                  placeholder="Ví dụ: Nguyễn Văn An, 李明, Sarah Chen"
                  className={`w-full px-3.5 py-2.5 bg-input-bg border rounded-xl text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none ${
                    validationErrors.displayName
                      ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20'
                      : 'border-border-subtle focus:border-primary'
                  }`}
                  autoFocus
                />
                {validationErrors.displayName ? (
                  <p className="text-xs text-red-500 font-medium">{validationErrors.displayName}</p>
                ) : (
                  <p className="text-[11px] text-text-muted">Hỗ trợ đầy đủ tiếng Việt có dấu, chữ Hán và tiếng Anh.</p>
                )}
              </div>

              {/* Email Input */}
              <div className="space-y-1.5">
                <label htmlFor="quick-school-email" className="text-xs font-bold text-text-secondary">
                  Email tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  id="quick-school-email"
                  type="email"
                  value={editSchoolEmail}
                  onChange={(e) => {
                    setEditSchoolEmail(e.target.value);
                    if (validationErrors.schoolEmail) {
                      setValidationErrors((prev: any) => ({ ...prev, schoolEmail: undefined }));
                    }
                  }}
                  disabled={isSaving}
                  placeholder="name@example.com"
                  className={`w-full px-3.5 py-2.5 bg-input-bg border rounded-xl text-sm text-text-primary placeholder:text-text-muted transition-colors focus:outline-none ${
                    validationErrors.schoolEmail
                      ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20'
                      : 'border-border-subtle focus:border-primary'
                  }`}
                />
                {validationErrors.schoolEmail ? (
                  <p className="text-xs text-red-500 font-medium">{validationErrors.schoolEmail}</p>
                ) : (
                  <p className="text-[11px] text-text-muted">Email liên hệ và nhận thông báo học tập.</p>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={handleCloseEditModal}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-dark transition-all shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang lưu...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Lưu thông tin</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
