
import React from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';
import CurrencyInput from '../atoms/CurrencyInput';

const CashBoxDeliveryModal = ({ isOpen, onClose, onConfirm, doctorName, balance, amount, setAmount, t }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('close_box')}: ${doctorName}`}
            footer={<><Button variant="primary" onClick={onConfirm}>{t('confirm_delivery')}</Button></>}
        >
            <p>{t('current_system_balance')}: <strong>${balance?.toFixed(2)}</strong></p>
            <div className="input-group mt-4">
                <label className="input-label">{t('amount_delivered')}</label>
                <CurrencyInput className="input-field" value={amount} onChange={e => setAmount(e.target.value)} placeholder={balance} />
            </div>
            <p className="text-xs-muted">{t('close_box_warning')}</p>
        </Modal>
    );
};

export default CashBoxDeliveryModal;
