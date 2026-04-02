import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Guards
import ProtectedRoute from '../components/atoms/ProtectedRoute';

// Pages
// import Patients from '../pages/Patients'; // Deprecated
// All domain pages are now exported from their respective features.
// Only thin entry points or redirects should remain here if necessary.


// Features (Orchestrators)
import { AppointmentsPage } from '../features/appointments';
import { PatientsPage } from '../features/patients';
import { MedicalDocumentsPage } from '../features/medical_documents';
import { FinancesPage } from '../features/finances';
import { DashboardPage } from '../features/dashboard';
import { SystemConfigPage } from '../features/config';
import { InstitutionsPage } from '../features/institutions';
import { InsurancesPage } from '../features/insurances';
import { AdminUsersPage } from '../features/users';
import { AuditLogsPage } from '../features/reports';
import { RentalsPage } from '../features/rentals';
import { RequestsPage, PublicRequestPage } from '../features/medical_documents';
import { ChatPage } from '../features/chat';
import { TempAccessPage, LoginPage, RegisterPage, ProfilePage } from '../features/auth';
import { DoctorsPage } from '../features/doctors';
import { ReportsPage } from '../features/reports';

/**
 * AppRouter Component.
 * Pure Executor component that defines the routing tree.
 */
const AppRouter = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/patient-access/:token" element={<TempAccessPage />} />
            <Route path="/p/request-recipe/:token" element={<PublicRequestPage />} />

            {/* Protected Dashboard Routes (Layout) */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/appointments" element={<AppointmentsPage />} />
                <Route path="/rentals" element={<RentalsPage />} />
                <Route path="/documents" element={<MedicalDocumentsPage />} />
                <Route path="/finances" element={<FinancesPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/patients" element={<PatientsPage />} />
                <Route path="/doctors" element={<DoctorsPage />} />
                <Route path="/logs" element={<AuditLogsPage />} />
                <Route path="/admin/users" element={<AdminUsersPage />} />
                <Route path="/config" element={<SystemConfigPage />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/messages" element={<ChatPage />} />
                <Route path="/insurances" element={<InsurancesPage />} />
                <Route path="/institutions" element={<InstitutionsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
            </Route>


            {/* 404 Redirect */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
    );
};

export default AppRouter;
