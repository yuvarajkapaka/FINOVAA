import { getWallet } from './walletService.js';
import { getGoals } from './goalService.js';
import { getPortfolio } from './marketService.js';
import { SCENARIOS, getScenarioById } from '../data/scenariosData.js';
import { formatPaiseToINR, paiseToRupees } from '../utils/currency.js';
import { DEMO_USER_ID } from '../db/schema.js';

/**
 * Returns all scenario metadata for the client catalog.
 */
export function getScenarios() {
  return SCENARIOS.map(s => ({
    id: s.id,
    title: s.title,
    category: s.category,
    icon: s.icon,
    severity: s.severity,
    event_amount_paise: s.event_amount_paise,
    formatted_event_amount: s.event_amount_paise > 0 ? formatPaiseToINR(s.event_amount_paise) : null,
    description: s.description,
    context_condition: s.context_condition,
    learning_objective: s.learning_objective,
    choices_count: s.choices.length,
    choices: s.choices.map(c => ({
      id: c.id,
      title: c.title,
      text: c.title,
      summary: c.summary,
      description: c.summary,
      action_type: c.action_type,
      label: c.label,
      tradeoff_summary: c.tradeoff_summary,
      pros: c.pros,
      cons: c.cons,
      educational_verdict: c.educational_verdict
    }))
  }));
}

/**
 * Captures an authoritative, immutable read-only snapshot of the user's current
 * virtual financial state across wallet, savings goals, and portfolio.
 */
export function getFinancialSnapshot(userId = DEMO_USER_ID) {
  const wallet = getWallet(userId);
  const goalsData = getGoals(userId);
  const portfolio = getPortfolio(userId);

  const emergencyFundGoal = goalsData.goals.find(g => g.is_emergency_fund) || null;

  return {
    snapshot_timestamp: new Date().toISOString(),
    user_id: userId,
    cash_paise: wallet.balances.current_balance_paise,
    formatted_cash: formatPaiseToINR(wallet.balances.current_balance_paise),
    formatted_available_cash: formatPaiseToINR(wallet.balances.current_balance_paise),
    savings_paise: wallet.balances.savings_balance_paise,
    formatted_savings: formatPaiseToINR(wallet.balances.savings_balance_paise),
    emergency_fund_paise: emergencyFundGoal ? emergencyFundGoal.saved_amount_paise : 0,
    formatted_emergency_fund: formatPaiseToINR(emergencyFundGoal ? emergencyFundGoal.saved_amount_paise : 0),
    investments_market_value_paise: portfolio.valuation.total_investments_market_value_paise,
    formatted_investments: formatPaiseToINR(portfolio.valuation.total_investments_market_value_paise),
    formatted_portfolio_value: formatPaiseToINR(portfolio.valuation.total_investments_market_value_paise),
    total_virtual_wealth_paise: portfolio.valuation.total_virtual_wealth_paise,
    formatted_total_wealth: formatPaiseToINR(portfolio.valuation.total_virtual_wealth_paise),
    holdings: (portfolio.holdings || []).map(h => ({
      asset_id: h.asset_id,
      symbol: h.symbol,
      name: h.name,
      category: h.asset_category,
      quantity: h.quantity,
      current_price_paise: h.current_price_paise,
      market_value_paise: h.market_value_paise,
      formatted_market_value: formatPaiseToINR(h.market_value_paise)
    })),
    goals: (goalsData.goals || []).map(g => ({
      id: g.id,
      name: g.name,
      category: g.category,
      is_emergency_fund: g.is_emergency_fund,
      saved_amount_paise: g.saved_amount_paise,
      target_amount_paise: g.target_amount_paise,
      percentage_complete: g.percentage_complete,
      formatted_saved: formatPaiseToINR(g.saved_amount_paise),
      formatted_target: formatPaiseToINR(g.target_amount_paise)
    }))
  };
}

/**
 * Pure calculation function: evaluates a single hypothetical choice against
 * an immutable initial snapshot without performing any database updates.
 */
