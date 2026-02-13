import React from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';
import CurrencyInput from '../atoms/CurrencyInput';
import FormGroup from './FormGroup';
import './CashBoxDeliveryModal.css';

const CashBoxDeliveryModal = ({ isOpen, onClose, onConfirm, doctorName, balance, amount, setAmount, t }) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('close_box')}: ${doctorName}`}
            footer={
                <Button variant="primary" onClick={onConfirm} icon="💰">
                    {t('confirm_delivery')}
                </Button>
            }
        >
            <div className="cash-box-delivery">
                <p className="cash-box-delivery__balance">
                    {t('current_system_balance')}: <span className="cash-box-delivery__balance-value">${balance?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </p>

                <FormGroup label={t('amount_delivered')}>
                    <CurrencyInput
                        value={amount}
                        onChange={e => setAmount(e.target.value)}
                        placeholder={balance}
                    />
                </FormGroup>

                <p className="cash-box-delivery__warning">
                    ⚠️ {t('close_box_warning') || 'Esta acción registrará una salida de efectivo en la caja del profesional y ajustará el saldo.'}
                </p>
            </div>
        </Modal>
    );
};

export default CashBoxDeliveryModal;
