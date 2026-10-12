import React from 'react';

/**
 * Official FINOVA Brand Logo Component
 * 
 * Features:
 * - Geometric, folded F-shaped symbol with faceted origami-inspired structure
 * - Emerald green (#254B3B, #2F6A4F) and sage green (#A8B39A, #BAC3AF) sections
 * - Dark navy (#182B35) faceted folds and depth details
 * - Minimal, modern typography
 * - Scalable vector rendering that stays crisp at any size
 */
export default function FinovaLogo({ 
  size = 'md',        // 'sm' | 'md' | 'lg' | 'xl'
  showText = true,    // whether to show "FINOVA" wordmark
  showSubtitle = true, // whether to show "Money Skills Game"
  className = '',
  onClick
}) {
  // Dimension tokens
  const sizeMap = {
    sm: { icon: 26, text: 'text-base', sub: 'text-[9px]' },
    md: { icon: 34, text: 'text-lg', sub: 'text-[10px]' },
    lg: { icon: 42, text: 'text-xl', sub: 'text-[11px]' },
    xl: { icon: 56, text: 'text-2xl', sub: 'text-xs' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const dim = currentSize.icon;

  return (
    <div 
      className={`inline-flex items-center space-x-2.5 select-none ${className}`}
      onClick={onClick}
    >
      {/* Geometric Folded 'F' Symbol */}
      <svg
        width={dim}
        height={dim}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-200 hover:scale-105 drop-shadow-xs"
        aria-label="FINOVA Brand Mark"
      >
        <defs>
          {/* Emerald Gradient (Upper Stem & Top Arm) */}
          <linearGradient id="finovaEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2F6A4F" />
            <stop offset="100%" stopColor="#254B3B" />
          </linearGradient>

          {/* Sage Gradient (Folded Facets & Middle Arm) */}
          <linearGradient id="finovaSage" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#BAC3AF" />
            <stop offset="100%" stopColor="#8E9A80" />
          </linearGradient>

          {/* Dark Navy Depth Gradient (Creases & Bottom Spine) */}
          <linearGradient id="finovaNavy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E3542" />
            <stop offset="100%" stopColor="#182B35" />
          </linearGradient>

          {/* Soft Gold / Ivory Fold Highlight */}
          <linearGradient id="finovaGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E6D4AA" />
            <stop offset="100%" stopColor="#D8C18A" />
          </linearGradient>
        </defs>

        {/* 1. Main Vertical Stem (Emerald Green Primary Column) */}
        <path
          d="M 6 4 L 16 4 L 16 36 L 6 30 Z"
          fill="url(#finovaEmerald)"
        />

        {/* 2. Dark Navy Folded Under-Spine (Geometric Depth Shadow) */}
        <path
          d="M 6 30 L 16 36 L 16 40 L 6 34 Z"
          fill="url(#finovaNavy)"
          opacity="0.95"
        />

        {/* 3. Top Horizontal Fold Arm (Upper Emerald to Sage Fold) */}
        <path
          d="M 16 4 L 34 4 L 28 14 L 16 14 Z"
          fill="url(#finovaEmerald)"
        />
        {/* Top Arm Folded Bevel (Angled Sage Facet) */}
        <path
          d="M 34 4 L 28 14 L 32 17 L 38 7 Z"
          fill="url(#finovaSage)"
        />

        {/* 4. Middle Horizontal Crossbar (Sage Green Facet) */}
        <path
          d="M 16 18 L 29 18 L 24 26 L 16 26 Z"
          fill="url(#finovaSage)"
        />
        {/* Middle Crossbar Fold Crease (Dark Navy Detail) */}
        <path
          d="M 29 18 L 24 26 L 27 28 L 32 20 Z"
          fill="url(#finovaNavy)"
          opacity="0.9"
        />

        {/* 5. Center Diagonal Fold Seam (Connecting Emerald Spine to Navy Shadow) */}
        <path
          d="M 16 14 L 20 18 L 16 20 Z"
          fill="url(#finovaNavy)"
          opacity="0.85"
        />

        {/* 6. Subtle Gold Accent Crease Pip (Refined Strategic Polish) */}
        <circle
          cx="16"
          cy="14"
          r="1.2"
          fill="url(#finovaGold)"
          opacity="0.85"
        />
      </svg>

      {/* Modern Wordmark Typography */}
      {showText && (
        <div className="flex flex-col leading-none">
          <div className="flex items-center space-x-1">
            <span className={`font-sans font-extrabold tracking-tight text-ink ${currentSize.text}`}>
              FINOVA
            </span>
          </div>
          {showSubtitle && (
            <span className={`font-sans font-medium text-ink-muted mt-0.5 tracking-wide ${currentSize.sub}`}>
              Money Skills Game
            </span>
          )}
        </div>
      )}
    </div>
  );
}
