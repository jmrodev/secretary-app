import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Guards
import ProtectedRoute from '../components/atoms/ProtectedRoute';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import OfficeRentals from '../pages/OfficeRentals';
import Profile from '../pages/Profile';
// import Patients from '../pages/Patients'; // Deprecated
import AuditLogs from '../pages/AuditLogs';
import AdminUsers from '../pages/AdminUsers';
import Doctors from '../pages/Doctors';
import Requests from '../pages/Requests';
import Insurances from '../pages/Insurances';
import Institutions from '../pages/Institutions';
import Reports from '../pages/Reports';
import TempAccess from '../pages/TempAccess';
import PublicPrescriptionRequest from '../pages/PublicPrescriptionRequest';

// Features (Orchestrators)
import { AppointmentsPage } from '../features/appointments';
import { PatientsPage } from '../features/patients';
import { MedicalDocumentsPage } from '../features/medical_documents';
import { FinancesPage } from '../features/finances';
import { DashboardPage } from '../features/dashboard';
import { SystemConfigPage } from '../features/config';

/**
 * AppRouter Component.
 * Pure Executor component that defines the routing tree.
 */
const AppRouter = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/patient-access/:token" element={<TempAccess />} />
            <Route path="/p/request-recipe/:token" element={<PublicPrescriptionRequest />} />

            {/* Protected Dashboard Routes (Layout) */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/rentals" element={<OfficeRentals />} />
                <Route path="/documents" element={<MedicalDocumentsPage />} />
                <Route path="/finances" element={<FinancesPage />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/patients" element={<PatientsPage />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/logs" element={<AuditLogs />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/config" element={<SystemConfigPage />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/insurances" element={<Insurances />} />
                <Route path="/institutions" element={<Institutions />} />
                <Route path="/reports" element={<Reports />} />
            </Route>

            {/* 404 Redirect */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRouter;
