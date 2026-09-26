import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  X,
  Copy,
  Check,
  Building,
  MapPin,
  Tag,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Code2,
  Download,
  ShieldAlert,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  FileCheck2,
} from 'lucide-react';
import {
  FLAG_METADATA,
  getRiskTierMeta,
  validateRiskContract,
} from '../../data/riskContractData';

const getFlagIcon = (iconName) => {
  switch (iconName) {
    case 'TrendingUp':
      return <TrendingUp className="w-4 h-4" />;
    case 'Copy':
      return <Copy className="w-4 h-4" />;
    case 'Clock':
      return <Clock className="w-4 h-4" />;
    case 'AlertTriangle':
    default:
      return <AlertTriangle className="w-4 h-4" />;
  }
};

/**
 * RiskScoreModal
 * Deep dive inspection modal for a single Risk-Score JSON Contract record
 */
export const RiskScoreModal = ({ item, onClose, onActionClick }) => {
  const [activeTab, setActiveTab] = useState('analysis'); // 'analysis' | 'raw_json' | 'contract_spec'
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  if (!item) return null;

  const {
    work_id,
    state,
    category,
    ida,
    risk_score,
    flags = [],
    explanation,
  } = item;

  const tierMeta = getRiskTierMeta(risk_score);
  const validation = validateRiskContract(item);

  const contractPayload = {
    work_id,
    state,
    category,
    ida,
    risk_score,
    flags,
    explanation,
  };

  const jsonString = JSON.stringify(contractPayload, null, 2);

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonString);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(work_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `risk_score_${work_id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-5 border-b border-slate-200 dark:border-slate-800 relative bg-gradient-to-r ${tierMeta.gradient}/10`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{work_id}</span>
                  <button
                    type="button"
                    onClick={handleCopyId}
                    title="Copy Work ID"
                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  >
                    {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </span>

                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-mono font-bold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                  <Building className="w-3.5 h-3.5 text-blue-500" />
                  <span>IDA: {ida}</span>
                </span>

                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${tierMeta.badgeBg}`}>
                  <span className={`w-2 h-2 rounded-full ${tierMeta.dotColor}`} />
                  {tierMeta.label}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {state}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-slate-400" />
                  {category}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('analysis')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'analysis'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Risk Analysis & Flags</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('raw_json')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'raw_json'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Raw JSON Contract</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('contract_spec')}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'contract_spec'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Contract Specification</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 dark:text-slate-200 text-sm">
          {activeTab === 'analysis' && (
            <div className="space-y-6 animate-fade-in">
              {/* Score & Tier Banner */}
              <div className={`p-4 rounded-2xl border ${tierMeta.borderClass} ${tierMeta.bgClass} flex flex-col sm:flex-row items-center justify-between gap-4`}>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-mono font-extrabold ${tierMeta.badgeColor} shadow-md`}>
                    <span className="text-2xl leading-none">{risk_score}</span>
                    <span className="text-[10px] opacity-80 uppercase tracking-tight mt-0.5">/100</span>
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Calculated Anomaly Risk Score
                    </div>
                    <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                      {tierMeta.label} ({tierMeta.thresholdLabel})
                    </div>
                    <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      {tierMeta.actionLabel}
                    </div>
                  </div>
                </div>

                <div className="text-right sm:border-l border-slate-200 dark:border-slate-800 sm:pl-4">
                  <div className="text-xs text-slate-500">Active Anomaly Flags</div>
                  <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                    {flags.length}
                  </div>
                </div>
              </div>

              {/* Human-readable explanation card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  <Info className="w-4 h-4 text-blue-500" />
                  <span>Human-Readable Anomaly Explanation</span>
                </div>
                <p className="text-sm text-slate-900 dark:text-slate-100 leading-relaxed font-medium">
                  &ldquo;{explanation}&rdquo;
                </p>
              </div>

              {/* Detailed Flag Breakdown */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Detected Anomaly Flags ({flags.length})</span>
                </h4>

                {flags.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {flags.map((flagKey) => {
                      const meta = FLAG_METADATA[flagKey] || {
                        key: flagKey,
                        label: flagKey.replace(/_/g, ' '),
                        shortDesc: 'Custom anomaly trigger',
                        badgeClass: 'bg-slate-100 text-slate-700',
                        iconName: 'AlertTriangle',
                      };

                      return (
                        <div
                          key={flagKey}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/80 shadow-sm flex items-start gap-3"
                        >
                          <div className={`p-2 rounded-lg ${meta.badgeClass}`}>
                            {getFlagIcon(meta.iconName)}
                          </div>
                          <div>
                            <div className="font-bold text-xs text-slate-900 dark:text-slate-100 font-mono">
                              {meta.label} ({meta.key})
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {meta.shortDesc}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <div>
                      <div className="font-bold">Zero Anomaly Flags Detected</div>
                      <div className="mt-0.5">All baseline milestones, Schedule of Rates pricing, and physical inspections match statutory criteria.</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Contract Metadata Grid */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Contract Field Attributes
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500">work_id</div>
                    <div className="font-bold font-mono text-slate-900 dark:text-slate-100 truncate mt-0.5">
                      {work_id}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500">ida</div>
                    <div className="font-bold font-mono text-blue-600 dark:text-blue-400 truncate mt-0.5">
                      {ida}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500">state</div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                      {state}
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="text-slate-500">category</div>
                    <div className="font-bold text-slate-900 dark:text-slate-100 truncate mt-0.5">
                      {category}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'raw_json' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                    risk_score_contract_v1.json
                  </span>
                  {validation.isValid ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="w-3 h-3" /> Contract Validated (7/7 Fields)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                      <AlertTriangle className="w-3 h-3" /> Contract Schema Errors
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    {copiedJson ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadJson}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Syntax Highlighted JSON Box */}
              <div className="p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 overflow-x-auto shadow-inner leading-relaxed">
                <pre>{jsonString}</pre>
              </div>

              <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 text-xs text-blue-900 dark:text-blue-200">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Backend & ML Plug-and-Play Compatibility</span>
                </div>
                <p>
                  When the ML model endpoint is live, the backend can return this exact JSON payload directly to the frontend. Zero UI restructuring required.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'contract_spec' && (
            <div className="space-y-4 animate-fade-in text-xs">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white mb-2">
                  Official Risk-Score JSON Contract Schema
                </h4>
                <p className="text-slate-600 dark:text-slate-300 mb-4">
                  The frontend adheres strictly to this contract for all risk assessments:
                </p>

                <div className="space-y-2 font-mono">
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-blue-600 dark:text-blue-400">&quot;work_id&quot;</span>: string → Unique identifier of the MPLADS work/project.
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-blue-600 dark:text-blue-400">&quot;state&quot;</span>: string → State where the work is located.
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-blue-600 dark:text-blue-400">&quot;category&quot;</span>: string → Work/project category.
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-blue-600 dark:text-blue-400">&quot;ida&quot;</span>: string → Agreed identifier of the Implementing District Authority.
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-blue-600 dark:text-blue-400">&quot;risk_score&quot;</span>: number (0-100) → Numerical risk score.
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-blue-600 dark:text-blue-400">&quot;flags&quot;</span>: string[] → Array of detected risk/anomaly types (&quot;cost_outlier&quot;, &quot;possible_duplicate&quot;, &quot;delayed&quot;, &quot;fund_mismatch&quot;).
                  </div>
                  <div className="p-2.5 rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                    <span className="font-bold text-blue-600 dark:text-blue-400">&quot;explanation&quot;</span>: string → Human-readable explanation of the detected risk/anomaly.
                  </div>
                </div>
              </div>

              {/* Privacy Rule Card */}
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200">
                <div className="font-bold flex items-center gap-1.5 mb-1 text-sm">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Non-Negotiable Demo / Privacy Protocol</span>
                </div>
                <p className="leading-relaxed">
                  All synthetic risk flags and anomalies are generated on mock datasets. Real MP names and real agency names are strictly disallowed from demo and presentation materials. Fictional identifiers are used throughout.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between text-xs">
          <div className="text-slate-500 font-mono">
            Status: {validation.isValid ? 'Schema Valid' : 'Schema Warning'}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-semibold hover:opacity-90 transition-opacity"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};

RiskScoreModal.propTypes = {
  item: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onActionClick: PropTypes.func,
};

export default RiskScoreModal;
