/**
 * Role-Based Access Control (RBAC) Service
 * Implements granular roles, permissions, scopes, and validation policies for MPLADS e-Samiksha AI.
 */

export const ROLES = {
  MP: 'mp',
  DISTRICT: 'district',
  STATE: 'state',
  MINISTRY: 'ministry',
  ADMIN: 'admin',
};

export const PERMISSIONS = {
  // Project & Works
  VIEW_OWN_PROJECTS: 'view_own_projects',
  VIEW_DISTRICT_PROJECTS: 'view_district_projects',
  VIEW_STATE_PROJECTS: 'view_state_projects',
  VIEW_NATIONAL_PROJECTS: 'view_national_projects',
  MANAGE_DISTRICT_WORKS: 'manage_district_works',
  APPROVE_MILESTONES: 'approve_milestones',
  
  // Financial Analytics
  VIEW_OWN_FINANCIALS: 'view_own_financials',
  VIEW_DISTRICT_FINANCIALS: 'view_district_financials',
  VIEW_STATE_FINANCIALS: 'view_state_financials',
  VIEW_NATIONAL_FINANCIALS: 'view_national_financials',

  // Alerts & Anomalies
  VIEW_OWN_ALERTS: 'view_own_alerts',
  VIEW_DISTRICT_ALERTS: 'view_district_alerts',
  VIEW_STATE_ALERTS: 'view_state_alerts',
  VIEW_NATIONAL_ALERTS: 'view_national_alerts',
  TAKE_ALERT_ACTION: 'take_alert_action',
  ESCALATE_TO_VIGILANCE: 'escalate_to_vigilance',

  // Reports
  GENERATE_REPORTS: 'generate_reports',
  SIGN_STATUTORY_REPORTS: 'sign_statutory_reports',

  // Administration & Governance
  MANAGE_USERS: 'manage_users',
  MANAGE_ROLES_PERMISSIONS: 'manage_roles_permissions',
  MANAGE_SYSTEM_CONFIG: 'manage_system_config',
  VIEW_AUDIT_LOGS: 'view_audit_logs',
  VIEW_ML_OBSERVABILITY: 'view_ml_observability',
  TRIGGER_ML_RETRAIN: 'trigger_ml_retrain',
};

export const ROLE_PERMISSIONS = {
  [ROLES.MP]: [
    PERMISSIONS.VIEW_OWN_PROJECTS,
    PERMISSIONS.VIEW_OWN_FINANCIALS,
    PERMISSIONS.VIEW_OWN_ALERTS,
    PERMISSIONS.GENERATE_REPORTS,
  ],
  [ROLES.DISTRICT]: [
    PERMISSIONS.VIEW_OWN_PROJECTS,
    PERMISSIONS.VIEW_DISTRICT_PROJECTS,
    PERMISSIONS.MANAGE_DISTRICT_WORKS,
    PERMISSIONS.APPROVE_MILESTONES,
    PERMISSIONS.VIEW_DISTRICT_FINANCIALS,
    PERMISSIONS.VIEW_DISTRICT_ALERTS,
    PERMISSIONS.TAKE_ALERT_ACTION,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.SIGN_STATUTORY_REPORTS,
  ],
  [ROLES.STATE]: [
    PERMISSIONS.VIEW_OWN_PROJECTS,
    PERMISSIONS.VIEW_DISTRICT_PROJECTS,
    PERMISSIONS.VIEW_STATE_PROJECTS,
    PERMISSIONS.VIEW_STATE_FINANCIALS,
    PERMISSIONS.VIEW_STATE_ALERTS,
    PERMISSIONS.TAKE_ALERT_ACTION,
    PERMISSIONS.ESCALATE_TO_VIGILANCE,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.SIGN_STATUTORY_REPORTS,
  ],
  [ROLES.MINISTRY]: [
    PERMISSIONS.VIEW_OWN_PROJECTS,
    PERMISSIONS.VIEW_DISTRICT_PROJECTS,
    PERMISSIONS.VIEW_STATE_PROJECTS,
    PERMISSIONS.VIEW_NATIONAL_PROJECTS,
    PERMISSIONS.VIEW_NATIONAL_FINANCIALS,
    PERMISSIONS.VIEW_NATIONAL_ALERTS,
    PERMISSIONS.TAKE_ALERT_ACTION,
    PERMISSIONS.ESCALATE_TO_VIGILANCE,
    PERMISSIONS.GENERATE_REPORTS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_ML_OBSERVABILITY,
  ],
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES_PERMISSIONS,
    PERMISSIONS.MANAGE_SYSTEM_CONFIG,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.VIEW_ML_OBSERVABILITY,
    PERMISSIONS.TRIGGER_ML_RETRAIN,
  ],
};

