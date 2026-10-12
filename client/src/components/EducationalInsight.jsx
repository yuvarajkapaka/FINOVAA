import React from 'react';
import { Lightbulb, ShieldCheck } from 'lucide-react';

export default function EducationalInsight({ wallet }) {
  if (!wallet) return null;

  const currentSavings = wallet.balances.savings_balance_inr;
  const total = wallet.balances.total_balance_inr;
  const savingsRatio = total > 0 ? Math.round((currentSavings / total) * 100) : 0;

  return (
    <div className="rounded-2xl bg-canvas-white border border-edge p-5 shadow-sm relative overflow-hidden">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-forest/10 text-forest border border-forest/20 flex-shrink-0 mt-0.5">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-serif text-sm font-bold text-ink">
                Economic Insight: The Conservation of Money
              </h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20 uppercase tracking-wider">
                Core Principle
              </span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed max-w-3xl">
              Moving cash into savings is an <span className="text-forest font-semibold">allocation</span>, not new wealth. 
              In authentic financial management, your emergency reserve shields you against sudden shocks without inflating baseline capital.
            </p>
          </div>
        </div>

        {/* Savings Buffer Gauge */}
        <div className="flex items-center space-x-3 bg-canvas-subtle px-4 py-2.5 rounded-xl border border-edge flex-shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-ink-muted font-semibold">Reserve Buffer</div>
            <div className="text-sm font-bold text-forest font-mono">{savingsRatio}% of Capital</div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-forest/30 flex items-center justify-center font-bold text-xs text-forest">
            {savingsRatio}%
          </div>
        </div>
      </div>
    </div>
  );
}
