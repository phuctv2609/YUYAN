import React from 'react';
import { Volume2 } from 'lucide-react';
import { audioManager } from '../../../../services/audio/index';

interface NasalAirflowDiagramProps {
  className?: string;
}

export const NasalAirflowDiagram: React.FC<NasalAirflowDiagramProps> = ({ className = '' }) => {
  return (
    <div className={`w-full bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs ${className}`}>
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-2.5">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span>
            Phân biệt âm đuôi mũi: -n (Mũi trước) vs -ng (Mũi sau)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Cả hai đều thoát khí qua mũi, nhưng điểm chặn luồng khí trong miệng hoàn toàn khác nhau.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Column 1: -n (Mũi trước) */}
        <div className="flex flex-col items-center bg-blue-50/50 dark:bg-blue-950/20 rounded-xl p-4 border border-blue-200/60 dark:border-blue-900/40">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">-n</span>
            <button
              onClick={() => audioManager.playText('南')}
              className="p-1.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-300 hover:scale-110 transition-transform"
              title="Nghe mẫu: nán (南)"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
              Mũi trước [n]
            </span>
          </div>

          {/* SVG Diagram -n (Alveolar Contact + Nasal Flow) */}
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
              {/* Lowered Velum (Nasal port open) */}
              <path
                d="M 95,56 C 98,66 100,78 102,90 C 101,94 97,94 95,88 C 93,78 91,66 88,56 Z"
                fill="#F87171"
                stroke="#DC2626"
                strokeWidth="1"
              />
              {/* Tongue: Apex touching upper gum ridge (alveolar stop) */}
              <path
                d="M 90,140 C 95,125 105,110 120,95 C 132,84 142,72 146,65 C 148,62 143,60 138,64 C 125,75 100,110 75,140 Z"
                fill="#EF4444"
                stroke="#B91C1C"
                strokeWidth="1.5"
              />
              {/* Nasal Airflow Arrow (Flows out nose) */}
              <path
                d="M 75,125 Q 82,85 90,62 T 125,42 T 155,54 T 172,62"
                fill="none"
                stroke="#0284C7"
                strokeWidth="3.5"
                strokeDasharray="4,2"
              />
              {/* Airflow Blocked cross at lips */}
              <path d="M 148,78 L 158,88 M 158,78 L 148,88" stroke="#DC2626" strokeWidth="2.5" />
            </svg>
          </div>

          <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 w-full mt-2">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <strong>Đầu lưỡi:</strong> Chạm chắc vào chân răng trên / lợi trên.
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <strong>Luồng khí:</strong> Bị chặn ở miệng, thoát 100% qua khoang mũi.
            </li>
            <li className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <strong>Ví dụ:</strong> nán 南 (phương nam), mǎn 满 (đầy).
            </li>
          </ul>
        </div>

        {/* Column 2: -ng (Mũi sau) */}
        <div className="flex flex-col items-center bg-emerald-50/50 dark:bg-emerald-950/20 rounded-xl p-4 border border-emerald-200/60 dark:border-emerald-900/40">
          <div className="flex items-center gap-2.5 mb-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">-ng</span>
            <button
              onClick={() => audioManager.playText('港')}
              className="p-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-300 hover:scale-110 transition-transform"
              title="Nghe mẫu: gǎng (港)"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300">
              Mũi sau [ŋ]
            </span>
          </div>

          {/* SVG Diagram -ng (Velar Contact + Nasal Flow) */}
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
              {/* Velum lowered */}
              <path
                d="M 95,56 C 98,66 100,78 102,88 C 101,92 97,92 95,86 C 93,76 91,66 88,56 Z"
                fill="#F87171"
                stroke="#DC2626"
                strokeWidth="1"
              />
              {/* Tongue: Back of tongue arched touching soft palate; tip lowered free! */}
              <path
                d="M 90,140 C 95,120 100,90 110,68 C 115,62 125,64 122,76 C 115,98 105,125 75,140 Z"
                fill="#EF4444"
                stroke="#B91C1C"
                strokeWidth="1.5"
              />
              {/* Tongue tip flat on bottom */}
              <path
                d="M 115,115 C 125,110 135,110 142,114 C 138,120 125,122 115,115 Z"
                fill="#EF4444"
              />
              {/* Nasal Airflow Arrow */}
              <path
                d="M 75,125 Q 82,85 90,62 T 125,42 T 155,54 T 172,62"
                fill="none"
                stroke="#10B981"
                strokeWidth="3.5"
                strokeDasharray="4,2"
              />
              {/* Airflow Blocked inside pharynx */}
              <path d="M 106,66 L 116,76 M 116,66 L 106,76" stroke="#DC2626" strokeWidth="2.5" />
            </svg>
          </div>

          <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-1.5 w-full mt-2">
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <strong>Cuống lưỡi:</strong> Nâng cao áp sát vòm mềm (ngạc mềm) ở cuống họng.
            </li>
            <li className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <strong>Đầu lưỡi:</strong> Nằm tự do dưới đáy miệng, không chạm răng.
            </li>
            <li className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <strong>Ví dụ:</strong> gǎng 港 (cảng), máng 忙 (bận).
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
