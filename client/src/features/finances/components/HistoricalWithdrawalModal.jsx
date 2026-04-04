import React, { useState, useEffect } from 'react';
import Modal from '../../../components/molecules/Modal';
import Button from '../../../components/atoms/Button';
import Input from '../../../components/atoms/Input';
import Select from '../../../components/atoms/Select';
import Icon from '../../../components/atoms/Icon';
import FormGroup from '../../../components/molecules/FormGroup';
import './HistoricalWithdrawalModal.css';

/**
 * HistoricalWithdrawalModal Feature Molecule.
 * Allows administrative staff to record manual cash withdrawals from previous dates.
 * Refactored to follow BEM and Atomic Design standards.
 */
const HistoricalWithdrawalModal = ({ isOpen, onClose, doctors, onConfirm, t }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('12:30');
    const [doctorId, setDoctorId] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            const today = new Date().toISOString().split('T')[0];
            setDate(today);
            setTime('12:30');
            setDescription('Cierre manual de caja');
            if (doctors && doctors.length > 0) {
                setDoctorId(doctors[0].id);
            }
        }
    }, [isOpen, doctors]);

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
                <div className="historical-withdrawal-modal__footer">
                    <Button variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button onClick={handleSubmit} variant="primary" icon={<Icon name="save" size="1.2rem" />}>
                        {t('save_withdrawal') || "Registrar Retiro"}
                    </Button>
                </div>
            }
        >
            <div className="historical-withdrawal-modal">
                <FormGroup label={t('doctor') || 'Doctor'}>
                    <Select
                        value={doctorId}
                        onChange={(e) => setDoctorId(e.target.value)}
                        options={doctorOptions}
                        className="historical-withdrawal-modal__select"
                    />
                </FormGroup>

                <FormGroup label={t('amount') || 'Monto ($)'}>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        min="0"
                        step="0.01"
                        className="historical-withdrawal-modal__input"
                    />
                </FormGroup>

                <div className="historical-withdrawal-modal__grid">
                    <FormGroup label={t('date') || 'Fecha'}>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                            className="historical-withdrawal-modal__input"
                        />
                    </FormGroup>
                    <FormGroup label={t('time') || 'Hora'}>
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                            className="historical-withdrawal-modal__input"
                        />
                    </FormGroup>
                </div>

                <FormGroup label={t('description') || 'Descripción'}>
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Cierre del día martes"
                        className="historical-withdrawal-modal__input"
                    />
                </FormGroup>
            </div>
        </Modal>
    );
};

export default HistoricalWithdrawalModal;
