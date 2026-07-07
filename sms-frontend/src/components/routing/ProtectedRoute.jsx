import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  // Strict check: if user does not exist, or their role is not in the allowed list
  const hasAccess = user && user.role && (
    !allowedRoles || 
    (Array.isArray(allowedRoles) ? allowedRoles.includes(user.role) : allowedRoles === user.role)
  );

  if (!hasAccess) {
    return <Navigate to="/portal/admin-access" replace />;
  }

  return children;
};

export default ProtectedRoute;