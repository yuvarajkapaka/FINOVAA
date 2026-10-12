import { getDatabase } from '../db/database.js';
import { DEMO_USER_ID } from '../db/schema.js';
import { parseRupeesToPaise, formatPaiseToINR, paiseToRupees } from '../utils/currency.js';
import { getWallet } from './walletService.js';

export const VALID_GOAL_CATEGORIES = [
  'Emergency',
  'Education',
  'Gadget & Tech',
  'Travel & Vacation',
  'Vehicle',
  'Home & Living',
  'Retirement & Long-term',
  'General'
];

export const EMERGENCY_FUND_EDUCATION = {
  title: 'Why Every Financial Plan Begins With an Emergency Fund',
  tagline: 'Your Financial Shock Absorber',
  description: 'An emergency fund is a dedicated pool of money set aside strictly for unanticipated expenses—such as sudden medical bills, critical home/vehicle repairs, or sudden loss of income. Financial experts recommend maintaining 3 to 6 months of essential living expenses.',
  key_principles: [
    'Liquidity First: Keep this buffer easily accessible in low-risk, high-liquidity instruments.',
    'Debt Shield: Having savings prevents you from relying on high-interest credit cards or loans.',
    'Investment Protection: It stops you from being forced to sell your long-term investments in a market downturn.'
  ]
};

/**
 * Retrieves all savings goals for the user, complete with calculations and summary.
 */
export function getGoals(userId = DEMO_USER_ID) {
  const db = getDatabase();
  const wallet = db.prepare('SELECT id, current_balance, savings_balance FROM wallets WHERE user_id = ?').get(userId);

  if (!wallet) {
    throw new Error(`Wallet not found for user "${userId}".`);
  }

  const rows = db.prepare(`
    SELECT * FROM savings_goals 
    WHERE wallet_id = ? 
    ORDER BY is_emergency_fund DESC, status ASC, created_at DESC
  `).all(wallet.id);

  let totalTargetPaise = 0;
  let totalSavedInGoalsPaise = 0;

  const mappedGoals = rows.map(goal => {
    totalTargetPaise += goal.target_amount;
    totalSavedInGoalsPaise += goal.current_amount;

    const remainingPaise = Math.max(0, goal.target_amount - goal.current_amount);
    const percentage = goal.target_amount > 0 
      ? Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100))
      : 0;

    return {
      id: goal.id,
      wallet_id: goal.wallet_id,
      name: goal.name,
      category: goal.category,
      target_amount_paise: goal.target_amount,
      target_amount_inr: paiseToRupees(goal.target_amount),
      target_formatted: formatPaiseToINR(goal.target_amount),
      current_amount_paise: goal.current_amount,
      current_amount_inr: paiseToRupees(goal.current_amount),
      current_formatted: formatPaiseToINR(goal.current_amount),
      remaining_amount_paise: remainingPaise,
      remaining_amount_inr: paiseToRupees(remainingPaise),
      remaining_formatted: formatPaiseToINR(remainingPaise),
      percentage_complete: percentage,
      target_date: goal.target_date,
      is_emergency_fund: Boolean(goal.is_emergency_fund),
      status: goal.status,
      is_completed: goal.status === 'COMPLETED' || goal.current_amount >= goal.target_amount,
      created_at: goal.created_at,
      updated_at: goal.updated_at
    };
  });

  const unallocatedSavingsPaise = Math.max(0, wallet.savings_balance - totalSavedInGoalsPaise);
  const overallPercentage = totalTargetPaise > 0 
    ? Math.min(100, Math.round((totalSavedInGoalsPaise / totalTargetPaise) * 100))
    : 0;

  return {
    goals: mappedGoals,
    summary: {
      total_goals_count: mappedGoals.length,
      completed_goals_count: mappedGoals.filter(g => g.is_completed).length,
      total_target_paise: totalTargetPaise,
      total_target_formatted: formatPaiseToINR(totalTargetPaise),
      total_saved_in_goals_paise: totalSavedInGoalsPaise,
      total_saved_in_goals_formatted: formatPaiseToINR(totalSavedInGoalsPaise),
      unallocated_savings_paise: unallocatedSavingsPaise,
      unallocated_savings_formatted: formatPaiseToINR(unallocatedSavingsPaise),
      wallet_total_savings_paise: wallet.savings_balance,
      wallet_total_savings_formatted: formatPaiseToINR(wallet.savings_balance),
      overall_percentage: overallPercentage
    }
  };
}

