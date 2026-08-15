import React from 'react';
import Icon from '@/components/atoms/Icon';
import { parseDate } from '@/utils/core/dateUtils';
import { formatCurrency } from '@/utils/core/format';
import styles from './AppointmentReportTable.module.css';

export const AppointmentReportTable = ({ data, t }) => {
    const list = Array.isArray(data?.appointments) ? data.appointments : (Array.isArray(data) ? data : []);

    if (!list || list.length === 0) {
        return <div className={styles.appointmentReport__empty}>{t('no_data_to_display')}</div>;
    }

    // Compute running totals for weekly and monthly progression
    let currentWeeklySum = 0;
    let currentMonthlySum = 0;

    const dailySummaryWithTotals = list.map((dayGroup, index) => {
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

        const others = Math.max(0, total - cash);
        const parsedDate = parseDate(dayGroup.date);
        const dayOfWeek = parsedDate ? parsedDate.getDay() : 0;

        // Reset weekly sum on Monday (dayOfWeek === 1) or at start of list
        if (index === 0 || dayOfWeek === 1) {
            currentWeeklySum = total;
        } else {
            currentWeeklySum += total;
        }

        currentMonthlySum += total;

        return {
            date: dayGroup.date,
            cash,
            others,
            total,
            weeklyTotal: currentWeeklySum,
            monthlyAccumulated: currentMonthlySum,
            is_weekend: dayGroup.is_weekend,
            is_holiday: dayGroup.is_holiday
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
        <section className={styles.appointmentReport}>
            {/* Summary Table */}
            <article className={styles.appointmentReport__summary}>
                <header className={styles.appointmentReport__summaryHeader}>
                    <h3 className={styles.appointmentReport__summaryTitle}>{t('daily_summary')}</h3>
                </header>
                <div className={styles.appointmentReport__tableContainer}>
                    <table className={`${styles.appointmentReport__table} ${styles['appointmentReport__table--summary']}`}>
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
                                    className={`${styles.appointmentReport__row} ${day.is_weekend ? styles['appointmentReport__row--weekend'] : ''} ${day.is_holiday ? styles['appointmentReport__row--holiday'] : ''}`}
                                >
                                    <td>
                                        {day.date}
                                        {day.is_holiday && <span className={styles.appointmentReport__tagSmall}><Icon name="celebration" size="1rem" /></span>}
                                        {day.is_weekend && !day.is_holiday && <span className={styles.appointmentReport__tagSmall}><Icon name="calendar_today" size="1rem" /></span>}

                                        <span className={styles.appointmentReport__dayName}> {getDayOfWeek(day.date)}</span>
                                    </td>
                                    <td className="text-right">{formatCurrency(day.cash)}</td>
                                    <td className="text-right">{formatCurrency(day.others)}</td>
                                    <td className={`text-right ${styles.appointmentReport__cellBold}`}>
                                        {formatCurrency(day.total)}
                                    </td>
                                    <td className="text-right">{formatCurrency(day.weeklyTotal)}</td>
                                    <td className={`text-right ${styles.appointmentReport__cellBold}`}>{formatCurrency(day.monthlyAccumulated)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr className={styles.appointmentReport__footerSubtotal}>
                                <td>{t('monthly_cash_total')}</td>
                                <td colSpan="5" className="text-right">
                                    {formatCurrency(monthlyTotalCash)}
                                </td>
                            </tr>
                            <tr className={styles.appointmentReport__footerSubtotal}>
                                <td>{t('monthly_others_total')}</td>
                                <td colSpan="5" className="text-right">
                                    {formatCurrency(monthlyTotalOthers)}
                                </td>
                            </tr>
                            <tr className={styles.appointmentReport__footer}>
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
            <div className={styles.appointmentReport__tableContainer}>
                <table className={styles.appointmentReport__table}>
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
                                <tr className={`${styles.appointmentReport__dayHeader} ${dayGroup.is_weekend ? styles['appointmentReport__dayHeader--weekend'] : ''} ${dayGroup.is_holiday ? styles['appointmentReport__dayHeader--holiday'] : ''}`}>
                                    <td colSpan="7">
                                        <Icon name="calendar_today" size="1rem" className="mr-1" /> {dayGroup.date}
                                        {dayGroup.is_holiday && (
                                            <span className={styles.appointmentReport__holidayTag}>
                                                <Icon name="celebration" size="1rem" />
                                                {dayGroup.holiday_description}
                                            </span>
                                        )}

                                        {dayGroup.is_weekend && !dayGroup.is_holiday && (
                                            <span className={styles.appointmentReport__weekendNote}>
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
                                            className={`${styles.appointmentReport__row} ${appt.is_out_of_hours ? styles['appointmentReport__row--overturn'] : ''}`}
                                        >
                                            <td className={styles.appointmentReport__cellDay}>{dayGroup.date}</td>
                                            <td>
                                                {infoStr}
                                                {appt.is_out_of_hours && <span className={styles.appointmentReport__overturnBadge}>{t('overturn')}</span>}
                                            </td>
                                            <td className={styles.appointmentReport__cellPatient}>{patientName}</td>
                                            <td className={styles.appointmentReport__cellTime}>{timeStr}</td>
                                            <td>
                                                <span className={`${styles.appointmentReport__badge} ${styles[`appointmentReport__badge--${statusStr}`] || ''}`}>
                                                    {t(statusStr) || statusStr}
                                                </span>
                                            </td>
                                            <td>
                                                <div className={styles.appointmentReport__paymentInfo}>
                                                    <span className={`${styles.appointmentReport__badge} ${styles[`appointmentReport__badge--${paymentStr}`] || ''}`}>
                                                        {t(paymentStr) || paymentStr}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className={styles.appointmentReport__cellAmount}>
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


