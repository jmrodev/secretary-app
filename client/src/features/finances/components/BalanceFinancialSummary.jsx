import React from 'react';

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
        <section className="balance-view__card balance-view__card--summary">
            <h3 className="balance-view__card-title">Resumen Financiero</h3>

            <div className="balance-view__summary-item">
                <span>Total Turnos:</span>
                <span className="balance-view__amount balance-view__amount--positive">
                    $ {totalAppts.toLocaleString()}
                </span>
            </div>

            <div className="balance-view__summary-item">
                <span>Total Recetas:</span>
                <span className="balance-view__amount balance-view__amount--positive">
                    $ {totalPres.toLocaleString()}
                </span>
            </div>

            <div className="balance-view__summary-item">
                <span>Total Licencias:</span>
                <span className="balance-view__amount balance-view__amount--positive">
                    $ {totalLicenses.toLocaleString()}
                </span>
            </div>

            <div className="balance-view__summary-item">
                <span>Total Certificados:</span>
                <span className="balance-view__amount balance-view__amount--positive">
                    $ {totalCertificates.toLocaleString()}
                </span>
            </div>

            {otherOrPastIncome > 0 && (
                <div className="balance-view__summary-item">
                    <span>Otros Ingresos / Cobro Deudas:</span>
                    <span className="balance-view__amount balance-view__amount--positive">
                        $ {otherOrPastIncome.toLocaleString()}
                    </span>
                </div>
            )}

            <div className="balance-view__summary-item balance-view__summary-item--subtotal">
                <span>{t("subtotal_income")}:</span>
                <span>$ {totalIncome.toLocaleString()}</span>
            </div>

            <div className="balance-view__summary-item balance-view__summary-item--withdrawals">
                <span>{t('doctor_withdrawals')}:</span>
                <span>$ {totalWithdrawals.toLocaleString()}</span>
            </div>

            <div className="balance-view__summary-item balance-view__summary-item--net">
                <span>{t("result_neto")}:</span>
                <span>$ {netTotal.toLocaleString()}</span>
            </div>
        </section>
    );
};

export default BalanceFinancialSummary;
