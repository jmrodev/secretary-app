import React, { useState, useEffect } from 'react';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import { useLanguage } from '../../context/LanguageContext';
import './PatientRecycleBin.css'; // Architecture compliant

const PatientRecycleBin = ({
    recycleItems = [],
    onRestore,
    loading
}) => {
    const { t } = useLanguage();

    // If loading, show spinner
    if (loading) {
        return (
            <div className="flex justify-center p-12">
                <div className="status-display__spinner"></div>
            </div>
        );
    }

    // Empty state
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
                                            {new Date(item.deleted_at || item.created_at).toLocaleDateString()}
                                        </span>
                                        <span className="text-xs text-slate-400">
                                            {new Date(item.deleted_at || item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