export const ROLE_DEFINITIONS = [
  {
    role: ROLES.MP,
    name: 'Member of Parliament (Lok Sabha / Rajya Sabha)',
    badgeColor: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
    scopeDescription: 'Strictly restricted to projects, expenditure, alerts, and reports within their elected constituency.',
    dashboardType: 'MP Constituency Cockpit',
    canAlterFinancials: false,
    canManageUsers: false,
  },
  {
    role: ROLES.DISTRICT,
    name: 'District Authority / District Magistrate',
    badgeColor: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
    scopeDescription: 'Autonomous monitoring and execution oversight of all works within their assigned district.',
    dashboardType: 'District Collectorate Cockpit',
    canAlterFinancials: true,
    canManageUsers: false,
  },
  {
    role: ROLES.STATE,
    name: 'State Nodal Authority (SNA)',
    badgeColor: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
    scopeDescription: 'Consolidated oversight of all districts, state-level fund flows, duplicate detection, and vigilance.',
    dashboardType: 'State Nodal Authority Cockpit',
    canAlterFinancials: false,
    canManageUsers: false,
  },
  {
    role: ROLES.MINISTRY,
    name: 'Ministry / MoSPI Apex Officer',
    badgeColor: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300',
    scopeDescription: 'Pan-India macro oversight, nationwide anomaly trends, state rankings, and fiscal policy monitoring.',
    dashboardType: 'National Pan-India Cockpit',
    canAlterFinancials: false,
    canManageUsers: false,
  },
  {
    role: ROLES.ADMIN,
    name: 'System Administrator (NIC Cloud)',
    badgeColor: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
    scopeDescription: 'User access governance, RBAC role assignment, system configuration, and ML model observability.',
    dashboardType: 'NIC Operations & Governance Center',
    canAlterFinancials: false,
    canManageUsers: true,
  },
];

/**
 * Check if a role has a given permission
 */
export const hasPermission = (role, permission) => {
  if (!role || !ROLE_PERMISSIONS[role]) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
};

/**
 * Check if a user has access to a specific project based on role and scope
 */
export const checkProjectScope = (user, project) => {
  if (!user || !project) return false;

  const role = user.role;

  // Ministry has nationwide access
  if (role === ROLES.MINISTRY) return true;

  // Admin has read access for technical inspection if required, but cannot modify
  if (role === ROLES.ADMIN) return true;

  // State Authority check
  if (role === ROLES.STATE) {
    if (!user.state) return false;
    return project.state?.toLowerCase().trim() === user.state.toLowerCase().trim();
  }

  // District Authority check
  if (role === ROLES.DISTRICT) {
    if (!user.district) return false;
    return project.district?.toLowerCase().trim() === user.district.toLowerCase().trim();
  }

  // MP check: matches MP ID or constituency
  if (role === ROLES.MP) {
    if (project.mpId && user.id && project.mpId === user.id) return true;
    if (user.constituency && project.constituency) {
      return project.constituency.toLowerCase().includes(user.constituency.toLowerCase().split(' ')[0]);
    }
    if (user.constituency && project.district) {
      return project.district.toLowerCase().includes(user.constituency.toLowerCase().split(' ')[0]);
    }
    return false;
  }

  return false;
};

/**
 * Check if a user has access to a specific alert
 */
export const checkAlertScope = (user, alert) => {
  if (!user || !alert) return false;

  const role = user.role;
  if (role === ROLES.MINISTRY || role === ROLES.ADMIN) return true;

  if (role === ROLES.STATE) {
    if (!user.state) return false;
    return alert.state?.toLowerCase().trim() === user.state.toLowerCase().trim();
  }

  if (role === ROLES.DISTRICT) {
    if (!user.district) return false;
    return alert.district?.toLowerCase().trim() === user.district.toLowerCase().trim();
  }

  if (role === ROLES.MP) {
    if (alert.mpId && user.id && alert.mpId === user.id) return true;
    if (user.constituency && alert.constituency) {
      return alert.constituency.toLowerCase().includes(user.constituency.toLowerCase().split(' ')[0]);
    }
    if (user.constituency && alert.district) {
      return alert.district.toLowerCase().includes(user.constituency.toLowerCase().split(' ')[0]);
    }
    return false;
  }

  return false;
};

