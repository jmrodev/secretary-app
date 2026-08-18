import React, { useEffect } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Icon } from '@/components/atoms/Icon';
import { FormGroup } from '@/components/molecules/FormGroup';
import { getNow, toInputDate } from '@/utils/core/dateUtils';
import styles from './HistoricalWithdrawalModal.module.css';

/**
 * HistoricalWithdrawalModal Feature Molecule.
 * Allows administrative staff to record manual cash withdrawals from previous dates.
 * Refactored to follow BEM and Atomic Design standards.
 */
export const HistoricalWithdrawalModal = ({ isOpen, onClose, doctors, onConfirm, t }) => {
    const [state, dispatch] = React.useReducer((s, a) => ({ ...s, ...a }), {
        amount: '',
        date: '',
        time: '12:30',
        doctorId: '',
        description: ''
    });

    const { amount, date, time, doctorId, description } = state;

    useEffect(() => {
        const today = toInputDate(getNow());
        dispatch({
            amount: '',
            date: today,
            time: '12:30',
            description: 'Cierre manual de caja',
            doctorId: doctors && doctors.length > 0 ? doctors[0].id : ''
        });
    }, [doctors]); // Keep doctors as dep if we want to reset when they load

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm({
            amount,
            date,
            time,
            doctor_id: doctorId,
            description: description || 'Cierre manual de caja'
        });
    };

    const doctorOptions = doctors.map(d => ({ value: d.id, label: d.full_name }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('manual_withdrawal') || "Registro de Retiro Manual / Pasado"}
            footer={
                <div className={`${styles.HistoricalWithdrawalModal__footer}`}>
                    <Button variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleSubmit} variant="primary" icon={<Icon name="save" size="1.2rem" />}>
                        {t('save_withdrawal') || "Registrar Retiro"}
                    </Button>
                </div>
            }
        >
            <div className={`${styles.HistoricalWithdrawalModal__root}`}>
                <FormGroup label={t('doctor') || 'Doctor'}>
                    <Select
                        value={doctorId}
                        onChange={(e) => dispatch({ doctorId: e.target.value })}
                        options={doctorOptions}
                        className="historical-withdrawal-modal__select"
                    />
                </FormGroup>

                <FormGroup label={t('amount') || 'Monto ($)'}>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => dispatch({ amount: e.target.value })}
                        placeholder="0.00"
                        required
                        min="0"
                        step="0.01"
                        className="historical-withdrawal-modal__input"
                    />
                </FormGroup>

                <div className={`${styles.HistoricalWithdrawalModal__grid}`}>
                    <FormGroup label={t('date') || 'Fecha'}>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => dispatch({ date: e.target.value })}
                            required
                            className="historical-withdrawal-modal__input"
                        />
                    </FormGroup>
                    <FormGroup label={t('time') || 'Hora'}>
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => dispatch({ time: e.target.value })}
                            required
                            className="historical-withdrawal-modal__input"
                        />
                    </FormGroup>
                </div>

                <FormGroup label={t('description') || 'Descripción'}>
                    <Input
                        value={description}
                        onChange={(e) => dispatch({ description: e.target.value })}
                        placeholder="Ej: Cierre del día martes"
                        className="historical-withdrawal-modal__input"
                    />
                </FormGroup>
            </div>
        </Modal>
    );
};

