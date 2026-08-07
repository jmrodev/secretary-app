import React from 'react';
import { formatDate } from '@/utils/core/dateUtils';
import { formatCurrency } from '@/utils/core/format';
import styles from './MedicalReportTable.module.css';

const CertificateReportTable = ({ data, t }) => {
    const list = Array.isArray(data?.certificates) ? data.certificates : [];

    if (!list || list.length === 0) {
        return <div className={styles.medicalReport__empty}>{t('no_data_to_display')}</div>;
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
        <div className={styles.medicalReport}>
            {/* Summary Table */}
            <div className={styles.medicalReport__summary}>
                <h3 className={styles.medicalReport__summaryTitle}>{t('daily_summary')}</h3>
                <div className={styles.medicalReport__tableContainer}>
                    <table className={styles.medicalReport__table}>
                        <thead>
                            <tr>
                                <th>{t('date_label')}</th>
                                <th className={styles.medicalReport__cellRight}>{t('cash_cash_only')}</th>
                                <th className={styles.medicalReport__cellRight}>{t('other_methods')}</th>
                                <th className={styles.medicalReport__cellRight}>{t('daily_total')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailySummary.map((day) => (
                                <tr key={day.date} className={styles.medicalReport__row}>
                                    <td>{day.date}</td>
                                    <td className={styles.medicalReport__cellRight}>{formatCurrency(day.cash)}</td>
                                    <td className={styles.medicalReport__cellRight}>{formatCurrency(day.others)}</td>
                                    <td className={`${styles.medicalReport__cellRight} ${styles.medicalReport__cellBold}`}>
                                        {formatCurrency(day.total)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className={styles.medicalReport__footerSubtotal}>
                                <td>{t('monthly_cash_total')}</td>
                                <td colSpan="3" className={styles.medicalReport__cellRight}>
                                    {formatCurrency(dailySummary.reduce((acc, day) => acc + day.cash, 0))}
                                </td>
                            </tr>
                            <tr className={styles.medicalReport__footerSubtotal}>
                                <td>{t('monthly_others_total')}</td>
                                <td colSpan="3" className={styles.medicalReport__cellRight}>
                                    {formatCurrency(dailySummary.reduce((acc, day) => acc + day.others, 0))}
                                </td>
                            </tr>
                            <tr className={styles.medicalReport__footer}>
                                <td>{t('monthly_accumulated_total')}</td>
                                <td colSpan="3" className={styles.medicalReport__cellRight}>
                                    {formatCurrency(monthlyTotal)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>

            {/* Detailed Daily Breakdown */}
            {dailySummary.map((day) => (
                <div key={day.date} className={styles.medicalReport__group}>
                    <h3 className={styles.medicalReport__dateHeader}>
                        {day.date} - {t('total_day')}: {formatCurrency(day.total)}
                    </h3>
                    <div className={styles.medicalReport__tableContainer}>
                        <table className={styles.medicalReport__table}>
                            <thead>
                                <tr>
                                    <th>{t('patient_label')}</th>
                                    <th>{t('type')}</th>
                                    <th>{t('description')}</th>
                                    <th>{t('method_label')}</th>
                                    <th>{t('payment_status')}</th>
                                    <th className={styles.medicalReport__cellRight}>{t('amount')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {day.items.map((item) => (
                                    <tr key={item.id || `${item.date}-${item.patient_name}`} className={styles.medicalReport__row}>
                                        <td>
                                            <div className={styles.medicalReport__patientInfo}>
                                                <span className={styles.medicalReport__patientName}>{item.patient_name}</span>
                                                <span className={styles.medicalReport__patientDni}>{item.patient_dni}</span>
                                            </div>
                                        </td>
                                        <td>{item.certificate_type || t('general')}</td>
                                        <td>{item.description || '-'}</td>
                                        <td>
                                            <span className={`${styles.medicalReport__methodBadge} ${styles[`medicalReport__methodBadge--${item.payment_method}`] || ''}`}>
                                                {item.payment_method === 'cash' || item.payment_method === 'efectivo' ? t('cash') :
                                                    item.payment_method === 'transfer' ? t('transfer') :
                                                        item.payment_method === 'on_account' ? t('on_account') : item.payment_method}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`${styles.medicalReport__badge} ${styles[`medicalReport__badge--${item.payment_status}`] || ''}`}>
                                                {item.payment_status === 'paid' ? t('paid') :
                                                    item.payment_status === 'debt' ? `${t('debt')} (${formatCurrency(item.debt_amount || 0)})` :
                                                        item.payment_status === 'partial' ? `${t('partial')} (${formatCurrency(item.debt_amount || 0)})` :
                                                            item.payment_status === 'bonified' ? t('bonified') : item.payment_status}
                                            </span>
                                        </td>
                                        <td className={`${styles.medicalReport__cellRight} ${styles.medicalReport__cellBold}`}>
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

export default CertificateReportTable;
