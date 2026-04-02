
import React from 'react';
import Card from '../../../components/atoms/Card';
import Button from '../../../components/atoms/Button';
import { useLanguage } from '../../../context/LanguageContext';
import { formatDate, formatTime } from '../../../utils/dateUtils';
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
            <div className="flex justify-center p-12">
                <div className="status-display__spinner"></div>
            </div>
        );
    }

    if (!recycleItems || recycleItems.length === 0) {
        return (
            <div className="patient-recycle-bin__empty-state">
                <div className="patient-recycle-bin__empty-icon">🗑️</div>
                <p className="text-muted font-medium">{t('recycle_bin_empty') || 'La papelera está vacía.'}</p>
                <p className="text-sm text-gray-400 mt-2">Los pacientes eliminados aparecerán aquí por 30 días.</p>
            </div>
        );
    }

    return (
        <div className="patient-recycle-bin animate-fadeIn">
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
                            <tr key={item.id} className="patient-recycle-bin__row hover:bg-slate-50 transition-colors">
                                <td className="p-4 border-b border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="patient-recycle-bin__patient-name text-slate-800 text-lg font-bold">
                                            {item.last_name && item.first_name
                                                ? `${item.last_name}, ${item.first_name}`
                                                : (item.entity_name || item.full_name || item.username || 'Sin Nombre')}
                                        </span>
                                        {item.dni && (
                                            <span className="patient-recycle-bin__patient-dni text-sm bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md w-fit mt-1">
                                                DNI: {item.dni}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="p-4 border-b border-gray-100">
                                    <div className="flex flex-col gap-1 text-sm text-slate-600">
                                        {item.phone ? (
                                            <div className="flex items-center gap-2">
                                                <span className="opacity-70">📱</span> {item.phone}
                                            </div>
                                        ) : (
                                            <span className="italic text-slate-400">Sin teléfono</span>
                                        )}
                                        {item.email ? (
                                            <div className="flex items-center gap-2">
                                                <span className="opacity-70">✉️</span> {item.email}
                                            </div>
                                        ) : null}
                                    </div>
                                </td>
                                <td className="p-4 border-b border-gray-100">
                                    <div className="flex flex-col">
                                        <span className="text-slate-800 font-medium">
                                            {formatDate(item.deleted_at || item.created_at)}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {formatTime(item.deleted_at || item.created_at)}
                                        </span>
                                    </div>
                                </td>
                                <td className="p-4 border-b border-gray-100 text-right">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-green-600 border-green-200 hover:bg-green-50 hover:border-green-300 font-bold"
                                        onClick={() => onRestore && onRestore(item.id)}
                                        title={t('restore') || 'Restaurar'}
                                    >
                                        ♻️ {t('restore') || 'Restaurar'}
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 text-center text-xs text-gray-400">
                <p>⚠️ Los pacientes eliminados permanentemente no se pueden recuperar.</p>
            </div>
        </div>
    );
};

export default React.memo(PatientRecycleBin);
