import React from 'react';
import { ArrowRight } from 'lucide-react';

interface BeginnerRoadmapProps {
  onNavigateTab: (tab: string) => void;
  className?: string;
}

export const BeginnerRoadmap: React.FC<BeginnerRoadmapProps> = ({
  onNavigateTab,
  className = '',
}) => {
  const steps = [
    {
      step: 1,
      title: 'Tổng quan hệ thống Ngữ âm & Pinyin',
      desc: 'Hiểu cấu tạo âm tiết tiếng Trung = Thanh mẫu + Vận mẫu + Thanh điệu.',
      tab: 'dashboard',
      badge: 'Nhập môn',
      color: 'bg-blue-500',
    },
    {
      step: 2,
      title: '21 Thanh mẫu (声母) & Khẩu hình 3 bước',
      desc: 'Luyện 21 phụ âm đầu với sơ đồ giải phẫu vòm họng và cơ chế bật hơi.',
      tab: 'initials',
      badge: 'Thanh mẫu',
      color: 'bg-indigo-500',
    },
    {
      step: 3,
      title: '6 Vận mẫu đơn căn bản (a, o, e, i, u, ü)',
      desc: 'Luyện 6 nguyên âm chuẩn tắc làm nền tảng cho toàn bộ hệ thống vần.',
      tab: 'finals',
      badge: 'Vận mẫu đơn',
      color: 'bg-emerald-500',
    },
    {
      step: 4,
      title: '13 Vận mẫu kép & 16 Vận mẫu mũi (-n, -ng)',
      desc: 'Nắm vững kỹ thuật trượt âm và cơ chế chặn khí mũi trước vs mũi sau.',
      tab: 'finals',
      badge: 'Vận mẫu kép & mũi',
      color: 'bg-teal-500',
    },
    {
      step: 5,
      title: 'Vận mẫu đặc biệt er & Âm uốn lưỡi Nhi hóa',
      desc: 'Kỹ thuật uốn cong đầu lưỡi lên vòm họng ngạc cứng tạo âm sắc Bắc Kinh.',
      tab: 'finals',
      badge: 'Uốn lưỡi er',
      color: 'bg-amber-500',
    },
    {
      step: 6,
      title: '4 Thanh điệu & Thang cao độ Chao (55, 35, 214, 51)',
      desc: 'Luyện ngữ điệu, cao độ và thanh nhẹ tránh bị lai giọng tiếng Việt.',
      tab: 'tones',
      badge: 'Thanh điệu',
      color: 'bg-rose-500',
    },
    {
      step: 7,
      title: '3 Quy tắc biến điệu bắt buộc (3+3, Yī, Bù)',
      desc: 'Bí quyết biến đổi thanh điệu tự nhiên như người bản xứ khi giao tiếp.',
      tab: 'tones',
      badge: 'Biến điệu',
      color: 'bg-purple-500',
    },
    {
      step: 8,
      title: 'Quy tắc chính tả Pinyin & Phân biệt cặp âm',
      desc: 'Quy tắc bỏ 2 chấm của ü, y/w, viết tắt iu/ui/un và các cặp âm dễ nhầm.',
      tab: 'rules',
      badge: 'Chính tả',
      color: 'bg-cyan-500',
    },
    {
      step: 9,
      title: 'Đánh giá năng lực 30 câu (Nghe, Nói, Đọc, Viết)',
      desc: 'Bài kiểm tra chuẩn hóa 4 kỹ năng với phân tích phổ điểm chi tiết.',
      tab: 'assessment',
      badge: 'Kiểm tra 30 câu',
      color: 'bg-amber-600',
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            Lộ Trình Học Ngữ Âm 9 Bước (Phonetics Roadmap)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Lộ trình học bài bản được thiết kế tối ưu dành riêng cho người Việt Nam bắt đầu từ số 0.
          </p>
        </div>
      </div>

      {/* Stepper Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs relative">
        <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
          {steps.map((st) => (
            <div key={st.step} className="relative flex items-start gap-4 sm:gap-6 group">
              {/* Step circle */}
              <div
                className={`relative z-10 w-12 h-12 rounded-2xl ${st.color} text-white font-black text-base flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform`}
              >
                {st.step}
              </div>

              {/* Step Card Content */}
              <div className="flex-1 bg-slate-50 dark:bg-slate-800/60 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 group-hover:bg-blue-50/30 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                      {st.badge}
                    </span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {st.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {st.desc}
                  </p>
                </div>

                <button
                  onClick={() => onNavigateTab(st.tab)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white shadow-2xs transition-all flex-shrink-0"
                >
                  <span>Học bước này</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
