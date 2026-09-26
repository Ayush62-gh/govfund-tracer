/**
 * Simulated Backend API Layer with Role-Based Access Control (RBAC) Enforcement
 * Enforces token authentication, role validation, ownership/scope checks, and HTTP status codes (401, 403, 404, 200).
 */

import {
  MOCK_WORKS,
  MOCK_ALERTS,
  MOCK_KPIS,
  MOCK_AUDIT_LOGS,
  MOCK_USERS,
  MOCK_STATE_DATA,
  MOCK_SYSTEM_CONFIG,
  USER_CREDENTIALS,
} from '../data/mockData';

import {
  ROLES,
  PERMISSIONS,
  hasPermission,
  checkProjectScope,
  checkAlertScope,
} from './rbacService';

// In-memory data storage (simulating backend database state)
let dbWorks = [...MOCK_WORKS];
let dbAlerts = [...MOCK_ALERTS];
let dbAuditLogs = [...MOCK_AUDIT_LOGS];
let dbUsers = { ...MOCK_USERS };
let dbSystemConfig = { ...(MOCK_SYSTEM_CONFIG || {
  sessionTimeoutMinutes: 30,
  auditLogRetentionDays: 365,
  aiConfidenceThreshold: 85,
  mandatoryGeotagRadiusMeters: 50,
  ssoEnabled: true,
  twoFactorRequired: true,
  autoClawbackMonths: 24,
}) };

/**
 * Standard API Response Envelope
 */
class ApiResponse {
  constructor(status, data = null, error = null) {
    this.status = status;
    this.data = data;
    this.error = error;
    this.ok = status >= 200 && status < 300;
  }
}

/**
 * Helper to simulate network latency
 */
const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Extract active authenticated user from context/token
 */
const getAuthUser = (userSession) => {
  if (!userSession || !userSession.isAuthenticated) {
    return null;
  }
  return userSession.currentUser;
};

/**
 * Log unauthorized access attempt to security audit ledger
 */
