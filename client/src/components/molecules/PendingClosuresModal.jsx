
import React from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';

import './PendingClosuresModal.css';

const PendingClosuresModal = ({ isOpen, onClose, pendingClosures, duplicateClosures, onAutoClosure, onCloseAll, onFixDuplicates, onResetDay, t }) => {
    // pendingClosures is array of { date, balance, doctor_id, lastTime }
    const [processingDate, setProcessingDate] = React.useState(null);

    const handleClosure = async (day) => {
        if (processingDate) return;
        const itemKey = `${day.date}_${day.doctor_id}`;
        setProcessingDate(itemKey);
        await onAutoClosure(day);
        setProcessingDate(null);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('pending_closures_title').replace('{count}', pendingClosures.length)}
            size="lg"
        >
            <div className="pending-closures-container">
                {duplicateClosures && duplicateClosures.length > 0 && (
                    <div className="pending-closures-alert">
                        <div className="pending-closures-alert__title">
                            ⚠️ {t('duplicate_closures_alert').replace('{count}', duplicateClosures.length)}
                        </div>
                        <p>{t('fix_duplicates_desc')}</p>
                        <Button
                            size="sm"
                            variant="primary"
                            className="bg-red-600 hover:bg-red-700 text-white w-fit mt-2"
                            onClick={onFixDuplicates}
                        >
                            {t('fix_conflicts_btn')}
                        </Button>
                    </div>
                )}

                <div className="pending-closures-header-actions">
                    <p className="pending-closures-description">
                        {t('pending_closures_desc')}
                    </p>
                    {pendingClosures.length > 1 && (
                        <Button
                            variant="primary"
                            size="md"
                            onClick={onCloseAll}
                            className="pending-closures-btn-all"
                        >
                            {t('deliver_all_month').replace('{count}', pendingClosures.length)}
                        </Button>
                    )}
                </div>

                <div className="pending-closures-table-container">
                    <table className="pending-closures-table">
                        <thead>
                            <tr>
                                <th>{t('date_label')}</th>
                                <th>{t('cash_balance')}</th>
                                <th>{t('virtual_balance')}</th>
                                <th>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingClosures.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="pending-closures-table__empty">
                                        {t('all_caught_up')} {t('no_closures_pending')}
                                    </td>
                                </tr>
                            ) : (
                                pendingClosures.map((day) => {
                                    const itemKey = `${day.date}_${day.doctor_id}`;
                                    const isProcessing = processingDate === itemKey;

                                    return (
                                        <tr key={itemKey}>
                                            <td className="pending-closures-table__date">
                                                <div className="pending-closures-table__date-group">
                                                    <span className="pending-closures-table__date-text">{day.date}</span>
                                                    <span className="pending-closures-table__doctor-text">{day.doctor_name || 'General'}</span>
                                                </div>
                                            </td>
                                            <td className="pending-closures-table__balance--cash">
                                                ${day.balance.toLocaleString()}
                                            </td>
                                            <td className="pending-closures-table__balance--virtual">
                                                ${(day.transferBalance || 0).toLocaleString()}
                                            </td>
                                            <td className="flex gap-2 p-2">
                                                <Button
                                                    size="sm"
                                                    variant={isProcessing ? "ghost" : "primary"}
                                                    onClick={() => handleClosure(day)}
                                                    disabled={!!processingDate}
                                                >
                                                    {isProcessing ? "..." : t('deliver_action')}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="text-red-600 border-red-200"
                                                    onClick={() => onResetDay(day.date, day.doctor_id)}
                                                    disabled={!!processingDate}
                                                    title={t('reset_day_title')}
                                                >
                                                    {t('reset_action')}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="pending-closures-footer">
                    <Button variant="secondary" onClick={onClose}>
                        {t('close_action')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default PendingClosuresModal;
