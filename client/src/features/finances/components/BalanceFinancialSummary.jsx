import './BalanceFinancialSummary.css';

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
        <section className="balance-summary animate-fadeIn">
            <h3 className="balance-summary__title">Resumen Financiero</h3>

            <div className="balance-summary__item">
                <span>Total Turnos:</span>
                <span className="balance-summary__amount balance-summary__amount--positive">
                    $ {totalAppts.toLocaleString()}
                </span>
            </div>

            <div className="balance-summary__item">
                <span>Total Recetas:</span>
                <span className="balance-summary__amount balance-summary__amount--positive">
                    $ {totalPres.toLocaleString()}
                </span>
            </div>

            <div className="balance-summary__item">
                <span>Total Licencias:</span>
                <span className="balance-summary__amount balance-summary__amount--positive">
                    $ {totalLicenses.toLocaleString()}
                </span>
            </div>

            <div className="balance-summary__item">
                <span>Total Certificados:</span>
                <span className="balance-summary__amount balance-summary__amount--positive">
                    $ {totalCertificates.toLocaleString()}
                </span>
            </div>

            {otherOrPastIncome > 0 && (
                <div className="balance-summary__item">
                    <span>Otros Ingresos / Cobro Deudas:</span>
                    <span className="balance-summary__amount balance-summary__amount--positive">
                        $ {otherOrPastIncome.toLocaleString()}
                    </span>
                </div>
            )}

            <div className="balance-summary__item balance-summary__item--subtotal">
                <span>{t("subtotal_income")}:</span>
                <span>$ {totalIncome.toLocaleString()}</span>
            </div>

            <div className="balance-summary__item balance-summary__item--withdrawals">
                <span>{t('doctor_withdrawals')}:</span>
                <span>$ {totalWithdrawals.toLocaleString()}</span>
            </div>

            <div className="balance-summary__item balance-summary__item--net">
                <span>{t("result_neto")}:</span>
                <span>$ {netTotal.toLocaleString()}</span>
            </div>
        </section>
    );
};

export default BalanceFinancialSummary;
