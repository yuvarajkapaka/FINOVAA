import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Layers, 
  PieChart as PieIcon, 
  Plus, 
  Minus, 
  FastForward, 
  ShieldCheck, 
  Info, 
  FileText, 
  AlertCircle, 
  Loader2,
  ArrowRight,
  Briefcase,
  X,
  Search,
  Scale
} from 'lucide-react';
import { apiFetch } from '../api/config';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export default function MarketplaceView({
  marketData,
  portfolioData,
  onOpenTrade,
  onAdvanceCycle,
  isAdvancingCycle,
  onActivityRecorded
}) {
  const [subTab, setSubTab] = useState('MARKET'); // 'MARKET' | 'PORTFOLIO' | 'COMPARE'
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetForDetails, setSelectedAssetForDetails] = useState(null);

  // Asset comparison state
  const [compareAssetIdA, setCompareAssetIdA] = useState(null);
  const [compareAssetIdB, setCompareAssetIdB] = useState(null);

  const assets = marketData?.assets || [];
  const currentCycle = marketData?.current_cycle || 10;

  const holdings = portfolioData?.holdings || [];
  const valuation = portfolioData?.valuation || {};
  const allocation = portfolioData?.allocation || [];
  const recentTrades = portfolioData?.recent_trades || [];

  const categories = [
    { id: 'ALL', label: 'All Asset Classes' },
    { id: 'EQUITY', label: 'Equities & ETFs' },
    { id: 'DEBT', label: 'Fixed Income & Bonds' },
    { id: 'GOLD', label: 'Gold & Commodities' }
  ];

  const filteredAssets = assets.filter(asset => {
    if (selectedCategory !== 'ALL' && asset.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = (asset.name || '').toLowerCase().includes(q);
      const matchSymbol = (asset.symbol || '').toLowerCase().includes(q);
      const matchClass = (asset.asset_class || '').toLowerCase().includes(q);
      return matchName || matchSymbol || matchClass;
    }
    return true;
  });

  const getRiskBadgeColor = (risk) => {
    switch (risk) {
      case 'Low':
        return 'bg-pos/10 text-pos border-pos/20';
      case 'Low-Moderate':
      case 'Moderate':
        return 'bg-olive/10 text-olive border-olive/20';
      case 'High':
      case 'Very High':
        return 'bg-copper/10 text-copper border-copper/20';
      default:
        return 'bg-canvas-subtle text-ink-muted border-edge';
    }
  };

  const assetA = assets.find(a => a.id === (compareAssetIdA || assets[0]?.id)) || assets[0];
  const assetB = assets.find(a => a.id === (compareAssetIdB || assets[1]?.id)) || assets[1];

  const handleInspectAsset = (asset) => {
    setSelectedAssetForDetails(asset);
    apiFetch('/api/score/record-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_type: 'EXPLORE_ASSET',
        activity_key: asset.asset_class || asset.category || asset.symbol
      })
    })
      .then(() => {
        if (onActivityRecorded) onActivityRecorded();
      })
      .catch(err => console.error('Failed to record learning activity:', err));
  };

  const handleLaunchCompare = (assetId) => {
    setCompareAssetIdA(assetId);
    const other = assets.find(a => a.id !== assetId);
    if (other) setCompareAssetIdB(other.id);
    setSubTab('COMPARE');

    const targetAsset = assets.find(a => a.id === assetId);
    if (targetAsset) {
      apiFetch('/api/score/record-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_type: 'EXPLORE_ASSET',
          activity_key: targetAsset.asset_class || targetAsset.category || targetAsset.symbol
        })
      })
        .then(() => {
          if (onActivityRecorded) onActivityRecorded();
        })
        .catch(err => console.error('Failed to record compare activity:', err));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. TOP HEADER & SUB-NAVIGATION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-edge">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-ink">
              {subTab === 'MARKET' ? 'Investment Exchange • Capital Markets' : subTab === 'PORTFOLIO' ? 'Investment Portfolio & Allocation' : 'Asset Comparison Matrix'}
            </h1>
            <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20 uppercase tracking-wider">
              Simulated Macro Cycle
            </span>
          </div>
          <p className="text-xs text-ink-muted mt-1">
            Study real asset allocation strategies through hands-on virtual positions. Zero real-money exposure or live brokerage links.
          </p>
        </div>

        {/* View Switcher & Cycle Advance */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center p-1 rounded-2xl bg-canvas-white border border-edge text-xs">
            <button
              onClick={() => setSubTab('MARKET')}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                subTab === 'MARKET'
                  ? 'bg-forest text-canvas-white shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Browse ({assets.length})
            </button>
            <button
              onClick={() => setSubTab('PORTFOLIO')}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                subTab === 'PORTFOLIO'
                  ? 'bg-forest text-canvas-white shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Portfolio ({holdings.length})
            </button>
            <button
              onClick={() => setSubTab('COMPARE')}
              className={`px-3 py-1.5 rounded-xl font-medium transition ${
                subTab === 'COMPARE'
                  ? 'bg-forest text-canvas-white shadow-xs'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              Compare
            </button>
          </div>

          {/* Advance Cycle Button */}
          <button
            onClick={onAdvanceCycle}
            disabled={isAdvancingCycle}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-copper/10 hover:bg-copper/20 text-copper border border-copper/30 text-xs font-semibold transition active:scale-95 disabled:opacity-50"
            title="Step simulation forward by 1 economic cycle to observe deterministic price movements"
          >
            {isAdvancingCycle ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-copper" />
            ) : (
              <FastForward className="w-3.5 h-3.5 text-copper" />
            )}
            <span className="hidden md:inline">Advance Market Cycle</span>
            <span className="font-mono text-[11px] bg-canvas-white px-1.5 py-0.5 rounded text-copper font-bold border border-copper/20">
              #{currentCycle}
            </span>
          </button>
        </div>
      </div>

      {subTab === 'MARKET' ? (
        /* ================= SUB-TAB 1: MARKETPLACE BROWSE ================= */
        <div className="space-y-6">
          {/* Category Filter Pills & Search Input */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 overflow-x-auto pb-1">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition border ${
                    selectedCategory === cat.id
                      ? 'bg-forest text-canvas-white border-forest shadow-xs'
                      : 'bg-canvas-white text-ink-muted border-edge hover:text-ink'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Asset Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search symbol or class..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-canvas-white border border-edge rounded-xl pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-forest transition w-full sm:w-56"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink text-xs"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Asset Cards Grid */}
          {filteredAssets.length === 0 ? (
            <div className="p-12 text-center bg-canvas-white border border-edge rounded-3xl space-y-2">
              <AlertCircle className="w-8 h-8 text-ink-muted mx-auto" />
              <p className="text-sm font-semibold text-ink">No matching assets found</p>
              <p className="text-xs text-ink-muted">Try clearing the search query or changing category filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map(asset => {
                const holding = holdings.find(h => h.asset_id === asset.id);
                const isPositive = asset.is_positive;

                return (
                  <div
                    key={asset.id}
                    onClick={() => handleInspectAsset(asset)}
                    className="group bg-canvas-white border border-edge hover:border-forest/60 hover:-translate-y-1.5 rounded-3xl p-6 transition-all duration-250 cursor-pointer shadow-sm hover:shadow-lg hover:shadow-forest/10 flex flex-col justify-between relative overflow-hidden"
                  >
                    <div className="space-y-4">
                      {/* Card Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-canvas-subtle border border-edge text-ink">
                              {asset.symbol}
                            </span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRiskBadgeColor(asset.risk_level)}`}>
                              {asset.risk_level}
                            </span>
                          </div>
                          <h3 className="font-serif font-bold text-sm text-ink mt-1.5 group-hover:text-forest transition">
                            {asset.name}
                          </h3>
                          <p className="text-[11px] text-ink-muted mt-0.5">{asset.asset_class}</p>
                        </div>

                        {holding && (
                          <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-forest/10 text-forest border border-forest/20">
                            Owns {holding.quantity}
                          </span>
                        )}
                      </div>

                      {/* Price and Movement */}
                      <div className="flex items-baseline justify-between pt-1">
                        <div>
                          <span className="text-ink-muted block text-[10px] uppercase font-semibold">Simulated Price</span>
                          <div className="text-2xl font-mono font-bold text-ink">
                            {asset.formatted_price}
                          </div>
                        </div>
                        <div className={`flex items-center space-x-1 text-xs font-mono font-semibold px-2 py-1 rounded-lg ${
                          isPositive ? 'bg-pos/10 text-pos' : 'bg-neg/10 text-neg'
                        }`}>
                          {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                          <span>{isPositive ? '+' : ''}{asset.price_change_percentage}%</span>
                        </div>
                      </div>

                      {/* Mini Sparkline Chart */}
                      <div className="h-28 w-full bg-canvas-subtle rounded-2xl p-2 border border-edge">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={asset.price_history}>
                            <YAxis domain={['auto', 'auto']} hide />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#DCDDD4', borderRadius: '8px', fontSize: '11px', color: '#252923' }}
                              formatter={(val) => [`₹${val}`, 'Simulated Price']}
                              labelStyle={{ color: '#73766D' }}
                            />
                            <Line
                              type="monotone"
                              dataKey="price_inr"
                              stroke={isPositive ? '#397A57' : '#BD604B'}
                              strokeWidth={2}
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Description & Concept */}
                      <p className="text-xs text-ink-muted line-clamp-2 leading-relaxed">
                        {asset.description}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLaunchCompare(asset.id);
                          }}
                          className="text-copper hover:underline font-semibold flex items-center space-x-1"
                        >
                          <Scale className="w-3 h-3" />
                          <span>Compare Asset</span>
                        </button>

                        <div className="text-forest flex items-center gap-1 group-hover:text-forest-dark transition font-semibold">
                          <span>Inspect Details</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition" />
                        </div>
                      </div>
                    </div>

                    {/* Buy / Sell Action Controls */}
                    <div className="mt-5 pt-4 border-t border-edge flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTrade('BUY', asset, holding);
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-95 flex items-center justify-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Buy Units</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTrade('SELL', asset, holding);
                        }}
                        disabled={!holding || holding.quantity === 0}
                        className="flex-1 py-2 px-3 rounded-xl bg-canvas-subtle hover:bg-canvas-subtle/80 text-ink border border-edge text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center space-x-1"
                      >
                        <Minus className="w-3.5 h-3.5" />
                        <span>Sell Units</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : subTab === 'PORTFOLIO' ? (
        /* ================= SUB-TAB 2: PORTFOLIO DASHBOARD ================= */
        <div className="space-y-8">
          {/* Portfolio Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-3xl bg-canvas-white border border-edge p-5 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted block mb-1">
                Total Wealth
              </span>
              <div className="text-2xl font-bold font-mono text-ink">
                {valuation.formatted_total_virtual_wealth || '₹0.00'}
              </div>
              <p className="text-[11px] text-ink-muted mt-1">Cash + Reserves + Market Value</p>
            </div>

            <div className="rounded-3xl bg-canvas-white border border-edge p-5 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted block mb-1">
                Investments Valuation
              </span>
              <div className="text-2xl font-bold font-mono text-forest">
                {valuation.formatted_market_value || '₹0.00'}
              </div>
              <p className="text-[11px] text-ink-muted mt-1">Current market value of all held assets</p>
            </div>

            <div className="rounded-3xl bg-canvas-white border border-edge p-5 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted block mb-1">
                Total Cost Basis
              </span>
              <div className="text-2xl font-bold font-mono text-ink">
                {valuation.formatted_cost_basis || '₹0.00'}
              </div>
              <p className="text-[11px] text-ink-muted mt-1">Total capital allocated to purchases</p>
            </div>

            <div className="rounded-3xl bg-canvas-white border border-edge p-5 shadow-sm">
              <span className="text-[11px] uppercase tracking-wider font-semibold text-ink-muted block mb-1">
                Unrealized Return
              </span>
              <div className={`text-2xl font-bold font-mono ${valuation.is_profit ? 'text-pos' : 'text-neg'}`}>
                {valuation.formatted_unrealized_pnl || '₹0.00'}
              </div>
              <p className="text-[11px] text-ink-muted mt-1">
                {valuation.unrealized_pnl_percentage || 0}% simulated market gain/loss
              </p>
            </div>
          </div>

          {/* Holdings Breakdown */}
          <div className="rounded-3xl bg-canvas-white border border-edge p-6 sm:p-8 shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-ink">
              Active Holdings ({holdings.length})
            </h2>

            {holdings.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <Briefcase className="w-10 h-10 text-ink-muted mx-auto" />
                <p className="text-sm font-semibold text-ink">No investment assets held currently</p>
                <p className="text-xs text-ink-muted">Switch to the "Browse" tab to take your first virtual position.</p>
                <button
                  onClick={() => setSubTab('MARKET')}
                  className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-semibold transition shadow-sm"
                >
                  Explore Asset Catalog
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="text-ink-muted border-b border-edge uppercase tracking-wider font-semibold text-[11px]">
                      <th className="pb-3 pr-4">Asset</th>
                      <th className="pb-3 px-4">Units Owned</th>
                      <th className="pb-3 px-4">Average Cost</th>
                      <th className="pb-3 px-4">Current Price</th>
                      <th className="pb-3 px-4">Market Value</th>
                      <th className="pb-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-edge">
                    {holdings.map(h => (
                      <tr key={h.asset_id} className="hover:bg-canvas-subtle/50 transition">
                        <td className="py-3.5 pr-4">
                          <div className="font-serif font-bold text-ink">{h.asset_name}</div>
                          <span className="text-[11px] font-mono text-ink-muted">{h.asset_symbol}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-ink">
                          {h.quantity}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-ink-muted">
                          {h.formatted_avg_buy_price}
                        </td>
                        <td className="py-3.5 px-4 font-mono text-ink">
                          {h.formatted_current_price}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-forest">
                          {h.formatted_current_value}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              const asset = assets.find(a => a.id === h.asset_id);
                              if (asset) onOpenTrade('SELL', asset, h);
                            }}
                            className="px-3 py-1 rounded-lg bg-canvas-subtle hover:bg-canvas-subtle/80 text-ink border border-edge font-semibold text-xs transition"
                          >
                            Sell
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= SUB-TAB 3: ASSET COMPARISON MATRIX ================= */
        <div className="space-y-6">
          <div className="p-6 bg-canvas-white border border-edge rounded-3xl shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-edge pb-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <Scale className="w-5 h-5 text-copper" />
                  <h2 className="font-serif text-lg font-bold text-ink">
                    Side-by-Side Asset Comparison
                  </h2>
                </div>
                <p className="text-xs text-ink-muted">
                  Compare volatility, asset classes, and risk profiles before allocating simulated capital.
                </p>
              </div>

              {/* Selectors for Asset A and B */}
              <div className="flex items-center space-x-3 text-xs">
                <div className="flex items-center space-x-1.5">
                  <span className="text-ink-muted font-semibold">Asset A:</span>
                  <select
                    value={assetA?.id}
                    onChange={(e) => setCompareAssetIdA(Number(e.target.value))}
                    className="bg-canvas-subtle border border-edge rounded-xl px-2.5 py-1.5 text-xs text-ink font-semibold focus:outline-none"
                  >
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.symbol} - {a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-1.5">
                  <span className="text-ink-muted font-semibold">Asset B:</span>
                  <select
                    value={assetB?.id}
                    onChange={(e) => setCompareAssetIdB(Number(e.target.value))}
                    className="bg-canvas-subtle border border-edge rounded-xl px-2.5 py-1.5 text-xs text-ink font-semibold focus:outline-none"
                  >
                    {assets.map(a => (
                      <option key={a.id} value={a.id}>{a.symbol} - {a.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Comparison Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[assetA, assetB].map((asset, idx) => {
                if (!asset) return null;
                const holding = holdings.find(h => h.asset_id === asset.id);
                const isPositive = asset.is_positive;

                return (
                  <div key={asset.id} className="p-6 rounded-2xl bg-canvas-subtle border border-edge space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-forest text-canvas-white uppercase font-mono">
                          Asset {idx === 0 ? 'A' : 'B'}
                        </span>
                        <h3 className="font-serif text-lg font-bold text-ink mt-1">
                          {asset.name}
                        </h3>
                        <p className="text-xs text-ink-muted">{asset.symbol} • {asset.asset_class}</p>
                      </div>

                      <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${getRiskBadgeColor(asset.risk_level)}`}>
                        {asset.risk_level} Risk
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 p-3 bg-canvas-white rounded-xl border border-edge text-xs">
                      <div>
                        <span className="text-[10px] uppercase text-ink-muted font-semibold block">Price</span>
                        <span className="font-mono text-base font-bold text-ink">{asset.formatted_price}</span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase text-ink-muted font-semibold block">Cycle Change</span>
                        <span className={`font-mono font-bold ${isPositive ? 'text-pos' : 'text-neg'}`}>
                          {isPositive ? '+' : ''}{asset.price_change_percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <strong className="text-ink text-[11px] uppercase tracking-wider block">Role in Portfolio</strong>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        {asset.educational_notes}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-edge flex items-center justify-between text-xs">
                      <span className="font-mono text-ink-muted">
                        Holding: {holding ? `${holding.quantity} Units` : '0 Units'}
                      </span>
                      <button
                        onClick={() => onOpenTrade('BUY', asset, holding)}
                        className="px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-canvas-white font-bold transition flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Buy {asset.symbol}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ASSET DETAILS DEEP DIVE MODAL */}
      {selectedAssetForDetails && (() => {
        const asset = selectedAssetForDetails;
        const holding = holdings.find(h => h.asset_id === asset.id);
        const isPositive = asset.is_positive;

        return (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setSelectedAssetForDetails(null)}
          >
            <div 
              className="w-full max-w-2xl bg-canvas-white border border-edge rounded-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-edge bg-canvas-subtle flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-canvas-white text-ink border border-edge">
                      {asset.symbol}
                    </span>
                    <span className="text-xs text-ink-muted">• {asset.asset_class}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getRiskBadgeColor(asset.risk_level)}`}>
                      {asset.risk_level} Risk
                    </span>
                  </div>
                  <h2 className="font-serif text-lg font-bold text-ink mt-1">
                    {asset.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedAssetForDetails(null)}
                  className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-edge/40 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-5 text-xs text-ink">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-canvas-subtle border border-edge">
                    <span className="text-[10px] text-ink-muted uppercase font-semibold block">Simulated Price</span>
                    <div className="text-xl font-mono font-bold text-ink mt-1">
                      {asset.formatted_price}
                    </div>
                    <span className={`text-[11px] font-mono font-semibold ${isPositive ? 'text-pos' : 'text-neg'}`}>
                      {isPositive ? '+' : ''}{asset.price_change_percentage}% this cycle
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-canvas-subtle border border-edge">
                    <span className="text-[10px] text-ink-muted uppercase font-semibold block">Your Holdings</span>
                    <div className="text-xl font-mono font-bold text-forest mt-1">
                      {holding ? `${holding.quantity} Units` : '0 Units'}
                    </div>
                    <span className="text-[11px] text-ink-muted">
                      {holding ? `Value: ${holding.formatted_current_value}` : 'No open position'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-canvas-subtle border border-edge">
                    <span className="text-[10px] text-ink-muted uppercase font-semibold block">Cycle Range</span>
                    <div className="text-xs font-mono text-ink mt-1.5 space-y-0.5">
                      <div className="flex justify-between">
                        <span className="text-ink-muted">Low:</span>
                        <span>₹{Math.min(...(asset.price_history?.map(p => p.price_inr) || [asset.current_price_inr]))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-ink-muted">High:</span>
                        <span>₹{Math.max(...(asset.price_history?.map(p => p.price_inr) || [asset.current_price_inr]))}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-ink-muted">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Price History (Last 10 Market Cycles)</span>
                    <span className="font-mono">Deterministic Simulation</span>
                  </div>
                  <div className="h-44 w-full bg-canvas-subtle rounded-2xl p-3 border border-edge">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={asset.price_history}>
                        <XAxis dataKey="cycle" stroke="#73766D" fontSize={10} tickFormatter={(val) => `C#${val}`} />
                        <YAxis domain={['auto', 'auto']} stroke="#73766D" fontSize={10} tickFormatter={(val) => `₹${val}`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#DCDDD4', borderRadius: '8px', fontSize: '11px', color: '#252923' }}
                          formatter={(val) => [`₹${val}`, 'Simulated Price']}
                          labelFormatter={(l) => `Cycle #${l}`}
                        />
                        <Line
                          type="monotone"
                          dataKey="price_inr"
                          stroke={isPositive ? '#397A57' : '#BD604B'}
                          strokeWidth={2.5}
                          dot={{ fill: '#FFFFFF', strokeWidth: 2, r: 3 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-serif text-xs font-bold uppercase tracking-wider text-ink">
                    Asset Class & Educational Role
                  </h4>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {asset.description}
                  </p>
                  <div className="p-3 rounded-xl bg-forest/10 border border-forest/20 text-forest text-xs">
                    <strong className="text-forest">Why hold this asset? </strong>
                    {asset.educational_notes}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-edge bg-canvas-subtle flex items-center justify-between">
                <button
                  onClick={() => setSelectedAssetForDetails(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-ink-muted hover:text-ink"
                >
                  Close
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const a = selectedAssetForDetails;
                      setSelectedAssetForDetails(null);
                      onOpenTrade('BUY', a, holding);
                    }}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Buy {asset.symbol}</span>
                  </button>

                  <button
                    onClick={() => {
                      const a = selectedAssetForDetails;
                      setSelectedAssetForDetails(null);
                      onOpenTrade('SELL', a, holding);
                    }}
                    disabled={!holding || holding.quantity === 0}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-canvas-white hover:bg-canvas-subtle text-ink border border-edge text-xs font-semibold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4" />
                    <span>Sell {asset.symbol}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
