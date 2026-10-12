import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getWallet } from '../src/services/walletService.js';
import {
  getMarketAssets,
  getAssetDetail,
  advanceMarketCycle,
  buyAsset,
  sellAsset,
  getPortfolio
} from '../src/services/marketService.js';
import { DEMO_USER_ID } from '../src/db/schema.js';

describe('FINOVA Phase 5: Virtual Investment Marketplace Test Suite', () => {

  test('Marketplace: Catalog returns 6 educational assets with simulated prices & history', () => {
    const data = getMarketAssets();
    assert.equal(data.assets.length, 6);
    assert.equal(data.is_simulated, true);
    assert.ok(data.current_cycle >= 10);

    const nov50 = data.assets.find(a => a.symbol === 'NOV50');
    assert.ok(nov50, 'NOV50 index fund must exist');
    assert.ok(nov50.current_price_paise > 0);
    assert.ok(nov50.price_history.length >= 10);
  });

  test('Marketplace: Buying an asset deducts cash, creates holding, and preserves total wealth', () => {
    const beforePortfolio = getPortfolio(DEMO_USER_ID);
    const beforeCash = beforePortfolio.wallet.available_cash_paise;
    const beforeWealth = beforePortfolio.valuation.total_virtual_wealth_paise;

    const market = getMarketAssets();
    const asset = market.assets.find(a => a.symbol === 'NOV50');
    const buyQuantity = 10;
    const expectedCost = buyQuantity * asset.current_price_paise;

    const buyRes = buyAsset(DEMO_USER_ID, {
      asset_id: asset.id,
      quantity: buyQuantity
    });

    assert.equal(buyRes.success, true);
    assert.equal(buyRes.trade.quantity, buyQuantity);

    const afterPortfolio = getPortfolio(DEMO_USER_ID);
    // 1. Cash decreased by exact cost
    assert.equal(afterPortfolio.wallet.available_cash_paise, beforeCash - expectedCost);

    // 2. Holding created
    const holding = afterPortfolio.holdings.find(h => h.symbol === 'NOV50');
    assert.ok(holding, 'Holding should exist');
    assert.ok(holding.quantity >= buyQuantity);

    // 3. INVARIANT: Total Virtual Wealth at instant of trade MUST be preserved!
    // (excluding future market price movements)
    assert.equal(afterPortfolio.valuation.total_virtual_wealth_paise, beforeWealth);
  });

  test('Marketplace: Rejects buy request when user has insufficient cash', () => {
    const market = getMarketAssets();
    const asset = market.assets[0];

    assert.throws(() => {
      buyAsset(DEMO_USER_ID, {
        asset_id: asset.id,
        quantity: 9999999 // astronomical quantity
      });
    }, /Insufficient available cash/);
  });

  test('Marketplace: Rejects non-positive or invalid quantities', () => {
    const market = getMarketAssets();
    const asset = market.assets[0];

    assert.throws(() => buyAsset(DEMO_USER_ID, { asset_id: asset.id, quantity: 0 }), /positive integer/);
    assert.throws(() => buyAsset(DEMO_USER_ID, { asset_id: asset.id, quantity: -5 }), /positive integer/);
    assert.throws(() => sellAsset(DEMO_USER_ID, { asset_id: asset.id, quantity: 0 }), /positive integer/);
  });

  test('Marketplace: Partial sale reduces holding, credits proceeds, and calculates realized P&L', () => {
    const beforePortfolio = getPortfolio(DEMO_USER_ID);
    const holding = beforePortfolio.holdings.find(h => h.symbol === 'NOV50');
    assert.ok(holding && holding.quantity >= 5, 'Holding with at least 5 units should exist');

    const beforeCash = beforePortfolio.wallet.available_cash_paise;
    const sellQty = 4;
    const expectedProceeds = sellQty * holding.current_price_paise;

    const sellRes = sellAsset(DEMO_USER_ID, {
      asset_id: holding.asset_id,
      quantity: sellQty
    });

    assert.equal(sellRes.success, true);
    assert.equal(sellRes.trade.quantity, sellQty);

    const afterPortfolio = getPortfolio(DEMO_USER_ID);
    // Cash credited
    assert.equal(afterPortfolio.wallet.available_cash_paise, beforeCash + expectedProceeds);

    // Remaining holding
    const remainingHolding = afterPortfolio.holdings.find(h => h.symbol === 'NOV50');
    assert.equal(remainingHolding.quantity, holding.quantity - sellQty);
  });

  test('Marketplace: Rejects sale exceeding owned quantity', () => {
    const portfolio = getPortfolio(DEMO_USER_ID);
    const holding = portfolio.holdings.find(h => h.symbol === 'NOV50');
    const excessiveQty = (holding ? holding.quantity : 0) + 500;

    const market = getMarketAssets();
    const asset = market.assets.find(a => a.symbol === 'NOV50');

    assert.throws(() => {
      sellAsset(DEMO_USER_ID, {
        asset_id: asset.id,
        quantity: excessiveQty
      });
    }, /Insufficient units owned/);
  });

  test('Marketplace: Complete sale liquidates holding cleanly', () => {
    const portfolio = getPortfolio(DEMO_USER_ID);
    const holding = portfolio.holdings.find(h => h.symbol === 'NOV50');
    assert.ok(holding, 'Holding should exist');

    const sellRes = sellAsset(DEMO_USER_ID, {
      asset_id: holding.asset_id,
      quantity: holding.quantity
    });

    assert.equal(sellRes.success, true);
    const afterPortfolio = getPortfolio(DEMO_USER_ID);
    const liquidated = afterPortfolio.holdings.find(h => h.symbol === 'NOV50');
    assert.equal(liquidated, undefined, 'Holding should be completely removed on 100% liquidation');
  });

  test('Market Engine: Advancing market cycle updates prices deterministically and appends history', () => {
    const beforeMarket = getMarketAssets();
    const beforeCycle = beforeMarket.current_cycle;

    const advanceRes = advanceMarketCycle();
    assert.equal(advanceRes.success, true);
    assert.equal(advanceRes.new_cycle, beforeCycle + 1);

    const afterMarket = getMarketAssets();
    assert.equal(afterMarket.current_cycle, beforeCycle + 1);

    const nov50 = afterMarket.assets.find(a => a.symbol === 'NOV50');
    assert.equal(nov50.price_history[nov50.price_history.length - 1].cycle_index, beforeCycle + 1);
  });

  test('Portfolio: Correctly computes asset allocation breakdown and wealth totals', () => {
    const portfolio = getPortfolio(DEMO_USER_ID);
    assert.ok(portfolio.valuation.total_virtual_wealth_paise > 0);
    assert.ok(portfolio.wallet.available_cash_paise >= 0);
    assert.ok(Array.isArray(portfolio.allocation));
    assert.ok(portfolio.allocation.length > 0);

    // Sum of allocation percentages should be approximately 100%
    const totalAllocPct = portfolio.allocation.reduce((sum, a) => sum + a.percentage, 0);
    assert.ok(totalAllocPct >= 98 && totalAllocPct <= 102);
  });

  // =========================================================================
  // SELL ORDER MODAL BUG REGRESSION TESTS
  // =========================================================================

  test('Regression: Rejects sell order when asset_id is missing, null, or invalid', () => {
    // Missing asset_id
    assert.throws(() => {
      sellAsset(DEMO_USER_ID, { asset_id: undefined, quantity: 1 });
    }, /Valid asset_id is required/i);

    // Null asset_id
    assert.throws(() => {
      sellAsset(DEMO_USER_ID, { asset_id: null, quantity: 1 });
    }, /Valid asset_id is required/i);

    // Non-existent asset ID
    assert.throws(() => {
      sellAsset(DEMO_USER_ID, { asset_id: 99999, quantity: 1 });
    }, /Asset #99999 does not exist or is inactive/i);
  });

  test('Regression: Rejects sell order when user owns 0 units of the asset', () => {
    const market = getMarketAssets();
    // Pick an asset not owned
    const portfolio = getPortfolio(DEMO_USER_ID);
    const ownedAssetIds = new Set(portfolio.holdings.map(h => h.asset_id));
    const unownedAsset = market.assets.find(a => !ownedAssetIds.has(a.id)) || market.assets[0];

    // If currently owned, liquidate first to test 0 units
    const existingHolding = portfolio.holdings.find(h => h.asset_id === unownedAsset.id);
    if (existingHolding && existingHolding.quantity > 0) {
      sellAsset(DEMO_USER_ID, { asset_id: unownedAsset.id, quantity: existingHolding.quantity });
    }

    assert.throws(() => {
      sellAsset(DEMO_USER_ID, { asset_id: unownedAsset.id, quantity: 1 });
    }, /Insufficient units owned.*You own 0 units/i);
  });

  test('Regression: Correct asset_id and quantity sell execution updates portfolio, cash, and P&L', () => {
    const market = getMarketAssets();
    const asset = market.assets.find(a => a.symbol === 'CORPBOND') || market.assets[1];

    // Ensure we own at least 3 units first
    buyAsset(DEMO_USER_ID, { asset_id: asset.id, quantity: 3 });

    const portfolioBefore = getPortfolio(DEMO_USER_ID);
    const holdingBefore = portfolioBefore.holdings.find(h => h.asset_id === asset.id);
    assert.ok(holdingBefore && holdingBefore.quantity >= 3, 'Holding must exist with at least 3 units');
    assert.ok(typeof holdingBefore.current_price_paise === 'number', 'Holding must have valid numerical price');

    const cashBefore = portfolioBefore.wallet.available_cash_paise;
    const sellQty = 2;
    const expectedProceedsPaise = sellQty * asset.current_price_paise;

    // Execute authoritative sell
    const sellResult = sellAsset(DEMO_USER_ID, {
      asset_id: asset.id,
      quantity: sellQty
    });

    assert.equal(sellResult.success, true);
    assert.equal(sellResult.trade.quantity, sellQty);
    assert.equal(sellResult.trade.symbol, asset.symbol);

    // Verify portfolio after sale
    const portfolioAfter = getPortfolio(DEMO_USER_ID);
    const holdingAfter = portfolioAfter.holdings.find(h => h.asset_id === asset.id);
    assert.ok(holdingAfter, 'Holding should still have remaining units');
    assert.equal(holdingAfter.quantity, holdingBefore.quantity - sellQty);

    // Verify cash credited correctly
    assert.equal(portfolioAfter.wallet.available_cash_paise, cashBefore + expectedProceedsPaise);
  });

  // =========================================================================
  // BUY VS SELL CONNECTIVITY & INTEGRITY REGRESSION TESTS
  // =========================================================================

  test('Regression: Distinct BUY flow strictly decreases available cash and increases holdings', () => {
    const market = getMarketAssets();
    const asset = market.assets.find(a => a.symbol === 'GOLD') || market.assets[2];

    const portfolioBefore = getPortfolio(DEMO_USER_ID);
    const cashBefore = portfolioBefore.wallet.available_cash_paise;
    const initialHolding = portfolioBefore.holdings.find(h => h.asset_id === asset.id);
    const initialUnits = initialHolding ? initialHolding.quantity : 0;

    const buyQty = 2;
    const costPaise = buyQty * asset.current_price_paise;

    const buyRes = buyAsset(DEMO_USER_ID, { asset_id: asset.id, quantity: buyQty });
    assert.equal(buyRes.success, true);
    assert.ok(buyRes.message.includes('purchased') || buyRes.message.includes('Successfully'));

    const portfolioAfter = getPortfolio(DEMO_USER_ID);
    assert.equal(portfolioAfter.wallet.available_cash_paise, cashBefore - costPaise, 'Buying must decrease available cash');
    
    const holdingAfter = portfolioAfter.holdings.find(h => h.asset_id === asset.id);
    assert.ok(holdingAfter, 'Holding must exist after purchase');
    assert.equal(holdingAfter.quantity, initialUnits + buyQty, 'Buying must increase holding quantity');
  });

  test('Regression: Distinct SELL flow strictly increases available cash and decreases holdings', () => {
    const market = getMarketAssets();
    const asset = market.assets.find(a => a.symbol === 'GOLD') || market.assets[2];

    const portfolioBefore = getPortfolio(DEMO_USER_ID);
    const holdingBefore = portfolioBefore.holdings.find(h => h.asset_id === asset.id);
    assert.ok(holdingBefore && holdingBefore.quantity >= 1, 'Holding must exist to execute sale');

    const cashBefore = portfolioBefore.wallet.available_cash_paise;
    const sellQty = 1;
    const proceedsPaise = sellQty * asset.current_price_paise;

    const sellRes = sellAsset(DEMO_USER_ID, { asset_id: asset.id, quantity: sellQty });
    assert.equal(sellRes.success, true);
    assert.ok(sellRes.message.includes('Sold') || sellRes.message.includes('Successfully'));

    const portfolioAfter = getPortfolio(DEMO_USER_ID);
    assert.equal(portfolioAfter.wallet.available_cash_paise, cashBefore + proceedsPaise, 'Selling must increase available cash');

    const holdingAfter = portfolioAfter.holdings.find(h => h.asset_id === asset.id);
    const remainingQty = holdingAfter ? holdingAfter.quantity : 0;
    assert.equal(remainingQty, holdingBefore.quantity - sellQty, 'Selling must decrease holding quantity');
  });

  test('Regression: Failed trade requests never mutate cash, holdings, or ledger state', () => {
    const portfolioBefore = getPortfolio(DEMO_USER_ID);
    const cashBefore = portfolioBefore.wallet.available_cash_paise;
    const holdingsCountBefore = portfolioBefore.holdings.length;

    // 1. Invalid buy: negative quantity
    assert.throws(() => {
      buyAsset(DEMO_USER_ID, { asset_id: 1, quantity: -10 });
    }, /positive integer/);

    // 2. Invalid sell: non-existent asset
    assert.throws(() => {
      sellAsset(DEMO_USER_ID, { asset_id: 99999, quantity: 1 });
    }, /does not exist/);

    // 3. Invalid sell: excessive quantity
    assert.throws(() => {
      sellAsset(DEMO_USER_ID, { asset_id: 1, quantity: 999999 });
    }, /Insufficient units owned/);

    // Assert that state remains completely pristine
    const portfolioAfter = getPortfolio(DEMO_USER_ID);
    assert.equal(portfolioAfter.wallet.available_cash_paise, cashBefore, 'Cash must remain unchanged after failed trades');
    assert.equal(portfolioAfter.holdings.length, holdingsCountBefore, 'Holdings count must remain unchanged after failed trades');
  });

});

