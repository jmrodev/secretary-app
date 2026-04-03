import React, { useState, useEffect } from 'react';
import Modal from '../../../components/molecules/Modal';
import Button from '../../../components/atoms/Button';
import Input from '../../../components/atoms/Input';
import Icon from '../../../components/atoms/Icon';
import './HistoricalWithdrawalModal.css';

/**
 * HistoricalWithdrawalModal Feature Molecule.
 * Allows administrative staff to record manual cash withdrawals from previous dates.
 * Essential for correcting discrepancies or late-entry accounting in the finances domain.
 */
const HistoricalWithdrawalModal = ({ isOpen, onClose, doctors, onConfirm, t }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('12:30');
    const [doctorId, setDoctorId] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset fields to reasonable defaults
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

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('manual_withdrawal') || "Registro de Retiro Manual / Pasado"}
        >
            <form onSubmit={handleSubmit} className="historical-withdrawal-form animate-fadeIn">
                <div className="form-group">
                    <label className="form-label">{t('doctor') || 'Doctor'}</label>
                    <select
                        className="form-control"
                        value={doctorId}
                        onChange={(e) => setDoctorId(e.target.value)}
                        required
                    >
                        {doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.full_name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="form-label">{t('amount') || 'Monto ($)'}</label>
                    <Input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                        min="0"
                        step="0.01"
                    />
                </div>

                <div className="item-grid">
                    <div className="form-group">
                        <label className="form-label">{t('date') || 'Fecha'}</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">{t('time') || 'Hora'}</label>
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label className="form-label">{t('description') || 'Descripción'}</label>
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Cierre del día martes"
                    />
                </div>

                <div className="historical-withdrawal-form__actions">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" variant="primary" icon={<Icon name="save" size="1rem" />}>
                        {t('save_withdrawal') || "Registrar Retiro"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default HistoricalWithdrawalModal;
