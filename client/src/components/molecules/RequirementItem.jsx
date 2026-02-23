import React from 'react';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import { formatDate } from '../../utils/dateUtils';
import './RequirementItem.css';

/**
 * RequirementItem Molecule.
 * Represents a single row in the requirements table.
 */
const RequirementItem = ({
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
    const { id, type, created_at, patient_name, doctor_name, secretary_name, status, payment_status, debt_amount, payment_method, patient_id, patient_user_id, doctor_id } = request;

    return (
        <tr className="requirement-item">
            <td className="requirement-item__cell">
                <Badge
                    variant={type === 'prescription' ? 'blue' : 'green'}
                    className="requirement-item__badge-clickable"
                    onClick={() => onSelect(request)}
                    title={t('view_detail') || "Ver detalle"}
                >
                    {typeLabel}
                </Badge>
            </td>
            <td className="requirement-item__cell">{formatDate(created_at)}</td>
            <td className="requirement-item__cell requirement-item__patient-name">
                {patient_name}
            </td>
            <td className="requirement-item__cell">
                <span className="requirement-item__doctor">Dr. {doctor_name}</span>
            </td>
            <td className="requirement-item__cell">
                <span className="requirement-item__author">
                    {secretary_name || 'Secretaría'}
                </span>
            </td>
            <td className="requirement-item__cell">
                <Badge variant={status}>
                    {t(status) || status}
                </Badge>
            </td>
            <td className="requirement-item__cell">
                <div className="requirement-item__actions">
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

export default RequirementItem;
