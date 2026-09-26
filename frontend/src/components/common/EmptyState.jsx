import React from 'react';
import PropTypes from 'prop-types';
import { Inbox, CheckCircle2, RefreshCw } from 'lucide-react';

/**
 * EmptyState Component
 * Displays clean institutional zero-state illustrations with actionable buttons.
 */
export const EmptyState = ({
  icon,
  title = 'No records available',
  description = 'There are currently no items matching your criteria in the system.',
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3">
        {icon || <Inbox className="w-6 h-6" />}
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
        {title}
      </h3>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gov-blue hover:bg-blue-800 text-white shadow-sm transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string,
  description: PropTypes.string,
  actionLabel: PropTypes.string,
  onAction: PropTypes.func,
};

export default EmptyState;
