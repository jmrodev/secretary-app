import React from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

import './PendingClosuresModal.css';

/**
 * PendingClosuresModal Feature Molecule.
 * Displays a list of unclosed cash box days for a doctor or institution.
 * Allows quick batch closures or fixing duplicates/conflicts.
 */
const PendingClosuresModal = ({ 
    isOpen, 
    onClose, 
    pendingClosures, 
    duplicateClosures, 
    onAutoClosure, 
    onCloseAll, 
    onFixDuplicates, 
    onResetDay, 
    t 
}) => {
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
            footer={
                <div className="pending-closures-footer">
                    <Button variant="secondary" onClick={onClose}>
                        {t('close_action')}
                    </Button>
                </div>
            }
        >
            <div className="pending-closures-container animate-fadeIn">
                {duplicateClosures && duplicateClosures.length > 0 && (
                    <div className="pending-closures-alert">
                        <div className="pending-closures-alert__title">
                            <Icon name="WARNING" size="1.2rem" />
                            {t('duplicate_closures_alert').replace('{count}', duplicateClosures.length)}
                        </div>
                        <p className="pending-closures-alert__description">{t('fix_duplicates_desc')}</p>
                        <Button
                            size="sm"
                            variant="danger"
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
                            icon={<Icon name="CONFIRMED" size="1.1rem" />}
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
                                <th className="pending-closures-table__cell--right">{t('cash_balance')}</th>
                                <th className="pending-closures-table__cell--right">{t('virtual_balance')}</th>
                                <th className="pending-closures-table__cell--center">{t('actions')}</th>
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
                                            <td className="pending-closures-table__balance--cash pending-closures-table__cell--right">
                                                ${day.balance.toLocaleString()}
                                            </td>
                                            <td className="pending-closures-table__balance--virtual pending-closures-table__cell--right">
                                                ${(day.transferBalance || 0).toLocaleString()}
                                            </td>
                                            <td className="pending-closures-table__actions">
                                                <Button
                                                    size="sm-compact"
                                                    variant={isProcessing ? "ghost" : "primary"}
                                                    onClick={() => handleClosure(day)}
                                                    disabled={!!processingDate}
                                                >
                                                    {isProcessing ? "..." : t('deliver_action')}
                                                </Button>
                                                <Button
                                                    size="sm-compact"
                                                    variant="outline-danger"
                                                    onClick={() => onResetDay(day.date, day.doctor_id)}
                                                    disabled={!!processingDate}
                                                    title={t('reset_day_title')}
                                                    icon={<Icon name="RESTORE" size="1rem" />}
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
            </div>
        </Modal>
    );
};

export default PendingClosuresModal;

