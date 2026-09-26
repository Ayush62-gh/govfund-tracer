import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Sliders, Save, RefreshCw, ShieldCheck, Lock, Database, Sparkles } from 'lucide-react';

/**
 * SystemConfigPanel Component
 * Admin system configuration panel for security, audit policies, and AI confidence thresholds.
 */
export const SystemConfigPanel = () => {
  const { isAuthenticated, currentUser, currentRole } = useAuth();
  const session = { isAuthenticated, currentUser, currentRole };
  const { showToast } = useData();

  const [config, setConfig] = useState({
    sessionTimeoutMinutes: 30,
    auditLogRetentionDays: 365,
    aiConfidenceThreshold: 85,
    mandatoryGeotagRadiusMeters: 50,
    ssoEnabled: true,
    twoFactorRequired: true,
    autoClawbackMonths: 24,
    enableAnomalyAlertPush: true,
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      const res = await api.getSystemConfig(session);
      if (res.ok) {
        setConfig(res.data);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    const res = await api.updateSystemConfig(session, config);
    setIsSaving(false);
    if (res.ok) {
      showToast('System configuration parameters saved and updated across NIC Cloud nodes.', 'success');
    } else {
      showToast(res.error?.message || 'Failed to update system configuration', 'warning');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-gov space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
            <Sliders className="w-5 h-5 text-purple-600" />
            <span>Platform Security & Governance Configuration</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Operational policies enforced across API gateway, authentication middleware, and ML pipeline
          </p>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 rounded-xl bg-gov-blue hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Applying Changes...' : 'Save Configuration'}</span>
        </button>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
        {/* Section 1: Security & Session */}
        <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-700">
            <Lock className="w-4 h-4 text-emerald-600" />
            <span>Session & Access Control</span>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Inactivity Session Timeout (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={config.sessionTimeoutMinutes}
              onChange={(e) => setConfig({ ...config, sessionTimeoutMinutes: Number(e.target.value) })}
              className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                MeriPehchaan (National SSO) Integration
              </div>
              <div className="text-[11px] text-slate-400">Allow Aadhaar/JanParichay federated auth</div>
            </div>
            <input
              type="checkbox"
              checked={config.ssoEnabled}
              onChange={(e) => setConfig({ ...config, ssoEnabled: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Mandatory DSC / 2FA for Financial Actions
              </div>
              <div className="text-[11px] text-slate-400">Digital signature for installment releases</div>
            </div>
            <input
              type="checkbox"
              checked={config.twoFactorRequired}
              onChange={(e) => setConfig({ ...config, twoFactorRequired: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Section 2: AI & Anomaly Detection */}
        <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-700">
            <Sparkles className="w-4 h-4 text-purple-600" />
            <span>AI Anomaly & Spatial Thresholds</span>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Minimum AI Confidence for High-Risk Alert Flagging (%)
            </label>
            <input
              type="number"
              min="50"
              max="99"
              value={config.aiConfidenceThreshold}
              onChange={(e) => setConfig({ ...config, aiConfidenceThreshold: Number(e.target.value) })}
              className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
              Geospatial Duplicate Match Radius (Meters)
            </label>
            <input
              type="number"
              min="10"
              max="200"
              value={config.mandatoryGeotagRadiusMeters}
              onChange={(e) => setConfig({ ...config, mandatoryGeotagRadiusMeters: Number(e.target.value) })}
              className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Push Critical Alerts to SNA & DM
              </div>
              <div className="text-[11px] text-slate-400">Automated SMS and email dispatches</div>
            </div>
            <input
              type="checkbox"
              checked={config.enableAnomalyAlertPush}
              onChange={(e) => setConfig({ ...config, enableAnomalyAlertPush: e.target.checked })}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Section 3: Audit & Lapsation */}
        <div className="space-y-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 md:col-span-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-700">
            <Database className="w-4 h-4 text-blue-600" />
            <span>Audit Ledger & Fund Clawback Rules</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Cryptographic Audit Log Retention (Days)
              </label>
              <input
                type="number"
                min="90"
                max="3650"
                value={config.auditLogRetentionDays}
                onChange={(e) => setConfig({ ...config, auditLogRetentionDays: Number(e.target.value) })}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                Idle Fund Automatic Clawback Period (Months)
              </label>
              <input
                type="number"
                min="12"
                max="60"
                value={config.autoClawbackMonths}
                onChange={(e) => setConfig({ ...config, autoClawbackMonths: Number(e.target.value) })}
                className="w-full p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SystemConfigPanel;
