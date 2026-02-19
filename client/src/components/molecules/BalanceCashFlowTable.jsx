import React from 'react';

/**
 * BalanceCashFlowTable Molecule.
 * Displays daily cash rendering details and totals.
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
        <section className="balance-view__card balance-view__card--cash">
            <h3 className="balance-view__card-title">Rendición de Caja</h3>
            <p className="balance-view__subtitle">Detalle de ingresos diarios por método de pago</p>

            <div className="balance-view__table-wrapper">
                <table className="balance-view__table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th className="text-right">Efectivo</th>
                            <th className="text-right">Otros Métodos</th>
                            <th className="text-right">Total Día</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDays.slice().reverse().map((day, idx) => {
                            const cash = Number(day.total_efectivo || 0);
                            const total = Number(day.total_paid || 0);
                            const others = total - cash;

                            return (
                                <tr key={idx}>
                                    <td>{day.date}</td>
                                    <td className="text-right">$ {cash.toLocaleString()}</td>
                                    <td className="text-right">$ {others.toLocaleString()}</td>
                                    <td className="text-right" style={{ fontWeight: 'bold' }}>
                                        $ {total.toLocaleString()}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="balance-view__table-footer">
                            <td>TOTAL:</td>
                            <td className="text-right">$ {totalCash.toLocaleString()}</td>
                            <td className="text-right">$ {totalOthers.toLocaleString()}</td>
                            <td className="text-right">$ {totalIncome.toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </section>
    );
};

export default BalanceCashFlowTable;
