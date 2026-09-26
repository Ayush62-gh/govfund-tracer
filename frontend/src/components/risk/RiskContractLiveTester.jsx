import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Code2,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Sparkles,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import RiskScoreCard from './RiskScoreCard';
import { validateRiskContract, MOCK_RISK_RECORDS } from '../../data/riskContractData';

const PRESET_PAYLOADS = [
  {
    name: 'Example from Specification (Cost Outlier + Delayed)',
    payload: {
      work_id: "WORK-001",
      state: "Uttar Pradesh",
      category: "Road Development",
      ida: "IDA-001",
      risk_score: 82,
      flags: [
        "cost_outlier",
        "delayed"
      ],
      explanation: "The estimated project cost is significantly higher than similar works, and the project has exceeded its expected completion timeline."
    },
  },
  {
    name: 'Critical Multi-Flag (4 Flags, Score 98)',
    payload: {
      work_id: "WORK-CRIT-990",
      state: "West Bengal",
      category: "Drinking Water & Sanitation",
      ida: "IDA-WB-007",
      risk_score: 98,
      flags: [
        "cost_outlier",
        "possible_duplicate",
        "delayed",
        "fund_mismatch"
      ],
      explanation: "Multi-anomaly trigger: 100% fund disbursement with zero physical progress verification, 54% unit cost inflation above SOR, and duplicate coordinates matching a completed 2024 work."
    },
  },
  {
    name: 'Compliant Clean Work (Low Risk, Score 14, 0 Flags)',
    payload: {
      work_id: "WORK-CLEAN-104",
      state: "Uttar Pradesh",
      category: "Education & Skill Development",
      ida: "IDA-UP-001",
      risk_score: 14,
      flags: [],
      explanation: "All milestone disbursements, schedule benchmarks, and geo-tagged verification records are within normal baseline thresholds."
    },
  },
  {
    name: 'Geospatial Duplicate + Fund Mismatch (Score 89)',
    payload: {
      work_id: "WORK-DUP-402",
      state: "Maharashtra",
      category: "Irrigation & Drainage",
      ida: "IDA-MH-025",
      risk_score: 89,
      flags: [
        "possible_duplicate",
        "fund_mismatch"
      ],
      explanation: "High spatial polygon overlap (94% within 35m) with another sanctioned state scheme, combined with sudden frontloaded fund withdrawals."
    },
  },
];

/**
 * RiskContractLiveTester
 * Live interactive test harness where users can paste arbitrary JSON payloads
 * to verify schema validation and see the dynamic frontend rendering in real-time.
 */
export const RiskContractLiveTester = ({ onSelectWork }) => {
  const [inputJson, setInputJson] = useState(
    JSON.stringify(PRESET_PAYLOADS[0].payload, null, 2)
  );
  const [parsedObject, setParsedObject] = useState(PRESET_PAYLOADS[0].payload);
  const [validationResult, setValidationResult] = useState(() =>
    validateRiskContract(PRESET_PAYLOADS[0].payload)
  );
  const [copied, setCopied] = useState(false);

  const handleTestJson = (jsonString) => {
    setInputJson(jsonString);
    try {
      const parsed = JSON.parse(jsonString);
      setParsedObject(parsed);
      const res = validateRiskContract(parsed);
      setValidationResult(res);
    } catch (err) {
      setParsedObject(null);
      setValidationResult({
        isValid: false,
        errors: [`JSON Syntax Error: ${err.message}`],
      });
    }
  };

  const handleLoadPreset = (preset) => {
    const str = JSON.stringify(preset.payload, null, 2);
    handleTestJson(str);
  };

  const handleCopyCurrent = () => {
    navigator.clipboard.writeText(inputJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Description */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-850 border border-blue-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-bold text-sm text-blue-900 dark:text-blue-300">
            <Code2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>Interactive Risk-Score Contract Tester & Schema Verifier</span>
          </div>
          <p className="text-xs text-blue-950/70 dark:text-slate-300 mt-1 max-w-2xl">
            Paste any mock JSON or future ML model response to test that it matches the exact contract.
            The card preview dynamically consumes the payload below.
          </p>
        </div>

        {/* Preset Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Presets:</span>
          {PRESET_PAYLOADS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleLoadPreset(p)}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-400 transition-all shadow-sm truncate max-w-[140px]"
              title={p.name}
            >
              Preset {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Layout: Code Editor on Left, Live Rendered Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor Box */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <span>JSON Contract Input</span>
              {validationResult.isValid ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="w-3 h-3" /> Valid Schema
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300">
                  <AlertTriangle className="w-3 h-3" /> Schema Errors ({validationResult.errors.length})
                </span>
              )}
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyCurrent}
                className="px-2.5 py-1 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => handleLoadPreset(PRESET_PAYLOADS[0])}
                className="px-2.5 py-1 rounded-lg text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <textarea
            value={inputJson}
            onChange={(e) => handleTestJson(e.target.value)}
            rows={15}
            className="w-full p-4 rounded-2xl bg-slate-950 text-emerald-400 font-mono text-xs border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner leading-relaxed"
            placeholder="Paste your JSON here..."
          />

          {/* Validation Feedback */}
          {!validationResult.isValid && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 text-xs text-red-800 dark:text-red-200 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span>Contract Validation Issues:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] font-mono pl-1">
                {validationResult.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Live Card Preview */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>Dynamic UI Component Output</span>
          </div>

          {parsedObject && validationResult.isValid ? (
            <div className="space-y-4">
              <RiskScoreCard
                data={parsedObject}
                onSelect={(item) => onSelectWork && onSelectWork(item)}
              />

              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                <div className="font-bold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Plug & Play Verification Successful</span>
                </div>
                <p>
                  This payload is 100% compliant with the risk-score contract and can be dropped directly into the real backend API without modifying frontend views.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center text-slate-400 h-64">
              <AlertTriangle className="w-8 h-8 text-amber-500 mb-2 opacity-60" />
              <div className="font-semibold text-xs text-slate-600 dark:text-slate-300">
                Fix JSON errors on the left to render the component preview.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

RiskContractLiveTester.propTypes = {
  onSelectWork: PropTypes.func,
};

export default RiskContractLiveTester;