/**
 * Retrieves the dedicated Emergency Fund goal and associated educational metadata.
 */
export function getEmergencyFund(userId = DEMO_USER_ID) {
  const allGoals = getGoals(userId);
  const emergencyGoal = allGoals.goals.find(g => g.is_emergency_fund);

  return {
    goal: emergencyGoal || null,
    education: EMERGENCY_FUND_EDUCATION,
    summary: allGoals.summary
  };
}

/**
 * Creates a new savings goal with 0 initial funds.
 * Guarantees that creating a goal does not create money or modify wallet balances.
 */
export function createGoal(userId = DEMO_USER_ID, { name, target_amount, target_date, category = 'General', is_emergency_fund = false }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new Error('Goal name is required.');
  }

  const targetAmountPaise = parseRupeesToPaise(target_amount);
  if (!targetAmountPaise || targetAmountPaise <= 0) {
    throw new Error('Target amount must be a positive number in Rupees.');
  }

  const cleanCategory = (category && VALID_GOAL_CATEGORIES.includes(category.trim()))
    ? category.trim()
    : 'General';

  const db = getDatabase();
  const wallet = db.prepare('SELECT id FROM wallets WHERE user_id = ?').get(userId);
  if (!wallet) {
    throw new Error(`Wallet not found for user "${userId}".`);
  }

  const now = new Date().toISOString();
  const insertStmt = db.prepare(`
    INSERT INTO savings_goals (wallet_id, name, category, target_amount, current_amount, target_date, is_emergency_fund, status, created_at, updated_at)
    VALUES (?, ?, ?, ?, 0, ?, ?, 'IN_PROGRESS', ?, ?)
  `);

  const result = insertStmt.run(
    wallet.id,
    name.trim(),
    cleanCategory,
    targetAmountPaise,
    target_date ? target_date.trim() : null,
    is_emergency_fund ? 1 : 0,
    now,
    now
  );

  return {
    success: true,
    goal_id: result.lastInsertRowid,
    message: `Savings goal "${name.trim()}" created successfully.`,
    data: getGoals(userId)
  };
}

/**
 * Updates a goal's parameters (name, target amount, target date, category).
 */
