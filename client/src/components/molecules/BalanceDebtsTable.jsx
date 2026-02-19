import React from 'react';

/**
 * BalanceDebtsTable Molecule.
 * Displays a list of pending debts from patients.
 */
const BalanceDebtsTable = ({ debts = [], totalDebt, t }) => {
    return (
        <section className="balance-view__card balance-view__card--debts">
            <h3 className="balance-view__card-title">Deudas Pendientes</h3>

            {debts.length === 0 ? (
                <p className="balance-view__empty-msg">No hay deudas registradas.</p>
            ) : (
                <div className="balance-view__table-wrapper">
                    <table className="balance-view__table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Paciente</th>
                                <th>Origen</th>
                                <th className="text-right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {debts.map((d, i) => (
                                <tr key={i} className="balance-view__row">
                                    <td>{d.date}</td>
                                    <td className="balance-view__cell-patient">{d.patient}</td>
                                    <td className="balance-view__cell-type">{d.type}</td>
                                    <td className="balance-view__cell-amount">
                                        {d.amount > 0 ? `$${d.amount.toLocaleString()}` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="balance-view__debt-total">
                Total Deuda Detectada: $ {totalDebt.toLocaleString()}
            </div>
        </section>
    );
};

export default BalanceDebtsTable;
