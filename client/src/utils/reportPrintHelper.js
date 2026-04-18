
/**
 * Helper to handle report printing with consistent styling
 */
export const printReport = (data, options) => {
    const { activeTab, month, year, t } = options;
    if (!data) return;

    try {
        const printWindow = window.open('', '_blank');
        const customAlert = options.alert || window.alert;
        if (!printWindow) return customAlert(t('allow_popups_error') || "Por favor permita ventanas emergentes para imprimir.");

        const monthName = (t && t('months_array') && t('months_array')[month - 1]) || 'Mes';
        const pageTitle = activeTab === 'balance' ? t('balance_report_title') :
            (activeTab === 'prescriptions' ? t('prescriptions_report_title') : t('appointments_report_title'));

        const baseStyles = `
            body { font-family: 'Courier New', monospace; padding: 20px; max-width: 1000px; margin: 0 auto; line-height: 1.2; color: #000; font-size: 12px; }
            h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 20px; text-transform: uppercase; font-size: 18px; }
            h2 { border-bottom: 1px solid #000; padding-bottom: 3px; margin-top: 20px; font-size: 14px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
            th { text-align: left; border-bottom: 1px solid #000; padding: 4px; font-weight: bold; font-size: 11px; text-transform: uppercase; }
            td { border-bottom: 1px dotted #ccc; padding: 6px 4px; vertical-align: top; font-size: 11px; word-wrap: break-word; }
            .amount { font-weight: bold; text-align: right; white-space: nowrap; width: 100px; }
            .time { white-space: nowrap; width: 75px; min-width: 75px; }
            .meta { color: #333; white-space: pre-wrap; }
            .summary-box { border: 1px solid #000; padding: 15px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 12px; }
            .row--total { font-weight: bold; border-top: 1px dashed #000; padding-top: 5px; margin-top: 5px; }
            .row--net { font-size: 16px; font-weight: 900; border-top: 2px solid #000; padding-top: 10px; margin-top: 10px; }
            .day-group { margin-top: 15px; page-break-inside: avoid; }
            .day-header { font-weight: bold; font-size: 12px; background: #f0f0f0; padding: 3px 8px; border: 1px solid #ccc; display: flex; justify-content: space-between; }
            .day-header--weekend { background: #fffbe6; color: #856404; }
            .day-header--holiday { background: #f8d7da; color: #721c24; }
            .row--overturn { background-color: #e7f3ff; }
            .tag { font-size: 9px; font-weight: bold; text-transform: uppercase; padding: 1px 3px; border-radius: 2px; margin-left: 5px; }
            .tag--overturn { background: #bbdefb; color: #1e40af; }
            .tag--holiday { background: #f5c6cb; color: #721c24; }
            .withdrawal { color: red; }
            @media print { 
                .no-print { display: none; } 
                body { padding: 0; margin: 0; }
                @page { margin: 1cm; }
            }
        `;

        let content = '';
        if (activeTab === 'balance') {
            content = generateBalancePrint(data, monthName, year, t);
        } else if (activeTab === 'appointments') {
            content = generateAppointmentsPrint(data, monthName, year, t);
        } else if (activeTab === 'prescriptions') {
            content = generatePrescriptionsPrint(data, monthName, year, t);
        }

        const html = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <title>${pageTitle} - ${monthName} ${year}</title>
                    <style>${baseStyles}</style>
                </head>
                <body>
                    ${content}
                    <script>window.onload = function() { window.print(); }</script>
                </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    } catch (error) {
        console.error("Error generating print report:", error);
    }
};

