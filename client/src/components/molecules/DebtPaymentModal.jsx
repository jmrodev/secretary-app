import React from 'react';
import Modal from './Modal';
import Button from '../atoms/Button';
import CurrencyInput from '../atoms/CurrencyInput';
import Select from '../atoms/Select';
import { getPaymentMethods } from '../../constants/transactionOptions';

const DebtPaymentModal = ({
    isOpen,
    onClose,
    onConfirm,
    amount,
    onAmountChange,
    method,
    onMethodChange,
    t
}) => {
    const paymentMethods = getPaymentMethods(t);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('pay_debt')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={onConfirm}>{t('confirm_payment')}</Button>
                </>
            }
        >
            <div className="flex flex-col gap-4">
                <div className="input-group">
                    <label className="input-label">{t('amount')} ($)</label>
                    <CurrencyInput
                        className="input-field"
                        value={amount}
                        onChange={(e) => onAmountChange(e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">{t('payment_method')}</label>
                    <Select
                        className="input-field"
                        value={method}
                        onChange={(e) => onMethodChange(e.target.value)}
                        options={paymentMethods}
                    />
                </div>
            </div>
        </Modal>
    );
};

export default DebtPaymentModal;
