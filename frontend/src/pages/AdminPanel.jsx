import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import ModelPerformance from '../components/admin/ModelPerformance';
import AuditLogsTable from '../components/admin/AuditLogsTable';
import RolesPermissionsMatrix from '../components/admin/RolesPermissionsMatrix';
import SystemConfigPanel from '../components/admin/SystemConfigPanel';
import UserManagementModal from '../components/admin/UserManagementModal';
import {
  Sliders,
  Users,
  Cpu,
  History,
  ShieldCheck,
  Server,
  Lock,
  Sparkles,
  UserPlus,
  Shield,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

/**
 * AdminPanel Page Component
 * System Administrator & MoSPI Apex governance center for user accounts, RBAC matrix, system config, ML observability, and audit ledgers.
 */
export const AdminPanel = () => {
  const { auditLogs, showToast, refreshData } = useData();
  const { currentUser, currentRole, isAuthenticated } = useAuth();
  const session = { currentUser, currentRole, isAuthenticated };

  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'users';

  const [usersList, setUsersList] = useState([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const res = await api.getUsers(session);
      if (res.ok) {
        setUsersList(res.data);
      }
    };
    fetchUsers();
  }, [activeTab]);

  const handleRetrain = () => {
    showToast('Active learning pipeline triggered. Retraining ensemble across active works...', 'info');
    setTimeout(() => {
      showToast('Model v4.2.9 converged. New precision: 93.1%, Recall: 89.8%.', 'success');
    }, 2500);
  };

  const handleSaveUser = async (newUserData) => {
    const res = await api.createUser(session, newUserData);
    if (res.ok) {
      setUsersList((prev) => [...prev, res.data]);
      showToast(`User ${res.data.name} registered with role ${res.data.role.toUpperCase()}`, 'success');
    } else {
      showToast(res.error?.message || 'Failed to create user', 'warning');
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'deactivated' : 'active';
    const res = await api.toggleUserStatus(session, userId, newStatus);
    if (res.ok) {
      setUsersList((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      showToast(`User account status set to ${newStatus.toUpperCase()}`, 'info');
    } else {
      showToast(res.error?.message || 'Failed to update user status', 'warning');
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.jurisdiction?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            <span>Admin & Governance Control Center</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            User provisioning, RBAC capability matrix, security policies, ML observability, and cryptographic audit ledger
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('roles')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'roles'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Roles & Permissions</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'config'
                ? 'bg-slate-900 dark:bg-slate-700 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>System Config</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('model')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'model'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>ML Observability</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('logs')}
            className={`px-3.5 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              activeTab === 'logs'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Audit Ledger</span>
          </button>
        </div>
      </div>

      {/* Cloud Infrastructure Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">NIC MeghRaj Cloud Node</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
              NDC Delhi • 99.98% Uptime
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">ML Batch Inference Engine</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
              128.4k Daily Scans (42ms)
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-500">RBAC Security Gateway</div>
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100 font-mono">
              Active • Scope Enforced
            </div>
          </div>
        </div>
      </div>

      {/* Main Tab Panels */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-gov space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>User Provisioning & Role Assignments</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage government officials, assign RBAC roles, and bind geographical jurisdiction scopes
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                placeholder="Search user, role, or jurisdiction..."
                value={userSearchTerm}
                onChange={(e) => setUserSearchTerm(e.target.value)}
                className="p-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 w-64"
              />

              <button
                type="button"
                onClick={() => setIsUserModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gov-blue hover:bg-blue-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Institutional User</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-start justify-between gap-3.5 hover:border-slate-300 transition-all"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-11 h-11 rounded-full object-cover border border-slate-300 dark:border-slate-700 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                        {user.name}
                      </h4>
                      <span
                        className={`px-2 py-0.2 rounded text-[10px] font-bold font-mono ${
                          user.role === 'mp'
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300'
                            : user.role === 'district'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : user.role === 'state'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : user.role === 'ministry'
                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {user.role?.toUpperCase()}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate">{user.roleName}</div>
                    <div className="mt-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 truncate">
                      {user.email}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Scope: <strong className="text-slate-700 dark:text-slate-300">{user.jurisdiction}</strong>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between shrink-0 h-full">
                  <button
                    type="button"
                    onClick={() => handleToggleUserStatus(user.id, user.status || 'active')}
                    className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 transition-all ${
                      user.status === 'deactivated'
                        ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {user.status === 'deactivated' ? (
                      <>
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Deactivated</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'roles' && <RolesPermissionsMatrix />}

      {activeTab === 'config' && <SystemConfigPanel />}

      {activeTab === 'model' && <ModelPerformance onRetrain={handleRetrain} />}

      {activeTab === 'logs' && <AuditLogsTable logs={auditLogs} />}

      {/* User Creation Modal */}
      <UserManagementModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSaveUser={handleSaveUser}
      />
    </div>
  );
};

export default AdminPanel;
