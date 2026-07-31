import React from 'react';
import { getPaymentMethods } from '@/constants/transactionOptions';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import CurrencyInput from '@/components/atoms/CurrencyInput';
import Select from '@/components/atoms/Select';
import styles from '../modals/TransactionModal.module.css';

export const TransactionPaymentsSection = ({ 
    pricingInfo, totalPrice, setTotalPrice, payments, 
    handlePaymentChange, addPaymentMethod, removePaymentMethod, 
    currentPaidTotal, debtAmount, formatCurrency, t 
}) => {
    const paymentMethods = getPaymentMethods(t);
    return (
        <div className={`${styles.paymentMethods}`}>


            <div className={`${styles.paymentGridHorizontal}`}>
                {/* Block 1: Total to charge */}
                <div className={`${styles.totalsRow}`}>
                    <span className={`${styles.labelLarge}`}>{t('total_to_charge')}:</span>
                    <div className={`${styles.inputWrapperLarge}`}>
                        <CurrencyInput
                            value={totalPrice}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setTotalPrice(val);
                                if (payments.length === 1) {
                                    handlePaymentChange(0, 'amount', val);
                                }
                            }}
                            className={`${styles.totalInput}`}
                        />
                    </div>
                </div>

                {/* Block 2: Payment methods and amounts */}
                <div className={`${styles.paymentsContainer}`}>
                    <div className={`${styles.paymentMethodsHeader}`}>
                        <label className={`${styles.paymentMethodsTitle}`}>{t('payment_methods')}</label>
                        <Button 
                            variant="ghost" 
                            size="sm-compact" 
                            onClick={addPaymentMethod} 
                            icon={<Icon name="add_circle" size="1.1rem" />}
                        >
                            {t('add_payment_method')}
                        </Button>
                    </div>

                    {payments.map((payment, index) => (
                        <div key={payment._tmpId || index} className={`${styles.paymentRow}`}>
                            <div className={`${styles.paymentRowAmount}`}>
                                <CurrencyInput
                                    placeholder={t('amount_label')} value={payment.amount}
                                    onChange={e => handlePaymentChange(index, 'amount', e.target.value)}
                                />
                            </div>
                            <div className={`${styles.paymentRowMethod}`}>
                                <Select
                                    value={payment.method} onChange={e => handlePaymentChange(index, 'method', e.target.value)}
                                    options={paymentMethods}
                                />
                            </div>
                            <div className={`${styles.paymentRowAction}`}>
                                {payments.length > 1 && (
                                    <Button
                                        variant="ghost" size="sm-compact" onClick={() => removePaymentMethod(index)}
                                        icon={<Icon name="close" size="1rem" />}
                                    />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Block 3: Payment status summary */}
                <div className={`${styles.summary}`}>
                    {totalPrice > 0 && (
                        <div className={`${styles.totals}`}>
                            <div className={`${styles.summaryRow}`}>
                                <span className={`${styles.label}`}>{t('paid')}:</span>
                                <span className={`${styles.value} ${styles.valuePaid}`}>{formatCurrency(currentPaidTotal)}</span>
                            </div>
                            {debtAmount > 0 ? (
                                <div className={`${styles.summaryRow}`}>
                                    <span className={`${styles.label}`}>{t('debt')}:</span>
                                    <span className={`${styles.value} ${styles.valueDebt}`}>{formatCurrency(debtAmount)}</span>
                                </div>
                            ) : (
                                <div className={`${styles.status}`}>
                                    <Icon name="check" size="1.2rem" />
                                    {t('completed_payment')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
