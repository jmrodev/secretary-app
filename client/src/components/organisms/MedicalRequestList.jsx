import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useModal } from '../../context/ModalContext';
import { timeAgo, isToday } from '../../utils/time';
import { formatPrice } from '../../utils/format';
import Button from '../atoms/Button';

const MedicalRequestList = ({
    requests,
    filterItem,
    handleDeleteRequest,
    openActionModal,
    setPaymentModal
}) => {
    const { user } = useAuth();
    const { t } = useLanguage();

    if (requests.filter(filterItem).length === 0) {
        return <p className="text-muted p-4">{t('no_requests')}</p>;
    }

    return (
        <div className="table-responsive">
            <table className="table-base">
                <thead>
                    <tr>
                        <th>{t('type')}</th>
                        <th>{t('patient')}</th>
                        <th>{t('doctor')}</th>
                        <th>{t('detail')}</th>
                        <th>{t('status')}</th>
                        <th>{t('payment')}</th>
                        <th>{t('date')}</th>
                        <th className="text-right">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.filter(filterItem).map(r => (
                        <tr key={r.id} className={r.status !== 'pending' ? 'opacity-80 bg-slate-50' : ''}>
                            <td>
                                <span className={`tag ${r.type === 'prescription' ? 'tag-blue' : 'tag-purple'}`}>
                                    {r.type === 'prescription' ? t('prescription') : (r.type === 'license' ? t('license') : (r.type === 'certificate' ? t('certificate') : r.type))}
                                </span>
                            </td>
                            <td>
                                <div className="font-bold">{r.patient_name}</div>
                            </td>
                            <td>
                                <div className="text-sm">Dr. {r.doctor_name || '---'}</div>
                            </td>
                            <td>
                                <div style={{
                                    fontSize: '0.875rem',
                                    fontStyle: 'italic',
                                    color: 'var(--gray-600)',
                                    maxWidth: '300px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                }} title={r.request_note}>
                                    {r.request_note}
                                </div>
                            </td>
                            <td>
                                <div className="flex flex-col gap-1">
                                    <span className={`tag ${r.status === 'pending' ? 'tag-amber' : (r.status === 'completed' ? 'tag-green' : 'tag-red')}`}>
                                        {t(r.status) || r.status}
                                    </span>
                                    {r.doctor_note && (
                                        <div style={{
                                            fontSize: '0.75rem',
                                            color: 'var(--green-700)',
                                            backgroundColor: 'var(--green-50)',
                                            padding: '0.125rem 0.375rem',
                                            borderRadius: 'var(--radius)',
                                            border: '1px solid var(--green-100)',
                                            marginTop: '0.25rem',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap'
                                        }} title={r.doctor_note}>
                                            <b>{t('reply')}:</b> {r.doctor_note}
                                        </div>
                                    )}
                                </div>
                            </td>
                            <td>
                                <span className={`tag font-mono text-xs ${r.payment_status === 'paid' ? 'tag-green' : (r.payment_status === 'debt' ? 'tag-red' : 'tag-slate')}`}>
                                    {r.payment_status === 'paid' ? `PAID` :
                                        (r.payment_status === 'debt' ? `DEBT ${formatPrice(r.debt_amount)}` : 'PENDING')}
                                </span>
                            </td>
                            <td>
                                <span className="text-xs text-muted whitespace-nowrap">
                                    {timeAgo(r.created_at)}
                                </span>
                            </td>
                            <td>
                                <div className="flex justify-end gap-1">
                                    {/* Charge Button */}
                                    {(r.payment_status !== 'paid') && (user.role === 'secretary' || user.role === 'doctor') && (
                                        <Button
                                            variant="ghost"
                                            size="sm-compact"
                                            onClick={() => setPaymentModal({
                                                open: true,
                                                initialData: {
                                                    type: 'income_patient',
                                                    amount: '',
                                                    description: `Request: ${r.type} for ${r.patient_name}`,
                                                    patientId: r.patient_user_id,
                                                    patientName: r.patient_name,
                                                    doctorId: r.doctor_id
                                                },
                                                reqId: r.id
                                            })}
                                            className="btn-icon-base btn-icon-blue"
                                            title="Cobrar"
                                        >
                                            💲
                                        </Button>
                                    )}

                                    {/* Mark As Done Button */}
                                    {(user.role === 'doctor' || user.role === 'secretary') && r.status === 'pending' && (
                                        <Button
                                            variant="ghost"
                                            size="sm-compact"
                                            onClick={() => openActionModal('completed', r.id)}
                                            className="btn-icon-base btn-icon-green"
                                            title={t('mark_as_done')}
                                        >
                                            ✅
                                        </Button>
                                    )}

                                    {/* Reject Button */}
                                    {(user.role === 'doctor' || user.role === 'secretary') && r.status === 'pending' && (
                                        <Button
                                            variant="ghost"
                                            size="sm-compact"
                                            onClick={() => openActionModal('rejected', r.id)}
                                            className="btn-icon-base btn-icon-yellow"
                                            title={t('reject')}
                                        >
                                            ❌
                                        </Button>
                                    )}

                                    {/* Delete Button */}
                                    {(user.role === 'admin' || user.role === 'secretary' || user.role === 'doctor') && (
                                        (user.role === 'admin' || r.status === 'pending' || r.status === 'consult' || isToday(r.completed_at || r.updated_at)) ? (
                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                className="btn-icon-base btn-icon-red"
                                                onClick={() => handleDeleteRequest(r.id, r)}
                                                title="Eliminar"
                                            >
                                                🗑️
                                            </Button>
                                        ) : null
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default MedicalRequestList;
