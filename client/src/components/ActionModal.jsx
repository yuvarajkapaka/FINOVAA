import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  Loader2, 
  Info,
  Building2,
  Vault,
  ArrowRightLeft
} from 'lucide-react';
import { apiFetch } from '../api/config';

const LARGE_EXPENSE_THRESHOLD_INR = 10000;

export default function ActionModal({
  isOpen,
  actionType, // 'INCOME' | 'EXPENSE' | 'TRANSFER' | 'WITHDRAW'
  onClose,
  wallet,
  categories,
  onSuccess
}) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [fieldError, setFieldError] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default category and reset state when actionType changes or modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (actionType === 'INCOME') {
      setCategory(categories?.income_categories?.[0] || 'Salary');
    } else if (actionType === 'EXPENSE') {
      setCategory(categories?.expense_categories?.[0] || 'Food & Groceries');
    }
    setAmount('');
    setDescription('');
    setIsConfirmed(false);
    setFieldError(null);
    setServerError(null);
  }, [actionType, categories, isOpen]);

  const currentCashINR = wallet?.balances?.current_balance_inr || 0;
  const currentSavingsINR = wallet?.balances?.savings_balance_inr || 0;
  const currentTotalINR = currentCashINR + currentSavingsINR;

  const numericAmount = parseFloat(amount);
  const isValidNumber = !isNaN(numericAmount) && numericAmount > 0;
  const isLargeExpense = actionType === 'EXPENSE' && isValidNumber && numericAmount >= LARGE_EXPENSE_THRESHOLD_INR;

  // Live as-you-type validation
  const validationError = useMemo(() => {
    if (!amount || amount.trim() === '') return null;
    if (isNaN(numericAmount)) return 'Please enter a valid numeric amount';
    if (numericAmount <= 0) return 'Amount must be greater than ₹0';

    if (actionType === 'EXPENSE') {
      if (numericAmount > currentCashINR) {
        return `Exceeds available liquid cash (₹${currentCashINR.toLocaleString('en-IN')})`;
      }
    } else if (actionType === 'TRANSFER') {
      if (numericAmount > currentCashINR) {
        return `Cannot deposit more than available liquid cash (₹${currentCashINR.toLocaleString('en-IN')})`;
      }
    } else if (actionType === 'WITHDRAW') {
      if (numericAmount > currentSavingsINR) {
        return `Cannot withdraw more than current savings vault (₹${currentSavingsINR.toLocaleString('en-IN')})`;
      }
    }
    return null;
  }, [amount, numericAmount, actionType, currentCashINR, currentSavingsINR]);

  // Projected balances preview
  const projections = useMemo(() => {
    if (!isValidNumber || validationError) {
      return {
        projectedCash: currentCashINR,
        projectedSavings: currentSavingsINR,
        projectedTotal: currentTotalINR,
        cashDelta: 0,
        savingsDelta: 0,
        totalDelta: 0
      };
    }

    let projectedCash = currentCashINR;
    let projectedSavings = currentSavingsINR;
    let cashDelta = 0;
    let savingsDelta = 0;
    let totalDelta = 0;

    switch (actionType) {
      case 'INCOME':
        projectedCash += numericAmount;
        cashDelta = numericAmount;
        totalDelta = numericAmount;
        break;
      case 'EXPENSE':
        projectedCash -= numericAmount;
        cashDelta = -numericAmount;
        totalDelta = -numericAmount;
        break;
      case 'TRANSFER':
        projectedCash -= numericAmount;
        projectedSavings += numericAmount;
        cashDelta = -numericAmount;
        savingsDelta = numericAmount;
        totalDelta = 0; // Conservation of money
        break;
      case 'WITHDRAW':
        projectedSavings -= numericAmount;
        projectedCash += numericAmount;
        cashDelta = numericAmount;
        savingsDelta = -numericAmount;
        totalDelta = 0; // Conservation of money
        break;
      default:
        break;
    }

    return {
      projectedCash: Math.max(0, projectedCash),
      projectedSavings: Math.max(0, projectedSavings),
      projectedTotal: Math.max(0, projectedCash + projectedSavings),
      cashDelta,
      savingsDelta,
      totalDelta
    };
  }, [isValidNumber, validationError, numericAmount, actionType, currentCashINR, currentSavingsINR, currentTotalINR]);

  if (!isOpen) return null;

  const getActionConfig = () => {
    switch (actionType) {
      case 'INCOME':
        return {
          title: 'Record Simulated Income',
          subtitle: 'Credits funds into your unencumbered liquid cash balance',
          badge: 'Income Addition',
          badgeColor: 'bg-pos/10 text-pos border-pos/20',
          submitBtnText: 'Confirm & Credit Income',
          submitBtnClass: 'bg-forest hover:bg-forest-light text-canvas-white',
          endpoint: '/api/wallet/income'
        };
      case 'EXPENSE':
        return {
          title: 'Record Living Expense',
          subtitle: 'Debits funds from available liquid cash to reflect real-world costs',
          badge: 'Expense Deduction',
          badgeColor: 'bg-neg/10 text-neg border-neg/20',
          submitBtnText: 'Confirm & Deduct Expense',
          submitBtnClass: 'bg-neg hover:bg-neg/90 text-canvas-white',
          endpoint: '/api/wallet/expense'
        };
      case 'TRANSFER':
        return {
          title: 'Deposit into Savings Vault',
          subtitle: 'Allocates liquid cash into savings without altering total net worth',
          badge: 'Capital Allocation',
          badgeColor: 'bg-olive/10 text-olive border-olive/20',
          submitBtnText: 'Confirm & Transfer to Vault',
          submitBtnClass: 'bg-olive hover:bg-olive/90 text-canvas-white',
          endpoint: '/api/wallet/transfer'
        };
      case 'WITHDRAW':
        return {
          title: 'Withdraw from Savings Vault',
          subtitle: 'Re-allocates vault reserves back into unencumbered liquid cash',
          badge: 'Reserve Liquidation',
          badgeColor: 'bg-copper/10 text-copper border-copper/20',
          submitBtnText: 'Confirm & Return to Cash',
          submitBtnClass: 'bg-copper hover:bg-copper-dark text-canvas-white',
          endpoint: '/api/wallet/withdraw'
        };
      default:
        return {
          title: 'Financial Action',
          subtitle: 'Execute transaction',
          badge: 'Wallet Action',
          badgeColor: 'bg-canvas-subtle text-ink-muted border-edge',
          submitBtnText: 'Submit',
          submitBtnClass: 'bg-forest text-canvas-white',
          endpoint: '/api/wallet'
        };
    }
  };

  const config = getActionConfig();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError(null);
    setServerError(null);

    if (!isValidNumber) {
      setFieldError('Please enter a valid positive amount.');
      return;
    }
    if (validationError) {
      setFieldError(validationError);
      return;
    }
    if (!isConfirmed) {
      setFieldError('Please check the confirmation box to authorize this action.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        amount: numericAmount,
        ...(description ? { description: description.trim() } : {}),
        ...((actionType === 'INCOME' || actionType === 'EXPENSE') && category ? { category } : {})
      };

      const res = await apiFetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server rejected the request.');
      }

      onSuccess(data.message || `Successfully executed ${config.badge}.`);
      onClose();
    } catch (err) {
      setServerError(err.message || 'Network error executing transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-canvas-white border border-edge rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-edge flex items-center justify-between bg-canvas-subtle">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.badgeColor} uppercase tracking-wider`}>
                {config.badge}
              </span>
              <h3 className="font-serif text-base font-bold text-ink">
                {config.title}
              </h3>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">
              {config.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-edge/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Server Error Alert */}
          {serverError && (
            <div className="p-3 rounded-xl bg-neg/10 border border-neg/30 text-neg text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Amount input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted">
                Amount (₹ INR) <span className="text-neg">*</span>
              </label>
              {/* Quick shortcut chips */}
              <div className="flex items-center space-x-1">
                {[500, 1000, 5000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setAmount(val.toString());
                      setFieldError(null);
                    }}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-canvas-subtle hover:bg-canvas-subtle/80 text-ink border border-edge transition"
                  >
                    +₹{val.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-ink-muted text-sm font-mono">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                placeholder="e.g. 5000"
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setFieldError(null);
                }}
                disabled={isSubmitting}
                className={`w-full bg-canvas-subtle border rounded-lg pl-8 pr-4 py-2 text-ink font-mono placeholder:text-ink-muted focus:outline-none transition text-sm ${
                  (validationError || fieldError) 
                    ? 'border-neg focus:border-neg' 
                    : 'border-edge focus:border-forest'
                }`}
              />
            </div>

            {(validationError || fieldError) && (
              <p className="text-neg text-xs mt-1.5 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{validationError || fieldError}</span>
              </p>
            )}
          </div>

          {/* INTERACTIVE EXPECTED BALANCE PREVIEW */}
          <div className="rounded-xl bg-canvas-subtle border border-edge p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-ink-muted uppercase tracking-wider text-[10px]">
                Expected Balance Preview
              </span>
              <span className="text-[10px] font-mono text-ink-muted">
                Calculated live
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {/* Cash preview */}
              <div className="p-2 rounded-lg bg-canvas-white border border-edge space-y-1">
                <span className="text-[10px] text-ink-muted block">Liquid Cash</span>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-ink-muted text-[11px]">₹{currentCashINR.toLocaleString('en-IN')}</span>
                  <span className="text-ink-muted text-[10px]">→</span>
                  <span className={`font-bold ${
                    projections.cashDelta > 0 
                      ? 'text-pos' 
                      : projections.cashDelta < 0 
                      ? 'text-neg' 
                      : 'text-ink'
                  }`}>
                    ₹{projections.projectedCash.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Savings preview */}
              <div className="p-2 rounded-lg bg-canvas-white border border-edge space-y-1">
                <span className="text-[10px] text-ink-muted block">Savings Vault</span>
                <div className="flex items-baseline justify-between font-mono">
                  <span className="text-ink-muted text-[11px]">₹{currentSavingsINR.toLocaleString('en-IN')}</span>
                  <span className="text-ink-muted text-[10px]">→</span>
                  <span className={`font-bold ${
                    projections.savingsDelta > 0 
                      ? 'text-olive' 
                      : projections.savingsDelta < 0 
                      ? 'text-copper' 
                      : 'text-ink'
                  }`}>
                    ₹{projections.projectedSavings.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* Total Virtual Capital Note */}
            <div className="flex items-center justify-between text-[11px] pt-1 border-t border-edge font-mono text-ink-muted">
              <span>Total Capital:</span>
              <span className="text-ink font-semibold">
                ₹{projections.projectedTotal.toLocaleString('en-IN')}
                {projections.totalDelta !== 0 && (
                  <span className={`ml-1 text-[10px] ${projections.totalDelta > 0 ? 'text-pos' : 'text-neg'}`}>
                    ({projections.totalDelta > 0 ? '+' : ''}₹{projections.totalDelta.toLocaleString('en-IN')})
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Category selection (for Income or Expense) */}
          {(actionType === 'INCOME' || actionType === 'EXPENSE') && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                Category <span className="text-neg">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                disabled={isSubmitting}
                className="w-full bg-canvas-subtle border border-edge rounded-lg px-3 py-2 text-ink focus:outline-none focus:border-forest transition text-sm"
              >
                {(actionType === 'INCOME' ? categories?.income_categories : categories?.expense_categories)?.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description input */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
              Description / Notes (Optional)
            </label>
            <input
              type="text"
              placeholder={actionType === 'INCOME' ? 'e.g. Monthly stipend or scholarship grant' : 'e.g. Weekly essentials or book purchase'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isSubmitting}
              maxLength={120}
              className="w-full bg-canvas-subtle border border-edge rounded-lg px-3 py-2 text-ink placeholder:text-ink-muted focus:outline-none focus:border-forest transition text-sm"
            />
          </div>

          {/* Conservation of Money Notice for Transfers */}
          {(actionType === 'TRANSFER' || actionType === 'WITHDRAW') && (
            <div className="p-3 rounded-xl bg-forest/10 border border-forest/20 text-xs text-forest flex items-start space-x-2">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-forest" />
              <div>
                <span className="font-semibold">Conservation of Money:</span>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  Transferring capital between liquid cash and savings preserves your total net funds. Capital moves between functional accounts without loss or creation.
                </p>
              </div>
            </div>
          )}

          {/* Large Expense Warning Notice */}
          {isLargeExpense && (
            <div className="p-3 rounded-xl bg-copper/10 border border-copper/30 text-copper text-xs space-y-1">
              <div className="flex items-center space-x-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-copper" />
                <span>Large Expense Warning</span>
              </div>
              <p className="text-[11px] text-ink-muted">
                You are logging an expense of ₹{numericAmount.toLocaleString('en-IN')}. Please confirm this intentional deduction.
              </p>
            </div>
          )}

          {/* EXPLICIT CONFIRMATION STEP */}
          <div className="pt-2">
            <label className="flex items-start space-x-2.5 p-3 rounded-xl bg-canvas-subtle border border-edge hover:border-edge-dark cursor-pointer transition">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => {
                  setIsConfirmed(e.target.checked);
                  setFieldError(null);
                }}
                disabled={isSubmitting}
                className="rounded border-edge text-forest focus:ring-forest w-4 h-4 mt-0.5"
              />
              <span className="text-xs text-ink leading-snug">
                I have reviewed the projected balance and confirm this <strong className="text-ink">{config.badge}</strong> of <strong className="text-ink font-mono">₹{(isValidNumber ? numericAmount : 0).toLocaleString('en-IN')}</strong>.
              </span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-edge">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-ink-muted hover:text-ink text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !isValidNumber || Boolean(validationError) || !isConfirmed}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs transition flex items-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed ${config.submitBtnClass}`}
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{config.submitBtnText}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
