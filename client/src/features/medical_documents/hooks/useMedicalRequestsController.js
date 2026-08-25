import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/features/auth/AuthContext';
import { useMessage } from '@/context/MessageContext';
import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';
import { usePermissions } from '@/hooks/usePermissions';
import { useFetch } from '@/hooks/useFetch';
import { useSearch } from '@/hooks/useSearch';
import { useDoctors } from '@/context/DoctorContextDefinition';
import { useRequestHandlers } from './useRequestHandlers';

const unpack = (response, fallback = []) => response?.data || (Array.isArray(response) ? response : fallback);

export const useMedicalRequestsController = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const { confirm, doubleConfirm } = useModal();
    const { canDeleteRequest } = usePermissions();
    const { viewDoctorId } = useDoctors();
    const { searchTerm, setSearchTerm } = useSearch();

    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const [requestsPage, setRequestsPage] = useState(1);
    const [requestsLimit] = useState(25);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(searchTerm), 400);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    useEffect(() => {
        const t = setTimeout(() => setRequestsPage(1), 0);
        return () => clearTimeout(t);
            }, [debouncedSearch]);

    const { data: doctorsResponse = { success: true, data: [] } } = useFetch('/users/doctors', { 
        initialData: { success: true, data: [] } 
    });
    const doctors = useMemo(() => unpack(doctorsResponse), [doctorsResponse]);

    const requestsStatus = useMemo(() => {
        return ['pending', 'consult'];
    }, []);

    const { 
        data: reqResponse, 
        loading, 
        refetch: fetchRequests 
    } = useFetch('/medical/requests', {
        params: { page: requestsPage, limit: requestsLimit, status: requestsStatus, search: debouncedSearch || undefined, doctorId: viewDoctorId },
        initialData: { success: true, data: [], meta: { totalCount: 0 } }
    });

    const requests = useMemo(() => unpack(reqResponse), [reqResponse]);
    const requestsTotal = reqResponse?.meta?.totalCount || requests.length || 0;

    const [selectedPatient, setSelectedPatient] = useState('');
    const [selectedDoctor, _setSelectedDoctor] = useState(() => localStorage.getItem('last_selected_doctor_id') || '');
    const setSelectedDoctor = (id) => { _setSelectedDoctor(id); if (id) localStorage.setItem('last_selected_doctor_id', id); };
    const [selectedRequest, setSelectedRequest] = useState(null);

    const [actionModal, setActionModal] = useState({ open: false, type: '', id: null });
    const [actionNote, setActionNote] = useState('');
    const [paymentModal, setPaymentModal] = useState({ open: false, initialData: {} });

    const [requestEditData, setRequestEditData] = useState({ request_note: '', doctor_note: '' });

    const filterItem = (item) => {
        const term = String(searchTerm || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const normalizeText = (text) => text ? String(text).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
        return (
            normalizeText(item.patient_name).includes(term) ||
            normalizeText(item.doctor_name).includes(term) ||
            normalizeText(item.patient_dni).includes(term) ||
            normalizeText(item.type).includes(term)
        );
    };

    const handlers = useRequestHandlers({
        user, t, showMessage, confirm, doubleConfirm, canDeleteRequest,
        selectedPatient, selectedDoctor,
        selectedRequest, actionModal, actionNote, paymentModal, searchTerm,
        setIsEditing,
        setSelectedRequest, setRequestEditData, setActionModal, setPaymentModal,
        setActionNote, setRequestsPage, fetchRequests, filterItem
    });

    return {
        user, t, showMessage,
        searchTerm, setSearchTerm, isEditing, setIsEditing,
        requests, doctors,
        requestsPage, requestsTotal,
        requestsTotalPages: Math.ceil(requestsTotal / requestsLimit),
        selectedPatient, setSelectedPatient, selectedDoctor, setSelectedDoctor,
        selectedRequest, setSelectedRequest,
        actionModal, setActionModal, actionNote, setActionNote,
        paymentModal, setPaymentModal, requestEditData, setRequestEditData,
        loading, canDeleteRequest,
        handlers
    };
};
