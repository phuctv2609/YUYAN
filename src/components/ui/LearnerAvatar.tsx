import React, { useState } from 'react';
import { StudentProfile } from '../../data/repositories/learnerRepository.ts';

interface LearnerAvatarProps {
  profile: StudentProfile;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRing?: boolean;
}

export const LearnerAvatar: React.FC<LearnerAvatarProps> = ({
  profile,
  size = 'md',
  className = '',
  showRing = true,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-9 h-9 sm:w-10 sm:h-10 text-xs sm:text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-xl',
  };

  const initials = profile.displayName
    ? profile.displayName
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : 'HV';

  const ringClass = showRing ? 'ring-1 ring-border-subtle shadow-2xs' : '';

  if (profile.avatar && !imageError) {
    return (
      <img
        src={profile.avatar}
        alt={`Ảnh đại diện của ${profile.displayName}`}
        onError={() => setImageError(true)}
        className={`${sizeClasses[size]} rounded-full object-cover flex-shrink-0 ${ringClass} ${className}`}
      />
    );
  }

  return (
    <div
      aria-label={`Ảnh đại diện viết tắt của ${profile.displayName}`}
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr from-primary to-primary-container text-white font-bold flex items-center justify-center flex-shrink-0 select-none ${ringClass} ${className}`}
    >
      {initials}
    </div>
  );
};
