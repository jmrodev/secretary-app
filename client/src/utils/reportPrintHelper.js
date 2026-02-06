
/**
 * Helper to handle report printing with consistent styling
 */
export const printReport = (data, options) => {
    const { activeTab, month, year, t } = options;
    if (!data) return;

    try {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert("Por favor permita ventanas emergentes para imprimir.");

        const monthName = (t && t('months_array') && t('months_array')[month - 1]) || 'Mes';
        const pageTitle = activeTab === 'balance' ? 'Balance General' :
            (activeTab === 'prescriptions' ? 'Reporte de Recetas' : 'Reporte de Turnos');

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
            .day-header--weekend { background: #fffbe6 !important; color: #856404; }
            .day-header--holiday { background: #f8d7da !important; color: #721c24; }
            .row--overturn { background-color: #e7f3ff !important; }
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
            content = generateAppointmentsPrint(data, monthName, year);
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
        <h1>Balance General: ${monthName} ${year}</h1>
        <div class="summary-box">
            <div class="row"><span>Ingresos Turnos:</span><span>$${totalAppts.toLocaleString()}</span></div>
            <div class="row"><span>Ingresos Recetas:</span><span>$${totalPres.toLocaleString()}</span></div>
            <div class="row row--total"><span>SUBTOTAL INGRESOS:</span><span>$${totalIncome.toLocaleString()}</span></div>
            <div class="row withdrawal" style="margin-top: 15px;"><span>(-) Retiros Doctora:</span><span>-$${totalWithdrawals.toLocaleString()}</span></div>
            <div class="row row--net"><span>RESULTADO NETO:</span><span>$${netTotal.toLocaleString()}</span></div>
        </div>

        <h2>Rendición de Caja (Efectivo por Día)</h2>
        <table>
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th class="amount">Efectivo a Rendir</th>
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
                    <td style="padding-top: 10px;">TOTAL EFECTIVO A RENDIR:</td>
                    <td class="amount" style="padding-top: 10px;">$${appts.reduce((acc, d) => acc + Number(d.total_efectivo || 0), 0).toLocaleString()}</td>
                </tr>
            </tfoot>
        </table>

        <h2 style="margin-top: 40px;">Deudas Pendientes</h2>
        ${allDebts.length > 0 ? `
            <table>
                <thead>
                    <tr>
                        <th style="width: 100px;">Fecha</th>
                        <th style="width: 300px;">Paciente</th>
                        <th style="width: 150px;">Origen</th>
                        <th class="amount">Monto</th>
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
                Total Deuda: $${allDebts.reduce((a, b) => a + b.amount, 0).toLocaleString()}
            </div>
        ` : '<p>No se encontraron deudas.</p>'}
    `;
};

const generateAppointmentsPrint = (reportData, monthName, year) => {
    const list = Array.isArray(reportData?.appointments) ? reportData.appointments : (Array.isArray(reportData) ? reportData : []);
    let total = 0;

    return `
        <h1>Reporte de Turnos: ${monthName} ${year}</h1>
        ${list.map(day => {
        const dayAppts = Array.isArray(day.appointments) ? day.appointments : [];
        return `
            <div class="day-group">
                <div class="day-header ${day.is_weekend ? 'day-header--weekend' : ''} ${day.is_holiday ? 'day-header--holiday' : ''}">
                    <span>📅 ${day.date || ''}</span>
                    ${day.is_holiday ? `<span class="tag tag--holiday">${day.holiday_description || 'FERIADO'}</span>` : ''}
                    ${day.is_weekend && !day.is_holiday ? `<span style="font-size: 10px; opacity: 0.8;">(Finde)</span>` : ''}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th style="width: 75px;">Hora</th>
                            <th style="width: 300px;">Paciente / Profesional</th>
                            <th style="width: 250px;">Pago / Estado</th>
                            <th class="amount">Monto</th>
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
                                    ${appt.is_overturn ? `<span class="tag tag--overturn" style="font-size: 8px;">SOBRE</span>` : ''}
                                </td>
                                <td class="meta">${metaInfo}</td>
                                <td class="amount">${paid > 0 ? '$' + paid.toLocaleString() : '-'}</td>
                            </tr>`;
        }).join('')}
                    </tbody>
                </table>
            </div>`;
    }).join('')}
        <div style="margin-top: 30px; border-top: 2px solid #000; padding: 10px 0; text-align: right; font-size: 14px; font-weight: bold;">
            TOTAL INGRESOS TURNOS: $${total.toLocaleString()}
        </div>
    `;
};

const generatePrescriptionsPrint = (reportData, monthName, year, t) => {
    const list = Array.isArray(reportData?.prescriptions) ? reportData.prescriptions : [];
    const withdrawals = Array.isArray(reportData?.withdrawals) ? reportData.withdrawals : [];
    let total = 0;

    return `
        <h1>Reporte de Recetas: ${monthName} ${year}</h1>
        <table>
            <thead>
                <tr>
                    <th style="width: 100px;">Fecha</th>
                    <th style="width: 250px;">Paciente</th>
                    <th style="width: 200px;">Medicamentos</th>
                    <th style="width: 180px;">Estado / Pago</th>
                    <th class="amount">Monto</th>
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
            TOTAL INGRESOS RECETAS: $${total.toLocaleString()}
        </div>
    `;
};
