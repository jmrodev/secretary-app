import React, { useState } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Icon } from '@/components/atoms/Icon';
import { FormGroup } from '@/components/molecules/FormGroup';
import styles from './CashBalancingModal.module.css';

/**
 * CashBalancingModal Molecule.
 * Handles the actual balancing (Arqueo) of a specific day.
 */
const CashBalancingModalBase = ({ isOpen, onClose, day, onConfirm, t }) => {
    const [physicalBalance, setPhysicalBalance] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const theoretical = Number(day?.balance || 0);
    const actual = Number(physicalBalance) || 0;
    const difference = actual - theoretical;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm({
                doctor_id: day.doctor_id,
                balancing_date: day.date,
                theoretical_balance: theoretical,
                physical_balance: actual,
                notes
            });
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
<Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('balancing_title', { date: day?.date })}
            size="md"
            footer={
                <div className={styles.CashBalancingModal__footer}>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button 
                        variant="primary" 
                        onClick={handleConfirm} 
                        disabled={loading || !physicalBalance}
                        icon={<Icon name="check" />}
                    >
                        {loading ? t('processing') : t('confirm_and_close')}
                    </Button>
                </div>
            }
        >
            <div className={styles.CashBalancingModal__body}>
                <div className={styles.CashBalancingModal__statsGrid}>
                    <div className={styles.CashBalancingModal__statItem}>
                        <div className={styles.CashBalancingModal__statValue}>${theoretical.toLocaleString()}</div>
                        <div className={styles.CashBalancingModal__statLabel}>{t('theoretical_balance')} (DB)</div>
                    </div>
                    <div className={styles.CashBalancingModal__statItem}>
                        <div className={`${styles.CashBalancingModal__statValue} ${difference < 0 ? styles.CashBalancingModal__diffNegative : styles.CashBalancingModal__diffPositive}`}>
                            $${difference.toLocaleString()}
                        </div>
                        <div className={styles.CashBalancingModal__statLabel}>{t('difference_label')} (Sobrante/Faltante)</div>
                    </div>
                </div>

                <FormGroup label={t('physical_cash')}>
                    <Input
                        type="number"
                        value={physicalBalance}
                        onChange={e => setPhysicalBalance(e.target.value)}
                        placeholder={t('physical_cash_placeholder')}
                        autoFocus
                        className={styles.CashBalancingModal__amountInput}
                    />
                </FormGroup>

                <FormGroup label={`${t('balancing_notes')} ${t('optional_label')}`}>
                    <Input
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder={t('balancing_notes_placeholder')}
                    />
                </FormGroup>
            </div>
        </Modal>
    );
};

export const CashBalancingModal = React.memo(CashBalancingModalBase);