import './BalanceCashFlowTable.css';

/**
 * BalanceCashFlowTable Feature Molecule.
 * Detailed daily breakdown of income split by payment method (cash vs others).
 * Part of the analytical reporting within the finances domain.
 */
const BalanceCashFlowTable = ({ appointments = [], t }) => {
    // Filter days up to today
    const filteredDays = appointments.filter(day => {
        const [d, m, y] = day.date.split('/');
        const dayDate = new Date(y, m - 1, d);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return dayDate <= today;
    });

    const totalCash = filteredDays.reduce((acc, d) => acc + Number(d.total_efectivo || 0), 0);
    const totalIncome = filteredDays.reduce((acc, d) => acc + Number(d.total_paid || 0), 0);
    const totalOthers = totalIncome - totalCash;

    return (
        <section className="balance-cashflow animate-fade-in">
            <header>
                <h3 className="balance-cashflow__title">{t('cash_reconciliation')}</h3>
                <p className="balance-cashflow__subtitle">{t('daily_income_detail')}</p>
            </header>

            <div className="balance-cashflow__table-wrapper">
                <table className="balance-cashflow__table">
                    <thead>
                        <tr>
                            <th>{t('date_label')}</th>
                            <th className="balance-cashflow__cell--right">{t('cash')}</th>
                            <th className="balance-cashflow__cell--right">{t('other_methods')}</th>
                            <th className="balance-cashflow__cell--right">{t('daily_total')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDays.slice().reverse().map((day) => {
                            const cash = Number(day.total_efectivo || 0);
                            const total = Number(day.total_paid || 0);
                            const others = total - cash;

                            return (
                                <tr key={day.date}>
                                    <td>{day.date}</td>
                                    <td className="balance-cashflow__cell--right">$ {cash.toLocaleString()}</td>
                                    <td className="balance-cashflow__cell--right">$ {others.toLocaleString()}</td>
                                    <td className="balance-cashflow__cell--right balance-cashflow__cell--bold">
                                        $ {total.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td>{t('total').toUpperCase()}:</td>
                            <td className="balance-cashflow__cell--right">$ {totalCash.toLocaleString()}</td>
                            <td className="balance-cashflow__cell--right">$ {totalOthers.toLocaleString()}</td>
                            <td className="balance-cashflow__cell--right balance-cashflow__cell--bold">$ {totalIncome.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </section>
    );
};

export default BalanceCashFlowTable;
