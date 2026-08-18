import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { parseDate } from '@/utils/core/dateUtils';
import { formatCurrency } from '@/utils/core/format';
import styles from './AppointmentReportTable.module.css';

export const AppointmentReportTable = ({ data, t }) => {
    const list = Array.isArray(data?.appointments) ? data.appointments : (Array.isArray(data) ? data : []);

    if (!list || list.length === 0) {
        return <div className={styles.AppointmentReportTable__appointmentReport__empty}>{t('no_data_to_display')}</div>;
    }

    // Pure computation of per-day and running totals. Two passes keep the render
    // callback free of render-scope mutation (react-hooks/immutability).
    const baseRows = list.map((dayGroup) => {
        let cash = Number(dayGroup.total_efectivo || 0);
        let total = Number(dayGroup.total_dia || dayGroup.total_paid || 0);

        if (dayGroup.appointments && dayGroup.appointments.length > 0) {
            let apptCash = 0;
            let apptTotal = 0;
            dayGroup.appointments.forEach(appt => {
                const paidAmount = Number(appt.paid_amount ?? appt.monto_pagado ?? 0);
                const cashAmount = Number(appt.cash_amount ?? appt.monto_efectivo ?? (appt.payment_method === 'cash' ? paidAmount : 0));
                apptCash += cashAmount;
                apptTotal += paidAmount;
            });
            if (apptTotal > 0) {
                cash = apptCash;
                total = apptTotal;
            }
        }

        const parsedDate = parseDate(dayGroup.date);
        return {
            date: dayGroup.date,
            cash,
            others: Math.max(0, total - cash),
            total,
            dayOfWeek: parsedDate ? parsedDate.getDay() : 0,
            is_weekend: dayGroup.is_weekend,
            is_holiday: dayGroup.is_holiday
        };
    });

    const dailySummaryWithTotals = baseRows.map((row, index) => {
        // Weekly segment restarts on Monday (dayOfWeek === 1) or at list start.
        const isWeekStart = index === 0 || row.dayOfWeek === 1;
        const weeklyStart = isWeekStart
            ? index
            : (() => {
                for (let i = index - 1; i >= 0; i--) {
                    if (baseRows[i].dayOfWeek === 1) return i;
                }
                return 0;
            })();
        const weeklyTotal = baseRows.slice(weeklyStart, index + 1).reduce((sum, r) => sum + r.total, 0);
        const monthlyAccumulated = baseRows.slice(0, index + 1).reduce((sum, r) => sum + r.total, 0);

        return {
            date: row.date,
            cash: row.cash,
            others: row.others,
            total: row.total,
            weeklyTotal,
            monthlyAccumulated,
            is_weekend: row.is_weekend,
            is_holiday: row.is_holiday
        };
    });

    const monthlyTotalCash = dailySummaryWithTotals.reduce((acc, day) => acc + day.cash, 0);
    const monthlyTotalOthers = dailySummaryWithTotals.reduce((acc, day) => acc + day.others, 0);
    const monthlyTotal = dailySummaryWithTotals.reduce((acc, day) => acc + day.total, 0);

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
        <section className={styles.AppointmentReportTable__appointmentReport}>
            {/* Summary Table */}
            <article className={styles.AppointmentReportTable__appointmentReport__summary}>
                <header className={styles.AppointmentReportTable__appointmentReport__summaryHeader}>
                    <h3 className={styles.AppointmentReportTable__appointmentReport__summaryTitle}>{t('daily_summary')}</h3>
                </header>
                <div className={styles.AppointmentReportTable__appointmentReport__tableContainer}>
                    <table className={`${styles.AppointmentReportTable__appointmentReport__table} ${styles['appointmentReport__table--summary']}`}>
                        <thead>
                            <tr>
                                <th>{t('date_label')}</th>
                                <th className="text-right">{t('cash_cash_only')}</th>
                                <th className="text-right">{t('other_methods')}</th>
                                <th className="text-right">{t('daily_total')}</th>
                                <th className="text-right">{t('weekly_total') || 'Total Semanal'}</th>
                                <th className="text-right">{t('cumulative_monthly_total') || 'Total Mensual'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {dailySummaryWithTotals.map((day) => (
                                <tr 
                                    key={day.date} 
                                    className={`${styles.AppointmentReportTable__appointmentReport__row} ${day.is_weekend ? styles['AppointmentReportTable__row--weekend'] : ''} ${day.is_holiday ? styles['AppointmentReportTable__row--holiday'] : ''}`}
                                >
                                    <td>
                                        {day.date}
                                        {day.is_holiday && <span className={styles.AppointmentReportTable__appointmentReport__tagSmall}><Icon name="celebration" size="1rem" /></span>}
                                        {day.is_weekend && !day.is_holiday && <span className={styles.AppointmentReportTable__appointmentReport__tagSmall}><Icon name="calendar_today" size="1rem" /></span>}

                                        <span className={styles.AppointmentReportTable__appointmentReport__dayName}> {getDayOfWeek(day.date)}</span>
                                    </td>
                                    <td className="text-right">{formatCurrency(day.cash)}</td>
                                    <td className="text-right">{formatCurrency(day.others)}</td>
                                    <td className={`text-right ${styles.AppointmentReportTable__appointmentReport__cellBold}`}>
                                        {formatCurrency(day.total)}
                                    </td>
                                    <td className="text-right">{formatCurrency(day.weeklyTotal)}</td>
                                    <td className={`text-right ${styles.AppointmentReportTable__appointmentReport__cellBold}`}>{formatCurrency(day.monthlyAccumulated)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className={styles.AppointmentReportTable__appointmentReport__footerSubtotal}>
                                <td>{t('monthly_cash_total')}</td>
                                <td colSpan="5" className="text-right">
                                    {formatCurrency(monthlyTotalCash)}
                                </td>
                            </tr>
                            <tr className={styles.AppointmentReportTable__appointmentReport__footerSubtotal}>
                                <td>{t('monthly_others_total')}</td>
                                <td colSpan="5" className="text-right">
                                    {formatCurrency(monthlyTotalOthers)}
                                </td>
                            </tr>
                            <tr className={styles.AppointmentReportTable__appointmentReport__footer}>
                                <td>{t('monthly_accumulated_total')}</td>
                                <td colSpan="5" className="text-right">
                                    {formatCurrency(monthlyTotal)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </article>

            {/* Detailed Daily Breakdown */}
            <div className={styles.AppointmentReportTable__appointmentReport__tableContainer}>
                <table className={styles.AppointmentReportTable__appointmentReport__table}>
                    <thead>
                        <tr>
                            <th>{t('date_label')}</th>
                            <th>{t('detail')}</th>
                            <th>{t('patient')}</th>
                            <th>{t('time')}</th>
                            <th>{t('status')}</th>
                            <th>{t('payment')}</th>
                            <th className="text-right">{t('amount')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((dayGroup) => (
                            <React.Fragment key={dayGroup.date}>
                                <tr className={`${styles.AppointmentReportTable__appointmentReport__dayHeader} ${dayGroup.is_weekend ? styles['AppointmentReportTable__dayHeader--weekend'] : ''} ${dayGroup.is_holiday ? styles['AppointmentReportTable__dayHeader--holiday'] : ''}`}>
                                    <td colSpan="7">
                                        <Icon name="calendar_today" size="1rem" className="mr-1" /> {dayGroup.date}
                                        {dayGroup.is_holiday && (
                                            <span className={styles.AppointmentReportTable__appointmentReport__holidayTag}>
                                                <Icon name="celebration" size="1rem" />
                                                {dayGroup.holiday_description}
                                            </span>
                                        )}

                                        {dayGroup.is_weekend && !dayGroup.is_holiday && (
                                            <span className={styles.AppointmentReportTable__appointmentReport__weekendNote}>
                                                ({t('weekend_short')})
                                            </span>
                                        )}
                                    </td>
                                </tr>
                                {dayGroup.appointments.map((appt) => {
                                    const patientName = appt.patient_name ?? appt.nombre ?? '-';
                                    const timeStr = appt.appointment_date 
                                        ? new Date(appt.appointment_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
                                        : (appt.hora ?? '-');
                                    const infoStr = appt.reason ?? appt.info ?? appt.type ?? '-';
                                    const statusStr = appt.status ?? appt.asistencia ?? 'pending';
                                    const paymentStr = appt.payment_status ?? appt.pago ?? 'pending';
                                    const paidAmount = Number(appt.paid_amount ?? appt.monto_pagado ?? 0);

                                    return (
                                        <tr 
                                            key={appt.id || `${dayGroup.date}-${timeStr}-${patientName}`} 
                                            className={`${styles.AppointmentReportTable__appointmentReport__row} ${appt.is_out_of_hours ? styles['AppointmentReportTable__row--overturn'] : ''}`}
                                        >
                                            <td className={styles.AppointmentReportTable__appointmentReport__cellDay}>{dayGroup.date}</td>
                                            <td>
                                                {infoStr}
                                                {appt.is_out_of_hours && <span className={styles.AppointmentReportTable__appointmentReport__overturnBadge}>{t('overturn')}</span>}
                                            </td>
                                            <td className={styles.AppointmentReportTable__appointmentReport__cellPatient}>{patientName}</td>
                                            <td className={styles.AppointmentReportTable__appointmentReport__cellTime}>{timeStr}</td>
                                            <td>
                                                <span className={`${styles.AppointmentReportTable__appointmentReport__badge} ${styles[`appointmentReport__badge--${statusStr}`] || ''}`}>
                                                    {t(statusStr) || statusStr}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.AppointmentReportTable__appointmentReport__paymentInfo}>
                                                    <span className={`${styles.AppointmentReportTable__appointmentReport__badge} ${styles[`appointmentReport__badge--${paymentStr}`] || ''}`}>
                                                        {t(paymentStr) || paymentStr}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={styles.AppointmentReportTable__appointmentReport__cellAmount}>
                                                {paidAmount > 0 ? formatCurrency(paidAmount) : '-'}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};


