import React from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { CurrencyInput } from '@/components/atoms/CurrencyInput';
import { AutoTextarea } from '@/components/atoms/AutoTextarea';
import { Icon } from '@/components/atoms/Icon';
import { FormGroup } from '@/components/molecules/FormGroup';
import { toInputDateTime } from '@/utils/core/dateUtils';
import styles from './EditTransactionModal.module.css';

/**
 * EditTransactionModal Molecule.
 * Simplified modal for quick editing of existing transactions.
 * Refactored to follow BEM and Atomic Design standards.
 */
export const EditTransactionModal = ({
    isOpen,
    onClose,
    onSave,
    transaction,
    setTransaction,
    settings,
    user,
    t
}) => {
    const handleTransactionChange = (field, value) => {
        setTransaction(prev => ({ ...prev, [field]: value }));
    };

    const formattedDate = React.useMemo(() => {
        return toInputDateTime(transaction?.transaction_date);
    }, [transaction?.transaction_date]);

    if (!transaction) return null;

    const paymentMethods = [
        { value: 'cash', label: t('cash') },
        { value: 'transfer', label: t('transfer') },
        { value: 'card', label: t('card') },
        { value: 'on_account', label: t('on_account') }
    ];

    const statusOptions = [
        { value: 'paid', label: t('paid') },
        { value: 'pending', label: t('pending') }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('edit_transaction')}
            footer={
                <div className={`${styles.EditTransactionModal__footer}`}>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={onSave} variant="primary" icon={<Icon name="save" size="1.1rem" />}>
                        {t('save')}
                    </Button>
                </div>
            }
        >
            <div className={`${styles.EditTransactionModal__root}`}>
                <FormGroup label={t('amount')}>
                    <CurrencyInput
                        value={transaction.amount}
                        onChange={e => handleTransactionChange('amount', e.target.value)}
                        className="edit-transaction-modal__input"
                    />
                </FormGroup>

                <FormGroup label={t('description')}>
                    <AutoTextarea
                        value={transaction.description}
                        onChange={e => handleTransactionChange('description', e.target.value)}
                        placeholder={t('description_placeholder')}
                        className="edit-transaction-modal__textarea"
                    />
                </FormGroup>

                <FormGroup label={t('payment_method')}>
                    <Select
                        value={transaction.method}
                        onChange={e => handleTransactionChange('method', e.target.value)}
                        options={paymentMethods}
                        className="edit-transaction-modal__select"
                    />
                </FormGroup>

                <FormGroup label={t('status')}>
                    <Select
                        value={transaction.status}
                        onChange={e => handleTransactionChange('status', e.target.value)}
                        options={statusOptions}
                        className="edit-transaction-modal__select"
                    />
                </FormGroup>

                {((settings.allow_admin_edit_finance_date === 'true') || (user && user.role === 'admin')) && (
                    <FormGroup label={t('transaction_date')}>
                        <Input
                            type="datetime-local"
                            value={formattedDate}
                            onChange={e => handleTransactionChange('transaction_date', e.target.value)}
                            className="edit-transaction-modal__input"
                        />
                        <div className={`${styles.EditTransactionModal__warning}`}>
                            <Icon name="WARNING" size="1rem" className={`${styles.EditTransactionModal__warningIcon}`} />
                            <span>{t('date_browser_warning')}</span>
                        </div>
                        <div className={`${styles.EditTransactionModal__warning}`}>
                            <Icon name="WARNING" size="1rem" className={`${styles.EditTransactionModal__warningIcon}`} />
                            <span>{t('date_order_warning')}</span>
                        </div>
                    </FormGroup>
                )}
            </div>
        </Modal>
    );
};

