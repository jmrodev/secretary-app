import React from 'react';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
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
    t
}) => {
    const { id, type, created_at, patient_name, doctor_name, secretary_name, status } = request;

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
            <td className="requirement-item__cell">{new Date(created_at).toLocaleDateString()}</td>
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
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="sm-compact"
                            onClick={() => onDelete(id)}
                            title={t('delete') || "Eliminar"}
                            icon={<Icon name="delete" size="1rem" className="text-danger" />}
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
                                variant="ghost"
                                size="sm-compact"
                                onClick={() => onAction('completed', id)}
                                title={t('mark_as_done')}
                                icon={<Icon name="check_circle" size="1rem" className="text-success" />}
                            />
                            <Button
                                variant="ghost"
                                size="sm-compact"
                                onClick={() => onAction('consult', id)}
                                title={t('consult_secretary')}
                                icon={<Icon name="help" size="1rem" className="text-warning" />}
                            />
                            <Button
                                variant="ghost"
                                size="sm-compact"
                                onClick={() => onAction('rejected', id)}
                                title={t('reject')}
                                icon={<Icon name="cancel" size="1rem" className="text-danger" />}
                            />
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default RequirementItem;
