import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  Vault, 
  TrendingUp, 
  Award, 
  PlusCircle, 
  MinusCircle, 
  ArrowRightLeft,
  ChevronRight
} from 'lucide-react';

export default function MetricCards({ 
  wallet, 
  portfolioData, 
  literacyScore, 
  onOpenAction, 
  onNavigateTab 
}) {
  if (!wallet) return null;

  const { balances } = wallet;
  const initialPaise = balances.initial_balance_paise;
  const totalPaise = balances.total_balance_paise;
  const deltaPaise = totalPaise - initialPaise;
  const isNetPositive = deltaPaise >= 0;
  const deltaRupees = Math.abs(deltaPaise / 100).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  const formattedPortfolioValue = portfolioData?.valuation?.formatted_market_value || '₹0.00';
  const holdingsCount = portfolioData?.holdings?.length || 0;

  const scoreTotal = literacyScore?.total_score || 0;
  const scoreTier = literacyScore?.tier || 'Novice';

  // Directional value change tracking for positive and negative highlights
  const [cashChangeType, setCashChangeType] = useState(null); // 'pos' | 'neg' | null
  const [savingsChangeType, setSavingsChangeType] = useState(null);
  const [marketChangeType, setMarketChangeType] = useState(null);
  const [scoreChangeType, setScoreChangeType] = useState(null);

  const prevCash = useRef(balances?.available_cash_paise);
  const prevSavings = useRef(balances?.savings_balance_paise);
  const prevMarket = useRef(portfolioData?.valuation?.market_value_inr);
  const prevScore = useRef(literacyScore?.total_score);

  useEffect(() => {
    if (prevCash.current !== undefined && prevCash.current !== balances?.available_cash_paise) {
      const isPos = (balances?.available_cash_paise || 0) >= (prevCash.current || 0);
      setCashChangeType(isPos ? 'pos' : 'neg');
      const timer = setTimeout(() => setCashChangeType(null), 650);
      prevCash.current = balances?.available_cash_paise;
      return () => clearTimeout(timer);
    }
    prevCash.current = balances?.available_cash_paise;
  }, [balances?.available_cash_paise]);

  useEffect(() => {
    if (prevSavings.current !== undefined && prevSavings.current !== balances?.savings_balance_paise) {
      const isPos = (balances?.savings_balance_paise || 0) >= (prevSavings.current || 0);
      setSavingsChangeType(isPos ? 'pos' : 'neg');
      const timer = setTimeout(() => setSavingsChangeType(null), 650);
      prevSavings.current = balances?.savings_balance_paise;
      return () => clearTimeout(timer);
    }
    prevSavings.current = balances?.savings_balance_paise;
  }, [balances?.savings_balance_paise]);

  useEffect(() => {
    if (prevMarket.current !== undefined && prevMarket.current !== portfolioData?.valuation?.market_value_inr) {
      const isPos = (portfolioData?.valuation?.market_value_inr || 0) >= (prevMarket.current || 0);
      setMarketChangeType(isPos ? 'pos' : 'neg');
      const timer = setTimeout(() => setMarketChangeType(null), 650);
      prevMarket.current = portfolioData?.valuation?.market_value_inr;
      return () => clearTimeout(timer);
    }
    prevMarket.current = portfolioData?.valuation?.market_value_inr;
  }, [portfolioData?.valuation?.market_value_inr]);

  useEffect(() => {
    if (prevScore.current !== undefined && prevScore.current !== literacyScore?.total_score) {
      const isPos = (literacyScore?.total_score || 0) >= (prevScore.current || 0);
      setScoreChangeType(isPos ? 'pos' : 'neg');
      const timer = setTimeout(() => setScoreChangeType(null), 650);
      prevScore.current = literacyScore?.total_score;
      return () => clearTimeout(timer);
    }
    prevScore.current = literacyScore?.total_score;
  }, [literacyScore?.total_score]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Available Money Card */}
      <div 
        onClick={() => onOpenAction('INCOME')}
        className="rounded-2xl bg-canvas-white border border-edge p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-forest/60 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-250 cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Available Money</span>
            <div className="p-2 rounded-xl bg-forest/10 text-forest border border-forest/20 group-hover:scale-105 group-hover:bg-forest/15 transition-all duration-200">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold text-ink tracking-tight font-mono transition-all duration-300 rounded-lg px-1 -mx-1 ${
            cashChangeType === 'pos' ? 'highlight-pos' : cashChangeType === 'neg' ? 'highlight-neg' : ''
          }`}>
            {balances.formatted_available_cash}
          </div>
          <div className="text-xs text-ink-muted mt-1 flex items-center space-x-1">
            <span className="text-pos font-semibold">Available</span>
            <span>• Ready for expenses & savings</span>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="mt-5 pt-3.5 border-t border-edge flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onOpenAction('INCOME')}
            className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-forest/10 hover:bg-forest/20 text-forest border border-forest/20 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-95"
            title="Log simulated income"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>+ Income</span>
          </button>
          <button
            onClick={() => onOpenAction('EXPENSE')}
            className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-copper/10 hover:bg-copper/20 text-copper border border-copper/20 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-95"
            title="Log simulated expense"
          >
            <MinusCircle className="w-3.5 h-3.5" />
            <span>- Expense</span>
          </button>
        </div>
      </div>

      {/* 2. Emergency Savings Card */}
      <div 
        onClick={() => onNavigateTab ? onNavigateTab('SAVINGS') : onOpenAction('TRANSFER')}
        className="rounded-2xl bg-canvas-white border border-edge p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-olive/60 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-250 cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Emergency Savings</span>
            <div className="p-2 rounded-xl bg-olive/10 text-olive border border-olive/20 group-hover:scale-105 group-hover:bg-olive/15 transition-all duration-200">
              <Vault className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold text-ink tracking-tight font-mono transition-all duration-300 rounded-lg px-1 -mx-1 ${
            savingsChangeType === 'pos' ? 'highlight-pos' : savingsChangeType === 'neg' ? 'highlight-neg' : ''
          }`}>
            {balances.formatted_savings_balance}
          </div>
          <div className="text-xs text-ink-muted mt-1 flex items-center space-x-1">
            <span className="text-olive font-semibold">{balances.savings_ratio_percent}%</span>
            <span>of your money is saved</span>
          </div>
          <div className="w-full bg-edge/70 rounded-full h-1 overflow-hidden mt-2">
            <div 
              className="h-full bg-olive rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${Math.min(100, balances.savings_ratio_percent)}%` }} 
            />
          </div>
        </div>

        {/* Vault transfer shortcut */}
        <div className="mt-5 pt-3.5 border-t border-edge flex items-center space-x-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onOpenAction('TRANSFER')}
            className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-olive/10 hover:bg-olive/20 text-olive border border-olive/20 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-95"
            title="Transfer money to savings"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Save Money</span>
          </button>
          <button
            onClick={() => onOpenAction('WITHDRAW')}
            className="flex-1 inline-flex items-center justify-center space-x-1 py-1.5 px-2 rounded-lg bg-canvas-subtle hover:bg-canvas-subtle/80 text-ink-muted border border-edge text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-xs active:translate-y-0 active:scale-95"
            title="Withdraw from savings"
          >
            <span>Withdraw</span>
          </button>
        </div>
      </div>

      {/* 3. Your Investments Card */}
      <div 
        onClick={() => onNavigateTab && onNavigateTab('MARKET')}
        className="rounded-2xl bg-canvas-white border border-edge p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-copper/60 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-250 cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Your Investments</span>
            <div className="p-2 rounded-xl bg-copper/10 text-copper border border-copper/20 group-hover:scale-105 group-hover:bg-copper/15 transition-all duration-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-bold text-ink tracking-tight font-mono transition-all duration-300 rounded-lg px-1 -mx-1 ${
            marketChangeType === 'pos' ? 'highlight-pos' : marketChangeType === 'neg' ? 'highlight-neg' : ''
          }`}>
            {formattedPortfolioValue}
          </div>
          <div className="text-xs text-ink-muted mt-1 flex items-center space-x-1">
            <span className="text-copper font-semibold">{holdingsCount} Investments</span>
            <span>• In virtual exchange</span>
          </div>
        </div>

        <div className="mt-5 pt-3.5 border-t border-edge flex items-center justify-between text-xs text-copper font-semibold">
          <span>Open Investment Center</span>
          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* 4. Money Skills Score Card */}
      <div 
        onClick={() => onNavigateTab && onNavigateTab('SCORE')}
        className="rounded-2xl bg-canvas-white border border-edge p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-forest/60 hover:-translate-y-1.5 hover:shadow-lg transition-all duration-250 cursor-pointer"
      >
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">Money Skills Score</span>
            <div className="p-2 rounded-xl bg-forest/10 text-forest border border-forest/20 group-hover:scale-105 group-hover:bg-forest/15 transition-all duration-200">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className={`flex items-baseline space-x-1.5 transition-all duration-300 rounded-lg px-1 -mx-1 ${
            scoreChangeType === 'pos' ? 'highlight-pos' : scoreChangeType === 'neg' ? 'highlight-neg' : ''
          }`}>
            <span className="text-2xl sm:text-3xl font-bold text-forest tracking-tight font-mono">
              {Number(scoreTotal).toFixed(1)}
            </span>
            <span className="text-xs text-ink-subtle">/ 100</span>
          </div>
          <div className="text-xs text-ink-muted mt-1 flex items-center space-x-1">
            <span className="text-copper font-semibold">{scoreTier}</span>
            <span>• Based on your skills</span>
          </div>
          <div className="w-full bg-edge/70 rounded-full h-1 overflow-hidden mt-2">
            <div 
              className="h-full bg-forest rounded-full transition-all duration-700 ease-out" 
              style={{ width: `${Math.min(100, scoreTotal)}%` }} 
            />
          </div>
        </div>

        <div className="mt-5 pt-3.5 border-t border-edge flex items-center justify-between text-xs text-forest font-semibold">
          <span>View Score Breakdown</span>
          <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
}
