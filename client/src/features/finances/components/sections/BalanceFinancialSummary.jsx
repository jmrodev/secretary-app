import React from 'react';
import { Card } from '@/components/atoms/Card';
import styles from './BalanceFinancialSummary.module.css';

/**
 * BalanceFinancialSummary Molecule.
 */
export const BalanceFinancialSummary = ({ summary }) => {
    if (!summary) return null;

    const {
        totalAppts,
        totalPres,
        totalLicenses,
        totalCertificates,
        otherOrPastIncome,
        totalIncome,
        totalWithdrawals,
        netTotal,
        t
    } = summary;

    return (
        <Card className={`${styles.BalanceFinancialSummary__root}`}>
            <div className={`${styles.BalanceFinancialSummary__item}`}>
                <span>Total Turnos:</span>
                <span className={`${styles.BalanceFinancialSummary__amount} ${styles.BalanceFinancialSummary__amountPositive}`}>
                    $ {totalAppts.toLocaleString()}
                </span>
            </div>

            <div className={`${styles.BalanceFinancialSummary__item}`}>
                <span>Total Recetas:</span>
                <span className={`${styles.BalanceFinancialSummary__amount} ${styles.BalanceFinancialSummary__amountPositive}`}>
                    $ {totalPres.toLocaleString()}
                </span>
            </div>

            <div className={`${styles.BalanceFinancialSummary__item}`}>
                <span>Total Licencias:</span>
                <span className={`${styles.BalanceFinancialSummary__amount} ${styles.BalanceFinancialSummary__amountPositive}`}>
                    $ {totalLicenses.toLocaleString()}
                </span>
            </div>

            <div className={`${styles.BalanceFinancialSummary__item}`}>
                <span>Total Certificados:</span>
                <span className={`${styles.BalanceFinancialSummary__amount} ${styles.BalanceFinancialSummary__amountPositive}`}>
                    $ {totalCertificates.toLocaleString()}
                </span>
            </div>

            {otherOrPastIncome > 0 && (
                <div className={`${styles.BalanceFinancialSummary__item}`}>
                    <span>Otros Ingresos / Cobro Deudas:</span>
                    <span className={`${styles.BalanceFinancialSummary__amount} ${styles.BalanceFinancialSummary__amountPositive}`}>
                        $ {otherOrPastIncome.toLocaleString()}
                    </span>
                </div>
            )}

            <div className={`${styles.BalanceFinancialSummary__item} ${styles.BalanceFinancialSummary__itemSubtotal}`}>
                <span>{t("subtotal_income")}:</span>
                <span>$ {totalIncome.toLocaleString()}</span>
            </div>

            <div className={`${styles.BalanceFinancialSummary__item} ${styles.BalanceFinancialSummary__itemWithdrawals}`}>
                <span>{t('doctor_withdrawals')}:</span>
                <span>$ {totalWithdrawals.toLocaleString()}</span>
            </div>

            <div className={`${styles.BalanceFinancialSummary__item} ${styles.BalanceFinancialSummary__itemNet}`}>
                <span>{t("result_neto")}:</span>
                <span>$ {netTotal.toLocaleString()}</span>
            </div>
        </Card>
    );
};

