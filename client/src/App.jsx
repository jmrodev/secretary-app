import { Routes, Route, Navigate } from 'react-router-dom';
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
import Institutions from './pages/Institutions'; // [NEW]
import TempAccess from './pages/TempAccess'; // [NEW]

import FloatingChat from './components/organisms/FloatingChat';
import { useAuth } from './context/AuthContext';
import { useLanguage } from './context/LanguageContext';
import Button from './components/atoms/Button';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) return <div>{t('loading')}</div>;
  if (!user) return <Navigate to="/login" />;

  // Patients should not be able to access the management dashboard or other views
  if (user.role === 'patient') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-center">
        <div className="card max-w-md p-8 shadow-lg">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="title text-xl mb-4">Registro Completado</h2>
          <p className="text-main-600 mb-6">
            Tu información ha sido recibida correctamente.
            <br /><br />
            Esta sección es de uso administrativo. Si necesitas realizar otra gestión, por favor utiliza el enlace enviado a tu dispositivo o escanea el QR en el consultorio.
          </p>
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
          >
            Cerrar Sesión
          </Button>
        </div>
      </div>
    );
  }

  return children;
};

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <>
      <Toaster position="top-right" containerStyle={{ zIndex: 9999 }} />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/appointments" element={
          <ProtectedRoute>
            <Appointments />
          </ProtectedRoute>
        } />
        <Route path="/rentals" element={
          <ProtectedRoute>
            <OfficeRentals />
          </ProtectedRoute>
        } />
        <Route path="/documents" element={
          <ProtectedRoute>
            <MedicalDocuments />
          </ProtectedRoute>
        } />
        <Route path="/finances" element={
          <ProtectedRoute>
            <Finances />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/patients" element={
          <ProtectedRoute>
            <Patients />
          </ProtectedRoute>
        } />
        <Route path="/doctors" element={
          <ProtectedRoute>
            <Doctors />
          </ProtectedRoute>
        } />
        <Route path="/logs" element={
          <ProtectedRoute>
            <AuditLogs />
          </ProtectedRoute>
        } />
        <Route path="/admin/users" element={
          <ProtectedRoute>
            <AdminUsers />
          </ProtectedRoute>
        } />
        <Route path="/config" element={
          <ProtectedRoute>
            <SystemConfig />
          </ProtectedRoute>
        } />
        <Route path="/requests" element={
          <ProtectedRoute>
            <Requests />
          </ProtectedRoute>
        } />
        <Route path="/insurances" element={
          <ProtectedRoute>
            <Insurances />
          </ProtectedRoute>
        } />
        <Route path="/institutions" element={
          <ProtectedRoute>
            <Institutions />
          </ProtectedRoute>
        } />
        <Route path="/patient-access/:token" element={<TempAccess />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      <FloatingChat />
    </>
  );
}

export default App;
