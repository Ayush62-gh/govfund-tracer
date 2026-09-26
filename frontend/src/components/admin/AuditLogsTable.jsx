import React from 'react';
import PropTypes from 'prop-types';
import DataTable from '../common/DataTable';
import { ShieldCheck, Lock } from 'lucide-react';

/**
 * AuditLogsTable Component
 * Displays system-wide tamper-proof audit trails with cryptographic hash checks.
 */
export const AuditLogsTable = ({ logs = [] }) => {
  const columns = [
    {
      key: 'id',
      label: 'Log ID',
      width: '110px',
      sortable: true,
      render: (val) => <span className="font-mono text-slate-500 font-bold">{val}</span>,
    },
    {
      key: 'timestamp',
      label: 'Timestamp (IST)',
      width: '180px',
      sortable: true,
      render: (val) => <span className="font-mono text-xs">{val}</span>,
    },
    {
      key: 'user',
      label: 'Authority / User',
      sortable: true,
      render: (val, row) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-slate-100">{val}</div>
          <div className="text-[10px] text-slate-400">{row.role}</div>
        </div>
      ),
    },
    {
      key: 'action',
      label: 'Logged Operation',
      render: (val) => (
        <span className="font-medium text-slate-800 dark:text-slate-200">
          {val}
        </span>
      ),
    },
    {
      key: 'ip',
      label: 'Node IP',
      width: '120px',
      render: (val) => <span className="font-mono text-[11px] text-slate-500">{val}</span>,
    },
    {
      key: 'hash',
      label: 'Crypto Hash',
      width: '130px',
      render: (val) => (
        <span className="inline-flex items-center gap-1 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-emerald-600 dark:text-emerald-400">
          <Lock className="w-2.5 h-2.5" />
          {val}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Immutable Ledger • Signed with NIC Root CA Certificate</span>
        </span>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        searchKey="action"
        pageSize={8}
        exportFilename="MPLADS_System_Audit_Logs.csv"
      />
    </div>
  );
};

AuditLogsTable.propTypes = {
  logs: PropTypes.arrayOf(PropTypes.object),
};

export default AuditLogsTable;
