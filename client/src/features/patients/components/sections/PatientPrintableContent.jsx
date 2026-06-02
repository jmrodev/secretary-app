import React from 'react';
import { formatDate, formatTime } from '@/utils/core/dateUtils';

export const PatientPrintableContent = ({
    details,
    printOptions,
    filteredAppointments,
    chronicMeds,
    filteredRequests,
    excludedItems,
    toggleExclude,
    formatMedicationData,
    t
}) => {
    return (
        <>
            <h1 className="printable-title">{t('patient_sheet')}: {details.full_name?.toUpperCase()}</h1>
            <hr className="printable-divider" />
            
            {printOptions.datos && (
                <>
                    <h3 className="printable-subtitle">{t('personal_data_title')}</h3>
                    <ul className="printable-list">
                        <li><strong>DNI:</strong> {details.dni || '-'}</li>
                        <li><strong>{t('phone')}:</strong> {details.phone || '-'}</li>
                        <li><strong>Email:</strong> {details.email || '-'}</li>
                        <li><strong>{t('location')}:</strong> {details.street_name || ''} {details.street_number || ''}, {details.city || ''}</li>
                        <li><strong>{t('insurance')}:</strong> {details.insurance_name || '-'}</li>
                    </ul>
                </>
            )}

            {printOptions.finanzas && (
                <>
                    <h3 className="printable-subtitle">{t('financial_status_title')}</h3>
                    <ul className="printable-list">
                        <li><strong>{t('current_debt')}:</strong> ${details.total_debt || '0'}</li>
                        {details.institution_name && (
                            <li><em>* {t('derived_institution')}: {details.institution_name}</em></li>
                        )}
                    </ul>
                </>
            )}

            {printOptions.turnos && (
                <>
                    <h3 className="printable-subtitle">{t('appointment_history')}</h3>
                    {filteredAppointments.length > 0 ? (
                        <ul className="printable-list">
                            {filteredAppointments.map(app => {
                                const isExcluded = excludedItems.has(`appt_${app.id}`);
                                return (
                                    <li key={app.id} className={`${isExcluded ? 'no-print' : ''} printable-list-item--flex`}>
                                        <input 
                                            type="checkbox" 
                                            checked={!isExcluded} 
                                            onChange={() => toggleExclude(`appt_${app.id}`)} 
                                            className="no-print cursor-pointer"
                                        />
                                        <div>
                                            <strong>{formatDate(app.appointment_date)} {formatTime(app.appointment_date)}</strong> 
                                            {app.doctor_name ? ` | ${t('doctor')}: ${app.doctor_name}` : ''}
                                            | {t('status')}: {t(app.status)} 
                                            | {t('reason')}: {app.reason || '-'} 
                                            {app.cancellation_reason ? ` (${t('cancellation')}: ${app.cancellation_reason})` : ''}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="printable-text">{t('no_appointments_registered')}</p>
                    )}
                </>
            )}

            {printOptions.cronicos && (
                <>
                    <h3 className="printable-subtitle">{t('chronic_medication_title')}</h3>
                    {chronicMeds && chronicMeds.length > 0 ? (
                        <ul className="printable-list">
                            {chronicMeds.map((m) => (
                                <li key={m.id || m.medication_name}>
                                    <strong>{m.medication_name}</strong> {m.dose ? `- ${t('dose')}: ${m.dose}` : ''} {m.frequency ? `(${m.frequency})` : ''} {m.notes ? `| ${t('obs')}: ${m.notes}` : ''}
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="printable-text">{t('no_chronic_medication')}</p>
                    )}
                </>
            )}

            {printOptions.recetas && (
                <>
                    <h3 className="printable-subtitle">{t('prescription_history')}</h3>
                    {filteredRequests.length > 0 ? (
                        <ul className="printable-list">
                            {filteredRequests.map((p) => {
                                const isExcluded = excludedItems.has(`req_${p.id}`);
                                return (
                                    <li key={p.id} className={`printable-list-item--grouped ${isExcluded ? 'no-print' : ''}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={!isExcluded} 
                                            onChange={() => toggleExclude(`req_${p.id}`)} 
                                            className="no-print cursor-pointer mt-1"
                                        />
                                        <div className="flex-1">
                                            <div className="printable-item-header mb-1 text-sm-compact">
                                                <strong>{formatDate(p.created_at || p.action_date)}</strong> 
                                                {p.doctor_name ? ` | ${t('doctor')}: ${p.doctor_name}` : ''}
                                            </div>
                                            <div className="printable-item-content">
                                                {formatMedicationData(p.raw_medication_data || p.request_note)}
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="printable-text">{t('no_prescription_history')}</p>
                    )}
                </>
            )}
        </>
    );
};
