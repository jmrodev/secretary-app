import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Guards
import ProtectedRoute from '../components/atoms/ProtectedRoute';

// Pages
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Appointments from '../pages/Appointments';
import OfficeRentals from '../pages/OfficeRentals';
import MedicalDocuments from '../pages/MedicalDocuments';
import Finances from '../pages/Finances';
import Profile from '../pages/Profile';
import Patients from '../pages/Patients';
import AuditLogs from '../pages/AuditLogs';
import AdminUsers from '../pages/AdminUsers';
import Doctors from '../pages/Doctors';
import SystemConfig from '../pages/SystemConfig';
import Requests from '../pages/Requests';
import Insurances from '../pages/Insurances';
import Institutions from '../pages/Institutions';
import Reports from '../pages/Reports';
import TempAccess from '../pages/TempAccess';
import PublicPrescriptionRequest from '../pages/PublicPrescriptionRequest';

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
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/rentals" element={<OfficeRentals />} />
                <Route path="/documents" element={<MedicalDocuments />} />
                <Route path="/finances" element={<Finances />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/patients" element={<Patients />} />
                <Route path="/doctors" element={<Doctors />} />
                <Route path="/logs" element={<AuditLogs />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/config" element={<SystemConfig />} />
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
