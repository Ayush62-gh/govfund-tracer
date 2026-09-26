import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  RefreshCw,
  Home,
  AlertTriangle,
} from 'lucide-react';

/**
 * AccessDenied (403 Forbidden) Component
 * Institutional government security screen rendered when an unauthorized user attempts to access a protected route or action.
 */
export const AccessDenied = ({ requiredRoles = [], requiredPermission = null, customMessage = null }) => {
  const { currentUser, currentRole, switchRole } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl border border-red-200 dark:border-red-950/80 shadow-2xl p-6 sm:p-8 relative overflow-hidden text-center">
        {/* Top security warning banner */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-600 via-amber-500 to-red-600" />

        {/* Security Shield Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 mb-4 border border-red-200 dark:border-red-900 shadow-inner">
          <ShieldAlert className="w-9 h-9" />
        </div>

        <div className="inline-block px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-[11px] font-mono font-bold text-red-700 dark:text-red-300 uppercase tracking-wider mb-2">
          HTTP 403 Forbidden • Security Access Control Blocked
        </div>

        <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900 dark:text-white">
          Access Denied: Restricted Institutional Area
        </h2>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 max-w-lg mx-auto leading-relaxed">
          {customMessage ||
            'You do not have the necessary security clearance or jurisdictional authority to access this resource under MPLADS RBAC Governance Policy.'}
        </p>

        {/* Security Audit Snapshot */}
        <div className="my-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left text-xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">Active User:</span>
            <span className="font-bold text-slate-900 dark:text-slate-100 font-mono">
              {currentUser?.email || 'N/A'} ({currentUser?.name})
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">Active Role:</span>
            <span className="font-bold uppercase px-2 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-mono">
              {currentRole} — {currentUser?.roleName}
            </span>
          </div>

          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">Your Jurisdiction:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {currentUser?.jurisdiction || 'N/A'}
            </span>
          </div>

          {requiredRoles.length > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Required Role(s):</span>
              <span className="font-mono text-red-600 dark:text-red-400 font-bold">
                {requiredRoles.join(' or ').toUpperCase()}
              </span>
            </div>
          )}

          {requiredPermission && (
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Required Permission:</span>
              <span className="font-mono text-amber-600 dark:text-amber-400 font-bold">
                {requiredPermission}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold hover:bg-slate-50 flex items-center gap-2 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2 rounded-xl bg-gov-blue hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all"
          >
            <Home className="w-4 h-4" />
            <span>Return to My Dashboard</span>
          </button>
        </div>

        <div className="mt-6 text-[11px] text-slate-400 flex items-center justify-center gap-1.5 font-mono">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Security incident logged with SHA-256 digital signature to NIC Audit Ledger</span>
        </div>
      </div>
    </div>
  );
};

AccessDenied.propTypes = {
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
  requiredPermission: PropTypes.string,
  customMessage: PropTypes.string,
};

export default AccessDenied;
