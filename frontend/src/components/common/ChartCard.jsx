import React from 'react';
import PropTypes from 'prop-types';
import { Download, Info, Maximize2 } from 'lucide-react';

/**
 * ChartCard Component
 * Consistent container for Recharts visualizations with header controls and institutional styling.
 * 
 * @param {object} props
 * @param {string} props.title - Main chart title
 * @param {string} [props.subtitle] - Supporting description or time period
 * @param {React.ReactNode} props.children - Recharts visualization child
 * @param {React.ReactNode} [props.actionSlot] - Custom action buttons
 * @param {function} [props.onExport] - Optional export CSV/PNG callback
 * @param {string} [props.infoTooltip] - Information tooltip text
 * @param {string} [props.className] - Additional wrapper class names
 */
export const ChartCard = ({
  title,
  subtitle,
  children,
  actionSlot,
  onExport,
  infoTooltip,
  className = '',
}) => {
  return (
    <div
      className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-gov flex flex-col justify-between ${className}`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
              {title}
            </h3>
            {infoTooltip && (
              <span className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-slate-100 cursor-help" title={infoTooltip}>
                <Info className="w-4 h-4" />
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actionSlot}
          {onExport && (
            <button
              type="button"
              onClick={onExport}
              title="Export Chart Data"
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div className="w-full flex-1 min-h-[260px] flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
  actionSlot: PropTypes.node,
  onExport: PropTypes.func,
  infoTooltip: PropTypes.string,
  className: PropTypes.string,
};

export default ChartCard;
