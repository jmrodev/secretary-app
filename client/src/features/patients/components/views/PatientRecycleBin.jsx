import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { formatDate, formatTime } from '@/utils/core/dateUtils';
import Loading from '@/components/atoms/Loading';
import './PatientRecycleBin.css';

/**
 * PatientRecycleBin (Executor).
 * Renders a list of deleted patients for restoration.
 */
const PatientRecycleBin = ({
    recycleItems = [],
    onRestore,
    loading
}) => {
    const { t } = useLanguage();

    if (loading) {
        return (
            <div className="patient-recycle-bin__loading">
                <Loading text={t('loading')} />
            </div>
        );
    }

    if (!recycleItems || recycleItems.length === 0) {
        return (
            <div className="patient-recycle-bin__empty-state">
                <div className="patient-recycle-bin__empty-icon"><Icon name="delete" size="2rem" /></div>
                <p className="patient-recycle-bin__empty-title">{t('recycle_bin_empty') || 'La papelera está vacía.'}</p>
                <p className="patient-recycle-bin__empty-text">Los pacientes eliminados aparecerán aquí por 30 días.</p>
            </div>
        );
    }

    return (
        <div className="patient-recycle-bin animate-fade-in">
            <div className="patient-recycle-bin__container">
                <table className="patient-recycle-bin__table">
                    <thead>
                        <tr>
                            <th className="w-1/3">{t('patient') || 'Paciente'}</th>
                            <th className="w-1/4">{t('contact_info') || 'Contacto'}</th>
                            <th className="w-1/4">{t('deleted_date') || 'Fecha Eliminación'}</th>
                            <th className="w-1/6 text-right">{t('actions') || 'Acciones'}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recycleItems.map((item) => (
                            <tr key={item.id} className="patient-recycle-bin__row">
                                <td>
                                    <div className="patient-recycle-bin__patient-wrapper">
                                        <span className="patient-recycle-bin__patient-name">
                                            {item.last_name && item.first_name
                                                ? `${item.last_name}, ${item.first_name}`
                                                : (item.entity_name || item.full_name || item.username || 'Sin Nombre')}
                                        </span>
                                        {item.dni && (
                                            <span className="patient-recycle-bin__patient-dni">
                                                DNI: {item.dni}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td>
                                    <div className="patient-recycle-bin__contact-info">
                                        {item.phone ? (
                                            <div className="patient-recycle-bin__contact-item">
                                                <span className="opacity-70"><Icon name="phone" size="1rem" /></span> {item.phone}
                                            </div>
                                        ) : (
                                            <span className="patient-recycle-bin__contact-missing">Sin teléfono</span>
                                        )}
                                        {item.email ? (
                                            <div className="patient-recycle-bin__contact-item">
                                                <span className="opacity-70"><Icon name="mail" size="1rem" /></span> {item.email}
                                            </div>
                                        ) : null}
                                    </div>
                                </td>
                                <td>
                                    <div className="patient-recycle-bin__date-wrapper">
                                        <span className="patient-recycle-bin__date">
                                            {formatDate(item.deleted_at || item.created_at)}
                                        </span>
                                        <span className="patient-recycle-bin__time">
                                            {formatTime(item.deleted_at || item.created_at)}
                                        </span>
                                    </div>
                                </td>
                                <td className="text-right">
                                    <div className="patient-recycle-bin__actions">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="patient-recycle-bin__action-btn--restore"
                                            onClick={() => onRestore && onRestore(item.id)}
                                            title={t('restore') || 'Restaurar'}
                                            icon={<Icon name="restore" />}
                                        >
                                            {t('restore') || 'Restaurar'}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="patient-recycle-bin__footer-hint">
                <p><Icon name="warning" size="1rem" className="mr-1" />Los pacientes eliminados permanentemente no se pueden recuperar.</p>
            </div>
        </div>
    );
};

export default React.memo(PatientRecycleBin);
