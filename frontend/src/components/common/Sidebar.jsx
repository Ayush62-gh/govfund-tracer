import React from 'react';
import PropTypes from 'prop-types';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import {
  LayoutDashboard,
  ShieldAlert,
  BarChart3,
  GitBranch,
  TrendingUp,
  FileCheck2,
  Sliders,
  Cpu,
  Building,
  Users,
  Shield,
  History,
  Lock,
  Landmark,
} from 'lucide-react';
import { ROLES, ROLE_DEFINITIONS } from '../../services/rbacService';

/**
 * Sidebar Component
 * Role-adaptive navigation displaying the exact navigation items required per role.
 */
export const Sidebar = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const { currentRole, currentUser } = useAuth();
  const { alerts } = useData();
  const location = useLocation();

  const highAlertCount = alerts.filter((a) => a.riskLevel === 'high' && a.status !== 'resolved').length;

  const roleMeta = ROLE_DEFINITIONS.find((r) => r.role === currentRole) || ROLE_DEFINITIONS[0];

  // Dynamic Navigation Items tailored per role
  const getNavItems = () => {
    switch (currentRole) {
      case ROLES.MP:
        return {
          sectionTitle: 'MP Constituency View',
          items: [
            { to: '/dashboard/mp', label: 'My Projects', icon: <LayoutDashboard className="w-4 h-4" /> },
            { to: '/tracker', label: 'Project Progress', icon: <GitBranch className="w-4 h-4" /> },
            { to: '/financials', label: 'Fund Utilization', icon: <BarChart3 className="w-4 h-4" /> },
            {
              to: '/alerts',
              label: 'Risk Alerts',
              icon: <ShieldAlert className="w-4 h-4" />,
              badge: highAlertCount > 0 ? highAlertCount : null,
              badgeColor: 'bg-red-500 text-white',
            },
            { to: '/predictive', label: 'Predictive Insights', icon: <TrendingUp className="w-4 h-4" /> },
            { to: '/reports', label: 'Reports', icon: <FileCheck2 className="w-4 h-4" /> },
          ],
        };

      case ROLES.DISTRICT:
        return {
          sectionTitle: 'District Administration',
          items: [
            { to: '/dashboard/district', label: 'District Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { to: '/tracker', label: 'Projects', icon: <GitBranch className="w-4 h-4" /> },
            { to: '/financials', label: 'Expenditure', icon: <BarChart3 className="w-4 h-4" /> },
            {
              to: '/alerts',
              label: 'Risk / Anomaly Alerts',
              icon: <ShieldAlert className="w-4 h-4" />,
              badge: highAlertCount > 0 ? highAlertCount : null,
              badgeColor: 'bg-red-500 text-white',
            },
            { to: '/predictive', label: 'Predictive Insights', icon: <TrendingUp className="w-4 h-4" /> },
            { to: '/reports', label: 'Reports', icon: <FileCheck2 className="w-4 h-4" /> },
          ],
        };

      case ROLES.STATE:
        return {
          sectionTitle: 'State Nodal Operations',
          items: [
            { to: '/dashboard/state', label: 'State Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { to: '/tracker', label: 'Projects', icon: <GitBranch className="w-4 h-4" /> },
            { to: '/financials', label: 'Expenditure Analytics', icon: <BarChart3 className="w-4 h-4" /> },
            {
              to: '/alerts',
              label: 'Risk/Anomaly Analysis',
              icon: <ShieldAlert className="w-4 h-4" />,
              badge: highAlertCount > 0 ? highAlertCount : null,
              badgeColor: 'bg-red-500 text-white',
            },
            { to: '/predictive', label: 'ML Insights', icon: <TrendingUp className="w-4 h-4" /> },
            { to: '/reports', label: 'Reports', icon: <FileCheck2 className="w-4 h-4" /> },
          ],
        };

      case ROLES.MINISTRY:
        return {
          sectionTitle: 'National Apex Desk',
          items: [
            { to: '/dashboard/ministry', label: 'National Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
            { to: '/tracker', label: 'Project Monitoring', icon: <GitBranch className="w-4 h-4" /> },
            { to: '/financials', label: 'Expenditure Trends', icon: <BarChart3 className="w-4 h-4" /> },
            { to: '/predictive', label: 'Predictive Insights', icon: <TrendingUp className="w-4 h-4" /> },
            {
              to: '/alerts',
              label: 'Anomaly / Fraud Risk',
              icon: <ShieldAlert className="w-4 h-4" />,
              badge: highAlertCount > 0 ? highAlertCount : null,
              badgeColor: 'bg-red-500 text-white',
            },
            { to: '/reports', label: 'Reports', icon: <FileCheck2 className="w-4 h-4" /> },
          ],
        };

      case ROLES.ADMIN:
        return {
          sectionTitle: 'System & Security Control',
          items: [
            { to: '/admin?tab=users', label: 'Users', icon: <Users className="w-4 h-4" /> },
            { to: '/admin?tab=roles', label: 'Roles & Permissions', icon: <Shield className="w-4 h-4" /> },
            { to: '/admin?tab=config', label: 'System Configuration', icon: <Sliders className="w-4 h-4" /> },
            { to: '/admin?tab=model', label: 'ML Observability', icon: <Cpu className="w-4 h-4" /> },
            { to: '/admin?tab=logs', label: 'Audit Ledger', icon: <History className="w-4 h-4" /> },
          ],
        };

      default:
        return {
          sectionTitle: 'Scheme Navigation',
          items: [
            { to: '/', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
            { to: '/alerts', label: 'Alerts', icon: <ShieldAlert className="w-4 h-4" /> },
            { to: '/financials', label: 'Financials', icon: <BarChart3 className="w-4 h-4" /> },
            { to: '/tracker', label: 'Tracker', icon: <GitBranch className="w-4 h-4" /> },
            { to: '/reports', label: 'Reports', icon: <FileCheck2 className="w-4 h-4" /> },
          ],
        };
    }
  };

  const navConfig = getNavItems();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-[61px] left-0 z-40 h-screen lg:h-[calc(100vh-61px)] w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-transform duration-300 ease-in-out no-print ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top: Active Role Scope Badge */}
        <div className="p-4 space-y-2 overflow-y-auto">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${roleMeta.badgeColor}`}>
                {currentRole}
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Authorized
              </span>
            </div>
            <div className="mt-1.5 text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
              {currentUser.name}
            </div>
            <div className="text-[10px] text-slate-500 truncate">
              {currentUser.jurisdiction}
            </div>
          </div>

          <div className="px-3 pt-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            {navConfig.sectionTitle}
          </div>

          {/* Dynamic Navigation Items */}
          <div className="space-y-1">
            {navConfig.items.map((item) => {
              const itemPath = item.to.split('?')[0];
              const itemSearch = item.to.includes('?') ? item.to.split('?')[1] : '';
              const isCurrent =
                itemSearch
                  ? location.pathname === itemPath && location.search.includes(itemSearch)
                  : location.pathname === itemPath && (!location.search || itemPath !== '/admin');

              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isCurrent
                      ? 'bg-gov-blue text-white shadow-sm dark:bg-blue-700'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span>{item.icon}</span>
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.badgeColor || 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Bottom Security & AI Card */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-md">
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[11px] font-bold font-mono">RBAC Security Gateway</span>
            </div>
            <p className="text-[10px] text-slate-300 leading-tight">
              API Level Scope Validation Active. Cross-jurisdiction requests blocked.
            </p>
          </div>

          <div className="text-[11px] text-slate-700 dark:text-slate-300 px-1 flex items-center justify-between">
            <span className="font-semibold text-slate-700 dark:text-slate-300">MoSPI MPLADS</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">2026</span>
          </div>
        </div>
      </aside>
    </>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default Sidebar;
