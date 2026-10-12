/**
 * Fictional Educational Assets for FINOVA Investment Marketplace
 * Prices are strictly simulated and deterministic.
 */

export const INITIAL_MARKET_ASSETS = [
  {
    symbol: 'NOV50',
    name: 'Nova 50 Bluechip Index Fund',
    asset_class: 'Equity Index',
    category: 'EQUITY',
    base_price_paise: 10000, // ₹100.00
    description: 'Passively mirrors top 50 large-cap enterprises in the simulated national economy.',
    risk_level: 'Moderate',
    educational_notes: 'Low expense ratio, zero fund manager bias. Foundation of long-term equity investing.'
  },
  {
    symbol: 'APEX',
    name: 'Apex Multi-Cap Growth Fund',
    asset_class: 'Active Equity',
    category: 'EQUITY',
    base_price_paise: 25000, // ₹250.00
    description: 'Actively managed fund investing across fast-growing mid-cap and small-cap companies.',
    risk_level: 'High',
    educational_notes: 'Higher growth potential with higher short-term price volatility.'
  },
  {
    symbol: 'SGSEC',
    name: 'Sovereign G-Sec Shield Fund',
    asset_class: 'Government Debt',
    category: 'DEBT',
    base_price_paise: 100000, // ₹1,000.00
    description: 'Invests exclusively in central government bonds with sovereign backing.',
    risk_level: 'Low',
    educational_notes: 'Virtually zero credit default risk. Offers steady, predictable coupon payouts.'
  },
  {
    symbol: 'PRISM',
    name: 'Prism Corporate Bond Yield Fund',
    asset_class: 'Corporate Debt',
    category: 'DEBT',
    base_price_paise: 50000, // ₹500.00
    description: 'Invests in diversified AAA and AA rated corporate bonds for steady interest yields.',
    risk_level: 'Low-Moderate',
    educational_notes: 'Higher yield than government debt with moderate interest-rate sensitivity.'
  },
  {
    symbol: 'AURA',
    name: 'Aura Digital Gold Fund',
    asset_class: 'Commodities/Gold',
    category: 'GOLD',
    base_price_paise: 6500, // ₹65.00
    description: 'Backs units with simulated 99.9% pure gold bullion reserves.',
    risk_level: 'Moderate',
    educational_notes: 'Historical hedge against inflation and currency depreciation. Uncorrelated to equities.'
  },
  {
    symbol: 'HORIZON',
    name: 'Bharat Horizon Total Market ETF',
    asset_class: 'Broad ETF',
    category: 'EQUITY',
    base_price_paise: 15000, // ₹150.00
    description: 'Exchange-traded fund tracking the broad entire simulated stock market.',
    risk_level: 'Moderate',
    educational_notes: 'Broadest possible equity diversification across large, mid, and small businesses.'
  }
];

/**
 * Deterministically computes price in paise for a given asset and cycle index.
 * Uses closed-form economic wave functions so price is 100% reproducible anywhere.
 */
export function calculateDeterministicPrice(assetSymbol, cycleIndex) {
  const asset = INITIAL_MARKET_ASSETS.find(a => a.symbol === assetSymbol);
  if (!asset) return 10000;

  const basePrice = asset.base_price_paise;
  const t = Math.max(1, cycleIndex);

  let multiplier = 1.0;

  switch (assetSymbol) {
    case 'NOV50':
      // Steady upward equity trend with 4-cycle mild oscillations
      // ~+0.8% drift per cycle + sinusoidal fluctuation
      multiplier = 1.0 + (t - 1) * 0.008 + 0.045 * Math.sin(t * 0.95);
      break;

    case 'APEX':
      // Higher growth, higher volatility (small-cap/mid-cap beta)
      multiplier = 1.0 + (t - 1) * 0.012 + 0.085 * Math.sin(t * 1.3 + 0.5);
      break;

    case 'SGSEC':
      // Sovereign debt: very low volatility, steady conservative accrual
      multiplier = 1.0 + (t - 1) * 0.005 + 0.006 * Math.sin(t * 0.4);
      break;

    case 'PRISM':
      // Corporate bond: low-moderate yield accrual
      multiplier = 1.0 + (t - 1) * 0.0065 + 0.012 * Math.sin(t * 0.6 + 0.2);
      break;

    case 'AURA':
      // Gold: uncorrelated waves, counter-cyclical surges
      multiplier = 1.0 + (t - 1) * 0.007 + 0.065 * Math.cos(t * 0.85 + 1.2);
      break;

    case 'HORIZON':
      // Broad market ETF: diversified market blend
      multiplier = 1.0 + (t - 1) * 0.0085 + 0.04 * Math.sin(t * 1.05);
      break;

    default:
      multiplier = 1.0 + (t - 1) * 0.005;
  }

  // Prevent negative or absurd prices; ensure minimum 50% of base price
  multiplier = Math.max(0.5, multiplier);
  return Math.round(basePrice * multiplier);
}
