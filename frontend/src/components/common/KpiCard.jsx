import React from 'react';
import PropTypes from 'prop-types';
import { ArrowUpRight, ArrowDownRight, Info } from 'lucide-react';

/**
 * KpiCard Component
 * Displays institutional metric cards with trend indicators, progress bar, and info tooltips.
 * 
 * @param {object} props
 * @param {string} props.title - Metric title
 * @param {string|number} props.value - Primary formatted display value
 * @param {string} [props.subtitle] - Supporting secondary description
 * @param {React.ReactNode} [props.icon] - Icon element
 * @param {number} [props.trend] - Percentage trend change
 * @param {string} [props.trendLabel] - Trend subtext (e.g., 'vs last quarter')
 * @param {number} [props.progress] - Optional progress percentage (0-100)
 * @param {'default'|'saffron'|'green'|'red'|'amber'|'blue'} [props.variant] - Accent color theme
 * @param {string} [props.badge] - Optional pill badge
 */
export const KpiCard = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendLabel,
  progress,
  variant = 'default',
  badge,
}) => {
  const variantStyles = {
    default: {
      border: 'border-slate-200 dark:border-slate-800',
      iconBg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
      progressFill: 'bg-slate-700 dark:bg-slate-400',
    },
    saffron: {
      border: 'border-orange-200 dark:border-orange-900/60',
      iconBg: 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400',
      progressFill: 'bg-orange-500',
    },
    green: {
      border: 'border-emerald-200 dark:border-emerald-900/60',
      iconBg: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
      progressFill: 'bg-emerald-500',
    },
    red: {
      border: 'border-red-200 dark:border-red-900/60',
      iconBg: 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400',
      progressFill: 'bg-red-500',
    },
    amber: {
      border: 'border-amber-200 dark:border-amber-900/60',
      iconBg: 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400',
      progressFill: 'bg-amber-500',
    },
    blue: {
      border: 'border-blue-200 dark:border-blue-900/60',
      iconBg: 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400',
      progressFill: 'bg-blue-600',
    },
  };

  const style = variantStyles[variant] || variantStyles.default;

  return (
    <div
      className={`relative bg-white dark:bg-slate-900 rounded-xl p-5 border shadow-gov hover:shadow-gov-md transition-all duration-200 ${style.border}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {title}
            </span>
            {badge && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {badge}
              </span>
            )}
          </div>
          <div className="mt-2 text-2xl lg:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-50">
            {value}
          </div>
        </div>

        {icon && (
          <div className={`p-2.5 rounded-lg flex items-center justify-center shrink-0 ${style.iconBg}`}>
            {icon}
          </div>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1">
            <span>Utilization Target</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${style.progressFill}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>
      )}

      {(subtitle || trend !== undefined) && (
        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
          {subtitle && <span className="truncate">{subtitle}</span>}
          {trend !== undefined && (
            <span
              className={`inline-flex items-center font-semibold shrink-0 gap-0.5 ${
                trend >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {trend >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
              {Math.abs(trend)}%
              {trendLabel && <span className="text-[11px] font-normal text-slate-700 dark:text-slate-300 ml-1">{trendLabel}</span>}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

KpiCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.node,
  trend: PropTypes.number,
  trendLabel: PropTypes.string,
  progress: PropTypes.number,
  variant: PropTypes.oneOf(['default', 'saffron', 'green', 'red', 'amber', 'blue']),
  badge: PropTypes.string,
};

export default KpiCard;
