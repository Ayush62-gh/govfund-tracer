import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Download,
  Printer,
  FileCheck,
  Filter,
  Calendar,
  ShieldAlert,
  Building,
  CheckCircle2,
  Sparkles,
  MapPin,
  Lock,
} from 'lucide-react';
import { exportToCSV, exportToJSON, printDossier, triggerCelebration } from '../utils/exportUtils';
import { formatINR } from '../utils/formatters';

/**
 * Reports Page Component
 * Exportable compliance dossiers, custom report builder, and official GFR-19A Utilization Certificates.
 * Scoped to user's assigned jurisdiction.
 */
export const Reports = () => {
  const { roleKpis, alerts, works, showToast } = useData();
  const { currentUser, currentRole } = useAuth();

  const [reportType, setReportType] = useState('annual_dossier');
  const [fiscalYear, setFiscalYear] = useState('2025-26');

  const handleDownloadReport = (format) => {
    triggerCelebration();
    if (format === 'csv') {
      exportToCSV(works, `MPLADS_${currentUser.jurisdiction.replace(/[^a-zA-Z0-9]/g, '_')}_Report_${fiscalYear}.csv`);
      showToast('CSV Report downloaded successfully');
    } else if (format === 'json') {
      exportToJSON({ kpis: roleKpis, alerts, works, authority: currentUser }, `MPLADS_Dossier_${fiscalYear}.json`);
      showToast('JSON Dataset exported successfully');
    } else {
      printDossier();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
              {currentUser.jurisdiction}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Reports & Statutory Compliance Center</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Generate GFR-19A Utilization Certificates, Anomaly Audit Dossiers, and customized fiscal exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleDownloadReport('csv')}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 flex items-center gap-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadReport('pdf')}
            className="px-4 py-2 rounded-xl bg-gov-blue hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Print Official PDF Dossier</span>
          </button>
        </div>
      </div>

      {/* Pre-built Statutory Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print">
        <div
          onClick={() => setReportType('annual_dossier')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            reportType === 'annual_dossier'
              ? 'bg-blue-50/70 dark:bg-blue-950/40 border-blue-500 shadow-md ring-2 ring-blue-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <FileCheck className="w-5 h-5 text-blue-600" />
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Annual Summary
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Comprehensive Scheme Review Dossier
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Complete executive summary with fund utilization, physical progress, and district rankings.
          </p>
        </div>

        <div
          onClick={() => setReportType('uc_form')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            reportType === 'uc_form'
              ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
              GFR-19A Format
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            Statutory Utilization Certificate (UC)
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Standard format prescribed under General Financial Rules for installment release clearances.
          </p>
        </div>

        <div
          onClick={() => setReportType('anomaly_audit')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            reportType === 'anomaly_audit'
              ? 'bg-red-50/70 dark:bg-red-950/40 border-red-500 shadow-md ring-2 ring-red-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
              Audit Alert Log
            </span>
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
            AI Anomaly & Vigilance Dossier
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Detailed case files for flagged cost escalations, duplicate works, and unresolved alerts.
          </p>
        </div>
      </div>

      {/* Printable Report Dossier Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-gov">
        {/* Printable Official Header */}
        <div className="text-center pb-6 border-b border-slate-200 dark:border-slate-800">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-slate-900 text-amber-400 mb-2">
            <svg viewBox="0 0 24 24" className="w-7 h-7 fill-amber-400">
              <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 4a3 3 0 110 6 3 3 0 010-6zm0 13c-2.7 0-5.8-1.29-6-2.5V16c1.8-1.5 3.9-2 6-2s4.2.5 6 2v.5c-.2 1.21-3.3 2.5-6 2.5z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
            Government of India
          </h1>
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Ministry of Statistics and Programme Implementation (MoSPI)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Members of Parliament Local Area Development Scheme (MPLADS)
          </p>
          <div className="mt-2 text-xs font-mono font-bold text-orange-600 dark:text-orange-400">
            {reportType === 'annual_dossier' && `OFFICIAL SCHEME PERFORMANCE DOSSIER — FY ${fiscalYear}`}
            {reportType === 'uc_form' && `FORM GFR 19-A [See Rule 212 (1)] — UTILIZATION CERTIFICATE`}
            {reportType === 'anomaly_audit' && `CONFIDENTIAL AI ANOMALY & VIGILANCE AUDIT RECORD`}
          </div>
        </div>

        {/* Dossier Meta Grid */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-slate-400 block">Jurisdiction Scope</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{currentUser.jurisdiction}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Designated Officer</span>
            <span className="font-bold text-slate-900 dark:text-slate-100">{currentUser.name}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Sanctioned</span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{formatINR(roleKpis.totalSanctioned)}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Total Utilized</span>
            <span className="font-mono font-bold text-emerald-600">{formatINR(roleKpis.totalUtilized)} ({roleKpis.utilizationRate}%)</span>
          </div>
        </div>

        {/* Content Body Based on Selected Report */}
        <div className="mt-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            1. Scoped Project Executions & Milestone Records ({works.length} Works)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <th className="p-2.5">Work ID</th>
                  <th className="p-2.5">Project Title</th>
                  <th className="p-2.5">Category</th>
                  <th className="p-2.5">Sanctioned</th>
                  <th className="p-2.5">Expended</th>
                  <th className="p-2.5">Physical %</th>
                  <th className="p-2.5">Risk Level</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {works.map((work) => (
                  <tr key={work.id}>
                    <td className="p-2.5 font-mono text-slate-500">{work.id}</td>
                    <td className="p-2.5 font-medium max-w-xs truncate">{work.title}</td>
                    <td className="p-2.5 text-slate-500">{work.category}</td>
                    <td className="p-2.5 font-mono font-bold">{formatINR(work.sanctionedAmount)}</td>
                    <td className="p-2.5 font-mono">{formatINR(work.utilizedAmount)}</td>
                    <td className="p-2.5 font-bold text-emerald-600">{work.physicalProgress}%</td>
                    <td className="p-2.5 font-semibold capitalize">{work.riskLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Signatures & Certification Stamp */}
        <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-6 text-center text-xs text-slate-600 dark:text-slate-400">
          <div>
            <div className="h-12 flex items-center justify-center font-serif italic text-slate-400">
              Digitally Signed (DSC)
            </div>
            <div className="border-t border-slate-300 dark:border-slate-700 pt-1 font-bold text-slate-900 dark:text-slate-100">
              Executive Engineer
            </div>
            <div className="text-[10px]">Implementing Agency</div>
          </div>

          <div>
            <div className="h-12 flex items-center justify-center font-serif italic text-slate-400">
              Digitally Signed (DSC)
            </div>
            <div className="border-t border-slate-300 dark:border-slate-700 pt-1 font-bold text-slate-900 dark:text-slate-100">
              District Magistrate / DC
            </div>
            <div className="text-[10px]">District Planning Authority</div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <div className="h-12 flex items-center justify-center font-mono text-[10px] text-emerald-600 dark:text-emerald-400">
              NIC SHA-256 Verified
            </div>
            <div className="border-t border-slate-300 dark:border-slate-700 pt-1 font-bold text-slate-900 dark:text-slate-100">
              State Nodal Authority
            </div>
            <div className="text-[10px]">Planning Department</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
