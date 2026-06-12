import React, { useState } from 'react';
import Modal from '@/components/molecules/Modal';
import TabButton from '@/components/atoms/TabButton';
import { useLanguage } from '@/hooks/useLanguage';
import { usePatientHistoryController } from '@/features/patients/hooks/usePatientHistoryController';
import Icon from '@/components/atoms/Icon';
import { formatDate } from '@/utils/core/dateUtils';
import styles from './PatientHistoryModal.module.css';

/**
 * PatientHistoryModal Molecule (Executor).
 * Renders the medical history of a patient (appointments, prescriptions, licenses, requests).
 */
const DateTimeDisplay = ({ date }) => formatDate(date, { time: true });
const SimpleDateDisplay = ({ date }) => formatDate(date);

const PatientHistoryModal = ({ isOpen, onClose, patientId, patientName }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('appointments');
    const { history, loading } = usePatientHistoryController(patientId, isOpen);

    const baseClass = styles.root;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('medical_history') || 'Historia Clínica'}: ${patientName}`}
            size="xl"
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
                    <div className={`${baseClass}__loading`}>{t('loading')}…</div>
                ) : (
                    <>
                        {activeTab === 'appointments' && (
                            <div className={`${baseClass}__list`}>
                                {history.appointments.length === 0 ? (
                                    <div className={`${baseClass}__empty`}>
                                        <Icon name="history" size="3rem" color="var(--gray-300)" />
                                        <p>{t('no_history')}</p>
                                    </div>
                                ) : (
                                    history.appointments.map(appt => (
                                        <article key={appt.id} className={`${baseClass}__item ${appt.status === 'cancelled' ? baseClass + '__item--cancelled' : ''}`}>
                                            <div className={`${baseClass}__item-header`}>
                                                <span className={`${baseClass}__date`}>
                                                    <Icon name="calendar_month" size="1.2rem" className="mr-1" />
                                                    <DateTimeDisplay date={appt.appointment_date} />
                                                </span>
                                                <span className={`status-chip status-${appt.status}`}>{t(appt.status) || appt.status}</span>
                                            </div>
                                            <div className={`${baseClass}__doctor`}>
                                                <Icon name="medical_services" size="1rem" />
                                                {t('doctor') || 'Dr.'}: {appt.doctor_name}
                                            </div>
                                            {appt.reason && (
                                                <div className={`${baseClass}__reason`}>
                                                    {appt.reason}
                                                </div>
                                            )}
                                            {appt.cancellation_reason && (
                                                <div className={`${baseClass}__cancellation`}>
                                                    <Icon name="block" size="1.1rem" className="mr-2" />
                                                    {t('reason')}: {appt.cancellation_reason}
                                                </div>
                                            )}
                                            {appt.behavior_rating && (
                                                <div className={`${baseClass}__rating`}>
                                                    <Icon name="auto_awesome" size="1.1rem" />
                                                    {t('rating')}: {appt.behavior_rating}/5
                                                </div>
                                            )}
                                        </article>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'medical' && (
                            <div className={`${baseClass}__list--vertical`}>
                                {/* Prescriptions */}
                                <section className={`${baseClass}__section`}>
                                    <h4 className={`${baseClass}__section-title`}>
                                        <Icon name="medication" size="1.2rem" />
                                        {t('prescriptions') || 'Recetas'}
                                    </h4>
                                    {history.prescriptions.length === 0 ? (
                                        <p className={`${baseClass}__empty-record`}>{t('none') || 'Ninguna'}</p>
                                    ) : (
                                        <div className={`${baseClass}__record-list`}>
                                            {history.prescriptions.map(p => (
                                                <div key={p.id} className={`${baseClass}__record ${baseClass}__record--rx`}>
                                                    <div className={`${baseClass}__record-header`}>
                                                        <span><DateTimeDisplay date={p.created_at || p.appointment_date} /></span>
                                                        <span className={`${baseClass}__doctor`}>
                                                            <Icon name="person" size="0.9rem" />
                                                            {p.doctor_name}
                                                        </span>
                                                    </div>
                                                    <div className={`${baseClass}__record-text ${baseClass}__record-text--pre`}>{p.medications}</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* Requests */}
                                <section className={`${baseClass}__section`}>
                                    <h4 className={`${baseClass}__section-title`}>
                                        <Icon name="assignment" size="1.2rem" />
                                        {t('requests') || 'Solicitudes'}
                                    </h4>
                                    {history.requests.length === 0 ? (
                                        <p className={`${baseClass}__empty-record`}>{t('none') || 'Ninguna'}</p>
                                    ) : (
                                        <div className={`${baseClass}__record-list`}>
                                            {history.requests.map(r => (
                                                <div key={r.id} className={`${baseClass}__record ${baseClass}__record--req`}>
                                                    <div className={`${baseClass}__record-header`}>
                                                        <span><DateTimeDisplay date={r.created_at} /></span>
                                                        <span className={`${baseClass}__record-type`}>{r.type}</span>
                                                    </div>
                                                    <div className={`${baseClass}__record-text`}>"{r.request_note}"</div>
                                                    <div className={`${baseClass}__record-status`}>
                                                        <Icon name="task_alt" size="0.9rem" className="mr-1" />
                                                        {t(r.status)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>

                                {/* Licenses */}
                                <section className={`${baseClass}__section`}>
                                    <h4 className={`${baseClass}__section-title`}>
                                        <Icon name="badge" size="1.2rem" />
                                        {t('licenses') || 'Licencias Médicas'}
                                    </h4>
                                    {history.licenses.length === 0 ? (
                                        <p className={`${baseClass}__empty-record`}>{t('none') || 'Ninguna'}</p>
                                    ) : (
                                        <div className={`${baseClass}__record-list`}>
                                            {history.licenses.map(l => (
                                                <div key={l.id} className={`${baseClass}__record ${baseClass}__record--lic`}>
                                                    <div className={`${baseClass}__record-header`}>
                                                        <span>
                                                            <Icon name="calendar_today" size="0.9rem" className="mr-1" />
                                                            <SimpleDateDisplay date={l.start_date} />
                                                        </span>
                                                        <span className={`${baseClass}__record-type`}>
                                                            {l.days_duration} {t('days') || 'Días'}
                                                        </span>
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
