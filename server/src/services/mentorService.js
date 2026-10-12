import { getWallet } from './walletService.js';
import { getGoals } from './goalService.js';
import { getPortfolio } from './marketService.js';
import { calculateLiteracyScore } from './scoreService.js';
import { getDatabase } from '../db/database.js';
import { DEMO_USER_ID } from '../db/schema.js';
import { formatPaiseToINR, paiseToRupees } from '../utils/currency.js';
import { SCENARIOS } from '../data/scenariosData.js';

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_TIMEOUT_MS = parseInt(process.env.OLLAMA_TIMEOUT_MS, 10) || 50000; // 50s for local LLM inference on consumer GPUs

/**
 * Discovers available local Ollama models by querying /api/tags.
 * Inspects installed model names dynamically rather than assuming a hardcoded model exists.
 * Prioritizes models containing 'qwen', then other local models.
 */
export async function getOllamaStatus() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        isAvailable: false,
        activeModel: null,
        availableModels: [],
        statusMessage: `Ollama returned HTTP status ${response.status}. Using educational fallback.`
      };
    }

    const data = await response.json();
    const models = (data.models || []).map(m => m.name || m.model);

    if (models.length === 0) {
      return {
        isAvailable: true,
        activeModel: null,
        availableModels: [],
        statusMessage: 'Ollama is running but no models are downloaded. Using educational fallback.'
      };
    }

    // Prefer standard Qwen models (e.g. qwen3.5:latest, qwen:latest)
    const exactQwen = models.find(m => m === 'qwen3.5:latest' || m === 'qwen:latest');
    const anyQwen = models.find(m => m.toLowerCase().includes('qwen'));
    const selectedModel = exactQwen || anyQwen || models[0];

    return {
      isAvailable: true,
      activeModel: selectedModel,
      availableModels: models,
      statusMessage: `Connected to local Ollama. Active model: ${selectedModel}`
    };
  } catch (error) {
    return {
      isAvailable: false,
      activeModel: null,
      availableModels: [],
      statusMessage: 'Ollama service is unreachable. Using built-in educational fallback engine.'
    };
  }
}

/**
 * Collects strictly verified, read-only financial data from existing backend services.
 * Distinguishes current virtual financial state from hypothetical simulation results.
 * Prevents trusting untrusted user chat inputs.
 */
