import React from 'react';
import Icon from '../../../components/atoms/Icon';
import Button from '../../../components/atoms/Button';
import Loading from '../../../components/atoms/Loading';
import AppointmentCard from './AppointmentCard';

/**
 * PatientHistoryView (Executor Component).
 * Renders the appointment history for a specific patient.
 */
const PatientHistoryView = ({ patientAppointments, loading, onClose, t, searchPatientId, handlers }) => {
    if (loading) return <Loading />;
    if (!patientAppointments || patientAppointments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-10 bg-white rounded-xl border border-slate-200">
                <Icon name="history_off" size="3rem" className="text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-800">{t('no_history_found')}</h3>
                <Button onClick={onClose} variant="ghost" className="mt-4">{t('back')}</Button>
            </div>
        );
    }

    const patientName = patientAppointments[0]?.patient_name || 'Paciente';

    return (
        <div className="patient-history-view animate-fadeIn">
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">{t('history_of')}: {patientName}</h2>
                    <p className="text-slate-500 font-semibold">{t('total_appointments')}: {patientAppointments.length}</p>
                </div>
                <Button onClick={onClose} variant="secondary" outline icon={<Icon name="arrow_back" size="1.1rem" />}>
                    {t('back')}
                </Button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patientAppointments.map(appt => (
                    <AppointmentCard
                        key={appt.id} appt={appt}
                        onClick={() => handlers.handleOpenAction(appt)}
                    />
                ))}
            </div>
        </div>
    );
};

export default PatientHistoryView;
