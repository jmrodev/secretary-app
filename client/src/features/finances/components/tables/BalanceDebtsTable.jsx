import styles from './BalanceDebtsTable.module.css';

/**
 * BalanceDebtsTable Feature Molecule.
 * Summarized view of pending accounts receivable within the finances domain.
 */
const EMPTY_DEBTS = [];

const BalanceDebtsTable = ({ debts = EMPTY_DEBTS, totalDebt, t }) => {
    return (
        <section className={`${styles.root} animate-fade-in`}>
            <h3 className={`${styles.title}`}>Deudas Pendientes</h3>

            {debts.length === 0 ? (
                <div className={`${styles.empty}`}>
                    <p>{t('no_debts_period') || 'No hay deudas registradas en este período.'}</p>
                </div>
            ) : (
                <div className={`${styles.tableWrapper}`}>
                    <table className={`${styles.table}`}>
                        <thead>
                            <tr>
                                <th>Fecha</th>
                                <th>Paciente</th>
                                <th>Origen</th>
                                <th className={`${styles.cellRight}`}>Monto</th>
                            </tr>
                        </thead>
                        <tbody>
                            {debts.map((d) => (
                                <tr key={d.transaction_id || d.id || `${d.date}-${d.patient}`}>
                                    <td>{d.date}</td>
                                    <td className={`${styles.cellBold}`}>{d.patient}</td>
                                    <td>{d.type}</td>
                                    <td className={`${styles.cellRight}`}>
                                        {d.amount > 0 ? `$${d.amount.toLocaleString()}` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <footer className={`${styles.total}`}>
                Total Deuda Detectada: <span className={`${styles.totalAmount}`}>$ {totalDebt.toLocaleString()}</span>
            </footer>
        </section>
    );
};

export default BalanceDebtsTable;