export function evaluateChoice(snapshot, scenario, choice) {
  let resultingCashPaise = snapshot.cash_paise;
  let resultingSavingsPaise = snapshot.savings_paise;
  let resultingEmergencyPaise = snapshot.emergency_fund_paise;
  let resultingInvestmentsPaise = snapshot.investments_market_value_paise;
  let goalImpactNote = null;
  let goalProgress = null;

  switch (scenario.id) {
    // -------------------------------------------------------------------------
    // SCENARIO A: UNEXPECTED EXPENSE (₹8,000)
    // -------------------------------------------------------------------------
    case 'SCN_UNEXPECTED_EXPENSE': {
      const expense = scenario.event_amount_paise; // 8,000 INR
      if (choice.id === 'CHOICE_A1') {
        // Use Emergency Savings Cushion
        resultingSavingsPaise = Math.max(0, snapshot.savings_paise - expense);
        resultingEmergencyPaise = Math.max(0, snapshot.emergency_fund_paise - expense);
        goalImpactNote = 'Emergency Fund drawn down by ₹8,000. Plan to replenish over next 2 months.';
      } else if (choice.id === 'CHOICE_A2') {
        // Use Liquid Cash
        resultingCashPaise = Math.max(0, snapshot.cash_paise - expense);
        goalImpactNote = 'Liquid wallet cash reduced by ₹8,000. Emergency cushion preserved.';
      } else if (choice.id === 'CHOICE_A3') {
        // Liquidate Investments
        const liquidatedAmount = Math.min(snapshot.investments_market_value_paise, expense);
        resultingInvestmentsPaise = Math.max(0, snapshot.investments_market_value_paise - expense);
        // Cash pays the bill so net cash change is 0
        goalImpactNote = `Sold ₹${paiseToRupees(liquidatedAmount).toLocaleString('en-IN')} of investments to fund urgent expense.`;
      }
      break;
    }

    // -------------------------------------------------------------------------
    // SCENARIO B: TEMPORARY INCOME REDUCTION (₹10,000 shortfall)
    // -------------------------------------------------------------------------
    case 'SCN_INCOME_SHOCK': {
      if (choice.id === 'CHOICE_B1') {
        // Cut non-essentials: net dip of only ₹3,000
        resultingCashPaise = Math.max(0, snapshot.cash_paise - 300000);
        goalImpactNote = 'Discretionary spending trimmed by ₹7,000. Net cash dip minimized to ₹3,000.';
      } else if (choice.id === 'CHOICE_B2') {
        // Draw from Emergency Buffer
        resultingSavingsPaise = Math.max(0, snapshot.savings_paise - 1000000);
        resultingEmergencyPaise = Math.max(0, snapshot.emergency_fund_paise - 1000000);
        goalImpactNote = 'Bridged 1-month deficit from emergency cushion. Cash flow maintained.';
      } else if (choice.id === 'CHOICE_B3') {
        // Liquidate investments
        resultingInvestmentsPaise = Math.max(0, snapshot.investments_market_value_paise - 1000000);
        goalImpactNote = 'Liquidated ₹10,000 of investments to maintain current consumption.';
      }
      break;
    }

    // -------------------------------------------------------------------------
    // SCENARIO C: SAVINGS GOAL DEADLINE (₹12,000 needed for Certification)
    // -------------------------------------------------------------------------
    case 'SCN_GOAL_DEADLINE': {
      const deficit = scenario.event_amount_paise; // 12,000 INR
      if (choice.id === 'CHOICE_C1') {
        // Allocate from Cash
        resultingCashPaise = Math.max(0, snapshot.cash_paise - deficit);
        resultingSavingsPaise = snapshot.savings_paise + deficit;
        goalProgress = {
          name: 'Tech Certification Goal',
          target_inr: 25000,
          previous_saved_inr: 13000,
          new_saved_inr: 25000,
          previous_pct: 52,
          new_pct: 100,
          completed: true
        };
        goalImpactNote = 'Certification Goal 100% completed on time!';
      } else if (choice.id === 'CHOICE_C2') {
        // Extend goal deadline by 60 days
        goalProgress = {
          name: 'Tech Certification Goal',
          target_inr: 25000,
          previous_saved_inr: 13000,
          new_saved_inr: 13000,
          previous_pct: 52,
          new_pct: 52,
          completed: false,
          extended_days: 60
        };
        goalImpactNote = 'Deadline extended by 60 days. Cash and savings intact.';
      } else if (choice.id === 'CHOICE_C3') {
        // Raid emergency cushion
        resultingEmergencyPaise = Math.max(0, snapshot.emergency_fund_paise - deficit);
        goalProgress = {
          name: 'Tech Certification Goal',
          target_inr: 25000,
          previous_saved_inr: 13000,
          new_saved_inr: 25000,
          previous_pct: 52,
          new_pct: 100,
          completed: true
        };
        goalImpactNote = 'Goal completed, but Emergency Cushion depleted by ₹12,000.';
      }
      break;
    }

    // -------------------------------------------------------------------------
    // SCENARIO D: SIMULATED MARKET DOWNTURN (18% cyclical pullback)
    // -------------------------------------------------------------------------
    case 'SCN_MARKET_DOWNTURN': {
      // Benchmark portfolio for realistic modeling if user has 0 holdings
      const baselineEquityPaise = snapshot.investments_market_value_paise > 0
        ? Math.round(snapshot.investments_market_value_paise * 0.75)
        : 4000000; // ₹40,000 benchmark
      const baselineDebtPaise = snapshot.investments_market_value_paise > 0
        ? Math.round(snapshot.investments_market_value_paise * 0.25)
        : 1000000; // ₹10,000 benchmark

      if (choice.id === 'CHOICE_D1') {
        // Hold course
        const postDownturnEquity = Math.round(baselineEquityPaise * 0.82); // -18%
        const postDownturnDebt = Math.round(baselineDebtPaise * 1.015);  // +1.5%
        resultingInvestmentsPaise = postDownturnEquity + postDownturnDebt;
        goalImpactNote = 'All units held. Paper portfolio value down 14% net; zero realized losses.';
      } else if (choice.id === 'CHOICE_D2') {
        // Buy the dip with ₹10,000 cash
        const investDipPaise = 1000000;
        resultingCashPaise = Math.max(0, snapshot.cash_paise - investDipPaise);
        const postDownturnEquity = Math.round(baselineEquityPaise * 0.82) + investDipPaise;
        const postDownturnDebt = Math.round(baselineDebtPaise * 1.015);
        resultingInvestmentsPaise = postDownturnEquity + postDownturnDebt;
        goalImpactNote = 'Purchased ₹10,000 of discounted units, lowering average cost basis.';
      } else if (choice.id === 'CHOICE_D3') {
        // Panic sell all equities to cash
        const liquidatedCashPaise = Math.round(baselineEquityPaise * 0.82);
        resultingCashPaise = snapshot.cash_paise + liquidatedCashPaise;
        resultingInvestmentsPaise = Math.round(baselineDebtPaise * 1.015);
        const permanentLossPaise = Math.round(baselineEquityPaise * 0.18);
        goalImpactNote = `Permanently locked in ₹${paiseToRupees(permanentLossPaise).toLocaleString('en-IN')} loss by panic selling at the bottom.`;
      }
      break;
    }

    // -------------------------------------------------------------------------
    // SCENARIO E: FINANCIAL WINDFALL / OPPORTUNITY (₹25,000 surplus)
    // -------------------------------------------------------------------------
    case 'SCN_FINANCIAL_WINDFALL': {
      const windfall = scenario.event_amount_paise; // 25,000 INR
      if (choice.id === 'CHOICE_E1') {
        // 100% to Emergency Savings
        resultingSavingsPaise = snapshot.savings_paise + windfall;
        resultingEmergencyPaise = snapshot.emergency_fund_paise + windfall;
        goalImpactNote = 'Emergency cushion increased by ₹25,000, boosting defensive runway.';
      } else if (choice.id === 'CHOICE_E2') {
        // 50% Goals / 50% Index Fund
        const half = Math.round(windfall / 2);
        resultingSavingsPaise = snapshot.savings_paise + half;
        resultingInvestmentsPaise = snapshot.investments_market_value_paise + half;
        goalImpactNote = '₹12,500 allocated to savings goals + ₹12,500 invested in Nova 50 Index.';
      } else if (choice.id === 'CHOICE_E3') {
        // 100% Equity Investments
        resultingInvestmentsPaise = snapshot.investments_market_value_paise + windfall;
        goalImpactNote = 'Full ₹25,000 invested in equity growth assets for maximum compounding.';
      }
      break;
    }

    default:
      break;
  }

  // Calculate resulting total virtual wealth
  const resultingTotalWealthPaise = resultingCashPaise + resultingSavingsPaise + resultingInvestmentsPaise;

  // Calculate Deltas against initial immutable snapshot
  const cashDeltaPaise = resultingCashPaise - snapshot.cash_paise;
  const savingsDeltaPaise = resultingSavingsPaise - snapshot.savings_paise;
  const investmentsDeltaPaise = resultingInvestmentsPaise - snapshot.investments_market_value_paise;
  const wealthDeltaPaise = resultingTotalWealthPaise - snapshot.total_virtual_wealth_paise;

  const formatDelta = (deltaPaise) => {
    if (deltaPaise === 0) return '₹0.00';
    const prefix = deltaPaise > 0 ? '+' : '';
    return prefix + formatPaiseToINR(deltaPaise);
  };

  return {
    choice_id: choice.id,
    choice_title: choice.title,
    choice_text: choice.title,
    action_type: choice.action_type,
    label: choice.label,
    tradeoff_summary: choice.tradeoff_summary,
    rationale: choice.tradeoff_summary,
    pros: choice.pros,
    cons: choice.cons,
    educational_verdict: choice.educational_verdict,
    educational_takeaway: choice.educational_verdict,
    goal_impact_note: goalImpactNote,
    goal_progress: goalProgress,
    before: {
      cash_paise: snapshot.cash_paise,
      formatted_cash: snapshot.formatted_cash,
      savings_paise: snapshot.savings_paise,
      formatted_savings: snapshot.formatted_savings,
      emergency_fund_paise: snapshot.emergency_fund_paise,
      formatted_emergency_fund: snapshot.formatted_emergency_fund,
      investments_market_value_paise: snapshot.investments_market_value_paise,
      formatted_investments: snapshot.formatted_investments,
      total_paise: snapshot.total_virtual_wealth_paise,
      formatted_total: snapshot.formatted_total_wealth
    },
    after: {
      cash_paise: resultingCashPaise,
      formatted_cash: formatPaiseToINR(resultingCashPaise),
      savings_paise: resultingSavingsPaise,
      formatted_savings: formatPaiseToINR(resultingSavingsPaise),
      emergency_fund_paise: resultingEmergencyPaise,
      formatted_emergency_fund: formatPaiseToINR(resultingEmergencyPaise),
      investments_market_value_paise: resultingInvestmentsPaise,
      formatted_investments: formatPaiseToINR(resultingInvestmentsPaise),
      total_paise: resultingTotalWealthPaise,
      formatted_total: formatPaiseToINR(resultingTotalWealthPaise)
    },
    delta_cash: cashDeltaPaise,
    delta_savings: savingsDeltaPaise,
    delta_investments: investmentsDeltaPaise,
    resulting_state: {
      cash_paise: resultingCashPaise,
      formatted_cash: formatPaiseToINR(resultingCashPaise),
      savings_paise: resultingSavingsPaise,
      formatted_savings: formatPaiseToINR(resultingSavingsPaise),
      emergency_fund_paise: resultingEmergencyPaise,
      formatted_emergency_fund: formatPaiseToINR(resultingEmergencyPaise),
      investments_market_value_paise: resultingInvestmentsPaise,
      formatted_investments: formatPaiseToINR(resultingInvestmentsPaise),
      total_virtual_wealth_paise: resultingTotalWealthPaise,
      formatted_total_wealth: formatPaiseToINR(resultingTotalWealthPaise)
    },
    deltas: {
      cash_delta_paise: cashDeltaPaise,
      formatted_cash_delta: formatDelta(cashDeltaPaise),
      is_cash_positive: cashDeltaPaise >= 0,
      savings_delta_paise: savingsDeltaPaise,
      formatted_savings_delta: formatDelta(savingsDeltaPaise),
      is_savings_positive: savingsDeltaPaise >= 0,
      investments_delta_paise: investmentsDeltaPaise,
      formatted_investments_delta: formatDelta(investmentsDeltaPaise),
      is_investments_positive: investmentsDeltaPaise >= 0,
      wealth_delta_paise: wealthDeltaPaise,
      formatted_wealth_delta: formatDelta(wealthDeltaPaise),
      is_wealth_positive: wealthDeltaPaise >= 0
    }
  };
}

