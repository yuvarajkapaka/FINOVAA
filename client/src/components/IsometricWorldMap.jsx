import React, { useState } from 'react';
import { 
  Building2, 
  Vault, 
  GraduationCap, 
  TrendingUp, 
  BarChart3,
  ArrowRight,
  Sparkles,
  MapPin,
  CheckCircle2,
  Compass,
  Layers,
  Info
} from 'lucide-react';

export default function IsometricWorldMap({
  selectedDistrictId,
  onSelectDistrict,
  onEnterDistrict,
  wallet,
  goalsData,
  portfolioData,
  lessonsData
}) {
  const [hoveredDistrictId, setHoveredDistrictId] = useState(null);

  // Authoritative live data telemetry
  const availableCashPaise = wallet?.balances?.available_cash_paise || 0;
  const availableCashINR = (availableCashPaise / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 0
  });

  const savingsPaise = wallet?.balances?.savings_balance_paise || 0;
  const savingsINR = (savingsPaise / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 0
  });

  const portfolioValueINR = portfolioData?.valuation?.formatted_market_value || '₹0';
  const holdingsCount = portfolioData?.holdings?.length || 0;
  const completedLessons = lessonsData?.progress?.completed_lessons_count || 0;
  const totalLessons = lessonsData?.progress?.total_lessons_count || 15;
  const marketCycle = portfolioData?.current_cycle || 1;

  const emergencyGoal = goalsData?.goals?.find(g => g.is_emergency_fund);
  const emergencyCoverageMonths = emergencyGoal?.target_paise > 0 
    ? ((emergencyGoal.current_paise / emergencyGoal.target_paise) * 6).toFixed(1) 
    : '0.0';

  // District metadata definition
  const districts = [
    {
      id: 'WALLET',
      districtNumber: '01',
      name: 'Money Center',
      subtitle: 'Income & Expenses',
      icon: Building2,
      badge: `₹${availableCashINR} Available`,
      subBadge: 'Available Money',
      theme: 'forest',
      color: '#254B3B',
      accentColor: '#397A57',
      beaconX: 205,
      beaconY: 260,
      pinX: 205,
      pinY: 300,
      description: 'Manage your income, expenses, and available money.'
    },
    {
      id: 'SAVINGS',
      districtNumber: '02',
      name: 'Savings Center',
      subtitle: 'Emergencies & Goals',
      icon: Vault,
      badge: `₹${savingsINR} Saved`,
      subBadge: `${emergencyCoverageMonths} Mo. Emergency Coverage`,
      theme: 'olive',
      color: '#777F59',
      accentColor: '#A8B39A',
      beaconX: 330,
      beaconY: 105,
      pinX: 330,
      pinY: 155,
      description: 'Save for emergencies and future goals.'
    },
    {
      id: 'ACADEMY',
      districtNumber: '03',
      name: 'Learning Center',
      subtitle: 'Lessons & Quizzes',
      icon: GraduationCap,
      badge: `${completedLessons}/${totalLessons} Completed`,
      subBadge: 'Lessons Completed',
      theme: 'forest',
      color: '#254B3B',
      accentColor: '#D8C18A',
      beaconX: 715,
      beaconY: 105,
      pinX: 715,
      pinY: 155,
      description: 'Learn about money through lessons and quizzes.'
    },
    {
      id: 'MARKET',
      districtNumber: '04',
      name: 'Investment Center',
      subtitle: 'Virtual Investments',
      icon: TrendingUp,
      badge: `${portfolioValueINR} Value`,
      subBadge: `${holdingsCount} Investments Owned`,
      theme: 'copper',
      color: '#C87952',
      accentColor: '#DF936C',
      beaconX: 810,
      beaconY: 260,
      pinX: 810,
      pinY: 305,
      description: 'Explore virtual investments and learn how they work.'
    },
    {
      id: 'SIMULATION',
      districtNumber: '05',
      name: 'Challenge Center',
      subtitle: 'Money Problems & Choices',
      icon: BarChart3,
      badge: '5 Challenges',
      subBadge: 'Zero Risk Simulation',
      theme: 'gold',
      color: '#254B3B',
      accentColor: '#D8C18A',
      beaconX: 500,
      beaconY: 360,
      pinX: 500,
      pinY: 410,
      description: 'Solve money problems and compare your choices.'
    }
  ];

  const activeDistrict = districts.find(d => d.id === selectedDistrictId) || districts[0];
  const hoveredDistrict = districts.find(d => d.id === hoveredDistrictId);

  const getBuildingTransform = (id) => {
    const isSelected = selectedDistrictId === id;
    const isHovered = hoveredDistrictId === id;
    const y = (isSelected ? -12 : 0) + (isHovered ? -7 : 0);
    return `translate(0, ${y})`;
  };

  const getBuildingFilter = (id, theme) => {
    const isSelected = selectedDistrictId === id;
    const isHovered = hoveredDistrictId === id;
    if (isSelected && isHovered) {
      return theme === 'copper' 
        ? 'url(#copperElevate) brightness(1.06)' 
        : 'url(#districtElevate) brightness(1.06)';
    }
    if (isSelected) {
      return theme === 'copper' ? 'url(#copperElevate)' : 'url(#districtElevate)';
    }
    if (isHovered) {
      return 'brightness(1.08) drop-shadow(0 6px 8px rgba(37,75,59,0.22))';
    }
    return undefined;
  };

  return (
    <div className="relative bg-canvas-white border border-edge rounded-3xl p-4 sm:p-7 shadow-sm overflow-hidden select-none space-y-5">
      {/* =========================================================================
          TOP METROPOLITAN CONTROLS & STATUS BAR
      ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-edge">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-xl bg-forest/10 border border-forest/20 flex items-center justify-center text-forest">
            <Compass className="w-4 h-4 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-serif text-base sm:text-lg font-bold text-ink">
                Metropolitan Economic World
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest text-canvas-white uppercase font-mono tracking-wider">
                Cycle #{marketCycle}
              </span>
            </div>
            <p className="text-xs text-ink-muted">
              Explore interconnected districts to direct liquidity, fortify vaults, and build strategic resilience.
            </p>
          </div>
        </div>

        {/* Legend / Focus Guide */}
        <div className="flex items-center space-x-2 text-xs">
          <span className="text-ink-muted hidden md:inline">Selected District:</span>
          <div className="px-3 py-1.5 rounded-xl bg-forest/10 border border-forest/20 text-forest font-semibold text-xs flex items-center space-x-1.5">
            <activeDistrict.icon className="w-3.5 h-3.5" />
            <span>{activeDistrict.districtNumber} • {activeDistrict.name}</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          COHESIVE ISOMETRIC CITY CANVAS (EXPANSIVE & CONNECTED)
      ========================================================================= */}
      <div className="w-full relative aspect-[16/9] min-h-[360px] max-h-[560px] bg-[#EDE9DE] rounded-2xl border border-edge overflow-hidden flex items-center justify-center shadow-inner">
        <svg 
          viewBox="0 0 1000 560" 
          className="w-full h-full object-contain filter drop-shadow-sm transition-all duration-300"
        >
          <defs>
            {/* Soft Ambient Landscape Shadows */}
            <filter id="cityShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="16" stdDeviation="16" floodColor="#1C2E24" floodOpacity="0.12" />
            </filter>
            
            {/* District Elevation Highlight */}
            <filter id="districtElevate" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#254B3B" floodOpacity="0.30" />
            </filter>

            <filter id="copperElevate" x="-25%" y="-25%" width="150%" height="150%">
              <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#C87952" floodOpacity="0.35" />
            </filter>

            {/* Subtle Pavement Grid Pattern */}
            <pattern id="plazaCobble" width="16" height="9" patternUnits="userSpaceOnUse">
              <path d="M 0 4.5 L 8 0 L 16 4.5 L 8 9 Z" fill="none" stroke="#D7D3C5" strokeWidth="0.5" strokeOpacity="0.6" />
            </pattern>

            {/* River Water Texture Linear Gradient */}
            <linearGradient id="riverWater" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#7DA197" />
              <stop offset="50%" stopColor="#89ADA3" />
              <stop offset="100%" stopColor="#6E9288" />
            </linearGradient>

            {/* Plateau Terrace Cliff Gradient */}
            <linearGradient id="cliffWall" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#CBC5B4" />
              <stop offset="100%" stopColor="#AFA998" />
            </linearGradient>

            {/* Copper Pavilion Roof Gradient */}
            <linearGradient id="copperRoof" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#DF936C" />
              <stop offset="50%" stopColor="#C87952" />
              <stop offset="100%" stopColor="#A85A34" />
            </linearGradient>

            {/* Classical Forest Green Slate Roof Gradient */}
            <linearGradient id="slateRoof" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#315F4B" />
              <stop offset="100%" stopColor="#1C382C" />
            </linearGradient>

            {/* Roadway & Building Selection Glow */}
            <filter id="roadGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="0" stdDeviation="5" floodColor="#254B3B" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* =====================================================================
              LAYER 0: ATMOSPHERIC AMBIENT CLOUDS (SLOW & REFINED)
          ===================================================================== */}
          <g pointerEvents="none" opacity="0.4">
            <g className="cloud-drift-1">
              <path 
                d="M 170 55 Q 190 40 215 50 Q 235 42 255 52 Q 268 60 258 70 Q 242 78 220 76 Q 190 77 175 67 Z" 
                fill="#FFFFFF" 
                opacity="0.65" 
              />
            </g>
            <g className="cloud-drift-2">
              <path 
                d="M 710 45 Q 730 32 755 42 Q 775 35 795 46 Q 810 54 800 64 Q 785 72 760 70 Q 730 71 716 62 Z" 
                fill="#FFFFFF" 
                opacity="0.55" 
              />
            </g>
          </g>

          {/* =====================================================================
              LAYER 1: SOLID GROUND PLATEAU & TERRACED CLIFFS (ELEVATED CONTINENT)
          ===================================================================== */}
          {/* Ground Ambient Drop Shadow */}
          <polygon 
            points="120,280 320,100 700,100 900,280 780,470 240,470" 
            fill="#DDD8C8" 
            filter="url(#cityShadow)" 
          />

          {/* Lower Stone Cliff Retaining Walls (3D Terrain Extrusion) */}
          <polygon 
            points="120,280 120,305 240,495 780,495 900,305 900,280 780,470 240,470" 
            fill="url(#cliffWall)" 
            stroke="#999382" 
            strokeWidth="1.5" 
          />
          {/* Terraced Rock Strata Accent Lines */}
          <line x1="120" y1="292" x2="240" y2="482" stroke="#8E8877" strokeWidth="1" strokeDasharray="6 8" />
          <line x1="240" y1="482" x2="780" y2="482" stroke="#8E8877" strokeWidth="1" strokeDasharray="12 12" />
          <line x1="780" y1="482" x2="900" y2="292" stroke="#8E8877" strokeWidth="1" strokeDasharray="6 8" />

          {/* Plateau Upper Landscape Bed (Muted Sage Greens) */}
          <polygon 
            points="120,280 320,100 700,100 900,280 780,470 240,470" 
            fill="#D4DCBF" 
            stroke="#BCBEB2" 
            strokeWidth="1.5" 
          />

          {/* Manicured Park Groves & Terraced Lawns */}
          <polygon points="150,270 260,170 340,240 220,340" fill="#CAD5B2" opacity="0.9" />
          <polygon points="680,130 820,220 760,280 620,190" fill="#CAD5B2" opacity="0.9" />
          <polygon points="260,400 400,450 440,390 300,340" fill="#CAD5B2" opacity="0.8" />
          <polygon points="600,400 740,450 780,380 640,340" fill="#CAD5B2" opacity="0.8" />

          {/* =====================================================================
              LAYER 2: CANAL WATERWAY & QUAY WALLS
          ===================================================================== */}
          {/* Meandering River Canal Channel (Passing between North and South) */}
          <path 
            d="M 390 100 Q 420 180 440 230 Q 470 300 530 350 Q 590 400 640 470 L 590 470 Q 540 400 480 350 Q 420 300 390 230 Q 370 180 340 100 Z" 
            fill="url(#riverWater)" 
            stroke="#5D8076" 
            strokeWidth="1" 
          />
          {/* Subtle Water Ripples with Slow Environmental Drift */}
          <g className="water-drift">
            <path d="M 370 150 Q 380 155 390 150" stroke="#A9C7BE" strokeWidth="1.2" fill="none" opacity="0.75" />
            <path d="M 430 250 Q 445 255 460 250" stroke="#A9C7BE" strokeWidth="1.2" fill="none" opacity="0.75" />
            <path d="M 520 340 Q 535 345 550 340" stroke="#A9C7BE" strokeWidth="1.2" fill="none" opacity="0.75" />
            <path d="M 580 430 Q 595 435 610 430" stroke="#A9C7BE" strokeWidth="1.2" fill="none" opacity="0.75" />
          </g>

          {/* Stone Arch Bridge 1: Reserve to Capital Accessway */}
          <g>
            <polygon points="360,200 420,240 405,252 345,212" fill="#E2DDD0" stroke="#A6A192" strokeWidth="1" />
            <polygon points="360,200 345,212 345,218 360,206" fill="#BDB7A6" />
            <polygon points="420,240 405,252 405,258 420,246" fill="#BDB7A6" />
            {/* Parapet Railings */}
            <line x1="360" y1="198" x2="420" y2="238" stroke="#777F59" strokeWidth="2" />
            <line x1="345" y1="210" x2="405" y2="250" stroke="#777F59" strokeWidth="2" />
          </g>

          {/* Stone Arch Bridge 2: Knowledge to Concourse Promenade */}
          <g>
            <polygon points="530,285 590,325 575,337 515,297" fill="#E2DDD0" stroke="#A6A192" strokeWidth="1" />
            <polygon points="530,285 515,297 515,303 530,291" fill="#BDB7A6" />
            <polygon points="590,325 575,337 575,343 590,331" fill="#BDB7A6" />
            {/* Parapet Railings */}
            <line x1="530" y1="283" x2="590" y2="323" stroke="#254B3B" strokeWidth="2" />
            <line x1="515" y1="295" x2="575" y2="335" stroke="#254B3B" strokeWidth="2" />
          </g>

          {/* =====================================================================
              LAYER 3: INTERCONNECTED ARTERIAL BOULEVARDS & PAVED SQUARES
          ===================================================================== */}
          {/* Main Paved Boulevards & Plaza Foundations */}
          <polygon points="170,300 240,260 300,300 230,340" fill="#E8E4D7" stroke="#D3CEBF" strokeWidth="1" />
          <polygon points="300,160 360,120 420,160 360,200" fill="#E8E4D7" stroke="#D3CEBF" strokeWidth="1" />
          <polygon points="660,160 740,120 800,160 720,200" fill="#E8E4D7" stroke="#D3CEBF" strokeWidth="1" />
          <polygon points="740,300 830,250 890,290 800,340" fill="#E8E4D7" stroke="#D3CEBF" strokeWidth="1" />
          
          {/* Grand Central Concourse Plaza (Crossroads) */}
          <polygon points="440,340 560,340 600,390 400,390" fill="#E6E0D0" stroke="#CCC6B4" strokeWidth="1.5" />
          <rect x="440" y="345" width="120" height="40" fill="url(#plazaCobble)" opacity="0.6" />

          {/* Interconnecting Road Network (Physically Connecting All 5 Districts) */}
          <g stroke="#C6C0AE" strokeWidth="6" strokeLinecap="round" fill="none">
            {/* Capital District (205, 300) to Concourse (480, 365) */}
            <path d="M 230 310 L 440 365" />
            {/* Reserve Citadel (330, 160) through Bridge 1 to Concourse */}
            <path d="M 360 160 L 380 215 L 450 350" />
            {/* Knowledge Campus (720, 160) through Bridge 2 to Concourse */}
            <path d="M 720 160 L 560 305 L 530 355" />
            {/* Investment Exchange (810, 310) to Concourse */}
            <path d="M 770 305 L 580 365" />
            {/* Concourse to Decision Lab Observatory (500, 410) */}
            <path d="M 500 375 L 500 410" />
            {/* Peripheral Boulevard linking Capital and Reserve */}
            <path d="M 205 270 L 300 160" />
            {/* Northern Scholar's Way linking Reserve and Knowledge */}
            <path d="M 400 140 L 670 140" strokeDasharray="5 5" strokeWidth="4" />
            {/* Exchange Ring connecting Knowledge to Market */}
            <path d="M 750 170 L 810 270" />
          </g>

          {/* Roadway Centerline Markings (Dynamic Active Path Highlighting with Smooth 280ms Transition) */}
          <g 
            stroke={selectedDistrictId ? '#254B3B' : '#999485'} 
            strokeWidth="1.5" 
            strokeDasharray="4 4" 
            fill="none" 
            opacity="0.8"
          >
            {/* Highlighted Arteries Connected to Active District */}
            <path 
              d="M 230 310 L 440 365" 
              stroke={selectedDistrictId === 'WALLET' ? '#397A57' : '#999485'} 
              strokeWidth={selectedDistrictId === 'WALLET' ? '3' : '1.5'} 
              style={{ transition: 'stroke 280ms ease, stroke-width 280ms ease' }}
            />
            <path 
              d="M 360 160 L 380 215 L 450 350" 
              stroke={selectedDistrictId === 'SAVINGS' ? '#777F59' : '#999485'} 
              strokeWidth={selectedDistrictId === 'SAVINGS' ? '3' : '1.5'} 
              style={{ transition: 'stroke 280ms ease, stroke-width 280ms ease' }}
            />
            <path 
              d="M 720 160 L 560 305 L 530 355" 
              stroke={selectedDistrictId === 'ACADEMY' ? '#D8C18A' : '#999485'} 
              strokeWidth={selectedDistrictId === 'ACADEMY' ? '3' : '1.5'} 
              style={{ transition: 'stroke 280ms ease, stroke-width 280ms ease' }}
            />
            <path 
              d="M 770 305 L 580 365" 
              stroke={selectedDistrictId === 'MARKET' ? '#C87952' : '#999485'} 
              strokeWidth={selectedDistrictId === 'MARKET' ? '3' : '1.5'} 
              style={{ transition: 'stroke 280ms ease, stroke-width 280ms ease' }}
            />
            <path 
              d="M 500 375 L 500 410" 
              stroke={selectedDistrictId === 'SIMULATION' ? '#397A57' : '#999485'} 
              strokeWidth={selectedDistrictId === 'SIMULATION' ? '3' : '1.5'} 
              style={{ transition: 'stroke 280ms ease, stroke-width 280ms ease' }}
            />
          </g>

          {/* Active District Road Glow Highlight Overlay (Smooth 300ms Illumination Transition) */}
          <g fill="none">
            <path 
              d="M 230 310 L 440 365" 
              stroke="#397A57" 
              strokeWidth="5" 
              strokeLinecap="round" 
              opacity={selectedDistrictId === 'WALLET' ? 0.85 : 0} 
              filter="url(#roadGlow)" 
              style={{ transition: 'opacity 300ms ease' }}
            />
            <path 
              d="M 360 160 L 380 215 L 450 350" 
              stroke="#777F59" 
              strokeWidth="5" 
              strokeLinecap="round" 
              opacity={selectedDistrictId === 'SAVINGS' ? 0.85 : 0} 
              filter="url(#roadGlow)" 
              style={{ transition: 'opacity 300ms ease' }}
            />
            <path 
              d="M 720 160 L 560 305 L 530 355" 
              stroke="#254B3B" 
              strokeWidth="5" 
              strokeLinecap="round" 
              opacity={selectedDistrictId === 'ACADEMY' ? 0.85 : 0} 
              filter="url(#roadGlow)" 
              style={{ transition: 'opacity 300ms ease' }}
            />
            <path 
              d="M 770 305 L 580 365" 
              stroke="#C87952" 
              strokeWidth="5" 
              strokeLinecap="round" 
              opacity={selectedDistrictId === 'MARKET' ? 0.85 : 0} 
              filter="url(#roadGlow)" 
              style={{ transition: 'opacity 300ms ease' }}
            />
            <path 
              d="M 500 375 L 500 410" 
              stroke="#254B3B" 
              strokeWidth="5" 
              strokeLinecap="round" 
              opacity={selectedDistrictId === 'SIMULATION' ? 0.85 : 0} 
              filter="url(#roadGlow)" 
              style={{ transition: 'opacity 300ms ease' }}
            />
          </g>

          {/* Traveling Light Pulse Along Active Road Towards District */}
          <g fill="none" pointerEvents="none">
            <path 
              d="M 440 365 L 230 310" 
              stroke="#D8C18A" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeDasharray="10 26"
              className={selectedDistrictId === 'WALLET' ? 'road-light-flow' : ''}
              opacity={selectedDistrictId === 'WALLET' ? 0.95 : 0} 
              style={{ transition: 'opacity 300ms ease' }}
            />
            <path 
              d="M 450 350 L 380 215 L 360 160" 
              stroke="#D8C18A" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeDasharray="10 26"
              className={selectedDistrictId === 'SAVINGS' ? 'road-light-flow' : ''}
              opacity={selectedDistrictId === 'SAVINGS' ? 0.95 : 0} 
              style={{ transition: 'opacity 300ms ease' }}
            />
            <path 
              d="M 530 355 L 560 305 L 720 160" 
              stroke="#D8C18A" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeDasharray="10 26"
              className={selectedDistrictId === 'ACADEMY' ? 'road-light-flow' : ''}
              opacity={selectedDistrictId === 'ACADEMY' ? 0.95 : 0} 
              style={{ transition: 'opacity 300ms ease' }}
            />
            <path 
              d="M 580 365 L 770 305" 
              stroke="#DF936C" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeDasharray="10 26"
              className={selectedDistrictId === 'MARKET' ? 'road-light-flow' : ''}
              opacity={selectedDistrictId === 'MARKET' ? 0.95 : 0} 
              style={{ transition: 'opacity 300ms ease' }}
            />
            <path 
              d="M 500 375 L 500 410" 
              stroke="#D8C18A" 
              strokeWidth="3.5" 
              strokeLinecap="round" 
              strokeDasharray="10 26"
              className={selectedDistrictId === 'SIMULATION' ? 'road-light-flow' : ''}
              opacity={selectedDistrictId === 'SIMULATION' ? 0.95 : 0} 
              style={{ transition: 'opacity 300ms ease' }}
            />
          </g>

          {/* Active District Selection Base Ground Ring & Expanding Soft Highlight */}
          {activeDistrict && (
            <g pointerEvents="none" style={{ transition: 'opacity 250ms ease' }}>
              {/* Soft Expanding Highlight Beneath Selected Building */}
              <ellipse
                cx={activeDistrict.beaconX}
                cy={activeDistrict.beaconY + 45}
                rx="62"
                ry="32"
                fill={activeDistrict.color}
                className="ground-highlight-pulse"
              />
              <ellipse
                cx={activeDistrict.beaconX}
                cy={activeDistrict.beaconY + 45}
                rx="46"
                ry="24"
                fill="none"
                stroke={activeDistrict.color}
                strokeWidth="2.5"
                strokeDasharray="5 4"
                opacity="0.85"
              />
              <ellipse
                cx={activeDistrict.beaconX}
                cy={activeDistrict.beaconY + 45}
                rx="54"
                ry="28"
                fill="none"
                stroke={activeDistrict.accentColor}
                strokeWidth="1.5"
                opacity="0.45"
              />
            </g>
          )}

          {/* Hovered District Base Ground Marker Highlight */}
          {hoveredDistrict && hoveredDistrict.id !== selectedDistrictId && (
            <g pointerEvents="none" style={{ transition: 'opacity 200ms ease' }}>
              <ellipse
                cx={hoveredDistrict.beaconX}
                cy={hoveredDistrict.beaconY + 45}
                rx="56"
                ry="28"
                fill={hoveredDistrict.color}
                opacity="0.18"
              />
              <ellipse
                cx={hoveredDistrict.beaconX}
                cy={hoveredDistrict.beaconY + 45}
                rx="44"
                ry="22"
                fill="none"
                stroke={hoveredDistrict.color}
                strokeWidth="2"
                strokeDasharray="4 3"
                opacity="0.65"
              />
            </g>
          )}

          {/* Street Trees & Landscaping Accents along Boulevards */}
          {[
            [270, 290], [310, 270], [370, 320], [410, 340],
            [610, 350], [660, 330], [710, 310], [750, 280],
            [480, 270], [620, 230], [670, 200], [330, 230]
          ].map(([tx, ty], i) => (
            <g key={i}>
              <ellipse cx={tx} cy={ty + 4} rx="5" ry="2.5" fill="#1C382C" opacity="0.2" />
              <circle cx={tx} cy={ty} r="4.5" fill="#3D684D" />
              <circle cx={tx - 1} cy={ty - 1.5} r="3" fill="#588569" />
            </g>
          ))}

          {/* =====================================================================
              LAYER 4: DISTRICT ARCHITECTURES (NORTH TO SOUTH Z-ORDERING)
          ===================================================================== */}

          {/* -------------------------------------------------------------------
              DISTRICT 02: RESERVE DISTRICT (CITADEL & SECURE VAULT BASTION)
              Position: North-West (X: 330, Y: 155)
          ------------------------------------------------------------------- */}
          <g 
            id="district-SAVINGS"
            onClick={() => onSelectDistrict('SAVINGS')}
            onMouseEnter={() => setHoveredDistrictId('SAVINGS')}
            onMouseLeave={() => setHoveredDistrictId(null)}
            className="cursor-pointer"
            filter={getBuildingFilter('SAVINGS', 'olive')}
            transform={getBuildingTransform('SAVINGS')}
            opacity={selectedDistrictId && selectedDistrictId !== 'SAVINGS' ? 0.82 : 1}
            style={{ transition: 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease, filter 240ms ease' }}
          >
            {/* Terraced Citadel Base Podium */}
            <polygon 
              points="270,160 330,120 390,160 330,200" 
              fill={selectedDistrictId === 'SAVINGS' ? '#FAF8F2' : '#F0ECE1'} 
              stroke={selectedDistrictId === 'SAVINGS' ? '#777F59' : '#C2BCAE'} 
              strokeWidth={selectedDistrictId === 'SAVINGS' ? '2.5' : '1.5'} 
            />

            {/* Heavy Rusticated Fortress Walls */}
            <polygon points="290,150 330,125 370,150 370,105 330,80 290,105" fill="#E4DFD0" stroke="#777F59" strokeWidth="1.5" />
            {/* Shadow Face */}
            <polygon points="330,125 370,150 370,105 330,80" fill="#CEC7B6" />

            {/* Reinforced Vault Drum (Central Cylinder) */}
            <polygon points="310,105 330,90 350,105 350,75 330,60 310,75" fill={selectedDistrictId === 'SAVINGS' ? '#FFFBEA' : '#F4F1EA'} stroke="#777F59" strokeWidth="1.5" />
            <polygon points="330,90 350,105 350,75 330,60" fill="#DBD5C5" />
            {/* Burnished Bronze Vault Door Cap */}
            <polygon points="305,60 330,42 355,60 330,75" fill="#777F59" stroke="#4C5335" strokeWidth="1.5" />
            
            {/* Heavy Vault Combination Lock Wheel */}
            <circle cx="330" cy="115" r="14" fill={selectedDistrictId === 'SAVINGS' ? '#FFF8E8' : '#EAE5D8'} stroke="#777F59" strokeWidth="2.5" />
            <circle cx="330" cy="115" r="7" fill={selectedDistrictId === 'SAVINGS' ? '#DF936C' : '#C87952'} stroke="#4C5335" strokeWidth="1" />
            {/* Radial Vault Bolt Spokes */}
            <line x1="330" y1="103" x2="330" y2="127" stroke="#777F59" strokeWidth="2" />
            <line x1="318" y1="115" x2="342" y2="115" stroke="#777F59" strokeWidth="2" />
            <circle cx="330" cy="98" r="3" fill={selectedDistrictId === 'SAVINGS' ? '#86EFAC' : '#777F59'} />

            {/* Perimeter Security Hedges */}
            <rect x="280" y="155" width="20" height="6" rx="2" fill="#588569" stroke="#3D684D" />
            <rect x="360" y="155" width="20" height="6" rx="2" fill="#588569" stroke="#3D684D" />

            {/* District Beacon Pin (Positioned High with Zero Architectural Overlap) */}
            <g transform="translate(330, 48)">
              <line x1="0" y1="20" x2="0" y2="38" stroke="#777F59" strokeWidth="2" strokeDasharray="2 2" />
              <rect x="-48" y="0" width="96" height="22" rx="6" fill="#FFFFFF" stroke="#777F59" strokeWidth={selectedDistrictId === 'SAVINGS' ? '2.5' : '1.5'} className="drop-shadow-sm" />
              <circle cx="-35" cy="11" r="5" fill="#777F59" />
              <text x="-35" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold">02</text>
              <text x="6" y="14" textAnchor="middle" fill="#252923" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                Reserve Citadel
              </text>
              {/* Telemetry Indicator Pill */}
              <rect x="-38" y="24" width="76" height="15" rx="4" fill="#777F59" />
              <text x="0" y="34.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="600" fontFamily="monospace">
                ₹{savingsINR} Vault
              </text>
            </g>
          </g>

          {/* -------------------------------------------------------------------
              DISTRICT 03: KNOWLEDGE DISTRICT (ACADEMY QUADRANGLE & SPIRE)
              Position: North-East (X: 715, Y: 155)
          ------------------------------------------------------------------- */}
          <g 
            id="district-ACADEMY"
            onClick={() => onSelectDistrict('ACADEMY')}
            onMouseEnter={() => setHoveredDistrictId('ACADEMY')}
            onMouseLeave={() => setHoveredDistrictId(null)}
            className="cursor-pointer"
            filter={getBuildingFilter('ACADEMY', 'forest')}
            transform={getBuildingTransform('ACADEMY')}
            opacity={selectedDistrictId && selectedDistrictId !== 'ACADEMY' ? 0.82 : 1}
            style={{ transition: 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease, filter 240ms ease' }}
          >
            {/* Academic Quadrangle Terrace */}
            <polygon 
              points="650,160 715,120 780,160 715,200" 
              fill={selectedDistrictId === 'ACADEMY' ? '#FAF8F2' : '#F0ECE1'} 
              stroke={selectedDistrictId === 'ACADEMY' ? '#254B3B' : '#C2BCAE'} 
              strokeWidth={selectedDistrictId === 'ACADEMY' ? '2.5' : '1.5'} 
            />

            {/* University Library Wings (Collegiate U-Shape) */}
            <polygon points="665,145 695,125 715,140 715,110 695,95 665,110" fill="#FFFFFF" stroke="#254B3B" strokeWidth="1.5" />
            <polygon points="715,140 735,125 765,145 765,110 735,95 715,110" fill="#E6E0D2" stroke="#254B3B" strokeWidth="1.5" />

            {/* Central Great Hall & Tower */}
            <polygon points="695,125 715,110 735,125 735,70 715,55 695,70" fill={selectedDistrictId === 'ACADEMY' ? '#FFFBEA' : '#F4F1EA'} stroke="#254B3B" strokeWidth="1.5" />
            <polygon points="715,110 735,125 735,70 715,55" fill="#DBD4C4" />

            {/* Clock Tower Observatory & Spire with Gold Crown */}
            <polygon points="705,55 715,40 725,55" fill="#D8C18A" stroke="#254B3B" strokeWidth="1" />
            <line x1="715" y1="40" x2="715" y2="24" stroke="#254B3B" strokeWidth="2" />
            <circle cx="715" cy="22" r="3.5" fill="#D8C18A" stroke="#254B3B" strokeWidth="1" />

            {/* Clerestory Arched Windows with Warm Illumination */}
            <path d="M 678 120 Q 683 114 688 120" stroke={selectedDistrictId === 'ACADEMY' ? '#C87952' : '#254B3B'} strokeWidth="1.8" fill={selectedDistrictId === 'ACADEMY' ? '#FFE8A3' : 'none'} />
            <path d="M 742 120 Q 747 114 752 120" stroke={selectedDistrictId === 'ACADEMY' ? '#C87952' : '#254B3B'} strokeWidth="1.8" fill={selectedDistrictId === 'ACADEMY' ? '#FFE8A3' : 'none'} />
            <circle cx="715" cy="80" r="5" fill={selectedDistrictId === 'ACADEMY' ? '#FFE082' : '#EAE5D8'} stroke="#254B3B" strokeWidth="1" />

            {/* Quadrangle Scholars' Garden Courtyard */}
            <polygon points="700,155 715,145 730,155 715,165" fill="#588569" stroke="#3D684D" />
            <circle cx="715" cy="155" r="2.5" fill="#7DA197" />

            {/* District Beacon Pin (Positioned Above Academy with Zero Facade Collision) */}
            <g transform="translate(715, 48)">
              <line x1="0" y1="20" x2="0" y2="38" stroke="#254B3B" strokeWidth="2" strokeDasharray="2 2" />
              <rect x="-50" y="0" width="100" height="22" rx="6" fill="#FFFFFF" stroke="#254B3B" strokeWidth={selectedDistrictId === 'ACADEMY' ? '2.5' : '1.5'} className="drop-shadow-sm" />
              <circle cx="-37" cy="11" r="5" fill="#254B3B" />
              <text x="-37" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold">03</text>
              <text x="7" y="14" textAnchor="middle" fill="#252923" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                Knowledge Center
              </text>
              {/* Telemetry Indicator Pill */}
              <rect x="-44" y="24" width="88" height="15" rx="4" fill="#254B3B" />
              <text x="0" y="34.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="600" fontFamily="monospace">
                {completedLessons}/{totalLessons} Mastered
              </text>
            </g>
          </g>

          {/* -------------------------------------------------------------------
              DISTRICT 01: CAPITAL DISTRICT (CENTRAL TREASURY HEADQUARTERS)
              Position: West / Center-Left (X: 205, Y: 300)
          ------------------------------------------------------------------- */}
          <g 
            id="district-WALLET"
            onClick={() => onSelectDistrict('WALLET')}
            onMouseEnter={() => setHoveredDistrictId('WALLET')}
            onMouseLeave={() => setHoveredDistrictId(null)}
            className="cursor-pointer"
            filter={getBuildingFilter('WALLET', 'forest')}
            transform={getBuildingTransform('WALLET')}
            opacity={selectedDistrictId && selectedDistrictId !== 'WALLET' ? 0.82 : 1}
            style={{ transition: 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease, filter 240ms ease' }}
          >
            {/* Grand Treasury Plaza Terrace */}
            <polygon 
              points="140,300 205,255 270,300 205,345" 
              fill={selectedDistrictId === 'WALLET' ? '#FAF8F2' : '#F0ECE1'} 
              stroke={selectedDistrictId === 'WALLET' ? '#254B3B' : '#C2BCAE'} 
              strokeWidth={selectedDistrictId === 'WALLET' ? '2.5' : '1.5'} 
            />

            {/* Treasury Grand Staircase Podium */}
            <polygon points="175,290 205,270 235,290 205,310" fill="#E2DDD0" stroke="#254B3B" strokeWidth="1" />

            {/* Classical Headquarters Facade Cube */}
            <polygon points="160,270 205,240 250,270 250,210 205,180 160,210" fill="#FFFFFF" stroke="#254B3B" strokeWidth="1.5" />
            {/* Shaded Eastern Wing */}
            <polygon points="205,240 250,270 250,210 205,180" fill="#E4DDD0" stroke="#254B3B" strokeWidth="1.5" />

            {/* Neoclassical Pediment & Green Copper Roof */}
            <polygon points="155,210 205,170 255,210" fill="url(#slateRoof)" stroke="#1C382C" strokeWidth="1.5" />
            <polygon points="160,210 205,180 250,210" fill="#315F4B" opacity="0.8" />

            {/* Six Classical Portico Columns & Illuminated Window Bays */}
            <rect x="177" y="224" width="7" height="12" rx="1" fill={selectedDistrictId === 'WALLET' ? '#FFF8E1' : '#EAE5D8'} opacity="0.85" />
            <rect x="223" y="224" width="7" height="12" rx="1" fill={selectedDistrictId === 'WALLET' ? '#FFF8E1' : '#EAE5D8'} opacity="0.85" />
            <line x1="175" y1="220" x2="175" y2="255" stroke="#777F59" strokeWidth="2.5" />
            <line x1="188" y1="212" x2="188" y2="248" stroke="#777F59" strokeWidth="2.5" />
            <line x1="205" y1="202" x2="205" y2="240" stroke="#777F59" strokeWidth="3" />
            <line x1="222" y1="212" x2="222" y2="248" stroke="#777F59" strokeWidth="2.5" />
            <line x1="235" y1="220" x2="235" y2="255" stroke="#777F59" strokeWidth="2.5" />

            {/* Grand Entrance Bronze Doors */}
            <polygon points="198,245 205,240 212,245 212,260 205,265 198,260" fill={selectedDistrictId === 'WALLET' ? '#DF936C' : '#C87952'} stroke="#1C382C" />

            {/* Treasury Plaza Fountain Basin */}
            <circle cx="205" cy="325" r="9" fill="#7DA197" stroke="#254B3B" strokeWidth="1.5" />
            <circle cx="205" cy="325" r="3.5" fill="#EAE5D8" />

            {/* District Beacon Pin (Positioned with Elevated Clarity) */}
            <g transform="translate(205, 190)">
              <line x1="0" y1="20" x2="0" y2="38" stroke="#254B3B" strokeWidth="2" strokeDasharray="2 2" />
              <rect x="-48" y="0" width="96" height="22" rx="6" fill="#FFFFFF" stroke="#254B3B" strokeWidth={selectedDistrictId === 'WALLET' ? '2.5' : '1.5'} className="drop-shadow-sm" />
              <circle cx="-35" cy="11" r="5" fill="#254B3B" />
              <text x="-35" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold">01</text>
              <text x="6" y="14" textAnchor="middle" fill="#252923" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                Capital District
              </text>
              {/* Telemetry Indicator Pill */}
              <rect x="-38" y="24" width="76" height="15" rx="4" fill="#254B3B" />
              <text x="0" y="34.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="600" fontFamily="monospace">
                ₹{availableCashINR} Cash
              </text>
            </g>
          </g>

          {/* -------------------------------------------------------------------
              DISTRICT 04: INVESTMENT EXCHANGE (CAPITAL MARKET BOURSE & TOWERS)
              Position: East / Center-Right (X: 810, Y: 305)
          ------------------------------------------------------------------- */}
          <g 
            id="district-MARKET"
            onClick={() => onSelectDistrict('MARKET')}
            onMouseEnter={() => setHoveredDistrictId('MARKET')}
            onMouseLeave={() => setHoveredDistrictId(null)}
            className="cursor-pointer"
            filter={getBuildingFilter('MARKET', 'copper')}
            transform={getBuildingTransform('MARKET')}
            opacity={selectedDistrictId && selectedDistrictId !== 'MARKET' ? 0.82 : 1}
            style={{ transition: 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease, filter 240ms ease' }}
          >
            {/* Exchange Market Plaza Terrace */}
            <polygon 
              points="745,305 810,260 875,305 810,350" 
              fill={selectedDistrictId === 'MARKET' ? '#FFF9F5' : '#F0ECE1'} 
              stroke={selectedDistrictId === 'MARKET' ? '#C87952' : '#C2BCAE'} 
              strokeWidth={selectedDistrictId === 'MARKET' ? '2.5' : '1.5'} 
            />

            {/* Stepped Art-Deco Exchange Hall */}
            {/* Tower Tier 1 (Base Pavilion) */}
            <polygon points="770,285 810,260 850,285 850,230 810,205 770,230" fill="#FFFFFF" stroke="#C87952" strokeWidth="1.5" />
            <polygon points="810,260 850,285 850,230 810,205" fill="#F0E5DC" stroke="#C87952" strokeWidth="1.5" />

            {/* Tower Tier 2 (Elevated Central Trading Spine) */}
            <polygon points="785,220 810,200 835,220 835,165 810,145 785,165" fill={selectedDistrictId === 'MARKET' ? '#FFF5EE' : '#F4EFEB'} stroke="#C87952" strokeWidth="1.5" />
            <polygon points="810,200 835,220 835,165 810,145" fill="#E6D3C8" stroke="#C87952" strokeWidth="1.5" />

            {/* Stepped Warm Copper Pyramid Roof */}
            <polygon points="780,165 810,140 840,165" fill="url(#copperRoof)" stroke="#A85A34" strokeWidth="1.5" />
            <polygon points="795,140 810,125 825,140" fill="#DF936C" stroke="#A85A34" strokeWidth="1" />

            {/* Translucent Glass Atrium Skylights & Market Ticker Frieze */}
            <line x1="785" y1="210" x2="835" y2="210" stroke={selectedDistrictId === 'MARKET' ? '#DF936C' : '#C87952'} strokeWidth={selectedDistrictId === 'MARKET' ? '3.5' : '2.5'} />
            {/* Simulated Upward Bull Market Relief Line with Glow */}
            <path d="M 780 255 L 795 245 L 810 250 L 835 225" fill="none" stroke={selectedDistrictId === 'MARKET' ? '#4ADE80' : '#397A57'} strokeWidth={selectedDistrictId === 'MARKET' ? '2.8' : '2'} strokeLinecap="round" />

            {/* Trading Plaza Market Stalls */}
            <rect x="760" y="295" width="12" height="7" rx="1.5" fill="#C87952" opacity="0.8" />
            <rect x="840" y="295" width="12" height="7" rx="1.5" fill="#777F59" opacity="0.8" />

            {/* District Beacon Pin (Positioned with Clearance Above Ticker Tower) */}
            <g transform="translate(810, 190)">
              <line x1="0" y1="20" x2="0" y2="38" stroke="#C87952" strokeWidth="2" strokeDasharray="2 2" />
              <rect x="-52" y="0" width="104" height="22" rx="6" fill="#FFFFFF" stroke="#C87952" strokeWidth={selectedDistrictId === 'MARKET' ? '2.5' : '1.5'} className="drop-shadow-sm" />
              <circle cx="-39" cy="11" r="5" fill="#C87952" />
              <text x="-39" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold">04</text>
              <text x="8" y="14" textAnchor="middle" fill="#252923" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                Investment Exchange
              </text>
              {/* Telemetry Indicator Pill */}
              <rect x="-44" y="24" width="88" height="15" rx="4" fill="#C87952" />
              <text x="0" y="34.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="600" fontFamily="monospace">
                {portfolioValueINR} Market
              </text>
            </g>
          </g>

          {/* -------------------------------------------------------------------
              DISTRICT 05: DECISION LAB (STRATEGIC OBSERVATORY & COMPASS PROMONTORY)
              Position: South / Center (X: 500, Y: 410)
          ------------------------------------------------------------------- */}
          <g 
            id="district-SIMULATION"
            onClick={() => onSelectDistrict('SIMULATION')}
            onMouseEnter={() => setHoveredDistrictId('SIMULATION')}
            onMouseLeave={() => setHoveredDistrictId(null)}
            className="cursor-pointer"
            filter={getBuildingFilter('SIMULATION', 'gold')}
            transform={getBuildingTransform('SIMULATION')}
            opacity={selectedDistrictId && selectedDistrictId !== 'SIMULATION' ? 0.82 : 1}
            style={{ transition: 'transform 240ms cubic-bezier(0.16, 1, 0.3, 1), opacity 240ms ease, filter 240ms ease' }}
          >
            {/* Hexagonal Observatory Promontory Plaza */}
            <polygon 
              points="430,410 500,365 570,410 500,455" 
              fill={selectedDistrictId === 'SIMULATION' ? '#FAF8F2' : '#F0ECE1'} 
              stroke={selectedDistrictId === 'SIMULATION' ? '#254B3B' : '#C2BCAE'} 
              strokeWidth={selectedDistrictId === 'SIMULATION' ? '2.5' : '1.5'} 
            />

            {/* Observatory Amphitheater Podium */}
            <polygon points="460,395 500,370 540,395 540,345 500,320 460,345" fill="#FFFFFF" stroke="#254B3B" strokeWidth="1.5" />
            <polygon points="500,370 540,395 540,345 500,320" fill="#E4DDD0" stroke="#254B3B" strokeWidth="1.5" />

            {/* Geodesic Celestial Rotunda Dome & Aperture with Warm Amber Glow */}
            <path d="M 470 320 Q 500 275 530 320 Z" fill={selectedDistrictId === 'SIMULATION' ? '#FEE6AA' : '#D8C18A'} stroke="#254B3B" strokeWidth="1.5" />
            {/* Observatory Dome Ribs */}
            <line x1="500" y1="277" x2="500" y2="320" stroke="#254B3B" strokeWidth="1.5" />
            <line x1="485" y1="295" x2="515" y2="295" stroke="#254B3B" strokeWidth="1" />
            {/* Telescope Observation Slit */}
            <line x1="495" y1="285" x2="508" y2="315" stroke={selectedDistrictId === 'SIMULATION' ? '#C87952' : '#1C382C'} strokeWidth="2.5" />
            <circle cx="500" cy="298" r="3" fill={selectedDistrictId === 'SIMULATION' ? '#FFF3D4' : '#EAE5D8'} stroke="#254B3B" strokeWidth="1" />

            {/* Forecourt Strategic Compass Rose (Decision Echo Dial) */}
            <circle cx="500" cy="410" r="15" fill="#EAE5D8" stroke="#254B3B" strokeWidth="1.5" />
            <polygon points="500,398 504,410 500,422 496,410" fill="#C87952" />
            <polygon points="488,410 500,414 512,410 500,406" fill="#D8C18A" />
            <circle cx="500" cy="410" r="2.5" fill="#254B3B" />

            {/* District Beacon Pin (Positioned Cleanly in South Quad) */}
            <g transform="translate(500, 310)">
              <line x1="0" y1="20" x2="0" y2="38" stroke="#254B3B" strokeWidth="2" strokeDasharray="2 2" />
              <rect x="-48" y="0" width="96" height="22" rx="6" fill="#FFFFFF" stroke="#254B3B" strokeWidth={selectedDistrictId === 'SIMULATION' ? '2.5' : '1.5'} className="drop-shadow-sm" />
              <circle cx="-35" cy="11" r="5" fill="#254B3B" />
              <text x="-35" y="14" textAnchor="middle" fill="#FFFFFF" fontSize="7" fontWeight="bold">05</text>
              <text x="6" y="14" textAnchor="middle" fill="#252923" fontSize="9" fontWeight="bold" fontFamily="sans-serif">
                Decision Lab
              </text>
              {/* Telemetry Indicator Pill */}
              <rect x="-40" y="24" width="80" height="15" rx="4" fill="#254B3B" />
              <text x="0" y="34.5" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="600" fontFamily="monospace">
                5 Crisis Shocks
              </text>
            </g>
          </g>
        </svg>
      </div>

      {/* =========================================================================
          INTERACTIVE DISTRICT COMMAND RIBBON (MOBILE & DESKTOP SELECTOR)
      ========================================================================= */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs text-ink-muted px-1">
          <span className="font-serif font-bold uppercase tracking-wider text-[11px] text-ink">
            Economic Districts of FINOVA
          </span>
          <span className="text-[11px] text-ink-subtle hidden sm:inline">
            Click any district to direct capital, review active missions, or enter operations
          </span>
        </div>

        {/* 5 Distinct District Selector Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
          {districts.map((district) => {
            const isSelected = selectedDistrictId === district.id;
            const Icon = district.icon;

            return (
              <div
                key={district.id}
                onClick={() => onSelectDistrict(district.id)}
                className={`p-3 rounded-2xl border text-left transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-canvas-white border-forest shadow-md ring-1 ring-forest/20 -translate-y-1' 
                    : 'bg-canvas-subtle/70 hover:bg-canvas-white border-edge hover:border-forest/50 hover:-translate-y-1 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[10px] font-bold text-ink-subtle">
                      DISTRICT {district.districtNumber}
                    </span>
                    <div className={`p-1.5 rounded-lg transition-colors duration-200 ${
                      isSelected 
                        ? 'bg-forest text-canvas-white' 
                        : 'bg-canvas-white text-ink-muted border border-edge'
                    }`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  <h4 className="font-serif text-xs font-bold text-ink leading-tight">
                    {district.name}
                  </h4>
                  <p className="text-[10px] text-ink-muted mt-0.5 line-clamp-1">
                    {district.subtitle}
                  </p>
                </div>

                <div className="mt-2.5 pt-2 border-t border-edge/60 flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-forest">
                    {district.badge}
                  </span>
                  {isSelected ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEnterDistrict) onEnterDistrict(district.id);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-forest hover:bg-forest-light text-canvas-white text-[10px] font-bold transition flex items-center gap-1 shadow-xs active:scale-95"
                      title={`Enter ${district.name}`}
                    >
                      <span>Enter →</span>
                    </button>
                  ) : (
                    <span className="text-[10px] text-ink-subtle hover:text-ink">
                      Select →
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
