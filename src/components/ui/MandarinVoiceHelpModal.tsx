import React, { useState, useEffect } from 'react';
import { VolumeX, X, Monitor, Smartphone, Apple, CheckCircle2, RefreshCw } from 'lucide-react';
import { audioStateStore } from '../../services/audio/audioState';
import { browserTTSProvider } from '../../services/audio/providers/browserTTSProvider';

export const MandarinVoiceHelpModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'windows' | 'mac' | 'mobile'>('windows');
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [hasChineseVoice, setHasChineseVoice] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = audioStateStore.subscribe((event) => {
      if (event.state === 'error' && event.error?.code === 'AUDIO_003') {
        setIsOpen(true);
      }
    });
    return unsubscribe;
  }, []);

  const handleCheckVoices = async () => {
    setIsChecking(true);
    const available = await browserTTSProvider.isAvailable();
    setHasChineseVoice(available);
    setIsChecking(false);
    if (available) {
      setTimeout(() => {
        setIsOpen(false);
      }, 1200);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-surface border border-border-subtle rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-5 card-motion">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <VolumeX className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Chưa tìm thấy giọng đọc tiếng Trung</h3>
              <p className="text-xs text-text-secondary mt-0.5">
                Thiết bị cần gói giọng đọc tiếng Trung (zh-CN) để phát âm chuẩn xác
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-1.5 rounded-xl hover:bg-surface-secondary text-text-muted hover:text-text-primary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Operating System Selector */}
        <div className="flex p-1 bg-surface-secondary rounded-xl gap-1">
          <button
            onClick={() => setActiveTab('windows')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'windows' ? 'bg-surface text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Windows</span>
          </button>
          <button
            onClick={() => setActiveTab('mac')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'mac' ? 'bg-surface text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Apple className="w-3.5 h-3.5" />
            <span>macOS / iOS</span>
          </button>
          <button
            onClick={() => setActiveTab('mobile')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'mobile' ? 'bg-surface text-primary shadow-xs' : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android / Chrome</span>
          </button>
        </div>

        {/* Guide Content */}
        <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-subtle text-xs space-y-2.5 text-text-primary leading-relaxed">
          {activeTab === 'windows' && (
            <ol className="list-decimal list-inside space-y-2 text-text-secondary">
              <li>Mở <strong className="text-text-primary">Cài đặt (Settings)</strong> trên Windows (bấm phím Windows + I).</li>
              <li>Chọn mục <strong className="text-text-primary">Time & Language (Thời gian & Ngôn ngữ)</strong> → <strong className="text-text-primary">Speech (Giọng nói)</strong>.</li>
              <li>Tại mục <strong className="text-text-primary">Manage voices</strong>, bấm <strong className="text-text-primary">Add voices (Thêm giọng nói)</strong>.</li>
              <li>Tìm kiếm <strong className="text-text-primary">"Chinese (Simplified, China)"</strong> hoặc <strong className="text-text-primary">"中文（简体）"</strong> rồi bấm <strong className="text-text-primary">Add</strong>.</li>
              <li>Sau khi tải xong, quay lại YUYAN và bấm nút "Kiểm tra lại giọng đọc" bên dưới.</li>
            </ol>
          )}

          {activeTab === 'mac' && (
            <ol className="list-decimal list-inside space-y-2 text-text-secondary">
              <li>Vào <strong className="text-text-primary">System Settings (Cài đặt hệ thống)</strong> trên Mac.</li>
              <li>Chọn <strong className="text-text-primary">Accessibility (Trợ năng)</strong> → <strong className="text-text-primary">Spoken Content (Nội dung đọc)</strong>.</li>
              <li>Ở dòng <strong className="text-text-primary">System Voice</strong>, chọn <strong className="text-text-primary">Manage Voices...</strong></li>
              <li>Tìm mục <strong className="text-text-primary">Chinese (China mainland)</strong> và tải giọng đọc <strong className="text-text-primary">Ting-Ting</strong> hoặc <strong className="text-text-primary">Mei-Jia</strong>.</li>
            </ol>
          )}

          {activeTab === 'mobile' && (
            <ol className="list-decimal list-inside space-y-2 text-text-secondary">
              <li>Mở <strong className="text-text-primary">Cài đặt (Settings)</strong> điện thoại → <strong className="text-text-primary">Quản lý chung / Trợ năng</strong>.</li>
              <li>Chọn <strong className="text-text-primary">Chuyển văn bản thành giọng nói (Text-to-Speech)</strong>.</li>
              <li>Bấm biểu tượng cài đặt cạnh <strong className="text-text-primary">Dịch vụ nhận dạng giọng nói của Google</strong>.</li>
              <li>Chọn <strong className="text-text-primary">Cài đặt dữ liệu thoại</strong> → Thêm <strong className="text-text-primary">Tiếng Trung (Trung Quốc)</strong>.</li>
            </ol>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between gap-3 pt-2">
          {hasChineseVoice ? (
            <div className="flex items-center gap-1.5 text-xs text-status-success font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Đã tìm thấy giọng đọc tiếng Trung!</span>
            </div>
          ) : (
            <span className="text-2xs text-text-muted">
              YUYAN cam kết không bao giờ đọc chữ Hán bằng giọng tiếng Anh/Việt.
            </span>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 rounded-xl bg-surface-secondary text-text-secondary hover:text-text-primary text-xs font-semibold transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={handleCheckVoices}
              disabled={isChecking}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold shadow-xs hover:bg-primary-hover transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>Kiểm tra lại</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
