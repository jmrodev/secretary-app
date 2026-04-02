import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';

// Layout & UI
import ProtectedRoute from './components/atoms/ProtectedRoute';
import FloatingChat from './components/organisms/FloatingChat';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Appointments from './pages/Appointments';
import OfficeRentals from './pages/OfficeRentals';
import MedicalDocuments from './pages/MedicalDocuments';
import Finances from './pages/Finances';
import Profile from './pages/Profile';
import Patients from './pages/Patients';
import AuditLogs from './pages/AuditLogs';
import AdminUsers from './pages/AdminUsers';
import Doctors from './pages/Doctors';
import SystemConfig from './pages/SystemConfig';
import Requests from './pages/Requests';
import Insurances from './pages/Insurances';
import Institutions from './pages/Institutions';
import Reports from './pages/Reports';
import TempAccess from './pages/TempAccess';
import PublicPrescriptionRequest from './pages/PublicPrescriptionRequest';

/**
 * Main Application Component.
 * Orchestrates routing and global UI elements.
 */
function App() {
  useEffect(() => {
    // Visual indicator for Development Mode
    if (import.meta.env.DEV) {
      document.body.classList.add('dev-mode');
    } else {
      document.body.classList.remove('dev-mode');
    }
  }, []);

  return (
    <>
      {/* Global Toast notifications from library */}
      <Toaster position="top-right" containerStyle={{ zIndex: 9999 }} />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/patient-access/:token" element={<TempAccess />} />
        <Route path="/p/request-recipe/:token" element={<PublicPrescriptionRequest />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
        <Route path="/rentals" element={<ProtectedRoute><OfficeRentals /></ProtectedRoute>} />
        <Route path="/documents" element={<ProtectedRoute><MedicalDocuments /></ProtectedRoute>} />
        <Route path="/finances" element={<ProtectedRoute><Finances /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/patients" element={<ProtectedRoute><Patients /></ProtectedRoute>} />
        <Route path="/doctors" element={<ProtectedRoute><Doctors /></ProtectedRoute>} />
        <Route path="/logs" element={<ProtectedRoute><AuditLogs /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute><AdminUsers /></ProtectedRoute>} />
        <Route path="/config" element={<ProtectedRoute><SystemConfig /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/insurances" element={<ProtectedRoute><Insurances /></ProtectedRoute>} />
        <Route path="/institutions" element={<ProtectedRoute><Institutions /></ProtectedRoute>} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />

        {/* 404 Redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Persistent UI overlays */}
      <FloatingChat />
    </>
  );
}

export default App;
