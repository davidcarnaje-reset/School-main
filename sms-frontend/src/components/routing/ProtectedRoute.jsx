import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (window.isLoggingOut) {
    return null;
  }

  // If user does not exist, redirect to appropriate login page based on URL path
  if (!user) {
    const path = location.pathname.toLowerCase();
    if (path.startsWith('/student') || path.startsWith('/lms')) {
      return <Navigate to="/login" replace />;
    }
    if (path.startsWith('/admin')) {
      return <Navigate to="/portal/admin-access" replace />;
    }
    // Default for registrar, cashier, teacher, hr, custodian, it, school-admin, etc.
    return <Navigate to="/staff/login" replace />;
  }

  // If user exists, verify they have the allowed role
  const hasAccess = !allowedRoles || (
    Array.isArray(allowedRoles) ? allowedRoles.includes(user.role) : allowedRoles === user.role
  );

  if (!hasAccess) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ProtectedRoute;