export function updateGoal(userId = DEMO_USER_ID, goalId, { name, target_amount, target_date, category, status }) {
  const db = getDatabase();
  const wallet = db.prepare('SELECT id FROM wallets WHERE user_id = ?').get(userId);
  if (!wallet) {
    throw new Error(`Wallet not found for user "${userId}".`);
  }

  const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ? AND wallet_id = ?').get(goalId, wallet.id);
  if (!goal) {
    throw new Error(`Savings goal #${goalId} not found.`);
  }

  let newName = goal.name;
  if (name !== undefined) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new Error('Goal name cannot be empty.');
    }
    newName = name.trim();
  }

  let newTargetPaise = goal.target_amount;
  if (target_amount !== undefined) {
    const parsed = parseRupeesToPaise(target_amount);
    if (!parsed || parsed <= 0) {
      throw new Error('Target amount must be a positive number in Rupees.');
    }
    newTargetPaise = parsed;
  }

  const newCategory = (category && VALID_GOAL_CATEGORIES.includes(category.trim()))
    ? category.trim()
    : goal.category;

  const newTargetDate = target_date !== undefined ? (target_date ? target_date.trim() : null) : goal.target_date;

  // Determine status
  let newStatus = goal.status;
  if (status && (status === 'IN_PROGRESS' || status === 'COMPLETED')) {
    newStatus = status;
  } else if (goal.current_amount >= newTargetPaise) {
    newStatus = 'COMPLETED';
  } else if (goal.current_amount < newTargetPaise && goal.status === 'COMPLETED') {
    newStatus = 'IN_PROGRESS';
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE savings_goals 
    SET name = ?, target_amount = ?, target_date = ?, category = ?, status = ?, updated_at = ?
    WHERE id = ?
  `).run(newName, newTargetPaise, newTargetDate, newCategory, newStatus, now, goal.id);

  return {
    success: true,
    message: `Savings goal "${newName}" updated successfully.`,
    data: getGoals(userId)
  };
}

/**
 * Contributes funds into a savings goal.
 * Source can be 'CASH' (moves from available cash) or 'SAVINGS' (allocates from unassigned savings buffer).
 * Guarantees conservation of money in all scenarios.
 */
export function contributeToGoal(userId = DEMO_USER_ID, goalId, { amount, source = 'CASH' }) {
  const amountPaise = parseRupeesToPaise(amount);
  if (!amountPaise || amountPaise <= 0) {
    throw new Error('Contribution amount must be a positive number in Rupees.');
  }

  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE');

  try {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) {
      throw new Error(`Wallet not found for user "${userId}".`);
    }

    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ? AND wallet_id = ?').get(goalId, wallet.id);
    if (!goal) {
      throw new Error(`Savings goal #${goalId} not found.`);
    }

    const now = new Date().toISOString();
    let newCurrentBalance = wallet.current_balance;
    let newSavingsBalance = wallet.savings_balance;

    if (source === 'CASH') {
      if (wallet.current_balance < amountPaise) {
        const available = formatPaiseToINR(wallet.current_balance);
        const requested = formatPaiseToINR(amountPaise);
        throw new Error(`Insufficient available cash. You have ${available} in cash, but tried to contribute ${requested}.`);
      }

      newCurrentBalance = wallet.current_balance - amountPaise;
      newSavingsBalance = wallet.savings_balance + amountPaise;

      // Update wallet balances
      db.prepare('UPDATE wallets SET current_balance = ?, savings_balance = ?, updated_at = ? WHERE id = ?')
        .run(newCurrentBalance, newSavingsBalance, now, wallet.id);

      // Record ledger transaction
      db.prepare(`
        INSERT INTO transactions (wallet_id, transaction_type, amount, category, description, balance_after, savings_balance_after, created_at)
        VALUES (?, 'TRANSFER_TO_SAVINGS', ?, 'Goal Contribution', ?, ?, ?, ?)
      `).run(
        wallet.id,
        amountPaise,
        `Contributed ${formatPaiseToINR(amountPaise)} to goal: "${goal.name}"`,
        newCurrentBalance,
        newSavingsBalance,
        now
      );
    } else if (source === 'SAVINGS') {
      // Allocate from existing unallocated savings
      const totalSavedInOtherGoalsRow = db.prepare(`
        SELECT COALESCE(SUM(current_amount), 0) as total 
        FROM savings_goals 
        WHERE wallet_id = ? AND id != ?
      `).get(wallet.id, goal.id);

      const unassignedSavings = wallet.savings_balance - (totalSavedInOtherGoalsRow.total + goal.current_amount);
      if (unassignedSavings < amountPaise) {
        const unassignedStr = formatPaiseToINR(Math.max(0, unassignedSavings));
        const requestedStr = formatPaiseToINR(amountPaise);
        throw new Error(`Insufficient unassigned savings buffer. You have ${unassignedStr} unallocated, but tried to allocate ${requestedStr}.`);
      }
      // Wallet cash & total savings remain invariant!
    } else {
      throw new Error(`Invalid contribution source "${source}". Must be 'CASH' or 'SAVINGS'.`);
    }

    // Update goal amount
    const newGoalAmount = goal.current_amount + amountPaise;
    const isNowComplete = newGoalAmount >= goal.target_amount;
    const newStatus = isNowComplete ? 'COMPLETED' : goal.status;

    db.prepare(`
      UPDATE savings_goals 
      SET current_amount = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(newGoalAmount, newStatus, now, goal.id);

    db.exec('COMMIT');

    return {
      success: true,
      message: `Contributed ${formatPaiseToINR(amountPaise)} to "${goal.name}".` + (isNowComplete ? ' 🎉 Target reached!' : ''),
      goal_id: goal.id,
      wallet: getWallet(userId),
      goals: getGoals(userId)
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Withdraws funds from a savings goal.
 * Destination can be 'CASH' (returns to liquid cash) or 'SAVINGS' (returns to unallocated savings buffer).
 * Guarantees conservation of money.
 */
export function withdrawFromGoal(userId = DEMO_USER_ID, goalId, { amount, destination = 'CASH' }) {
  const amountPaise = parseRupeesToPaise(amount);
  if (!amountPaise || amountPaise <= 0) {
    throw new Error('Withdrawal amount must be a positive number in Rupees.');
  }

  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE');

  try {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) {
      throw new Error(`Wallet not found for user "${userId}".`);
    }

    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ? AND wallet_id = ?').get(goalId, wallet.id);
    if (!goal) {
      throw new Error(`Savings goal #${goalId} not found.`);
    }

    if (goal.current_amount < amountPaise) {
      const savedStr = formatPaiseToINR(goal.current_amount);
      const requestedStr = formatPaiseToINR(amountPaise);
      throw new Error(`Insufficient funds in goal "${goal.name}". Goal currently holds ${savedStr}, cannot withdraw ${requestedStr}.`);
    }

    const now = new Date().toISOString();
    let newCurrentBalance = wallet.current_balance;
    let newSavingsBalance = wallet.savings_balance;

    if (destination === 'CASH') {
      newCurrentBalance = wallet.current_balance + amountPaise;
      newSavingsBalance = wallet.savings_balance - amountPaise;

      db.prepare('UPDATE wallets SET current_balance = ?, savings_balance = ?, updated_at = ? WHERE id = ?')
        .run(newCurrentBalance, newSavingsBalance, now, wallet.id);

      db.prepare(`
        INSERT INTO transactions (wallet_id, transaction_type, amount, category, description, balance_after, savings_balance_after, created_at)
        VALUES (?, 'WITHDRAW_FROM_SAVINGS', ?, 'Goal Withdrawal', ?, ?, ?, ?)
      `).run(
        wallet.id,
        amountPaise,
        `Withdrew ${formatPaiseToINR(amountPaise)} from goal: "${goal.name}" to liquid cash`,
        newCurrentBalance,
        newSavingsBalance,
        now
      );
    } else if (destination === 'SAVINGS') {
      // Simply releases allocation back to general unallocated savings buffer
    } else {
      throw new Error(`Invalid withdrawal destination "${destination}". Must be 'CASH' or 'SAVINGS'.`);
    }

    const newGoalAmount = goal.current_amount - amountPaise;
    const newStatus = (goal.status === 'COMPLETED' && newGoalAmount < goal.target_amount) 
      ? 'IN_PROGRESS' 
      : goal.status;

    db.prepare(`
      UPDATE savings_goals 
      SET current_amount = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(newGoalAmount, newStatus, now, goal.id);

    db.exec('COMMIT');

    return {
      success: true,
      message: `Withdrew ${formatPaiseToINR(amountPaise)} from "${goal.name}".`,
      goal_id: goal.id,
      wallet: getWallet(userId),
      goals: getGoals(userId)
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

/**
 * Safely deletes a savings goal.
 * If the goal contains funds, automatically refunds them to liquid cash so no money is lost.
 * Primary emergency fund cannot be deleted to preserve financial resilience.
 */
export function deleteGoal(userId = DEMO_USER_ID, goalId) {
  const db = getDatabase();
  db.exec('BEGIN IMMEDIATE');

  try {
    const wallet = db.prepare('SELECT * FROM wallets WHERE user_id = ?').get(userId);
    if (!wallet) {
      throw new Error(`Wallet not found for user "${userId}".`);
    }

    const goal = db.prepare('SELECT * FROM savings_goals WHERE id = ? AND wallet_id = ?').get(goalId, wallet.id);
    if (!goal) {
      throw new Error(`Savings goal #${goalId} not found.`);
    }

    if (goal.is_emergency_fund === 1) {
      throw new Error('The primary Emergency Buffer Fund cannot be deleted as it is your fundamental safety cushion. You can update its target amount instead.');
    }

    const now = new Date().toISOString();
    let refundMessage = '';

    // If goal had saved money, safely return to available cash
    if (goal.current_amount > 0) {
      const newCurrentBalance = wallet.current_balance + goal.current_amount;
      const newSavingsBalance = wallet.savings_balance - goal.current_amount;

      db.prepare('UPDATE wallets SET current_balance = ?, savings_balance = ?, updated_at = ? WHERE id = ?')
        .run(newCurrentBalance, newSavingsBalance, now, wallet.id);

      db.prepare(`
        INSERT INTO transactions (wallet_id, transaction_type, amount, category, description, balance_after, savings_balance_after, created_at)
        VALUES (?, 'WITHDRAW_FROM_SAVINGS', ?, 'Goal Closed', ?, ?, ?, ?)
      `).run(
        wallet.id,
        goal.current_amount,
        `Released ${formatPaiseToINR(goal.current_amount)} from deleted goal: "${goal.name}" to liquid cash`,
        newCurrentBalance,
        newSavingsBalance,
        now
      );

      refundMessage = ` Released ${formatPaiseToINR(goal.current_amount)} back to available liquid cash.`;
    }

    db.prepare('DELETE FROM savings_goals WHERE id = ?').run(goal.id);

    db.exec('COMMIT');

    return {
      success: true,
      message: `Goal "${goal.name}" deleted successfully.${refundMessage}`,
      wallet: getWallet(userId),
      goals: getGoals(userId)
    };
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