/**
 * Get dynamic navigation configuration tailored to user's role
 */
export const getRoleNavigation = (role, unreadAlertCount = 0) => {
  switch (role) {
    case ROLES.MP:
      return {
        dashboardTitle: 'MP Constituency Dashboard',
        items: [
          { to: '/', label: 'My Projects', icon: 'LayoutDashboard' },
          { to: '/tracker', label: 'Project Progress', icon: 'GitBranch' },
          { to: '/financials', label: 'Fund Utilization', icon: 'BarChart3' },
          {
            to: '/alerts',
            label: 'Risk Alerts',
            icon: 'ShieldAlert',
            badge: unreadAlertCount > 0 ? unreadAlertCount : null,
            badgeColor: 'bg-red-500 text-white',
          },
          { to: '/reports', label: 'Reports', icon: 'FileCheck2' },
        ],
      };

    case ROLES.DISTRICT:
      return {
        dashboardTitle: 'District Planning Dashboard',
        items: [
          { to: '/', label: 'District Projects', icon: 'LayoutDashboard' },
          { to: '/financials', label: 'Expenditure', icon: 'BarChart3' },
          { to: '/tracker', label: 'Project Progress', icon: 'GitBranch' },
          {
            to: '/alerts',
            label: 'Risk/Anomaly Alerts',
            icon: 'ShieldAlert',
            badge: unreadAlertCount > 0 ? unreadAlertCount : null,
            badgeColor: 'bg-red-500 text-white',
          },
          { to: '/reports', label: 'Reports', icon: 'FileCheck2' },
        ],
      };

    case ROLES.STATE:
      return {
        dashboardTitle: 'State Nodal Authority Dashboard',
        items: [
          { to: '/', label: 'State Overview', icon: 'LayoutDashboard' },
          { to: '/districts', label: 'Districts', icon: 'Building' },
          { to: '/tracker', label: 'Projects', icon: 'GitBranch' },
          { to: '/financials', label: 'Expenditure Analytics', icon: 'BarChart3' },
          {
            to: '/alerts',
            label: 'Risk/Anomaly Analysis',
            icon: 'ShieldAlert',
            badge: unreadAlertCount > 0 ? unreadAlertCount : null,
            badgeColor: 'bg-red-500 text-white',
          },
          { to: '/reports', label: 'Reports', icon: 'FileCheck2' },
        ],
      };

    case ROLES.MINISTRY:
      return {
        dashboardTitle: 'Ministry Apex National Dashboard',
        items: [
          { to: '/', label: 'National Overview', icon: 'LayoutDashboard' },
          { to: '/states', label: 'State-wise Analytics', icon: 'Building' },
          { to: '/predictive', label: 'District-wise Analytics', icon: 'TrendingUp' },
          {
            to: '/alerts',
            label: 'Anomaly/Fraud Risk',
            icon: 'ShieldAlert',
            badge: unreadAlertCount > 0 ? unreadAlertCount : null,
            badgeColor: 'bg-red-500 text-white',
          },
          { to: '/financials', label: 'Expenditure Trends', icon: 'BarChart3' },
          { to: '/reports', label: 'Reports', icon: 'FileCheck2' },
        ],
      };

    case ROLES.ADMIN:
      return {
        dashboardTitle: 'System Administration Dashboard',
        items: [
          { to: '/admin?tab=users', label: 'Users', icon: 'Users' },
          { to: '/admin?tab=roles', label: 'Roles & Permissions', icon: 'Shield' },
          { to: '/admin?tab=config', label: 'System Configuration', icon: 'Sliders' },
          { to: '/admin?tab=model', label: 'ML Observability', icon: 'Cpu' },
          { to: '/admin?tab=logs', label: 'Audit Ledger', icon: 'History' },
        ],
      };

    default:
      return {
        dashboardTitle: 'Executive Dashboard',
        items: [
          { to: '/', label: 'Dashboard', icon: 'LayoutDashboard' },
          { to: '/alerts', label: 'Alerts', icon: 'ShieldAlert' },
          { to: '/financials', label: 'Financials', icon: 'BarChart3' },
          { to: '/tracker', label: 'Tracker', icon: 'GitBranch' },
          { to: '/reports', label: 'Reports', icon: 'FileCheck2' },
        ],
      };
  }
};
