import React, { useState } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Icon } from '@/components/atoms/Icon';
import { FormGroup } from '@/components/molecules/FormGroup';
import styles from './CashBalancingModal.module.css';

/**
 * CashBalancingDialogContent Molecule.
 * Internal form body cleanly initialized per active day balancing instance.
 */
const CashBalancingDialogContent = ({
    onClose,
    day,
    onConfirm,
    doctors = [],
    onSelectDoctor,
    t
}) => {
    const [selectedDoctorId, setSelectedDoctorId] = useState(() => day?.doctor_id || '');
    const theoretical = Number(day?.balance || 0);
    const [physicalBalance, setPhysicalBalance] = useState(() => (theoretical > 0 ? String(theoretical) : ''));
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

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
                difference,
                notes: notes.trim()
            });
            onClose();
        } catch (err) {
            console.error('[CashBalancingModal] Error during confirmation:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title={`${t('cash_balancing_title') || 'Arqueo de Caja'}: ${day?.date}`}
            size="medium"
            footer={
                <div className={styles.CashBalancingModal__footer}>
                    <Button variant="secondary" onClick={onClose} disabled={loading}>
                        {t('cancel')}
                    </Button>
                    <Button variant="primary" onClick={handleConfirm} disabled={loading || physicalBalance === ''}>
                        {loading ? t('processing') : (t('confirm_balancing') || 'Confirmar Arqueo')}
                    </Button>
                </div>
            }
        >
            <div className={`${styles.CashBalancingModal__body} animate-fade-in`}>
                {day?.isToday && doctors.length > 0 && (
                    <FormGroup label={t('filter_by_doctor')}>
                        <select
                            value={selectedDoctorId}
                            onChange={handleDoctorChange}
                            className={styles.CashBalancingModal__select}
                        >
                            <option value="">{t('all_doctors_general') || 'General (Todos los Médicos)'}</option>
                            {doctors.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.full_name}
                                </option>
                            ))}
                        </select>
                    </FormGroup>
                )}

                <div className={styles.CashBalancingModal__statsGrid}>
                    <div className={styles.CashBalancingModal__statItem}>
                        <div className={styles.CashBalancingModal__statValue}>
                            ${theoretical.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={styles.CashBalancingModal__statLabel}>
                            {t('theoretical_balance') || 'Saldo del Sistema'}
                        </div>
                    </div>

                    <div className={`${styles.CashBalancingModal__statItem} ${difference < 0 ? styles.CashBalancingModal__statItemNegative : (difference > 0 ? styles.CashBalancingModal__statItemPositive : '')}`}>
                        <div className={`${styles.CashBalancingModal__statValue} ${difference < 0 ? styles.CashBalancingModal__diffNegative : (difference > 0 ? styles.CashBalancingModal__diffPositive : '')}`}>
                            {difference > 0 ? '+' : ''}${difference.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                        </div>
                        <div className={styles.CashBalancingModal__statLabel}>
                            {difference === 0 ? (t('exact_balance') || 'Cuadre Exacto') : (t('difference') || 'Diferencia')}
                        </div>
                    </div>
                </div>

                <FormGroup label={t('physical_cash_count') || 'Monto Físico Recontado en Caja'}>
                    <div className={styles.CashBalancingModal__inputWithAction}>
                        <Input
                            type="number"
                            step="0.01"
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
    if (!isOpen || !day) return null;

    const key = `${day.date || 'today'}-${day.doctor_id || 'all'}`;

    return (
        <CashBalancingDialogContent
            key={key}
            onClose={onClose}
            day={day}
            onConfirm={onConfirm}
            doctors={doctors}
            onSelectDoctor={onSelectDoctor}
            t={t}
        />
    );
};

export const CashBalancingModal = React.memo(CashBalancingModalBase);
