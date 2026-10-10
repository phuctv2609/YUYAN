import React from 'react';
import { VocalTractVisualConfig, TonguePosition, LipShape } from '../../../../data/pinyin/beginnerPhoneticsData';

interface SagittalVocalTractProps {
  config: VocalTractVisualConfig;
  symbol?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  highlightColor?: string;
}

export const SagittalVocalTract: React.FC<SagittalVocalTractProps> = ({
  config,
  symbol: _symbol,
  size = 'md',
  className = '',
  highlightColor = '#EF4444',
}) => {
  const { tonguePosition, lipShape, airflowType, softPalateState } = config;

  const width = size === 'sm' ? 180 : size === 'lg' ? 320 : 250;
  const height = size === 'sm' ? 160 : size === 'lg' ? 280 : 220;

  // Derive tongue path according to tongue position
  const getTonguePath = (pos: TonguePosition): string => {
    switch (pos) {
      case 'retroflex':
        // Tip curled back up towards hard palate
        return 'M 100,165 C 105,150 115,130 135,120 C 145,115 155,102 150,90 C 146,80 135,82 130,95 C 120,120 100,135 85,160 Z';
      case 'alveolar':
        // Tip touching upper gum ridge behind top teeth
        return 'M 100,165 C 105,150 115,135 130,120 C 142,108 152,95 156,86 C 158,82 153,80 148,84 C 135,95 110,130 85,160 Z';
      case 'dental':
        // Tip straight touching back of upper front teeth
        return 'M 100,165 C 105,150 115,135 135,120 C 148,110 162,100 168,96 C 170,94 165,90 158,92 C 140,105 110,135 85,160 Z';
      case 'palatal':
        // Blade raised flat against hard palate
        return 'M 100,165 C 105,145 115,115 130,95 C 138,85 148,84 152,90 C 150,100 135,120 120,140 C 105,155 95,160 85,160 Z';
      case 'velar':
        // Back of tongue arched high touching soft palate
        return 'M 100,165 C 105,145 110,110 120,86 C 125,78 135,80 132,92 C 125,120 115,145 85,160 Z';
      case 'high_front':
      case 'high_front_rounded':
        // Body of tongue high and forward
        return 'M 100,165 C 105,145 118,120 138,102 C 148,94 156,92 155,98 C 145,115 125,140 85,160 Z';
      case 'high_back':
        // High back towards velum
        return 'M 100,165 C 105,145 112,100 122,88 C 128,82 135,88 130,102 C 120,128 105,148 85,160 Z';
      case 'low_flat':
      case 'bilabial':
      case 'labiodental':
      default:
        // Flat on bottom of oral cavity
        return 'M 100,165 C 108,155 120,145 135,138 C 145,132 155,130 160,132 C 158,138 140,146 120,154 C 105,160 95,162 85,160 Z';
    }
  };

  // Soft palate (velum): lowered allows air to nasal cavity, raised blocks nasal cavity
  const velumPath =
    softPalateState === 'lowered'
      ? 'M 105,62 C 108,72 110,85 112,98 C 111,102 107,102 105,96 C 103,85 101,72 98,62 Z'
      : 'M 105,62 C 112,68 122,76 130,82 C 133,84 132,88 128,86 C 118,80 110,72 98,62 Z';

  // Lips contour
  const getLips = (shape: LipShape) => {
    switch (shape) {
      case 'closed':
        // Both lips touching firmly
        return {
          upper: 'M 175,88 C 178,92 184,98 186,105 C 182,106 176,104 172,100 Z',
          lower: 'M 172,100 C 176,104 182,106 186,105 C 182,115 178,122 173,126 Z',
        };
      case 'teeth_on_lip':
        // Upper teeth contact lower lip
        return {
          upper: 'M 175,84 C 180,88 186,92 188,96 C 182,98 176,96 172,92 Z',
          lower: 'M 168,102 C 175,102 182,106 186,112 C 180,120 175,124 170,126 Z',
        };
      case 'open_large':
        return {
          upper: 'M 175,82 C 182,84 190,88 192,94 C 184,96 176,92 172,88 Z',
          lower: 'M 170,118 C 176,122 184,128 188,134 C 182,138 175,136 170,132 Z',
        };
      case 'pursed_round':
      case 'open_round':
        // Pursed forward
        return {
          upper: 'M 175,86 C 184,88 194,92 196,98 C 188,100 180,98 174,94 Z',
          lower: 'M 174,108 C 182,108 192,106 195,112 C 188,120 180,122 173,124 Z',
        };
      case 'spread':
      default:
        return {
          upper: 'M 175,86 C 180,89 187,93 189,97 C 182,98 176,95 172,92 Z',
          lower: 'M 172,108 C 178,111 185,113 188,118 C 182,122 176,122 171,122 Z',
        };
    }
  };

  const lips = getLips(lipShape);

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      <svg
        viewBox="0 0 220 190"
        width={width}
        height={height}
        className="drop-shadow-sm transition-all duration-300"
      >
        <defs>
          {/* Subtle shading gradients */}
          <linearGradient id="skinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FED7AA" />
            <stop offset="100%" stopColor="#FDBA74" />
          </linearGradient>
          <linearGradient id="cavityGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#4A0404" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </linearGradient>
          <linearGradient id="tongueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F87171" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
          <linearGradient id="airflowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#2563EB" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="nasalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#0284C7" />
          </linearGradient>
          <marker
            id="airArrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563EB" />
          </marker>
          <marker
            id="nasalArrow"
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#0284C7" />
          </marker>
        </defs>

        {/* 1. Outer Head Outline (Forehead, Nose, Lips, Chin, Neck) */}
        <path
          d="M 120,15 
             C 160,15 185,35 190,55 
             C 192,62 188,70 192,75 
             C 195,78 202,82 195,85 
             C 190,87 186,88 184,95 
             C 182,100 186,108 182,112 
             C 178,116 182,125 178,135 
             C 174,142 165,150 160,165 
             C 155,178 152,185 150,188 
             L 70,188 
             C 65,155 60,110 65,60 
             C 70,25 95,15 120,15 Z"
          fill="url(#skinGrad)"
          stroke="#EA580C"
          strokeWidth="1.5"
          opacity="0.9"
        />

        {/* 2. Nasal Cavity & Oral Cavity Void */}
        <path
          d="M 120,38 
             C 145,38 165,42 178,60 
             C 182,66 175,70 168,70 
             C 150,68 135,62 105,62 
             C 85,62 82,90 80,170 
             L 72,170 
             C 70,80 75,45 120,38 Z"
          fill="url(#cavityGrad)"
          opacity="0.85"
        />

        {/* 3. Hard Palate Bone (Roof of mouth) */}
        <path
          d="M 166,74 C 150,72 135,68 105,68 C 98,68 98,64 105,64 C 135,64 152,68 168,70 Z"
          fill="#FED7AA"
          stroke="#F97316"
          strokeWidth="1"
        />

        {/* 4. Upper Incisors (Top Teeth) */}
        <path
          d="M 166,75 L 169,87 C 169,89 166,89 164,88 L 162,76 Z"
          fill="#FFFFFF"
          stroke="#D1D5DB"
          strokeWidth="0.8"
        />

        {/* 5. Lower Incisors (Bottom Teeth) */}
        <path
          d="M 162,125 L 165,113 C 166,111 168,111 168,113 L 166,125 Z"
          fill="#FFFFFF"
          stroke="#D1D5DB"
          strokeWidth="0.8"
        />

        {/* 6. Soft Palate / Velum (Dynamic: Raised or Lowered) */}
        <path
          d={velumPath}
          fill="#F87171"
          stroke="#DC2626"
          strokeWidth="1"
          className="transition-all duration-300"
        />

        {/* 7. Tongue Body (Dynamic shape by phoneme articulation) */}
        <path
          d={getTonguePath(tonguePosition)}
          fill="url(#tongueGrad)"
          stroke="#B91C1C"
          strokeWidth="1.5"
          className="transition-all duration-300"
        />

        {/* 8. Upper & Lower Lips */}
        <path d={lips.upper} fill="#EA580C" stroke="#C2410C" strokeWidth="1" />
        <path d={lips.lower} fill="#EA580C" stroke="#C2410C" strokeWidth="1" />

        {/* 9. Dynamic Airflow Indicators */}
        {airflowType === 'nasal_escape' && (
          <g className="animate-pulse">
            {/* Air entering pharynx up through nasal cavity and out nostril */}
            <path
              d="M 85,150 Q 92,100 100,75 T 140,50 T 175,65 T 194,72"
              fill="none"
              stroke="#0284C7"
              strokeWidth="3.5"
              strokeDasharray="4,3"
              markerEnd="url(#nasalArrow)"
            />
            {/* Nasal resonance glow */}
            <circle cx="150" cy="52" r="14" fill="#38BDF8" opacity="0.2" />
          </g>
        )}

        {airflowType === 'aspirated_puff' && (
          <g>
            {/* Strong burst with double arrow and puff waves */}
            <path
              d="M 140,110 Q 155,102 175,98 L 210,95"
              fill="none"
              stroke="#EF4444"
              strokeWidth="4"
              markerEnd="url(#airArrow)"
            />
            <path
              d="M 175,90 Q 185,86 205,82"
              fill="none"
              stroke="#F87171"
              strokeWidth="2.5"
              strokeDasharray="3,2"
            />
            <path
              d="M 175,108 Q 188,112 205,115"
              fill="none"
              stroke="#F87171"
              strokeWidth="2.5"
              strokeDasharray="3,2"
            />
            {/* Burst cloud icon at lips */}
            <circle cx="190" cy="98" r="8" fill="#EF4444" opacity="0.2" className="animate-ping" />
          </g>
        )}

        {airflowType === 'oral_burst' && (
          <g>
            <path
              d="M 140,115 Q 160,105 180,102 L 202,102"
              fill="none"
              stroke="#2563EB"
              strokeWidth="3"
              markerEnd="url(#airArrow)"
            />
          </g>
        )}

        {airflowType === 'fricative_narrow' && (
          <g>
            {/* Narrow friction squiggly wave */}
            <path
              d="M 145,105 Q 155,100 162,105 T 172,98 T 185,102 T 198,100"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="2.5"
            />
            <path
              d="M 148,110 Q 158,105 165,110 T 175,103 T 188,107 T 202,104"
              fill="none"
              stroke="#A78BFA"
              strokeWidth="2"
              strokeDasharray="2,2"
            />
          </g>
        )}

        {airflowType === 'vocal_resonant' && (
          <g>
            {/* Resonant wide oral wave */}
            <path
              d="M 130,120 Q 150,110 170,110 L 205,110"
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              markerEnd="url(#airArrow)"
            />
          </g>
        )}

        {/* 10. Vocal Fold Vibration Indicator (Thanh đới / Thanh quản) */}
        <g transform="translate(75, 165)">
          <circle cx="0" cy="0" r="4" fill={highlightColor} />
          <path
            d="M -3,-6 L 3,-6 M -4,-3 L 4,-3 M -3,0 L 3,0 M -4,3 L 4,3"
            stroke={highlightColor}
            strokeWidth="1.2"
            opacity="0.8"
          />
        </g>
      </svg>

      {/* Label badges below diagram */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
          Vị trí lưỡi: <strong className="ml-1 text-primary-600 dark:text-primary-400 capitalize">{tonguePosition.replace('_', ' ')}</strong>
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
          Luồng hơi: <strong className="ml-1 text-blue-600 dark:text-blue-400 capitalize">{airflowType.replace('_', ' ')}</strong>
        </span>
      </div>
    </div>
  );
};
