import { getDatabase } from '../db/database.js';
import { DEMO_USER_ID } from '../db/schema.js';
import { calculateDeterministicPrice } from '../data/marketAssetsData.js';
import { formatPaiseToINR, paiseToRupees } from '../utils/currency.js';
import { getWallet } from './walletService.js';

/**
 * Returns all active marketplace assets with current simulated prices,
 * price movements, and recent historical cycle points for chart plotting.
 */
export function getMarketAssets() {
  const db = getDatabase();

  const simState = db.prepare('SELECT current_cycle FROM market_simulation_state WHERE id = 1').get();
  const currentCycle = simState ? simState.current_cycle : 10;

  const assets = db.prepare('SELECT * FROM market_assets WHERE is_active = 1 ORDER BY id ASC').all();

  const mappedAssets = assets.map(asset => {
    const priceChangePaise = asset.current_price_paise - asset.previous_price_paise;
    const priceChangePct = asset.previous_price_paise > 0 
      ? Number(((priceChangePaise / asset.previous_price_paise) * 100).toFixed(2))
      : 0;

    // Fetch the last 10 historical cycle data points for charting
    const historyRows = db.prepare(`
      SELECT cycle_index, price_paise 
      FROM market_price_history 
      WHERE asset_id = ? 
      ORDER BY cycle_index DESC 
      LIMIT 10
    `).all(asset.id);

    // Sort ascending for chronological chart
    const history = historyRows.reverse().map(h => ({
      cycle: `Cycle ${h.cycle_index}`,
      cycle_index: h.cycle_index,
      price_inr: paiseToRupees(h.price_paise),
      price_paise: h.price_paise
    }));

    return {
      id: asset.id,
      symbol: asset.symbol,
      name: asset.name,
      asset_class: asset.asset_class,
      category: asset.category,
      current_price_paise: asset.current_price_paise,
      current_price_inr: paiseToRupees(asset.current_price_paise),
      formatted_price: formatPaiseToINR(asset.current_price_paise),
      previous_price_paise: asset.previous_price_paise,
      formatted_previous_price: formatPaiseToINR(asset.previous_price_paise),
      price_change_paise: priceChangePaise,
      formatted_price_change: formatPaiseToINR(priceChangePaise),
      price_change_percentage: priceChangePct,
      is_positive: priceChangePaise >= 0,
      description: asset.description,
      risk_level: asset.risk_level,
      educational_notes: asset.educational_notes,
      price_history: history
    };
  });

  return {
    assets: mappedAssets,
    current_cycle: currentCycle,
    is_simulated: true,
    disclaimer: 'Educational Simulation — All assets, quotes, and returns are strictly fictional.'
  };
}

/**
 * Returns single asset details with extended price history.
 */
export function getAssetDetail(assetIdOrSymbol) {
  const db = getDatabase();
  let asset = null;

  const numericId = parseInt(assetIdOrSymbol, 10);
  if (!isNaN(numericId)) {
    asset = db.prepare('SELECT * FROM market_assets WHERE id = ?').get(numericId);
  } else {
    asset = db.prepare('SELECT * FROM market_assets WHERE symbol = ?').get(assetIdOrSymbol.toUpperCase());
  }

  if (!asset) {
    throw new Error(`Asset "${assetIdOrSymbol}" not found in marketplace catalog.`);
  }

  const allHistory = db.prepare(`
    SELECT cycle_index, price_paise, recorded_at 
    FROM market_price_history 
    WHERE asset_id = ? 
    ORDER BY cycle_index ASC
  `).all(asset.id).map(h => ({
    cycle: `Cycle ${h.cycle_index}`,
    cycle_index: h.cycle_index,
    price_inr: paiseToRupees(h.price_paise),
    price_paise: h.price_paise
  }));

  const priceChangePaise = asset.current_price_paise - asset.previous_price_paise;
  const priceChangePct = asset.previous_price_paise > 0 
    ? Number(((priceChangePaise / asset.previous_price_paise) * 100).toFixed(2))
    : 0;

  return {
    id: asset.id,
    symbol: asset.symbol,
    name: asset.name,
    asset_class: asset.asset_class,
    category: asset.category,
    current_price_paise: asset.current_price_paise,
    current_price_inr: paiseToRupees(asset.current_price_paise),
    formatted_price: formatPaiseToINR(asset.current_price_paise),
    price_change_percentage: priceChangePct,
    is_positive: priceChangePaise >= 0,
    description: asset.description,
    risk_level: asset.risk_level,
    educational_notes: asset.educational_notes,
    price_history: allHistory
  };
}

