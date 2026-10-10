import React from 'react';

interface AssessmentDonutChartProps {
  size?: number;
  className?: string;
}

export const AssessmentDonutChart: React.FC<AssessmentDonutChartProps> = ({
  size = 180,
  className = '',
}) => {
  // Total 30 questions
  // Nghe: 8 (8/30 = 26.67%)
  // Nói: 8 (8/30 = 26.67%)
  // Đọc: 7 (7/30 = 23.33%)
  // Viết: 7 (7/30 = 23.33%)
  const radius = 55;
  const circumference = 2 * Math.PI * radius; // ~ 345.575

  const pListening = (8 / 30) * circumference;
  const pSpeaking = (8 / 30) * circumference;
  const pReading = (7 / 30) * circumference;
  const pWriting = (7 / 30) * circumference;

  const offsetListening = 0;
  const offsetSpeaking = -pListening;
  const offsetReading = -(pListening + pSpeaking);
  const offsetWriting = -(pListening + pSpeaking + pReading);

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90 transform">
          {/* Track background */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#F1F5F9"
            strokeWidth="20"
            className="dark:stroke-slate-800"
          />

          {/* 1. Listening (Blue) */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="20"
            strokeDasharray={`${pListening} ${circumference}`}
            strokeDashoffset={offsetListening}
            strokeLinecap="butt"
          />

          {/* 2. Speaking (Purple) */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#A855F7"
            strokeWidth="20"
            strokeDasharray={`${pSpeaking} ${circumference}`}
            strokeDashoffset={offsetSpeaking}
            strokeLinecap="butt"
          />

          {/* 3. Reading (Green) */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#10B981"
            strokeWidth="20"
            strokeDasharray={`${pReading} ${circumference}`}
            strokeDashoffset={offsetReading}
            strokeLinecap="butt"
          />

          {/* 4. Writing (Orange) */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="none"
            stroke="#F59E0B"
            strokeWidth="20"
            strokeDasharray={`${pWriting} ${circumference}`}
            strokeDashoffset={offsetWriting}
            strokeLinecap="butt"
          />
        </svg>

        {/* Center Text: "30 câu" (Exact match to Infographic Section 9) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-black text-slate-900 dark:text-white leading-none">
            30
          </span>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
            câu
          </span>
        </div>
      </div>

      {/* Legend below (Exact match to Infographic) */}
      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">Nghe: <strong>8 câu</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-500 flex-shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">Nói: <strong>8 câu</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">Đọc: <strong>7 câu</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 flex-shrink-0" />
          <span className="text-slate-700 dark:text-slate-300 font-medium">Viết: <strong>7 câu</strong></span>
        </div>
      </div>
    </div>
  );
};
