/**
 * FINOVA Financial-Life Simulation Scenarios Catalog
 *
 * Deterministic educational scenarios modeling common real-life financial events:
 * 1. Unexpected Expense (Laptop/Medical shock)
 * 2. Temporary Income Reduction (Client retainer delay)
 * 3. Savings Goal Deadline (Certification target deadline)
 * 4. Simulated Market Downturn (18% cyclical correction)
 * 5. Financial Opportunity (Performance bonus windfall)
 */

export const SCENARIOS = [
  {
    id: 'SCN_UNEXPECTED_EXPENSE',
    title: 'Sudden Emergency: Urgent Laptop & Work Gear Repair',
    category: 'Unexpected Expense',
    icon: 'AlertTriangle',
    severity: 'MEDIUM',
    event_amount_paise: 800000, // ₹8,000
    description: 'Your primary workstation hardware suffers a critical failure right before project submission. Repair and component replacement requires an immediate outlay of ₹8,000.',
    context_condition: 'Requires immediate liquidity of ₹8,000 within 24 hours to prevent work disruption.',
    learning_objective: 'Understand why a dedicated emergency fund serves as an essential shock absorber that protects daily cash flow and prevents forced liquidation of investments.',
    choices: [
      {
        id: 'CHOICE_A1',
        title: 'Pay from Emergency Cushion / Savings Buffer',
        summary: 'Withdraw ₹8,000 directly from your designated emergency savings buffer.',
        action_type: 'USE_SAVINGS',
        label: 'Liquidity Preserved',
        tradeoff_summary: 'Conserves liquid daily cash and prevents selling assets, but lowers your emergency cushion until replenished.',
        pros: [
          'Liquid daily operational cash is completely untouched.',
          'No need to sell long-term investments or incur market exit costs.',
          'Demonstrates the exact purpose of maintaining an emergency fund.'
        ],
        cons: [
          'Temporarily lowers your safety cushion; must be replenished in upcoming months.'
        ],
        educational_verdict: 'Excellent real-world decision. Using a dedicated emergency buffer prevents high-interest borrowing or panic-selling investments.'
      },
      {
        id: 'CHOICE_A2',
        title: 'Pay from Available Liquid Cash',
        summary: 'Absorb the entire ₹8,000 expense from your active checking/cash balance.',
        action_type: 'USE_CASH',
        label: 'Budget-Aware',
        tradeoff_summary: 'Preserves your emergency buffer, but significantly tightens your cash flow for daily expenses.',
        pros: [
          'Emergency savings buffer remains 100% intact.',
          'No investment assets are disturbed.'
        ],
        cons: [
          'Depletes operating cash, leaving less flexibility for upcoming routine monthly expenses.'
        ],
        educational_verdict: 'A viable choice if your liquid cash comfortably exceeds the expense, but risky if it leaves your wallet near zero.'
      },
      {
        id: 'CHOICE_A3',
        title: 'Liquidate Long-Term Virtual Investments',
        summary: 'Sell ₹8,000 worth of investment units to cover the immediate hardware expense.',
        action_type: 'LIQUIDATE_INVESTMENT',
        label: 'Learning Opportunity',
        tradeoff_summary: 'Solves the immediate cash need but interrupts compound growth and creates unnecessary trade friction.',
        pros: [
          'Leaves both liquid cash and dedicated emergency savings untouched.'
        ],
        cons: [
          'Interrupts long-term compound growth and wealth accumulation.',
          'Forces a market exit regardless of whether current market prices are favorable.'
        ],
        educational_verdict: 'A common beginner misstep. Investments should compound for the long term; short-term emergencies should always be insulated by cash cushions.'
      }
    ]
  },
  {
    id: 'SCN_INCOME_SHOCK',
    title: 'Income Shortfall: 30-Day Freelance Retainer Delay',
    category: 'Temporary Income Reduction',
    icon: 'TrendingDown',
    severity: 'MEDIUM',
    event_amount_paise: 1000000, // ₹10,000
    description: 'A client encounters administrative delays, postponing your scheduled ₹10,000 retainer payment by one month. Your fixed rent and essential bills remain due.',
    context_condition: 'Temporary cash inflow delay of ₹10,000 for the current cycle.',
    learning_objective: 'Master short-term cash-flow triage by distinguishing between flexible discretionary spending and rigid essentials.',
    choices: [
      {
        id: 'CHOICE_B1',
        title: 'Trim Discretionary Spending & Tighten Monthly Budget',
        summary: 'Cut leisure, dining out, and non-essential subscriptions to bridge 70% of the gap (net cash dip of only ₹3,000).',
        action_type: 'CUT_EXPENSES',
        label: 'Budget-Aware',
        tradeoff_summary: 'Demands temporary lifestyle sacrifices, but preserves both your emergency fund and investment portfolio.',
        pros: [
          'Demonstrates dynamic spending control and frugality under pressure.',
          'Keeps your emergency fund and investments completely intact.',
          'Net impact on liquid cash is minimized to just ₹3,000.'
        ],
        cons: [
          'Requires immediate lifestyle adjustments and reduced leisure spending for the month.'
        ],
        educational_verdict: 'Proactive budgeting in action! Adjusting non-essential spending during temporary dips is the most resilient personal finance habit.'
      },
      {
        id: 'CHOICE_B2',
        title: 'Bridge the Gap Using Emergency Fund',
        summary: 'Transfer ₹10,000 from your emergency savings buffer into available cash.',
        action_type: 'BRIDGE_SAVINGS',
        label: 'Liquidity Preserved',
        tradeoff_summary: 'Maintains lifestyle continuity without loans, but draws down your defensive reserve.',
        pros: [
          'No change to your daily lifestyle or standard of living.',
          'Zero debt incurred and zero investments sold.'
        ],
        cons: [
          'Emergency buffer drops by ₹10,000 and will need restoration once the retainer arrives.'
        ],
        educational_verdict: 'A completely sound use of emergency reserves when faced with an unexpected income delay, provided you refill it when back-pay arrives.'
      },
      {
        id: 'CHOICE_B3',
        title: 'Sell Off Investments to Maintain Current Outflows',
        summary: 'Liquidate ₹10,000 of investment holdings to avoid touching savings or reducing spending.',
        action_type: 'LIQUIDATE_INVESTMENT',
        label: 'Learning Opportunity',
        tradeoff_summary: 'Avoids budget discipline today by sacrificing long-term capital tomorrow.',
        pros: [
          'Cash flow is maintained without any spending cutbacks.'
        ],
        cons: [
          'Liquidating portfolio units prematurely damages compounding velocity.',
          'Converts an operational budgeting friction into a permanent reduction in invested capital.'
        ],
        educational_verdict: 'Avoid treating your investment portfolio as an income buffer. Long-term assets require uninterrupted time in the market.'
      }
    ]
  },

  {
    id: 'SCN_GOAL_DEADLINE',
    title: 'Milestone Deadline: Professional Tech Certification in 30 Days',
    category: 'Savings Goal Deadline',
    icon: 'Target',
    severity: 'LOW',
    event_amount_paise: 1200000, // ₹12,000
    description: 'Your savings goal for a globally accredited certification is approaching its target date in 30 days. You need ₹12,000 more to achieve 100% funding.',
    context_condition: 'Target deficit of ₹12,000 with a 30-day timeline milestone.',
    learning_objective: 'Evaluate trade-offs between rushing non-critical goals at the expense of liquidity versus practicing patience with timeline adjustments.',
    choices: [
      {
        id: 'CHOICE_C1',
        title: 'Allocate ₹12,000 from Liquid Cash to Hit 100% on Time',
        summary: 'Transfer ₹12,000 from available cash into the certification goal to complete it by the deadline.',
        action_type: 'FUND_GOAL_CASH',
        label: 'Goal-Aligned',
        tradeoff_summary: 'Achieves your milestone exactly on schedule, provided you retain sufficient operating cash.',
        pros: [
          'Goal completion hits 100% on schedule.',
          'Demonstrates commitment to personal and career development.'
        ],
        cons: [
          'Reduces available cash by ₹12,000, slightly lowering near-term liquidity.'
        ],
        educational_verdict: 'Great goal execution if your remaining liquid cash covers daily living. Meeting milestones builds strong financial momentum.'
      },
      {
        id: 'CHOICE_C2',
        title: 'Extend Goal Timeline by 60 Days (Save Incrementally)',
        summary: 'Postpone the target date by 2 months and continue saving ₹6,000/month from future surplus.',
        action_type: 'EXTEND_GOAL',
        label: 'Goal Trade-Off',
        tradeoff_summary: 'Accepts a small delay in milestone completion to protect existing liquidity and avoid stress.',
        pros: [
          'Zero drain on your current cash or savings reserves.',
          'Allows steady, sustainable pacing without financial anxiety.'
        ],
        cons: [
          'Goal is delayed by 60 days.'
        ],
        educational_verdict: 'A wise and mature trade-off. Goals are meant to guide you, not force reckless depletion of cash when buffers are needed.'
      },
      {
        id: 'CHOICE_C3',
        title: 'Raid Emergency Cushion to Finish the Goal Today',
        summary: 'Transfer ₹12,000 directly from your emergency fund into this non-emergency goal.',
        action_type: 'RAID_EMERGENCY',
        label: 'Learning Opportunity',
        tradeoff_summary: 'Treats emergency funds as discretionary savings, compromising your safety net.',
        pros: [
          'Goal is funded today without reducing liquid wallet cash.'
        ],
        cons: [
          'Violates the foundational principle of emergency fund isolation.',
          'Leaves you vulnerable if an actual medical or employment crisis occurs tomorrow.'
        ],
        educational_verdict: 'Emergency funds must strictly remain quarantined for true emergencies. Diverting them to planned purchases breaks your defensive shield.'
      }
    ]
  },
  {
    id: 'SCN_MARKET_DOWNTURN',
    title: 'Market Cycle Shock: 18% Cyclical Correction',
    category: 'Simulated Market Downturn',
    icon: 'TrendingDown',
    severity: 'HIGH',
    event_amount_paise: 0,
    description: 'A global macro slowdown causes a temporary 18% correction in equity fund prices. Your portfolio unrealized valuation drops, testing your emotional discipline.',
    context_condition: 'Simulated 18% pullback across equity holdings; fixed-income remains steady (+1.5%).',
    learning_objective: 'Understand the difference between temporary unrealized paper loss and permanent realized loss, and explore dollar-cost averaging.',
    choices: [
      {
        id: 'CHOICE_D1',
        title: 'Stay the Course: Hold Through the Cycle Without Selling',
        summary: 'Do not sell any units. Allow the asset allocation to weather the downturn until recovery.',
        action_type: 'HOLD_COURSE',
        label: 'Goal-Aligned',
        tradeoff_summary: 'Experiences temporary paper valuation dip, but preserves all unit ownership for the eventual rebound.',
        pros: [
          'Paper losses remain unrealized—zero actual cash lost.',
          'Full unit holdings are preserved for future recovery and dividend reinvestment.',
          'Builds emotional discipline against headline fear.'
        ],
        cons: [
          'Portfolio market value is temporarily lower on paper.'
        ],
        educational_verdict: 'The cornerstone of successful long-term investing. Historically, patient investors who hold through downturns capture the full recovery.'
      },
      {
        id: 'CHOICE_D2',
        title: 'Tactical Rebalance: Invest ₹10,000 Surplus Cash at Lower Prices',
        summary: 'Deploy ₹10,000 from available cash to buy discounted index units during the dip.',
        action_type: 'BUY_DIP',
        label: 'Budget-Aware',
        tradeoff_summary: 'Allocates cash toward undervalued assets, lowering your average cost basis.',
        pros: [
          'Lowers average purchase cost per unit (dollar-cost averaging advantage).',
          'Accelerates recovery velocity when market cycles turn upward.',
          'Puts surplus cash to productive long-term work.'
        ],
        cons: [
          'Decreases liquid cash by ₹10,000 during a volatile market period.'
        ],
        educational_verdict: 'Classic value investing and rebalancing! Buying fundamentally sound index units when prices drop yields higher expected long-term returns.'
      },
      {
        id: 'CHOICE_D3',
        title: 'Panic-Sell All Equity Holdings to Cash',
        summary: 'Liquidate all equity holdings at current depressed prices to stop further paper drawdowns.',
        action_type: 'PANIC_SELL',
        label: 'Learning Opportunity',
        tradeoff_summary: 'Eliminates further downside volatility, but permanently locks in the 18% loss and misses recovery.',
        pros: [
          'Locks in remaining capital as cash, stopping further short-term downside.'
        ],
        cons: [
          'Permanently locks in the 18% loss (turns paper loss into realized loss).',
          'Virtually guarantees you will miss the subsequent recovery phase when prices rebound.'
        ],
        educational_verdict: 'The single most costly behavioral mistake in investing. Panic-selling at market bottoms destroys compounding.'
      }
    ]
  },
  {
    id: 'SCN_FINANCIAL_WINDFALL',
    title: 'Surplus Opportunity: Unexpected Annual Performance Bonus',
    category: 'Financial Opportunity',
    icon: 'Gift',
    severity: 'LOW',
    event_amount_paise: 2500000, // ₹25,000
    description: 'You receive an unanticipated performance bonus of ₹25,000. Deciding how to allocate this surplus sets the foundation for accelerating your financial independence.',
    context_condition: 'One-off surplus cash inflow of ₹25,000.',
    learning_objective: 'Master balanced capital allocation across emergency defense, goal funding, and long-term asset compounding.',
    choices: [
      {
        id: 'CHOICE_E1',
        title: '100% into Emergency Savings Buffer',
        summary: 'Channel the entire ₹25,000 into your defensive emergency cushion.',
        action_type: 'FORTIFY_SAVINGS',
        label: 'Liquidity Preserved',
        tradeoff_summary: 'Significantly expands your financial runway, though it offers modest growth compared to equity.',
        pros: [
          'Vastly improves resilience against job loss, medical emergencies, or unexpected shocks.',
          'Provides total peace of mind and liquid safety.'
        ],
        cons: [
          'Earns conservative interest compared to potential market returns.'
        ],
        educational_verdict: 'A stellar choice, especially if your emergency cushion was under 3–6 months of essential living expenses.'
      },
      {
        id: 'CHOICE_E2',
        title: 'Balanced Strategy: 50% to Savings Goals / 50% to Index Fund',
        summary: 'Allocate ₹12,500 to savings goals and invest ₹12,500 into Nova 50 Bluechip Index Fund.',
        action_type: 'BALANCED_SPLIT',
        label: 'Goal-Aligned',
        tradeoff_summary: 'A disciplined balanced split that accelerates milestone goals while fueling long-term compounding.',
        pros: [
          'Advances immediate savings goals significantly.',
          'Adds ₹12,500 into productive wealth-generating equity assets.',
          'Embodies the golden rule of diversification and balanced allocation.'
        ],
        cons: [
          'Does not maximize either extreme (neither 100% safe nor 100% growth).'
        ],
        educational_verdict: 'The ideal pragmatic financial move for most individuals: honoring near-term goals while investing for the future.'
      },
      {
        id: 'CHOICE_E3',
        title: '100% into High-Growth Equity Fund',
        summary: 'Invest the entire ₹25,000 bonus into active equity index funds.',
        action_type: 'MAX_EQUITY',
        label: 'Budget-Aware',
        tradeoff_summary: 'Maximizes long-term growth potential, but leaves near-term goals and emergency cushions unchanged.',
        pros: [
          'Full ₹25,000 begins compounding immediately in equities.',
          'Maximizes long-term purchasing power against inflation.'
        ],
        cons: [
          'Subject to market volatility; provides zero extra defensive liquidity.'
        ],
        educational_verdict: 'High-growth strategy that works wonders if your emergency fund is already well-stocked. Remember to keep liquidity before going all-in.'
      }
    ]
  }
];

export function getScenarioById(scenarioId) {
  return SCENARIOS.find(s => s.id === scenarioId) || null;
}
