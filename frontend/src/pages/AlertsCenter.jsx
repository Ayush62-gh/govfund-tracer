import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import DataTable from '../components/common/DataTable';
import RiskBadge from '../components/common/RiskBadge';
import AlertDetailModal from '../components/alerts/AlertDetailModal';
import {
  ShieldAlert,
  Filter,
  Sparkles,
  Download,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  MapPin,
} from 'lucide-react';
import { formatINR, getCategoryMeta } from '../utils/formatters';

/**
 * AlertsCenter Page Component
 * Central anomaly triage dashboard for flagged deviations, duplicate works, and cost surges.
 * Scoped to user jurisdiction under RBAC policies.
 */
export const AlertsCenter = () => {
  const { alerts, selectedAlert, setSelectedAlert, handleAlertAction } = useData();
  const { currentUser } = useAuth();
  const { t } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  const categories = [
    { id: 'all', label: 'All Anomalies' },
    { id: 'anom_cost_overrun', label: 'Cost Overruns' },
    { id: 'anom_duplicate', label: 'Duplicate Works' },
    { id: 'anom_delayed', label: 'Execution Delays' },
    { id: 'anom_payment', label: 'Payment Anomalies' },
    { id: 'anom_deviation', label: 'Norm Deviations' },
  ];

  const riskLevels = [
    { id: 'all', label: 'All Risks' },
    { id: 'high', label: 'High Risk (90+)', color: 'text-red-600' },
    { id: 'medium', label: 'Moderate Risk', color: 'text-amber-600' },
    { id: 'low', label: 'Low / Compliant', color: 'text-emerald-600' },
  ];

  const statuses = [
    { id: 'all', label: 'All Statuses' },
    { id: 'active', label: 'Active Alerts' },
    { id: 'inReview', label: 'Under Review' },
    { id: 'escalated', label: 'Escalated' },
    { id: 'resolved', label: 'Resolved' },
  ];

  const filteredAlerts = useMemo(() => {
    return alerts.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchRisk = selectedRisk === 'all' || item.riskLevel === selectedRisk;
      const matchStatus = selectedStatus === 'all' || item.status === selectedStatus;
      return matchCat && matchRisk && matchStatus;
    });
  }, [alerts, selectedCategory, selectedRisk, selectedStatus]);

  const columns = [
    {
      key: 'id',
      label: 'Alert Ref',
      width: '130px',
      sortable: true,
      render: (val, row) => (
        <div>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">{val}</span>
          <span className="text-[10px] text-slate-400 font-mono">{row.workId}</span>
        </div>
      ),
    },
    {
      key: 'title',
      label: 'Flagged Work Description & AI Root Cause',
      sortable: true,
      render: (val, row) => {
        const cat = getCategoryMeta(row.category);
        return (
          <div className="max-w-md">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-[10px] font-semibold px-2 py-0.2 rounded border ${cat.color}`}>
                {cat.label}
              </span>
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-mono">
                Conf: {row.confidence}
              </span>
            </div>
            <div className="font-bold text-slate-900 dark:text-slate-100 text-xs line-clamp-1 hover:text-blue-600">
              {val}
            </div>
            <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">{row.summary}</div>
          </div>
        );
      },
    },
    {
      key: 'riskScore',
      label: 'Risk Score',
      width: '140px',
      sortable: true,
      render: (val, row) => <RiskBadge level={row.riskLevel} score={val} size="sm" />,
    },
    {
      key: 'sanctionedAmount',
      label: 'Sanctioned / Expended',
      width: '160px',
      sortable: true,
      render: (val, row) => (
        <div className="text-xs">
          <div className="font-bold text-slate-900 dark:text-slate-100 font-mono">
            {formatINR(val)}
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            Expended: {formatINR(row.expenditureSoFar)}
          </div>
        </div>
      ),
    },
    {
      key: 'district',
      label: 'Jurisdiction & Agency',
      width: '160px',
      sortable: true,
      render: (val, row) => (
        <div className="text-xs">
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            {val}, {row.state}
          </div>
          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
            {row.implementingAgency}
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Triage Status',
      width: '120px',
      sortable: true,
      render: (val) => {
        const badgeMap = {
          active: <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">Active</span>,
          inReview: <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">In Review</span>,
          escalated: <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Escalated</span>,
          resolved: <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Resolved</span>,
        };
        return badgeMap[val] || <span>{val}</span>;
      },
    },
    {
      key: 'actions',
      label: 'Action',
      width: '100px',
      render: (_, row) => (
        <button
          type="button"
          onClick={() => setSelectedAlert(row)}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-gov-blue hover:bg-blue-700 text-white shadow-sm transition-all"
        >
          Inspect
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded">
              {currentUser.jurisdiction}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-600" />
            <span>Alerts & ML Anomaly Detection Center</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time automated screening of cost escalation, geospatial duplication, and norm breaches
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 font-mono">
            {filteredAlerts.length} Flagged Works in Scope
          </span>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat.id
                ? 'bg-gov-blue text-white shadow-sm dark:bg-blue-700'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Risk and Status Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Risk Severity
          </label>
          <select
            value={selectedRisk}
            onChange={(e) => setSelectedRisk(e.target.value)}
            className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          >
            {riskLevels.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase text-slate-500 mb-1">
            Triage Status
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full text-xs p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500"
          >
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2 flex items-end justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedRisk('all');
              setSelectedStatus('all');
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Flagged Works DataTable */}
      <DataTable
        columns={columns}
        data={filteredAlerts}
        searchKey="title"
        pageSize={6}
        exportFilename="MPLADS_Anomaly_Alerts.csv"
      />

      {/* Drill-down Modal */}
      <AlertDetailModal
        alert={selectedAlert}
        isOpen={Boolean(selectedAlert)}
        onClose={() => setSelectedAlert(null)}
        onAction={handleAlertAction}
      />
    </div>
  );
};

export default AlertsCenter;
