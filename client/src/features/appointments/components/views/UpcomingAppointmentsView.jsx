import React from 'react';
import AppointmentCard from '../cards/AppointmentCard';
import Loading from '@/components/atoms/Loading';
import Icon from '@/components/atoms/Icon';
import { isPast, compareDates } from '@/utils/core/dateUtils';
import './UpcomingAppointmentsView.css';

/**
 * UpcomingAppointmentsView (Executor Component).
 * Renders a list of the upcoming/next appointments.
 */
const UpcomingAppointmentsView = ({ appointments, loading, t, onAction, onWhatsApp }) => {
    if (loading) return <Loading />;

    const upcoming = (appointments || [])
        .filter(a => !isPast(a.appointment_date))
        .sort((a, b) => compareDates(a.appointment_date, b.appointment_date));

    if (upcoming.length === 0) {
        return (
            <div className="upcoming-appointments-view__empty">
                <Icon name="event_busy" size="4rem" className="upcoming-appointments-view__empty-icon" />
                <h3 className="upcoming-appointments-view__empty-title">{t('no_upcoming_appointments')}</h3>
                <p className="upcoming-appointments-view__empty-hint">{t('no_upcoming_hint')}</p>
            </div>
        );
    }

    return (
        <div className="upcoming-appointments-view animate-fade-in">
            <h2 className="upcoming-appointments-view__title">
                <div className="upcoming-appointments-view__icon-wrapper">
                    <Icon name="upcoming" size="1.4rem" className="upcoming-appointments-view__icon" />
                </div>
                {t('next_appointments')}
            </h2>

            <div className="upcoming-appointments-view__grid">
                {upcoming.map(appt => (
                    <AppointmentCard
                        key={appt.id} appt={appt}
                        onClick={() => onAction(appt)}
                        showActions={true}
                        onWhatsAppAction={onWhatsApp}
                    />
                ))}
            </div>
        </div>
    );
};

export default UpcomingAppointmentsView;
