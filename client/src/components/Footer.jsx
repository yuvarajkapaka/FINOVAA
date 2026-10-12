import React from 'react';
import FinovaLogo from './FinovaLogo';
import { 
  Building2, 
  Vault, 
  GraduationCap, 
  TrendingUp, 
  BarChart3, 
  ShieldCheck, 
  Sparkles,
  ArrowUp
} from 'lucide-react';

/**
 * Premium, Responsive Footer Component for FINOVA
 * 
 * Features:
 * - FINOVA Brand Identity & Tagline: "Learn today. Invest smarter tomorrow."
 * - Official Hackathon attribution: "Investment Literacy Simulator | Built for KPRIT Software Hackathon 2026"
 * - Copyright: "© 2026 FINOVA. All rights reserved."
 * - Fast District & Center Navigation Shortcuts
 * - Smooth scroll-to-top button
 * - Semantic HTML & high accessibility contrast
 * - Translucent backdrop blur that allows liquid-metal background motion to gently breathe through
 */
export default function Footer({ onNavigateTab }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { id: 'WORLD', label: 'Economic World', icon: Sparkles },
    { id: 'WALLET', label: 'Money Center', icon: Building2 },
    { id: 'SAVINGS', label: 'Savings Center', icon: Vault },
    { id: 'ACADEMY', label: 'Learning Center', icon: GraduationCap },
    { id: 'MARKET', label: 'Investment Center', icon: TrendingUp },
    { id: 'SIMULATION', label: 'Challenge Center', icon: BarChart3 }
  ];

  return (
    <footer 
      className="relative z-10 border-t border-edge bg-canvas-white/85 backdrop-blur-md mt-auto transition-all duration-300 select-none animate-in fade-in duration-500"
      aria-label="Application Footer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        {/* Top Row: Brand & Tagline + Quick Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-edge/70">
          {/* Brand Identity */}
          <div className="space-y-2">
            <div 
              className="cursor-pointer inline-block" 
              onClick={() => onNavigateTab && onNavigateTab('WORLD')}
              title="Return to FINOVA Economic World"
            >
              <FinovaLogo size="md" showSubtitle={false} />
            </div>
            <p className="text-sm font-semibold text-forest font-serif italic tracking-wide">
              Learn today. Invest smarter tomorrow.
            </p>
            <p className="text-xs text-ink-muted max-w-md leading-relaxed">
              Interactive financial strategy simulation platform designed to build disciplined capital allocation, emergency reserves, and compounding wealth literacy.
            </p>
          </div>

          {/* Quick Economic Center Navigation */}
          {onNavigateTab && (
            <div className="flex flex-wrap items-center gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <button
                    key={link.id}
                    onClick={() => onNavigateTab(link.id)}
                    className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-canvas-subtle/80 hover:bg-canvas-white border border-edge text-xs font-semibold text-ink-muted hover:text-forest hover:border-forest/40 transition-all duration-200 hover:-translate-y-0.5 shadow-2xs cursor-pointer"
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Row: Copyright + Hackathon Attribution + Scroll To Top */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-semibold text-ink">
              © 2026 FINOVA. All rights reserved.
            </span>
            <span className="hidden sm:inline text-edge-dark">•</span>
            <span className="text-[11px] font-mono text-ink-subtle">
              Investment Literacy Simulator | Built for KPRIT Software Hackathon 2026
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-[11px] text-forest font-semibold bg-forest/10 border border-forest/20 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-forest" />
              <span>Zero Real-Money Risk</span>
            </div>

            <button
              onClick={scrollToTop}
              className="p-2 rounded-xl bg-canvas-subtle hover:bg-canvas-white border border-edge text-ink-muted hover:text-forest transition-all duration-200 hover:-translate-y-0.5 shadow-2xs cursor-pointer"
              title="Return to top of page"
              aria-label="Scroll to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
