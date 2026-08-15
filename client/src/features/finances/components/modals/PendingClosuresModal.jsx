import React, { useState } from 'react';
import Modal from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { CashBalancingModal } from './CashBalancingModal';

import styles from './PendingClosuresModal.module.css';

/**
 * PendingClosuresModal Feature Molecule.
 * Displays a list of unclosed cash box days.
 * Integrated with the new Automatic Balancing (Arqueo) system.
 */
export const PendingClosuresModal = ({ 
    isOpen, 
    onClose, 
    pendingClosures, 
    onAutoClosure, 
    onResetDay, 
    t 
}) => {
    const [balancingDay, setBalancingDay] = useState(null);

    const handleOpenBalancing = (day) => {
        setBalancingDay(day);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('pending_closures_title').replace('{count}', pendingClosures.length)}
            size="lg"
            footer={
                <div className={styles.PendingClosuresModal__pendingClosuresFooter}>
                    <Button variant="secondary" onClick={onClose}>
                        {t('close_action')}
                    </Button>
                </div>
            }
        >
            <div className={`${styles.PendingClosuresModal__pendingClosuresContainer} animate-fade-in`}>
                <div className={styles.PendingClosuresModal__pendingClosuresHeaderActions}>
                    <p className={styles.PendingClosuresModal__pendingClosuresDescription}>
                        {t('pending_closures_desc') || 'Días con movimientos de dinero que aún no han sido entregados.'}
                    </p>
                </div>

                <div className={styles.PendingClosuresModal__pendingClosuresTableContainer}>
                    <table className={styles.PendingClosuresModal__root}>
                        <thead>
                            <tr>
                                <th>{t('date_label')}</th>
                                <th className={styles.PendingClosuresModal__cellRight}>{t('cash_balance')}</th>
                                <th className={styles.PendingClosuresModal__cellRight}>{t('virtual_balance')}</th>
                                <th className={styles.PendingClosuresModal__cellCenter}>{t('actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingClosures.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className={styles.PendingClosuresModal__empty}>
                                        {t('all_caught_up')} {t('no_closures_pending')}
                                    </td>
                                </tr>
                            ) : (
                                pendingClosures.map((day) => {
                                    const itemKey = `${day.date}_${day.doctor_id}`;

                                    return (
                                        <tr key={itemKey}>
                                            <td className="pending-closures-table__date">
                                                <div className={styles.PendingClosuresModal__dateGroup}>
                                                    <span className={styles.PendingClosuresModal__dateText}>{day.date}</span>
                                                    <span className={styles.PendingClosuresModal__doctorText}>{day.doctor_name || 'General'}</span>
                                                </div>
                                            </td>
                                            <td className={`${styles.PendingClosuresModal__balanceCash} ${styles.PendingClosuresModal__cellRight}`}>
                                                ${day.balance.toLocaleString()}
                                            </td>
                                            <td className={`${styles.PendingClosuresModal__balanceVirtual} ${styles.PendingClosuresModal__cellRight}`}>
                                                ${(day.transferBalance || 0).toLocaleString()}
                                            </td>
                                            <td className={styles.PendingClosuresModal__actions}>
                                                <Button
                                                    size="sm-compact"
                                                    variant="primary"
                                                    onClick={() => handleOpenBalancing(day)}
                                                    icon={<Icon name="account_balance_wallet" />}
                                                >
                                                    {t('deliver_action') || 'Hacer Arqueo'}
                                                </Button>
                                                <Button
                                                    size="sm-compact"
                                                    variant="outline-danger"
                                                    onClick={() => onResetDay(day.date, day.doctor_id)}
                                                    title={t('reset_day_title')}
                                                    icon={<Icon name="RESTORE" size="1rem" />}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Sub-Modal for the actual balancing process */}
            {balancingDay && (
                <CashBalancingModal
                    isOpen={!!balancingDay}
                    onClose={() => setBalancingDay(null)}
                    day={balancingDay}
                    onConfirm={onAutoClosure}
                    t={t}
                />
            )}
        </Modal>
    );
};

