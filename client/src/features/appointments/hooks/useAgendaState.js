import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getNow, parseDate } from '@/utils/core/dateUtils';

/**
 * useAgendaState
 * Manages the navigation and filtering state of the agenda.
 */
export const useAgendaState = (setViewDoctorId) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [selectedDate, setSelectedDate] = useState(
        location.state?.selectedDate ? parseDate(location.state.selectedDate) : getNow()
    );
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'calendar');
    const [showOutOfHours, setShowOutOfHours] = useState(false);

    const rescheduleAppt = location.state?.rescheduleAppt;
    const syncAppt = location.state?.syncAppt;

    const exitRescheduleMode = useCallback(() => 
        navigate(location.pathname, { replace: true, state: {} }), 
    [navigate, location.pathname]);

    // Handle initial state sync from router (reschedule/sync)
    useEffect(() => {
        if (rescheduleAppt || syncAppt) {
            const updates = {};
            if (rescheduleAppt) {
                updates.viewDoctorId = String(rescheduleAppt.doctor_id);
            } else if (syncAppt) {
                updates.viewDoctorId = String(syncAppt.doctor_id);
                updates.selectedDate = parseDate(syncAppt.appointment_date);
            }
            
            if (updates.viewDoctorId) setViewDoctorId(updates.viewDoctorId);
            if (updates.selectedDate) setSelectedDate(updates.selectedDate);
        }
    }, [rescheduleAppt, syncAppt, setViewDoctorId]);

    return {
        selectedDate,
        setSelectedDate,
        activeTab,
        setActiveTab,
        showOutOfHours,
        setShowOutOfHours,
        rescheduleAppt,
        syncAppt,
        exitRescheduleMode
    };
};
