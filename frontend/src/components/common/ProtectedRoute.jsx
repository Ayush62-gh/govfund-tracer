import React from 'react';
import PropTypes from 'prop-types';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { hasPermission } from '../../services/rbacService';
import AccessDenied from './AccessDenied';

/**
 * ProtectedRoute Component
 * Enforces role-based access control and permissions on client routes.
 */
export const ProtectedRoute = ({ children, allowedRoles = [], requiredPermission = null }) => {
  const { isAuthenticated, currentUser, currentRole } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Role validation
  if (allowedRoles.length > 0 && !allowedRoles.includes(currentRole)) {
    return (
      <AccessDenied
        requiredRoles={allowedRoles}
        requiredPermission={requiredPermission}
        customMessage={`Your role as ${currentUser?.roleName || currentRole} does not have authorization to view this section.`}
      />
    );
  }

  // Granular permission check
  if (requiredPermission && !hasPermission(currentRole, requiredPermission)) {
    return (
      <AccessDenied
        requiredRoles={allowedRoles}
        requiredPermission={requiredPermission}
        customMessage={`Your account lacks the '${requiredPermission}' permission required for this module.`}
      />
    );
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  requiredPermission: PropTypes.string,
};

export default ProtectedRoute;
