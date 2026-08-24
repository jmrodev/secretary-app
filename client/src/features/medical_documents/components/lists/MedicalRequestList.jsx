
import React from 'react';
import { Pagination } from '@/components/atoms/Pagination';
import { useAuth } from '@/features/auth/AuthContext';
import { useLanguage } from '@/hooks/useLanguage';
import { isToday, formatDate } from '@/utils/core/dateUtils';
import { formatCurrency } from '@/utils/core/format';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import styles from './MedicalRequestList.module.css';

const globalClass = (cls) => cls;

/**
 * MedicalRequestList Organism (Feature-based).
 * Renders a list of medical requests (prescriptions, licenses, certificates).
 */
export const MedicalRequestList = ({
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
            <section className={`${styles.MedicalRequestList__empty} ${globalClass('animate-fade-in')}`}>
                <Icon name="description" size="3rem" className={`${styles.MedicalRequestList__emptyIcon}`} />
                {t('no_requests')}
            </section>
        );
    }

    return (
        <section className={`${styles.MedicalRequestList__root} ${loading ? globalClass('medical-requests--loading') : globalClass('animate-fade-in')}`}>
            <article className={`${styles.MedicalRequestList__container}`}>
                <table className={`${styles.MedicalRequestList__table} ${globalClass('table-base')}`}>
                    <thead>
                        <tr>
                            <th className={`${styles.MedicalRequestList__th} ${styles.MedicalRequestList__thType}`}>{t('type')}</th>
                            <th className={`${styles.MedicalRequestList__th}`}>{t('date') || 'Fecha'}</th>
                            <th className={`${styles.MedicalRequestList__th}`}>{t('patient')}</th>
                            <th className={`${styles.MedicalRequestList__th}`}>{t('doctor')}</th>
                            <th className={`${styles.MedicalRequestList__th} ${styles.MedicalRequestList__thStatus}`}>{t('status')}</th>
                            <th className={`${styles.MedicalRequestList__th} ${styles.MedicalRequestList__thPayment}`}>{t('payment')}</th>
                            <th className={`${styles.MedicalRequestList__th} ${styles.MedicalRequestList__thActions}`}>{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.map(r => {
                            const isPending = r.status === 'pending';

                            const paymentStatusClass = r.payment_status === 'paid' ? 'paid' :
                                r.payment_status === 'debt' || r.payment_status === 'partial' ? 'debt' :
                                    r.payment_status === 'bonified' ? 'bonified' : 'pending';

                            return (
                                <tr key={r.id} className={`${styles.MedicalRequestList__row} ${!isPending ? styles.MedicalRequestList__rowCompleted : ''}`}>
                                    <td className={`${styles.MedicalRequestList__td} ${globalClass('medical-requests__td--type')}`}>
                                        <div className={`${styles.MedicalRequestList__typeCell}`}>
                                            <span
                                                className={`${styles.MedicalRequestList__typeTag} ${styles.MedicalRequestList__typeTagClickable} ${globalClass(`medical-requests__type-tag--${r.type}`)}`}
                                                onClick={() => handleEditRequest({ ...r, _origin: 'request', _readOnly: true })}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        handleEditRequest({ ...r, _origin: 'request', _readOnly: true });
                                                    }
                                                }}
                                                title={t('view') || 'Ver'}
                                                role="button"
                                                tabIndex={0}
                                            >
                                                {r.type === 'prescription' ? t('prescription') : (r.type === 'license' ? t('license') : (r.type === 'certificate' ? t('certificate') : r.type))}
                                            </span>
                                            {!!r.is_patient_submitted && (
                                                <span className={`${styles.MedicalRequestList__sourceTag}`}>
                                                    <Icon name="smartphone" size="1rem" /> App
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`${styles.MedicalRequestList__td}`}>
                                        <div className={`${styles.MedicalRequestList__date}`} title={formatDate(r.created_at, { time: true })}>
                                            {formatDate(r.created_at)}
                                        </div>
                                    </td>
                                    <td className={`${styles.MedicalRequestList__td}`}>
                                        <div className={`${styles.MedicalRequestList__patientName}`}>{r.patient_name}</div>
                                    </td>
                                    <td className={`${styles.MedicalRequestList__td}`}>
                                        <div className={`${styles.MedicalRequestList__doctorName}`}>
                                            Dr. {r.doctor_name ? r.doctor_name.split(' ').pop() : '---'}
                                        </div>
                                    </td>
                                    <td className={`${styles.MedicalRequestList__td}`}>
                                        <div className={`${styles.MedicalRequestList__statusCell}`}>
                                            <span className={`${styles.MedicalRequestList__statusTag} ${globalClass(`medical-requests__status-tag--${r.status}`)}`}>
                                                {t(r.status) || r.status}
                                            </span>
                                            {r.doctor_note && (
                                                <div className={`${styles.MedicalRequestList__reply}`} title={r.doctor_note}>
                                                    <b>{t('reply')}:</b> {r.doctor_note}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`${styles.MedicalRequestList__td}`}>
                                        <div className={`${styles.MedicalRequestList__paymentInfo}`}>
                                            <div className={`${styles.MedicalRequestList__paymentBadge} ${globalClass(`medical-requests__payment-badge--${paymentStatusClass}`)}`}>
                                                <span className={`${styles.MedicalRequestList__paymentDot}`}></span>
                                                {r.payment_status === 'paid' ? t('paid') :
                                                    ((r.payment_status === 'debt' || r.payment_status === 'partial') ? `${t(r.payment_status) || (r.payment_status === 'partial' ? 'Parcial' : 'Deuda')} ${formatCurrency(r.debt_amount)}` :
                                                        (r.payment_status === 'bonified' ? (t('bonified') || 'Bonificado') : t('pending')))}
                                            </div>

                                            {r.payment_method && (
                                                <div className={`${styles.MedicalRequestList__paymentMethod}`}>
                                                    <Icon
                                                        name={r.payment_method === 'cash' ? 'payments' : r.payment_method === 'transfer' ? 'account_balance' : 'credit_card'}
                                                        size="1rem"
                                                        className={globalClass('medical-requests__payment-method-icon')}
                                                    />
                                                    {t(r.payment_method) || r.payment_method}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className={`${styles.MedicalRequestList__td} ${globalClass('medical-requests__td--actions')}`}>
                                        <div className={`${styles.MedicalRequestList__actions}`}>
                                            {(r.payment_status !== 'paid' && r.payment_status !== 'bonified') && (user?.role === 'secretary' || user?.role === 'doctor') && (
                                                <>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm-compact"
                                                        className={`${styles.MedicalRequestList__actionBtn} ${styles.MedicalRequestList__actionBtnPay}`}
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
                                                        title={t('collect') || "Cobrar"}
                                                        icon={<Icon name="payments" size="1rem" />}
                                                    />
                                                    <Button
                                                        variant="ghost"
                                                        size="sm-compact"
                                                        className={`${styles.MedicalRequestList__actionBtn} ${styles.MedicalRequestList__actionBtnBonify}`}
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
                                                    className={`${styles.MedicalRequestList__actionBtn} ${styles.MedicalRequestList__actionBtnDone}`}
                                                    onClick={() => openActionModal('completed', r.id)}
                                                    title={t('mark_as_done')}
                                                    icon={<Icon name="task_alt" size="1rem" />}
                                                />
                                            )}

                                            {(user?.role === 'doctor' || user?.role === 'secretary') && isPending && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    className={`${styles.MedicalRequestList__actionBtn} ${styles.MedicalRequestList__actionBtnReject}`}
                                                    onClick={() => openActionModal('rejected', r.id)}
                                                    title={t('reject')}
                                                    icon={<Icon name="block" size="1rem" />}
                                                />
                                            )}

                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                className={`${styles.MedicalRequestList__actionBtn} ${styles.MedicalRequestList__actionBtnView}`}
                                                onClick={() => handleEditRequest({ ...r, _origin: 'request', _readOnly: true })}
                                                title={t('view') || 'Ver'}
                                                icon={<Icon name="visibility" size="1rem" />}
                                            />

                                            {(user?.role === 'admin' || canDelete) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    className={`${styles.MedicalRequestList__actionBtn} ${styles.MedicalRequestList__actionBtnEdit}`}
                                                    onClick={() => handleEditRequest({ ...r, _origin: 'request' })}
                                                    title={t('edit') || 'Editar'}
                                                    icon={<Icon name="edit" size="1rem" />}
                                                />
                                            )}

                                            {(canDelete || user?.role === 'admin' || (user?.role === 'doctor' && (isPending || isToday(r.completed_at || r.updated_at)))) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    className={`${styles.MedicalRequestList__actionBtn} ${styles.MedicalRequestList__actionBtnDelete}`}
                                                    onClick={() => handleDeleteRequest(r.id, r)}
                                                    title={t('delete') || 'Eliminar'}
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
                <footer className={globalClass('medical-requests__pagination')}>
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

