import { useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * useAgendaState
 * Manages the navigation and filtering state of the agenda.
 */
export const useAgendaState = (setViewDoctorId) => {
    const location = useLocation();
    const navigate = useNavigate();

    const [selectedDate, setSelectedDate] = useState(
        location.state?.selectedDate ? new Date(location.state.selectedDate) : new Date()
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
        if (rescheduleAppt) {
            queueMicrotask(() => {
                // Only update if different to avoid loops
                setViewDoctorId(prev => {
                    const newId = String(rescheduleAppt.doctor_id);
                    return prev === newId ? prev : newId;
                });
            });
        } else if (syncAppt) {
            queueMicrotask(() => {
                setViewDoctorId(prev => {
                    const newId = String(syncAppt.doctor_id);
                    return prev === newId ? prev : newId;
                });
                setSelectedDate(new Date(syncAppt.appointment_date));
            });
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
