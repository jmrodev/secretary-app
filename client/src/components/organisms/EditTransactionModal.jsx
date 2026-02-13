import React from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Select from '../atoms/Select';
import CurrencyInput from '../atoms/CurrencyInput';
import FormGroup from '../molecules/FormGroup';
import './EditTransactionModal.css';

const EditTransactionModal = ({
    isOpen,
    onClose,
    onSave,
    transaction,
    setTransaction,
    settings,
    user,
    t
}) => {
    if (!transaction) return null;

    const handleChange = (field, value) => {
        setTransaction({ ...transaction, [field]: value });
    };

    const paymentMethods = [
        { value: 'cash', label: t('cash') },
        { value: 'transfer', label: t('transfer') },
        { value: 'card', label: t('card') },
        { value: 'on_account', label: t('on_account') || 'Cuenta Corriente' }
    ];

    const statusOptions = [
        { value: 'paid', label: t('paid') },
        { value: 'pending', label: t('pending') }
    ];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('edit_transaction') || "Editar Transacción"}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>{t('cancel')}</Button>
                    <Button onClick={onSave} variant="primary">{t('save')}</Button>
                </>
            }
        >
            <form className="edit-transaction-form" onSubmit={e => e.preventDefault()}>
                <FormGroup label={t('amount')}>
                    <CurrencyInput
                        value={transaction.amount}
                        onChange={e => handleChange('amount', e.target.value)}
                    />
                </FormGroup>

                <FormGroup label={t('description')}>
                    <Input
                        type="text"
                        value={transaction.description}
                        onChange={e => handleChange('description', e.target.value)}
                    />
                </FormGroup>

                <FormGroup label={t('payment_method')}>
                    <Select
                        value={transaction.method}
                        onChange={e => handleChange('method', e.target.value)}
                        options={paymentMethods}
                    />
                </FormGroup>

                <FormGroup label={t('status')}>
                    <Select
                        value={transaction.status}
                        onChange={e => handleChange('status', e.target.value)}
                        options={statusOptions}
                    />
                </FormGroup>

                {((settings.allow_admin_edit_finance_date === 'true') || (user && user.role === 'admin')) && (
                    <FormGroup label={t('transaction_date') || 'Fecha de Transacción'}>
                        <Input
                            type="datetime-local"
                            value={transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleString('sv').slice(0, 16).replace(' ', 'T') : ''}
                            onChange={e => handleChange('transaction_date', e.target.value)}
                        />
                        <p className="edit-transaction-form__warning">
                            <span>⚠️</span> {t('date_browser_warning') || 'El formato (Día/Mes o Mes/Día) depende de su navegador. Por favor verifique el nombre del mes al seleccionar.'}
                        </p>
                        <p className="edit-transaction-form__warning">
                            <span>⚠️</span> {t('date_order_warning') || 'Cuidado: Cambiar la fecha puede afectar el orden cronológico de la caja.'}
                        </p>
                    </FormGroup>
                )}
            </form>
        </Modal>
    );
};

export default EditTransactionModal;
