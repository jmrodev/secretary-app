
import React from 'react';
import { formatDate, parseDate } from '../../utils/dateUtils';
import './PrescriptionReportTable.css';

const PrescriptionReportTable = ({ data, t }) => {
    const list = Array.isArray(data?.prescriptions) ? data.prescriptions : [];

    if (!list || list.length === 0) {
        return <div className="report-table-empty">{t('no_data_to_display')}</div>;
    }

    // Group by date
    const grouped = list.reduce((acc, item) => {
        const dateStr = formatDate(item.date);
        if (!acc[dateStr]) {
            acc[dateStr] = {
                date: dateStr,
                items: [],
                cash: 0,
                others: 0,
                total: 0
            };
        }
        acc[dateStr].items.push(item);
        const amt = Number(item.amount || 0);
        if (item.payment_method === 'cash' || item.payment_method === 'efectivo') {
            acc[dateStr].cash += amt;
        } else {
            acc[dateStr].others += amt;
        }
        acc[dateStr].total += amt;
        return acc;
    }, {});

    const dailySummary = Object.values(grouped);
    const monthlyTotal = dailySummary.reduce((acc, day) => acc + day.total, 0);

    // Helper to get day of week
    const getDayOfWeek = (dateStr) => {
        const d = parseDate(dateStr);
        if (!d) return '';
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return days[d.getDay()];
    };

    return (
        <div className="prescription-report">
            {/* Summary Table */}
            <div className="prescription-report__summary">
                <h3 className="prescription-report__summary-title">Resumen Diario</h3>
                <table className="prescription-report__table prescription-report__table--summary">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th className="text-right">Efectivo (Contado)</th>
                            <th className="text-right">Otros Métodos</th>
                            <th className="text-right">Total Diario</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dailySummary.map((day, idx) => (
                            <tr key={idx} className="prescription-report__row">
                                <td>
                                    {day.date}
                                    <span className="prescription-report__day-name"> {getDayOfWeek(day.date)}</span>
                                </td>
                                <td className="text-right">$ {day.cash.toLocaleString()}</td>
                                <td className="text-right">$ {day.others.toLocaleString()}</td>
                                <td className="text-right" style={{ fontWeight: 'bold' }}>
                                    $ {day.total.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="prescription-report__footer-subtotal">
                            <td>TOTAL EFECTIVO DEL MES:</td>
                            <td colSpan="3" className="text-right">
                                $ {dailySummary.reduce((acc, day) => acc + day.cash, 0).toLocaleString()}
                            </td>
                        </tr>
                        <tr className="prescription-report__footer-subtotal">
                            <td>TOTAL OTROS MÉTODOS DEL MES:</td>
                            <td colSpan="3" className="text-right">
                                $ {dailySummary.reduce((acc, day) => acc + day.others, 0).toLocaleString()}
                            </td>
                        </tr>
                        <tr className="prescription-report__footer">
                            <td>TOTAL ACUMULADO DEL MES:</td>
                            <td colSpan="3" className="text-right">
                                $ {monthlyTotal.toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Detailed Daily Breakdown */}
            {dailySummary.map((day, groupIdx) => (
                <div key={groupIdx} className="prescription-report__group">
                    <h3 className="prescription-report__date-header">
                        {day.date} - Total Día: ${day.total.toLocaleString()}
                    </h3>
                    <div className="table-responsive">
                        <table className="prescription-report__table">
                            <thead>
                                <tr>
                                    <th>Tipo</th>
                                    <th>Paciente</th>
                                    <th>Medicamentos</th>
                                    <th>Metodo</th>
                                    <th>Estado Pago</th>
                                    <th className="text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {day.items.map((item, idx) => (
                                    <tr key={idx} className="prescription-report__row">
                                        <td>{item.source_type === 'direct' ? 'Directa' : 'Solicitud'}</td>
                                        <td>
                                            <div className="prescription-report__patient-info">
                                                <span className="prescription-report__patient-name">{item.patient_name}</span>
                                                <span className="prescription-report__patient-dni">{item.patient_dni}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="prescription-report__meds" title={item.medications}>
                                                {item.medications}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`prescription-report__method-badge prescription-report__method-badge--${item.payment_method}`}>
                                                {item.payment_method === 'cash' || item.payment_method === 'efectivo' ? 'Efectivo' :
                                                    item.payment_method === 'transfer' ? 'Transferencia' :
                                                        item.payment_method === 'on_account' ? 'Cta. Cte.' : item.payment_method}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`prescription-report__badge prescription-report__badge--${item.payment_status}`}>
                                                {item.payment_status === 'paid' ? 'Pagado' :
                                                    item.payment_status === 'debt' ? `Deuda ($${item.debt_amount || 0})` :
                                                        item.payment_status === 'partial' ? `Parcial ($${item.debt_amount || 0})` :
                                                            item.payment_status === 'bonified' ? 'Bonificado' : item.payment_status}
                                            </span>
                                        </td>
                                        <td className="prescription-report__cell-amount text-right">
                                            {Number(item.amount) > 0 ? `$${item.amount.toLocaleString()}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PrescriptionReportTable;
