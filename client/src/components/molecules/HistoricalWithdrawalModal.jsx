import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Select from '../atoms/Select';
import Icon from '../atoms/Icon';
import './HistoricalWithdrawalModal.css';

const HistoricalWithdrawalModal = ({ isOpen, onClose, doctors, onConfirm, t }) => {
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('12:30');
    const [doctorId, setDoctorId] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (isOpen) {
            // Reset fields
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

    const doctorOptions = doctors.map(d => ({
        value: d.id,
        label: d.full_name
    }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('manual_withdrawal') || "Registro de Retiro Manual / Pasado"}
        >
            <form onSubmit={handleSubmit} className="historical-withdrawal-form">
                <div className="form-group">
                    <label>{t('doctor') || 'Doctor'}</label>
                    {/* Select component expects 'options' prop and 'value' prop */}
                    <select
                        className="input"
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
                    <label>{t('amount') || 'Monto ($)'}</label>
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

                <div className="form-row">
                    <div className="form-group flex-1">
                        <label>{t('date') || 'Fecha'}</label>
                        <Input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group flex-1">
                        <label>{t('time') || 'Hora'}</label>
                        <Input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            required
                        />
                    </div>
                </div>

                <div className="form-group">
                    <label>{t('description') || 'Descripción'}</label>
                    <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ej: Cierre del día martes"
                    />
                </div>

                <div className="modal-actions">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button type="submit" variant="primary" icon={<Icon name="save" />}>
                        {t('save_withdrawal') || "Registrar Retiro"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default HistoricalWithdrawalModal;