const generateBalancePrint = (reportData, monthName, year, t) => {
    const appts = Array.isArray(reportData?.appointments) ? reportData.appointments : [];
    const pres = Array.isArray(reportData?.prescriptions) ? reportData.prescriptions : [];
    const withdrawals = Array.isArray(reportData?.withdrawals) ? reportData.withdrawals : [];

    let totalAppts = 0;
    let totalPres = 0;
    let totalWithdrawals = withdrawals.reduce((acc, w) => acc + Number(w.monto || 0), 0);
    let allDebts = [];

    appts.forEach(day => {
        if (Array.isArray(day.appointments)) {
            day.appointments.forEach(a => {
                const paid = Number(a.monto_pagado || 0);
                if (paid > 0) totalAppts += paid;
                const debtAmt = Number(a.debt_amount || 0);
                // Si no fue atendido (estado no completado o llegado), no se considera deuda
                const isAttended = ['completed', 'attended', 'arrived'].includes(a.asistencia);
                if (isAttended && ((a.pago === 'debt' || a.pago === 'debe') || debtAmt > 0)) {
                    allDebts.push({
                        date: day.date,
                        type: 'Turno',
                        patient: a.nombre,
                        amount: debtAmt,
                        is_weekend: day.is_weekend,
                        is_holiday: day.is_holiday
                    });
                }
            });
        }
    });

    pres.forEach(p => {
        const amt = Number(p.amount || 0);
        const status = (p.payment_status || '').toLowerCase();
        if (status === 'paid' || status === 'pagado') totalPres += amt;
        else if (status === 'debt' || status === 'debe') {
            allDebts.push({ date: p.date ? new Date(p.date).toLocaleDateString() : '-', type: 'Receta', patient: p.patient_name, amount: amt });
        }
    });

    const totalIncome = totalAppts + totalPres;
    const netTotal = totalIncome - totalWithdrawals;

    return `
        <h1>${t('balance_report_title')}: ${monthName} ${year}</h1>
        <div class="summary-box">
            <div class="row"><span>${t('turn_income')}:</span><span>$${totalAppts.toLocaleString()}</span></div>
            <div class="row"><span>${t('prescription_income')}:</span><span>$${totalPres.toLocaleString()}</span></div>
            <div class="row row--total"><span>${t('subtotal_income')}:</span><span>$${totalIncome.toLocaleString()}</span></div>
            <div class="row withdrawal" style="margin-top: 15px;"><span>(-) ${t('withdrawal')}:</span><span>-$${totalWithdrawals.toLocaleString()}</span></div>
            <div class="row row--net"><span>${t('result_neto')}:</span><span>$${netTotal.toLocaleString()}</span></div>
        </div>

        <h2>${t('cash_rendering')}</h2>
        <table>
            <thead>
                <tr>
                    <th>${t('date_label')}</th>
                    <th class="amount">${t('cash_to_render')}</th>
                </tr>
            </thead>
            <tbody>
                ${appts.map(day => `
                    <tr>
                        <td>${day.date}</td>
                        <td class="amount">$${Number(day.total_efectivo || 0).toLocaleString()}</td>
                    </tr>
                `).reverse().join('')}
            </tbody>
            <tfoot>
                <tr style="font-weight: bold; border-top: 2px solid #000;">
                    <td style="padding-top: 10px;">${t('total_cash_to_render')}:</td>
                    <td class="amount" style="padding-top: 10px;">$${appts.reduce((acc, d) => acc + Number(d.total_efectivo || 0), 0).toLocaleString()}</td>
                </tr>
            </tfoot>
        </table>

        <h2 style="margin-top: 40px;">${t('pending_debt')}</h2>
        ${allDebts.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th style="width: 100px;">${t('date_label')}</th>
                        <th style="width: 300px;">${t('patient_label')}</th>
                        <th style="width: 150px;">${t('origin')}</th>
                        <th class="amount">${t('amount')}</th>
                    </tr>
                </thead>
                <tbody>
                    ${allDebts.map(d => `
                        <tr class="${d.is_weekend ? 'day-header--weekend' : ''} ${d.is_holiday ? 'day-header--holiday' : ''}">
                            <td>${d.date} ${d.is_holiday ? '*' : ''}</td>
                            <td>${d.patient}</td>
                            <td>${d.type}</td>
                            <td class="amount">$${d.amount.toLocaleString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div style="text-align: right; margin-top: 20px; font-weight: bold; font-size: 14px;">
                ${t('total_debt')}: $${allDebts.reduce((a, b) => a + b.amount, 0).toLocaleString()}
            </div>
        ` : `<p>${t('no_debts_found_report')}</p>`}
    `;
};

const generateAppointmentsPrint = (reportData, monthName, year, t) => {
    const list = Array.isArray(reportData?.appointments) ? reportData.appointments : (Array.isArray(reportData) ? reportData : []);
    let total = 0;

    return `
        <h1>${t('appointments_report_title')}: ${monthName} ${year}</h1>
            ${list.map(day => {
        const dayAppts = Array.isArray(day.appointments) ? day.appointments : [];
        return `
            <div class="day-group">
                <div class="day-header ${day.is_weekend ? 'day-header--weekend' : ''} ${day.is_holiday ? 'day-header--holiday' : ''}">
                    <span>📅 ${day.date || ''}</span>
                    ${day.is_holiday ? `<span class="tag tag--holiday">${day.holiday_description || t('holiday')}</span>` : ''}
                    ${day.is_weekend && !day.is_holiday ? `<span style="font-size: 10px; opacity: 0.8;">(${t('weekend') || 'Finde'})</span>` : ''}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 75px;">${t('time_header')}</th>
                            <th style="width: 300px;">${t('patient_label')} / ${t('doctor_label')}</th>
                            <th style="width: 250px;">${t('payment')} / ${t('status')}</th>
                            <th class="amount">${t('amount')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${dayAppts.map(appt => {
            const paid = Number(appt.monto_pagado || 0);
            total += paid;
            const metaInfo = `${appt.pago || ''} ${appt.metodos_pago ? `(${appt.metodos_pago})` : ''} | ${appt.asistencia || ''}`;
            return `
                            <tr class="${appt.is_overturn ? 'row--overturn' : ''}">
                                <td class="time">${appt.hora || ''}</td>
                                <td>
                                    <strong>${appt.nombre || ''}</strong>
                                    ${appt.is_overturn ? `<span class="tag tag--overturn" style="font-size: 8px;">${t('overturn_badge')}</span>` : ''}
                                </td>
                                <td class="meta">${metaInfo}</td>
                                <td class="amount">${paid > 0 ? '$' + paid.toLocaleString() : '-'}</td>
                            </tr>`;
        }).join('')}
                    </tbody>
                </table>
            </div>`;
    }).join('')
        }
    <div style="margin-top: 30px; border-top: 2px solid #000; padding: 10px 0; text-align: right; font-size: 14px; font-weight: bold;">
        ${t('total_appointments_income')}: $${total.toLocaleString()}
    </div>
    `;
};

const generatePrescriptionsPrint = (reportData, monthName, year, t) => {
    const list = Array.isArray(reportData?.prescriptions) ? reportData.prescriptions : [];
    let total = 0;

    return `
        <h1>${t('prescriptions_report_title')}: ${monthName} ${year}</h1>
        <table>
            <thead>
                <tr>
                    <th style="width: 100px;">${t('date_label')}</th>
                    <th style="width: 250px;">${t('patient_label')}</th>
                    <th style="width: 200px;">${t('medications')}</th>
                    <th style="width: 180px;">${t('status')} / ${t('payment')}</th>
                    <th class="amount">${t('amount')}</th>
                </tr>
            </thead>
            <tbody>
                ${list.map(item => {
        const amt = Number(item.amount || 0);
        if (item.payment_status === 'paid' || item.payment_status === 'pagado') total += amt;
        const itemStatus = `${item.payment_status || ''} ${item.payment_method ? `(${item.payment_method})` : ''}`;
        const itemDate = item.date ? new Date(item.date).toLocaleDateString() : '';
        return `
                        <tr>
                            <td>${itemDate}</td>
                            <td><strong>${item.patient_name || ''}</strong></td>
                            <td class="meta" title="${item.medications || ''}">${item.medications || ''}</td>
                            <td class="meta">${itemStatus}</td>
                            <td class="amount">${amt > 0 ? '$' + amt.toLocaleString() : '-'}</td>
                        </tr>
                    `;
    }).join('')}
            </tbody>
        </table>
        <div style="text-align: right; margin-top: 20px; font-weight: bold; font-size: 14px;">
            ${t('total_prescriptions_income')}: $${total.toLocaleString()}
        </div>
    `;
};
