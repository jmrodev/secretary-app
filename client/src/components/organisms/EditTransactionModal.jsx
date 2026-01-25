
import React from 'react';
import Modal from '../molecules/Modal';
import CurrencyInput from '../atoms/CurrencyInput';

const EditTransactionModal = ({
    isOpen,
    onClose,
    onSave,
    transaction,
    setTransaction,
    settings,
    t
}) => {
    if (!transaction) return null;

    const handleChange = (field, value) => {
        setTransaction({ ...transaction, [field]: value });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('edit_transaction') || "Editar Transacción"}
            footer={
                <div className="flex gap-2 justify-end w-full">
                    <button className="btn btn-secondary" onClick={onClose}>{t('cancel')}</button>
                    <button className="btn btn-primary" onClick={onSave}>{t('save')}</button>
                </div>
            }
        >
            <form className="space-y-4">
                <div className="input-group">
                    <label className="input-label">{t('amount')}</label>
                    <CurrencyInput
                        className="input-field"
                        value={transaction.amount}
                        onChange={e => handleChange('amount', e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">{t('description')}</label>
                    <input
                        type="text"
                        className="input-field"
                        value={transaction.description}
                        onChange={e => handleChange('description', e.target.value)}
                    />
                </div>
                <div className="input-group">
                    <label className="input-label">{t('payment_method')}</label>
                    <select
                        className="input-field"
                        value={transaction.method}
                        onChange={e => handleChange('method', e.target.value)}
                    >
                        <option value="cash">{t('cash')}</option>
                        <option value="transfer">{t('transfer')}</option>
                        <option value="card">{t('card')}</option>
                        <option value="on_account">{t('on_account') || 'Cuenta Corriente'}</option>
                    </select>
                </div>
                <div className="input-group">
                    <label className="input-label">{t('status')}</label>
                    <select
                        className="input-field"
                        value={transaction.status}
                        onChange={e => handleChange('status', e.target.value)}
                    >
                        <option value="paid">{t('paid')}</option>
                        <option value="pending">{t('pending')}</option>
                    </select>
                </div>
                {(settings.allow_admin_edit_finance_date === 'true') && (
                    <div className="input-group">
                        <label className="input-label">{t('transaction_date') || 'Fecha de Transacción'}</label>
                        <input
                            type="datetime-local"
                            className="input-field"
                            value={transaction.transaction_date || ''}
                            onChange={e => handleChange('transaction_date', e.target.value)}
                        />
                        <p className="text-[10px] text-amber-600 mt-1">⚠️ El formato (Día/Mes o Mes/Día) depende de su navegador. Por favor verifique el nombre del mes al seleccionar.</p>
                        <p className="text-[10px] text-amber-600 mt-1">⚠️ Cuidado: Cambiar la fecha puede afectar el orden cronológico de la caja.</p>
                    </div>
                )}
            </form>
        </Modal>
    );
};

export default EditTransactionModal;