const logSecurityViolation = (user, resource, action, reason) => {
  const timestampStr = new Date().toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + ' IST';

  const logEntry = {
    id: `SEC-LOG-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: timestampStr,
    user: user ? `${user.email} (${user.name})` : 'Anonymous / Unauthenticated',
    role: user?.roleName || 'Unknown',
    action: `BLOCKED 403 FORBIDDEN: Attempted ${action} on [${resource}] - ${reason}`,
    ip: '10.45.12.' + Math.floor(10 + Math.random() * 89),
    status: 'SECURITY_VIOLATION_BLOCKED',
    hash: `sha256:sec_${Math.random().toString(36).substring(2, 12)}`,
  };

  dbAuditLogs.unshift(logEntry);
};

export const api = {
  // ==========================================
  // PROJECTS / WORKS API
  // ==========================================

  /**
   * GET /api/projects
   * Returns works scoped strictly to caller's role and jurisdiction
   */
  async getProjects(session) {
    await delay();
    const user = getAuthUser(session);
    if (!user) {
      return new ApiResponse(401, null, {
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please login with your government credentials.',
      });
    }

    // Filter projects strictly by user scope
    const scopedProjects = dbWorks.filter((work) => checkProjectScope(user, work));
    return new ApiResponse(200, scopedProjects);
  },

  /**
   * GET /api/projects/:id
   * Validates scope before returning project details. Rejects cross-district/MP queries with 403.
   */
  async getProjectById(session, projectId) {
    await delay();
    const user = getAuthUser(session);
    if (!user) {
      return new ApiResponse(401, null, {
        code: 'UNAUTHORIZED',
        message: 'Authentication token is invalid or expired.',
      });
    }

    const project = dbWorks.find((w) => w.id === projectId);
    if (!project) {
      return new ApiResponse(404, null, {
        code: 'NOT_FOUND',
        message: `Project record with ID ${projectId} was not found.`,
      });
    }

    // Verify ownership and jurisdiction scope
    const isAuthorized = checkProjectScope(user, project);
    if (!isAuthorized) {
      const reason = `User role [${user.role.toUpperCase()}] scoped to [${user.jurisdiction}] cannot access project in [${project.district}, ${project.state}]`;
      logSecurityViolation(user, projectId, 'GET_PROJECT', reason);
      
      return new ApiResponse(403, null, {
        code: 'ACCESS_DENIED',
        message: `403 Forbidden: You do not have permission to access project ${projectId}. Your jurisdiction is limited to ${user.jurisdiction}.`,
        userJurisdiction: user.jurisdiction,
        requiredJurisdiction: `${project.district}, ${project.state}`,
      });
    }

    return new ApiResponse(200, project);
  },

  /**
   * POST /api/projects/:id/verify-photo
   * Only District Authority can approve physical milestone inspection
   */
  async verifyProjectPhoto(session, projectId, verificationData) {
    await delay();
    const user = getAuthUser(session);
    if (!user) {
      return new ApiResponse(401, null, { code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    // Role permission check
    if (!hasPermission(user.role, PERMISSIONS.APPROVE_MILESTONES)) {
      logSecurityViolation(user, projectId, 'APPROVE_MILESTONE', 'Role lacks APPROVE_MILESTONES permission');
      return new ApiResponse(403, null, {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: `403 Forbidden: Only District Authority / DM is authorized to certify physical milestone verification.`,
      });
    }

    const project = dbWorks.find((w) => w.id === projectId);
    if (!project) {
      return new ApiResponse(404, null, { code: 'NOT_FOUND', message: 'Project not found.' });
    }

    // Scope check
    if (!checkProjectScope(user, project)) {
      logSecurityViolation(user, projectId, 'APPROVE_MILESTONE', 'Cross-district milestone approval blocked');
      return new ApiResponse(403, null, {
        code: 'ACCESS_DENIED',
        message: `403 Forbidden: You cannot certify works belonging to district [${project.district}].`,
      });
    }

    // Apply update
    dbWorks = dbWorks.map((w) =>
      w.id === projectId
        ? { ...w, tamperVerified: true, geotagMatch: true, lastVerifiedBy: user.name, lastVerifiedAt: new Date().toISOString() }
        : w
    );

    return new ApiResponse(200, { success: true, message: `Milestone photo verified for project ${projectId}` });
  },

  // ==========================================
  // ALERTS & ANOMALIES API
  // ==========================================

  /**
   * GET /api/alerts
   */
  async getAlerts(session) {
    await delay();
    const user = getAuthUser(session);
    if (!user) {
      return new ApiResponse(401, null, { code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    const scopedAlerts = dbAlerts.filter((alert) => checkAlertScope(user, alert));
    return new ApiResponse(200, scopedAlerts);
  },

  /**
   * GET /api/alerts/:id
   */
  async getAlertById(session, alertId) {
    await delay();
    const user = getAuthUser(session);
    if (!user) {
      return new ApiResponse(401, null, { code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    const alert = dbAlerts.find((a) => a.id === alertId);
    if (!alert) {
      return new ApiResponse(404, null, { code: 'NOT_FOUND', message: `Alert ${alertId} not found.` });
    }

    if (!checkAlertScope(user, alert)) {
      logSecurityViolation(user, alertId, 'GET_ALERT', 'Alert out of jurisdiction');
      return new ApiResponse(403, null, {
        code: 'ACCESS_DENIED',
        message: `403 Forbidden: You do not have permission to access alert ${alertId}.`,
      });
    }

    return new ApiResponse(200, alert);
  },

  /**
   * POST /api/alerts/:id/action
   */
  async takeAlertAction(session, alertId, actionType, note = '') {
    await delay();
    const user = getAuthUser(session);
    if (!user) {
      return new ApiResponse(401, null, { code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    // Check action permission
    if (!hasPermission(user.role, PERMISSIONS.TAKE_ALERT_ACTION)) {
      logSecurityViolation(user, alertId, 'TAKE_ALERT_ACTION', 'Role not permitted to triage alerts');
      return new ApiResponse(403, null, {
        code: 'INSUFFICIENT_PERMISSIONS',
        message: '403 Forbidden: Your role is not permitted to triage or resolve vigilance alerts.',
      });
    }

    const alert = dbAlerts.find((a) => a.id === alertId);
    if (!alert) {
      return new ApiResponse(404, null, { code: 'NOT_FOUND', message: 'Alert not found.' });
    }

    if (!checkAlertScope(user, alert)) {
      logSecurityViolation(user, alertId, 'TAKE_ALERT_ACTION', 'Cross-jurisdiction alert modification blocked');
      return new ApiResponse(403, null, {
        code: 'ACCESS_DENIED',
        message: `403 Forbidden: Cannot modify alert for ${alert.district}, ${alert.state}.`,
      });
    }

    const statusMap = {
      reviewed: 'inReview',
      escalated: 'escalated',
      clarification: 'inReview',
      resolved: 'resolved',
    };

    const actionTextMap = {
      reviewed: 'Marked Reviewed by Authority',
      escalated: 'Escalated to Vigilance & Anti-Corruption Wing',
      clarification: 'Clarification Note Issued to Implementing Agency',
      resolved: 'Marked Compliant & Audit Query Closed',
    };

    const newStatus = statusMap[actionType] || 'inReview';
    const timestampStr = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' IST';

    let updatedAlertObj = null;
    dbAlerts = dbAlerts.map((a) => {
      if (a.id === alertId) {
        const updatedAudit = [
          {
            timestamp: timestampStr,
            user: `${user.email} (${user.name})`,
            action: `${actionTextMap[actionType]}${note ? ` - Note: "${note}"` : ''}`,
          },
          ...(a.auditTrail || []),
        ];
        updatedAlertObj = {
          ...a,
          status: newStatus,
          auditTrail: updatedAudit,
        };
        return updatedAlertObj;
      }
      return a;
    });

    // Record in global audit ledger
    const newLog = {
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: timestampStr,
      user: `${user.email} (${user.name})`,
      role: user.roleName,
      action: `${actionTextMap[actionType]} for [${alertId}]`,
      ip: '10.45.12.' + Math.floor(10 + Math.random() * 89),
      status: 'SUCCESS',
      hash: `sha256:${Math.random().toString(36).substring(2, 12)}...`,
    };
    dbAuditLogs.unshift(newLog);

    return new ApiResponse(200, updatedAlertObj);
  },

  // ==========================================
  // KPIS & ANALYTICS API
  // ==========================================

  /**
   * GET /api/kpis
   * Calculates KPI metrics strictly tailored to user's scope
   */
  async getKpis(session) {
    await delay();
    const user = getAuthUser(session);
    if (!user) {
      return new ApiResponse(401, null, { code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    const scopedWorks = dbWorks.filter((w) => checkProjectScope(user, w));
    const scopedAlerts = dbAlerts.filter((a) => checkAlertScope(user, a));

    // Derive metrics
    const totalSanctioned = scopedWorks.reduce((sum, w) => sum + (w.sanctionedAmount || 0), 0);
    const totalUtilized = scopedWorks.reduce((sum, w) => sum + (w.utilizedAmount || 0), 0);
    const unutilizedBalance = Math.max(0, totalSanctioned - totalUtilized);
    const utilizationRate = totalSanctioned > 0 ? ((totalUtilized / totalSanctioned) * 100).toFixed(1) : 0;
    const flaggedHighCount = scopedAlerts.filter((a) => a.riskLevel === 'high' && a.status !== 'resolved').length;
    const flaggedMediumCount = scopedAlerts.filter((a) => a.riskLevel === 'medium' && a.status !== 'resolved').length;
    const delayRiskWorks = scopedWorks.filter((w) => w.stage === 'delayed').length;

    // Use preset template enriched with computed figures
    const preset = MOCK_KPIS[user.role] || MOCK_KPIS.mp;
    const enrichedKpi = {
      ...preset,
      totalWorksCount: scopedWorks.length > 0 ? scopedWorks.length : preset.totalWorksCount,
      flaggedHighCount: scopedAlerts.length > 0 ? flaggedHighCount : preset.flaggedHighCount,
      delayRiskWorks: scopedWorks.length > 0 ? delayRiskWorks : preset.delayRiskWorks,
    };

    return new ApiResponse(200, enrichedKpi);
  },

  // ==========================================
  // USER MANAGEMENT & ROLE GOVERNANCE (ADMIN ONLY)
  // ==========================================

  /**
   * GET /api/users
   */
  async getUsers(session) {
    await delay();
    const user = getAuthUser(session);
    if (!user) {
      return new ApiResponse(401, null, { code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    if (!hasPermission(user.role, PERMISSIONS.MANAGE_USERS)) {
      logSecurityViolation(user, '/api/users', 'GET_USERS', 'Non-admin attempted to access user list');
      return new ApiResponse(403, null, {
        code: 'ACCESS_DENIED',
        message: '403 Forbidden: Only System Administrators can access and manage user credentials.',
      });
    }

    return new ApiResponse(200, Object.values(dbUsers));
  },

  /**
   * POST /api/users
   */
  async createUser(session, newUser) {
    await delay();
    const user = getAuthUser(session);
    if (!user || !hasPermission(user.role, PERMISSIONS.MANAGE_USERS)) {
      return new ApiResponse(403, null, {
        code: 'ACCESS_DENIED',
        message: '403 Forbidden: User creation is restricted to System Administrators.',
      });
    }

    const userId = `USR-${newUser.role.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const createdUser = {
      ...newUser,
      id: userId,
      status: 'active',
      createdAt: new Date().toISOString(),
      avatar: newUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    };

    dbUsers[userId] = createdUser;

    // Log admin action
    dbAuditLogs.unshift({
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('en-IN') + ' IST',
      user: `${user.email} (${user.name})`,
      role: 'System Administrator',
      action: `Created new user [${createdUser.name}] with role [${createdUser.roleName}]`,
      ip: '10.45.12.50',
      status: 'SUCCESS',
      hash: `sha256:${Math.random().toString(36).substring(2, 12)}`,
    });

    return new ApiResponse(201, createdUser);
  },

  /**
   * PATCH /api/users/:id/status
   */
  async toggleUserStatus(session, targetUserId, newStatus) {
    await delay();
    const user = getAuthUser(session);
    if (!user || !hasPermission(user.role, PERMISSIONS.MANAGE_USERS)) {
      return new ApiResponse(403, null, {
        code: 'ACCESS_DENIED',
        message: '403 Forbidden: Role modification is restricted to System Administrators.',
      });
    }

    if (dbUsers[targetUserId]) {
      dbUsers[targetUserId] = { ...dbUsers[targetUserId], status: newStatus };
      
      dbAuditLogs.unshift({
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleString('en-IN') + ' IST',
        user: `${user.email} (${user.name})`,
        role: 'System Administrator',
        action: `Updated user [${targetUserId}] status to [${newStatus.toUpperCase()}]`,
        ip: '10.45.12.50',
        status: 'SUCCESS',
        hash: `sha256:${Math.random().toString(36).substring(2, 12)}`,
      });

      return new ApiResponse(200, dbUsers[targetUserId]);
    }

    return new ApiResponse(404, null, { code: 'NOT_FOUND', message: 'User not found.' });
  },

  // ==========================================
  // SYSTEM CONFIGURATION (ADMIN ONLY)
  // ==========================================

  /**
   * GET /api/system/config
   */
  async getSystemConfig(session) {
    await delay();
    const user = getAuthUser(session);
    if (!user || !hasPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return new ApiResponse(403, null, {
        code: 'ACCESS_DENIED',
        message: '403 Forbidden: System Configuration is restricted to System Administrators.',
      });
    }
    return new ApiResponse(200, dbSystemConfig);
  },

  /**
   * PUT /api/system/config
   */
  async updateSystemConfig(session, updatedConfig) {
    await delay();
    const user = getAuthUser(session);
    if (!user || !hasPermission(user.role, PERMISSIONS.MANAGE_SYSTEM_CONFIG)) {
      return new ApiResponse(403, null, {
        code: 'ACCESS_DENIED',
        message: '403 Forbidden: Updating System Configuration requires System Administrator credentials.',
      });
    }

    dbSystemConfig = { ...dbSystemConfig, ...updatedConfig };

    dbAuditLogs.unshift({
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('en-IN') + ' IST',
      user: `${user.email} (${user.name})`,
      role: 'System Administrator',
      action: `Updated System Configuration Parameters`,
      ip: '10.45.12.50',
      status: 'SUCCESS',
      hash: `sha256:${Math.random().toString(36).substring(2, 12)}`,
    });

    return new ApiResponse(200, dbSystemConfig);
  },

  // ==========================================
  // AUDIT LOGS & SECURITY LEDGER
  // ==========================================

  /**
   * GET /api/audit-logs
   */
  async getAuditLogs(session) {
    await delay();
    const user = getAuthUser(session);
    if (!user) {
      return new ApiResponse(401, null, { code: 'UNAUTHORIZED', message: 'Authentication required.' });
    }

    if (!hasPermission(user.role, PERMISSIONS.VIEW_AUDIT_LOGS)) {
      logSecurityViolation(user, '/api/audit-logs', 'GET_AUDIT_LOGS', 'Role lacks audit logs permission');
      return new ApiResponse(403, null, {
        code: 'ACCESS_DENIED',
        message: '403 Forbidden: Audit logs are restricted to System Administrators and Ministry Apex Officers.',
      });
    }

    return new ApiResponse(200, dbAuditLogs);
  },

  // ==========================================
  // AUTHENTICATION ENDPOINT
  // ==========================================

  /**
   * POST /api/auth/login
   * Verifies email + password + selectedRole against the credential store.
   *
   * Security guarantee:
   *   The frontend-selected role is NOT trusted. The backend independently
   *   looks up the user's actual stored role and rejects any mismatch.
   *   This prevents privilege-escalation via role-selection tampering.
   *
   * @param {string} email         - User-entered email / NIC ID
   * @param {string} password      - User-entered plain-text password
   * @param {string} selectedRole  - Role claimed by frontend selection
   * @returns {ApiResponse}
   *   200 → { userKey, user, token }
   *   401 → INVALID_CREDENTIALS (email not found or wrong password)
   *   403 → ROLE_MISMATCH (email/password correct but role doesn't match)
   *   403 → ACCOUNT_SUSPENDED
   */
  async authenticateUser(email, password, selectedRole, selectedState = '') {
    await delay(600); // simulate realistic auth latency

    const normalizedEmail = (email || '').trim().toLowerCase();
    const credential = USER_CREDENTIALS[normalizedEmail];

    // Step 1: Check if the email exists in the credential store
    if (!credential) {
      // Vague error — do NOT reveal whether the email exists
      return new ApiResponse(401, null, {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email / User ID or password. Please check your credentials and try again.',
      });
    }

    // Step 2: Verify password (in production: bcrypt.compare)
    if (credential.password !== password) {
      dbAuditLogs.unshift({
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleString('en-IN') + ' IST',
        user: normalizedEmail,
        role: 'Unknown',
        action: `FAILED LOGIN ATTEMPT — Wrong password for [${normalizedEmail}]`,
        ip: '10.45.12.' + Math.floor(10 + Math.random() * 89),
        status: 'SECURITY_VIOLATION_BLOCKED',
        hash: `sha256:${Math.random().toString(36).substring(2, 12)}`,
      });
      return new ApiResponse(401, null, {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email / User ID or password. Please check your credentials and try again.',
      });
    }

    // Step 3: Cross-verify role — frontend selection is NEVER trusted alone.
    if (credential.role !== selectedRole) {
      dbAuditLogs.unshift({
        id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        timestamp: new Date().toLocaleString('en-IN') + ' IST',
        user: normalizedEmail,
        role: `Claimed: ${selectedRole}, Actual: ${credential.role}`,
        action: `ROLE MISMATCH BLOCKED — Claimed [${selectedRole.toUpperCase()}], actual [${credential.role.toUpperCase()}]`,
        ip: '10.45.12.' + Math.floor(10 + Math.random() * 89),
        status: 'SECURITY_VIOLATION_BLOCKED',
        hash: `sha256:${Math.random().toString(36).substring(2, 12)}`,
      });
      return new ApiResponse(403, null, {
        code: 'ROLE_MISMATCH',
        message: `Access Denied: Your account is not registered under the selected role. Please select the correct role for your account.`,
      });
    }

    // Step 3a: Cross-verify STATE for geographically-scoped roles.
    //
    // SECURITY REQUIREMENT (PS §3): The state/district shown on the login form
    // must NOT determine authorization on its own. The user's actual stored
    // state is the source of truth. We reject any login where the user selects
    // a state that does not match their stored account state.
    //
    // This prevents: UP SNA selecting "Rajasthan" on the form and authenticating
    // as a Rajasthan authority.
    //
    // Roles that require state verification: mp, district, state
    // Ministry has state = null (nationwide), no state check.
    const userObj = MOCK_USERS[credential.userKey];
    if (!userObj) {
      return new ApiResponse(403, null, {
        code: 'ACCOUNT_NOT_FOUND',
        message: 'Account record not found. Contact NIC System Administrator.',
      });
    }

    const stateRequiredRoles = ['mp', 'district', 'state'];
    if (stateRequiredRoles.includes(credential.role) && userObj.state) {
      const normalizedSelected = (selectedState || '').trim().toLowerCase();
      const normalizedStored   = (userObj.state || '').trim().toLowerCase();

      if (!normalizedSelected) {
        return new ApiResponse(403, null, {
          code: 'STATE_REQUIRED',
          message: 'Please select your State to continue.',
        });
      }

      if (normalizedSelected !== normalizedStored) {
        dbAuditLogs.unshift({
          id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp: new Date().toLocaleString('en-IN') + ' IST',
          user: normalizedEmail,
          role: `${credential.role.toUpperCase()} — State: ${selectedState} (claimed) vs ${userObj.state} (actual)`,
          action: `STATE MISMATCH BLOCKED — User [${normalizedEmail}] selected state [${selectedState}] but account is registered for [${userObj.state}]. Login denied.`,
          ip: '10.45.12.' + Math.floor(10 + Math.random() * 89),
          status: 'SECURITY_VIOLATION_BLOCKED',
          hash: `sha256:${Math.random().toString(36).substring(2, 12)}`,
        });
        return new ApiResponse(403, null, {
          code: 'STATE_MISMATCH',
          message: `Access Denied: The selected state does not match your registered jurisdiction. Please select the correct state for your account.`,
          // Do NOT reveal the actual stored state — that would be a security leak
        });
      }
    }

    // Step 4: Check account status
    if (userObj.status === 'suspended' || userObj.status === 'inactive') {
      return new ApiResponse(403, null, {
        code: 'ACCOUNT_SUSPENDED',
        message: 'Your account has been suspended. Contact the NIC System Administrator.',
      });
    }

    // Step 5: Generate session token (simulated JWT-style)
    const token = `mplads_token_${credential.userKey}_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Log successful login with full scope context
    dbAuditLogs.unshift({
      id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toLocaleString('en-IN') + ' IST',
      user: `${normalizedEmail} (${userObj.name})`,
      role: userObj.roleName,
      action: `Successful login — Role: ${credential.role.toUpperCase()} | State: ${userObj.state || 'N/A'} | District: ${userObj.district || 'N/A'} | Session issued`,
      ip: '10.45.12.' + Math.floor(10 + Math.random() * 89),
      status: 'SUCCESS',
      hash: `sha256:${Math.random().toString(36).substring(2, 12)}`,
    });

    return new ApiResponse(200, {
      token,
      userKey: credential.userKey,
      user: userObj,
      role: credential.role,
      expiresAt: Date.now() + 8 * 60 * 60 * 1000, // 8-hour session
    });
  },
};

export default api;

