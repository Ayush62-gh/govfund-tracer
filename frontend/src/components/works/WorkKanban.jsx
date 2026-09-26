import React from 'react';
import PropTypes from 'prop-types';
import { Clock, AlertTriangle, CheckCircle2, MapPin, Building2, Sparkles, Image as ImageIcon } from 'lucide-react';
import RiskBadge from '../common/RiskBadge';
import { formatINR } from '../../utils/formatters';

/**
 * WorkKanban Component
 * Displays works across 4 lifecycle stages: Sanctioned → In Progress → Delayed/At Risk → Completed
 */
export const WorkKanban = ({ works = [], onSelectWork, onVerifyPhotos }) => {
  const columns = [
    {
      id: 'sanctioned',
      label: 'Sanctioned',
      badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    },
    {
      id: 'inprogress',
      label: 'In Progress',
      badgeColor: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
    },
    {
      id: 'delayed',
      label: 'Delayed / At Risk',
      badgeColor: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
    },
    {
      id: 'completed',
      label: 'Physically Completed',
      badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    },
  ];

  const getWorksByStage = (stageId) => works.filter((w) => w.stage === stageId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      {columns.map((col) => {
        const stageWorks = getWorksByStage(col.id);

        return (
          <div
            key={col.id}
            className="bg-slate-100/75 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col h-full min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                {col.id === 'delayed' && <AlertTriangle className="w-3.5 h-3.5 text-red-500" />}
                {col.id === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                {col.label}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold font-mono ${col.badgeColor}`}>
                {stageWorks.length}
              </span>
            </div>

            {/* Cards Column */}
            <div className="space-y-3 flex-1 overflow-y-auto pr-1">
              {stageWorks.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-xs text-slate-400 border border-dashed border-slate-300 dark:border-slate-800 rounded-lg">
                  No works in this stage
                </div>
              ) : (
                stageWorks.map((work) => (
                  <div
                    key={work.id}
                    onClick={() => onSelectWork && onSelectWork(work)}
                    className="bg-white dark:bg-slate-800 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 shadow-sm hover:shadow-gov hover:border-blue-400 dark:hover:border-blue-500 cursor-pointer transition-all duration-150 relative"
                  >
                    {/* Top Row: Category & Risk */}
                    <div className="flex items-center justify-between gap-1 mb-1.5">
                      <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        {work.category}
                      </span>
                      <RiskBadge level={work.riskLevel} score={work.riskScore} size="sm" showPulse={false} />
                    </div>

                    {/* Title */}
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2 leading-snug">
                      {work.title}
                    </h4>

                    {/* Meta info */}
                    <div className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span>Work ID:</span>
                        <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{work.id}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Sanctioned:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                          {formatINR(work.sanctionedAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Physical vs Financial Progress Bars */}
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 space-y-1.5 text-[10px]">
                      <div>
                        <div className="flex justify-between text-slate-500 mb-0.5">
                          <span>Physical Progress</span>
                          <span className="font-bold text-slate-700 dark:text-slate-300">{work.physicalProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full"
                            style={{ width: `${work.physicalProgress}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-slate-500 mb-0.5">
                          <span>Financial Disbursed</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">{work.financialProgress}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{ width: `${work.financialProgress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Delay Prediction or ML Tag */}
                    {work.delayLikelihood > 40 && (
                      <div className="mt-2.5 px-2 py-1 rounded bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 flex items-center justify-between text-[10px] text-red-700 dark:text-red-400">
                        <span className="flex items-center gap-1 font-semibold">
                          <Clock className="w-3 h-3" /> Delay Risk
                        </span>
                        <span className="font-mono font-bold">{work.delayLikelihood}% prob.</span>
                      </div>
                    )}

                    {/* Photo verification trigger */}
                    {work.beforePhoto && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3 text-blue-500" /> Geotag Photos
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onVerifyPhotos) onVerifyPhotos(work);
                          }}
                          className="text-[10px] font-bold text-gov-blue dark:text-blue-400 hover:underline"
                        >
                          Inspect Photos
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

WorkKanban.propTypes = {
  works: PropTypes.arrayOf(PropTypes.object).isRequired,
  onSelectWork: PropTypes.func,
  onVerifyPhotos: PropTypes.func,
};

export default WorkKanban;
