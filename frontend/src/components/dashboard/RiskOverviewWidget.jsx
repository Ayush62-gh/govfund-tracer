import React from 'react';
import PropTypes from 'prop-types';
import { ShieldAlert, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatNumber } from '../../utils/formatters';

/**
 * RiskOverviewWidget Component
 * High, Medium, Low risk counts with distribution bar and quick triage action.
 */
export const RiskOverviewWidget = ({ kpis }) => {
  const high = kpis.flaggedHighCount || 412;
  const medium = kpis.flaggedMediumCount || 1240;
  const compliant = kpis.compliantCount || 36768;
  const total = high + medium + compliant;

  const highPct = ((high / total) * 100).toFixed(1);
  const medPct = ((medium / total) * 100).toFixed(1);
  const compPct = ((compliant / total) * 100).toFixed(1);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-gov flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500" />
              <span>Risk & Anomaly Overview</span>
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              ML-evaluated across {formatNumber(total)} active scheme works
            </p>
          </div>
          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 font-mono">
            {high} Critical
          </span>
        </div>

        {/* Stacked Risk Progress Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300 mb-1.5 font-medium">
            <span>Risk Portfolio Distribution</span>
            <span>{compPct}% Compliant</span>
          </div>
          <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${highPct}%` }}
              className="bg-red-500 hover:bg-red-600 transition-all cursor-pointer"
              title={`High Risk: ${high} (${highPct}%)`}
            />
            <div
              style={{ width: `${medPct}%` }}
              className="bg-amber-500 hover:bg-amber-600 transition-all cursor-pointer"
              title={`Moderate Risk: ${medium} (${medPct}%)`}
            />
            <div
              style={{ width: `${compPct}%` }}
              className="bg-emerald-500 hover:bg-emerald-600 transition-all cursor-pointer"
              title={`Compliant: ${compliant} (${compPct}%)`}
            />
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {/* High Risk */}
          <div className="p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 text-center">
            <div className="flex items-center justify-center gap-1 text-red-600 dark:text-red-400 mb-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">High Risk</span>
            </div>
            <div className="text-xl font-bold font-display text-red-700 dark:text-red-300 font-mono">
              {formatNumber(high)}
            </div>
            <div className="text-[10px] text-red-500 mt-0.5">Critical Anomaly</div>
          </div>

          {/* Moderate */}
          <div className="p-3 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-center">
            <div className="flex items-center justify-center gap-1 text-amber-600 dark:text-amber-400 mb-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Moderate</span>
            </div>
            <div className="text-xl font-bold font-display text-amber-700 dark:text-amber-300 font-mono">
              {formatNumber(medium)}
            </div>
            <div className="text-[10px] text-amber-500 mt-0.5">Watchlist Works</div>
          </div>

          {/* Compliant */}
          <div className="p-3 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-center">
            <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Compliant</span>
            </div>
            <div className="text-xl font-bold font-display text-emerald-700 dark:text-emerald-300 font-mono">
              {formatNumber(compliant)}
            </div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Norms Followed</div>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <Link
          to="/alerts"
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-colors"
        >
          <span>Open Full Anomaly Detection Center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};

RiskOverviewWidget.propTypes = {
  kpis: PropTypes.object.isRequired,
};

export default RiskOverviewWidget;
