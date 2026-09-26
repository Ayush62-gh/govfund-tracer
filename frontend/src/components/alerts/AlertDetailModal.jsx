import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../common/Modal';
import RiskBadge from '../common/RiskBadge';
import { formatINR, getCategoryMeta } from '../../utils/formatters';
import {
  Sparkles,
  ShieldAlert,
  Building2,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  FileText,
  AlertTriangle,
  History,
  TrendingUp,
} from 'lucide-react';

/**
 * AlertDetailModal Component
 * Deep-dive audit dossier modal for flagged anomalies with AI evidence, SHAP values, and triage actions.
 */
export const AlertDetailModal = ({ alert, isOpen, onClose, onAction }) => {
  const [activeTab, setActiveTab] = useState('explanation'); // 'explanation' | 'evidence' | 'audit'
  const [actionNote, setActionNote] = useState('');
  const [selectedActionType, setSelectedActionType] = useState('reviewed');

  if (!alert) return null;

  const catMeta = getCategoryMeta(alert.category);

  const handleSubmitAction = (e) => {
    e.preventDefault();
    if (onAction) {
      onAction(alert.id, selectedActionType, actionNote);
    }
    setActionNote('');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="ML Anomaly Dossier & Audit Review"
      subtitle={`Investigation Case File: ${alert.id} • Work Ref: ${alert.workId}`}
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Top Header Banner */}
        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${catMeta.color}`}>
                {catMeta.label}
              </span>
              <span className="text-xs text-slate-700 dark:text-slate-300">
                Flagged: <strong>{alert.dateFlagged}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded font-mono font-bold">
                Confidence: {alert.confidence}
              </span>
              <RiskBadge level={alert.riskLevel} score={alert.riskScore} size="md" />
            </div>
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 leading-snug">
            {alert.title}
          </h3>

          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs border-t border-slate-200 dark:border-slate-700 pt-3">
            <div>
              <span className="text-slate-700 dark:text-slate-300 block">Location</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {alert.district}, {alert.state}
              </span>
            </div>
            <div>
              <span className="text-slate-700 dark:text-slate-300 block">Implementing Agency</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {alert.implementingAgency}
              </span>
            </div>
            <div>
              <span className="text-slate-700 dark:text-slate-300 block">Sanctioned Budget</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {formatINR(alert.sanctionedAmount)}
              </span>
            </div>
            <div>
              <span className="text-slate-700 dark:text-slate-300 block">Disbursed So Far</span>
              <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
                {formatINR(alert.expenditureSoFar)}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('explanation')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'explanation'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Reasoning & Root Cause</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'evidence'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>SHAP Impact & Peer Benchmarks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'audit'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Trail & Actions ({alert.auditTrail?.length || 0})</span>
          </button>
        </div>

        {/* Tab 1: AI Reasoning & Explanation */}
        {activeTab === 'explanation' && (
          <div className="space-y-4 animate-fade-in">
            <div className="bg-purple-50 dark:bg-purple-950/30 rounded-xl p-4 border border-purple-200 dark:border-purple-800/60">
              <div className="flex items-center gap-2 text-purple-900 dark:text-purple-300 font-bold text-xs mb-1">
                <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Executive AI Synthesis</span>
              </div>
              <p className="text-xs text-purple-950 dark:text-purple-200 leading-relaxed font-medium">
                {alert.summary}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Detailed Diagnostic Triggers
              </h4>
              <ul className="space-y-2">
                {alert.aiReasoning?.map((reason, idx) => (
                  <li
                    key={idx}
                    className="p-3 bg-white dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2.5"
                  >
                    <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 flex items-center justify-center shrink-0 font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="leading-relaxed">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: SHAP Feature Importance & Peer Evidence */}
        {activeTab === 'evidence' && (
          <div className="space-y-5 animate-fade-in">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-between">
                <span>SHAP Feature Attribution (Why Model Flagged This)</span>
                <span className="text-[10px] text-slate-400 font-normal">Base value = 0.05 (Compliant)</span>
              </h4>

              <div className="space-y-2.5">
                {alert.shapValues?.map((item, idx) => {
                  const isPositive = item.impact.startsWith('+');
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs"
                    >
                      <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        <span>{item.feature}</span>
                        <span
                          className={`font-mono font-bold ${
                            isPositive ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {item.impact}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isPositive ? 'bg-red-500' : 'bg-emerald-500'}`}
                          style={{ width: `${Math.min(Math.abs(parseFloat(item.impact)) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Peer Comparison Grid */}
            {alert.peerComparison && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                  District & Scheme Peer Comparisons
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(alert.peerComparison).map(([key, val]) => (
                    <div key={key} className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                      <span className="text-slate-400 block capitalize text-[11px]">
                        {key.replace(/([A-Z])/g, ' $1')}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-sm mt-0.5 block">
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Chronological Audit Trail */}
        {activeTab === 'audit' && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-800 space-y-6">
              {alert.auditTrail?.map((trail, idx) => (
                <div key={idx} className="relative">
                  <div className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-blue-600 border-2 border-white dark:border-slate-900" />
                  <div className="text-[11px] font-mono text-slate-400">
                    {trail.timestamp}
                  </div>
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {trail.user}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                    {trail.action}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Decision Form */}
        <form onSubmit={handleSubmitAction} className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              Authority Action & Official Remarks
            </span>
            <span className="text-[11px] text-slate-400">Recorded with Digital Signature</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => setSelectedActionType('reviewed')}
              className={`p-2.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                selectedActionType === 'reviewed'
                  ? 'bg-blue-50 dark:bg-blue-950 border-blue-500 text-blue-700 dark:text-blue-300 ring-2 ring-blue-400/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Mark Reviewed
            </button>

            <button
              type="button"
              onClick={() => setSelectedActionType('escalated')}
              className={`p-2.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                selectedActionType === 'escalated'
                  ? 'bg-red-50 dark:bg-red-950 border-red-500 text-red-700 dark:text-red-300 ring-2 ring-red-400/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Escalate to Vigilance
            </button>

            <button
              type="button"
              onClick={() => setSelectedActionType('clarification')}
              className={`p-2.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                selectedActionType === 'clarification'
                  ? 'bg-amber-50 dark:bg-amber-950 border-amber-500 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Request Clarification
            </button>

            <button
              type="button"
              onClick={() => setSelectedActionType('resolved')}
              className={`p-2.5 rounded-lg text-xs font-semibold border transition-all text-center ${
                selectedActionType === 'resolved'
                  ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400/20'
                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              Resolve & Close Query
            </button>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter official remark / note for the audit log..."
              value={actionNote}
              onChange={(e) => setActionNote(e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-gov-blue hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Record Action</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

AlertDetailModal.propTypes = {
  alert: PropTypes.object,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAction: PropTypes.func,
};

export default AlertDetailModal;
