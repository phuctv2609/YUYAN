import React from 'react';

interface YuyanAudioVisualizerProps {
  isActive: boolean;
  volumePercent: number; // 0..100
  barCount?: number;
  className?: string;
}

export const YuyanAudioVisualizer: React.FC<YuyanAudioVisualizerProps> = ({
  isActive,
  volumePercent,
  barCount = 28,
  className = '',
}) => {
  // Generate waveform bar heights dynamically
  const bars = Array.from({ length: barCount }, (_, index) => {
    // Symmetrical bell-curve wave distribution around the center
    const center = barCount / 2;
    const distFromCenter = Math.abs(index - center) / center;
    const curveFactor = Math.cos(distFromCenter * Math.PI * 0.5);

    if (!isActive) {
      // Idle state: subtle organic gentle curve
      return 6 + Math.round(curveFactor * 10);
    }

    // Active state: volume-driven reactive height
    const baseMin = 8;
    const dynamicBoost = (volumePercent / 100) * 44;
    // Add pseudo-random phase jitter based on index
    const jitter = Math.sin(index * 1.3) * 6;
    const totalHeight = Math.max(6, Math.min(60, Math.round(baseMin + (dynamicBoost + jitter) * curveFactor)));
    return totalHeight;
  });

  return (
    <div
      className={`flex items-center justify-center gap-[3px] h-16 w-full select-none ${className}`}
      aria-hidden="true"
    >
      {bars.map((height, i) => (
        <div
          key={i}
          style={{ height: `${height}px` }}
          className={`w-[3.5px] rounded-full transition-all duration-75 ${
            isActive
              ? 'bg-gradient-to-t from-primary via-sky-400 to-indigo-400 opacity-90 shadow-2xs'
              : 'bg-primary/25 dark:bg-primary/30 opacity-60'
          }`}
        />
      ))}
    </div>
  );
};
