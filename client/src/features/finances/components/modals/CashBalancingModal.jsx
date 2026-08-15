import React, { useState } from 'react';
import Modal from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import FormGroup from '@/components/molecules/FormGroup';
import styles from './PendingClosuresModal.module.css';

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
            title={`Arqueo de Caja - ${day?.date}`}
            size="md"
            footer={
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', width: '100%' }}>
                    <Button variant="secondary" onClick={onClose}>Cancelar</Button>
                    <Button 
                        variant="primary" 
                        onClick={handleConfirm} 
                        disabled={loading || !physicalBalance}
                        icon={<Icon name="check" />}
                    >
                        {loading ? 'Procesando...' : 'Confirmar y Cerrar'}
                    </Button>
                </div>
            }
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', padding: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className={styles.statItem}>
                        <div className={styles.statValue}>$${theoretical.toLocaleString()}</div>
                        <div className={styles.statLabel}>Saldo Teórico (DB)</div>
                    </div>
                    <div className={styles.statItem}>
                        <div className={`${styles.statValue} ${difference < 0 ? styles.diffNegative : styles.diffPositive}`}>
                            $${difference.toLocaleString()}
                        </div>
                        <div className={styles.statLabel}>Diferencia (Sobrante/Faltante)</div>
                    </div>
                </div>

                <FormGroup label="Efectivo Físico en Mano">
                    <Input
                        type="number"
                        value={physicalBalance}
                        onChange={e => setPhysicalBalance(e.target.value)}
                        placeholder="Ingrese el monto real..."
                        autoFocus
                        style={{ fontSize: '1.5rem', height: '60px', fontWeight: 'bold' }}
                    />
                </FormGroup>

                <FormGroup label="Notas del Arqueo (Opcional)">
                    <Input
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Ej: Faltante por vuelto, error de registro..."
                    />
                </FormGroup>
            </div>
        </Modal>
    );
};

export const CashBalancingModal = React.memo(CashBalancingModalBase);