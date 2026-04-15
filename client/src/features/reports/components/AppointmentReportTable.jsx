import React from 'react';
import Icon from '@/components/atoms/Icon';
import { parseDate } from '@/utils/dateUtils';
import './AppointmentReportTable.css';

const AppointmentReportTable = ({ data, t }) => {
    const list = Array.isArray(data?.appointments) ? data.appointments : (Array.isArray(data) ? data : []);

    if (!list || list.length === 0) {
        return <div className="report-table-empty">{t('no_data_to_display')}</div>;
    }

    // Calculate summary by day and payment method
    const dailySummary = list.map(dayGroup => {
        let cash = 0;
        let others = 0;
        let total = 0;

        dayGroup.appointments.forEach(appt => {
            const paidAmount = Number(appt.monto_pagado || 0);
            const cashAmount = Number(appt.monto_efectivo || 0);

            cash += cashAmount;
            others += (paidAmount - cashAmount);
            total += paidAmount;
        });

        return {
            date: dayGroup.date,
            cash,
            others,
            total,
            is_weekend: dayGroup.is_weekend,
            is_holiday: dayGroup.is_holiday
        };
    });

    const monthlyTotalCash = dailySummary.reduce((acc, day) => acc + day.cash, 0);
    const monthlyTotalOthers = dailySummary.reduce((acc, day) => acc + day.others, 0);
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
        <section className="appointment-report">
            {/* Summary Table */}
            <article className="appointment-report__summary">
                <header className="appointment-report__summary-header">
                    <h3 className="appointment-report__summary-title">{t('daily_summary')}</h3>
                </header>
                <table className="appointment-report__table appointment-report__table--summary">
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
                            <tr key={idx} className={`appointment-report__row ${day.is_weekend ? 'appointment-report__row--weekend' : ''} ${day.is_holiday ? 'appointment-report__row--holiday' : ''}`}>
                                <td>
                                    {day.date}
                                    {day.is_holiday && <Icon name="FLARE" size="0.8rem" className="appointment-report__tag-small" />}
                                    {day.is_weekend && !day.is_holiday && <Icon name="CALENDAR_TODAY" size="0.8rem" className="appointment-report__tag-small" />}
                                    <span className="appointment-report__day-name"> {getDayOfWeek(day.date)}</span>
                                </td>
                                <td className="text-right">$ {day.cash.toLocaleString()}</td>
                                <td className="text-right">$ {day.others.toLocaleString()}</td>
                                <td className="text-right appointment-report__cell--bold">
                                    $ {day.total.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="appointment-report__footer-subtotal">
                            <td>{t('monthly_cash_total')}</td>
                            <td colSpan="3" className="text-right">
                                $ {monthlyTotalCash.toLocaleString()}
                            </td>
                        </tr>
                        <tr className="appointment-report__footer-subtotal">
                            <td>{t('monthly_others_total')}</td>
                            <td colSpan="3" className="text-right">
                                $ {monthlyTotalOthers.toLocaleString()}
                            </td>
                        </tr>
                        <tr className="appointment-report__footer">
                            <td>{t('monthly_accumulated_total')}</td>
                            <td colSpan="3" className="text-right">
                                $ {monthlyTotal.toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </article>

            {/* Detailed Daily Breakdown */}
            <div className="table-responsive">
                <table className="appointment-report__table">
                    <thead>
                        <tr>
                            <th>{t('date_label')}</th>
                            <th>{t('detail')}</th>
                            <th>{t('patient')}</th>
                            <th>{t('time')}</th>
                            <th>{t('status')}</th>
                            <th>{t('payment')}</th>
                            <th>{t('amount')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((dayGroup, idx) => (
                            <React.Fragment key={idx}>
                                <tr className={`appointment-report__day-header ${dayGroup.is_weekend ? 'appointment-report__day-header--weekend' : ''} ${dayGroup.is_holiday ? 'appointment-report__day-header--holiday' : ''}`}>
                                    <td colSpan="7">
                                        <Icon name="DATE_RANGE" size="1.2rem" className="appointment-report__header-icon" /> {dayGroup.date}
                                        {dayGroup.is_holiday && <span className="appointment-report__holiday-tag"><Icon name="FLARE" size="1.1rem" /> {dayGroup.holiday_description}</span>}
                                        {dayGroup.is_weekend && !dayGroup.is_holiday && <span className="appointment-report__weekend-note">({t('weekend_short') || 'Finde'})</span>}
                                    </td>
                                </tr>
                                {dayGroup.appointments.map((appt, i) => (
                                    <tr key={`${idx}-${i}`} className={`appointment-report__row ${appt.is_overturn ? 'appointment-report__row--overturn' : ''}`}>
                                        <td className="appointment-report__cell-day">{appt.dia}</td>
                                        <td>
                                            {appt.info}
                                            {appt.is_overturn && <span className="appointment-report__overturn-badge">{t('overturn') || 'Sobreturno'}</span>}
                                        </td>
                                        <td className="appointment-report__cell-patient">{appt.nombre}</td>
                                        <td className="appointment-report__cell-time">{appt.hora}</td>
                                        <td>
                                            <span className={`appointment-report__badge appointment-report__badge--status-${appt.asistencia}`}>
                                                {t(appt.asistencia) || appt.asistencia}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="appointment-report__payment-info">
                                                <span className={`appointment-report__badge appointment-report__badge--payment-${appt.pago}`}>
                                                    {t(appt.pago) || appt.pago}
                                                </span>
                                                {appt.metodos_pago && (
                                                    <span className="appointment-report__methods">
                                                        {appt.metodos_pago}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="appointment-report__cell-amount">
                                            {Number(appt.monto_pagado) > 0 ? `$${appt.monto_pagado}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default AppointmentReportTable;
