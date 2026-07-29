import React from 'react';
import { getPaymentMethods } from '@/constants/transactionOptions';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import CurrencyInput from '@/components/atoms/CurrencyInput';
import Select from '@/components/atoms/Select';

export const TransactionPaymentsSection = ({ 
    pricingInfo, totalPrice, setTotalPrice, payments, 
    handlePaymentChange, addPaymentMethod, removePaymentMethod, 
    currentPaidTotal, debtAmount, formatCurrency, t 
}) => {
    const paymentMethods = getPaymentMethods(t);
    return (
        <div className="transaction-modal__payment-section">
            <div className="transaction-modal__totals">
                {pricingInfo && (
                    <div className="transaction-modal__pricing-alert">
                        <Icon name="info" size="1.1rem" className="transaction-modal__pricing-icon" />
                        <span>{pricingInfo}</span>
                    </div>
                )}
                <div className="transaction-modal__total-display">
                    <span className="transaction-modal__label transaction-modal__label--large">{t('total_to_charge')}:</span>
                    <div className="transaction-modal__total-input-wrapper">
                        <CurrencyInput
                            value={totalPrice}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setTotalPrice(val);
                                if (payments.length === 1) {
                                    handlePaymentChange(0, 'amount', val);
                                }
                            }}
                            className="transaction-modal__total-input"
                        />
                    </div>
                </div>
            </div>

            <div className="transaction-modal__payment-methods-header">
                <label className="transaction-modal__payment-methods-title">{t('payment_methods')}</label>
                <Button 
                    variant="ghost" 
                    size="sm-compact" 
                    onClick={addPaymentMethod} 
                    icon={<Icon name="add_circle" size="1.1rem" />}
                    className="transaction-modal__add-btn"
                >
                    {t('add_payment_method')}
                </Button>
            </div>

                {payments.map((payment, index) => (
                    <div key={payment._tmpId || index} className="transaction-modal__payment-row">
                        <div className="transaction-modal__payment-row-amount">
                            <CurrencyInput
                                placeholder={t('amount_label')} value={payment.amount}
                                onChange={e => handlePaymentChange(index, 'amount', e.target.value)}
                                className="transaction-modal__payment-input"
                            />
                        </div>
                        <div className="transaction-modal__payment-row-method">
                            <Select
                                value={payment.method} onChange={e => handlePaymentChange(index, 'method', e.target.value)}
                                options={paymentMethods} className="transaction-modal__payment-select"
                            />
                        </div>
                        <div className="transaction-modal__payment-row-action">
                            {payments.length > 1 && (
                                <Button
                                    variant="ghost" size="sm-compact" onClick={() => removePaymentMethod(index)}
                                    icon={<Icon name="close" size="1rem" />} className="transaction-modal__remove-btn"
                                />
                            )}
                        </div>
                    </div>
                ))}

            <div className="transaction-modal__payment-summary">
                {totalPrice > 0 && (
                    <div className="transaction-modal__summary-content">
                        <div className="transaction-modal__summary-line">
                            <span className="transaction-modal__label">{t('paid')}:</span>
                            <span className="transaction-modal__value transaction-modal__value--paid">{formatCurrency(currentPaidTotal)}</span>
                        </div>
                        {debtAmount > 0 ? (
                            <div className="transaction-modal__summary-line">
                                <span className="transaction-modal__label">{t('debt')}:</span>
                                <span className="transaction-modal__value transaction-modal__value--debt">{formatCurrency(debtAmount)}</span>
                            </div>
                        ) : (
                            <div className="transaction-modal__status-paid">
                                <Icon name="check" size="1.2rem" className="transaction-modal__status-icon" />
                                {t('completed_payment')}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
