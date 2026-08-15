
import React from 'react';
import Modal from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import CurrencyInput from '@/components/atoms/CurrencyInput';
import Select from '@/components/atoms/Select';
import { getPaymentMethods } from '@/constants/transactionOptions';
import styles from './DebtPaymentModal.module.css';

/**
 * DebtPaymentModal Molecule (Executor).
 * Renders the dialog to process a patient's debt payment.
 */
export const DebtPaymentModal = ({
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
            <div className={`${styles.root}`}>
                <div className={`${styles.field}`}>
                    <label className={`${styles.label}`}>{t('amount')} ($)</label>
                    <CurrencyInput
                        value={amount}
                        onChange={(e) => onAmountChange(e.target.value)}
                    />
                </div>
                <div className={`${styles.field}`}>
                    <label className={`${styles.label}`}>{t('payment_method')}</label>
                    <Select
                        value={method}
                        onChange={(e) => onMethodChange(e.target.value)}
                        options={paymentMethods}
                    />
                </div>
            </div>
        </Modal>
    );
};

