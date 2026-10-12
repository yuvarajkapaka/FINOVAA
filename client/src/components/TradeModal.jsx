import React, { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, AlertTriangle, Loader2, Info } from 'lucide-react';
import { apiFetch } from '../api/config';

export default function TradeModal({
  isOpen,
  mode = 'BUY', // 'BUY' | 'SELL'
  asset,
  holding, // existing holding if user owns units
  wallet,
  onClose,
  onSuccess
}) {
  const [quantity, setQuantity] = useState('1');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [fieldError, setFieldError] = useState(null);
  const [serverError, setServerError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setQuantity('1');
    setIsConfirmed(false);
    setFieldError(null);
    setServerError(null);
  }, [isOpen, mode, asset, holding]);

  if (!isOpen || !asset) return null;

  // Normalized trade mode
  const isBuy = String(mode).toUpperCase() === 'BUY';
  const isSell = !isBuy;

  // Authoritative asset ID resolution
  const assetId = asset.asset_id || asset.id;

  // Authoritative naming resolution
  const assetName = asset.name || holding?.name || 'Selected Asset';
  const assetSymbol = asset.symbol || holding?.symbol || '';
  const assetClass = asset.asset_class || holding?.asset_class || 'Investment';

  // Authoritative simulated price resolution
  let currentPriceINR = 0;
  if (typeof asset.current_price_inr === 'number' && isFinite(asset.current_price_inr) && asset.current_price_inr > 0) {
    currentPriceINR = asset.current_price_inr;
  } else if (typeof asset.current_price_paise === 'number' && isFinite(asset.current_price_paise) && asset.current_price_paise > 0) {
    currentPriceINR = asset.current_price_paise / 100;
  } else if (typeof holding?.current_price_paise === 'number' && isFinite(holding.current_price_paise) && holding.current_price_paise > 0) {
    currentPriceINR = holding.current_price_paise / 100;
  }

  const isPriceValid = typeof currentPriceINR === 'number' && isFinite(currentPriceINR) && currentPriceINR > 0;

  // Formatted price string
  const formattedPrice = asset.formatted_price
    || asset.formatted_current_price
    || (isPriceValid ? `₹${currentPriceINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₹0.00');

  // Authoritative available cash and owned units
  const availableCashINR = (typeof wallet?.balances?.current_balance_inr === 'number' && isFinite(wallet.balances.current_balance_inr))
    ? wallet.balances.current_balance_inr
    : ((wallet?.balances?.available_cash_paise || 0) / 100);

  const ownedUnits = typeof holding?.quantity === 'number' ? holding.quantity : 0;

  // Cost basis and P&L for selling
  const avgBuyPriceINR = holding?.avg_buy_price_paise ? (holding.avg_buy_price_paise / 100) : 0;

  // Live order calculations
  const numQuantity = parseInt(quantity, 10);
  const isValidQuantity = !isNaN(numQuantity) && numQuantity > 0;

  const estimatedTotalINR = (isValidQuantity && isPriceValid) ? (numQuantity * currentPriceINR) : 0;
  const formattedEstimatedTotal = `₹${estimatedTotalINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const estimatedPnlINR = (isSell && isValidQuantity && isPriceValid && avgBuyPriceINR > 0)
    ? (numQuantity * (currentPriceINR - avgBuyPriceINR))
    : 0;
  const isPnlPositive = estimatedPnlINR >= 0;
  const hasPnlData = isSell && avgBuyPriceINR > 0 && isValidQuantity;

  // Quick quantity shortcuts
  const handleQuickQty = (amount) => {
    setQuantity(amount.toString());
    setFieldError(null);
  };

  const handleMaxBuy = () => {
    if (!isPriceValid || currentPriceINR <= 0) return;
    const maxUnits = Math.floor(availableCashINR / currentPriceINR);
    if (maxUnits > 0) {
      setQuantity(maxUnits.toString());
      setFieldError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldError(null);
    setServerError(null);

    if (!assetId || isNaN(Number(assetId))) {
      setFieldError('Invalid asset selected.');
      return;
    }

    if (!isPriceValid) {
      setFieldError('Unable to retrieve valid market quote. Try again after refreshing.');
      return;
    }

    if (!isValidQuantity) {
      setFieldError('Please specify a positive integer quantity of units.');
      return;
    }

    if (isBuy && estimatedTotalINR > availableCashINR) {
      setFieldError(`Insufficient liquid cash. Required: ${formattedEstimatedTotal}, Available: ₹${availableCashINR.toLocaleString('en-IN')}`);
      return;
    }

    if (isSell && numQuantity > ownedUnits) {
      setFieldError(`Cannot sell ${numQuantity} units. You currently own ${ownedUnits} units.`);
      return;
    }

    if (!isConfirmed) {
      setFieldError('Please check the confirmation box before submitting your simulated trade.');
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = isBuy ? '/api/marketplace/buy' : '/api/marketplace/sell';
      const payload = {
        asset_id: Number(assetId),
        quantity: numQuantity
      };

      const res = await apiFetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Server rejected the order execution.');
      }

      onSuccess(data.message || `Successfully executed simulated ${isBuy ? 'BUY' : 'SELL'} order.`);
      onClose();
    } catch (err) {
      setServerError(err.message || 'Network error executing order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-canvas-white border border-edge rounded-2xl shadow-xl overflow-hidden flex flex-col modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-edge bg-canvas-subtle flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                isBuy ? 'bg-forest/10 text-forest border border-forest/20' : 'bg-copper/10 text-copper border border-copper/20'
              }`}>
                {isBuy ? 'Simulated Buy Order' : 'Simulated Sell Order'}
              </span>
              <span className="font-mono text-xs font-bold text-ink">
                {assetSymbol}
              </span>
            </div>
            <h2 className="font-serif text-base font-bold text-ink mt-0.5">
              {assetName}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-edge/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {serverError && (
            <div className="p-3 rounded-xl bg-neg/10 border border-neg/30 text-neg text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{serverError}</span>
            </div>
          )}

          {/* Asset Quote and Account Stats */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-canvas-subtle border border-edge text-xs">
            <div>
              <span className="text-[10px] text-ink-muted uppercase font-semibold block">Simulated Price</span>
              <span className="font-mono font-bold text-ink text-sm mt-0.5 block">
                {formattedPrice}
              </span>
              <span className="text-[10px] text-ink-subtle">{assetClass}</span>
            </div>

            <div>
              {isBuy ? (
                <>
                  <span className="text-[10px] text-ink-muted uppercase font-semibold block">Available Liquid Cash</span>
                  <span className="font-mono font-bold text-forest text-sm mt-0.5 block">
                    ₹{availableCashINR.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="text-[10px] text-ink-subtle">Unencumbered</span>
                </>
              ) : (
                <>
                  <span className="text-[10px] text-ink-muted uppercase font-semibold block">Owned Units</span>
                  <span className="font-mono font-bold text-forest text-sm mt-0.5 block">
                    {ownedUnits} Units
                  </span>
                  <span className="text-[10px] text-ink-subtle">
                    {avgBuyPriceINR > 0 ? `Avg: ₹${avgBuyPriceINR.toFixed(2)}` : 'In Portfolio'}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <div className="flex items-center justify-between mb-1 text-xs">
              <label className="font-semibold uppercase tracking-wider text-ink-muted text-[11px]">
                Quantity (Units) <span className="text-neg">*</span>
              </label>
              {/* Quick quantity helpers */}
              <div className="flex items-center space-x-1 text-[10px] font-mono">
                {isBuy ? (
                  <>
                    <button type="button" onClick={() => handleQuickQty(1)} className="px-2 py-0.5 rounded bg-canvas-subtle text-ink hover:bg-canvas-subtle/80 border border-edge">1</button>
                    <button type="button" onClick={() => handleQuickQty(5)} className="px-2 py-0.5 rounded bg-canvas-subtle text-ink hover:bg-canvas-subtle/80 border border-edge">5</button>
                    <button type="button" onClick={() => handleQuickQty(10)} className="px-2 py-0.5 rounded bg-canvas-subtle text-ink hover:bg-canvas-subtle/80 border border-edge">10</button>
                    <button type="button" onClick={handleMaxBuy} className="px-2 py-0.5 rounded bg-forest/10 text-forest font-semibold hover:bg-forest/20 border border-forest/20">Max</button>
                  </>
                ) : (
                  <>
                    <button type="button" onClick={() => handleQuickQty(1)} className="px-2 py-0.5 rounded bg-canvas-subtle text-ink hover:bg-canvas-subtle/80 border border-edge">1</button>
                    <button type="button" onClick={() => handleQuickQty(Math.max(1, Math.floor(ownedUnits / 2)))} disabled={ownedUnits <= 0} className="px-2 py-0.5 rounded bg-canvas-subtle text-ink hover:bg-canvas-subtle/80 border border-edge disabled:opacity-40">50%</button>
                    <button type="button" onClick={() => handleQuickQty(Math.max(1, ownedUnits))} disabled={ownedUnits <= 0} className="px-2 py-0.5 rounded bg-copper/10 text-copper font-semibold hover:bg-copper/20 border border-copper/20 disabled:opacity-40">All</button>
                  </>
                )}
              </div>
            </div>

            <input
              type="number"
              min="1"
              max={isSell && ownedUnits > 0 ? ownedUnits : undefined}
              step="1"
              value={quantity}
              onChange={(e) => {
                setQuantity(e.target.value);
                setFieldError(null);
              }}
              disabled={isSubmitting}
              className="w-full bg-canvas-subtle border border-edge rounded-lg px-3 py-2 text-ink font-mono placeholder:text-ink-muted focus:outline-none focus:border-forest transition text-sm"
            />
            {fieldError && (
              <p className="text-neg text-xs mt-1">{fieldError}</p>
            )}
          </div>

          {/* Trade Summary & Financial Impact */}
          <div className="p-4 rounded-xl bg-canvas-subtle border border-edge space-y-2 text-xs">
            <div className="flex items-center justify-between text-ink-muted">
              <span>{isBuy ? 'Estimated Total Cost:' : 'Estimated Sale Proceeds:'}</span>
              <span className="font-mono font-bold text-ink text-sm">
                {formattedEstimatedTotal}
              </span>
            </div>

            {isBuy && (
              <div className="flex items-center justify-between text-ink-muted pt-1 border-t border-edge">
                <span>Remaining Cash Buffer:</span>
                <span className={`font-mono font-medium ${
                  availableCashINR - estimatedTotalINR >= 0 ? 'text-ink' : 'text-neg'
                }`}>
                  ₹{Math.max(0, availableCashINR - estimatedTotalINR).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}

            {isSell && hasPnlData && (
              <div className="flex items-center justify-between text-ink-muted pt-1 border-t border-edge">
                <span>Estimated Realized P&L:</span>
                <span className={`font-mono font-bold ${isPnlPositive ? 'text-pos' : 'text-neg'}`}>
                  {isPnlPositive ? '+' : ''}₹{estimatedPnlINR.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
          </div>

          {/* Educational Disclaimer */}
          <div className="p-3 rounded-lg bg-forest/10 border border-forest/20 text-xs text-forest flex items-start space-x-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-forest" />
            <span className="text-[11px] leading-relaxed text-ink-muted">
              <strong className="text-ink">Simulated Order:</strong> Executed immediately against the deterministic simulation engine at authoritative server quote. Zero real money is used.
            </span>
          </div>

          {/* Order Confirmation Checkbox */}
          <div className="pt-1">
            <label className="flex items-start space-x-2.5 p-3 rounded-xl bg-canvas-subtle border border-edge hover:border-edge-dark cursor-pointer transition">
              <input
                type="checkbox"
                checked={isConfirmed}
                onChange={(e) => {
                  setIsConfirmed(e.target.checked);
                  setFieldError(null);
                }}
                disabled={isSubmitting || (isSell && ownedUnits <= 0) || !isValidQuantity}
                className="rounded border-edge text-forest focus:ring-forest w-4 h-4 mt-0.5"
              />
              <span className="text-xs text-ink leading-snug">
                I confirm {isBuy ? 'purchasing' : 'selling'} <strong className="text-ink font-mono">{isValidQuantity ? numQuantity : 0} units</strong> of <strong className="text-ink">{assetName}</strong> for <strong className="text-ink font-mono">{formattedEstimatedTotal}</strong>.
              </span>
            </label>
          </div>

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
              disabled={isSubmitting || !assetId || !isPriceValid || !isConfirmed || !isValidQuantity || (isSell && ownedUnits <= 0) || (isBuy && estimatedTotalINR > availableCashINR)}
              className={`inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${
                isBuy
                  ? 'bg-forest hover:bg-forest-light text-canvas-white'
                  : 'bg-copper hover:bg-copper-dark text-canvas-white'
              }`}
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isSubmitting ? 'Executing Order...' : (isBuy ? 'Confirm & Buy Units' : 'Confirm & Sell Units')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
