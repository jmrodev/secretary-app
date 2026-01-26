
import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils/time';

const MedicalHistoryTable = ({ items, filterItem, onView, onDelete, icon, title, originLabel }) => {
    const { t } = useLanguage();
    const { user } = useAuth();

    return (
        <div className="medical-history">
            <h3 className="medical-history__title">
                <span>{icon}</span> {title}
            </h3>
            <div className="table-responsive">
                <table className="table-base">
                    <thead>
                        <tr>
                            <th>{t('date')}</th>
                            <th>{t('patient')}</th>
                            <th>{t('detail')}</th>
                            <th>{t('doctor')}</th>
                            <th className="text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.filter(filterItem).map(item => (
                            <tr key={`${item._origin}_${item.id}`} className="hover:bg-slate-50">
                                <td>
                                    <div className="flex flex-col">
                                        <span className="text-sm">{new Date(item.appointment_date || item.created_at).toLocaleDateString()}</span>
                                        <span className="text-xs text-muted">{timeAgo(item.appointment_date || item.created_at)}</span>
                                    </div>
                                </td>
                                <td>
                                    <div className="font-bold">{item.patient_name}</div>
                                    {item._origin === 'request' && <span className="tag tag-slate text-[10px] py-0 px-1">{originLabel || t('request')}</span>}
                                </td>
                                <td>
                                    <div className="text-sm italic truncate max-w-xs" title={item.medications || item.request_note || item.diagnosis || item.description}>
                                        {item.medications || item.request_note || item.diagnosis || item.description}
                                    </div>
                                </td>
                                <td>Dr. {item.doctor_name}</td>
                                <td>
                                    <div className="flex justify-end gap-1">
                                        <button onClick={() => onView(item)} className="btn-icon-base btn-icon-blue" title={t('view')}>👁️</button>
                                        {(user.role === 'admin' || user.role === 'secretary') && (
                                            <button
                                                onClick={() => onDelete(item.id, item)}
                                                className="btn-icon-base btn-icon-red"
                                                title="Delete"
                                            >
                                                🗑️
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {items.filter(filterItem).length === 0 && (
                <div className="card text-center p-12">
                    <p className="text-main-500">{t('none_found')}</p>
                </div>
            )}
        </div>
    );
};

export default MedicalHistoryTable;