export function buildVerifiedFinancialContext(userId = DEMO_USER_ID) {
  const db = getDatabase();

  // 1. Authoritative Wallet balances
  const wallet = getWallet(userId);
  const liquidCashPaise = wallet.balances.current_balance_paise;
  const savingsBalancePaise = wallet.balances.savings_balance_paise;

  // 2. Savings Goals & Emergency Fund
  const goalsData = getGoals(userId);
  const emergencyGoal = goalsData.goals.find(g => g.is_emergency_fund) || null;
  const activeGoalsCount = goalsData.goals.length;

  // 3. Investment Portfolio & Asset Allocation
  const portfolio = getPortfolio(userId);
  const totalWealthPaise = portfolio.valuation.total_virtual_wealth_paise;
  const investmentsMarketValuePaise = portfolio.valuation.total_investments_market_value_paise;
  const totalCostBasisPaise = portfolio.valuation.total_investments_cost_basis_paise;
  const unrealizedPnlPaise = portfolio.valuation.total_unrealized_pnl_paise;
  const unrealizedPnlPct = portfolio.valuation.total_unrealized_pnl_percentage;
  const allocation = portfolio.allocation || {};

  const holdingsSummary = (portfolio.holdings || []).map(h => ({
    symbol: h.symbol,
    name: h.name,
    category: h.category,
    quantity: h.quantity,
    currentPrice: h.formatted_current_price,
    avgBuyPrice: h.formatted_average_price,
    marketValue: formatPaiseToINR(h.quantity * h.current_price_paise),
    pnl: `${h.is_positive ? '+' : ''}${h.unrealized_pnl_percentage}%`
  }));

  // 4. Financial Literacy Score (100.0 pts)
  const scoreData = calculateLiteracyScore(userId);

  // 5. Latest Life Simulation Event & Decision (Read-only)
  const latestSimAction = db.prepare(`
    SELECT scenario_id, choice_id, completed_at
    FROM simulation_completed_actions
    WHERE user_id = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(userId);

  let latestScenarioInfo = null;
  if (latestSimAction) {
    const scn = SCENARIOS.find(s => s.id === latestSimAction.scenario_id);
    if (scn) {
      const choice = scn.choices.find(c => c.id === latestSimAction.choice_id);
      latestScenarioInfo = {
        scenarioTitle: scn.title,
        severity: scn.severity,
        chosenAction: choice ? choice.title : latestSimAction.choice_id,
        tradeoffSummary: choice ? choice.tradeoff_summary : '',
        completedAt: latestSimAction.completed_at
      };
    }
  }

  return {
    userId,
    liquidCashPaise,
    liquidCashFormatted: formatPaiseToINR(liquidCashPaise),
    savingsBalancePaise,
    savingsBalanceFormatted: formatPaiseToINR(savingsBalancePaise),
    emergencyFund: emergencyGoal ? {
      targetPaise: emergencyGoal.target_amount_paise,
      targetFormatted: formatPaiseToINR(emergencyGoal.target_amount_paise),
      savedPaise: emergencyGoal.saved_amount_paise,
      savedFormatted: formatPaiseToINR(emergencyGoal.saved_amount_paise),
      percentage: emergencyGoal.percentage_complete
    } : null,
    activeGoalsCount,
    totalWealthPaise,
    totalWealthFormatted: formatPaiseToINR(totalWealthPaise),
    investmentsMarketValuePaise,
    investmentsMarketValueFormatted: formatPaiseToINR(investmentsMarketValuePaise),
    totalCostBasisFormatted: formatPaiseToINR(totalCostBasisPaise),
    unrealizedPnlPaise,
    unrealizedPnlFormatted: `${unrealizedPnlPaise >= 0 ? '+' : ''}${formatPaiseToINR(unrealizedPnlPaise)}`,
    unrealizedPnlPct,
    allocation: {
      equityPct: allocation.equity_percentage || 0,
      debtPct: allocation.debt_percentage || 0,
      goldPct: allocation.gold_percentage || 0,
      cashPct: allocation.cash_percentage || 0
    },
    holdings: holdingsSummary,
    literacyScore: {
      totalScore: scoreData.total_score,
      tier: scoreData.tier,
      savingsScore: scoreData.breakdown.savings_progress.score,
      knowledgeScore: scoreData.breakdown.financial_knowledge.score,
      decisionsScore: scoreData.breakdown.decision_making.score,
      investmentScore: scoreData.breakdown.investment_learning.score
    },
    latestScenario: latestScenarioInfo
  };
}

/**
 * Builds the comprehensive prompt including verified context and behavioral guardrails.
 */
function buildPromptMessages(userMessage, context) {
  const verifiedContextText = `
=== AUTHORITATIVE VERIFIED FINOVA FINANCIAL CONTEXT (READ-ONLY) ===
All values below are verified directly from the FINOVA database. Do not hallucinate or alter these numbers.
- Liquid Wallet Cash: ${context.liquidCashFormatted}
- Savings Goals Balance: ${context.savingsBalanceFormatted}
- Dedicated Emergency Fund: ${context.emergencyFund ? `${context.emergencyFund.savedFormatted} saved out of ${context.emergencyFund.targetFormatted} target (${context.emergencyFund.percentage}% funded)` : 'Not yet set up'}
- Total Virtual Wealth: ${context.totalWealthFormatted}
- Virtual Investments Market Value: ${context.investmentsMarketValueFormatted} (Cost basis: ${context.totalCostBasisFormatted})
- Total Unrealized P&L: ${context.unrealizedPnlFormatted} (${context.unrealizedPnlPct}%)
- Asset Allocation Breakdown: Equity: ${context.allocation.equityPct}%, Debt: ${context.allocation.debtPct}%, Gold: ${context.allocation.goldPct}%, Cash: ${context.allocation.cashPct}%
- Holdings (${context.holdings.length} assets):
${context.holdings.length > 0 
  ? context.holdings.map(h => `  * ${h.symbol} (${h.name}, ${h.category}): ${h.quantity} units, Market Val: ${h.marketValue}, P&L: ${h.pnl}`).join('\n')
  : '  * No active holdings currently owned.'}
- Financial Literacy Score: ${context.literacyScore.totalScore}/100.0 (Tier: ${context.literacyScore.tier})
  * Savings Progress: ${context.literacyScore.savingsScore}/30.0
  * Financial Knowledge: ${context.literacyScore.knowledgeScore}/25.0
  * Decision-Making: ${context.literacyScore.decisionsScore}/25.0
  * Investment Learning: ${context.literacyScore.investmentScore}/20.0
${context.latestScenario ? `- Latest Simulation Scenario: "${context.latestScenario.scenarioTitle}" -> Choice: "${context.latestScenario.chosenAction}" (${context.latestScenario.tradeoffSummary})` : '- Latest Simulation Scenario: None completed yet.'}
==================================================================
`;

  const systemPrompt = `You are FINOVA's AI Financial Mentor, an encouraging, friendly, and beginner-focused personal finance guide.

ABOUT FINOVA:
FINOVA is a gamified educational simulation platform for learning personal finance, virtual investing, and financial decision-making. All balances, market cycles, and scenarios are strictly virtual and educational.

STRICT INSTRUCTIONS & GUARDRAILS:
1. Simplicity & Tone: Speak in clear, friendly, beginner-accessible English. Avoid dense financial jargon without explaining it.
2. Indian Rupee Context: Use INR (₹) examples where helpful (e.g., ₹500, ₹10,000, ₹50,000).
3. Verified Context Only: When answering questions about the user's balances, portfolio, emergency fund, scenario outcomes, or literacy score, refer ONLY to the verified FINOVA context provided below. NEVER invent balances or trust user-claimed balances.
4. Read-Only Mentor: You are strictly an educator and mentor. You CANNOT execute trades, move funds, or change scores. If asked to buy/sell or transfer money, explain how the user can do it themselves in the FINOVA app.
5. Educational Disclaimer: Never offer personalized real-world financial advice, real brokerage recommendations, or return guarantees. Never claim FINOVA simulated market cycles predict real-world markets.
6. Core Topics: Masterfully explain compound interest, diversification, asset allocation, inflation, emergency funds, budgeting, volatility, realized vs unrealized P&L, scenario trade-offs, and FINOVA score milestones.
7. Keep responses concise, structured, and visually engaging (using markdown bullet points, bold key terms, and short paragraphs).

${verifiedContextText}`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage }
  ];
}

/**
 * Predefined educational responses and dynamic contextual explanations for fallback mode.
 * Provides rich, accurate explanations even if Ollama is unavailable.
 */
export function getEducationalFallback(message, context) {
  const lower = message.toLowerCase().trim();

  // 1. Compound Interest
  if (lower.includes('compound') || lower.includes('interest')) {
    return `### Understanding Compound Interest 📈

**Compound interest** is the interest earned not only on your initial principal amount, but also on the accumulated interest from previous periods. In simple terms: **it is interest earning interest!**

#### The Formula:
$$\\text{Total} = P \\times (1 + r/n)^{nt}$$
- **P** = Principal amount (your starting money)
- **r** = Annual interest rate
- **t** = Time in years

#### Why Time Matters Most (Indian Rupee Example):
Imagine you invest **₹5,000 every month** at an assumed 12% annual return:
- **In 10 years**: You invest ₹6,00,000 → Value becomes approx **₹11.6 Lakhs**.
- **In 20 years**: You invest ₹12,00,000 → Value jumps to approx **₹50 Lakhs**!
- **In 30 years**: You invest ₹18,00,000 → Value grows to over **₹1.76 Crore**!

> **Key Rule**: The best time to start investing was yesterday; the second best time is today. In FINOVA, allocating even small virtual amounts to index funds early lets compounding work its magic over simulation cycles!`;
  }

  // 2. Diversification & Asset Allocation
  if (lower.includes('diversif') || lower.includes('asset allocation') || lower.includes('eggs')) {
    return `### What is Diversification? 🧺

**Diversification** is the practice of spreading your investments across different asset classes, industries, and categories so that your portfolio is not wiped out if a single investment performs poorly.

As the classic proverb says: *"Don't put all your eggs in one basket."*

#### Core Asset Classes in FINOVA:
1. **Equities (Stocks & Equity Index Funds)**:
   - *Role*: High growth potential over long horizons.
   - *Risk*: Higher short-term volatility (prices fluctuate up and down).
2. **Debt & Bonds (Fixed Income)**:
   - *Role*: Regular income and capital stability.
   - *Risk*: Lower returns, but cushions portfolio during market dips.
3. **Gold & Commodities**:
   - *Role*: Inflation hedge and safe-haven asset during economic distress.
   - *Risk*: Does not generate ongoing interest or dividend yield.
4. **Liquid Cash / Savings**:
   - *Role*: Immediate safety buffer and emergency availability.

#### Your Current FINOVA Allocation:
- **Equities**: ${context.allocation.equityPct}%
- **Debt & Bonds**: ${context.allocation.debtPct}%
- **Gold**: ${context.allocation.goldPct}%
- **Liquid Cash**: ${context.allocation.cashPct}%

> **Mentor Tip**: An ideal beginner portfolio often follows a balanced split (e.g., 60% Equity, 30% Debt, 10% Gold) depending on your investment timeline and risk tolerance.`;
  }

  // 3. Explain Portfolio Allocation / Holdings
  if (lower.includes('portfolio') || lower.includes('allocation') || lower.includes('holding') || lower.includes('my assets')) {
    const holdingsList = context.holdings.length > 0
      ? context.holdings.map(h => `- **${h.symbol}** (${h.name}): ${h.quantity} units | Valuation: **${h.marketValue}** | Paper Return: **${h.pnl}**`).join('\n')
      : 'You do not own any active investment assets yet. Visit the **Virtual Marketplace** tab to build your first position!';

    return `### Your Verified FINOVA Portfolio Breakdown 💼

Here is the exact status of your virtual investments from the FINOVA ledger:

- **Total Virtual Wealth**: **${context.totalWealthFormatted}**
- **Virtual Cash Balance**: **${context.liquidCashFormatted}**
- **Investments Market Value**: **${context.investmentsMarketValueFormatted}**
- **Total Cost Basis**: **${context.totalCostBasisFormatted}**
- **Overall Unrealized P&L**: **${context.unrealizedPnlFormatted}** (${context.unrealizedPnlPct}%)

#### Your Holdings:
${holdingsList}

#### Asset Mix:
- **Equity**: ${context.allocation.equityPct}%
- **Debt**: ${context.allocation.debtPct}%
- **Gold**: ${context.allocation.goldPct}%
- **Cash**: ${context.allocation.cashPct}%

> **Mentor Analysis**: Remember that *unrealized profit/loss* is only on paper until you decide to sell. Fluctuations during simulation cycles are completely normal in diversified markets!`;
  }

  // 4. Portfolio value change / market cycles / volatility
  if (lower.includes('why did') || lower.includes('change') || lower.includes('volatilit') || lower.includes('drop') || lower.includes('cycle')) {
    return `### Why Did Your Simulated Portfolio Value Change? 🌊

In FINOVA, asset prices follow deterministic **market cycles** that simulate real-world economic ups and downs:

1. **Economic Expansion & Contraction**:
   - Equities rise strongly during boom cycles but pull back during corrections.
   - Government and corporate bonds remain relatively steady or slightly increase when interest rate cycles change.
   - Gold acts as a defensive anchor when equity markets experience downturns.

2. **Unrealized vs. Realized Loss**:
   - A drop in your portfolio value is an **unrealized (paper) loss**.
   - Your number of owned units remains **100% intact**.
   - A loss only becomes permanent (**realized**) if you panic and sell your units at the bottom!

3. **How to React to Market Dips**:
   - **Stay Calm**: High-quality index funds historically recover over multi-year cycles.
   - **Dollar-Cost Averaging**: Continuing to buy units when prices are lower reduces your average purchase price, positioning you for greater recovery gains.`;
  }

  // 5. Scenario outcome explanation
  if (lower.includes('scenario') || lower.includes('outcome') || lower.includes('decision') || lower.includes('life')) {
    if (context.latestScenario) {
      return `### Explanation of Your Latest Financial Scenario 🎯

You recently navigated the **"${context.latestScenario.scenarioTitle}"** simulation event!

- **Severity Level**: ${context.latestScenario.severity}
- **Action Chosen**: **${context.latestScenario.chosenAction}**
- **Trade-off Analysis**: ${context.latestScenario.tradeoffSummary}

#### The Underlying Financial Principle:
When financial surprises occur (like medical emergencies or vehicle repairs), having a dedicated **Emergency Fund** is your best financial shield:
1. **Using Emergency Savings**: Keeps your long-term compounding investments intact and prevents high-interest emergency borrowing.
2. **Liquidating Investments in Panic**: Forces you to sell units regardless of whether the market is up or down, potentially triggering realized losses and capital gains taxes.
3. **Using Pure Cash**: Works if your checking wallet is well-funded, but may leave you tight on next month's recurring bills.

> Keep testing different choices in the **Life Simulator** tab to observe how alternative decisions impact your wealth trajectory!`;
    }

    return `### Financial-Life Scenarios in FINOVA 🎯

FINOVA's **Life Simulator** presents real-world financial crossroads:
1. **Unexpected Expenses** (e.g. ₹8,000 emergency medical bill)
2. **Income Shocks** (temporary job change or pay reduction)
3. **Discretionary Purchases** (buying luxury items vs investing)
4. **Market Downturn Replays** (panic selling vs buying the dip)

#### Key Takeaway:
The purpose of simulation replays is to experience the consequences of financial decisions in a safe sandbox *before* facing them in real life. Head to the **Life Simulator** tab to test a scenario and compare side-by-side trade-offs!`;
  }

  // 6. Improving Literacy Score
  if (lower.includes('score') || lower.includes('improve') || lower.includes('points') || lower.includes('literacy')) {
    return `### How to Improve Your Financial Literacy Score 🏆

Your current score is **${context.literacyScore.totalScore} / 100.0** (Tier: **${context.literacyScore.tier}**).

FINOVA's score is transparent and divided across **4 core pillars**:

1. **Savings Progress (Current: ${context.literacyScore.savingsScore} / 30.0 pts)**:
   - Build and fund a dedicated Emergency Fund goal (worth up to 15 pts).
   - Create active savings goals and transfer virtual funds to them.
2. **Financial Knowledge (Current: ${context.literacyScore.knowledgeScore} / 25.0 pts)**:
   - Complete reading lessons in the **Academy** tab (15 lessons available).
   - Score 100% on lesson quizzes (re-attempts are welcome to achieve mastery!).
3. **Decision-Making (Current: ${context.literacyScore.decisionsScore} / 25.0 pts)**:
   - Explore and complete scenarios in the **Life Simulator** tab.
   - Review alternative decision trade-offs side-by-side.
4. **Investment Learning (Current: ${context.literacyScore.investmentScore} / 20.0 pts)**:
   - Inspect all asset classes (Equity, Debt, Gold).
   - Maintain a balanced allocation across categories.
   - Pass the Investment Literacy comprehension check.

> **Next Milestone**: Head to the **Academy** or **Savings Goals** tab to pick up quick points and climb the community leaderboard!`;
  }

  // 7. Emergency Fund
  if (lower.includes('emergency') || lower.includes('rainy day')) {
    const efInfo = context.emergencyFund 
      ? `You currently have **${context.emergencyFund.savedFormatted}** saved towards your **${context.emergencyFund.targetFormatted}** goal (${context.emergencyFund.percentage}% complete).`
      : 'You have not created a dedicated Emergency Fund goal yet in FINOVA.';

    return `### The Importance of an Emergency Fund 🛡️

An **Emergency Fund** is a cash reserve set aside strictly for unplanned life events—such as unexpected medical bills, urgent home repairs, or sudden income reduction.

#### Key Principles:
- **How Much?**: Financial planners recommend saving **3 to 6 months of mandatory living expenses** (e.g., rent, food, utilities, loan EMIs).
- **Where to Keep It?**: In highly liquid, risk-free instruments such as a high-interest savings account or liquid mutual funds. **Never invest your emergency fund in volatile stocks or speculative assets.**
- **The Psychological Advantage**: An emergency fund prevents you from taking predatory high-interest loans or liquidating compounding investments during market downturns.

#### Your FINOVA Emergency Fund:
${efInfo}

> Allocate funds to your emergency cushion in the **Savings Goals** tab to strengthen your financial safety net!`;
  }

  // 8. Inflation
  if (lower.includes('inflation') || lower.includes('purchasing power')) {
    return `### Understanding Inflation & Purchasing Power 💸

**Inflation** is the rate at which the general prices of goods and services rise over time, causing each unit of currency to buy fewer goods.

#### Real-Life Example:
- Suppose a loaf of bread costs **₹50** today.
- With an annual inflation rate of **6%**, that same loaf will cost **₹53** next year and approx **₹90** in 10 years!
- If you keep ₹1,00,000 idle in cash under a mattress, its face value remains ₹1,00,000, but its **purchasing power shrinks** dramatically.

#### Why Investing is Necessary:
- **Savings Accounts**: Typically yield 3% to 4%, which is often lower than inflation (meaning negative real return).
- **Diversified Equities & Gold**: Historically outpace inflation over the long term, protecting your purchasing power.`;
  }

  // 9. Budgeting / 50-30-20 Rule
  if (lower.includes('budget') || lower.includes('50/30/20') || lower.includes('spending')) {
    return `### Budgeting Fundamentals: The 50/30/20 Rule 📊

Budgeting isn't about restricting yourself; it's about **giving every rupee a purpose**.

#### The Popular 50/30/20 Framework:
1. **50% for Needs**: Essential expenses required for survival and baseline obligations (Rent, groceries, utilities, transit, insurance).
2. **30% for Wants**: Discretionary lifestyle choices that make life enjoyable (Dining out, streaming subscriptions, vacations, hobbies).
3. **20% for Savings & Debt Payoff**: Building your emergency fund, contributing to retirement, and investing for long-term wealth.

> In FINOVA, practice tracking your income and categorizing expenses in the **Virtual Wallet** ledger to master cash flow!`;
  }

  // 10. Default Educational Overview
  return `### Hello! I am your FINOVA Financial Mentor 🎓

I am here to help you build real-world financial confidence and understand how your virtual FINOVA simulation works!

#### Key Topics We Can Explore:
- **Compound Interest**: How small regular investments multiply over time.
- **Diversification & Asset Allocation**: Spreading risk across Equities, Debt, and Gold.
- **Your FINOVA Portfolio**: Explaining your verified holdings and unrealized P&L.
- **Life Simulations**: Analyzing trade-offs from emergency expenses and income shocks.
- **Financial Literacy Score**: Clear roadmaps to boost your score to 100/100.
- **Emergency Funds & Budgeting**: Protecting yourself against financial stress.

Feel free to click any of the suggested question chips above or type a specific concept you'd like to explore!`;
}

/**
 * Handles incoming chat messages from the user.
 * Validates input, pulls verified financial context, calls Ollama if reachable,
 * and falls back gracefully to deterministic educational explanations.
 */
export async function handleMentorChat(userId = DEMO_USER_ID, userMessage) {
  // 1. Sanitize & validate message
  if (userMessage === undefined || userMessage === null || typeof userMessage !== 'string') {
    throw new Error('Message must be a string.');
  }

  const trimmedMessage = userMessage.trim();
  if (trimmedMessage.length === 0) {
    throw new Error('Message cannot be empty or only whitespace.');
  }

  if (trimmedMessage.length > 1000) {
    throw new Error('Message exceeds maximum allowed length of 1,000 characters.');
  }

  // 2. Fetch authoritative, verified financial context directly from database
  const context = buildVerifiedFinancialContext(userId);

  // 3. Inspect Ollama status and model availability
  const ollamaStatus = await getOllamaStatus();

  // If Ollama is available with a model, try generating a response
  if (ollamaStatus.isAvailable && ollamaStatus.activeModel) {
    try {
      const messages = buildPromptMessages(trimmedMessage, context);
      const systemMsg = messages.find(m => m.role === 'system')?.content || '';
      const userMsg = messages.find(m => m.role === 'user')?.content || trimmedMessage;

      // Use ChatML formatting with raw: true to prevent prolonged thinking stalls in local reasoning models
      const chatMlPrompt = `<|im_start|>system\n${systemMsg}<|im_end|>\n<|im_start|>user\n${userMsg}<|im_end|>\n<|im_start|>assistant\n`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), OLLAMA_TIMEOUT_MS);

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: ollamaStatus.activeModel,
          prompt: chatMlPrompt,
          raw: true,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 250,
            stop: ['<|im_end|>', '<|endoftext|>']
          }
        })
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        let assistantText = data.response || data.message?.content || '';

        // Strip internal thinking tags if present
        assistantText = assistantText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        if (assistantText.length > 0) {
          return {
            success: true,
            reply: assistantText,
            model: ollamaStatus.activeModel,
            mode: 'OLLAMA',
            verifiedContextSummary: {
              liquidCash: context.liquidCashFormatted,
              totalWealth: context.totalWealthFormatted,
              investmentsMarketValue: context.investmentsMarketValueFormatted,
              literacyScore: context.literacyScore.totalScore
            },
            disclaimer: 'FINOVA Educational Mentor — All financial balances and simulated markets are hypothetical educational simulations.'
          };
        }
      }
    } catch (ollamaError) {
      console.warn('[FINOVA Mentor] Ollama inference failed or timed out. Falling back to built-in educational engine:', ollamaError.message);
    }
  }

  // 4. Graceful Fallback Mode: Predefined rich educational explanation
  const fallbackReply = getEducationalFallback(trimmedMessage, context);

  return {
    success: true,
    reply: fallbackReply,
    model: 'FINOVA Educational Knowledge Engine',
    mode: 'FALLBACK',
    verifiedContextSummary: {
      liquidCash: context.liquidCashFormatted,
      totalWealth: context.totalWealthFormatted,
      investmentsMarketValue: context.investmentsMarketValueFormatted,
      literacyScore: context.literacyScore.totalScore
    },
    disclaimer: 'FINOVA Educational Mentor — Predefined educational knowledge fallback active. All balances are hypothetical educational simulations.'
  };
}
