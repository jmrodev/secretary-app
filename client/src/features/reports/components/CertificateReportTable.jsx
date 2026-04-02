import React from 'react';
import { formatDate } from '../../../utils/dateUtils';
import './MedicalReportTable.css';

const CertificateReportTable = ({ data, t }) => {
    const list = Array.isArray(data?.certificates) ? data.certificates : [];

    if (!list || list.length === 0) {
        return <div className="report-table-empty">{t('no_data_to_display')}</div>;
    }

    // Group by date and split by method
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

    return (
        <div className="medical-report">
            {/* Summary Table */}
            <div className="medical-report__summary">
                <h3 className="medical-report__summary-title">{t('daily_summary')}</h3>
                <table className="medical-report__table medical-report__table--summary">
                    <thead>
                        <tr>
                            <th>{t('date_label')}</th>
                            <th className="text-right">{t('cash_cash_only')}</th>
                            <th className="text-right">{t('other_methods')}</th>
                            <th className="text-right">{t('daily_total')}</th>
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
                            <td>{t('monthly_cash_total')}</td>
                            <td colSpan="3" className="text-right">
                                $ {dailySummary.reduce((acc, day) => acc + day.cash, 0).toLocaleString()}
                            </td>
                        </tr>
                        <tr className="medical-report__footer-subtotal">
                            <td>{t('monthly_others_total')}</td>
                            <td colSpan="3" className="text-right">
                                $ {dailySummary.reduce((acc, day) => acc + day.others, 0).toLocaleString()}
                            </td>
                        </tr>
                        <tr className="medical-report__footer">
                            <td>{t('monthly_accumulated_total')}</td>
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
                        {day.date} - {t('total_day')}: ${day.total.toLocaleString()}
                    </h3>
                    <div className="table-responsive">
                        <table className="medical-report__table">
                            <thead>
                                <tr>
                                    <th>{t('patient_label')}</th>
                                    <th>{t('type')}</th>
                                    <th>{t('description')}</th>
                                    <th>{t('method_label')}</th>
                                    <th>{t('payment_status')}</th>
                                    <th className="text-right">{t('amount')}</th>
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
                                        <td>{item.certificate_type || t('general')}</td>
                                        <td>{item.description || '-'}</td>
                                        <td>
                                            <span className={`medical-report__method-badge medical-report__method-badge--${item.payment_method}`}>
                                                {item.payment_method === 'cash' || item.payment_method === 'efectivo' ? t('cash') :
                                                    item.payment_method === 'transfer' ? t('transfer') :
                                                        item.payment_method === 'on_account' ? t('on_account') : item.payment_method}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`medical-report__badge medical-report__badge--${item.payment_status}`}>
                                                {item.payment_status === 'paid' ? t('paid') :
                                                    item.payment_status === 'debt' ? `${t('debt')} ($${item.debt_amount || 0})` :
                                                        item.payment_status === 'partial' ? `${t('partial')} ($${item.debt_amount || 0})` :
                                                            item.payment_status === 'bonified' ? t('bonified') : item.payment_status}
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
