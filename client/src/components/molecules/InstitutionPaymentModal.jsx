import React from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';

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
            <div className="flex flex-col gap-4">
                <p className="text-sm text-main-600 bg-blue-50 p-3 rounded border border-blue-100">
                    {t('payment_info_msg')}
                </p>
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
                <div className="modal-footer modal-footer--right mt-4">
                    <Button variant="secondary" onClick={onClose}>
                        {t('cancel')}
                    </Button>
                    <Button
                        onClick={onSubmit}
                        disabled={!paymentData.amount || Number(paymentData.amount) <= 0}
                    >
                        {t('confirm_payment_btn')}
                    </Button>
                </div>
            </div>
        </Modal>
    );
};

export default InstitutionPaymentModal;
