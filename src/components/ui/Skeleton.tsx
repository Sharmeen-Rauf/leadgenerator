import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rect'
}) => {
  const shapes = {
    text: 'h-3 w-3/4 rounded',
    rect: 'h-12 w-full rounded',
    circle: 'h-10 w-10 rounded-full'
  };

  return (
    <div 
      className={`bg-neutral-900/60 animate-pulse relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:translate-x-[-100%] before:animate-[shimmer_1.5s_infinite] ${shapes[variant]} ${className}`}
    />
  );
};
