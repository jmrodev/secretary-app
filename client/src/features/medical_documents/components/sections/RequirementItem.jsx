import React from 'react';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { formatDate } from '@/utils/core/dateUtils';
import styles from './RequirementItem.module.css';

/**
 * RequirementItem Feature Molecule.
 * Represents a single row in the documentary requirements table.
 * Orchestrates status transitions and administrative actions for medical requests.
 */
export const RequirementItem = ({
    request,
    typeLabel,
    onSelect,
    onDelete,
    onAction,
    canDelete,
    isAdminOrSecretary,
    setPaymentModal,
    t
}) => {
    const { id, type, created_at, patient_name, status, payment_status, debt_amount, payment_method, patient_id, patient_user_id, doctor_id } = request;

    return (
        <tr className={`${styles.RequirementItem__root} animate-fade-in`}>
            <td className={`${styles.RequirementItem__cell}`}>
                <Badge
                    variant={type === 'prescription' ? 'blue' : 'green'}
                    className={`${styles.RequirementItem__badgeClickable}`}
                    onClick={() => onSelect(request)}
                    title={t('view_detail') || "Ver detalle"}
                >
                    {typeLabel}
                </Badge>
            </td>
            <td className={`${styles.RequirementItem__cell}`}>{formatDate(created_at)}</td>
            <td className={`${styles.RequirementItem__cell} ${styles.RequirementItem__patientName}`}>
                {patient_name}
            </td>
            <td className={`${styles.RequirementItem__cell}`}>
                <div className={`${styles.RequirementItem__statusGroup}`}>
                    <Badge variant={status}>
                        {t(status) || status}
                    </Badge>
                    {payment_status && (
                        <Badge variant={payment_status === 'paid' ? 'success' : (payment_status === 'bonified' ? 'premium' : 'warning')} size="sm">
                            {payment_status === 'paid' ? `$${request.paid_amount || 0}` : (payment_status === 'bonified' ? t('bonified') : `$${debt_amount || 0}`)}
                        </Badge>
                    )}
                </div>
            </td>
            <td className={`${styles.RequirementItem__cell}`}>
                <div className={`${styles.RequirementItem__actions}`}>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onSelect(request)}
                        title={t('view') || "Ver"}
                        icon={<Icon name="visibility" size="1rem" />}
                    />
                    {canDelete && (
                        <Button
                            variant="outline-danger"
                            size="sm-compact"
                            onClick={() => onDelete(id)}
                            title={t('delete') || "Eliminar"}
                            icon={<Icon name="delete" size="1rem" />}
                        />
                    )}
                    {setPaymentModal && payment_status && payment_status !== 'paid' && payment_status !== 'bonified' && isAdminOrSecretary && (
                        <Button
                            variant="ghost"
                            size="sm-compact"
                            onClick={() => setPaymentModal({
                                open: true,
                                initialData: {
                                    type: 'income_patient',
                                    amount: request.resolved_debt_amount || debt_amount,
                                    description: `Solicitud: ${typeLabel} - ${patient_name}`,
                                    patientId: patient_id,
                                    patientUserId: patient_user_id,
                                    patientName: patient_name,
                                    doctorId: doctor_id,
                                    method: payment_method || 'cash',
                                    serviceType: type === 'license' ? 'medical_license' : (type === 'prescription' ? 'prescription' : 'certificate')
                                },
                                reqId: id
                            })}
                            title={t('pay') || 'Cobrar'}
                            icon={<Icon name="payments" size="1rem" />}
                        />
                    )}
                    {isAdminOrSecretary && status === 'consult' && (
                        <Button
                            variant="ghost"
                            size="sm-compact"
                            onClick={() => onAction('reply', id)}
                            title={t('reply')}
                            icon={<Icon name="chat" size="1rem" />}
                        />
                    )}
                    {(status === 'pending' || status === 'consult') && (
                        <>
                            <Button
                                variant="outline-success"
                                size="sm-compact"
                                onClick={() => onAction('completed', id)}
                                title={t('mark_as_done')}
                                icon={<Icon name="check_circle" size="1rem" />}
                            />
                            <Button
                                variant="outline-warning"
                                size="sm-compact"
                                onClick={() => onAction('consult', id)}
                                title={t('consult_secretary')}
                                icon={<Icon name="help" size="1rem" />}
                            />
                            <Button
                                variant="outline-danger"
                                size="sm-compact"
                                onClick={() => onAction('rejected', id)}
                                title={t('reject')}
                                icon={<Icon name="cancel" size="1rem" />}
                            />
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

