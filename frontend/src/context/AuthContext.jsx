import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { MOCK_USERS } from '../data/mockData';
import { api } from '../services/api';
import {
  ROLES,
  hasPermission as rbacHasPermission,
  checkProjectScope,
  checkAlertScope,
} from '../services/rbacService';

const AuthContext = createContext(null);

/** Role → dashboard base path mapping */
export const ROLE_DASHBOARD_PATH = {
  [ROLES.MP]:       '/dashboard/mp',
  [ROLES.DISTRICT]: '/dashboard/district',
  [ROLES.STATE]:    '/dashboard/state',
  [ROLES.MINISTRY]: '/dashboard/ministry',
  [ROLES.ADMIN]:    '/dashboard/admin',
};

/**
 * Restore session from localStorage on page reload.
 * Returns null if token is absent, expired, or corrupted.
 */
const restoreSession = () => {
  try {
    const token      = localStorage.getItem('mplads_token');
    const userKey    = localStorage.getItem('mplads_user_key');
    const expiresAt  = Number(localStorage.getItem('mplads_expires_at') || 0);

    if (!token || !userKey) return null;
    if (Date.now() > expiresAt) {
      localStorage.removeItem('mplads_token');
      localStorage.removeItem('mplads_user_key');
      localStorage.removeItem('mplads_expires_at');
      return null;
    }
    const user = MOCK_USERS[userKey];
    if (!user) return null;
    return { token, userKey, user, role: user.role, expiresAt };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(() => restoreSession());

  const isAuthenticated = !!session;
  const currentUser     = session?.user || null;
  const currentUserKey  = session?.userKey || null;
  const currentRole     = currentUser?.role || null;

  // Persist session to localStorage whenever it changes
  useEffect(() => {
    if (session) {
      localStorage.setItem('mplads_token',      session.token);
      localStorage.setItem('mplads_user_key',   session.userKey);
      localStorage.setItem('mplads_expires_at', String(session.expiresAt || Date.now() + 8 * 3600000));
      localStorage.setItem('mplads_role',       session.user?.role || '');
      localStorage.setItem('mplads_auth',       'true');
    } else {
      localStorage.removeItem('mplads_token');
      localStorage.removeItem('mplads_user_key');
      localStorage.removeItem('mplads_expires_at');
      localStorage.setItem('mplads_auth', 'false');
    }
  }, [session]);

  /**
   * Credential-based login via api.authenticateUser().
   * Backend enforces a 4-step security check:
   *   1. Email lookup
   *   2. Password verify
   *   3. Role cross-check    (frontend-selected role vs stored role)
   *   3a. State cross-check  (frontend-selected state vs stored state)
   *   4. Account status
   *
   * @param {string} email          - Government email / NIC User ID
   * @param {string} password       - User password
   * @param {string} selectedRole   - Role claimed on the login form
   * @param {string} selectedState  - State selected on the login form
   * @returns {{ ok, error?, code?, dashboardPath? }}
   */
  const login = useCallback(async (email, password, selectedRole, selectedState = '') => {
    const res = await api.authenticateUser(email, password, selectedRole, selectedState);

    if (!res.ok) {
      return {
        ok: false,
        code: res.error?.code || 'AUTH_ERROR',
        error: res.error?.message || 'Authentication failed. Please try again.',
      };
    }

    const { token, userKey, user, role, expiresAt } = res.data;
    setSession({ token, userKey, user, role, expiresAt });

    return {
      ok: true,
      role,
      dashboardPath: ROLE_DASHBOARD_PATH[role] || '/',
    };
  }, []);

  /**
   * Logout — clears all session state and localStorage
   */
  const logout = useCallback(() => {
    setSession(null);
  }, []);

  /**
   * Developer quick-switch (used by Header role-switcher only)
   * Bypasses credential check — for demo/testing purposes.
   */
  const switchUser = useCallback((userKey) => {
    let user = MOCK_USERS[userKey];
    let resolvedKey = userKey;
    if (!user) {
      // Try matching by role string
      resolvedKey = Object.keys(MOCK_USERS).find(k => MOCK_USERS[k].role === userKey);
      user = MOCK_USERS[resolvedKey];
    }
    if (!user) return;
    setSession({
      token: `mplads_dev_${resolvedKey}_${Date.now()}`,
      userKey: resolvedKey,
      user,
      role: user.role,
      expiresAt: Date.now() + 8 * 3600000,
    });
  }, []);

  const switchRole = switchUser; // legacy alias

  const hasPermission    = useCallback((perm)    => rbacHasPermission(currentRole, perm), [currentRole]);
  const canAccessProject = useCallback((project) => checkProjectScope(currentUser, project), [currentUser]);
  const canAccessAlert   = useCallback((alert)   => checkAlertScope(currentUser, alert), [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        currentUserKey,
        currentRole,
        session,
        login,
        logout,
        switchUser,
        switchRole,
        hasPermission,
        canAccessProject,
        canAccessAlert,
        availableUsers: MOCK_USERS,
        ROLE_DASHBOARD_PATH,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
