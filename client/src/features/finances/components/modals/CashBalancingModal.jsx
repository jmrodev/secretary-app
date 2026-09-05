import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Icon } from '@/components/atoms/Icon';
import { FormGroup } from '@/components/molecules/FormGroup';
import styles from './CashBalancingModal.module.css';

/**
 * CashBalancingModal Molecule.
 * Handles the actual balancing (Arqueo) of a specific day or today's cash.
 */
const CashBalancingModalBase = ({ 
    isOpen, 
    onClose, 
    day, 
    onConfirm, 
    doctors = [], 
    onSelectDoctor,
    t 
}) => {
    const [selectedDoctorId, setSelectedDoctorId] = useState(day?.doctor_id || '');
    const [physicalBalance, setPhysicalBalance] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    // Initial sync
    useEffect(() => {
        if (day) {
            setSelectedDoctorId(day.doctor_id || '');
            const initialTheoretical = Number(day.balance || 0);
            setPhysicalBalance(initialTheoretical > 0 ? String(initialTheoretical) : '');
            setNotes('');
        }
    }, [day]);

    const theoretical = Number(day?.balance || 0);
    const actual = physicalBalance === '' ? 0 : Number(physicalBalance);
    const difference = actual - theoretical;

    const handleDoctorChange = (e) => {
        const docId = e.target.value;
        setSelectedDoctorId(docId);
        if (onSelectDoctor) {
            onSelectDoctor(docId);
        }
    };

    const handleQuickFill = () => {
        setPhysicalBalance(String(theoretical));
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm({
                doctor_id: selectedDoctorId || day?.doctor_id || null,
                balancing_date: day?.date,
                theoretical_balance: theoretical,
                physical_balance: actual,
                notes
            });
            onClose();
        } catch (err) {
            console.error('[CashBalancingModal] Error during confirmation:', err);
        } finally {
            setLoading(false);
        }
    };

    const differenceText = difference > 0
        ? `+$${difference.toLocaleString()}`
        : (difference < 0 ? `-$${Math.abs(difference).toLocaleString()}` : `$0`);

    const modalTitle = day?.isToday 
        ? `${t('today_cash_balancing') || 'Arqueo de Hoy'} (${day?.date})`
        : t('balancing_title', { date: day?.date });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={modalTitle}
            size="md"
            footer={
                <div className={styles.CashBalancingModal__footer}>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button 
                        variant="primary" 
                        onClick={handleConfirm} 
                        disabled={loading || physicalBalance === ''}
                        icon={<Icon name="check" />}
                    >
                        {loading ? t('processing') : t('confirm_and_close')}
                    </Button>
                </div>
            }
        >
            <div className={`${styles.CashBalancingModal__body} animate-fade-in`}>
                {day?.isToday && doctors.length > 0 && (
                    <FormGroup label={t('select_doctor_for_balancing') || 'Seleccionar profesional:'}>
                        <select 
                            className={styles.CashBalancingModal__select}
                            value={selectedDoctorId}
                            onChange={handleDoctorChange}
                        >
                            <option value="">{t('all_doctors') || 'Todos / Clínica General'}</option>
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>
                                    {doc.full_name}
                                </option>
                            ))}
                        </select>
                    </FormGroup>
                )}

                <div className={styles.CashBalancingModal__statsGrid}>
                    <div className={styles.CashBalancingModal__statItem}>
                        <div className={styles.CashBalancingModal__statValue}>
                            ${theoretical.toLocaleString()}
                        </div>
                        <div className={styles.CashBalancingModal__statLabel}>
                            {t('theoretical_balance')} (Sistema)
                        </div>
                    </div>
                    <div className={`${styles.CashBalancingModal__statItem} ${difference < 0 ? styles.CashBalancingModal__statItemNegative : (difference > 0 ? styles.CashBalancingModal__statItemPositive : '')}`}>
                        <div className={`${styles.CashBalancingModal__statValue} ${difference < 0 ? styles.CashBalancingModal__diffNegative : (difference > 0 ? styles.CashBalancingModal__diffPositive : '')}`}>
                            {differenceText}
                        </div>
                        <div className={styles.CashBalancingModal__statLabel}>
                            {t('difference_label')} {difference > 0 ? '(Sobrante)' : (difference < 0 ? '(Faltante)' : '(Exacto)')}
                        </div>
                    </div>
                </div>

                <FormGroup label={t('physical_cash')}>
                    <div className={styles.CashBalancingModal__inputWithAction}>
                        <Input
                            type="number"
                            value={physicalBalance}
                            onChange={e => setPhysicalBalance(e.target.value)}
                            placeholder={t('physical_cash_placeholder') || '0.00'}
                            autoFocus
                            className={styles.CashBalancingModal__amountInput}
                        />
                        {physicalBalance !== String(theoretical) && (
                            <Button 
                                size="sm" 
                                variant="secondary" 
                                onClick={handleQuickFill}
                                title={t('quick_fill') || 'Rellenar con saldo del sistema'}
                                icon={<Icon name="sync" size="0.9rem" />}
                            >
                                {t('match_system_amount') || 'Coincide con sistema'}
                            </Button>
                        )}
                    </div>
                </FormGroup>

                <FormGroup label={`${t('balancing_notes')} (${t('optional_label') || 'opcional'})`}>
                    <Input
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder={t('balancing_notes_placeholder') || 'Observaciones sobre el arqueo...'}
                    />
                </FormGroup>
            </div>
        </Modal>
    );
};

export const CashBalancingModal = React.memo(CashBalancingModalBase);