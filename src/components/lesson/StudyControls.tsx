import React from 'react';
import { Eye, EyeOff, LayoutTemplate, List } from 'lucide-react';

export type StudyMode = 'learn' | 'self' | 'test';
export type FontSize = 'sm' | 'md' | 'lg';
export type ReadingLayout = 'frame' | 'list';

interface StudyControlsProps {
  mode: StudyMode;
  onModeChange: (mode: StudyMode) => void;
  showHanzi: boolean;
  onToggleHanzi: () => void;
  showPinyin: boolean;
  onTogglePinyin: () => void;
  showVietnamese: boolean;
  onToggleVietnamese: () => void;
  fontSize: FontSize;
  onFontSizeChange: (size: FontSize) => void;
  layoutMode?: ReadingLayout;
  onLayoutModeChange?: (layout: ReadingLayout) => void;
}

export const StudyControls: React.FC<StudyControlsProps> = ({
  mode,
  onModeChange,
  showHanzi,
  onToggleHanzi,
  showPinyin,
  onTogglePinyin,
  showVietnamese,
  onToggleVietnamese,
  fontSize,
  onFontSizeChange,
  layoutMode = 'list',
  onLayoutModeChange,
}) => {
  return (
    <div className="px-4 sm:px-6 py-3 bg-primary-ultra-soft/60 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3 select-none">
      {/* Modes: Full / Self-reading / Test */}
      <div className="flex items-center p-1 bg-surface rounded-xl border border-border-subtle shadow-2xs">
        <button
          data-testid="mode-learn"
          onClick={() => onModeChange('learn')}
          className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            mode === 'learn'
              ? 'bg-primary text-white shadow-2xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          HỌC (Đầy đủ)
        </button>
        <button
          data-testid="mode-self"
          onClick={() => onModeChange('self')}
          className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            mode === 'self'
              ? 'bg-primary text-white shadow-2xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          TỰ ĐỌC
        </button>
        <button
          data-testid="mode-test"
          onClick={() => onModeChange('test')}
          className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            mode === 'test'
              ? 'bg-primary text-white shadow-2xs'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          KIỂM TRA
        </button>
      </div>

      {/* Layout Mode Switcher (Locked Frame vs Full List) */}
      {onLayoutModeChange && (
        <div className="flex items-center p-1 bg-surface rounded-xl border border-border-subtle shadow-2xs">
          <button
            data-testid="layout-frame"
            onClick={() => onLayoutModeChange('frame')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              layoutMode === 'frame'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Chế độ đọc từng câu (Khung cố định)"
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Khung từng câu</span>
          </button>
          <button
            data-testid="layout-list"
            onClick={() => onLayoutModeChange('list')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
              layoutMode === 'list'
                ? 'bg-primary text-white shadow-2xs'
                : 'text-text-secondary hover:text-text-primary'
            }`}
            title="Chế độ xem toàn bài (Danh sách)"
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Toàn bài</span>
          </button>
        </div>
      )}

      {/* Visibility Toggles (Hanzi / Pinyin / Vietnamese) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        <button
          data-testid="toggle-hanzi"
          data-active={showHanzi ? 'true' : 'false'}
          onClick={onToggleHanzi}
          className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
            showHanzi
              ? 'border-primary/30 bg-primary-soft text-primary'
              : 'border-border-subtle bg-surface text-text-muted hover:text-text-secondary'
          }`}
          title="Bật/Tắt hiển thị Hán tự"
        >
          {showHanzi ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Hán tự</span>
        </button>

        <button
          data-testid="toggle-pinyin"
          data-active={showPinyin ? 'true' : 'false'}
          onClick={onTogglePinyin}
          className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
            showPinyin
              ? 'border-primary/30 bg-primary-soft text-primary'
              : 'border-border-subtle bg-surface text-text-muted hover:text-text-secondary'
          }`}
          title="Bật/Tắt hiển thị Pinyin"
        >
          {showPinyin ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Pinyin</span>
        </button>

        <button
          data-testid="toggle-vietnamese"
          data-active={showVietnamese ? 'true' : 'false'}
          onClick={onToggleVietnamese}
          className={`inline-flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg border text-xs font-medium transition-colors ${
            showVietnamese
              ? 'border-primary/30 bg-primary-soft text-primary'
              : 'border-border-subtle bg-surface text-text-muted hover:text-text-secondary'
          }`}
          title="Bật/Tắt hiển thị Tiếng Việt"
        >
          {showVietnamese ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          <span>Tiếng Việt</span>
        </button>
      </div>

      {/* Font Size Scale Controls */}
      <div className="flex items-center gap-1 bg-surface px-2 py-1 rounded-xl border border-border-subtle shadow-2xs">
        <span className="text-xs text-text-muted px-1 hidden sm:inline">Cỡ chữ:</span>
        <button
          onClick={() => onFontSizeChange('sm')}
          className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-colors ${
            fontSize === 'sm' ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-surface-secondary'
          }`}
          title="Cỡ chữ nhỏ"
        >
          A-
        </button>
        <button
          onClick={() => onFontSizeChange('md')}
          className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-colors ${
            fontSize === 'md' ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-surface-secondary'
          }`}
          title="Cỡ chữ tiêu chuẩn"
        >
          A
        </button>
        <button
          onClick={() => onFontSizeChange('lg')}
          className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs transition-colors ${
            fontSize === 'lg' ? 'bg-primary-soft text-primary' : 'text-text-secondary hover:bg-surface-secondary'
          }`}
          title="Cỡ chữ lớn"
        >
          A+
        </button>
      </div>
    </div>
  );
};
