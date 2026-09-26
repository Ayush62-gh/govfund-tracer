import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  TrendingUp,
  Copy,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Code2,
  Check,
  Building,
  MapPin,
  Tag,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { FLAG_METADATA, getRiskTierMeta } from '../../data/riskContractData';

const getFlagIcon = (iconName) => {
  switch (iconName) {
    case 'TrendingUp':
      return <TrendingUp className="w-3.5 h-3.5" />;
    case 'Copy':
      return <Copy className="w-3.5 h-3.5" />;
    case 'Clock':
      return <Clock className="w-3.5 h-3.5" />;
    case 'AlertTriangle':
    default:
      return <AlertTriangle className="w-3.5 h-3.5" />;
  }
};

/**
 * RiskScoreCard
 * Directly renders and validates an object following the exact Risk-Score JSON Contract:
 * {
 *   "work_id": "...",
 *   "state": "...",
 *   "category": "...",
 *   "ida": "...",
 *   "risk_score": 0-100,
 *   "flags": ["cost_outlier", ...],
 *   "explanation": "..."
 * }
 */
export const RiskScoreCard = ({ data, onSelect, onInspectJson }) => {
  const [copiedId, setCopiedId] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);
  const [showJsonInline, setShowJsonInline] = useState(false);

  if (!data) return null;

  const {
    work_id = 'N/A',
    state = 'Unassigned',
    category = 'General',
    ida = 'IDA-N/A',
    risk_score = 0,
    flags = [],
    explanation = '',
  } = data;

  const tierMeta = getRiskTierMeta(risk_score);
  const flagCount = flags.length;

  const handleCopyId = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(work_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyJson = (e) => {
    e.stopPropagation();
    const contractPayload = {
      work_id,
      state,
      category,
      ida,
      risk_score,
      flags,
      explanation,
    };
    navigator.clipboard.writeText(JSON.stringify(contractPayload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // SVG Gauge calculations
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, risk_score)) / 100) * circumference;

  return (
    <div
      onClick={() => onSelect && onSelect(data)}
      className={`group relative rounded-2xl border transition-all duration-200 cursor-pointer overflow-hidden ${
        tierMeta.borderClass
      } bg-white dark:bg-slate-900/95 hover:shadow-lg hover:-translate-y-0.5 p-5 flex flex-col justify-between`}
    >
      {/* Top Accent Gradient Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tierMeta.gradient}`} />

      {/* Header: Work ID, IDA, and Circular Risk Score Gauge */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            {/* Work ID + IDA chips */}
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <button
                type="button"
                onClick={handleCopyId}
                title="Click to copy Work ID"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-mono text-xs font-bold transition-colors"
              >
                <span>{work_id}</span>
                {copiedId ? (
                  <Check className="w-3 h-3 text-emerald-500" />
                ) : (
                  <Copy className="w-3 h-3 text-slate-400 opacity-60 group-hover:opacity-100" />
                )}
              </button>

              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                <Building className="w-3 h-3 text-blue-500" />
                <span>IDA: {ida}</span>
              </span>
            </div>

            {/* State & Category Meta */}
            <div className="flex flex-wrap items-center gap-y-1 gap-x-2.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {state}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                {category}
              </span>
            </div>
          </div>

          {/* Circular SVG Gauge */}
          <div className="relative shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              {/* Background circle */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                className="stroke-slate-100 dark:stroke-slate-800"
                strokeWidth="5"
                fill="transparent"
              />
              {/* Animated Progress circle */}
              <circle
                cx="32"
                cy="32"
                r={radius}
                stroke={tierMeta.barColor}
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            {/* Score in the center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-base font-extrabold font-mono leading-none text-slate-900 dark:text-white">
                {risk_score}
              </span>
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-tighter mt-0.5">
                /100
              </span>
            </div>
          </div>
        </div>

        {/* Risk Tier & Flag Count Status Bar */}
        <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-100 dark:border-slate-800/80">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${tierMeta.badgeBg}`}>
            <span className={`w-2 h-2 rounded-full ${tierMeta.dotColor} ${risk_score >= 71 ? 'animate-pulse' : ''}`} />
            {tierMeta.label}
          </span>

          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {flagCount === 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 0 Flags Active
              </span>
            ) : (
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {flagCount} {flagCount === 1 ? 'Anomaly Flag' : 'Anomaly Flags'}
              </span>
            )}
          </span>
        </div>

        {/* Multi-Flag Badges Container */}
        {flagCount > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-3.5">
            {flags.map((flagKey) => {
              const meta = FLAG_METADATA[flagKey] || {
                key: flagKey,
                label: flagKey.replace(/_/g, ' '),
                badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
                iconName: 'AlertTriangle',
              };

              return (
                <span
                  key={flagKey}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${meta.badgeClass}`}
                >
                  {getFlagIcon(meta.iconName)}
                  <span>{meta.label}</span>
                </span>
              );
            })}
          </div>
        ) : (
          <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>Compliant with all schedule, expenditure, and geospatial norms.</span>
          </div>
        )}

        {/* Human-readable explanation highlight */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed relative">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            <span>AI Risk Explanation</span>
          </div>
          <p className="line-clamp-3 italic text-slate-800 dark:text-slate-200">
            &ldquo;{explanation}&rdquo;
          </p>
        </div>

        {/* Inline JSON Preview (if toggled) */}
        {showJsonInline && (
          <div className="mt-3 p-3 rounded-xl bg-slate-950 text-emerald-400 font-mono text-[11px] border border-slate-800 overflow-x-auto">
            <pre>
              {JSON.stringify(
                {
                  work_id,
                  state,
                  category,
                  ida,
                  risk_score,
                  flags,
                  explanation,
                },
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowJsonInline((prev) => !prev);
            }}
            className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px] font-mono font-medium"
          >
            <Code2 className="w-3.5 h-3.5 text-blue-500" />
            <span>{showJsonInline ? 'Hide JSON' : 'JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyJson}
            title="Copy pure contract JSON payload"
            className="px-2.5 py-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-[11px]"
          >
            {copiedJson ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-emerald-600 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Payload</span>
              </>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onSelect) onSelect(data);
          }}
          className="px-3 py-1 rounded-lg font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60 transition-colors flex items-center gap-1 group-hover:translate-x-0.5"
        >
          <span>View Details</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

RiskScoreCard.propTypes = {
  data: PropTypes.shape({
    work_id: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    category: PropTypes.string.isRequired,
    ida: PropTypes.string.isRequired,
    risk_score: PropTypes.number.isRequired,
    flags: PropTypes.arrayOf(PropTypes.string).isRequired,
    explanation: PropTypes.string.isRequired,
  }).isRequired,
  onSelect: PropTypes.func,
  onInspectJson: PropTypes.func,
};

export default RiskScoreCard;
