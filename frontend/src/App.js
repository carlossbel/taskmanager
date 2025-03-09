// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import LandingPage from './Pages/LandingPage/LandingPage';
import LoginPage from './Pages/LoginPage/LoginPage';
import RegisterPage from './Pages/RegisterPage/RegisterPage';
import DashboardPage from './Pages/Dashboard/Dashboardpage';
import UserManagementPage from './Pages/UserManagement/UserManagementPage';
import AdminDashboardPage from './Pages/AdminDashboard/AdminDashboardPage';
import AdminTasksPage from './Pages/AdminTasks/AdminTasksPage';
import AdminGroupsPage from './Pages/AdminGroups/AdminGroupsPage';
import MainLayout from './Layouts/MainLayout';
import AdminLayout from './Layouts/AdminLayout';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        {/* Regular User Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="tasks" element={<DashboardPage />} />
          <Route path="groups" element={<DashboardPage />} />
          <Route path="profile" element={<div>Perfil de Usuario (Por implementar)</div>} />
        </Route>
        
        {/* Admin Routes */}
        <Route path="/admin" element={
          <ProtectedRoute adminOnly={true}>
            <AdminLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="tasks" element={<AdminTasksPage />} />
          <Route path="groups" element={<AdminGroupsPage />} />
          <Route path="settings" element={<div>Configuración (Por implementar)</div>} />
        </Route>
        
        {/* Fallback for unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;