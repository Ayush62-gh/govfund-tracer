import React from 'react';
import PropTypes from 'prop-types';
import { MOCK_DUPLICATE_PAIRS } from '../../data/mockData';
import { Copy, MapPin, Sparkles, ShieldAlert, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { triggerCelebration } from '../../utils/exportUtils';

/**
 * DuplicateDetectionPanel Component
 * Displays ML-detected cross-scheme duplicate work sanctions using NLP and GIS matching.
 */
export const DuplicateDetectionPanel = ({ onEscalateDuplicate }) => {
  return (
    <div className="space-y-4">
      <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800/60 flex items-start justify-between gap-4">
        <div>
          <h4 className="text-sm font-bold text-purple-950 dark:text-purple-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>AI Geo-Spatial & Semantic Duplicate Detector</span>
          </h4>
          <p className="text-xs text-purple-900/80 dark:text-purple-300 mt-1 max-w-2xl">
            Continuously cross-references new MPLADS sanctions against PMGSY, Jal Jeevan Mission, Smart Cities, and State PWD project registries within 100m GPS radius.
          </p>
        </div>

        <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-100 shrink-0">
          {MOCK_DUPLICATE_PAIRS.length} Flagged Duplicates
        </span>
      </div>

      <div className="space-y-4">
        {MOCK_DUPLICATE_PAIRS.map((pair) => (
          <div
            key={pair.id}
            className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/60 p-5 shadow-gov"
          >
            {/* Top Match Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>High Probability Duplicate ({pair.confidence})</span>
                </span>
                <span className="text-xs font-mono text-slate-500">{pair.id}</span>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>Distance: <strong>{pair.distanceMeters}m</strong></span>
                </span>
                <span className="text-slate-600 dark:text-slate-300">
                  NLP Cosine: <strong>{(pair.cosineSimilarity * 100).toFixed(1)}%</strong>
                </span>
              </div>
            </div>

            {/* Side-by-Side Comparison Box */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Work A (MPLADS) */}
              <div className="p-3.5 rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60">
                <div className="flex items-center justify-between text-[11px] font-bold text-blue-700 dark:text-blue-300 mb-1">
                  <span>Sanctioned Under MPLADS</span>
                  <span className="font-mono">{pair.workA.id}</span>
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {pair.workA.title}
                </h5>
                <div className="mt-2 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Sanction Date:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{pair.workA.sanctionDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{pair.workA.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contractor:</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{pair.workA.contractor}</span>
                  </div>
                </div>
              </div>

              {/* Work B (Other Scheme) */}
              <div className="p-3.5 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/60">
                <div className="flex items-center justify-between text-[11px] font-bold text-amber-700 dark:text-amber-300 mb-1">
                  <span>Matched Existing Scheme: {pair.workB.scheme}</span>
                  <span className="font-mono">{pair.workB.id}</span>
                </div>
                <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  {pair.workB.title}
                </h5>
                <div className="mt-2 space-y-1 text-[11px] text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between">
                    <span>Prior Sanction:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{pair.workB.sanctionDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{pair.workB.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contractor:</span>
                    <span className="font-semibold text-red-600 dark:text-red-400">{pair.workB.contractor}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Reasoning Text */}
            <div className="mt-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-bold text-slate-900 dark:text-slate-200">AI Risk Verdict: </span>
              {pair.riskReason}
            </div>

            {/* Action Bar */}
            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Status: <strong>{pair.status.toUpperCase()}</strong></span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    triggerCelebration();
                    if (onEscalateDuplicate) onEscalateDuplicate(pair.id);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Escalate to Anti-Corruption Cell</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

DuplicateDetectionPanel.propTypes = {
  onEscalateDuplicate: PropTypes.func,
};

export default DuplicateDetectionPanel;
