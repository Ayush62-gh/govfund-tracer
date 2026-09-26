import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import { triggerCelebration } from '../utils/exportUtils';
import { MOCK_KPIS } from '../data/mockData';

const DataContext = createContext(null);

export const DataProvider = ({ children }) => {
  const { currentRole, currentUser, isAuthenticated } = useAuth();
  const session = { isAuthenticated, currentUser, currentRole };

  const [alerts, setAlerts] = useState([]);
  const [works, setWorks] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [roleKpis, setRoleKpis] = useState(MOCK_KPIS[currentRole] || MOCK_KPIS.mp);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [lastSecurityEvent, setLastSecurityEvent] = useState(null);

  // Simulated notifications
  const [notifications, setNotifications] = useState([
    {
      id: 'NOTIF-1',
      title: 'Critical Anomaly Flagged',
      desc: 'Solar Water Plant Cholapur: 51.5% cost overrun without tech sanction.',
      time: '10m ago',
      priority: 'high',
      read: false,
      alertId: 'ALT-2026-8901',
    },
    {
      id: 'NOTIF-2',
      title: 'Duplicate Work Alert',
      desc: 'Interlocking Brick Paving matches State PWD project within 45m radius.',
      time: '2h ago',
      priority: 'high',
      read: false,
      alertId: 'ALT-2026-8902',
    },
    {
      id: 'NOTIF-3',
      title: 'Quarterly Utilization Target Met',
      desc: 'Varanasi district achieved 86.4% fund utilization for Q4 FY25-26.',
      time: '1d ago',
      priority: 'low',
      read: true,
    },
  ]);

  const showToast = useCallback((message, type = 'success') => {
    setToastMessage({ message, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  }, []);

  /**
   * Fetch scoped data through API layer
   */
  const loadScopedData = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);

    try {
      const [worksRes, alertsRes, kpisRes, logsRes] = await Promise.all([
        api.getProjects(session),
        api.getAlerts(session),
        api.getKpis(session),
        api.getAuditLogs(session),
      ]);

      if (worksRes.ok) setWorks(worksRes.data || []);
      if (alertsRes.ok) setAlerts(alertsRes.data || []);
      if (kpisRes.ok) setRoleKpis(kpisRes.data || MOCK_KPIS[currentRole] || MOCK_KPIS.mp);
      if (logsRes.ok) setAuditLogs(logsRes.data || []);
    } catch (err) {
      console.error('API Query Exception:', err);
      showToast('Failed to sync data from secure API gateway', 'warning');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser?.id, currentRole]);

  useEffect(() => {
    loadScopedData();
  }, [loadScopedData]);

  /**
   * Action: Update alert status and log audit trail via API
   */
  const handleAlertAction = async (alertId, actionType, note = '') => {
    const res = await api.takeAlertAction(session, alertId, actionType, note);
    if (!res.ok) {
      showToast(res.error?.message || 'Access Denied: You cannot take action on this alert.', 'warning');
      setLastSecurityEvent({
        type: 'BLOCKED_ACTION',
        message: res.error?.message,
        timestamp: new Date().toISOString(),
      });
      return false;
    }

    // Refresh scoped alerts and audit ledger
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? res.data : a)));
    if (selectedAlert && selectedAlert.id === alertId) {
      setSelectedAlert(res.data);
    }

    const logsRes = await api.getAuditLogs(session);
    if (logsRes.ok) setAuditLogs(logsRes.data);

    triggerCelebration();
    showToast(`Alert [${alertId}] action recorded in audit ledger`);
    return true;
  };

  /**
   * Action: Verify milestone site photo via API
   */
  const handleVerifyPhoto = async (projectId) => {
    const res = await api.verifyProjectPhoto(session, projectId, {});
    if (!res.ok) {
      showToast(res.error?.message || 'Unauthorized: Only District Authority can approve site inspection photos.', 'warning');
      setLastSecurityEvent({
        type: 'BLOCKED_VERIFICATION',
        message: res.error?.message,
        timestamp: new Date().toISOString(),
      });
      return false;
    }

    // Update in state
    setWorks((prev) =>
      prev.map((w) => (w.id === projectId ? { ...w, tamperVerified: true, geotagMatch: true } : w))
    );
    showToast(`Physical Milestone Certificate approved for ${projectId}`);
    return true;
  };

  /**
   * Simulated ID Tampering / Unauthorized Scope Test
   * Demonstrates backend API scope validation when a user attempts to query an unauthorized project ID
   */
  const testIdTampering = async (unauthorizedProjectId = 'WRK-BR-PAT-0115') => {
    showToast(`Simulating forged API request: GET /api/projects/${unauthorizedProjectId}...`, 'info');
    const res = await api.getProjectById(session, unauthorizedProjectId);

    if (!res.ok && res.status === 403) {
      showToast(`Security Shield: ${res.error.message}`, 'warning');
      setLastSecurityEvent({
        type: 'ID_TAMPERING_BLOCKED',
        attemptedId: unauthorizedProjectId,
        message: res.error.message,
        timestamp: new Date().toISOString(),
      });
      // Refresh audit logs to display new violation entry
      const logsRes = await api.getAuditLogs(session);
      if (logsRes.ok) setAuditLogs(logsRes.data);
      return res;
    }

    return res;
  };

  /**
   * Run Simulated AI Model Diagnostics across active works
   */
  const runAiDiagnostics = () => {
    setIsAiRunning(true);
    showToast('AI Anomaly Engine running inference on authorized works...', 'info');

    setTimeout(() => {
      setIsAiRunning(false);
      showToast('AI Diagnostic Scan complete. 0 new critical breaches found.', 'success');
      triggerCelebration();
    }, 1800);
  };

  /**
   * Dismiss notification
   */
  const markNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <DataContext.Provider
      value={{
        alerts,
        works,
        auditLogs,
        isLoading,
        setIsLoading,
        selectedAlert,
        setSelectedAlert,
        handleAlertAction,
        handleVerifyPhoto,
        testIdTampering,
        lastSecurityEvent,
        isAiRunning,
        runAiDiagnostics,
        notifications,
        markNotificationRead,
        toastMessage,
        showToast,
        roleKpis,
        refreshData: loadScopedData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

DataProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export default DataContext;
