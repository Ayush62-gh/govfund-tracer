import React from 'react';
import PropTypes from 'prop-types';
import { ShieldAlert, ArrowRight, Eye, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import AlertCard from '../common/AlertCard';

/**
 * TopAlertsWidget Component
 * Shows top 5 critical alerts requiring immediate attention on the Executive Dashboard.
 */
export const TopAlertsWidget = ({ alerts, onSelectAlert, onQuickAction }) => {
  const topAlerts = alerts
    .filter((a) => a.status !== 'resolved')
    .slice(0, 4);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-gov flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
              <span>Top Alerts Requiring Immediate Action</span>
            </h3>
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              Ranked by AI risk score, anomaly severity & fiscal impact
            </p>
          </div>

          <Link
            to="/alerts"
            className="text-xs font-semibold text-gov-blue hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {topAlerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All urgent alerts are currently addressed.
            </div>
          ) : (
            topAlerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onSelect={onSelectAlert}
                onQuickAction={onQuickAction}
                compact={true}
              />
            ))
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
        <span className="text-[11px] text-slate-700 dark:text-slate-300">
          Showing 4 highest risk anomalies • Auto-refreshes every 60s
        </span>
      </div>
    </div>
  );
};

TopAlertsWidget.propTypes = {
  alerts: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelectAlert: PropTypes.func.isRequired,
  onQuickAction: PropTypes.func,
};

export default TopAlertsWidget;
