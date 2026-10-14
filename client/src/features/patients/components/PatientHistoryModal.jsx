
import React, { useState, useMemo } from 'react';
import Modal from '@/components/molecules/Modal';
import TabButton from '@/components/atoms/TabButton';
import { useFetch } from '@/hooks/useFetch';
import { useLanguage } from '@/context/LanguageContext';
import Icon from '@/components/atoms/Icon';
import './PatientHistoryModal.css';

/**
 * PatientHistoryModal Molecule (Executor).
 * Renders the medical history of a patient (appointments, prescriptions, licenses, requests).
 */
const PatientHistoryModal = ({ isOpen, onClose, patientId, patientName }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('appointments');

    // Data fetching using useFetch hook
    const { data: appointments = [], loading: loadingAppt } = useFetch(
        isOpen && patientId ? `/appointments?patientId=${patientId}` : null,
        { initialData: [] }
    );
    const { data: prescriptions = [], loading: loadingPresc } = useFetch(
        isOpen && patientId ? `/medical/prescriptions?patientId=${patientId}` : null,
        { initialData: [] }
    );
    const { data: licenses = [], loading: loadingLic } = useFetch(
        isOpen && patientId ? `/medical/licenses?patientId=${patientId}` : null,
        { initialData: [] }
    );
    const { data: requests = [], loading: loadingReq } = useFetch(
        isOpen && patientId ? `/medical/requests?patientId=${patientId}` : null,
        { initialData: [] }
    );

    const loading = loadingAppt || loadingPresc || loadingLic || loadingReq;

    const history = useMemo(() => ({
        appointments,
        prescriptions,
        licenses,
        requests
    }), [appointments, prescriptions, licenses, requests]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    const baseClass = 'patient-history';

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('medical_history') || 'Historia Clínica'}: ${patientName}`}
            size="lg"
        >
            <div className={`${baseClass}__nav`}>
                <TabButton
                    isActive={activeTab === 'appointments'}
                    onClick={() => setActiveTab('appointments')}
                >
                    <Icon name="APPOINTMENTS" size="1.1rem" className="mr-1" />
                    {t('appointments') || 'Turnos'}
                </TabButton>
                <TabButton
                    isActive={activeTab === 'medical'}
                    onClick={() => setActiveTab('medical')}
                >
                    <Icon name="PRESCRIPTION" size="1.1rem" className="mr-1" />
                    {t('medical_records') || 'Registros Médicos'}
                </TabButton>
            </div>

            <div className={`${baseClass}__body`}>
                {loading ? (
                    <div className={`${baseClass}__loading`}>{t('loading')}...</div>
                ) : (
                    <>
                        {activeTab === 'appointments' && (
                            <div className={`${baseClass}__list`}>
                                {history.appointments.length === 0 ? (
                                    <p className={`${baseClass}__empty`}>{t('no_history')}</p>
                                ) : (
                                    history.appointments.map(appt => (
                                        <div key={appt.id} className={`${baseClass}__item ${appt.status === 'cancelled' ? baseClass + '__item--cancelled' : ''}`}>
                                            <div className={`${baseClass}__item-header`}>
                                                <span className={`${baseClass}__date`}>{formatDate(appt.appointment_date)}</span>
                                                <span className={`status-chip status-${appt.status}`}>{t(appt.status) || appt.status}</span>
                                            </div>
                                            <div className={`${baseClass}__doctor`}>
                                                Dr. {appt.doctor_name}
                                            </div>
                                            {appt.reason && (
                                                <div className={`${baseClass}__reason`}>
                                                    "{appt.reason}"
                                                </div>
                                            )}
                                            {appt.cancellation_reason && (
                                                <div className={`${baseClass}__cancellation`}>
                                                    <Icon name="REJECT" size="0.9rem" className="mr-1" />
                                                    {t('reason')}: {appt.cancellation_reason}
                                                </div>
                                            )}
                                            {appt.behavior_rating && (
                                                <div className={`${baseClass}__rating`}>
                                                    <Icon name="NEW" size="0.9rem" className="mr-1" />
                                                    {t('rating')}: {appt.behavior_rating}/5
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'medical' && (
                            <div className={`${baseClass}__list`}>
                                {/* Prescriptions */}
                                <section className={`${baseClass}__section`}>
                                    <h4 className={`${baseClass}__section-title`}>{t('prescriptions') || 'Recetas'}</h4>
                                    {history.prescriptions.length === 0 ? (
                                        <p className={`${baseClass}__empty-record`}>{t('none') || 'Ninguna'}</p>
                                    ) : (
                                        <div className={`${baseClass}__record-list`}>
                                            {history.prescriptions.map(p => (
                                                <div key={p.id} className={`${baseClass}__record ${baseClass}__record--rx`}>
                                                    <div className={`${baseClass}__record-header`}>
                                                        <span>{formatDate(p.created_at || p.appointment_date)}</span>
                                                        <span>Dr. {p.doctor_name}</span>
                                                    </div>
                                                    <div className={`${baseClass}__record-text ${baseClass}__record-text--pre`}>{p.medications}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* Requests */}
                                <section className={`${baseClass}__section`}>
                                    <h4 className={`${baseClass}__section-title`}>{t('requests') || 'Solicitudes'}</h4>
                                    {history.requests.length === 0 ? (
                                        <p className={`${baseClass}__empty-record`}>{t('none') || 'Ninguna'}</p>
                                    ) : (
                                        <div className={`${baseClass}__record-list`}>
                                            {history.requests.map(r => (
                                                <div key={r.id} className={`${baseClass}__record ${baseClass}__record--req`}>
                                                    <div className={`${baseClass}__record-header`}>
                                                        <span>{formatDate(r.created_at)}</span>
                                                        <span className={`${baseClass}__record-type`}>{r.type}</span>
                                                    </div>
                                                    <div className={`${baseClass}__record-text`}>"{r.request_note}"</div>
                                                    <div className={`${baseClass}__record-status`}>{t(r.status)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* Licenses */}
                                <section className={`${baseClass}__section`}>
                                    <h4 className={`${baseClass}__section-title`}>{t('licenses') || 'Licencias Médicas'}</h4>
                                    {history.licenses.length === 0 ? (
                                        <p className={`${baseClass}__empty-record`}>{t('none') || 'Ninguna'}</p>
                                    ) : (
                                        <div className={`${baseClass}__record-list`}>
                                            {history.licenses.map(l => (
                                                <div key={l.id} className={`${baseClass}__record ${baseClass}__record--lic`}>
                                                    <div className={`${baseClass}__record-header`}>
                                                        <span>Desde: {new Date(l.start_date).toLocaleDateString()}</span>
                                                        <span>{l.days_duration} {t('days') || 'Días'}</span>
                                                    </div>
                                                    <div className={`${baseClass}__record-text`}>{l.diagnosis}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            </div>
                        )}
                    </>
                )}
            </div>
        </Modal>
    );
};

export default React.memo(PatientHistoryModal);
