import React from 'react';

interface YuyanAIAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showOnlineStatus?: boolean;
  className?: string;
  onClick?: () => void;
}

export const YuyanAIAvatar: React.FC<YuyanAIAvatarProps> = ({
  size = 'md',
  showOnlineStatus = false,
  className = '',
  onClick,
}) => {
  const sizeClasses = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-14 h-14',
    hero: 'w-24 h-24 sm:w-28 sm:h-28',
  };

  const statusDotSizes = {
    sm: 'w-2 h-2 -bottom-0.5 -right-0.5 border',
    md: 'w-2.5 h-2.5 bottom-0 right-0 border-2',
    lg: 'w-3 h-3 bottom-0.5 right-0.5 border-2',
    xl: 'w-3.5 h-3.5 bottom-0.5 right-0.5 border-2',
    hero: 'w-4 h-4 bottom-1 right-1 border-2',
  };

  return (
    <div
      onClick={onClick}
      className={`relative rounded-full shrink-0 select-none ${sizeClasses[size]} ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-transform active:scale-95' : ''
      } ${className}`}
    >
      {/* Outer Glow Ring */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-sky-400 via-primary to-indigo-400 p-[1.5px] shadow-sm">
        {/* Inner Avatar Graphic */}
        <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-b from-sky-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center relative">
          {/* Aesthetic Chinese Stylized Portrait Vector */}
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full object-cover"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft background gradient */}
            <circle cx="50" cy="50" r="50" fill="url(#bgGrad)" />
            {/* Hair Back */}
            <path
              d="M18 45 C18 18 82 18 82 45 C82 72 75 92 70 100 L30 100 C25 92 18 72 18 45 Z"
              fill="#22232E"
            />
            {/* Neck and Face */}
            <path d="M42 62 L42 75 L58 75 L58 62 Z" fill="#FCECE6" />
            <path
              d="M32 40 C32 28 68 28 68 40 C68 56 60 66 50 66 C40 66 32 56 32 40 Z"
              fill="#FDF2ED"
            />
            {/* Cheeks blush */}
            <circle cx="39" cy="48" r="4" fill="#FCA5A5" opacity="0.45" />
            <circle cx="61" cy="48" r="4" fill="#FCA5A5" opacity="0.45" />
            {/* Eyes */}
            <ellipse cx="41" cy="43" rx="2.5" ry="3.5" fill="#1E1B4B" />
            <circle cx="42" cy="42" r="1" fill="#FFFFFF" />
            <ellipse cx="59" cy="43" rx="2.5" ry="3.5" fill="#1E1B4B" />
            <circle cx="60" cy="42" r="1" fill="#FFFFFF" />
            {/* Eyebrows */}
            <path d="M38 38 Q41 36 44 38" stroke="#4B4869" strokeWidth="1" strokeLinecap="round" />
            <path d="M56 38 Q59 36 62 38" stroke="#4B4869" strokeWidth="1" strokeLinecap="round" />
            {/* Gentle Smile */}
            <path d="M47 54 Q50 57 53 54" stroke="#DC2626" strokeWidth="1.2" strokeLinecap="round" />
            {/* Hair Fringe / Bangs */}
            <path
              d="M26 36 C34 26 46 25 50 32 C54 25 66 26 74 36 C70 32 58 31 52 38 C48 31 36 32 26 36 Z"
              fill="#22232E"
            />
            {/* Traditional Hanfu Robe Collar */}
            <path
              d="M28 85 L50 68 L72 85 L76 100 L24 100 Z"
              fill="#E0F2FE"
            />
            <path
              d="M36 78 L50 68 L64 78 L68 100 L32 100 Z"
              fill="#38BDF8"
              opacity="0.85"
            />
            <path
              d="M44 73 L50 68 L56 73 L58 100 L42 100 Z"
              fill="#FFFFFF"
            />
            {/* Delicate Floral / Lotus Hair Accessory */}
            <circle cx="67" cy="27" r="3.5" fill="#F472B6" />
            <circle cx="64" cy="25" r="2.5" fill="#FBCFE8" />
            <circle cx="70" cy="26" r="2.5" fill="#FBCFE8" />
            <circle cx="67" cy="27" r="1.5" fill="#FEF08A" />

            <defs>
              <linearGradient id="bgGrad" x1="0" y1="0" x2="100" y2="100">
                <stop offset="0%" stopColor="#BAE6FD" />
                <stop offset="100%" stopColor="#E0E7FF" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>

      {/* Online Status Dot */}
      {showOnlineStatus && (
        <span
          className={`absolute rounded-full bg-status-success border-surface ${statusDotSizes[size]} ring-1 ring-white/50`}
          title="Yuyan AI đang trực tuyến"
        />
      )}
    </div>
  );
};
