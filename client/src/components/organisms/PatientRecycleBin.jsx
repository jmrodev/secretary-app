import React from 'react';
import Card from '../atoms/Card';
import Button from '../atoms/Button';
import { useLanguage } from '../../context/LanguageContext';

const PatientRecycleBin = ({
    recycleItems = [],
    onRestore,
    onPermanentDelete,
    loading
}) => {
    const { t } = useLanguage();

    if (loading) {
        return <div className="status-display"><div className="status-display__spinner"></div></div>;
    }

    if (recycleItems.length === 0) {
        return (
            <div className="card text-center p-12 border-dashed">
                <span className="text-4xl block mb-2">🗑️</span>
                <p className="text-muted">{t('recycle_bin_empty') || 'La papelera está vacía.'}</p>
            </div>
        );
    }

    return (
        <Card className="p-0 overflow-hidden" title={`${t('deleted_patients') || 'Pacientes Eliminados'} (${recycleItems.length})`}>
            <div className="table-responsive">
                <table className="table-base w-full">
                    <thead>
                        <tr>
                            <th>{t('patient')}</th>
                            <th>{t('dni')}</th>
                            <th>{t('deleted_date') || 'Fecha Eliminación'}</th>
                            <th className="text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recycleItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                <td className="font-bold text-main-800">{item.full_name || item.username}</td>
                                <td>{item.dni || '-'}</td>
                                <td className="text-sm text-muted">
                                    {new Date(item.deleted_at || item.created_at).toLocaleDateString()}
                                </td>
                                <td className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Button
                                            size="sm-compact"
                                            variant="secondary"
                                            className="text-green-600 hover:bg-green-50"
                                            onClick={() => onRestore && onRestore(item.id)}
                                            title={t('restore')}
                                        >
                                            ♻️ {t('restore')}
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default React.memo(PatientRecycleBin);
