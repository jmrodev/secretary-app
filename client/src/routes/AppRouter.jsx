import { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout & Guards
import { ProtectedRoute } from '@/components/templates/ProtectedRoute';
import RoleGuard from '@/components/auth/RoleGuard';
import Loading from '@/components/atoms/Loading';

// Features (Orchestrators) - Lazy Loaded
// We use named exports for features, so we have to unwrap them in the lazy call.
const AppointmentsPage = lazy(() => import('@/features/appointments').then(m => ({ default: m.AppointmentsPage })));
const PatientsPage = lazy(() => import('@/features/patients').then(m => ({ default: m.PatientsPage })));
const MedicalDocumentsPage = lazy(() => import('@/features/medical_documents').then(m => ({ default: m.MedicalDocumentsPage })));
const RequestsView = lazy(() => import('@/features/medical_documents/pages/RequestsView').then(module => ({ default: module.RequestsView })));
const PrescriptionsView = lazy(() => import('@/features/medical_documents/pages/PrescriptionsView').then(module => ({ default: module.PrescriptionsView })));
const LicensesView = lazy(() => import('@/features/medical_documents/pages/LicensesView').then(module => ({ default: module.LicensesView })));
const CertificatesView = lazy(() => import('@/features/medical_documents/pages/CertificatesView').then(module => ({ default: module.CertificatesView })));

const FinancesPage = lazy(() => import('@/features/finances').then(m => ({ default: m.FinancesPage })));
const DashboardPage = lazy(() => import('@/features/dashboard').then(m => ({ default: m.DashboardPage })));
const SystemConfigPage = lazy(() => import('@/features/config').then(m => ({ default: m.SystemConfigPage })));
const InstitutionsPage = lazy(() => import('@/features/institutions').then(m => ({ default: m.InstitutionsPage })));
const InsurancesPage = lazy(() => import('@/features/insurances').then(m => ({ default: m.InsurancesPage })));
const AdminUsersPage = lazy(() => import('@/features/users').then(m => ({ default: m.AdminUsersPage })));
const AuditLogsPage = lazy(() => import('@/features/reports').then(m => ({ default: m.AuditLogsPage })));
const HolidaysPage = lazy(() => import('@/features/holidays').then(m => ({ default: m.HolidaysPage })));
const RentalsPage = lazy(() => import('@/features/rentals').then(m => ({ default: m.RentalsPage })));
const RequestsPage = lazy(() => import('@/features/medical_documents').then(m => ({ default: m.RequestsPage })));
const PublicRequestPage = lazy(() => import('@/features/medical_documents').then(m => ({ default: m.PublicRequestPage })));
const ChatPage = lazy(() => import('@/features/chat').then(m => ({ default: m.ChatPage })));
const WhatsappPage = lazy(() => import('@/features/whatsapp').then(m => ({ default: m.WhatsappPage })));
const OutreachPage = lazy(() => import('@/features/outreach').then(m => ({ default: m.OutreachPage })));
const TempAccessPage = lazy(() => import('@/features/auth').then(m => ({ default: m.TempAccessPage })));
const LoginPage = lazy(() => import('@/features/auth').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth').then(m => ({ default: m.RegisterPage })));
const ProfilePage = lazy(() => import('@/features/auth').then(m => ({ default: m.ProfilePage })));
const DoctorsPage = lazy(() => import('@/features/doctors').then(m => ({ default: m.DoctorsPage })));
const ReportsPage = lazy(() => import('@/features/reports').then(m => ({ default: m.ReportsPage })));

const DayCellPlayground = lazy(() => import('@/features/appointments/components/calendar/v2/DayCellPlayground').then(m => ({ default: m.DayCellPlayground })));

const PublicRegisterPage = lazy(() => import('@/features/patients').then(m => ({ default: m.PublicRegisterPage })));

/**
 * AppRouter Component.
 * Pure Executor component that defines the routing tree.
 */
export const AppRouter = () => {
    return (
        <Suspense fallback={<Loading variant="full-page" />}>
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/p/register" element={<PublicRegisterPage />} />
            <Route path="/patient-access/:token" element={<TempAccessPage />} />
            <Route path="/p/request-recipe/:token" element={<PublicRequestPage />} />
            <Route path="/test-components" element={<DayCellPlayground />} />

            {/* Protected Dashboard Routes (Layout) */}
            <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                
                <Route path="/appointments" element={
                    <RoleGuard allowedRoles={['doctor', 'secretary']}>
                        <AppointmentsPage />
                    </RoleGuard>
                } />

                <Route path="/patients" element={
                    <RoleGuard allowedRoles={['admin', 'secretary', 'doctor']}>
                        <PatientsPage />
                    </RoleGuard>
                } />

                <Route path="/finances" element={
                    <RoleGuard allowedRoles={['secretary']}>
                        <FinancesPage />
                    </RoleGuard>
                } />

                <Route path="/insurances" element={
                    <RoleGuard allowedRoles={['secretary']}>
                        <InsurancesPage />
                    </RoleGuard>
                } />

                <Route path="/admin/users" element={
                    <RoleGuard allowedRoles={['admin']}>
                        <AdminUsersPage />
                    </RoleGuard>
                } />

                <Route path="/logs" element={
                    <RoleGuard allowedRoles={['admin']}>
                        <AuditLogsPage />
                    </RoleGuard>
                } />

                <Route path="/config" element={
                    <RoleGuard allowedRoles={['admin', 'secretary']}>
                        <SystemConfigPage />
                    </RoleGuard>
                } />

                <Route path="/rentals" element={<RentalsPage />} />
                <Route path="/documents" element={<MedicalDocumentsPage />}>
                    <Route index element={<Navigate to="requests" replace />} />
                    <Route path="requests" element={<RequestsView />} />
                    <Route path="prescriptions" element={<PrescriptionsView />} />
                    <Route path="licenses" element={<LicensesView />} />
                    <Route path="certificates" element={<CertificatesView />} />
                </Route>
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/doctors" element={<DoctorsPage />} />
                <Route path="/holidays" element={
                    <RoleGuard allowedRoles={['admin', 'secretary']}>
                        <HolidaysPage />
                    </RoleGuard>
                } />
                <Route path="/institutions" element={<InstitutionsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/requests" element={<RequestsPage />} />
                <Route path="/messages" element={<ChatPage />} />
                <Route path="/whatsapp" element={
                    <RoleGuard allowedRoles={['admin', 'secretary']}>
                        <WhatsappPage />
                    </RoleGuard>
                } />
                <Route path="/outreach" element={
                    <RoleGuard allowedRoles={['secretary', 'doctor']}>
                        <OutreachPage />
                    </RoleGuard>
                } />
            </Route>


                {/* 404 Redirect */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </Suspense>
    );
};
