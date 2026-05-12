import './BalanceDebtsTable.css';

/**
 * BalanceDebtsTable Feature Molecule.
 * Summarized view of pending accounts receivable within the finances domain.
 */
const EMPTY_DEBTS = [];

const BalanceDebtsTable = ({ debts = EMPTY_DEBTS, totalDebt, t }) => {
    return (
        <section className="balance-debts animate-fade-in">
            <h3 className="balance-debts__title">Deudas Pendientes</h3>

            {debts.length === 0 ? (
                <div className="balance-debts__empty">
                    <p>{t('no_debts_period') || 'No hay deudas registradas en este período.'}</p>
                </div>
            ) : (
                <div className="balance-debts__table-wrapper">
                    <table className="balance-debts__table">
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Paciente</th>
                                <th>Origen</th>
                                <th className="balance-debts__cell--right">Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {debts.map((d) => (
                                <tr key={d.transaction_id || d.id || `${d.date}-${d.patient}`}>
                                    <td>{d.date}</td>
                                    <td className="balance-debts__cell--bold">{d.patient}</td>
                                    <td>{d.type}</td>
                                    <td className="balance-debts__cell--right">
                                        {d.amount > 0 ? `$${d.amount.toLocaleString()}` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <footer className="balance-debts__total">
                Total Deuda Detectada: <span className="balance-debts__total-amount">$ {totalDebt.toLocaleString()}</span>
            </footer>
        </section>
    );
};

export default BalanceDebtsTable;
