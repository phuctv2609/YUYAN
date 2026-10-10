import React, { useState, useEffect } from 'react';
import { Settings, Sun, Moon, Laptop, RotateCcw, User, Edit3, Save, X, CheckCircle2, Target, Clock, Flame } from 'lucide-react';
import { useTheme, Theme } from '../../context/ThemeContext.tsx';
import { useToast } from '../ui/Toast.tsx';
import { learnerRepository, StudentProfile, validateStudentProfile } from '../../data/repositories/learnerRepository.ts';
import { LearnerAvatar } from '../ui/LearnerAvatar.tsx';

const PRESET_AVATARS = [
  { id: 'none', label: 'Viết tắt (Tên)', url: '' },
  { id: 'avatar_panda', label: 'Gấu Trúc', url: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?w=128&auto=format&fit=crop&q=80' },
  { id: 'avatar_scholar', label: 'Học Giả', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=128&auto=format&fit=crop&q=80' },
  { id: 'avatar_student', label: 'Du Học Sinh', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=128&auto=format&fit=crop&q=80' },
];

export const SettingsView: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<StudentProfile>(() => learnerRepository.getProfile());
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: profile.displayName,
    schoolEmail: profile.schoolEmail,
    targetHskLevel: profile.targetHskLevel,
    dailyGoalMinutes: profile.dailyGoalMinutes,
    avatar: profile.avatar || '',
  });
  const [validationErrors, setValidationErrors] = useState<{ displayName?: string; schoolEmail?: string; dailyGoalMinutes?: string }>({});

  useEffect(() => {
    const unsub = learnerRepository.subscribe((p) => {
      setProfile(p);
      setEditForm({
        displayName: p.displayName,
        schoolEmail: p.schoolEmail,
        targetHskLevel: p.targetHskLevel,
        dailyGoalMinutes: p.dailyGoalMinutes,
        avatar: p.avatar || '',
      });
    });
    return () => unsub();
  }, []);

  const themeOptions: { id: Theme; label: string; desc: string; icon: typeof Sun }[] = [
    { id: 'light', label: 'Giao diện Sáng (Light)', desc: 'Tone trắng & xanh lam tươi sáng, độ tương phản cao', icon: Sun },
    { id: 'dark', label: 'Giao diện Tối (Dark)', desc: 'Tone xanh navy dịu mắt, tối ưu cho học đêm dài', icon: Moon },
    { id: 'system', label: 'Tự động theo Hệ thống (System)', desc: 'Tự động chuyển đổi theo cài đặt thiết bị của bạn', icon: Laptop },
  ];

  const handleStartEdit = () => {
    setEditForm({
      displayName: profile.displayName,
      schoolEmail: profile.schoolEmail,
      targetHskLevel: profile.targetHskLevel,
      dailyGoalMinutes: profile.dailyGoalMinutes,
      avatar: profile.avatar || '',
    });
    setValidationErrors({});
    setIsEditingProfile(true);
  };

  const handleCancelEdit = () => {
    setValidationErrors({});
    setIsEditingProfile(false);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const result = validateStudentProfile({
      displayName: editForm.displayName,
      schoolEmail: editForm.schoolEmail,
      dailyGoalMinutes: editForm.dailyGoalMinutes,
    });

    if (!result.isValid) {
      setValidationErrors(result.errors);
      showToast('Vui lòng kiểm tra lại thông tin hồ sơ', 'error');
      return;
    }

    learnerRepository.updateProfile({
      displayName: editForm.displayName.trim(),
      name: editForm.displayName.trim(),
      schoolEmail: editForm.schoolEmail.trim(),
      targetHskLevel: editForm.targetHskLevel,
      dailyGoalMinutes: editForm.dailyGoalMinutes,
      avatar: editForm.avatar.trim() || undefined,
    });

    setIsEditingProfile(false);
    setValidationErrors({});
    showToast('Cập nhật hồ sơ học viên thành công!', 'success');
  };

  const handleResetData = () => {
    try {
      localStorage.removeItem('yuyan_study_state_v1');
      showToast('Đã xóa dữ liệu lưu tạm, khôi phục cài đặt mặc định thành công!', 'success');
    } catch {
      showToast('Không thể xóa bộ nhớ cục bộ', 'error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 sm:p-8 shadow-2xs space-y-3 card-motion light-beam-shimmer">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-soft text-primary flex items-center justify-center font-bold shadow-2xs">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">Cài đặt ứng dụng</h1>
            <p className="text-xs text-text-secondary mt-0.5">
              Tùy chỉnh thông tin học viên, chủ đề giao diện và dữ liệu học tập
            </p>
          </div>
        </div>
      </div>

      {/* Student Profile Section */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-2xs space-y-5 card-motion">
        <div className="flex items-center justify-between pb-3 border-b border-divider-line">
          <div className="flex items-center gap-2.5">
            <User className="w-5 h-5 text-primary" />
            <h2 className="text-sm sm:text-base font-bold text-text-primary">Hồ sơ học viên (Student Profile)</h2>
          </div>
          {!isEditingProfile && (
            <button
              onClick={handleStartEdit}
              className="px-3 py-1.5 text-xs font-semibold bg-primary-soft text-primary hover:bg-primary hover:text-white rounded-lg flex items-center gap-1.5 transition-colors btn-motion"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Chỉnh sửa</span>
            </button>
          )}
        </div>

        {isEditingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            {/* Avatar Selection */}
            <div>
              <label className="block text-xs font-semibold text-text-secondary mb-2">
                Ảnh đại diện (Avatar)
              </label>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                {PRESET_AVATARS.map((p) => {
                  const isSelected = editForm.avatar === p.url;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, avatar: p.url })}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary-soft text-primary font-bold shadow-2xs'
                          : 'border-border-subtle bg-surface hover:bg-surface-secondary text-text-secondary'
                      }`}
                    >
                      {p.url ? (
                        <img src={p.url} alt={p.label} className="w-5 h-5 rounded-full object-cover" />
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-bold">
                          AA
                        </div>
                      )}
                      <span>{p.label}</span>
                    </button>
                  );
                })}
              </div>
              <input
                type="url"
                value={editForm.avatar}
                onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                placeholder="Hoặc nhập URL hình ảnh đại diện tùy chỉnh..."
                className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-input-bg border border-border-subtle focus:border-primary text-text-primary focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Tên hiển thị <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  placeholder="Nhập họ và tên..."
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-input-bg border ${
                    validationErrors.displayName ? 'border-red-500 focus:ring-red-500' : 'border-border-subtle focus:border-primary'
                  } text-text-primary focus:outline-none transition-all`}
                />
                {validationErrors.displayName && (
                  <p className="text-[11px] text-red-500 mt-1">{validationErrors.displayName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Email học viên <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={editForm.schoolEmail}
                  onChange={(e) => setEditForm({ ...editForm, schoolEmail: e.target.value })}
                  placeholder="ten@example.com"
                  className={`w-full px-3.5 py-2.5 rounded-xl text-sm bg-input-bg border ${
                    validationErrors.schoolEmail ? 'border-red-500 focus:ring-red-500' : 'border-border-subtle focus:border-primary'
                  } text-text-primary focus:outline-none transition-all`}
                />
                {validationErrors.schoolEmail && (
                  <p className="text-[11px] text-red-500 mt-1">{validationErrors.schoolEmail}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Mục tiêu cấp độ HSK
                </label>
                <select
                  value={editForm.targetHskLevel}
                  onChange={(e) => setEditForm({ ...editForm, targetHskLevel: parseInt(e.target.value, 10) })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-input-bg border border-border-subtle text-text-primary focus:outline-none focus:border-primary transition-all"
                >
                  {[1, 2, 3, 4, 5, 6].map((lvl) => (
                    <option key={lvl} value={lvl}>
                      HSK {lvl} {lvl <= 2 ? '(Sơ cấp)' : lvl <= 4 ? '(Trung cấp)' : '(Cao cấp)'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Mục tiêu học mỗi ngày (Phút)
                </label>
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={editForm.dailyGoalMinutes}
                  onChange={(e) => setEditForm({ ...editForm, dailyGoalMinutes: parseInt(e.target.value, 10) || 30 })}
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-input-bg border border-border-subtle text-text-primary focus:outline-none focus:border-primary transition-all"
                />
                {validationErrors.dailyGoalMinutes && (
                  <p className="text-[11px] text-red-500 mt-1">{validationErrors.dailyGoalMinutes}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-divider-line">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2 text-xs font-semibold bg-surface-secondary text-text-secondary hover:text-text-primary rounded-xl flex items-center gap-1.5 transition-colors btn-motion"
              >
                <X className="w-3.5 h-3.5" />
                <span>Hủy bỏ</span>
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold bg-primary text-white hover:bg-primary-hover rounded-xl flex items-center gap-1.5 shadow-xs transition-colors btn-motion"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Lưu thay đổi</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-secondary/70 border border-border-subtle">
            <div className="flex items-center gap-4">
              <LearnerAvatar profile={profile} size="xl" />
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-text-primary">{profile.displayName}</h3>
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary-soft text-primary font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Đã xác thực
                  </span>
                </div>
                <p className="text-xs text-text-muted">{profile.schoolEmail}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5 text-text-secondary bg-surface px-3 py-1.5 rounded-lg border border-border-subtle">
                <Target className="w-3.5 h-3.5 text-primary" />
                <span>HSK {profile.targetHskLevel}</span>
              </div>
              <div className="flex items-center gap-1.5 text-text-secondary bg-surface px-3 py-1.5 rounded-lg border border-border-subtle">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>{profile.dailyGoalMinutes}p/ngày</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-600 bg-surface px-3 py-1.5 rounded-lg border border-border-subtle">
                <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{profile.studyStreakDays} ngày</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Theme Selection Section */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-2xs space-y-4 card-motion">
        <div className="flex items-center justify-between pb-2 border-b border-divider-line">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-text-primary">Chủ đề giao diện (Theme)</h2>
            <p className="text-xs text-text-muted">Đang áp dụng: {resolvedTheme === 'dark' ? 'Giao diện Tối (Navy Calibrated)' : 'Giao diện Sáng (Light Blue)'}</p>
          </div>
        </div>

        <div className="space-y-3">
          {themeOptions.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => {
                  setTheme(opt.id);
                  showToast(`Đã chuyển sang: ${opt.label}`, 'info');
                }}
                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between btn-motion ${
                  isSelected
                    ? 'bg-primary-soft border-primary text-primary shadow-2xs'
                    : 'bg-surface hover:bg-surface-secondary border-border-subtle text-text-primary'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isSelected ? 'bg-primary text-white' : 'bg-surface-secondary text-text-secondary'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{opt.label}</p>
                    <p className="text-xs text-text-muted">{opt.desc}</p>
                  </div>
                </div>

                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-primary' : 'border-border-subtle'}`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-primary" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Reset & Storage Section */}
      <div className="bg-surface rounded-2xl border border-border-subtle p-6 shadow-2xs space-y-4 card-motion">
        <h2 className="text-sm sm:text-base font-bold text-text-primary">Dữ liệu & Bộ nhớ</h2>
        <div className="flex items-center justify-between p-3.5 bg-surface-secondary/70 rounded-xl border border-border-subtle text-xs">
          <div>
            <p className="font-bold text-text-primary">Khôi phục trạng thái bài học</p>
            <p className="text-text-muted mt-0.5">Xóa lịch sử bài học gần nhất để bắt đầu lại từ HSK 1 Bài 1</p>
          </div>
          <button
            onClick={handleResetData}
            className="px-3 py-1.5 bg-surface border border-border-subtle hover:bg-red-500/10 hover:text-red-500 rounded-lg font-semibold flex items-center gap-1.5 transition-colors btn-motion"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục</span>
          </button>
        </div>
      </div>
    </div>
  );
};
