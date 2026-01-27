
import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils/time';
import Button from '../atoms/Button';
import Card from '../atoms/Card';

const MedicalHistoryTable = ({ items, filterItem, onView, onDelete, icon, title, originLabel, canDelete }) => {
    const { t } = useLanguage();
    const { user } = useAuth();

    // Fallback if canDelete is not provided (backwards compatibility or default behavior)
    // If canDelete is explicitly provided (boolean), use it. 
    // Otherwise fallback to existing logic: admin or secretary can delete.
    const showDelete = canDelete !== undefined ? canDelete : (user.role === 'admin' || user.role === 'secretary');

    const filteredItems = items.filter(filterItem);

    return (
        <div className="flex flex-col gap-4 animate-fadeIn">
            <h3 className="section-title flex items-center gap-2 mb-0">
                <span>{icon}</span> {title}
            </h3>

            <Card className="p-0 overflow-hidden shadow-sm border-slate-200">
                <div className="table-responsive">
                    <table className="table-base w-full">
                        <thead>
                            <tr>
                                <th className="pl-6">{t('date')}</th>
                                <th>{t('patient')}</th>
                                <th className="w-1/3">{t('detail')}</th>
                                <th>{t('doctor')}</th>
                                <th className="text-right pr-6">{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredItems.map(item => (
                                <tr key={`${item._origin}_${item.id}`} className="hover:bg-slate-50 transition-colors">
                                    <td className="pl-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-main-800">{new Date(item.appointment_date || item.created_at).toLocaleDateString()}</span>
                                            <span className="text-xs text-muted">{timeAgo(item.appointment_date || item.created_at)}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <span className="font-bold text-main-900">{item.patient_name}</span>
                                            {item._origin === 'request' && (
                                                <span className="tag tag-slate text-[10px] w-fit font-bold uppercase tracking-widest mt-0.5">
                                                    {originLabel || t('request')}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm text-slate-600 italic line-clamp-2" title={item.medications || item.request_note || item.diagnosis || item.description}>
                                            {item.medications || item.request_note || item.diagnosis || item.description}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-sm font-medium text-main-600">Dr. {item.doctor_name}</div>
                                    </td>
                                    <td className="pr-6 text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                onClick={() => onView(item)}
                                                className="text-blue-500 hover:bg-blue-50"
                                                title={t('view')}
                                                icon="👁️"
                                            />
                                            {showDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => onView(item)}
                                                    className="text-indigo-500 hover:bg-indigo-50"
                                                    title={t('edit')}
                                                    icon="✏️"
                                                />
                                            )}
                                            {showDelete && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => onDelete(item.id, item)}
                                                    className="text-red-400 hover:bg-red-50"
                                                    title="Delete"
                                                    icon="🗑️"
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredItems.length === 0 && (
                    <div className="p-12 text-center text-muted border-dashed bg-slate-50/50">
                        <p className="font-medium">{t('none_found')}</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default MedicalHistoryTable;
