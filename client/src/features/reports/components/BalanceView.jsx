import React from 'react';
import { formatDate } from '../../../utils/dateUtils';

// Molecules
import { BalanceFinancialSummary, BalanceCashFlowTable, BalanceDebtsTable } from '../../finances';

import './BalanceView.css';

/**
 * BalanceView Organism.
 * Orchestrates financial reporting by aggregating data for a specific period and 
 * presenting summaries of income, cash flow, and outstanding debts.
 */
const BalanceView = ({ reportData, month, year, t }) => {
    if (!reportData) return null;

    const appts = Array.isArray(reportData?.appointments) ? reportData.appointments : [];
    const pres = Array.isArray(reportData?.prescriptions) ? reportData.prescriptions : [];
    const licenses = Array.isArray(reportData?.licenses) ? reportData.licenses : [];
    const certificates = Array.isArray(reportData?.certificates) ? reportData.certificates : [];
    const withdrawals = Array.isArray(reportData?.withdrawals) ? reportData.withdrawals : [];

    // Totals Calculation
    const totalIncome = appts.reduce((acc, day) => acc + Number(day.total_paid || 0), 0);
    const totalAppts = appts.reduce((acc, day) =>
        acc + day.appointments.reduce((sum, a) => sum + Number(a.monto_pagado || 0), 0), 0);

    const calculateItemTotal = (items) => items.reduce((acc, item) =>
        (item.payment_status?.toLowerCase() === 'paid' || item.payment_status?.toLowerCase() === 'pagado')
            ? acc + Number(item.amount || 0)
            : acc, 0
    );

    const totalPres = calculateItemTotal(pres);
    const totalLicenses = calculateItemTotal(licenses);
    const totalCertificates = calculateItemTotal(certificates);

    const otherOrPastIncome = Math.max(0, totalIncome - (totalAppts + totalPres + totalLicenses + totalCertificates));
    const totalWithdrawals = withdrawals.reduce((acc, w) => acc + Number(w.monto || 0), 0);

    // Debt Aggregation
    let allDebts = [];
    appts.forEach(day => {
        if (Array.isArray(day.appointments)) {
            day.appointments.forEach(a => {
                const debtAmt = Number(a.debt_amount || 0);
                const isAttended = ['completed', 'attended', 'arrived', 'absent'].includes(a.asistencia);
                if (isAttended && debtAmt > 0) {
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

    const addRequestDebts = (items, type) => {
        items.forEach(item => {
            const status = (item.payment_status || '').toLowerCase();
            if (status === 'debt' || status === 'debe' || status === 'pending') {
                allDebts.push({
                    date: formatDate(item.date),
                    type,
                    patient: item.patient_name,
                    amount: Number(item.amount || 0)
                });
            }
        });
    };

    addRequestDebts(pres, 'Receta');
    addRequestDebts(licenses, 'Licencia');
    addRequestDebts(certificates, 'Certificado');

    const netTotal = totalIncome - totalWithdrawals;
    const totalDebt = allDebts.reduce((a, b) => a + b.amount, 0);

    return (
        <div className="balance-view">
            <h2 className="balance-view__title">
                Balance General - {t('months_array')[month - 1]} {year}
            </h2>

            <div className="balance-view__grid">
                <BalanceFinancialSummary
                    totalAppts={totalAppts}
                    totalPres={totalPres}
                    totalLicenses={totalLicenses}
                    totalCertificates={totalCertificates}
                    otherOrPastIncome={otherOrPastIncome}
                    totalIncome={totalIncome}
                    totalWithdrawals={totalWithdrawals}
                    netTotal={netTotal}
                    t={t}
                />

                <BalanceCashFlowTable
                    appointments={appts}
                    t={t}
                />

                <BalanceDebtsTable
                    debts={allDebts}
                    totalDebt={totalDebt}
                    t={t}
                />
            </div>
        </div>
    );
};

export default BalanceView;
