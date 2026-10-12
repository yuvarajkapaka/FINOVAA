import React, { useState, useRef, useEffect } from 'react';
import FinovaLogo from './FinovaLogo';
import { 
  Compass, 
  Building2, 
  Vault, 
  GraduationCap, 
  TrendingUp, 
  BarChart3, 
  Award, 
  Bot, 
  LayoutDashboard, 
  RefreshCw,
  Menu,
  X,
  Target,
  Coins,
  UserCheck,
  ChevronDown
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  onTabChange, 
  wallet,
  literacyScore, 
  completedMissionsCount = 2,
  totalMissionsCount = 5,
  onOpenProfile,
  onRefresh, 
  isRefreshing 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef(null);

  const totalLiteracyPoints = literacyScore?.total_score || 0;

  // Available money (strictly cash, not double-counted with savings or investments)
  const availableCashINR = ((wallet?.balances?.available_cash_paise || 0) / 100).toLocaleString('en-IN', {
    maximumFractionDigits: 0
  });

  // Four Primary Destinations (Desktop Center Section)
  const primaryNavItems = [
    { id: 'WORLD', label: 'World', icon: Compass },
    { id: 'WALLET', label: 'Money', icon: Building2 },
    { id: 'ACADEMY', label: 'Learn', icon: GraduationCap },
    { id: 'SIMULATION', label: 'Challenges', icon: BarChart3 },
  ];

  // Secondary Destinations (Contained inside the "More" dropdown)
  const secondaryNavItems = [
    { 
      id: 'SAVINGS', 
      label: 'Savings Center', 
      icon: Vault, 
      description: 'Save for emergencies and future goals' 
    },
    { 
      id: 'MARKET', 
      label: 'Investment Center', 
      icon: TrendingUp, 
      description: 'Explore virtual investments and how they work' 
    },
    { 
      id: 'SCORE', 
      label: 'Money Skills Score', 
      icon: Award, 
      description: 'Track your progress out of 100 points' 
    },
    { 
      id: 'MENTOR', 
      label: 'AI Mentor', 
      icon: Bot, 
      description: 'Ask questions and get practical guidance' 
    },
    { 
      id: 'OVERVIEW', 
      label: 'Overview', 
      icon: LayoutDashboard, 
      description: 'Summary of all your virtual accounts' 
    },
  ];

  const isSecondaryActive = secondaryNavItems.some(item => item.id === activeTab);

  // Close "More" dropdown on outside click or Escape key
  useEffect(() => {
    function handleClickOutside(event) {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setMoreMenuOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setMoreMenuOpen(false);
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectTab = (tabId) => {
    onTabChange(tabId);
    setMobileMenuOpen(false);
    setMoreMenuOpen(false);
  };

  return (
    <header className="border-b border-edge bg-canvas-white/95 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* =========================================================================
              LEFT SECTION: OFFICIAL FINOVA GEOMETRIC BRAND LOGO
          ========================================================================= */}
          <div 
            onClick={() => handleSelectTab('WORLD')}
            className="cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/40 rounded-xl p-1 transition-transform hover:scale-[1.02] active:scale-95"
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleSelectTab('WORLD')}
            aria-label="FINOVA Home"
          >
            <FinovaLogo size="md" />
          </div>

          {/* =========================================================================
              CENTER SECTION: FOUR PRIMARY DESTINATIONS + "MORE" DROPDOWN
          ========================================================================= */}
          <nav className="hidden lg:flex items-center space-x-1 shrink-0" aria-label="Main Navigation">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 active:scale-95 ${
                    isActive
                      ? 'bg-forest text-canvas-white shadow-xs'
                      : 'text-ink-muted hover:text-ink hover:bg-canvas-subtle'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-all duration-200 ${isActive ? 'text-canvas-white -translate-y-0.5' : 'text-ink-muted'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {/* "More" Menu Dropdown */}
            <div className="relative shrink-0" ref={moreMenuRef}>
              <button
                onClick={() => setMoreMenuOpen(!moreMenuOpen)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 ${
                  isSecondaryActive
                    ? 'bg-forest/10 text-forest border border-forest/30'
                    : 'text-ink-muted hover:text-ink hover:bg-canvas-subtle'
                }`}
                aria-expanded={moreMenuOpen}
                aria-haspopup="true"
              >
                <span>More</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${moreMenuOpen ? 'rotate-180' : ''}`} />
                {isSecondaryActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-forest" />
                )}
              </button>

              {/* Dropdown Popover */}
              {moreMenuOpen && (
                <div className="absolute left-0 mt-2 w-64 bg-canvas-white border border-edge rounded-2xl shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-ink-muted border-b border-edge/60 mb-1">
                    Other Centers
                  </div>

                  {secondaryNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectTab(item.id)}
                        className={`w-full flex items-start space-x-2.5 px-3 py-2 text-left text-xs transition focus-visible:outline-none focus-visible:bg-canvas-subtle ${
                          isActive 
                            ? 'bg-forest/10 text-forest font-bold' 
                            : 'hover:bg-canvas-subtle text-ink'
                        }`}
                      >
                        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? 'text-forest' : 'text-ink-muted'}`} />
                        <div>
                          <div className="font-semibold text-xs">{item.label}</div>
                          <div className="text-[10px] text-ink-muted">{item.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* =========================================================================
              RIGHT SECTION: COMPACT GAME HUD + PROFILE + REFRESH
          ========================================================================= */}
          <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
            {/* 1. Available Money (Cash) */}
            <button 
              onClick={() => handleSelectTab('WALLET')}
              className="hidden sm:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-canvas-subtle border border-edge text-xs hover:bg-canvas-white hover:-translate-y-0.5 hover:shadow-xs hover:border-forest/40 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
              title="Available Money to Spend"
            >
              <Coins className="w-3.5 h-3.5 text-forest shrink-0" />
              <span className="text-ink-muted text-[10px] uppercase font-semibold hidden xl:inline">Money:</span>
              <span className="font-mono font-bold text-ink">₹{availableCashINR}</span>
            </button>

            {/* 2. Mission Progress */}
            <button 
              onClick={() => handleSelectTab('WORLD')}
              className="hidden md:inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-canvas-subtle border border-edge text-xs hover:bg-canvas-white hover:-translate-y-0.5 hover:shadow-xs hover:border-copper/40 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
              title="Completed Missions"
            >
              <Target className="w-3.5 h-3.5 text-copper shrink-0" />
              <span className="text-ink-muted text-[10px] uppercase font-semibold hidden xl:inline">Missions:</span>
              <span className="font-mono font-bold text-copper">{completedMissionsCount}/{totalMissionsCount}</span>
            </button>

            {/* 3. Money Skills Score */}
            <button
              onClick={() => handleSelectTab('SCORE')}
              className="inline-flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-canvas-subtle hover:bg-canvas-white hover:-translate-y-0.5 hover:shadow-xs hover:border-forest/40 border border-edge text-xs transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
              title="Money Skills Score (out of 100)"
            >
              <Award className="w-3.5 h-3.5 text-forest shrink-0" />
              <span className="text-ink-muted hidden xl:inline text-[10px] font-semibold uppercase">Score:</span>
              <span className="font-mono font-bold text-forest">{Number(totalLiteracyPoints).toFixed(1)}</span>
            </button>

            {/* 4. Player Profile Trigger */}
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="px-2.5 py-1.5 rounded-xl bg-forest/10 hover:bg-forest/20 hover:-translate-y-0.5 text-forest border border-forest/20 text-xs font-bold transition flex items-center space-x-1 shadow-xs hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 active:scale-95"
                title="Open Player Profile"
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline">Profile</span>
              </button>
            )}

            {/* 5. Refresh Control */}
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-1.5 rounded-xl bg-canvas-subtle hover:bg-canvas-white hover:-translate-y-0.5 border border-edge text-ink transition active:scale-95 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50"
              title="Refresh game data"
              aria-label="Refresh data"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-ink-muted ${isRefreshing ? 'animate-spin text-forest' : ''}`} />
            </button>

            {/* Mobile Drawer Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-1.5 rounded-xl bg-canvas-subtle border border-edge text-ink hover:bg-canvas-white hover:-translate-y-0.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/50 active:scale-95"
              aria-label="Toggle Navigation Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RESPONSIVE MOBILE NAVIGATION DRAWER
      ========================================================================= */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-edge bg-canvas-white px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-edge text-xs">
            <FinovaLogo size="sm" />
            <span className="font-mono text-forest font-bold">
              ₹{availableCashINR} Cash
            </span>
          </div>

          {/* Primary Mobile Items */}
          <div className="grid grid-cols-1 gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted px-3 py-1">
              Main Centers
            </span>
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-left transition ${
                    isActive
                      ? 'bg-forest text-canvas-white font-bold'
                      : 'text-ink hover:bg-canvas-subtle'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Mobile Items */}
          <div className="pt-2 border-t border-edge">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted px-3 py-1 block">
              Other Centers
            </span>
            <div className="grid grid-cols-1 gap-1">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold text-left transition ${
                      isActive
                        ? 'bg-forest text-canvas-white font-bold'
                        : 'text-ink hover:bg-canvas-subtle'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <div>
                      <div className="font-semibold">{item.label}</div>
                      <div className="text-[10px] text-ink-muted font-normal">{item.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {onOpenProfile && (
            <div className="pt-2 border-t border-edge">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfile();
                }}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-xl bg-forest/10 text-forest text-xs font-bold border border-forest/20 hover:bg-forest/20 transition"
              >
                <UserCheck className="w-4 h-4" />
                <span>Open Player Profile</span>
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
