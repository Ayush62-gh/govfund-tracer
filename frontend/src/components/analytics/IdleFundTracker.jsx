import React from 'react';
import { MOCK_IDLE_FUNDS_AGING } from '../../data/mockData';
import { AlertCircle, Clock, ShieldAlert, ArrowRight } from 'lucide-react';
import { formatINR } from '../../utils/formatters';

/**
 * IdleFundTracker Component
 * Tracks unspent and parking balances across implementing agencies and lapsation risk.
 */
export const IdleFundTracker = () => {
  const totalIdle = MOCK_IDLE_FUNDS_AGING.reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Idle Balance Lapsation Warning</span>
          </div>
          <p className="text-xs text-amber-900/80 dark:text-amber-200 mt-0.5">
            Total ₹{totalIdle} Cr lying unutilized across 927 district holding accounts. ₹340 Cr is in critical &gt;24 months dormancy.
          </p>
        </div>

        <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-600 text-white shadow-sm">
          ₹340 Cr at Immediate Lapsation Risk
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {MOCK_IDLE_FUNDS_AGING.map((item) => (
          <div
            key={item.bracket}
            className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden"
          >
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: item.color }}
            />
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Aging: {item.bracket}
            </div>
            <div className="mt-2 text-2xl font-bold font-display text-slate-900 dark:text-slate-100 font-mono">
              ₹{item.amount} Cr
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Across <strong>{item.count}</strong> project sanctions
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IdleFundTracker;
