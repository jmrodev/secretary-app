import React from 'react';
import { formatDate, parseDate } from '@/utils/core/dateUtils';
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
        const dayIdx = d.getDay();
        const days = [
            t('sunday_short') || 'Dom',
            t('monday_short') || 'Lun',
            t('tuesday_short') || 'Mar',
            t('wednesday_short') || 'Mié',
            t('thursday_short') || 'Jue',
            t('friday_short') || 'Vie',
            t('saturday_short') || 'Sáb'
        ];
        return days[dayIdx];
    };

    return (
        <div className="prescription-report">
            {/* Summary Table */}
            <div className="prescription-report__summary">
                <h3 className="prescription-report__summary-title">{t('daily_summary')}</h3>
                <table className="prescription-report__table prescription-report__table--summary">
                    <thead>
                        <tr>
                            <th>{t('date_label')}</th>
                            <th className="text-right">{t('cash_cash_only')}</th>
                            <th className="text-right">{t('other_methods')}</th>
                            <th className="text-right">{t('daily_total')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dailySummary.map((day) => (
                            <tr key={day.date} className="prescription-report__row">
                                <td>
                                    {day.date}
                                    <span className="prescription-report__day-name"> {getDayOfWeek(day.date)}</span>
                                </td>
                                <td className="text-right">$ {day.cash.toLocaleString()}</td>
                                <td className="text-right">$ {day.others.toLocaleString()}</td>
                                <td className="text-right font-bold">
                                    $ {day.total.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="prescription-report__footer-subtotal">
                            <td>{t('monthly_cash_total')}</td>
                            <td colSpan="3" className="text-right">
                                $ {dailySummary.reduce((acc, day) => acc + day.cash, 0).toLocaleString()}
                            </td>
                        </tr>
                        <tr className="prescription-report__footer-subtotal">
                            <td>{t('monthly_others_total')}</td>
                            <td colSpan="3" className="text-right">
                                $ {dailySummary.reduce((acc, day) => acc + day.others, 0).toLocaleString()}
                            </td>
                        </tr>
                        <tr className="prescription-report__footer">
                            <td>{t('monthly_accumulated_total')}</td>
                            <td colSpan="3" className="text-right">
                                $ {monthlyTotal.toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Detailed Daily Breakdown */}
            {dailySummary.map((day) => (
                <div key={day.date} className="prescription-report__group">
                    <h3 className="prescription-report__date-header">
                        {day.date} - {t('total_day')}: ${day.total.toLocaleString()}
                    </h3>
                    <div className="table-responsive">
                        <table className="prescription-report__table">
                            <thead>
                                <tr>
                                    <th>{t('type')}</th>
                                    <th>{t('patient_label')}</th>
                                    <th>{t('medications_label')}</th>
                                    <th>{t('method_label')}</th>
                                    <th>{t('payment_status')}</th>
                                    <th className="text-right">{t('amount')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {day.items.map((item) => (
                                    <tr key={item.id || `${item.date}-${item.patient_name}-${item.medications}`} className="prescription-report__row">
                                        <td>{item.source_type === 'direct' ? t('direct') : t('request')}</td>
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
                                                {item.payment_method === 'cash' || item.payment_method === 'efectivo' ? t('cash') :
                                                    item.payment_method === 'transfer' ? t('transfer') :
                                                        item.payment_method === 'on_account' ? t('on_account') : item.payment_method}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`prescription-report__badge prescription-report__badge--${item.payment_status}`}>
                                                {item.payment_status === 'paid' ? t('paid') :
                                                    item.payment_status === 'debt' ? `${t('debt')} ($${item.debt_amount || 0})` :
                                                        item.payment_status === 'partial' ? `${t('partial')} ($${item.debt_amount || 0})` :
                                                            item.payment_status === 'bonified' ? t('bonified') : item.payment_status}
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
