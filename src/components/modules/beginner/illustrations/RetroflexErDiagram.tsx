import React from 'react';
import { Volume2 } from 'lucide-react';
import { audioManager } from '../../../../services/audio/index';

interface RetroflexErDiagramProps {
  className?: string;
}

export const RetroflexErDiagram: React.FC<RetroflexErDiagramProps> = ({ className = '' }) => {
  return (
    <div className={`w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
            Minh họa Vận mẫu đặc biệt: er (Âm uốn lưỡi Nhi hóa)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Không ghép với bất kỳ thanh mẫu nào; là âm tiết độc lập hoặc kết hợp tạo âm nhi hóa (儿化音).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Left: SVG Retroflex Curled Tongue Vocal Tract */}
        <div className="flex flex-col items-center bg-amber-50/50 dark:bg-amber-950/20 rounded-xl p-4 border border-amber-200/60 dark:border-amber-900/40">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-3xl font-black text-amber-600 dark:text-amber-400 font-mono">er</span>
            <button
              onClick={() => audioManager.playText('儿')}
              className="p-2 rounded-full bg-amber-500 text-white hover:scale-105 active:scale-95 shadow-xs transition-transform"
              title="Phát âm: er (儿)"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
              [a] / [ɚ]
            </span>
          </div>

          <div className="w-56 h-44 relative my-2">
            <svg viewBox="0 0 200 160" className="w-full h-full drop-shadow-xs">
              {/* Head Profile */}
              <path
                d="M 100,10 C 140,10 165,30 170,50 C 172,55 168,62 172,67 C 175,70 182,74 175,78 C 170,80 166,82 164,88 C 162,92 166,100 162,104 C 158,108 162,118 158,128 C 154,135 145,142 140,155 L 70,155 C 65,125 60,80 65,50 C 70,20 90,10 100,10 Z"
                fill="#FED7AA"
                stroke="#EA580C"
                strokeWidth="1.2"
              />
              {/* Cavity */}
              <path
                d="M 100,32 C 125,32 145,36 158,54 C 162,60 155,64 148,64 C 130,62 115,56 95,56 C 80,56 75,80 75,145 L 68,145 C 66,70 70,40 100,32 Z"
                fill="#4A0404"
                opacity="0.85"
              />
              {/* Velum raised (oral sound) */}
              <path
                d="M 95,56 C 102,62 112,68 120,74 C 122,76 120,78 118,76 C 108,70 100,64 90,56 Z"
                fill="#F87171"
                stroke="#DC2626"
                strokeWidth="1"
              />
              {/* Tongue: Apex curled back upwards towards hard palate */}
              <path
                d="M 85,145 C 92,130 102,112 118,100 C 128,92 138,82 134,70 C 130,60 120,64 116,74 C 108,94 92,110 75,140 Z"
                fill="#EF4444"
                stroke="#B91C1C"
                strokeWidth="1.5"
              />
              {/* Curled arrow indicating tongue retraction and curling */}
              <path
                d="M 136,86 C 142,76 136,68 125,66"
                fill="none"
                stroke="#D97706"
                strokeWidth="2.5"
                strokeDasharray="3,2"
              />
              {/* Resonant open oral airflow */}
              <path
                d="M 125,95 Q 140,88 160,86 L 178,86"
                fill="none"
                stroke="#F59E0B"
                strokeWidth="3"
              />
            </svg>
          </div>

          <div className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-100/60 dark:bg-amber-950/40 px-2.5 py-1 rounded-full">
            Đầu lưỡi uốn ngược lên phía vòm họng ngạc cứng
          </div>
        </div>

        {/* Right: Key properties and examples */}
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Đặc điểm phát âm:
            </h4>
            <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0"></span>
                <span><strong>Lưỡi cuộn nhẹ:</strong> Khi bắt đầu phát âm âm "e" (ơ), đầu lưỡi ngay lập tức uốn cong ngược lên trên về phía ngạc cứng.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0"></span>
                <span><strong>Phát âm ngắn:</strong> Âm thanh dứt khoát, gọn gàng, luồng hơi không bị tắc nghẽn hoàn toàn.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1 flex-shrink-0"></span>
                <span><strong>Âm tiết độc lập:</strong> Tự mình tạo thành âm tiết hoàn chỉnh hoặc đứng sau từ để tạo hậu tố nhi hóa (儿化音).</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Từ ví dụ tiêu biểu:
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => audioManager.playText('儿童')}
                className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-amber-50 dark:hover:bg-slate-750 transition-colors group text-left shadow-2xs"
              >
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">ér 儿</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">con, trẻ em</div>
                </div>
                <Volume2 className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={() => audioManager.playText('花儿')}
                className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-amber-50 dark:hover:bg-slate-750 transition-colors group text-left shadow-2xs"
              >
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">huār 花儿</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">bông hoa (nhi hóa)</div>
                </div>
                <Volume2 className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={() => audioManager.playText('二')}
                className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-amber-50 dark:hover:bg-slate-750 transition-colors group text-left shadow-2xs"
              >
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">èr 二</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">số hai</div>
                </div>
                <Volume2 className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              </button>

              <button
                onClick={() => audioManager.playText('玩儿')}
                className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-amber-50 dark:hover:bg-slate-750 transition-colors group text-left shadow-2xs"
              >
                <div>
                  <div className="text-base font-bold text-slate-900 dark:text-white">wánr 玩儿</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">chơi đùa</div>
                </div>
                <Volume2 className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
