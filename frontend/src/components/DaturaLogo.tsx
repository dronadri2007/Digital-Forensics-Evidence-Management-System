import React from 'react';

interface DaturaLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showLabel?: boolean;
}

export const DaturaLogo: React.FC<DaturaLogoProps> = ({
  className = '',
  size = 'md',
  showLabel = false,
}) => {
  const sizeClasses = {
    sm: 'h-8 w-auto',
    md: 'h-9 w-auto',
    lg: 'h-12 w-auto',
    hero: 'h-24 w-auto',
  };

  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div className="relative flex items-center justify-center">
        <img
          src="/datura.png"
          alt="AEGIS Official Datura Mark"
          className={`${sizeClasses[size]} object-contain filter drop-shadow-[0_0_12px_rgba(255,255,255,0.1)] transition-opacity duration-300`}
          style={{ aspectRatio: '420 / 570' }}
          loading="eager"
          decoding="async"
        />
      </div>
      {showLabel && (
        <span className="font-sans font-extrabold tracking-[0.22em] text-base uppercase text-[#EDEAE3]">
          AEGIS
        </span>
      )}
    </div>
  );
};
