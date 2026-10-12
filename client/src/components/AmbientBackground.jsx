import React, { useState, useEffect } from 'react';
import LiquidMetalCanvas from './LiquidMetalCanvas';

/**
 * FINOVA Premium Ambient Background System — Liquid Metal Edition
 * 
 * Inspired by:
 * - aidesigner.ai/backgrounds/liquid-metal
 * - shaders.paper.design/liquid-metal
 * - github.com/runvendo/fluidkit
 * 
 * Architecture:
 * 1. WebGL Liquid Metal Shader — Procedural domain-warped FBM, finite-difference normals,
 *    reflective studio environment mapping, silver-white highlights, and sage/emerald sheens.
 * 2. Graceful CSS Fallback — Automatically activates if WebGL is unavailable or context fails.
 * 3. Flowing Geometric Wave Paths — Aceternity-inspired wave contours that follow metallic currents.
 * 4. Floating Sage Particles — Independent upward & diagonal particle drifts.
 * 5. Delicate Constellation Lines — Financial network nodes pulsing at staggered intervals.
 * 6. Responsive & Accessible — Respects prefers-reduced-motion, pauses on hidden tabs, pointer-events: none.
 */
export default function AmbientBackground({ activeTab = 'WORLD' }) {
  const [useFallback, setUseFallback] = useState(false);

  // Context-aware atmospheric and metallic calibration
  const moodConfig = {
    WORLD: {
      intensity: 'opacity-100',
      metalIntensity: 0.54,
      metalSpeed: 0.45,
      auroraOpacity: 'opacity-35',
      orbOpacity: 'opacity-55',
      waveOpacity: 'opacity-40',
      linesOpacity: 'opacity-35',
      particleCount: 14
    },
    WALLET: {
      intensity: 'opacity-85',
      metalIntensity: 0.38,
      metalSpeed: 0.36,
      auroraOpacity: 'opacity-22',
      orbOpacity: 'opacity-42',
      waveOpacity: 'opacity-26',
      linesOpacity: 'opacity-22',
      particleCount: 10
    },
    SAVINGS: {
      intensity: 'opacity-85',
      metalIntensity: 0.38,
      metalSpeed: 0.36,
      auroraOpacity: 'opacity-22',
      orbOpacity: 'opacity-42',
      waveOpacity: 'opacity-26',
      linesOpacity: 'opacity-22',
      particleCount: 10
    },
    ACADEMY: {
      intensity: 'opacity-70',
      metalIntensity: 0.24,
      metalSpeed: 0.28,
      auroraOpacity: 'opacity-15',
      orbOpacity: 'opacity-28',
      waveOpacity: 'opacity-16',
      linesOpacity: 'opacity-18',
      particleCount: 8
    },
    MARKET: {
      intensity: 'opacity-92',
      metalIntensity: 0.48,
      metalSpeed: 0.40,
      auroraOpacity: 'opacity-28',
      orbOpacity: 'opacity-50',
      waveOpacity: 'opacity-32',
      linesOpacity: 'opacity-28',
      particleCount: 12
    },
    SIMULATION: {
      intensity: 'opacity-55',
      metalIntensity: 0.18,
      metalSpeed: 0.24,
      auroraOpacity: 'opacity-12',
      orbOpacity: 'opacity-22',
      waveOpacity: 'opacity-12',
      linesOpacity: 'opacity-15',
      particleCount: 6
    },
    SCORE: {
      intensity: 'opacity-80',
      metalIntensity: 0.34,
      metalSpeed: 0.34,
      auroraOpacity: 'opacity-20',
      orbOpacity: 'opacity-38',
      waveOpacity: 'opacity-22',
      linesOpacity: 'opacity-22',
      particleCount: 10
    },
    MENTOR: {
      intensity: 'opacity-75',
      metalIntensity: 0.30,
      metalSpeed: 0.30,
      auroraOpacity: 'opacity-18',
      orbOpacity: 'opacity-34',
      waveOpacity: 'opacity-18',
      linesOpacity: 'opacity-18',
      particleCount: 8
    },
    OVERVIEW: {
      intensity: 'opacity-80',
      metalIntensity: 0.34,
      metalSpeed: 0.34,
      auroraOpacity: 'opacity-20',
      orbOpacity: 'opacity-38',
      waveOpacity: 'opacity-22',
      linesOpacity: 'opacity-22',
      particleCount: 10
    }
  };

  const config = moodConfig[activeTab] || moodConfig.WORLD;

  // Extremely subtle pointer-based parallax for overlay vectors (desktop only, disabled on touch/reduced motion)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isTouchOrCoarse = window.matchMedia('(pointer: coarse)').matches;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (isTouchOrCoarse || prefersReducedMotion) return;

    let rafId = null;
    const handleMouseMove = (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2;
      const ny = (e.clientY / window.innerHeight - 0.5) * 2;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setMouseOffset({
          x: nx * 10,
          y: ny * 6
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  // 18 softly-illuminated sage particles across viewport
  const allParticles = [
    { id: 1, left: '6%', size: 3.5, duration: 20, delay: 0, animType: 1 },
    { id: 2, left: '13%', size: 2.5, duration: 24, delay: 3, animType: 2 },
    { id: 3, left: '21%', size: 4.5, duration: 18, delay: 7, animType: 1 },
    { id: 4, left: '29%', size: 3, duration: 26, delay: 1, animType: 2 },
    { id: 5, left: '37%', size: 4, duration: 22, delay: 9, animType: 1 },
    { id: 6, left: '45%', size: 2.5, duration: 21, delay: 4, animType: 2 },
    { id: 7, left: '52%', size: 5, duration: 27, delay: 11, animType: 1 },
    { id: 8, left: '59%', size: 3.5, duration: 19, delay: 2, animType: 2 },
    { id: 9, left: '67%', size: 4, duration: 23, delay: 8, animType: 1 },
    { id: 10, left: '74%', size: 3, duration: 28, delay: 5, animType: 2 },
    { id: 11, left: '81%', size: 4.5, duration: 20, delay: 13, animType: 1 },
    { id: 12, left: '88%', size: 3, duration: 25, delay: 6, animType: 2 },
    { id: 13, left: '94%', size: 3.5, duration: 22, delay: 12, animType: 1 },
    { id: 14, left: '17%', size: 4, duration: 21, delay: 15, animType: 1 },
    { id: 15, left: '42%', size: 3, duration: 26, delay: 10, animType: 2 },
    { id: 16, left: '63%', size: 4.5, duration: 24, delay: 14, animType: 1 },
    { id: 17, left: '33%', size: 3.5, duration: 23, delay: 16, animType: 2 },
    { id: 18, left: '84%', size: 3, duration: 27, delay: 17, animType: 1 }
  ];

  const visibleParticles = allParticles.slice(0, config.particleCount);

  // Flowing wave paths for subtle geometric reflection accents
  const backgroundWavePaths = [
    {
      id: 'w1',
      d: "M -60 140 Q 320 70, 700 170 T 1140 130 T 1560 190",
      flowClass: 'bg-line-flow-1',
      stroke: 'url(#bgLinesGradSage)',
      width: 1.6,
      opacity: 0.55
    },
    {
      id: 'w2',
      d: "M -60 210 Q 340 140, 720 240 T 1160 200 T 1560 260",
      flowClass: 'bg-line-flow-2',
      stroke: 'url(#bgLinesGradSage)',
      width: 1.1,
      opacity: 0.38
    },
    {
      id: 'w3',
      d: "M -60 300 Q 360 230, 740 330 T 1180 290 T 1560 350",
      flowClass: 'bg-line-flow-3',
      stroke: 'url(#bgLinesGradEmerald)',
      width: 1.4,
      opacity: 0.48
    },
    {
      id: 'w4',
      d: "M -60 480 Q 420 400, 800 500 T 1230 450 T 1560 520",
      flowClass: 'bg-line-flow-1',
      stroke: 'url(#bgLinesGradGold)',
      width: 1.3,
      opacity: 0.42
    },
    {
      id: 'w5',
      d: "M -60 620 Q 450 540, 830 640 T 1260 580 T 1560 660",
      flowClass: 'bg-line-flow-2',
      stroke: 'url(#bgLinesGradForest)',
      width: 1.6,
      opacity: 0.48
    },
    {
      id: 'w6',
      d: "M -60 740 Q 480 660, 860 760 T 1290 700 T 1560 780",
      flowClass: 'bg-line-flow-4',
      stroke: 'url(#bgLinesGradSage)',
      width: 1.4,
      opacity: 0.42
    }
  ];

  return (
    <div
      className={`fixed inset-0 pointer-events-none overflow-hidden z-0 select-none transition-opacity duration-700 ${config.intensity}`}
      aria-hidden="true"
    >
      {/* =======================================================================
          1. PRIMARY: WEBGL LIQUID METAL PROCEDURAL SHADER
          Real-time domain-warped FBM, surface normals & reflective chrome highlights
      ======================================================================= */}
      {!useFallback ? (
        <div className="absolute inset-0">
          <LiquidMetalCanvas
            intensity={config.metalIntensity}
            speed={config.metalSpeed}
            onFallback={() => setUseFallback(true)}
          />
        </div>
      ) : null}

      {/* =======================================================================
          2. GRACEFUL CSS FALLBACK / AMBIENT GLOW MESH
          Activates when WebGL is unavailable or provides ambient warm backdrop
      ======================================================================= */}
      {useFallback ? (
        <div 
          className={`aurora-mesh-field absolute -inset-[15%] transition-opacity duration-700 ${config.auroraOpacity} mix-blend-multiply`}
          style={{
            backgroundImage: `
              radial-gradient(ellipse 75% 55% at 20% 0%, rgba(168, 179, 154, 0.38) 0%, rgba(242, 240, 232, 0) 70%),
              radial-gradient(ellipse 65% 50% at 85% 35%, rgba(57, 122, 87, 0.25) 0%, rgba(242, 240, 232, 0) 70%),
              radial-gradient(ellipse 60% 50% at 30% 85%, rgba(216, 193, 138, 0.22) 0%, rgba(242, 240, 232, 0) 70%),
              radial-gradient(ellipse 55% 45% at 75% 95%, rgba(47, 106, 79, 0.20) 0%, rgba(242, 240, 232, 0) 70%)
            `,
            filter: 'blur(45px)'
          }}
        />
      ) : null}

      {/* Volumetric Soft Lighting Orbs */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ${config.orbOpacity}`}
        style={{
          transform: `translate3d(${mouseOffset.x * 0.12}px, ${mouseOffset.y * 0.08}px, 0)`,
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 700ms ease'
        }}
      >
        {/* Orb 1: Upper-Left Pale Sage & Warm Ivory Glow (22s) */}
        <div
          className="ambient-orb-1 absolute -top-[15%] -left-[10%] w-[680px] h-[680px] rounded-full blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(168, 179, 154, 0.36) 0%, rgba(186, 195, 175, 0.20) 45%, rgba(242, 240, 232, 0) 75%)'
          }}
        />

        {/* Orb 2: Center-Right Light Emerald & Muted Green Aura (26s) */}
        <div
          className="ambient-orb-2 absolute top-[22%] -right-[12%] w-[720px] h-[720px] rounded-full blur-[130px]"
          style={{
            background: 'radial-gradient(circle, rgba(47, 106, 79, 0.20) 0%, rgba(111, 155, 131, 0.15) 45%, rgba(242, 240, 232, 0) 75%)'
          }}
        />

        {/* Orb 3: Bottom-Left Warm Ivory & Pale Gold Mist (28s) */}
        <div
          className="ambient-orb-3 absolute -bottom-[18%] left-[16%] w-[760px] h-[760px] rounded-full blur-[140px]"
          style={{
            background: 'radial-gradient(circle, rgba(216, 193, 138, 0.20) 0%, rgba(168, 179, 154, 0.14) 48%, rgba(242, 240, 232, 0) 75%)'
          }}
        />
      </div>

      {/* =======================================================================
          3. FLOWING GEOMETRIC REFLECTION PATHS
          Subtle animated strokes echoing the liquid metal currents
      ======================================================================= */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ${config.waveOpacity}`}
        style={{
          transform: `translate3d(${mouseOffset.x * 0.35}px, ${mouseOffset.y * 0.22}px, 0)`,
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 700ms ease'
        }}
      >
        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="none"
          className="w-full h-full object-cover"
        >
          <defs>
            <linearGradient id="bgLinesGradSage" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A8B39A" stopOpacity="0.10" />
              <stop offset="40%" stopColor="#A8B39A" stopOpacity="0.48" />
              <stop offset="75%" stopColor="#BAC3AF" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#A8B39A" stopOpacity="0.08" />
            </linearGradient>

            <linearGradient id="bgLinesGradEmerald" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2F6A4F" stopOpacity="0.08" />
              <stop offset="45%" stopColor="#397A57" stopOpacity="0.42" />
              <stop offset="80%" stopColor="#2F6A4F" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#2F6A4F" stopOpacity="0.08" />
            </linearGradient>

            <linearGradient id="bgLinesGradGold" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D8C18A" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#D8C18A" stopOpacity="0.44" />
              <stop offset="100%" stopColor="#D8C18A" stopOpacity="0.10" />
            </linearGradient>

            <linearGradient id="bgLinesGradForest" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#254B3B" stopOpacity="0.10" />
              <stop offset="50%" stopColor="#254B3B" stopOpacity="0.38" />
              <stop offset="100%" stopColor="#254B3B" stopOpacity="0.08" />
            </linearGradient>
          </defs>

          {/* Animated Wave Paths */}
          <g>
            {backgroundWavePaths.map((wp) => (
              <path
                key={wp.id}
                d={wp.d}
                fill="none"
                stroke={wp.stroke}
                strokeWidth={wp.width}
                className={wp.flowClass}
                opacity={wp.opacity}
              />
            ))}
          </g>
        </svg>
      </div>

      {/* =======================================================================
          4. FLOATING PARTICLES
          Softly-illuminated sage particles floating above liquid-metal field
      ======================================================================= */}
      <div 
        className="absolute inset-0"
        style={{
          transform: `translate3d(${mouseOffset.x * 0.65}px, ${mouseOffset.y * 0.45}px, 0)`,
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {visibleParticles.map(p => (
          <div
            key={p.id}
            className={`absolute rounded-full bg-sage ${p.animType === 1 ? 'ambient-particle-1' : 'ambient-particle-2'}`}
            style={{
              left: p.left,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              boxShadow: '0 0 7px rgba(168, 179, 154, 0.45)'
            }}
          />
        ))}
      </div>

      {/* =======================================================================
          5. CONNECTING LINES & NODES
          Delicate geometric lines with small nodes that gently illuminate
      ======================================================================= */}
      <div 
        className={`absolute inset-0 transition-opacity duration-700 ${config.linesOpacity}`}
        style={{
          transform: `translate3d(${mouseOffset.x * 0.18}px, ${mouseOffset.y * 0.12}px, 0)`,
          transition: 'transform 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 700ms ease'
        }}
      >
        <svg
          viewBox="0 0 1200 800"
          className="w-full h-full"
          preserveAspectRatio="none"
        >
          {/* Top-Right Financial Constellation */}
          <g stroke="#8E9A80" strokeWidth="1" strokeDasharray="3 4" opacity="0.55" fill="none">
            <line x1="880" y1="90" x2="1020" y2="150" />
            <line x1="1020" y1="150" x2="1140" y2="110" />
            <line x1="1020" y1="150" x2="980" y2="240" />
            <line x1="980" y1="240" x2="1100" y2="280" />
            <line x1="1100" y1="280" x2="1160" y2="230" />
          </g>

          <circle cx="880" cy="90" r="3" fill="#A8B39A" className="node-pulse-1" />
          <circle cx="1020" cy="150" r="3.5" fill="#254B3B" className="node-pulse-2" />
          <circle cx="1140" cy="110" r="2.5" fill="#A8B39A" className="node-pulse-3" />
          <circle cx="980" cy="240" r="3.5" fill="#397A57" className="node-pulse-1" />
          <circle cx="1100" cy="280" r="2.5" fill="#A8B39A" className="node-pulse-2" />
          <circle cx="1160" cy="230" r="3" fill="#2F6A4F" className="node-pulse-3" />

          {/* Bottom-Left Economic Growth Trace */}
          <g stroke="#BAC3AF" strokeWidth="1" strokeDasharray="4 6" opacity="0.45" fill="none">
            <line x1="90" y1="620" x2="220" y2="570" />
            <line x1="220" y1="570" x2="310" y2="640" />
            <line x1="310" y1="640" x2="420" y2="590" />
            <line x1="420" y1="590" x2="510" y2="650" />
          </g>
          <circle cx="90" cy="620" r="2.5" fill="#A8B39A" className="node-pulse-2" />
          <circle cx="220" cy="570" r="3" fill="#254B3B" className="node-pulse-1" />
          <circle cx="310" cy="640" r="2.5" fill="#A8B39A" className="node-pulse-3" />
          <circle cx="420" cy="590" r="3" fill="#397A57" className="node-pulse-2" />
          <circle cx="510" cy="650" r="2.5" fill="#A8B39A" className="node-pulse-1" />
        </svg>
      </div>
    </div>
  );
}
