import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/api/axios';
import { useAuth } from '@/features/auth';
import { useModal } from '@/context/ModalContext';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useFetch } from '@/hooks/useFetch';
import { useSearch } from '@/hooks/useSearch';

/**
 * Builds the edit-modal initialData from a doctor record.
 * Pure function so the seeding logic is unit-testable without rendering the
 * controller hook.
 *
 * @param {object} doc doctor record
 * @returns {object} modal initialData
 */
export const buildDoctorInitialData = (doc) => ({
    id: doc.id,
    specialty: doc.specialty || '',
    cbu: doc.cbu || '',
    bio: doc.bio || '',
    office_number: doc.office_number || '',
    rental_type: doc.rental_type || 'monthly',
    rental_cost: doc.rental_cost || 0,
    consultation_price: doc.consultation_price || 0,
    prescription_price: doc.prescription_price || 0,
    medical_license_price: doc.medical_license_price || 0,
    certificate_price: doc.certificate_price || 0,
    virtual_consultation_price: doc.virtual_consultation_price || 0,
    appointment_duration: doc.appointment_duration || 60,
    break_duration: doc.break_duration || 0,
    default_visit_interval_days: doc.default_visit_interval_days || 0,
    default_prescription_interval_days: doc.default_prescription_interval_days || 0,
    overturn_start_time: doc.overturn_start_time || '08:00:00',
    overturn_end_time: doc.overturn_end_time || '21:00:00',
    force_hour_alignment: doc.force_hour_alignment === 1 || doc.force_hour_alignment === true,
    afip_cuit: doc.afip_cuit || '',
    afip_pto_vta: doc.afip_pto_vta || 1,
    afip_enabled: doc.afip_enabled === 1 || doc.afip_enabled === true,
    reminder_template: doc.reminder_template || '',
    confirmation_template: doc.confirmation_template || '',
    reminder_virtual_template: doc.reminder_virtual_template || '',
    confirmation_virtual_template: doc.confirmation_virtual_template || ''
});

