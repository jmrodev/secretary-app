
import React from 'react';
import Pagination from '@/components/atoms/Pagination';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/context/LanguageContext';
import { isToday } from '@/utils/dateUtils';
import { formatPrice } from '@/utils/format';
import { formatDate } from '@/utils/dateUtils';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './MedicalRequestList.css';

/**
 * MedicalRequestList Organism (Feature-based).
 * Renders a list of medical requests (prescriptions, licenses, certificates).
 */
const MedicalRequestList = ({
    requests,
    loading,
    handleDeleteRequest,
    openActionModal,
    setPaymentModal,
    onBonify,
    canDelete,
    handleEditRequest,
    currentPage,
    totalPages,
    onPageChange
}) => {
    const { user } = useAuth();
    const { t } = useLanguage();

    if (!loading && (!requests || requests.length === 0)) {
        return (
            <section className="medical-requests__empty animate-fadeIn">
                <h2 className="visually-hidden">{t('no_requests')}</h2>
                <Icon name="description" size="3rem" className="medical-requests__empty-icon" />
                {t('no_requests')}
            </section>
        );
    }

    return (
        <section className={`medical-requests ${loading ? 'medical-requests--loading' : 'animate-fadeIn'}`}>
            <h2 className="visually-hidden">{t('medical_requests')}</h2>
            <article className="medical-requests__container">
                <h3 className="visually-hidden">{t('requests_list')}</h3>
                <table className="medical-requests__table table-base">
                    <thead>
                        <tr>
                            <th className="medical-requests__th medical-requests__th--type">{t('type')}</th>
                            <th className="medical-requests__th">{t('date') || 'Fecha'}</th>
                            <th className="medical-requests__th">{t('patient')}</th>
                            <th className="medical-requests__th">{t('doctor')}</th>
                            <th className="medical-requests__th medical-requests__th--status">{t('status')}</th>
                            <th className="medical-requests__th medical-requests__th--payment">{t('payment')}</th>
                            <th className="medical-requests__th medical-requests__th--actions">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(r => {
                            const isPending = r.status === 'pending';
                            const isCompleted = r.status === 'completed';
                            const isRejected = r.status === 'rejected';

                            const paymentStatusClass = r.payment_status === 'paid' ? 'paid' :
                                r.payment_status === 'debt' || r.payment_status === 'partial' ? 'debt' :
                                    r.payment_status === 'bonified' ? 'bonified' : 'pending';

                            return (
                                <tr key={r.id} className={`medical-requests__row ${!isPending ? 'medical-requests__row--completed' : ''}`}>
                                    <td className="medical-requests__td medical-requests__td--type">
                                        <div className="medical-requests__type-cell">
                                            <span
                                                className={`medical-requests__type-tag medical-requests__type-tag--${r.type} medical-requests__type-tag--clickable`}
                                                onClick={() => handleEditRequest({ ...r, _origin: 'request', _readOnly: true })}
                                                title={t('view') || 'Ver'}
                                            >
                                                {r.type === 'prescription' ? t('prescription') : (r.type === 'license' ? t('license') : (r.type === 'certificate' ? t('certificate') : r.type))}
                                            </span>
                                            {!!r.is_patient_submitted && (
                                                <span className="medical-requests__source-tag">
                                                    <Icon name="smartphone" size="1rem" /> App
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="medical-requests__td">
                                        <div className="medical-requests__date" title={formatDate(r.created_at, { time: true })}>
                                            {formatDate(r.created_at)}
                                        </div>
                                    </td>
                                    <td className="medical-requests__td">
                                        <div className="medical-requests__patient-name">{r.patient_name}</div>
                                    </td>
                                    <td className="medical-requests__td">
                                        <div className="medical-requests__doctor-name">
                                            Dr. {r.doctor_name ? r.doctor_name.split(' ').pop() : '---'}
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
                                                    ((r.payment_status === 'debt' || r.payment_status === 'partial') ? `${t(r.payment_status) || (r.payment_status === 'partial' ? 'Parcial' : 'Deuda')} ${formatPrice(r.debt_amount)}` :
                                                        (r.payment_status === 'bonified' ? (t('bonified') || 'Bonificado') : t('pending')))}
                                            </div>

                                            {r.payment_method && (
                                                <div className="medical-requests__payment-method">
                                                    <Icon
                                                        name={r.payment_method === 'cash' ? 'payments' : r.payment_method === 'transfer' ? 'account_balance' : 'credit_card'}
                                                        size="1rem"
                                                        className="medical-requests__payment-method-icon"
                                                    />
                                                    {t(r.payment_method) || r.payment_method}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="medical-requests__td medical-requests__td--actions">
                                        <div className="medical-requests__actions">
                                            {(r.payment_status !== 'paid' && r.payment_status !== 'bonified') && (user?.role === 'secretary' || user?.role === 'doctor') && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm-compact"
                                                        onClick={() => setPaymentModal({
                                                            open: true,
                                                            initialData: {
                                                                type: 'income_patient',
                                                                amount: r.resolved_debt_amount || r.debt_amount,
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
                                                        icon={<Icon name="payments" size="1rem" />}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm-compact"
                                                        onClick={() => onBonify(r.id)}
                                                        title={t('bonify') || 'Bonificar'}
                                                        icon={<Icon name="card_giftcard" size="1rem" />}
                                                    />
                                                </>
                                            )}

                                            {(user?.role === 'doctor' || user?.role === 'secretary') && isPending && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => openActionModal('completed', r.id)}
                                                    title={t('mark_as_done')}
                                                    icon={<Icon name="task_alt" size="1rem" />}
                                                />
                                            )}

                                            {(user?.role === 'doctor' || user?.role === 'secretary') && isPending && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => openActionModal('rejected', r.id)}
                                                    title={t('reject')}
                                                    icon={<Icon name="block" size="1rem" />}
                                                />
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                onClick={() => handleEditRequest({ ...r, _origin: 'request', _readOnly: true })}
                                                title={t('view') || 'Ver'}
                                                icon={<Icon name="visibility" size="1rem" />}
                                            />

                                            {(user?.role === 'admin' || canDelete) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => handleEditRequest({ ...r, _origin: 'request' })}
                                                    title={t('edit') || 'Editar'}
                                                    icon={<Icon name="edit" size="1rem" />}
                                                />
                                            )}

                                            {(canDelete || user?.role === 'admin' || (user?.role === 'doctor' && (isPending || isToday(r.completed_at || r.updated_at)))) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => handleDeleteRequest(r.id, r)}
                                                    title="Eliminar"
                                                    icon={<Icon name="delete" size="1rem" />}
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </article>

            {totalPages > 1 && (
                <footer className="medical-requests__pagination">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={onPageChange}
                        t={t}
                    />
                </footer>
            )}
        </section>
    );
};

export default MedicalRequestList;
