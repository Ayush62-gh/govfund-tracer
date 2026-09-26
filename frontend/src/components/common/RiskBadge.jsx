import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, CheckCircle, ShieldAlert, AlertCircle } from 'lucide-react';
import { getRiskMeta } from '../../utils/formatters';

/**
 * RiskBadge Component
 * Renders a color-coded risk badge with risk score, label, and pulse indicator.
 * 
 * @param {object} props
 * @param {'high'|'medium'|'low'|'compliant'} props.level - Risk category level
 * @param {number} [props.score] - Optional 0-100 risk score
 * @param {string} [props.customLabel] - Optional override label
 * @param {boolean} [props.showIcon] - Whether to show the risk icon
 * @param {boolean} [props.showPulse] - Whether to animate pulse effect for high risk
 * @param {'sm'|'md'|'lg'} [props.size] - Size of the badge
 */
export const RiskBadge = ({
  level = 'low',
  score,
  customLabel,
  showIcon = true,
  showPulse = true,
  size = 'md',
}) => {
  const meta = getRiskMeta(level);

  const getIcon = () => {
    switch (level?.toLowerCase()) {
      case 'high':
      case 'critical':
        return <ShieldAlert className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
      case 'medium':
      case 'moderate':
        return <AlertTriangle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
      case 'low':
      default:
        return <CheckCircle className={size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'} />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3.5 py-1.5 gap-2',
  };

  const isHigh = level?.toLowerCase() === 'high' || level?.toLowerCase() === 'critical';

  return (
    <span
      className={`inline-flex items-center rounded-full border transition-all ${meta.badgeBg} ${sizeClasses[size]}`}
    >
      {showPulse && isHigh && (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}

      {showIcon && getIcon()}

      <span>{customLabel || meta.label}</span>

      {score !== undefined && score !== null && (
        <span
          className={`ml-0.5 px-1.5 py-0.2 rounded-full font-mono text-[11px] font-bold ${
            isHigh
              ? 'bg-red-200/80 text-red-900 dark:bg-red-900/60 dark:text-red-100'
              : level === 'medium'
              ? 'bg-amber-200/80 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100'
              : 'bg-emerald-200/80 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100'
          }`}
        >
          {score}/100
        </span>
      )}
    </span>
  );
};

RiskBadge.propTypes = {
  level: PropTypes.oneOf(['high', 'medium', 'low', 'critical', 'moderate', 'compliant']).isRequired,
  score: PropTypes.number,
  customLabel: PropTypes.string,
  showIcon: PropTypes.bool,
  showPulse: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

export default RiskBadge;
