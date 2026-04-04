import React from 'react';

/**
 * BalanceDebtsTable Feature Molecule.
 * Summarized view of pending accounts receivable within the finances domain.
 */
const BalanceDebtsTable = ({ debts = [], totalDebt, t }) => {
    return (
        <section className="balance-view__card balance-view__card--debts animate-fadeIn">
            <h3 className="balance-view__card-title">Deudas Pendientes</h3>

            {debts.length === 0 ? (
                <div className="balance-view__empty-state">
                    <p className="balance-view__empty-msg">
                        No hay deudas registradas en este período.
                    </p>
                </div>
            ) : (
                <div className="balance-view__table-wrapper">
                    <table className="balance-view__table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Paciente</th>
                                <th>Origen</th>
                                <th className="balance-view__cell--right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {debts.map((d, i) => (
                                <tr key={i} className="balance-view__row">
                                    <td>{d.date}</td>
                                    <td className="balance-view__cell-patient balance-view__cell--bold">{d.patient}</td>
                                    <td className="balance-view__cell-type">{d.type}</td>
                                    <td className="balance-view__cell-amount balance-view__cell--right">
                                        {d.amount > 0 ? `$${d.amount.toLocaleString()}` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="balance-view__debt-total">
                Total Deuda Detectada: <span className="balance-view__amount--bold">$ {totalDebt.toLocaleString()}</span>
            </div>
        </section>
    );
};

export default BalanceDebtsTable;
