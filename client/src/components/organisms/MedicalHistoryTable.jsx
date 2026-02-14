import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { timeAgo } from '../../utils/time';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import './MedicalHistoryTable.css';

const MedicalHistoryTable = ({ items, filterItem, onView, onDelete, icon, title, originLabel, canDelete }) => {
    const { t } = useLanguage();
    const { user } = useAuth();

    const showDelete = canDelete !== undefined ? canDelete : (user.role === 'admin' || user.role === 'secretary');

    // Safety check for items and filterItem function
    const safeItems = Array.isArray(items) ? items : [];
    const filteredItems = typeof filterItem === 'function' ? safeItems.filter(filterItem) : safeItems;

    return (
        <div className="medical-history">
            <h3 className="medical-history__title">
                <span className="medical-history__title-icon">
                    <Icon name={icon} size="1.2rem" />
                </span>
                {title}
            </h3>

            <div className="medical-history__container">
                <table className="medical-history__table">
                    <thead>
                        <tr>
                            <th className="medical-history__th medical-history__th--date">{t('date')}</th>
                            <th className="medical-history__th">{t('patient')}</th>
                            <th className="medical-history__th medical-history__th--detail">{t('detail')}</th>
                            <th className="medical-history__th">{t('doctor')}</th>
                            <th className="medical-history__th medical-history__th--actions">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map(item => (
                            <tr key={`${item._origin}_${item.id}`} className="medical-history__row">
                                <td className="medical-history__td">
                                    <div className="medical-history__date-cell">
                                        <span className="medical-history__date">{new Date(item.appointment_date || item.created_at).toLocaleDateString()}</span>
                                        <span className="medical-history__time-ago">{timeAgo(item.appointment_date || item.created_at)}</span>
                                    </div>
                                </td>
                                <td className="medical-history__td">
                                    <div className="medical-history__patient-cell">
                                        <span className="medical-history__patient-name">{item.patient_name}</span>
                                        {item._origin === 'request' && (
                                            <span className="medical-history__origin-tag">
                                                {originLabel || t('request')}
                                            </span>
                                        )}
                                    </div>
                                </td>
                                <td className="medical-history__td">
                                    <div className="medical-history__detail" title={item.medications || item.request_note || item.diagnosis || item.description}>
                                        {item.medications || item.request_note || item.diagnosis || item.description}
                                    </div>
                                </td>
                                <td className="medical-history__td">
                                    <div className="medical-history__doctor-name">Dr. {item.doctor_name}</div>
                                </td>
                                <td className="medical-history__td">
                                    <div className="medical-history__actions">
                                        <Button
                                            variant="ghost"
                                            size="sm-compact"
                                            onClick={() => onView(item)}
                                            title={t('view')}
                                            icon={<Icon name="visibility" size="1rem" />}
                                        />
                                        {showDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                onClick={() => onView(item)}
                                                title={t('edit')}
                                                icon={<Icon name="edit" size="1rem" />}
                                            />
                                        )}
                                        {showDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm-compact"
                                                onClick={() => onDelete(item.id, item)}
                                                title={t('delete')}
                                                icon={<Icon name="delete" size="1rem" />}
                                            />
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredItems.length === 0 && (
                    <div className="medical-history__empty">
                        <p>{t('none_found')}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicalHistoryTable;
