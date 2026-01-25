import React, { Fragment } from 'react';
import AppointmentCard from '../molecules/AppointmentCard';

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
        <div className="upcoming-list-view animate-in">
            <section className="card p-0 overflow-hidden border-slate-200 shadow-sm transition-all">
                {loading ? (
                    <div className="p-8 text-center text-muted">{t('loading')}</div>
                ) : upcoming.length === 0 ? (
                    <div className="text-center p-12 bg-white">
                        <p className="text-muted m-0">{t('no_upcoming_appointments') || 'No hay próximos turnos.'}</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 p-4">
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
                                        <div className="flex items-center gap-3 mt-4 mb-2 first:mt-0">
                                            <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded">
                                                {headerDate}
                                            </span>
                                            <div className="h-[1px] flex-1 bg-gradient-to-r from-indigo-100 to-transparent"></div>
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
