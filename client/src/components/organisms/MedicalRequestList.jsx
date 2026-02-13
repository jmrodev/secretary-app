import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { isToday } from '../../utils/time';
import { formatPrice } from '../../utils/format';
import Button from '../atoms/Button';
import './MedicalRequestList.css';

const MedicalRequestList = ({
    requests,
    filterItem,
    handleDeleteRequest,
    openActionModal,
    setPaymentModal,
    canDelete,
    handleEditRequest
}) => {
    const { user } = useAuth();
    const { t } = useLanguage();

    const filteredRequests = (requests || []).filter(filterItem || (() => true));

    if (filteredRequests.length === 0) {
        return (
            <div className="medical-requests__empty">
                <span className="medical-requests__empty-icon">📋</span>
                {t('no_requests')}
            </div>
        );
    }

    return (
        <div className="medical-requests">
            <div className="medical-requests__container">
                <table className="medical-requests__table">
                    <thead>
                        <tr>
                            <th className="medical-requests__th medical-requests__th--type">{t('type')}</th>
                            <th className="medical-requests__th">{t('patient')}</th>
                            <th className="medical-requests__th">{t('doctor')}</th>
                            <th className="medical-requests__th medical-requests__th--detail">{t('detail')}</th>
                            <th className="medical-requests__th">{t('status')}</th>
                            <th className="medical-requests__th">{t('payment')}</th>
                            <th className="medical-requests__th medical-requests__th--actions">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map(r => {
                            const isPending = r.status === 'pending';
                            const isCompleted = r.status === 'completed';
                            const isRejected = r.status === 'rejected';

                            const paymentStatusClass = r.payment_status === 'paid' ? 'paid' :
                                r.payment_status === 'debt' ? 'debt' :
                                    r.payment_status === 'bonified' ? 'bonified' : 'pending';

                            return (
                                <tr key={r.id} className={`medical-requests__row ${!isPending ? 'medical-requests__row--completed' : ''}`}>
                                    <td className="medical-requests__td medical-requests__td--type">
                                        <div className="medical-requests__type-cell">
                                            <span className={`medical-requests__type-tag medical-requests__type-tag--${r.type}`}>
                                                {r.type === 'prescription' ? t('prescription') : (r.type === 'license' ? t('license') : (r.type === 'certificate' ? t('certificate') : r.type))}
                                            </span>
                                            {!!r.is_patient_submitted && (
                                                <span className="medical-requests__source-tag">
                                                    📲 App
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="medical-requests__td">
                                        <div className="medical-requests__patient-name">{r.patient_name}</div>
                                    </td>
                                    <td className="medical-requests__td">
                                        <div className="medical-requests__doctor-name">
                                            Dr. {r.doctor_name || '---'}
                                        </div>
                                    </td>
                                    <td className="medical-requests__td">
                                        <div className="medical-requests__detail" title={r.request_note}>
                                            {r.request_note}
                                        </div>
                                    </td>
                                    <td className="medical-requests__td">
                                        <div className="medical-requests__status-cell">
                                            <span className={`medical-requests__status-tag medical-requests__status-tag--${r.status}`}>
                                                {t(r.status) || r.status}
                                            </span>
                                            {r.doctor_note && (
                                                <div className="medical-requests__reply" title={r.doctor_note}>
                                                    <b>{t('reply')}:</b> {r.doctor_note}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="medical-requests__td">
                                        <div className="medical-requests__payment-info">
                                            <div className={`medical-requests__payment-badge medical-requests__payment-badge--${paymentStatusClass}`}>
                                                <span className="medical-requests__payment-dot"></span>
                                                {r.payment_status === 'paid' ? t('paid') :
                                                    (r.payment_status === 'debt' ? `${t('debt')} ${formatPrice(r.debt_amount)}` :
                                                        (r.payment_status === 'bonified' ? (t('bonified') || 'Bonificado') : t('pending')))}
                                            </div>

                                            {r.payment_method && (
                                                <div className="medical-requests__payment-method">
                                                    <span className="medical-requests__payment-method-icon">
                                                        {r.payment_method === 'cash' ? '💵' : r.payment_method === 'transfer' ? '🏦' : '💳'}
                                                    </span>
                                                    {t(r.payment_method) || r.payment_method}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="medical-requests__td medical-requests__td--actions">
                                        <div className="medical-requests__actions">
                                            {(r.payment_status !== 'paid' && r.payment_status !== 'bonified') && (user.role === 'secretary' || user.role === 'doctor') && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => setPaymentModal({
                                                        open: true,
                                                        initialData: {
                                                            type: 'income_patient',
                                                            amount: r.debt_amount,
                                                            description: `${t('request')}: ${t(r.type) || r.type} - ${r.patient_name}`,
                                                            patientId: r.patient_id,
                                                            patientUserId: r.patient_user_id,
                                                            patientName: r.patient_name,
                                                            doctorId: r.doctor_id,
                                                            method: r.payment_method,
                                                            serviceType: r.type === 'license' ? 'medical_license' : (r.type === 'prescription' ? 'prescription' : 'certificate')
                                                        },
                                                        reqId: r.id
                                                    })}
                                                    title="Cobrar"
                                                    icon="💲"
                                                />
                                            )}

                                            {(user.role === 'doctor' || user.role === 'secretary') && isPending && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => openActionModal('completed', r.id)}
                                                    title={t('mark_as_done')}
                                                    icon="✅"
                                                />
                                            )}

                                            {(user.role === 'doctor' || user.role === 'secretary') && isPending && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => openActionModal('rejected', r.id)}
                                                    title={t('reject')}
                                                    icon="❌"
                                                />
                                            )}

                                            {(user.role === 'admin' || canDelete) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => handleEditRequest({ ...r, _origin: 'request' })}
                                                    title={t('edit')}
                                                    icon="✏️"
                                                />
                                            )}

                                            {(canDelete || user.role === 'admin' || (user.role === 'doctor' && (isPending || isToday(r.completed_at || r.updated_at)))) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => handleDeleteRequest(r.id, r)}
                                                    title="Eliminar"
                                                    icon="🗑️"
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MedicalRequestList;
