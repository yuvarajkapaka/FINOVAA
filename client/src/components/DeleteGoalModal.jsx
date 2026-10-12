import React, { useState } from 'react';
import { AlertTriangle, Loader2, X, ShieldCheck } from 'lucide-react';

export default function DeleteGoalModal({
  isOpen,
  goal,
  onClose,
  onSuccess
}) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen || !goal) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete goal.');
      }
      onSuccess(data.message || `Goal "${goal.name}" deleted.`);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-canvas-white border border-edge rounded-2xl shadow-xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-edge flex items-center justify-between bg-canvas-subtle">
          <div className="flex items-center space-x-2 text-neg font-bold font-serif">
            <AlertTriangle className="w-5 h-5" />
            <span>Confirm Goal Removal</span>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-lg text-ink-muted hover:text-ink hover:bg-edge/40 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-lg bg-neg/10 border border-neg/30 text-neg">
              {error}
            </div>
          )}

          <p className="text-ink leading-relaxed">
            Are you sure you want to remove the goal <strong className="text-ink">"{goal.name}"</strong>?
          </p>

          {goal.current_amount_paise > 0 ? (
            <div className="p-3.5 rounded-xl bg-forest/10 border border-forest/30 text-forest space-y-1">
              <span className="font-semibold block flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-forest" />
                Capital Conservation Guarantee:
              </span>
              <p className="text-[11px] text-ink-muted leading-relaxed">
                This goal currently holds <strong className="text-ink">{goal.current_formatted}</strong>. 
                All allocated reserves will be <span className="text-forest font-bold">automatically refunded</span> to your available liquid cash upon deletion.
              </p>
            </div>
          ) : (
            <p className="text-ink-muted text-[11px]">
              This goal does not hold any saved funds. It will be removed immediately.
            </p>
          )}

          <div className="pt-3 border-t border-edge flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl text-ink-muted hover:text-ink transition font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-neg hover:bg-neg/90 text-canvas-white font-bold transition shadow-sm active:scale-95 disabled:opacity-50"
            >
              {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isDeleting ? 'Deleting...' : 'Delete Goal'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
