import React, { Fragment } from 'react';
import AppointmentCard from '../molecules/AppointmentCard';
import './UpcomingAppointmentsView.css';

const UpcomingAppointmentsView = ({
    appointments,
    loading,
    t,
    onAction,
    onWhatsApp
}) => {
    const upcoming = appointments
        .filter(a => new Date(a.appointment_date) >= new Date().setHours(0, 0, 0, 0))
        .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

    return (
        <div className="upcoming-appointments-view">
            <section className="upcoming-appointments-view__container">
                {loading ? (
                    <div className="upcoming-appointments-view__loading">
                        <span>{t('loading')}</span>
                    </div>
                ) : upcoming.length === 0 ? (
                    <div className="upcoming-appointments-view__empty">
                        <p className="upcoming-appointments-view__empty-text">
                            {t('no_upcoming_appointments') || 'No hay próximos turnos.'}
                        </p>
                    </div>
                ) : (
                    <div className="upcoming-appointments-view__list">
                        {upcoming.map((a, index, arr) => {
                            const dateObj = new Date(a.appointment_date);
                            const dateStr = dateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
                            const isToday = dateObj.toLocaleDateString() === new Date().toLocaleDateString();
                            const headerDate = isToday ? `Hoy, ${dateStr}` : dateStr.charAt(0).toUpperCase() + dateStr.slice(1);

                            const prevDateObj = index > 0 ? new Date(arr[index - 1].appointment_date) : null;
                            const prevDateStr = prevDateObj ? prevDateObj.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }) : null;
                            const showHeader = index === 0 || dateStr !== prevDateStr;

                            return (
                                <Fragment key={a.id}>
                                    {showHeader && (
                                        <div className="upcoming-appointments-view__date-header">
                                            <span className="upcoming-appointments-view__date-text">
                                                {headerDate}
                                            </span>
                                            <div className="upcoming-appointments-view__divider"></div>
                                        </div>
                                    )}
                                    <AppointmentCard
                                        appt={a}
                                        onClick={() => onAction(a)}
                                        showActions={true}
                                        onWhatsAppAction={onWhatsApp}
                                    />
                                </Fragment>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default UpcomingAppointmentsView;
