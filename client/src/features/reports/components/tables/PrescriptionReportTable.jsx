import React from 'react';
import { formatDate, parseDate } from '@/utils/core/dateUtils';
import { formatCurrency } from '@/utils/core/format';
import styles from './PrescriptionReportTable.module.css';

export const PrescriptionReportTable = ({ data, t }) => {
    const list = Array.isArray(data?.prescriptions) ? data.prescriptions : [];

    if (!list || list.length === 0) {
        return <div className={styles.PrescriptionReportTable__empty}>{t('no_data_to_display')}</div>;
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
            t('sunday_short'),
            t('monday_short'),
            t('tuesday_short'),
            t('wednesday_short'),
            t('thursday_short'),
            t('friday_short'),
            t('saturday_short')
        ];
        return days[dayIdx] || '';
    };

    return (
        <div className={styles.PrescriptionReportTable__prescriptionReport}>
            {/* Summary Table */}
            <div className={styles.PrescriptionReportTable__summary}>
                <h3 className={styles.PrescriptionReportTable__summaryTitle}>{t('daily_summary')}</h3>
                <div className={styles.PrescriptionReportTable__tableContainer}>
                    <table className={styles.PrescriptionReportTable__table}>
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
                                <tr key={day.date} className={styles.PrescriptionReportTable__row}>
                                    <td>
                                        {day.date}
                                        <span className={styles.PrescriptionReportTable__dayName}> {getDayOfWeek(day.date)}</span>
                                    </td>
                                    <td className="text-right">{formatCurrency(day.cash)}</td>
                                    <td className="text-right">{formatCurrency(day.others)}</td>
                                    <td className="text-right font-bold">
                                        {formatCurrency(day.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className={styles.PrescriptionReportTable__footerSubtotal}>
                                <td>{t('monthly_cash_total')}</td>
                                <td colSpan="3" className="text-right">
                                    {formatCurrency(dailySummary.reduce((acc, day) => acc + day.cash, 0))}
                                </td>
                            </tr>
                            <tr className={styles.PrescriptionReportTable__footerSubtotal}>
                                <td>{t('monthly_others_total')}</td>
                                <td colSpan="3" className="text-right">
                                    {formatCurrency(dailySummary.reduce((acc, day) => acc + day.others, 0))}
                                </td>
                            </tr>
                            <tr className={styles.PrescriptionReportTable__footer}>
                                <td>{t('monthly_accumulated_total')}</td>
                                <td colSpan="3" className="text-right">
                                    {formatCurrency(monthlyTotal)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Detailed Daily Breakdown */}
            {dailySummary.map((day) => (
                <div key={day.date} className={styles.PrescriptionReportTable__group}>
                    <h3 className={styles.PrescriptionReportTable__dateHeader}>
                        {day.date} - {t('total_day')}: {formatCurrency(day.total)}
                    </h3>
                    <div className={styles.PrescriptionReportTable__tableContainer}>
                        <table className={styles.PrescriptionReportTable__table}>
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
                                    <tr key={item.id || `${item.date}-${item.patient_name}-${item.medications}`} className={styles.PrescriptionReportTable__row}>
                                        <td>{item.source_type === 'direct' ? t('direct') : t('request')}</td>
                                        <td>
                                            <div className={styles.PrescriptionReportTable__patientInfo}>
                                                <span className={styles.PrescriptionReportTable__patientName}>{item.patient_name}</span>
                                                <span className={styles.PrescriptionReportTable__patientDni}>{item.patient_dni}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.PrescriptionReportTable__meds} title={item.medications}>
                                                {item.medications}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.PrescriptionReportTable__methodBadge} ${styles[`prescriptionReport__methodBadge--${item.payment_method}`] || ''}`}>
                                                {item.payment_method === 'cash' || item.payment_method === 'efectivo' ? t('cash') :
                                                    item.payment_method === 'transfer' ? t('transfer') :
                                                        item.payment_method === 'on_account' ? t('on_account') : item.payment_method}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${styles.PrescriptionReportTable__badge} ${styles[`prescriptionReport__badge--${item.payment_status}`] || ''}`}>
                                                {item.payment_status === 'paid' ? t('paid') :
                                                    item.payment_status === 'debt' ? `${t('debt')} (${formatCurrency(item.debt_amount || 0)})` :
                                                        item.payment_status === 'partial' ? `${t('partial')} (${formatCurrency(item.debt_amount || 0)})` :
                                                            item.payment_status === 'bonified' ? t('bonified') : item.payment_status}
                                            </span>
                                        </td>
                                        <td className={styles.PrescriptionReportTable__cellAmount}>
                                            {Number(item.amount) > 0 ? formatCurrency(item.amount) : '-'}
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


