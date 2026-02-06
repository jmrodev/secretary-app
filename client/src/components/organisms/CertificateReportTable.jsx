
import React from 'react';
import './MedicalReportTable.css';

const CertificateReportTable = ({ data, t }) => {
    const list = Array.isArray(data?.certificates) ? data.certificates : [];

    if (!list || list.length === 0) {
        return <div className="report-table-empty">{t('no_data_to_display')}</div>;
    }

    // Group by date and split by method
    const grouped = list.reduce((acc, item) => {
        const dateStr = new Date(item.date).toLocaleDateString();
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

    return (
        <div className="medical-report">
            {/* Summary Table */}
            <div className="medical-report__summary">
                <h3 className="medical-report__summary-title">Resumen Diario</h3>
                <table className="medical-report__table medical-report__table--summary">
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
                            <tr key={idx} className="medical-report__row">
                                <td>{day.date}</td>
                                <td className="text-right">$ {day.cash.toLocaleString()}</td>
                                <td className="text-right">$ {day.others.toLocaleString()}</td>
                                <td className="text-right" style={{ fontWeight: 'bold' }}>
                                    $ {day.total.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="medical-report__footer-subtotal">
                            <td>TOTAL EFECTIVO DEL MES:</td>
                            <td colSpan="3" className="text-right">
                                $ {dailySummary.reduce((acc, day) => acc + day.cash, 0).toLocaleString()}
                            </td>
                        </tr>
                        <tr className="medical-report__footer-subtotal">
                            <td>TOTAL OTROS MÉTODOS DEL MES:</td>
                            <td colSpan="3" className="text-right">
                                $ {dailySummary.reduce((acc, day) => acc + day.others, 0).toLocaleString()}
                            </td>
                        </tr>
                        <tr className="medical-report__footer">
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
                <div key={groupIdx} className="medical-report__group">
                    <h3 className="medical-report__date-header">
                        {day.date} - Total Día: ${day.total.toLocaleString()}
                    </h3>
                    <div className="table-responsive">
                        <table className="medical-report__table">
                            <thead>
                                <tr>
                                    <th>Paciente</th>
                                    <th>Tipo</th>
                                    <th>Descripción</th>
                                    <th>Metodo</th>
                                    <th>Estado Pago</th>
                                    <th className="text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {day.items.map((item, idx) => (
                                    <tr key={idx} className="medical-report__row">
                                        <td>
                                            <div className="medical-report__patient-info">
                                                <span className="medical-report__patient-name">{item.patient_name}</span>
                                                <span className="medical-report__patient-dni">{item.patient_dni}</span>
                                            </div>
                                        </td>
                                        <td>{item.certificate_type || 'General'}</td>
                                        <td>{item.description || '-'}</td>
                                        <td>
                                            <span className={`medical-report__method-badge medical-report__method-badge--${item.payment_method}`}>
                                                {item.payment_method === 'cash' || item.payment_method === 'efectivo' ? 'Efectivo' :
                                                    item.payment_method === 'transfer' ? 'Transferencia' :
                                                        item.payment_method === 'on_account' ? 'Cta. Cte.' : item.payment_method}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`medical-report__badge medical-report__badge--${item.payment_status}`}>
                                                {item.payment_status === 'paid' ? 'Pagado' :
                                                    item.payment_status === 'debt' ? 'Debe' :
                                                        item.payment_status === 'bonified' ? 'Bonificado' : item.payment_status}
                                            </span>
                                        </td>
                                        <td className="medical-report__cell-amount text-right">
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

export default CertificateReportTable;
