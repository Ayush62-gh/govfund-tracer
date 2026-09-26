import React from 'react';
import PropTypes from 'prop-types';

/**
 * SkeletonLoader Component
 * Shimmer placeholders for KPI cards, charts, and tables during loading state.
 */
export const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderItem = (index) => {
    switch (type) {
      case 'kpi':
        return (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse"
          >
            <div className="flex justify-between items-start">
              <div className="w-1/2 h-3 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="w-8 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
            </div>
            <div className="mt-4 w-3/4 h-8 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="mt-4 w-full h-2 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        );
      case 'chart':
        return (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse min-h-[300px] flex flex-col justify-between"
          >
            <div className="flex justify-between items-center">
              <div className="w-1/3 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
              <div className="w-16 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
            </div>
            <div className="w-full h-48 bg-slate-100 dark:bg-slate-800/60 rounded-lg flex items-end justify-between p-4 gap-2">
              <div className="w-1/6 h-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="w-1/6 h-36 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="w-1/6 h-28 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="w-1/6 h-44 bg-slate-200 dark:bg-slate-700 rounded"></div>
              <div className="w-1/6 h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
            </div>
          </div>
        );
      case 'table':
        return (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-4"
          >
            <div className="w-1/4 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((r) => (
                <div key={r} className="h-8 bg-slate-100 dark:bg-slate-800/50 rounded flex gap-4 p-2">
                  <div className="w-1/4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="w-1/4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="w-1/4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                  <div className="w-1/4 h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'card':
      default:
        return (
          <div
            key={index}
            className="bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm animate-pulse space-y-3"
          >
            <div className="w-2/3 h-4 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="w-full h-3 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
            <div className="w-4/5 h-3 bg-slate-100 dark:bg-slate-800/50 rounded"></div>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {Array.from({ length: count }).map((_, i) => renderItem(i))}
    </div>
  );
};

SkeletonLoader.propTypes = {
  type: PropTypes.oneOf(['kpi', 'chart', 'table', 'card']),
  count: PropTypes.number,
};

export default SkeletonLoader;
