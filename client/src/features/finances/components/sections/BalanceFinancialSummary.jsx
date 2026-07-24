import styles from './BalanceFinancialSummary.module.css';

/**
 * BalanceFinancialSummary Molecule.
 * Displays a detailed breakdown of income and net results for a specific period.
 */
const BalanceFinancialSummary = ({
    totalAppts,
    totalPres,
    totalLicenses,
    totalCertificates,
    otherOrPastIncome,
    totalIncome,
    totalWithdrawals,
    netTotal,
    t
}) => {
    return (
        <section className={`${styles.root} animate-fade-in`}>
            <h3 className={`${styles.title}`}>Resumen Financiero</h3>

            <div className={`${styles.item}`}>
                <span>Total Turnos:</span>
                <span className={`${styles.amount} ${styles.amountPositive}`}>
                    $ {totalAppts.toLocaleString()}
                </span>
            </div>

            <div className={`${styles.item}`}>
                <span>Total Recetas:</span>
                <span className={`${styles.amount} ${styles.amountPositive}`}>
                    $ {totalPres.toLocaleString()}
                </span>
            </div>

            <div className={`${styles.item}`}>
                <span>Total Licencias:</span>
                <span className={`${styles.amount} ${styles.amountPositive}`}>
                    $ {totalLicenses.toLocaleString()}
                </span>
            </div>

            <div className={`${styles.item}`}>
                <span>Total Certificados:</span>
                <span className={`${styles.amount} ${styles.amountPositive}`}>
                    $ {totalCertificates.toLocaleString()}
                </span>
            </div>

            {otherOrPastIncome > 0 && (
                <div className={`${styles.item}`}>
                    <span>Otros Ingresos / Cobro Deudas:</span>
                    <span className={`${styles.amount} ${styles.amountPositive}`}>
                        $ {otherOrPastIncome.toLocaleString()}
                    </span>
                </div>
            )}

            <div className={`${styles.item} ${styles.itemSubtotal}`}>
                <span>{t("subtotal_income")}:</span>
                <span>$ {totalIncome.toLocaleString()}</span>
            </div>

            <div className={`${styles.item} ${styles.itemWithdrawals}`}>
                <span>{t('doctor_withdrawals')}:</span>
                <span>$ {totalWithdrawals.toLocaleString()}</span>
            </div>

            <div className={`${styles.item} ${styles.itemNet}`}>
                <span>{t("result_neto")}:</span>
                <span>$ {netTotal.toLocaleString()}</span>
            </div>
        </section>
    );
};

export default BalanceFinancialSummary;