/**
 * Evaluates a scenario either for a single selected choice or all choices
 * side-by-side, strictly evaluated against the same initial snapshot.
 */
export function evaluateScenario(userId = DEMO_USER_ID, scenarioId, selectedChoiceId = null) {
  const scenario = getScenarioById(scenarioId);
  if (!scenario) {
    throw new Error(`Scenario "${scenarioId}" not found in catalog.`);
  }

  // Authoritative immutable snapshot
  const snapshot = getFinancialSnapshot(userId);

  // Evaluate all choices side-by-side
  const evaluations = scenario.choices.map(choice => evaluateChoice(snapshot, scenario, choice));

  const selectedEvaluation = selectedChoiceId 
    ? evaluations.find(e => e.choice_id === selectedChoiceId) || evaluations[0]
    : null;

  return {
    scenario: {
      id: scenario.id,
      title: scenario.title,
      category: scenario.category,
      severity: scenario.severity,
      event_amount_paise: scenario.event_amount_paise,
      formatted_event_amount: scenario.event_amount_paise > 0 ? formatPaiseToINR(scenario.event_amount_paise) : null,
      description: scenario.description,
      context_condition: scenario.context_condition,
      learning_objective: scenario.learning_objective
    },
    snapshot,
    selected_choice_id: selectedChoiceId,
    selected_evaluation: selectedEvaluation,
    side_by_side_evaluations: evaluations
  };
}
