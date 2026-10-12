import { getDatabase } from './database.js';
import { INITIAL_MARKET_ASSETS, calculateDeterministicPrice } from '../data/marketAssetsData.js';

export const DEMO_USER_ID = 'demo-user-1';
export const INITIAL_VIRTUAL_CAPITAL_PAISE = 10000000; // ₹1,00,000.00 in paise

/**
 * Initializes the database tables, constraints, and demo seed data safely.
 * Safe to run repeatedly on application startup without resetting existing data.
 */
export function initSchema() {
  const db = getDatabase();

  // Create wallets table
  db.exec(`
    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      initial_balance INTEGER NOT NULL,
      current_balance INTEGER NOT NULL CHECK (current_balance >= 0),
      savings_balance INTEGER NOT NULL DEFAULT 0 CHECK (savings_balance >= 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Create transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
      transaction_type TEXT NOT NULL CHECK (transaction_type IN ('INCOME', 'EXPENSE', 'TRANSFER_TO_SAVINGS', 'WITHDRAW_FROM_SAVINGS')),
      amount INTEGER NOT NULL CHECK (amount > 0),
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
      savings_balance_after INTEGER NOT NULL DEFAULT 0 CHECK (savings_balance_after >= 0),
      created_at TEXT NOT NULL
    );
  `);

  // Create savings_goals table
  db.exec(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'General',
      target_amount INTEGER NOT NULL CHECK (target_amount > 0),
      current_amount INTEGER NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
      target_date TEXT,
      is_emergency_fund INTEGER NOT NULL DEFAULT 0 CHECK (is_emergency_fund IN (0, 1)),
      status TEXT NOT NULL DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'COMPLETED')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Create user_lesson_completions table (Academy)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_lesson_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      lesson_id INTEGER NOT NULL,
      completed_at TEXT NOT NULL,
      UNIQUE(user_id, lesson_id)
    );
  `);

  // Create user_quiz_attempts table (Academy)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_quiz_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      lesson_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      total_questions INTEGER NOT NULL,
      passed INTEGER NOT NULL CHECK (passed IN (0, 1)),
      best_score INTEGER NOT NULL DEFAULT 0,
      answers_json TEXT,
      completed_at TEXT NOT NULL
    );
  `);

  // Create market_assets table (Fictional Investment Marketplace)
  db.exec(`
    CREATE TABLE IF NOT EXISTS market_assets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      asset_class TEXT NOT NULL,
      category TEXT NOT NULL,
      base_price_paise INTEGER NOT NULL,
      current_price_paise INTEGER NOT NULL,
      previous_price_paise INTEGER NOT NULL,
      description TEXT NOT NULL,
      risk_level TEXT NOT NULL,
      educational_notes TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );
  `);

  // Create market_price_history table
  db.exec(`
    CREATE TABLE IF NOT EXISTS market_price_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_id INTEGER NOT NULL REFERENCES market_assets(id) ON DELETE CASCADE,
      cycle_index INTEGER NOT NULL,
      price_paise INTEGER NOT NULL,
      recorded_at TEXT NOT NULL
    );
  `);

  // Create market_simulation_state table
  db.exec(`
    CREATE TABLE IF NOT EXISTS market_simulation_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_cycle INTEGER NOT NULL DEFAULT 10,
      total_advances INTEGER NOT NULL DEFAULT 0,
      last_advanced_at TEXT NOT NULL
    );
  `);

  // Create investment_holdings table
  db.exec(`
    CREATE TABLE IF NOT EXISTS investment_holdings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
      asset_id INTEGER NOT NULL REFERENCES market_assets(id) ON DELETE CASCADE,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      total_invested_paise INTEGER NOT NULL CHECK (total_invested_paise >= 0),
      average_buy_price_paise INTEGER NOT NULL CHECK (average_buy_price_paise > 0),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(wallet_id, asset_id)
    );
  `);

  // Create investment_transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS investment_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      wallet_id INTEGER NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
      asset_id INTEGER NOT NULL REFERENCES market_assets(id) ON DELETE CASCADE,
      transaction_type TEXT NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      price_paise INTEGER NOT NULL CHECK (price_paise > 0),
      total_amount_paise INTEGER NOT NULL CHECK (total_amount_paise > 0),
      realized_pnl_paise INTEGER NOT NULL DEFAULT 0,
      balance_after_paise INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Create simulation_completed_actions table (Phase 7: Decision-Making tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS simulation_completed_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      scenario_id TEXT NOT NULL,
      choice_id TEXT NOT NULL,
      reviewed_tradeoffs INTEGER NOT NULL DEFAULT 1,
      completed_at TEXT NOT NULL,
      UNIQUE(user_id, scenario_id, choice_id)
    );
  `);

  // Create investment_learning_actions table (Phase 7: Investment Learning tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS investment_learning_actions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      activity_key TEXT NOT NULL,
      completed_at TEXT NOT NULL,
      UNIQUE(user_id, activity_type, activity_key)
    );
  `);

  // Create score_history table (Phase 7: Progress tracking)
  db.exec(`
    CREATE TABLE IF NOT EXISTS score_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      total_score REAL NOT NULL,
      savings_score REAL NOT NULL,
      knowledge_score REAL NOT NULL,
      decision_score REAL NOT NULL,
      investment_score REAL NOT NULL,
      recorded_at TEXT NOT NULL
    );
  `);

  // Create indexes for efficient retrieval
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_wallet_created ON transactions(wallet_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
    CREATE INDEX IF NOT EXISTS idx_goals_wallet ON savings_goals(wallet_id);
    CREATE INDEX IF NOT EXISTS idx_lesson_completions ON user_lesson_completions(user_id, lesson_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_attempts ON user_quiz_attempts(user_id, lesson_id);
    CREATE INDEX IF NOT EXISTS idx_holdings_wallet ON investment_holdings(wallet_id);
    CREATE INDEX IF NOT EXISTS idx_inv_tx_wallet ON investment_transactions(wallet_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_price_history_asset ON market_price_history(asset_id, cycle_index DESC);
    CREATE INDEX IF NOT EXISTS idx_sim_actions ON simulation_completed_actions(user_id, scenario_id);
    CREATE INDEX IF NOT EXISTS idx_inv_learn_actions ON investment_learning_actions(user_id, activity_type);
    CREATE INDEX IF NOT EXISTS idx_score_history_user ON score_history(user_id, recorded_at DESC);
  `);

  // Check if demo wallet exists
  const existingWalletStmt = db.prepare('SELECT id, current_balance, savings_balance FROM wallets WHERE user_id = ?');
  const existing = existingWalletStmt.get(DEMO_USER_ID);

  let demoWalletId = existing?.id;

  if (!existing) {
    const now = new Date().toISOString();
    
    // Seed demo wallet with ₹1,00,000 virtual money
    const insertWallet = db.prepare(`
      INSERT INTO wallets (user_id, initial_balance, current_balance, savings_balance, created_at, updated_at)
      VALUES (?, ?, ?, 0, ?, ?)
    `);
    const walletResult = insertWallet.run(
      DEMO_USER_ID,
      INITIAL_VIRTUAL_CAPITAL_PAISE,
      INITIAL_VIRTUAL_CAPITAL_PAISE,
      now,
      now
    );

    demoWalletId = walletResult.lastInsertRowid;

    // Seed initial ledger transaction
    const insertTx = db.prepare(`
      INSERT INTO transactions (wallet_id, transaction_type, amount, category, description, balance_after, savings_balance_after, created_at)
      VALUES (?, 'INCOME', ?, 'Initial Capital', 'Initial virtual capital grant for simulation', ?, 0, ?)
    `);
    insertTx.run(
      demoWalletId,
      INITIAL_VIRTUAL_CAPITAL_PAISE,
      INITIAL_VIRTUAL_CAPITAL_PAISE,
      now
    );

    console.log(`[Database] Demo wallet seeded successfully (ID: ${demoWalletId}) with ₹1,00,000 virtual balance.`);
  } else {
    console.log(`[Database] Demo wallet already exists (ID: ${existing.id}) - Preserving user balances.`);
  }

  // Ensure default Emergency Fund goal exists for the demo wallet
  if (demoWalletId) {
    const existingEmergency = db.prepare('SELECT id FROM savings_goals WHERE wallet_id = ? AND is_emergency_fund = 1').get(demoWalletId);
    if (!existingEmergency) {
      const now = new Date().toISOString();
      const targetDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // ~6 months
      const insertEmergency = db.prepare(`
        INSERT INTO savings_goals (wallet_id, name, category, target_amount, current_amount, target_date, is_emergency_fund, status, created_at, updated_at)
        VALUES (?, 'Emergency Buffer Fund', 'Emergency', 3000000, 0, ?, 1, 'IN_PROGRESS', ?, ?)
      `);
      insertEmergency.run(demoWalletId, targetDate, now, now);
      console.log(`[Database] Dedicated Emergency Fund goal seeded for wallet ${demoWalletId}.`);
    }
  }

  // Seed Fictional Market Assets and Historical Cycles if empty
  const assetCountRow = db.prepare('SELECT COUNT(*) as count FROM market_assets').get();
  if (assetCountRow.count === 0) {
    const now = new Date().toISOString();

    // Seed simulation state starting at cycle 10
    db.prepare(`
      INSERT OR REPLACE INTO market_simulation_state (id, current_cycle, total_advances, last_advanced_at)
      VALUES (1, 10, 0, ?)
    `).run(now);

    const insertAssetStmt = db.prepare(`
      INSERT INTO market_assets (symbol, name, asset_class, category, base_price_paise, current_price_paise, previous_price_paise, description, risk_level, educational_notes, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `);

    const insertHistoryStmt = db.prepare(`
      INSERT INTO market_price_history (asset_id, cycle_index, price_paise, recorded_at)
      VALUES (?, ?, ?, ?)
    `);

    INITIAL_MARKET_ASSETS.forEach(item => {
      const currentPrice = calculateDeterministicPrice(item.symbol, 10);
      const previousPrice = calculateDeterministicPrice(item.symbol, 9);

      const res = insertAssetStmt.run(
        item.symbol,
        item.name,
        item.asset_class,
        item.category,
        item.base_price_paise,
        currentPrice,
        previousPrice,
        item.description,
        item.risk_level,
        item.educational_notes
      );

      const assetId = res.lastInsertRowid;

      // Seed 10 historical cycles
      for (let c = 1; c <= 10; c++) {
        const cyclePrice = calculateDeterministicPrice(item.symbol, c);
        insertHistoryStmt.run(assetId, c, cyclePrice, now);
      }
    });

    console.log('[Database] Seeded 6 educational market assets with 10 historical price cycles.');
  }
}
