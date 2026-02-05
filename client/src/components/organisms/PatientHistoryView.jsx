import React from 'react';
import Button from '../atoms/Button';
import { formatDate } from '../../utils/format';
import { useModal } from '../../context/ModalContext';
import { printInvoice } from '../../utils/printInvoice';
import './PatientHistoryView.css';

const PatientHistoryView = ({
    patientAppointments,
    loading,
    onClose,
    t,
    searchPatientId,
    handlers
}) => {
    const { alert } = useModal();
    const { handleGoToAppointment, handleRepeatAppointment } = handlers;
    if (loading) return <p className="p-8 text-center">{t('loading')}</p>;

    const upcoming = patientAppointments.filter(a => new Date(a.appointment_date) >= new Date());
    const past = patientAppointments.filter(a => new Date(a.appointment_date) < new Date());

    return (
        <div className="patient-history-view animate-fadeIn card" style={{ padding: '1rem' }}>
            <div className="config-flex config-flex--gap-4" style={{ justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 className="patient-history-view__title">
                    {t('results_for')}: {patientAppointments[0]?.patient_name || t('patient')}
                </h2>
                <Button variant="secondary" size="sm" onClick={onClose}>
                    🔙 {t('back_to_calendar')}
                </Button>
            </div>

            <div className="config-grid config-grid--2col" style={{ gap: '1.5rem' }}>
                {/* Future Appointments */}
                <div className="card" style={{ backgroundColor: 'var(--blue-50)', borderColor: 'var(--blue-100)' }}>
                    <h3 className="patient-history-view__section-title" style={{ color: 'var(--blue-600)', borderColor: 'var(--blue-200)' }}>📅 {t('upcoming_appointments')}</h3>
                    {upcoming.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <p className="patient-history-view__empty-text">{t('no_patient_history')}</p>
                            <p className="patient-history-view__hint">{t('create_one_now')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {upcoming.map(appt => (
                                <div key={appt.id} className="p-3 bg-white border border-blue-100 rounded-lg shadow-sm flex flex-col gap-2">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <div className="patient-history-view__appt-date">
                                                {formatDate(appt.appointment_date, true)}
                                            </div>
                                            <div className="patient-history-view__appt-doctor">Dr. {appt.doctor_name}</div>
                                            <div className="patient-history-view__amounts">
                                                <span className="text-success">{t('paid')}: ${appt.paid_amount || 0}</span>
                                                <span className={Number(appt.pending_amount) > 0 ? 'text-danger' : 'text-muted'}>
                                                    {t('debt')}: ${appt.pending_amount || 0}
                                                </span>
                                            </div>
                                            <div className="patient-history-view__appt-reason">{appt.reason}</div>
                                        </div>
                                        <span className={`tag tag-${appt.status === 'confirmed' ? 'green' : 'amber'}`}>
                                            {t(appt.status)}
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-sm btn-outline-primary w-full flex items-center justify-center gap-2 mt-1"
                                        onClick={() => handleGoToAppointment(appt.id, appt.doctor_id, appt.appointment_date, onClose)}
                                    >
                                        ➡️ {t('go_to_appointment') || 'Ir al Turno'}
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
                                    <div className="config-flex" style={{ justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                        <span className="patient-history-view__appt-date-small">{formatDate(appt.appointment_date)}</span>
                                        <span className={`tag tag-${appt.status === 'completed' ? 'green' : 'gray'}`}>
                                            {t(appt.status)}
                                        </span>
                                    </div>
                                    <div className="patient-history-view__appt-doctor-small">Dr. {appt.doctor_name}</div>
                                    <div className="patient-history-view__amounts-small">
                                        <span className="text-success">{t('paid')}: ${appt.paid_amount || 0}</span>
                                        <span className={Number(appt.pending_amount) > 0 ? 'text-danger' : 'text-muted'}>
                                            {t('debt')}: ${appt.pending_amount || 0}
                                        </span>
                                    </div>
                                    <div className="patient-history-view__appt-reason-small">"{appt.reason}"</div>
                                    <div className="flex gap-2 justify-end border-t border-slate-200 pt-2">
                                        <button
                                            className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                                            onClick={() => handleRepeatAppointment(searchPatientId, appt.reason)}
                                            title={t('repeat_appointment')}
                                        >
                                            🔄 {t('repeat_appointment')}
                                        </button>

                                        {appt.invoice_number && (
                                            <button
                                                className="patient-history-view__invoice-btn"
                                                onClick={() => alert(
                                                    <div className="invoice-detail">
                                                        <h3 className="invoice-detail__title">Comprobante Electrónico</h3>
                                                        <div className="invoice-detail__content">
                                                            <p className="invoice-detail__row"><strong>Tipo:</strong> Factura {appt.invoice_cbte_tipo === 11 ? 'C' : appt.invoice_cbte_tipo}</p>
                                                            <p className="invoice-detail__row"><strong>Número:</strong> {String(appt.invoice_punto_vta).padStart(4, '0')}-{String(appt.invoice_number).padStart(8, '0')}</p>
                                                            <p className="invoice-detail__row"><strong>CAE:</strong> {appt.invoice_cae}</p>
                                                            <p className="invoice-detail__row"><strong>Vto. CAE:</strong> {appt.invoice_cae_vto ? new Date(appt.invoice_cae_vto).toLocaleDateString() : '-'}</p>
                                                            <hr className="invoice-detail__divider" />
                                                            <p className="invoice-detail__row"><strong>Paciente:</strong> {appt.patient_name}</p>
                                                            <p className="invoice-detail__row"><strong>Médico:</strong> {appt.doctor_name}</p>
                                                            <p className="invoice-detail__row"><strong>Monto Pagado:</strong> ${appt.paid_amount}</p>
                                                        </div>
                                                        <div className="invoice-detail__actions">
                                                            <Button
                                                                variant="primary"
                                                                size="sm"
                                                                onClick={() => printInvoice({
                                                                    ptoVta: appt.invoice_punto_vta,
                                                                    number: appt.invoice_number,
                                                                    cbteTipo: appt.invoice_cbte_tipo,
                                                                    cae: appt.invoice_cae,
                                                                    vto: appt.invoice_cae_vto,
                                                                    patient: appt.patient_name,
                                                                    patientDni: appt.patient_dni,
                                                                    doctor: appt.doctor_name,
                                                                    doctorCuit: appt.doctor_cuit,
                                                                    amount: appt.paid_amount
                                                                })}
                                                            >
                                                                🖨️ {t('print_invoice') || 'Imprimir Factura'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                )}
                                                title="Ver Factura Electrónica"
                                            >
                                                🧾 {t('view_invoice') || 'Ver Factura'}
                                            </button>
                                        )}
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
