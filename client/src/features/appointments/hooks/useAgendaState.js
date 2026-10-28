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

    const rescheduleAppt = location.state?.rescheduleAppt;
    const syncAppt = location.state?.syncAppt;

    const [selectedDate, setSelectedDate] = useState(() => {
        if (syncAppt) return parseDate(syncAppt.appointment_date);
        return location.state?.selectedDate ? parseDate(location.state.selectedDate) : getNow();
    });
    const [showOutOfHours, setShowOutOfHours] = useState(true);

    const exitRescheduleMode = useCallback(() => 
        navigate(location.pathname, { replace: true, state: {} }), 
    [navigate, location.pathname]);

    // Handle initial state sync from router (reschedule/sync/direct navigation)
    useEffect(() => {
        if (rescheduleAppt || syncAppt || location.state?.viewDoctorId) {
            const updates = {};
            if (rescheduleAppt) {
                updates.viewDoctorId = String(rescheduleAppt.doctor_id);
            } else if (syncAppt) {
                updates.viewDoctorId = String(syncAppt.doctor_id);
            } else if (location.state?.viewDoctorId) {
                updates.viewDoctorId = String(location.state.viewDoctorId);
            }
            
            if (updates.viewDoctorId) setViewDoctorId(updates.viewDoctorId);
        }

        if (location.state?.selectedDate) {
            setSelectedDate(parseDate(location.state.selectedDate));
        }
    }, [rescheduleAppt, syncAppt, location.state, setViewDoctorId, setSelectedDate]);

    return {
        selectedDate,
        setSelectedDate,
        showOutOfHours,
        setShowOutOfHours,
        rescheduleAppt,
        syncAppt,
        exitRescheduleMode
    };
};
