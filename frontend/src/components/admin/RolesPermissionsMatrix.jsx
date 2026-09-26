import React from 'react';
import {
  ROLES,
  ROLE_DEFINITIONS,
  ROLE_PERMISSIONS,
  PERMISSIONS,
} from '../../services/rbacService';
import { ShieldCheck, XCircle, CheckCircle2, Shield, Lock, Layers } from 'lucide-react';

/**
 * RolesPermissionsMatrix Component
 * Interactive visual representation of the RBAC capability matrix across all 5 official MPLADS roles.
 */
export const RolesPermissionsMatrix = () => {
  const permissionCategories = [
    {
      category: 'Project & Works Governance',
      permissions: [
        { key: PERMISSIONS.VIEW_OWN_PROJECTS, label: 'View Own Recommended Projects', desc: 'Constituency-scoped view' },
        { key: PERMISSIONS.VIEW_DISTRICT_PROJECTS, label: 'View District-wide Projects', desc: 'All works in district' },
        { key: PERMISSIONS.VIEW_STATE_PROJECTS, label: 'View State-wide Projects', desc: 'All districts in state' },
        { key: PERMISSIONS.VIEW_NATIONAL_PROJECTS, label: 'View Pan-India National Projects', desc: '543 LS + 245 RS' },
        { key: PERMISSIONS.MANAGE_DISTRICT_WORKS, label: 'Manage & Update Work Status', desc: 'Execution milestones' },
        { key: PERMISSIONS.APPROVE_MILESTONES, label: 'Approve Physical Site Photos', desc: 'DSC signoff' },
      ],
    },
    {
      category: 'Financial Analytics & Utilization',
      permissions: [
        { key: PERMISSIONS.VIEW_OWN_FINANCIALS, label: 'View Own Constituency Financials', desc: 'MP fund utilization' },
        { key: PERMISSIONS.VIEW_DISTRICT_FINANCIALS, label: 'View District Financials', desc: 'District account ledger' },
        { key: PERMISSIONS.VIEW_STATE_FINANCIALS, label: 'View State Financials', desc: 'Consolidated state funds' },
        { key: PERMISSIONS.VIEW_NATIONAL_FINANCIALS, label: 'View National Macro Financials', desc: 'Budget allocations' },
      ],
    },
    {
      category: 'AI Anomaly Triage & Vigilance',
      permissions: [
        { key: PERMISSIONS.VIEW_OWN_ALERTS, label: 'View Own Project Alerts', desc: 'Constituency risk flags' },
        { key: PERMISSIONS.VIEW_DISTRICT_ALERTS, label: 'View District Anomaly Alerts', desc: 'District triage table' },
        { key: PERMISSIONS.VIEW_STATE_ALERTS, label: 'View State Anomaly Trends', desc: 'Duplicate detection' },
        { key: PERMISSIONS.VIEW_NATIONAL_ALERTS, label: 'View Nationwide Risk Index', desc: 'Pan-India surveillance' },
        { key: PERMISSIONS.TAKE_ALERT_ACTION, label: 'Action & Resolve Alerts', desc: 'Mark reviewed / compliant' },
        { key: PERMISSIONS.ESCALATE_TO_VIGILANCE, label: 'Escalate to Anti-Corruption Wing', desc: 'Formal vigilance inquiry' },
      ],
    },
    {
      category: 'Statutory Reports & Signing',
      permissions: [
        { key: PERMISSIONS.GENERATE_REPORTS, label: 'Generate Scheme Reports', desc: 'CSV & PDF dossier export' },
        { key: PERMISSIONS.SIGN_STATUTORY_REPORTS, label: 'GFR-19A Digital Signature (DSC)', desc: 'Official UC clearance' },
      ],
    },
    {
      category: 'Administration & System Controls',
      permissions: [
        { key: PERMISSIONS.MANAGE_USERS, label: 'Create & Deactivate Users', desc: 'Credential governance' },
        { key: PERMISSIONS.MANAGE_ROLES_PERMISSIONS, label: 'Assign & Reconfigure Roles', desc: 'RBAC policy controls' },
        { key: PERMISSIONS.MANAGE_SYSTEM_CONFIG, label: 'Update System Configuration', desc: 'Security & ML settings' },
        { key: PERMISSIONS.VIEW_AUDIT_LOGS, label: 'Inspect Cryptographic Audit Ledger', desc: 'SHA-256 logs' },
        { key: PERMISSIONS.TRIGGER_ML_RETRAIN, label: 'Trigger AI Model Retraining', desc: 'Batch active learning' },
      ],
    },
  ];

  const roleList = [
    { key: ROLES.MP, label: 'MP', name: 'Member of Parliament' },
    { key: ROLES.DISTRICT, label: 'District Auth', name: 'District Authority / DM' },
    { key: ROLES.STATE, label: 'State SNA', name: 'State Nodal Authority' },
    { key: ROLES.MINISTRY, label: 'Ministry', name: 'MoSPI Apex Officer' },
    { key: ROLES.ADMIN, label: 'Admin', name: 'System Administrator' },
  ];

  return (
    <div className="space-y-6">
      {/* Role Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {ROLE_DEFINITIONS.map((def) => (
          <div
            key={def.role}
            className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
          >
            <div>
              <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold font-mono mb-2 ${def.badgeColor}`}>
                {def.role.toUpperCase()}
              </span>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-2">
                {def.name}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                {def.scopeDescription}
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 font-mono">
              Scope: {def.dashboardType}
            </div>
          </div>
        ))}
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-gov">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-display">
              RBAC Entitlement & Capability Matrix
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Backend API Enforced • 5 Defined Roles
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
                <th className="p-3 font-bold w-1/3">Permission / Capability</th>
                {roleList.map((r) => (
                  <th key={r.key} className="p-3 text-center font-bold">
                    <span className="block">{r.label}</span>
                    <span className="text-[9px] font-normal text-slate-400 hidden sm:block">{r.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {permissionCategories.map((cat, idx) => (
                <React.Fragment key={cat.category}>
                  <tr className="bg-slate-100/60 dark:bg-slate-800/40">
                    <td
                      colSpan={6}
                      className="px-3 py-2 text-[11px] font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
                    >
                      {idx + 1}. {cat.category}
                    </td>
                  </tr>

                  {cat.permissions.map((perm) => (
                    <tr key={perm.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {perm.label}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {perm.key} • {perm.desc}
                        </div>
                      </td>

                      {roleList.map((r) => {
                        const isGranted = (ROLE_PERMISSIONS[r.key] || []).includes(perm.key);
                        return (
                          <td key={r.key} className="p-3 text-center">
                            {isGranted ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <CheckCircle2 className="w-4 h-4" />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600">
                                <XCircle className="w-4 h-4" />
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RolesPermissionsMatrix;
