
import React from 'react';
import './BalanceView.css';

const BalanceView = ({ reportData, month, year, t }) => {
    if (!reportData) return null;

    const appts = Array.isArray(reportData?.appointments) ? reportData.appointments : [];
    const pres = Array.isArray(reportData?.prescriptions) ? reportData.prescriptions : [];
    const licenses = Array.isArray(reportData?.licenses) ? reportData.licenses : [];
    const certificates = Array.isArray(reportData?.certificates) ? reportData.certificates : [];
    const withdrawals = Array.isArray(reportData?.withdrawals) ? reportData.withdrawals : [];

    // Totals Calculation
    let totalAppts = 0;
    let totalPres = 0;
    let totalLicenses = 0;
    let totalCertificates = 0;
    let totalWithdrawals = withdrawals.reduce((acc, w) => acc + Number(w.monto || 0), 0);
    let allDebts = [];

    appts.forEach(day => {
        if (Array.isArray(day.appointments)) {
            day.appointments.forEach(a => {
                if (Number(a.monto_pagado) > 0) {
                    totalAppts += Number(a.monto_pagado);
                }
                const debtAmt = Number(a.debt_amount || 0);
                // Si no fue atendido (estado no completado o llegado), no se considera deuda
                const isAttended = ['completed', 'attended', 'arrived'].includes(a.asistencia);
                if (isAttended && ((a.pago === 'debt' || a.pago === 'debe') || debtAmt > 0)) {
                    allDebts.push({
                        date: day.date,
                        type: 'Turno',
                        patient: a.nombre,
                        amount: debtAmt
                    });
                }
            });
        }
    });

    pres.forEach(p => {
        const amt = Number(p.amount || 0);
        const status = (p.payment_status || '').toLowerCase();
        if (status === 'paid' || status === 'pagado') {
            totalPres += amt;
        } else if (status === 'debt' || status === 'debe') {
            allDebts.push({
                date: p.date ? new Date(p.date).toLocaleDateString() : '-',
                type: 'Receta',
                patient: p.patient_name,
                amount: amt
            });
        }
    });

    licenses.forEach(l => {
        const amt = Number(l.amount || 0);
        const status = (l.payment_status || '').toLowerCase();
        if (status === 'paid' || status === 'pagado') {
            totalLicenses += amt;
        } else if (status === 'debt' || status === 'debe') {
            allDebts.push({
                date: l.date ? new Date(l.date).toLocaleDateString() : '-',
                type: 'Licencia',
                patient: l.patient_name,
                amount: amt
            });
        }
    });

    certificates.forEach(c => {
        const amt = Number(c.amount || 0);
        const status = (c.payment_status || '').toLowerCase();
        if (status === 'paid' || status === 'pagado') {
            totalCertificates += amt;
        } else if (status === 'debt' || status === 'debe') {
            allDebts.push({
                date: c.date ? new Date(c.date).toLocaleDateString() : '-',
                type: 'Certificado',
                patient: c.patient_name,
                amount: amt
            });
        }
    });

    const totalIncome = totalAppts + totalPres + totalLicenses + totalCertificates;
    const netTotal = totalIncome - totalWithdrawals;
    const totalDebt = allDebts.reduce((a, b) => a + b.amount, 0);

    return (
        <div className="balance-view">
            <h2 className="balance-view__title">
                Balance General - {t('months_array')[month - 1]} {year}
            </h2>

            <div className="balance-view__grid">
                <section className="balance-view__card balance-view__card--summary">
                    <h3 className="balance-view__card-title">Resumen Financiero</h3>

                    <div className="balance-view__summary-item">
                        <span>Total Turnos:</span>
                        <span className="balance-view__amount balance-view__amount--positive">
                            $ {totalAppts.toLocaleString()}
                        </span>
                    </div>

                    <div className="balance-view__summary-item">
                        <span>Total Recetas:</span>
                        <span className="balance-view__amount balance-view__amount--positive">
                            $ {totalPres.toLocaleString()}
                        </span>
                    </div>

                    <div className="balance-view__summary-item">
                        <span>Total Licencias:</span>
                        <span className="balance-view__amount balance-view__amount--positive">
                            $ {totalLicenses.toLocaleString()}
                        </span>
                    </div>

                    <div className="balance-view__summary-item">
                        <span>Total Certificados:</span>
                        <span className="balance-view__amount balance-view__amount--positive">
                            $ {totalCertificates.toLocaleString()}
                        </span>
                    </div>

                    <div className="balance-view__summary-item balance-view__summary-item--subtotal">
                        <span>SUBTOTAL INGRESOS:</span>
                        <span>$ {totalIncome.toLocaleString()}</span>
                    </div>

                    <div className="balance-view__summary-item balance-view__summary-item--withdrawals">
                        <span>(-) Retiros Doctora:</span>
                        <span>$ {totalWithdrawals.toLocaleString()}</span>
                    </div>

                    <div className="balance-view__summary-item balance-view__summary-item--net">
                        <span>RESULTADO NETO:</span>
                        <span>$ {netTotal.toLocaleString()}</span>
                    </div>
                </section>

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
                                {appts
                                    .filter(day => {
                                        const [d, m, y] = day.date.split('/');
                                        const dayDate = new Date(y, m - 1, d);
                                        const today = new Date();
                                        today.setHours(0, 0, 0, 0);
                                        return dayDate <= today;
                                    })
                                    .slice()
                                    .reverse()
                                    .map((day, idx) => {
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
                                    <td className="text-right">
                                        $ {appts
                                            .filter(day => {
                                                const [d, m, y] = day.date.split('/');
                                                const dayDate = new Date(y, m - 1, d);
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                return dayDate <= today;
                                            })
                                            .reduce((acc, d) => acc + Number(d.total_efectivo || 0), 0)
                                            .toLocaleString()}
                                    </td>
                                    <td className="text-right">
                                        $ {appts
                                            .filter(day => {
                                                const [d, m, y] = day.date.split('/');
                                                const dayDate = new Date(y, m - 1, d);
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                return dayDate <= today;
                                            })
                                            .reduce((acc, d) => {
                                                const total = Number(d.total_paid || 0);
                                                const cash = Number(d.total_efectivo || 0);
                                                return acc + (total - cash);
                                            }, 0)
                                            .toLocaleString()}
                                    </td>
                                    <td className="text-right">
                                        $ {appts
                                            .filter(day => {
                                                const [d, m, y] = day.date.split('/');
                                                const dayDate = new Date(y, m - 1, d);
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                return dayDate <= today;
                                            })
                                            .reduce((acc, d) => acc + Number(d.total_paid || 0), 0)
                                            .toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>

                <section className="balance-view__card balance-view__card--debts">
                    <h3 className="balance-view__card-title">Deudas Pendientes</h3>

                    {allDebts.length === 0 ? (
                        <p className="balance-view__empty-msg">No hay deudas registradas.</p>
                    ) : (
                        <div className="balance-view__table-wrapper">
                            <table className="balance-view__table">
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Paciente</th>
                                        <th>Origen</th>
                                        <th className="text-right">Monto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allDebts.map((d, i) => (
                                        <tr key={i} className="balance-view__row">
                                            <td>{d.date}</td>
                                            <td className="balance-view__cell-patient">{d.patient}</td>
                                            <td className="balance-view__cell-type">{d.type}</td>
                                            <td className="balance-view__cell-amount">
                                                {d.amount > 0 ? `$${d.amount.toLocaleString()}` : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div className="balance-view__debt-total">
                        Total Deuda Detectada: $ {totalDebt.toLocaleString()}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default BalanceView;
