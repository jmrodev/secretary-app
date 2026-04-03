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
                <p className="balance-view__empty-msg" style={{ padding: '2rem', textAlign: 'center', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                    No hay deudas registradas.
                </p>
            ) : (
                <div className="balance-view__table-wrapper">
                    <table className="balance-view__table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Paciente</th>
                                <th>Origen</th>
                                <th align="right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {debts.map((d, i) => (
                                <tr key={i} className="balance-view__row">
                                    <td>{d.date}</td>
                                    <td className="balance-view__cell-patient" style={{ fontWeight: 'bold' }}>{d.patient}</td>
                                    <td className="balance-view__cell-type">{d.type}</td>
                                    <td className="balance-view__cell-amount" align="right">
                                        {d.amount > 0 ? `$${d.amount.toLocaleString()}` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <div className="balance-view__debt-total" style={{ borderTop: '2px solid var(--border-color)', marginTop: '1rem', paddingTop: '0.75rem', fontWeight: 'bold', textAlign: 'right' }}>
                Total Deuda Detectada: $ {totalDebt.toLocaleString()}
            </div>
        </section>
    );
};

export default BalanceDebtsTable;
