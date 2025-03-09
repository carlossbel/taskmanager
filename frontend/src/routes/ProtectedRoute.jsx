// src/routes/ProtectedRoute.jsx
import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import AuthService from '../services/authService';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const location = useLocation();
  const isAuthenticated = AuthService.isAuthenticated();
  const isAdmin = AuthService.isAdmin();
  
  useEffect(() => {
    console.log('ProtectedRoute check:', { isAuthenticated, adminOnly, isAdmin });
    
    if (!isAuthenticated) {
      message.error('Debes iniciar sesión para acceder a esta página');
      // Clear any leftover data
      AuthService.logout();
    } else if (adminOnly && !isAdmin) {
      message.error('No tienes permiso para acceder a esta página');
    }
  }, [isAuthenticated, adminOnly, isAdmin]);

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    // Redirect to dashboard if not admin
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;