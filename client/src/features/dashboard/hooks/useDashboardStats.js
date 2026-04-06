import { useState } from 'react';
import api from '../../../api/axios';

export const useDashboardStats = () => {
    const [doctors, setDoctors] = useState([]);
    const [stats, setStats] = useState(null);
    const [newPatientStats, setNewPatientStats] = useState(null);
    const [pendingReqCount, setPendingReqCount] = useState(0);
    const [activeTab, setActiveTab] = useState('requirements');

    const fetchStats = async () => {
        try {
            const res = await api.get('/users/stats');
            setStats(res.data);
        } catch (err) {
            console.error("Failed to fetch stats", err);
        }
    };

    const fetchDoctors = async () => {
        try {
            const res = await api.get('/users/doctors');
            setDoctors(res.data);
        } catch (err) {
            console.error("Failed to fetch doctors", err);
        }
    };

    const fetchNewPatientStats = async () => {
        try {
            const res = await api.get('/users/patients/stats/new');
            setNewPatientStats({
                current_new: 0,
                currentDay: 0,
                currentWeek: 0,
                currentMonth: 0,
                currentYear: 0,
                lastYear: 0,
                ...res.data
            });
        } catch (err) {
            console.error("Failed to fetch new patient stats", err);
            setNewPatientStats({ current_new: 0, currentDay: 0, currentWeek: 0, currentMonth: 0, currentYear: 0, lastYear: 0 });
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await api.get('/medical/requests');
            const pending = res.data.filter(r => r.status === 'pending').length;
            setPendingReqCount(pending);
        } catch (err) {
            console.error("Failed to fetch requests", err);
        }
    };

    return {
        stats,
        newPatientStats,
        pendingReqCount,
        doctors,
        activeTab,
        setActiveTab,
        fetchStats,
        fetchDoctors,
        fetchNewPatientStats,
        fetchRequests
    };
};