export const useDoctorsPageController = () => {
    const { t } = useLanguage();
    const { user: currentUser } = useAuth();
    const { showMessage } = useMessage();
    const { confirm } = useModal();
    const { searchTerm, setSearchTerm } = useSearch();

    // Data State using useFetch
    const { data: docData, loading: doctorsLoading, refetch: fetchDoctors } = useFetch('/users/doctors', { 
        initialData: { success: true, data: { doctors: [], totalCount: 0 } } 
    });

    const doctors = useMemo(() => docData?.data?.doctors || docData?.doctors || [], [docData]);
    const { data: settings = {}, loading: settingsLoading } = useFetch('/settings', { initialData: {} });

    // Unified Modal State: type = 'EDIT'
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: 'EDIT', // 'EDIT' or 'CREATE'
        activeTab: 'tariffs', // 'tariffs', 'schedule', 'google'
        connected: false,
        loadingGoogle: false,
        loadingSchedule: false,
        schedule: [],
        data: {}
    });

    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const status = searchParams.get('status');
        if (status === 'success') {
            showMessage(t('google_connect_success'), 'success');
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('status');
                return next;
            });
        } else if (status === 'error') {
            showMessage(t('google_connect_error'), 'error');
            setSearchParams((prev) => {
                const next = new URLSearchParams(prev);
                next.delete('status');
                return next;
            });
        }
    }, [searchParams, setSearchParams, showMessage, t]);

    const checkGoogleStatus = async (doctorId) => {
        setModalState(prev => ({ ...prev, loadingGoogle: true }));
        try {
            const res = await api.get(`/google/status?doctorId=${doctorId}`);
            setModalState(prev => ({ ...prev, connected: res.data.connected, loadingGoogle: false }));
        } catch (err) {
            console.error(err);
            setModalState(prev => ({ ...prev, connected: false, loadingGoogle: false }));
        }
    };

    const fetchSchedule = async (doctorId) => {
        setModalState(prev => ({ ...prev, loadingSchedule: true }));
        try {
            const res = await api.get(`/schedules/${doctorId}`);
            setModalState(prev => ({ ...prev, schedule: Array.isArray(res.data) ? res.data : [], loadingSchedule: false }));
        } catch (err) {
            console.error("Failed to load schedule", err);
            setModalState(prev => ({ ...prev, schedule: [], loadingSchedule: false }));
        }
    };

    const handleEditClick = (doc) => {
        if (!doc) {
            setModalState({
                isOpen: true,
                type: 'CREATE',
                activeTab: 'tariffs',
                connected: false,
                loadingGoogle: false,
                loadingSchedule: false,
                schedule: [],
                data: {
                    username: '',
                    password: '',
                    role: 'doctor',
                    full_name: '',
                    dni: '',
                    specialty: '',
                    phoneNumbers: [{ phone_number: '+549', label: '', is_primary: true }]
                }
            });
            return;
        }
        const initialData = buildDoctorInitialData(doc);

        setModalState({
            isOpen: true,
            type: 'EDIT',
            activeTab: 'tariffs',
            connected: false,
            loadingGoogle: false,
            loadingSchedule: false,
            schedule: [],
            data: initialData
        });

        checkGoogleStatus(doc.id);
        fetchSchedule(doc.id);
    };

    const handleSaveDoctor = async () => {
        const { type, data, schedule } = modalState;
        try {
            if (type === 'CREATE') {
                await api.post('/users/admin/users', {
                    ...data,
                    fullName: data.full_name, // Backend expects fullName
                });
                showMessage(t('doctor_created'), "success");
            } else {
                await Promise.all([
                    api.put(`/users/doctors/${data.id}`, data),
                    api.put(`/schedules/${data.id}`, { schedule })
                ]);
                showMessage(t('doctor_updated'), "success");
            }
            setModalState(prev => ({ ...prev, isOpen: false }));
            window.dispatchEvent(new CustomEvent('doctors-updated'));
            fetchDoctors();
        } catch (err) {
            console.error("Failed to update doctor", err);
            showMessage(err.response?.data?.message || t('error_update'), "error");
        }
    };

    const handleConnectGoogle = async () => {
        try {
            const res = await api.get(`/google/auth-url?doctorId=${modalState.data.id}`);
            window.location.href = res.data.url;
        } catch (err) {
            console.error("Failed to initiate Google connection", err);
            showMessage(t('google_connect_failed'), 'error');
        }
    };

    const handleDisconnectGoogle = async () => {
        if (!await confirm(t('google_disconnect_confirm'))) return;
        try {
            await api.post('/google/disconnect', { doctorId: modalState.data.id });
            setModalState(prev => ({ ...prev, connected: false }));
            window.dispatchEvent(new CustomEvent('doctors-updated'));
            showMessage(t('google_disconnected'), 'success');
        } catch (err) {
            console.error(err);
        }
    };

    const filteredDoctors = useMemo(() => {
        const term = searchTerm.toLowerCase();
        return doctors.filter(d =>
            d.full_name?.toLowerCase().includes(term) ||
            d.specialty?.toLowerCase().includes(term) ||
            d.phone?.includes(term)
        );
    }, [doctors, searchTerm]);

    const setFormData = (newData) => setModalState(prev => ({
        ...prev,
        data: typeof newData === 'function'
            ? newData(prev.data)
            : { ...prev.data, ...newData }
    }));

    // Handlers mapped for cleaner component usage
    const handlers = {
        fetchDoctors,
        onEditDoctor: handleEditClick,
        onSaveDoctor: handleSaveDoctor,
        onCloseModal: () => setModalState(prev => ({ ...prev, isOpen: false })),
        onTabChange: (tab) => setModalState(prev => ({ ...prev, activeTab: tab })),
        onConnectGoogle: handleConnectGoogle,
        onDisconnectGoogle: handleDisconnectGoogle,
        onFormDataChange: setFormData,
        onScheduleChange: (s) => setModalState(prev => ({
            ...prev,
            schedule: typeof s === 'function' ? s(prev.schedule) : s
        })),
        onVerifyGoogleEvents: async () => {
            try {
                const res = await api.get(`/google/appointments?doctorId=${modalState.data.id}`);
                showMessage(t('calendar_events_found', { count: res.data.events?.length || 0 }), 'success');
            } catch (err) {
                console.error("Failed to verify Google events", err);
                showMessage(t('calendar_check_error'), 'error');
            }
        },
        onImportContacts: async () => {
            if (!await confirm(t('import_contacts_confirm'))) return;
            try {
                await api.post('/google/import', { doctorId: modalState.data.id });
                showMessage(t('import_success'), 'success');
            } catch (err) {
                console.error("Failed to import contacts", err);
                showMessage(t('import_error'), 'error');
            }
        },
        onResetSpreadsheet: async () => {
            if (!await confirm(t('reset_spreadsheet_confirm'))) return;
            try {
                await api.post('/google/reset-spreadsheet', { doctorId: modalState.data.id });
                window.dispatchEvent(new CustomEvent('doctors-updated'));
                showMessage(t('spreadsheet_reset_success'), 'success');
            } catch (e) {
                console.error(e);
                showMessage(t('spreadsheet_reset_error'), 'error');
            }
        }
    };

    return {
        doctors,
        loading: doctorsLoading || settingsLoading,
        searchTerm, setSearchTerm,
        settings,
        currentUser,
        filteredDoctors,
        modalState,
        handlers,
        t // pass translation helper
    };
};
