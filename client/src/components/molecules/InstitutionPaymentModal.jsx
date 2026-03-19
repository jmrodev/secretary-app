import React from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

/**
 * InstitutionPaymentModal Molecule.
 * Modal for registering payments from institutions.
 */
const InstitutionPaymentModal = ({
    isOpen,
    onClose,
    paymentData,
    setPaymentData,
    onSubmit,
    t
}) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('register_inst_payment')}
        >
            <div className="flex flex-col gap-4 animate-fadeIn">
                <div className={`flex items-start gap-3 text-sm p-4 rounded-xl border ${
                    paymentData.transaction_ids?.length > 0
                        ? 'text-green-700 bg-green-50 border-green-100'
                        : 'text-blue-700 bg-blue-50 border-blue-100'
                }`}>
                    <Icon name={paymentData.transaction_ids?.length > 0 ? 'check_circle' : 'info'} size="1.25rem" className="mt-0.5" />
                    <p>
                        {paymentData.transaction_ids?.length > 0
                            ? `Se pagarán las ${paymentData.transaction_ids.length} transacciones seleccionadas por $${Number(paymentData.amount).toLocaleString()}.`
                            : t('payment_info_msg')
                        }
                    </p>
                </div>
                <div className="form-group-bem">
                    <label className="input-label">{t('amount_paid')}</label>
                    <input
                        type="number"
                        className="input-field"
                        value={paymentData.amount}
                        onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                        placeholder="0.00"
                    />
                </div>
                <div className="form-group-bem">
                    <label className="input-label">{t('payment_method')}</label>
                    <select
                        className="input-field"
                        value={paymentData.method}
                        onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}
                    >
                        <option value="transfer">{t('transfer')}</option>
                        <option value="cash">{t('cash')}</option>
                        <option value="check">Cheque</option>
                        <option value="other">{t('other') || 'Otro'}</option>
                    </select>
                </div>
                <div className="modal-footer modal-footer--right mt-6">
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
