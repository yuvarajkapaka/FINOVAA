import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  AlertTriangle, 
  Loader2, 
  Target, 
  Vault, 
  Calendar, 
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

export default function GoalModal({
  isOpen,
  mode, // 'CREATE' | 'EDIT' | 'CONTRIBUTE' | 'WITHDRAW'
  goal, // active goal for edit/contribute/withdraw
  wallet,
  categories,
  onClose,
  onSuccess
}) {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('General');
  const [actionAmount, setActionAmount] = useState('');
  const [sourceOrDest, setSourceOrDest] = useState('CASH');

  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setServerError(null);
    setFieldErrors({});

    if (mode === 'CREATE') {
      setName('');
      setTargetAmount('');
      const defaultDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      setTargetDate(defaultDate);
      setCategory('General');
      setActionAmount('');
      setSourceOrDest('CASH');
    } else if (mode === 'EDIT' && goal) {
      setName(goal.name || '');
      setTargetAmount(goal.target_amount_inr ? goal.target_amount_inr.toString() : '');
      setTargetDate(goal.target_date || '');
      setCategory(goal.category || 'General');
    } else if ((mode === 'CONTRIBUTE' || mode === 'WITHDRAW') && goal) {
      setActionAmount('');
      setSourceOrDest('CASH');
    }
  }, [isOpen, mode, goal]);

  const currentCashINR = wallet?.balances?.current_balance_inr || 0;
  const currentSavingsINR = wallet?.balances?.savings_balance_inr || 0;
  const goalSavedINR = goal?.current_amount_inr || 0;
  const goalTargetINR = goal?.target_amount_inr || 0;

  const numActionAmount = parseFloat(actionAmount);
  const isValidActionAmount = !isNaN(numActionAmount) && numActionAmount > 0;

  // Live as-you-type validation for contribution or withdrawal
  const liveError = useMemo(() => {
    if (mode === 'CONTRIBUTE') {
      if (!actionAmount || actionAmount.trim() === '') return null;
      if (isNaN(numActionAmount) || numActionAmount <= 0) return 'Please enter a valid amount greater than ₹0';
      if (sourceOrDest === 'CASH' && numActionAmount > currentCashINR) {
        return `Exceeds available cash (₹${currentCashINR.toLocaleString('en-IN')})`;
      }
    } else if (mode === 'WITHDRAW') {
      if (!actionAmount || actionAmount.trim() === '') return null;
      if (isNaN(numActionAmount) || numActionAmount <= 0) return 'Please enter a valid amount greater than ₹0';
      if (numActionAmount > goalSavedINR) {
        return `Cannot withdraw more than currently saved (₹${goalSavedINR.toLocaleString('en-IN')})`;
      }
    }
    return null;
  }, [mode, actionAmount, numActionAmount, sourceOrDest, currentCashINR, goalSavedINR]);

  // Projected progress calculation
  const contributionProjections = useMemo(() => {
    if (mode !== 'CONTRIBUTE' || !isValidActionAmount || liveError) {
      return {
        projectedSaved: goalSavedINR,
        projectedPercentage: goal?.percentage_complete || 0,
        projectedRemaining: Math.max(0, goalTargetINR - goalSavedINR),
        willComplete: false
      };
    }

    const projectedSaved = goalSavedINR + numActionAmount;
    const projectedPercentage = goalTargetINR > 0 ? Math.min(100, Math.round((projectedSaved / goalTargetINR) * 100)) : 100;
    const projectedRemaining = Math.max(0, goalTargetINR - projectedSaved);
    const willComplete = projectedSaved >= goalTargetINR;

    return {
      projectedSaved,
      projectedPercentage,
      projectedRemaining,
      willComplete
    };
  }, [mode, isValidActionAmount, liveError, goalSavedINR, numActionAmount, goalTargetINR, goal]);

  if (!isOpen) return null;

  const getHeaderInfo = () => {
    switch (mode) {
      case 'CREATE':
        return {
          title: 'Initialize Savings Goal',
          subtitle: 'Define a purposeful capital target and allocate reserves',
          badge: 'New Goal'
        };
      case 'EDIT':
        return {
          title: `Edit Goal: ${goal?.name}`,
          subtitle: 'Update target amount or expected completion timeline',
          badge: 'Modify Target'
        };
      case 'CONTRIBUTE':
        return {
          title: `Contribute to: ${goal?.name}`,
          subtitle: 'Transfer funds into this dedicated goal allocation',
          badge: 'Capital Contribution'
        };
      case 'WITHDRAW':
        return {
          title: `Withdraw from: ${goal?.name}`,
          subtitle: 'Release allocated reserves back into liquid cash',
          badge: 'Fund Release'
        };
      default:
        return { title: 'Savings Goal', subtitle: '', badge: '' };
    }
  };

  const headerInfo = getHeaderInfo();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError(null);
    const errors = {};

    if (mode === 'CREATE' || mode === 'EDIT') {
      if (!name || name.trim() === '') {
        errors.name = 'Goal name is required';
      }
      const numTarget = parseFloat(targetAmount);
      if (isNaN(numTarget) || numTarget <= 0) {
        errors.targetAmount = 'Please enter a valid target amount greater than ₹0';
      }

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      setIsSubmitting(true);
      try {
        const payload = {
          name: name.trim(),
          target_amount: parseFloat(targetAmount),
          category: category || 'General',
          target_date: targetDate || null
        };

        const url = mode === 'CREATE' ? '/api/goals' : `/api/goals/${goal.id}`;
        const method = mode === 'CREATE' ? 'POST' : 'PUT';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save goal.');

        onSuccess(data.message || (mode === 'CREATE' ? 'Goal created successfully!' : 'Goal updated successfully!'));
        onClose();
      } catch (err) {
        setServerError(err.message);
      } finally {
        setIsSubmitting(false);
      }
    } else if (mode === 'CONTRIBUTE') {
      if (!isValidActionAmount || liveError) {
        setFieldErrors({ actionAmount: liveError || 'Please enter a valid contribution amount' });
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/goals/${goal.id}/contribute`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: numActionAmount,
            source: sourceOrDest
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to contribute to goal.');

        onSuccess(data.message || `Successfully contributed ₹${numActionAmount.toLocaleString('en-IN')}!`);
        onClose();
      } catch (err) {
        setServerError(err.message);
      } finally {
        setIsSubmitting(false);
      }
    } else if (mode === 'WITHDRAW') {
      if (!isValidActionAmount || liveError) {
        setFieldErrors({ actionAmount: liveError || 'Please enter a valid withdrawal amount' });
        return;
      }

      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/goals/${goal.id}/withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: numActionAmount,
            destination: 'CASH'
          })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to withdraw from goal.');

        onSuccess(data.message || `Successfully returned ₹${numActionAmount.toLocaleString('en-IN')} to liquid cash.`);
        onClose();
      } catch (err) {
        setServerError(err.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-canvas-white border border-edge rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-edge flex items-center justify-between bg-canvas-subtle">
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-serif text-base font-bold text-ink">
                {headerInfo.title}
              </h2>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-forest/10 text-forest border border-forest/20 uppercase tracking-wider">
                {headerInfo.badge}
              </span>
            </div>
            <p className="text-xs text-ink-muted mt-0.5">{headerInfo.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-edge/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {serverError && (
            <div className="p-3 rounded-xl bg-neg/10 border border-neg/30 text-neg text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Mode: CREATE or EDIT */}
          {(mode === 'CREATE' || mode === 'EDIT') && (
            <>
              {/* Goal Name */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Goal Name <span className="text-neg">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Higher Education Fund, New Laptop, Emergency Cushion"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFieldErrors(prev => ({ ...prev, name: null }));
                  }}
                  disabled={isSubmitting || (goal?.is_emergency_fund && mode === 'EDIT')}
                  className="w-full bg-canvas-subtle border border-edge rounded-lg px-3 py-2 text-ink placeholder:text-ink-muted focus:outline-none focus:border-forest transition text-sm disabled:opacity-50"
                />
                {fieldErrors.name && (
                  <p className="text-neg text-xs mt-1">{fieldErrors.name}</p>
                )}
              </div>

              {/* Target Amount */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Target Amount (₹ INR) <span className="text-neg">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-ink-muted text-sm font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 50000"
                    value={targetAmount}
                    onChange={(e) => {
                      setTargetAmount(e.target.value);
                      setFieldErrors(prev => ({ ...prev, targetAmount: null }));
                    }}
                    disabled={isSubmitting}
                    className="w-full bg-canvas-subtle border border-edge rounded-lg pl-8 pr-4 py-2 text-ink font-mono placeholder:text-ink-muted focus:outline-none focus:border-forest transition text-sm"
                  />
                </div>
                {fieldErrors.targetAmount && (
                  <p className="text-neg text-xs mt-1">{fieldErrors.targetAmount}</p>
                )}
              </div>

              {/* Category & Target Date Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    disabled={isSubmitting || (goal?.is_emergency_fund && mode === 'EDIT')}
                    className="w-full bg-canvas-subtle border border-edge rounded-lg px-2.5 py-2 text-ink focus:outline-none focus:border-forest transition text-xs disabled:opacity-50"
                  >
                    {(categories || ['General', 'Emergency', 'Education', 'Gadget & Tech', 'Travel & Vacation', 'Vehicle', 'Housing']).map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    disabled={isSubmitting}
                    className="w-full bg-canvas-subtle border border-edge rounded-lg px-2.5 py-1.5 text-ink focus:outline-none focus:border-forest transition text-xs font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {/* Mode: CONTRIBUTE */}
          {mode === 'CONTRIBUTE' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Contribution Amount (₹ INR) <span className="text-neg">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-ink-muted text-sm font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 5000"
                    value={actionAmount}
                    onChange={(e) => {
                      setActionAmount(e.target.value);
                      setFieldErrors(prev => ({ ...prev, actionAmount: null }));
                    }}
                    disabled={isSubmitting}
                    className={`w-full bg-canvas-subtle border rounded-lg pl-8 pr-4 py-2 text-ink font-mono placeholder:text-ink-muted focus:outline-none transition text-sm ${
                      (liveError || fieldErrors.actionAmount)
                        ? 'border-neg focus:border-neg'
                        : 'border-edge focus:border-forest'
                    }`}
                  />
                </div>
                {(liveError || fieldErrors.actionAmount) && (
                  <p className="text-neg text-xs mt-1">{liveError || fieldErrors.actionAmount}</p>
                )}

                <div className="text-[11px] text-ink-muted mt-1 flex justify-between font-mono">
                  <span>Available Cash: ₹{currentCashINR.toLocaleString('en-IN')}</span>
                  <span>Goal Target: {goal?.target_formatted}</span>
                </div>
              </div>

              {/* Source Selection */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Fund Source
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSourceOrDest('CASH')}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      sourceOrDest === 'CASH'
                        ? 'bg-forest/10 border-forest text-forest'
                        : 'bg-canvas-subtle border-edge text-ink-muted hover:border-edge-dark'
                    }`}
                  >
                    <div className="font-semibold text-xs text-ink">Liquid Cash</div>
                    <div className="text-[10px] text-ink-muted mt-0.5">₹{currentCashINR.toLocaleString('en-IN')} unencumbered</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceOrDest('SAVINGS')}
                    className={`p-2.5 rounded-lg border text-left transition ${
                      sourceOrDest === 'SAVINGS'
                        ? 'bg-olive/10 border-olive text-olive'
                        : 'bg-canvas-subtle border-edge text-ink-muted hover:border-edge-dark'
                    }`}
                  >
                    <div className="font-semibold text-xs text-ink">General Savings</div>
                    <div className="text-[10px] text-ink-muted mt-0.5">General vault reserve</div>
                  </button>
                </div>
              </div>

              {/* INTERACTIVE CONTRIBUTION IMPACT PREVIEW */}
              <div className="rounded-xl bg-canvas-subtle border border-edge p-3.5 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-ink-muted uppercase tracking-wider text-[10px]">
                    Goal Progress Preview
                  </span>
                  <span className="font-mono text-[11px] text-forest font-bold">
                    {goal?.percentage_complete || 0}% → {contributionProjections.projectedPercentage}%
                  </span>
                </div>

                {/* Progress bar preview */}
                <div className="w-full bg-edge/70 rounded-full h-2.5 overflow-hidden border border-edge relative">
                  {/* Current base progress */}
                  <div
                    className="h-full bg-forest transition-all duration-300"
                    style={{ width: `${goal?.percentage_complete || 0}%` }}
                  />
                  {/* Additional projected contribution segment */}
                  {contributionProjections.projectedPercentage > (goal?.percentage_complete || 0) && (
                    <div
                      className="h-full bg-copper transition-all duration-300 absolute top-0"
                      style={{
                        left: `${goal?.percentage_complete || 0}%`,
                        width: `${contributionProjections.projectedPercentage - (goal?.percentage_complete || 0)}%`
                      }}
                    />
                  )}
                </div>

                <div className="flex justify-between text-[11px] font-mono text-ink-muted pt-1 border-t border-edge">
                  <span>Saved: ₹{goalSavedINR.toLocaleString('en-IN')} → ₹{contributionProjections.projectedSaved.toLocaleString('en-IN')}</span>
                  <span>Remaining: ₹{contributionProjections.projectedRemaining.toLocaleString('en-IN')}</span>
                </div>

                {/* Celebration alert if will complete */}
                {contributionProjections.willComplete && (
                  <div className="p-2.5 rounded-lg bg-gold/20 border border-gold/40 text-ink text-xs flex items-center space-x-2 animate-in fade-in duration-300">
                    <Sparkles className="w-4 h-4 text-[#9B7A28] flex-shrink-0 animate-pulse" />
                    <span className="font-semibold">
                      This contribution will reach 100% completion of this goal!
                    </span>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Mode: WITHDRAW */}
          {mode === 'WITHDRAW' && (
            <>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Withdrawal Amount (₹ INR) <span className="text-neg">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-ink-muted text-sm font-mono">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 2000"
                    value={actionAmount}
                    onChange={(e) => {
                      setActionAmount(e.target.value);
                      setFieldErrors(prev => ({ ...prev, actionAmount: null }));
                    }}
                    disabled={isSubmitting}
                    className={`w-full bg-canvas-subtle border rounded-lg pl-8 pr-4 py-2 text-ink font-mono placeholder:text-ink-muted focus:outline-none transition text-sm ${
                      (liveError || fieldErrors.actionAmount)
                        ? 'border-neg focus:border-neg'
                        : 'border-edge focus:border-forest'
                    }`}
                  />
                </div>
                {(liveError || fieldErrors.actionAmount) && (
                  <p className="text-neg text-xs mt-1">{liveError || fieldErrors.actionAmount}</p>
                )}

                <div className="text-[11px] text-ink-muted mt-1 flex justify-between font-mono">
                  <span>Currently Saved in Goal: {goal?.current_formatted}</span>
                  <span>Destination: Liquid Cash</span>
                </div>
              </div>

              {/* Withdrawal Preview */}
              <div className="rounded-xl bg-canvas-subtle border border-edge p-3 space-y-1.5 text-xs">
                <span className="text-[10px] uppercase font-semibold text-ink-muted block">Withdrawal Impact</span>
                <div className="flex justify-between font-mono text-ink-muted text-[11px]">
                  <span>Goal Balance After:</span>
                  <span className="text-ink font-semibold">
                    ₹{Math.max(0, goalSavedINR - (isValidActionAmount ? numActionAmount : 0)).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between font-mono text-ink-muted text-[11px]">
                  <span>Liquid Cash After:</span>
                  <span className="text-pos font-semibold">
                    ₹{(currentCashINR + (isValidActionAmount ? numActionAmount : 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-edge flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-ink-muted hover:text-ink transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || Boolean(liveError)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-forest hover:bg-forest-light text-canvas-white text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-40"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Processing...' : 'Confirm Action'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
