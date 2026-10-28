import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/auth/LoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { DoctorDashboardPage } from './pages/doctor/DoctorDashboardPage';
import { DoctorGetStartedPage } from './pages/doctor/DoctorGetStartedPage';

const RootRedirect: React.FC = () => {
  const { isAuthenticated, role, user } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (role === 'admin') {
    return <Navigate to="/admin" replace />;
  }
  if (role === 'doctor') {
    return <Navigate to={user?.isOnboarded ? '/doctor' : '/doctor/get-started'} replace />;
  }
  return <Navigate to="/login" replace />;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* Protected Admin Portal */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRole="admin">
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Doctor Initial Onboarding / Get Started Gate (Blocks further navigation until complete) */}
          <Route
            path="/doctor/get-started"
            element={
              <ProtectedRoute allowedRole="doctor" requireOnboarded={false}>
                <DoctorGetStartedPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Doctor Workstation (Requires completed initial onboarding) */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRole="doctor" requireOnboarded={true}>
                <DoctorDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Root Redirect based on session */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
