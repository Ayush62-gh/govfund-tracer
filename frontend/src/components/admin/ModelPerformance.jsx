import React from 'react';
import { MOCK_MODEL_METRICS } from '../../data/mockData';
import { Cpu, CheckCircle2, ShieldCheck, Activity, Zap, RefreshCw } from 'lucide-react';

/**
 * ModelPerformance Component
 * Displays ML model accuracy, recall, precision, drift metrics, and active algorithms.
 */
export const ModelPerformance = ({ onRetrain }) => {
  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold font-display">
              {MOCK_MODEL_METRICS.activeVersion}
            </h3>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-mono font-bold border border-emerald-500/30">
              PRODUCTION LIVE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Last Automated Ensemble Retraining: {MOCK_MODEL_METRICS.lastRetrained} • Inference Latency: {MOCK_MODEL_METRICS.avgInferenceLatencyMs}ms
          </p>
        </div>

        <button
          type="button"
          onClick={onRetrain}
          className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Trigger Active Learning Retrain</span>
        </button>
      </div>

      {/* KPI Performance Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Accuracy</span>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {MOCK_MODEL_METRICS.accuracy}
          </div>
          <span className="text-[10px] text-slate-400">Overall test set</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Precision</span>
          <div className="mt-1 text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
            {MOCK_MODEL_METRICS.precision}
          </div>
          <span className="text-[10px] text-slate-400">Low false alarms</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">Recall</span>
          <div className="mt-1 text-2xl font-bold font-mono text-purple-600 dark:text-purple-400">
            {MOCK_MODEL_METRICS.recall}
          </div>
          <span className="text-[10px] text-slate-400">True breach capture</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">F1-Score</span>
          <div className="mt-1 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
            {MOCK_MODEL_METRICS.f1Score}
          </div>
          <span className="text-[10px] text-slate-400">Harmonic balance</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">ROC-AUC</span>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
            {MOCK_MODEL_METRICS.aucRoc}
          </div>
          <span className="text-[10px] text-slate-400">Discrimination</span>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
          <span className="text-[11px] font-semibold text-slate-500 uppercase">False Positives</span>
          <div className="mt-1 text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
            {MOCK_MODEL_METRICS.falsePositiveRate}
          </div>
          <span className="text-[10px] text-slate-400">Strictly minimized</span>
        </div>
      </div>

      {/* Model Algorithms & Architecture */}
      <div className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-500" />
          <span>Active Detection Subsystems & Algorithms</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {MOCK_MODEL_METRICS.keyAlgorithms.map((algo, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="font-medium text-slate-800 dark:text-slate-200">{algo}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModelPerformance;
