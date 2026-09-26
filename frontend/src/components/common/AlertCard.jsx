import React from 'react';
import PropTypes from 'prop-types';
import { Eye, ShieldAlert, Sparkles, Building2, MapPin, IndianRupee, ArrowRight } from 'lucide-react';
import RiskBadge from './RiskBadge';
import { formatINR, getCategoryMeta } from '../../utils/formatters';

/**
 * AlertCard Component
 * Displays actionable anomaly detection card with ML confidence and triage triggers.
 * 
 * @param {object} props
 * @param {object} props.alert - Alert anomaly object
 * @param {function} props.onSelect - Callback when drill-down is clicked
 * @param {function} [props.onQuickAction] - Callback for quick triage action
 * @param {boolean} [props.compact] - Compact layout for dashboard sidebar
 */
export const AlertCard = ({
  alert,
  onSelect,
  onQuickAction,
  compact = false,
}) => {
  const catMeta = getCategoryMeta(alert.category);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'escalated':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">Escalated</span>;
      case 'inReview':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Under Review</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Resolved</span>;
      case 'active':
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300">Active Alert</span>;
    }
  };

  if (compact) {
    return (
      <div
        onClick={() => onSelect && onSelect(alert)}
        className="group relative bg-white dark:bg-slate-900 rounded-lg p-3.5 border border-slate-200 dark:border-slate-800 hover:border-red-300 dark:hover:border-red-800 shadow-sm hover:shadow-gov cursor-pointer transition-all duration-200"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${catMeta.color}`}>
            {catMeta.label}
          </span>
          <RiskBadge level={alert.riskLevel} score={alert.riskScore} size="sm" showPulse={false} />
        </div>

        <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
          {alert.title}
        </h4>

        <div className="mt-2 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {alert.district}, {alert.state}
          </span>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
            {formatINR(alert.sanctionedAmount)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-gov hover:shadow-gov-md transition-all duration-200">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catMeta.color}`}>
            {catMeta.label}
          </span>
          <span className="text-xs font-mono text-slate-700 dark:text-slate-300 font-medium">
            {alert.id}
          </span>
          {getStatusBadge(alert.status)}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded">
            <Sparkles className="w-3 h-3" />
            <span>AI Conf: {alert.confidence}</span>
          </div>
          <RiskBadge level={alert.riskLevel} score={alert.riskScore} size="md" />
        </div>
      </div>

      {/* Main Title & ID */}
      <div className="mt-3">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 hover:text-gov-blue dark:hover:text-blue-400 transition-colors cursor-pointer" onClick={() => onSelect(alert)}>
          {alert.title}
        </h3>
        <p className="mt-1 text-xs font-mono text-slate-700 dark:text-slate-300">
          Work ID: <span className="font-semibold text-slate-700 dark:text-slate-300">{alert.workId}</span> • Flagged: {alert.dateFlagged}
        </p>
      </div>

      {/* AI Reasoning Preview Box */}
      <div className="mt-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-200 mb-1">
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
          <span>AI Anomaly Explanation:</span>
        </div>
        <p className="line-clamp-2 leading-relaxed">{alert.summary}</p>
      </div>

      {/* Key Info Grid */}
      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800/80">
        <div>
          <span className="text-slate-700 dark:text-slate-300 block">Sanctioned</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">
            {formatINR(alert.sanctionedAmount)}
          </span>
        </div>
        <div>
          <span className="text-slate-700 dark:text-slate-300 block">Expended So Far</span>
          <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm">
            {formatINR(alert.expenditureSoFar)}
          </span>
        </div>
        <div>
          <span className="text-slate-700 dark:text-slate-300 block">Location</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
            {alert.district}, {alert.state}
          </span>
        </div>
        <div>
          <span className="text-slate-700 dark:text-slate-300 block">Agency</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
            {alert.implementingAgency}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => onSelect(alert)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gov-blue hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
        >
          <Eye className="w-4 h-4" />
          <span>Full AI Evidence & Audit Dossier</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="flex items-center gap-2">
          {alert.status !== 'inReview' && alert.status !== 'resolved' && (
            <button
              type="button"
              onClick={() => onQuickAction && onQuickAction(alert.id, 'reviewed')}
              className="text-xs px-3 py-1.5 rounded-lg font-medium border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              Mark Reviewed
            </button>
          )}

          {alert.status !== 'escalated' && alert.status !== 'resolved' && (
            <button
              type="button"
              onClick={() => onQuickAction && onQuickAction(alert.id, 'escalated')}
              className="text-xs px-3 py-1.5 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white shadow-sm transition-all flex items-center gap-1"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Escalate</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

AlertCard.propTypes = {
  alert: PropTypes.shape({
    id: PropTypes.string.isRequired,
    workId: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    categoryLabel: PropTypes.string,
    riskLevel: PropTypes.string.isRequired,
    riskScore: PropTypes.number.isRequired,
    confidence: PropTypes.string,
    dateFlagged: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    district: PropTypes.string.isRequired,
    implementingAgency: PropTypes.string.isRequired,
    sanctionedAmount: PropTypes.number.isRequired,
    expenditureSoFar: PropTypes.number.isRequired,
    status: PropTypes.string.isRequired,
    summary: PropTypes.string.isRequired,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  onQuickAction: PropTypes.func,
  compact: PropTypes.bool,
};

export default AlertCard;
