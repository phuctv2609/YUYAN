import React from 'react';
import { Volume2 } from 'lucide-react';
import { audioManager } from '../../../../services/audio/index';

interface ToneContourDiagramProps {
  interactive?: boolean;
  activeToneIndex?: number;
  onSelectTone?: (toneIndex: number) => void;
  className?: string;
}

export const ToneContourDiagram: React.FC<ToneContourDiagramProps> = ({
  interactive: _interactive = true,
  activeToneIndex,
  onSelectTone,
  className = '',
}) => {
  const tones = [
    {
      tone: 1,
      symbol: 'ā',
      name: 'Thanh 1 (Âm Bình)',
      contour: '55',
      color: '#3B82F6',
      bgLight: 'bg-blue-50 dark:bg-blue-950/40',
      border: 'border-blue-200 dark:border-blue-800',
      textAccent: 'text-blue-600 dark:text-blue-400',
      description: 'Cao và bằng',
      hanzi: '妈',
      pinyin: 'mā',
      meaning: 'mẹ',
      audioText: '妈',
      avatarPath: (
        // Calm pleasant smiling avatar
        <g>
          <circle cx="50" cy="50" r="32" fill="#FED7AA" stroke="#F97316" strokeWidth="1.5" />
          {/* Hair */}
          <path d="M 22,46 C 25,25 75,25 78,46 C 68,30 32,30 22,46 Z" fill="#374151" />
          {/* Eyes smiling calm */}
          <path d="M 36,46 Q 42,42 48,46" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
          <path d="M 52,46 Q 58,42 64,46" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
          {/* Cheeks */}
          <circle cx="34" cy="54" r="4" fill="#F87171" opacity="0.4" />
          <circle cx="66" cy="54" r="4" fill="#F87171" opacity="0.4" />
          {/* Gentle smile */}
          <path d="M 42,60 Q 50,66 58,60" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
        </g>
      ),
      pitchCurve: 'M 15,25 L 85,25', // Level at 5 (top)
    },
    {
      tone: 2,
      symbol: 'á',
      name: 'Thanh 2 (Dương Bình)',
      contour: '35',
      color: '#10B981',
      bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800',
      textAccent: 'text-emerald-600 dark:text-emerald-400',
      description: 'Tăng dần',
      hanzi: '麻',
      pinyin: 'má',
      meaning: 'cây gai',
      audioText: '麻',
      avatarPath: (
        // Inquiring avatar with raised eyebrow
        <g>
          <circle cx="50" cy="50" r="32" fill="#FED7AA" stroke="#10B981" strokeWidth="1.5" />
          <path d="M 22,46 C 25,25 75,25 78,46 C 68,30 32,30 22,46 Z" fill="#374151" />
          {/* Raised eyebrow right */}
          <path d="M 36,42 Q 42,40 48,44" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
          <path d="M 52,38 Q 60,34 66,40" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
          {/* Eyes wondering */}
          <circle cx="42" cy="48" r="2.5" fill="#1F2937" />
          <circle cx="60" cy="48" r="3" fill="#1F2937" />
          {/* Mouth questioning */}
          <ellipse cx="51" cy="62" rx="4" ry="2.5" fill="#991B1B" />
        </g>
      ),
      pitchCurve: 'M 15,55 Q 50,45 85,25', // Rises from 3 to 5
    },
    {
      tone: 3,
      symbol: 'ǎ',
      name: 'Thanh 3 (Thượng Thanh)',
      contour: '214',
      color: '#EF4444',
      bgLight: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-800',
      textAccent: 'text-rose-600 dark:text-rose-400',
      description: 'Hạ rồi lên',
      hanzi: '马',
      pinyin: 'mǎ',
      meaning: 'con ngựa',
      audioText: '马',
      avatarPath: (
        // Surprised / wide-eyed avatar
        <g>
          <circle cx="50" cy="50" r="32" fill="#FED7AA" stroke="#EF4444" strokeWidth="1.5" />
          <path d="M 22,46 C 25,25 75,25 78,46 C 68,30 32,30 22,46 Z" fill="#374151" />
          {/* High arched brows */}
          <path d="M 34,38 Q 42,34 48,38" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
          <path d="M 52,38 Q 58,34 66,38" fill="none" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
          {/* Big eyes */}
          <circle cx="41" cy="46" r="4" fill="#1F2937" />
          <circle cx="42" cy="45" r="1.5" fill="#FFFFFF" />
          <circle cx="59" cy="46" r="4" fill="#1F2937" />
          <circle cx="60" cy="45" r="1.5" fill="#FFFFFF" />
          {/* Open surprise mouth */}
          <circle cx="50" cy="62" r="5" fill="#991B1B" />
        </g>
      ),
      pitchCurve: 'M 15,65 Q 40,85 55,85 T 85,38', // Drops from 2 to 1 then rises to 4
    },
    {
      tone: 4,
      symbol: 'à',
      name: 'Thanh 4 (Khứ Thanh)',
      contour: '51',
      color: '#F59E0B',
      bgLight: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      textAccent: 'text-amber-600 dark:text-amber-400',
      description: 'Giảm mạnh',
      hanzi: '骂',
      pinyin: 'mà',
      meaning: 'mắng',
      audioText: '骂',
      avatarPath: (
        // Decisive / firm avatar
        <g>
          <circle cx="50" cy="50" r="32" fill="#FED7AA" stroke="#F59E0B" strokeWidth="1.5" />
          <path d="M 22,46 C 25,25 75,25 78,46 C 68,30 32,30 22,46 Z" fill="#374151" />
          {/* Resolute down-angled brows */}
          <path d="M 35,40 L 47,44" fill="none" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 65,40 L 53,44" fill="none" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          {/* Focused eyes */}
          <circle cx="42" cy="48" r="3" fill="#1F2937" />
          <circle cx="58" cy="48" r="3" fill="#1F2937" />
          {/* Firm dứt khoát mouth */}
          <path d="M 43,62 L 57,62" fill="none" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ),
      pitchCurve: 'M 15,25 Q 45,50 85,85', // Drops steeply from 5 to 1
    },
  ];

  const handlePlayTone = (e: React.MouseEvent, text: string) => {
    e.stopPropagation();
    audioManager.playText(text);
  };

  return (
    <div className={`w-full ${className}`}>
      {/* 4 Tone Cards Side by Side (Exact match to Blueprint Section 6) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {tones.map((t, idx) => {
          const isSelected = activeToneIndex === idx;
          return (
            <div
              key={t.tone}
              onClick={() => onSelectTone?.(idx)}
              className={`flex flex-col items-center rounded-2xl p-4 border transition-all duration-200 cursor-pointer shadow-xs ${t.bgLight} ${t.border} ${
                isSelected
                  ? 'ring-2 ring-primary-500 scale-[1.02] shadow-md'
                  : 'hover:scale-[1.01] hover:shadow-sm'
              }`}
            >
              {/* Header: Thanh 1 / symbol */}
              <div className="text-center mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Thanh {t.tone}
                </span>
                <div
                  className="text-3xl font-extrabold mt-0.5"
                  style={{ color: t.color }}
                >
                  {t.symbol}
                </div>
              </div>

              {/* Pitch Curve SVG with Chao 5-scale grid */}
              <div className="w-full h-20 my-1 relative flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Pitch guide scale lines (5, 4, 3, 2, 1) */}
                  {[25, 40, 55, 70, 85].map((y, i) => (
                    <line
                      key={i}
                      x1="12"
                      y1={y}
                      x2="88"
                      y2={y}
                      stroke="#94A3B8"
                      strokeWidth="0.8"
                      strokeDasharray="2,2"
                      opacity="0.35"
                    />
                  ))}
                  {/* Left scale labels */}
                  <text x="5" y="27" fontSize="8" fill="#94A3B8">5</text>
                  <text x="5" y="57" fontSize="8" fill="#94A3B8">3</text>
                  <text x="5" y="87" fontSize="8" fill="#94A3B8">1</text>

                  {/* Active Tone Pitch Curve */}
                  <path
                    d={t.pitchCurve}
                    fill="none"
                    stroke={t.color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="drop-shadow-sm"
                  />
                </svg>
              </div>

              {/* Avatar Illustration */}
              <div className="w-16 h-16 my-1">
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
                  {t.avatarPath}
                </svg>
              </div>

              {/* Pitch Description */}
              <div className="font-bold text-sm text-slate-800 dark:text-slate-100 mt-1">
                {t.description}
              </div>

              {/* Example word with Audio Button */}
              <button
                onClick={(e) => handlePlayTone(e, t.audioText)}
                className="mt-2.5 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors group"
                title={`Nghe phát âm: ${t.pinyin}`}
              >
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {t.pinyin}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ({t.meaning})
                </span>
                <Volume2 className="w-3.5 h-3.5 text-primary-500 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
