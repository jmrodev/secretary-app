import React from 'react';
import { formatDate } from '../../utils/format';

const PatientHistoryView = ({
    patientAppointments,
    loading,
    onClose,
    t,
    searchPatientId,
    handlers
}) => {
    const { handleGoToAppointment, handleRepeatAppointment } = handlers;
    if (loading) return <p className="p-8 text-center">Cargando...</p>;

    const upcoming = patientAppointments.filter(a => new Date(a.appointment_date) >= new Date());
    const past = patientAppointments.filter(a => new Date(a.appointment_date) < new Date());

    return (
        <div className="patient-history-view animate-fade-in card p-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-main-700">
                    {t('results_for')}: {patientAppointments[0]?.patient_name || t('patient')}
                </h2>
                <button className="btn btn-secondary btn-sm" onClick={onClose}>
                    🔙 {t('back_to_calendar')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Future Appointments */}
                <div className="card bg-blue-50/50 border-blue-100">
                    <h3 className="mb-4 text-blue-600 font-bold border-b border-blue-200 pb-2">📅 {t('upcoming_appointments')}</h3>
                    {upcoming.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-main-500 text-lg mb-4">{t('no_patient_history')}</p>
                            <p className="text-sm text-blue-600 mb-2 font-medium">{t('create_one_now')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcoming.map(appt => (
                                <div key={appt.id} className="p-3 bg-white border border-blue-100 rounded-lg shadow-sm flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="font-bold text-main-800">
                                                {formatDate(appt.appointment_date, true)}
                                            </div>
                                            <div className="text-main-600 text-sm">Dr. {appt.doctor_name}</div>
                                            <div className="flex gap-4 my-1 text-[11px] font-bold">
                                                <span className="text-green-600">Pagado: ${appt.paid_amount || 0}</span>
                                                <span className={Number(appt.pending_amount) > 0 ? 'text-red-500' : 'text-slate-400'}>
                                                    Deuda: ${appt.pending_amount || 0}
                                                </span>
                                            </div>
                                            <div className="text-xs text-main-500 italic">{appt.reason}</div>
                                        </div>
                                        <span className={`tag tag-${appt.status === 'confirmed' ? 'green' : 'amber'}`}>
                                            {t(appt.status)}
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-sm btn-outline-primary w-full flex items-center justify-center gap-2 mt-1"
                                        onClick={() => handleGoToAppointment(appt.id, appt.doctor_id, appt.appointment_date, onClose)}
                                    >
                                        ➡️ Ir al Turno
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <button
                        className="btn btn-primary mt-4 w-full"
                        onClick={() => handleRepeatAppointment(searchPatientId, 'Consulta')}
                    >
                        + {t('new_appointment') || 'Nuevo Turno'}
                    </button>
                </div>

                {/* Past History */}
                <div>
                    <h3 className="mb-4 text-main-600 font-bold border-b pb-2">📜 {t('history')}</h3>
                    {past.length === 0 ? (
                        <p className="text-muted italic text-sm">{t('no_history')}</p>
                    ) : (
                        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                            {past.map(appt => (
                                <div key={appt.id} className="p-3 bg-slate-50 border border-slate-100 rounded-lg hover:shadow-md transition-all">
                                    <div className="flex justify-between mb-1">
                                        <span className="font-semibold text-main-700">{formatDate(appt.appointment_date)}</span>
                                        <span className={`text-xs uppercase font-bold text-${appt.status === 'completed' ? 'green-600' : 'slate-500'}`}>
                                            {t(appt.status)}
                                        </span>
                                    </div>
                                    <div className="text-sm text-main-600 mb-1">Dr. {appt.doctor_name}</div>
                                    <div className="flex gap-4 mb-2 text-xs font-bold">
                                        <span className="text-green-600">Pagado: ${appt.paid_amount || 0}</span>
                                        <span className={Number(appt.pending_amount) > 0 ? 'text-red-500' : 'text-slate-400'}>
                                            Deuda: ${appt.pending_amount || 0}
                                        </span>
                                    </div>
                                    <div className="text-sm italic text-main-500 mb-3">"{appt.reason}"</div>
                                    <div className="flex gap-2 justify-end border-t border-slate-200 pt-2">
                                        <button
                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                                            onClick={() => handleRepeatAppointment(searchPatientId, appt.reason)}
                                            title={t('repeat_appointment')}
                                        >
                                            🔄 {t('repeat_appointment')}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PatientHistoryView;
