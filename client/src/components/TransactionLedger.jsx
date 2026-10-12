import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  ArrowRightLeft, 
  Vault, 
  FileText,
  Clock,
  Search
} from 'lucide-react';

export default function TransactionLedger({ transactions, loading, onOpenAction }) {
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = (transactions || []).filter(tx => {
    if (activeFilter === 'INCOME' && tx.transaction_type !== 'INCOME') return false;
    if (activeFilter === 'EXPENSE' && tx.transaction_type !== 'EXPENSE') return false;
    if (activeFilter === 'SAVINGS' && tx.transaction_type !== 'TRANSFER_TO_SAVINGS' && tx.transaction_type !== 'WITHDRAW_FROM_SAVINGS') {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const descMatch = (tx.description || '').toLowerCase().includes(q);
      const catMatch = (tx.category || '').toLowerCase().includes(q);
      return descMatch || catMatch;
    }
    return true;
  });

  const getTypeStyle = (type) => {
    switch (type) {
      case 'INCOME':
        return {
          icon: ArrowDownLeft,
          bg: 'bg-pos/10 text-pos border-pos/20',
          amountClass: 'text-pos',
          prefix: '+'
        };
      case 'EXPENSE':
        return {
          icon: ArrowUpRight,
          bg: 'bg-neg/10 text-neg border-neg/20',
          amountClass: 'text-neg',
          prefix: '-'
        };
      case 'TRANSFER_TO_SAVINGS':
        return {
          icon: Vault,
          bg: 'bg-olive/10 text-olive border-olive/20',
          amountClass: 'text-olive',
          prefix: '→'
        };
      case 'WITHDRAW_FROM_SAVINGS':
        return {
          icon: ArrowRightLeft,
          bg: 'bg-copper/10 text-copper border-copper/20',
          amountClass: 'text-copper',
          prefix: '←'
        };
      default:
        return {
          icon: FileText,
          bg: 'bg-canvas-subtle text-ink-muted border-edge',
          amountClass: 'text-ink',
          prefix: ''
        };
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="rounded-2xl bg-canvas-white border border-edge p-6 shadow-sm">
      {/* Header and Filter bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-edge">
        <div>
          <h2 className="font-serif text-lg font-bold text-ink flex items-center gap-2">
            <span>Capital Flow & Transaction Ledger</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-canvas-subtle text-ink-muted border border-edge">
              {filteredTransactions.length} records
            </span>
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Deterministic double-entry audit trail tracking simulated liquid and reserve movements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search notes or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-canvas-subtle border border-edge rounded-lg pl-8 pr-3 py-1.5 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-forest transition w-48"
            />
          </div>

          {/* Filter buttons */}
          <div className="flex items-center space-x-1 p-1 rounded-xl bg-canvas-subtle border border-edge text-xs">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'INCOME', label: 'Income' },
              { id: 'EXPENSE', label: 'Expenses' },
              { id: 'SAVINGS', label: 'Reserves' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  activeFilter === tab.id
                    ? 'bg-forest text-canvas-white shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Ledger Table / List */}
      <div className="mt-4">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center text-ink-muted space-y-2">
            <Clock className="w-6 h-6 animate-spin text-forest" />
            <p className="text-xs">Loading ledger entries...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-canvas-subtle flex items-center justify-center text-ink-muted">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="font-serif text-sm font-semibold text-ink">No transactions recorded</p>
              <p className="text-xs text-ink-muted mt-1 max-w-sm">
                There are no transaction records matching your current filter. Record an income, expense, or reserve transfer to update the audit trail.
              </p>
            </div>
            <button
              onClick={() => onOpenAction('INCOME')}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-forest/10 hover:bg-forest/20 text-forest border border-forest/20 transition"
            >
              + Log Simulated Transaction
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-ink-muted border-b border-edge uppercase tracking-wider font-semibold text-[11px]">
                  <th className="pb-3 pr-4">Type & Details</th>
                  <th className="pb-3 px-4 hidden md:table-cell">Category</th>
                  <th className="pb-3 px-4 hidden lg:table-cell">Timestamp</th>
                  <th className="pb-3 px-4 text-right">Amount</th>
                  <th className="pb-3 pl-4 text-right">Liquid Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge font-sans">
                {filteredTransactions.map((tx) => {
                  const style = getTypeStyle(tx.transaction_type);
                  const Icon = style.icon;

                  return (
                    <tr key={tx.id} className="hover:bg-canvas-subtle/50 transition group">
                      {/* Type & Details */}
                      <td className="py-3.5 pr-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg border flex-shrink-0 ${style.bg}`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="font-semibold text-ink group-hover:text-forest transition">
                              {tx.description}
                            </div>
                            <div className="text-[11px] text-ink-muted md:hidden mt-0.5">
                              {tx.category} • {formatDate(tx.created_at)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <span className="px-2 py-0.5 rounded-md bg-canvas-subtle text-ink-muted border border-edge font-medium">
                          {tx.category}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 hidden lg:table-cell text-ink-muted font-mono">
                        {formatDate(tx.created_at)}
                      </td>

                      {/* Amount */}
                      <td className={`py-3.5 px-4 text-right font-mono font-bold text-sm ${style.amountClass}`}>
                        {style.prefix}{tx.formatted_amount}
                      </td>

                      {/* Running Balance */}
                      <td className="py-3.5 pl-4 text-right font-mono text-ink">
                        {tx.formatted_balance_after}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
