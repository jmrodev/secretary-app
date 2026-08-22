import styles from './BalanceDebtsTable.module.css';

/**
 * BalanceDebtsTable Feature Molecule.
 * Summarized view of pending accounts receivable within the finances domain.
 */
const EMPTY_DEBTS = [];

export const BalanceDebtsTable = ({ debts = EMPTY_DEBTS, totalDebt, t }) => {
    return (
        <section className={`${styles.BalanceDebtsTable__root} animate-fade-in`}>
            <h3 className={`${styles.BalanceDebtsTable__title}`}>{t('pending_debts') || 'Deudas Pendientes'}</h3>

            {debts.length === 0 ? (
                <div className={`${styles.BalanceDebtsTable__empty}`}>
                    <p>{t('no_debts_period') || 'No hay deudas registradas en este período.'}</p>
                </div>
            ) : (
                <div className={`${styles.BalanceDebtsTable__tableWrapper}`}>
                    <table className={`${styles.BalanceDebtsTable__table}`}>
                        <thead>
                            <tr>
                                <th>{t('date') || 'Fecha'}</th>
                                <th>{t('patient') || 'Paciente'}</th>
                                <th>{t('origin') || 'Origen'}</th>
                                <th className={`${styles.BalanceDebtsTable__cellRight}`}>{t('amount') || 'Monto'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {debts.map((d) => (
                                <tr key={d.transaction_id || d.id || `${d.date}-${d.patient}`}>
                                    <td>{d.date}</td>
                                    <td className={`${styles.BalanceDebtsTable__cellBold}`}>{d.patient}</td>
                                    <td>{d.type}</td>
                                    <td className={`${styles.BalanceDebtsTable__cellRight}`}>
                                        {d.amount > 0 ? `$${d.amount.toLocaleString()}` : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <footer className={`${styles.BalanceDebtsTable__total}`}>
                {t('total_debt_detected') || 'Total Deuda Detectada'}: <span className={`${styles.BalanceDebtsTable__totalAmount}`}>$ {totalDebt.toLocaleString()}</span>
            </footer>
        </section>
    );
};

