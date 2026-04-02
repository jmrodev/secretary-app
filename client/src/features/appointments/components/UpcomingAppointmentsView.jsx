import React from 'react';
import AppointmentCard from './AppointmentCard';
import Loading from '../../../components/atoms/Loading';
import Icon from '../../../components/atoms/Icon';

/**
 * UpcomingAppointmentsView (Executor Component).
 * Renders a list of the upcoming/next appointments.
 */
const UpcomingAppointmentsView = ({ appointments, loading, t, onAction, onWhatsApp }) => {
    if (loading) return <Loading />;

    const upcoming = appointments
        .filter(a => new Date(a.appointment_date) >= new Date())
        .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

    if (upcoming.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border-2 border-dashed border-slate-200">
                <Icon name="event_busy" size="4rem" className="text-slate-200 mb-6" />
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">{t('no_upcoming_appointments')}</h3>
                <p className="text-slate-400 font-bold mt-2">{t('no_upcoming_hint')}</p>
            </div>
        );
    }

    return (
        <div className="upcoming-appointments-view animate-fadeIn">
            <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                    <Icon name="upcoming" size="1.4rem" className="text-white" />
                </div>
                {t('next_appointments')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {upcoming.map(appt => (
                    <AppointmentCard
                        key={appt.id} appt={appt}
                        onClick={() => onAction(appt)}
                        onWhatsApp={() => onWhatsApp(appt)}
                    />
                ))}
            </div>
        </div>
    );
};

export default UpcomingAppointmentsView;