/**
 * Advances the simulation market by 1 deterministic cycle.
 * Recalculates prices for all assets reproducibly and stores new history records.
 */
export function advanceMarketCycle() {
  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE');

  try {
    const simState = db.prepare('SELECT current_cycle, total_advances FROM market_simulation_state WHERE id = 1').get();
    const newCycle = (simState ? simState.current_cycle : 10) + 1;
    const newAdvances = (simState ? simState.total_advances : 0) + 1;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE market_simulation_state 
      SET current_cycle = ?, total_advances = ?, last_advanced_at = ? 
      WHERE id = 1
    `).run(newCycle, newAdvances, now);

    const assets = db.prepare('SELECT id, symbol, current_price_paise FROM market_assets WHERE is_active = 1').all();

    const updateAssetStmt = db.prepare(`
      UPDATE market_assets 
      SET previous_price_paise = ?, current_price_paise = ? 
      WHERE id = ?
    `);

    const insertHistoryStmt = db.prepare(`
      INSERT INTO market_price_history (asset_id, cycle_index, price_paise, recorded_at)
      VALUES (?, ?, ?, ?)
    `);

    assets.forEach(asset => {
      const newPrice = calculateDeterministicPrice(asset.symbol, newCycle);
      updateAssetStmt.run(asset.current_price_paise, newPrice, asset.id);
      insertHistoryStmt.run(asset.id, newCycle, newPrice, now);
    });

    db.exec('COMMIT');

    return {
      success: true,
      message: `Market successfully advanced to Simulation Cycle ${newCycle}. Asset prices updated deterministically.`,
      new_cycle: newCycle,
      marketplace: getMarketAssets()
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Buys units of an investment asset using available liquid cash.
 * Guaranteed conservation of wealth at instant of trade: cash decreases, holding increases by exact same amount.
 */
export function buyAsset(userId = DEMO_USER_ID, { asset_id, quantity }) {
  if (asset_id === undefined || asset_id === null || isNaN(parseInt(asset_id, 10))) {
    throw new Error('Valid asset_id is required.');
  }
  const safeAssetId = parseInt(asset_id, 10);

  const safeQuantity = parseInt(quantity, 10);
  if (!safeQuantity || safeQuantity <= 0) {
    throw new Error('Quantity must be a positive integer greater than 0.');
  }

  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE');

  try {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) throw new Error(`Wallet not found for user "${userId}".`);

    const asset = db.prepare('SELECT * FROM market_assets WHERE id = ? AND is_active = 1').get(safeAssetId);
    if (!asset) throw new Error(`Asset #${safeAssetId} does not exist or is inactive.`);

    const authoritativePricePaise = asset.current_price_paise;
    const totalCostPaise = safeQuantity * authoritativePricePaise;

    if (wallet.current_balance < totalCostPaise) {
      const availableStr = formatPaiseToINR(wallet.current_balance);
      const costStr = formatPaiseToINR(totalCostPaise);
      throw new Error(`Insufficient available cash. You have ${availableStr} in cash, but buying ${safeQuantity} units of ${asset.symbol} requires ${costStr}.`);
    }

    const now = new Date().toISOString();
    const newCurrentBalance = wallet.current_balance - totalCostPaise;

    // 1. Deduct cash from wallet
    db.prepare('UPDATE wallets SET current_balance = ?, updated_at = ? WHERE id = ?')
      .run(newCurrentBalance, now, wallet.id);

    // 2. Update or insert investment holding
    const existingHolding = db.prepare(`
      SELECT * FROM investment_holdings WHERE wallet_id = ? AND asset_id = ?
    `).get(wallet.id, asset.id);

    let updatedQuantity = safeQuantity;
    let updatedTotalInvested = totalCostPaise;
    let updatedAvgPrice = authoritativePricePaise;

    if (existingHolding) {
      updatedQuantity = existingHolding.quantity + safeQuantity;
      updatedTotalInvested = existingHolding.total_invested_paise + totalCostPaise;
      updatedAvgPrice = Math.round(updatedTotalInvested / updatedQuantity);

      db.prepare(`
        UPDATE investment_holdings 
        SET quantity = ?, total_invested_paise = ?, average_buy_price_paise = ?, updated_at = ?
        WHERE id = ?
      `).run(updatedQuantity, updatedTotalInvested, updatedAvgPrice, now, existingHolding.id);
    } else {
      db.prepare(`
        INSERT INTO investment_holdings (wallet_id, asset_id, quantity, total_invested_paise, average_buy_price_paise, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(wallet.id, asset.id, updatedQuantity, updatedTotalInvested, updatedAvgPrice, now, now);
    }

    // 3. Record in investment_transactions ledger
    const txResult = db.prepare(`
      INSERT INTO investment_transactions (wallet_id, asset_id, transaction_type, quantity, price_paise, total_amount_paise, realized_pnl_paise, balance_after_paise, created_at)
      VALUES (?, ?, 'BUY', ?, ?, ?, 0, ?, ?)
    `).run(
      wallet.id,
      asset.id,
      safeQuantity,
      authoritativePricePaise,
      totalCostPaise,
      newCurrentBalance,
      now
    );

    // 4. Record in cash ledger
    db.prepare(`
      INSERT INTO transactions (wallet_id, transaction_type, amount, category, description, balance_after, savings_balance_after, created_at)
      VALUES (?, 'EXPENSE', ?, 'Investments', ?, ?, ?, ?)
    `).run(
      wallet.id,
      totalCostPaise,
      `Bought ${safeQuantity} units of ${asset.name} (${asset.symbol}) @ ${formatPaiseToINR(authoritativePricePaise)}`,
      newCurrentBalance,
      wallet.savings_balance,
      now
    );

    db.exec('COMMIT');

    return {
      success: true,
      message: `Successfully purchased ${safeQuantity} units of ${asset.symbol} for ${formatPaiseToINR(totalCostPaise)}.`,
      trade: {
        id: txResult.lastInsertRowid,
        symbol: asset.symbol,
        quantity: safeQuantity,
        price_formatted: formatPaiseToINR(authoritativePricePaise),
        total_formatted: formatPaiseToINR(totalCostPaise)
      },
      portfolio: getPortfolio(userId)
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Sells units of an investment asset and credits proceeds to available cash.
 */
export function sellAsset(userId = DEMO_USER_ID, { asset_id, quantity }) {
  if (asset_id === undefined || asset_id === null || isNaN(parseInt(asset_id, 10))) {
    throw new Error('Valid asset_id is required.');
  }
  const safeAssetId = parseInt(asset_id, 10);

  const safeQuantity = parseInt(quantity, 10);
  if (!safeQuantity || safeQuantity <= 0) {
    throw new Error('Quantity must be a positive integer greater than 0.');
  }

  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE');

  try {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) throw new Error(`Wallet not found for user "${userId}".`);

    const asset = db.prepare('SELECT * FROM market_assets WHERE id = ? AND is_active = 1').get(safeAssetId);
    if (!asset) throw new Error(`Asset #${safeAssetId} does not exist or is inactive.`);

    const holding = db.prepare(`
      SELECT * FROM investment_holdings WHERE wallet_id = ? AND asset_id = ?
    `).get(wallet.id, asset.id);

    if (!holding || holding.quantity < safeQuantity) {
      const owned = holding ? holding.quantity : 0;
      throw new Error(`Insufficient units owned. You own ${owned} units of ${asset.symbol}, but attempted to sell ${safeQuantity}.`);
    }

    const authoritativePricePaise = asset.current_price_paise;
    const saleProceedsPaise = safeQuantity * authoritativePricePaise;
    const costBasisPaise = Math.round(safeQuantity * holding.average_buy_price_paise);
    const realizedPnlPaise = saleProceedsPaise - costBasisPaise;

    const now = new Date().toISOString();
    const newCurrentBalance = wallet.current_balance + saleProceedsPaise;

    // 1. Credit sale proceeds to wallet cash
    db.prepare('UPDATE wallets SET current_balance = ?, updated_at = ? WHERE id = ?')
      .run(newCurrentBalance, now, wallet.id);

    // 2. Reduce or eliminate holding
    if (holding.quantity === safeQuantity) {
      db.prepare('DELETE FROM investment_holdings WHERE id = ?').run(holding.id);
    } else {
      const remainingQty = holding.quantity - safeQuantity;
      const remainingInvested = Math.max(0, holding.total_invested_paise - costBasisPaise);
      db.prepare(`
        UPDATE investment_holdings 
        SET quantity = ?, total_invested_paise = ?, updated_at = ?
        WHERE id = ?
      `).run(remainingQty, remainingInvested, now, holding.id);
    }

    // 3. Record in investment_transactions ledger
    const txResult = db.prepare(`
      INSERT INTO investment_transactions (wallet_id, asset_id, transaction_type, quantity, price_paise, total_amount_paise, realized_pnl_paise, balance_after_paise, created_at)
      VALUES (?, ?, 'SELL', ?, ?, ?, ?, ?, ?)
    `).run(
      wallet.id,
      asset.id,
      safeQuantity,
      authoritativePricePaise,
      saleProceedsPaise,
      realizedPnlPaise,
      newCurrentBalance,
      now
    );

    // 4. Record in cash ledger
    db.prepare(`
      INSERT INTO transactions (wallet_id, transaction_type, amount, category, description, balance_after, savings_balance_after, created_at)
      VALUES (?, 'INCOME', ?, 'Investments', ?, ?, ?, ?)
    `).run(
      wallet.id,
      saleProceedsPaise,
      `Sold ${safeQuantity} units of ${asset.name} (${asset.symbol}) @ ${formatPaiseToINR(authoritativePricePaise)} (Realized P&L: ${formatPaiseToINR(realizedPnlPaise)})`,
      newCurrentBalance,
      wallet.savings_balance,
      now
    );

    db.exec('COMMIT');

    const isProfit = realizedPnlPaise >= 0;
    const pnlPrefix = isProfit ? '+' : '';

    return {
      success: true,
      message: `Successfully sold ${safeQuantity} units of ${asset.symbol} for ${formatPaiseToINR(saleProceedsPaise)} (Realized P&L: ${pnlPrefix}${formatPaiseToINR(realizedPnlPaise)}).`,
      trade: {
        id: txResult.lastInsertRowid,
        symbol: asset.symbol,
        quantity: safeQuantity,
        price_formatted: formatPaiseToINR(authoritativePricePaise),
        proceeds_formatted: formatPaiseToINR(saleProceedsPaise),
        realized_pnl_paise: realizedPnlPaise,
        realized_pnl_formatted: `${pnlPrefix}${formatPaiseToINR(realizedPnlPaise)}`
      },
      portfolio: getPortfolio(userId)
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Returns complete user portfolio valuation, asset allocation, holdings, and trade history.
 *
 * Total Virtual Wealth = Available Cash + Savings Balance + Investment Market Value.
 */
export function getPortfolio(userId = DEMO_USER_ID) {
  const db = getDatabase();
  const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);

  if (!wallet) throw new Error(`Wallet not found for user "${userId}".`);

  // Fetch holdings joined with market asset
  const holdingsRows = db.prepare(`
    SELECT h.*, a.symbol, a.name, a.asset_class, a.category as asset_category, a.current_price_paise, a.risk_level
    FROM investment_holdings h
    JOIN market_assets a ON h.asset_id = a.id
    WHERE h.wallet_id = ?
    ORDER BY (h.quantity * a.current_price_paise) DESC
  `).all(wallet.id);

  let totalInvestmentsMarketValuePaise = 0;
  let totalInvestmentsCostPaise = 0;

  let equityMarketValuePaise = 0;
  let debtMarketValuePaise = 0;
  let goldMarketValuePaise = 0;

  const holdings = holdingsRows.map(h => {
    const marketValuePaise = h.quantity * h.current_price_paise;
    const costBasisPaise = h.total_invested_paise;
    const unrealizedPnlPaise = marketValuePaise - costBasisPaise;
    const unrealizedPct = costBasisPaise > 0 
      ? Number(((unrealizedPnlPaise / costBasisPaise) * 100).toFixed(2))
      : 0;

    totalInvestmentsMarketValuePaise += marketValuePaise;
    totalInvestmentsCostPaise += costBasisPaise;

    if (h.asset_category === 'EQUITY') equityMarketValuePaise += marketValuePaise;
    else if (h.asset_category === 'DEBT') debtMarketValuePaise += marketValuePaise;
    else if (h.asset_category === 'GOLD') goldMarketValuePaise += marketValuePaise;

    const isPositive = unrealizedPnlPaise >= 0;

    return {
      id: h.id,
      asset_id: h.asset_id,
      symbol: h.symbol,
      name: h.name,
      asset_class: h.asset_class,
      category: h.asset_category,
      risk_level: h.risk_level,
      quantity: h.quantity,
      average_buy_price_paise: h.average_buy_price_paise,
      formatted_average_price: formatPaiseToINR(h.average_buy_price_paise),
      current_price_paise: h.current_price_paise,
      formatted_current_price: formatPaiseToINR(h.current_price_paise),
      total_invested_paise: costBasisPaise,
      formatted_total_invested: formatPaiseToINR(costBasisPaise),
      current_market_value_paise: marketValuePaise,
      formatted_market_value: formatPaiseToINR(marketValuePaise),
      unrealized_pnl_paise: unrealizedPnlPaise,
      formatted_unrealized_pnl: (isPositive ? '+' : '') + formatPaiseToINR(unrealizedPnlPaise),
      unrealized_pnl_percentage: unrealizedPct,
      is_positive: isPositive
    };
  });

  const totalUnrealizedPnlPaise = totalInvestmentsMarketValuePaise - totalInvestmentsCostPaise;
  const overallUnrealizedPct = totalInvestmentsCostPaise > 0
    ? Number(((totalUnrealizedPnlPaise / totalInvestmentsCostPaise) * 100).toFixed(2))
    : 0;

  // Realized P&L from trades
  const realizedPnlRow = db.prepare(`
    SELECT COALESCE(SUM(realized_pnl_paise), 0) as total_realized
    FROM investment_transactions
    WHERE wallet_id = ?
  `).get(wallet.id);
  const totalRealizedPnlPaise = realizedPnlRow ? realizedPnlRow.total_realized : 0;

  // Total Virtual Wealth
  const totalVirtualWealthPaise = wallet.current_balance + wallet.savings_balance + totalInvestmentsMarketValuePaise;

  // Asset allocation percentages
  const allocDenominator = totalVirtualWealthPaise > 0 ? totalVirtualWealthPaise : 1;
  const allocation = [
    { name: 'Available Cash', value: paiseToRupees(wallet.current_balance), percentage: Math.round((wallet.current_balance / allocDenominator) * 100), color: '#10B981' },
    { name: 'Savings Buffer', value: paiseToRupees(wallet.savings_balance), percentage: Math.round((wallet.savings_balance / allocDenominator) * 100), color: '#14B8A6' },
    { name: 'Equities', value: paiseToRupees(equityMarketValuePaise), percentage: Math.round((equityMarketValuePaise / allocDenominator) * 100), color: '#3B82F6' },
    { name: 'Fixed Income / Debt', value: paiseToRupees(debtMarketValuePaise), percentage: Math.round((debtMarketValuePaise / allocDenominator) * 100), color: '#8B5CF6' },
    { name: 'Gold / Commodities', value: paiseToRupees(goldMarketValuePaise), percentage: Math.round((goldMarketValuePaise / allocDenominator) * 100), color: '#F59E0B' }
  ].filter(a => a.value > 0);

  // Recent trade history
  const recentTrades = db.prepare(`
    SELECT t.*, a.symbol, a.name 
    FROM investment_transactions t 
    JOIN market_assets a ON t.asset_id = a.id 
    WHERE t.wallet_id = ? 
    ORDER BY t.id DESC 
    LIMIT 20
  `).all(wallet.id).map(t => ({
    id: t.id,
    asset_id: t.asset_id,
    symbol: t.symbol,
    name: t.name,
    transaction_type: t.transaction_type,
    quantity: t.quantity,
    price_paise: t.price_paise,
    formatted_price: formatPaiseToINR(t.price_paise),
    total_amount_paise: t.total_amount_paise,
    formatted_total_amount: formatPaiseToINR(t.total_amount_paise),
    realized_pnl_paise: t.realized_pnl_paise,
    formatted_realized_pnl: (t.realized_pnl_paise >= 0 ? '+' : '') + formatPaiseToINR(t.realized_pnl_paise),
    balance_after_paise: t.balance_after_paise,
    formatted_balance_after: formatPaiseToINR(t.balance_after_paise),
    created_at: t.created_at
  }));

  const isNetUnrealizedPositive = totalUnrealizedPnlPaise >= 0;
  const isNetRealizedPositive = totalRealizedPnlPaise >= 0;

  return {
    wallet: {
      available_cash_paise: wallet.current_balance,
      formatted_available_cash: formatPaiseToINR(wallet.current_balance),
      savings_balance_paise: wallet.savings_balance,
      formatted_savings: formatPaiseToINR(wallet.savings_balance),
      initial_balance_paise: wallet.initial_balance,
      formatted_initial_balance: formatPaiseToINR(wallet.initial_balance)
    },
    valuation: {
      total_investments_market_value_paise: totalInvestmentsMarketValuePaise,
      formatted_market_value: formatPaiseToINR(totalInvestmentsMarketValuePaise),
      total_investments_cost_paise: totalInvestmentsCostPaise,
      formatted_total_cost: formatPaiseToINR(totalInvestmentsCostPaise),
      total_unrealized_pnl_paise: totalUnrealizedPnlPaise,
      formatted_unrealized_pnl: (isNetUnrealizedPositive ? '+' : '') + formatPaiseToINR(totalUnrealizedPnlPaise),
      unrealized_pnl_percentage: overallUnrealizedPct,
      is_unrealized_positive: isNetUnrealizedPositive,
      total_realized_pnl_paise: totalRealizedPnlPaise,
      formatted_realized_pnl: (isNetRealizedPositive ? '+' : '') + formatPaiseToINR(totalRealizedPnlPaise),
      is_realized_positive: isNetRealizedPositive,
      total_virtual_wealth_paise: totalVirtualWealthPaise,
      formatted_total_virtual_wealth: formatPaiseToINR(totalVirtualWealthPaise)
    },
    holdings,
    allocation,
    recent_trades: recentTrades
  };
}
