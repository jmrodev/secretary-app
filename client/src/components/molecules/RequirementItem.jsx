import React from 'react';
import Badge from '../atoms/Badge';
import Button from '../atoms/Button';

/**
 * RequirementItem molecule for table rows.
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
        <tr>
            <td>
                <Badge
                    variant={type === 'prescription' ? 'blue' : 'green'}
                    className="badge--interactive"
                    onClick={() => onSelect(request)}
                    title={t('view_detail') || "Ver detalle"}
                >
                    {typeLabel}
                </Badge>
            </td>
            <td>{new Date(created_at).toLocaleDateString()}</td>
            <td><strong>{patient_name}</strong></td>
            <td><span className="text-muted">Dr. {doctor_name}</span></td>
            <td>
                <span className="requirements-list__author">
                    {secretary_name || 'Secretaría'}
                </span>
            </td>
            <td>
                <Badge variant={status}>
                    {t(status) || status}
                </Badge>
            </td>
            <td>
                <div className="requirements-list__actions">
                    {canDelete && (
                        <Button
                            variant="ghost"
                            size="sm-compact"
                            className="btn--danger"
                            onClick={() => onDelete(id)}
                            title={t('delete') || "Eliminar"}
                        >
                            🗑️
                        </Button>
                    )}
                    {isAdminOrSecretary && status === 'consult' && (
                        <Button
                            variant="ghost"
                            size="sm-compact"
                            onClick={() => onAction('reply', id)}
                            title={t('reply')}
                        >
                            💬
                        </Button>
                    )}
                    {(status === 'pending' || status === 'consult') && (
                        <>
                            <Button
                                variant="ghost"
                                size="sm-compact"
                                onClick={() => onAction('completed', id)}
                                title={t('mark_as_done')}
                            >
                                ✅
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm-compact"
                                onClick={() => onAction('consult', id)}
                                title={t('consult_secretary')}
                            >
                                ❓
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm-compact"
                                className="btn--danger"
                                onClick={() => onAction('rejected', id)}
                                title={t('reject')}
                            >
                                ❌
                            </Button>
                        </>
                    )}
                </div>
            </td>
        </tr>
    );
};

export default RequirementItem;
