import React from 'react';
import { LipShape } from '../../../../data/pinyin/beginnerPhoneticsData';

interface LipShapeDiagramProps {
  lipShape: LipShape;
  steps?: string[];
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const LipShapeDiagram: React.FC<LipShapeDiagramProps> = ({
  lipShape,
  steps,
  size = 'md',
  className = '',
}) => {
  const width = size === 'sm' ? 140 : size === 'lg' ? 240 : 180;
  const height = size === 'sm' ? 90 : size === 'lg' ? 150 : 110;

  // Render front-view lips SVG based on shape
  const renderMouth = () => {
    switch (lipShape) {
      case 'open_large':
        // Big open mouth for 'a'
        return (
          <g>
            {/* Outer lips */}
            <path
              d="M 20,55 C 35,42 65,38 90,48 C 115,38 145,42 160,55 C 145,72 120,86 90,86 C 60,86 35,72 20,55 Z"
              fill="#F87171"
              stroke="#DC2626"
              strokeWidth="2"
            />
            {/* Open mouth cavity */}
            <path
              d="M 36,55 C 50,47 70,45 90,52 C 110,45 130,47 144,55 C 132,74 112,79 90,79 C 68,79 48,74 36,55 Z"
              fill="#450A0A"
            />
            {/* Visible teeth row top */}
            <rect x="70" y="50" width="40" height="7" rx="2" fill="#FFFFFF" opacity="0.9" />
            {/* Visible tongue */}
            <path d="M 65,72 C 78,66 102,66 115,72 C 105,78 75,78 65,72 Z" fill="#EF4444" />
          </g>
        );

      case 'open_round':
        // Round open mouth for 'o', 'u'
        return (
          <g>
            {/* Outer lips */}
            <path
              d="M 35,55 C 45,35 135,35 145,55 C 135,75 45,75 35,55 Z"
              fill="#F87171"
              stroke="#DC2626"
              strokeWidth="2"
            />
            {/* Round orifice */}
            <ellipse cx="90" cy="55" rx="22" ry="16" fill="#450A0A" />
            <path d="M 78,63 C 84,60 96,60 102,63 C 98,68 82,68 78,63 Z" fill="#EF4444" />
          </g>
        );

      case 'pursed_round':
        // Small pursed circle like whistling for 'ü'
        return (
          <g>
            {/* Outer lips with puckering wrinkles */}
            <ellipse cx="90" cy="55" rx="38" ry="26" fill="#F87171" stroke="#DC2626" strokeWidth="2" />
            {/* Small tight circular opening */}
            <ellipse cx="90" cy="55" rx="10" ry="10" fill="#450A0A" stroke="#B91C1C" strokeWidth="1.5" />
            <circle cx="90" cy="55" r="4" fill="#1C1917" />
          </g>
        );

      case 'spread':
        // Wide smiling lips for 'i', 'e'
        return (
          <g>
            <path
              d="M 15,55 C 40,46 140,46 165,55 C 140,68 40,68 15,55 Z"
              fill="#F87171"
              stroke="#DC2626"
              strokeWidth="2"
            />
            {/* Narrow slot opening with teeth touching */}
            <path d="M 28,55 C 50,51 130,51 152,55 C 130,59 50,59 28,55 Z" fill="#FFFFFF" stroke="#D1D5DB" strokeWidth="1" />
          </g>
        );

      case 'teeth_on_lip':
        // Upper teeth resting on lower lip for 'f'
        return (
          <g>
            {/* Upper lip */}
            <path d="M 30,46 C 60,40 120,40 150,46 C 130,52 50,52 30,46 Z" fill="#F87171" stroke="#DC2626" strokeWidth="1.5" />
            {/* Upper front incisors biting down */}
            <rect x="72" y="46" width="36" height="12" rx="2" fill="#FFFFFF" stroke="#E5E7EB" strokeWidth="1" />
            {/* Lower lip curved underneath teeth */}
            <path d="M 35,56 C 55,56 70,58 90,58 C 110,58 125,56 145,56 C 130,72 50,72 35,56 Z" fill="#EF4444" stroke="#DC2626" strokeWidth="1.5" />
          </g>
        );

      case 'closed':
      default:
        // Closed lips for 'b', 'p', 'm'
        return (
          <g>
            <path
              d="M 25,55 C 45,46 70,44 90,49 C 110,44 135,46 155,55 C 135,66 110,69 90,67 C 70,69 45,66 25,55 Z"
              fill="#F87171"
              stroke="#DC2626"
              strokeWidth="2"
            />
            {/* Center seam line */}
            <path d="M 30,55 C 60,53 120,53 150,55" fill="none" stroke="#991B1B" strokeWidth="2.5" />
          </g>
        );
    }
  };

  const getShapeLabel = (shape: LipShape): string => {
    switch (shape) {
      case 'open_large': return 'Miệng mở lớn';
      case 'open_round': return 'Môi tròn vừa';
      case 'pursed_round': return 'Môi chu nhỏ nhọn (huýt sáo)';
      case 'spread': return 'Môi bè ngang dẹt';
      case 'teeth_on_lip': return 'Răng trên chạm môi dưới';
      case 'closed':
      default:
        return 'Hai môi khép chặt';
    }
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* Front Lip SVG visual */}
      <div className="relative bg-amber-50/60 dark:bg-slate-800/60 rounded-xl p-2 border border-amber-200/50 dark:border-slate-700 flex flex-col items-center shadow-inner">
        <svg viewBox="0 0 180 110" width={width} height={height} className="drop-shadow-sm">
          {renderMouth()}
        </svg>
        <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-200 mt-1">
          {getShapeLabel(lipShape)}
        </span>
      </div>

      {/* 3-step numbered cards if provided */}
      {steps && steps.length > 0 && (
        <div className="w-full mt-3 space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Các bước vận động môi:
          </div>
          <div className="grid grid-cols-1 gap-1.5">
            {steps.map((step, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 bg-white dark:bg-slate-800/80 p-2 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs text-xs text-slate-800 dark:text-slate-200"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400 font-bold flex items-center justify-center text-[11px]">
                  {idx + 1}
                </span>
                <span className="leading-snug pt-0.5">{step}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
