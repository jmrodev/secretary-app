import React from 'react';
import Modal from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Alert from '@/components/atoms/Alert';
import FormGroup from '@/components/molecules/FormGroup';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import styles from './InstitutionPaymentModal.module.css';

/**
 * InstitutionPaymentModal Molecule.
 * Modal for registering payments from institutions.
 * Refactored to use Atomic Design components and BEM.
 */
const InstitutionPaymentModal = ({
    isOpen,
    onClose,
    paymentData,
    setPaymentData,
    onSubmit,
    t
}) => {
    const hasTransactions = paymentData.transaction_ids?.length > 0;

    const paymentMethods = [
        { value: 'transfer', label: t('transfer') },
        { value: 'cash', label: t('cash') },
        { value: 'check', label: 'Cheque' },
        { value: 'other', label: t('other') || 'Otro' }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('register_inst_payment')}
        >
            <div className={`${styles.root}`}>
                <Alert
                    variant={hasTransactions ? 'success' : 'info'}
                    message={
                        hasTransactions
                            ? `Se pagarán las ${paymentData.transaction_ids.length} transacciones seleccionadas por $${Number(paymentData.amount).toLocaleString()}.`
                            : t('payment_info_msg')
                    }
                />

                <FormGroup label={t('amount_paid')} required>
                    <Input
                        type="number"
                        value={paymentData.amount}
                        onChange={e => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                        placeholder="0.00"
                    />
                </FormGroup>

                <FormGroup label={t('payment_method')} required>
                    <Select
                        value={paymentData.method}
                        onChange={e => setPaymentData(prev => ({ ...prev, method: e.target.value }))}
                        options={paymentMethods}
                    />
                </FormGroup>

                <div className={`${styles.footer}`}>
                    <Button variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={!paymentData.amount || Number(paymentData.amount) <= 0}
                        icon={<Icon name="check_circle" size="1.1rem" />}
                    >
                        {t('confirm_payment_btn')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default InstitutionPaymentModal;

