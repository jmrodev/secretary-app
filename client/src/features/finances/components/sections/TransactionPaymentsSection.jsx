import React from 'react';
import { getPaymentMethods } from '@/constants/transactionOptions';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { CurrencyInput } from '@/components/atoms/CurrencyInput';
import { Select } from '@/components/atoms/Select';
import styles from '../modals/TransactionModal.module.css';

export const TransactionPaymentsSection = ({ 
    pricingInfo, totalPrice, setTotalPrice, payments, 
    handlePaymentChange, addPaymentMethod, removePaymentMethod, 
    currentPaidTotal, debtAmount, formatCurrency, t 
}) => {
    const paymentMethods = getPaymentMethods(t);
    return (
        <div className={styles.TransactionModal__paymentMethods}>
            <div className={styles.TransactionModal__paymentGridHorizontal}>
                {/* Block 1: Total to charge */}
                <div className={styles.TransactionModal__totalsRow}>
                    <span className={styles.TransactionModal__labelLarge}>{t('total_to_charge')}:</span>
                    <div className={styles.TransactionModal__inputWrapperLarge}>
                        <CurrencyInput
                            value={totalPrice}
                            onChange={(e) => {
                                const val = Number(e.target.value);
                                setTotalPrice(val);
                                if (payments.length === 1) {
                                    handlePaymentChange(0, 'amount', val);
                                }
                            }}
                            className={styles.TransactionModal__totalInput}
                        />
                    </div>
                </div>

                {/* Block 2: Payment methods and amounts */}
                <div className={styles.TransactionModal__paymentsContainer}>
                    <div className={styles.TransactionModal__paymentMethodsHeader}>
                        <span className={styles.TransactionModal__paymentMethodsTitle}>{t('payment_methods')}</span>
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
                        <div key={payment._tmpId || payment.id || `payment-row-${payment.method}-${index}`} className={styles.TransactionModal__paymentRow}>
                            <div className={styles.TransactionModal__paymentRowAmount}>
                                <CurrencyInput
                                    placeholder={t('amount_label')} value={payment.amount}
                                    onChange={e => handlePaymentChange(index, 'amount', e.target.value)}
                                />
                            </div>
                            <div className={styles.TransactionModal__paymentRowMethod}>
                                <Select
                                    value={payment.method} onChange={e => handlePaymentChange(index, 'method', e.target.value)}
                                    options={paymentMethods}
                                />
                            </div>
                            <div className={styles.TransactionModal__paymentRowAction}>
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
                <div className={styles.TransactionModal__summary}>
                    {totalPrice > 0 && (
                        <div className={styles.TransactionModal__totals}>
                            <div className={styles.TransactionModal__summaryRow}>
                                <span className={styles.TransactionModal__label}>{t('paid')}:</span>
                                <span className={`${styles.TransactionModal__value} ${styles.TransactionModal__valuePaid}`}>{formatCurrency(currentPaidTotal)}</span>
                            </div>
                            {debtAmount > 0 ? (
                                <div className={styles.TransactionModal__summaryRow}>
                                    <span className={styles.TransactionModal__label}>{t('debt')}:</span>
                                    <span className={`${styles.TransactionModal__value} ${styles.TransactionModal__valueDebt}`}>{formatCurrency(debtAmount)}</span>
                                </div>
                            ) : (
                                <div className={styles.TransactionModal__status}>
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
