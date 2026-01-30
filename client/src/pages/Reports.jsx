
import React, { useState } from 'react';
import Sidebar from '../components/organisms/Sidebar';
import Button from '../components/atoms/Button';
import { useLanguage } from '../context/LanguageContext';
import { useAppointments } from '../hooks/useAppointments'; // Using the hook we just updated
import { useAuth } from '../context/AuthContext';
import { useDoctors } from '../hooks/useUsers'; // Or useDoctors specific if exists
import api from '../api/axios';
import '../styles/pages/Reports.css';

const Reports = () => {
    const { t } = useLanguage();
    // Use the hook to get the Monthly Report function
    const { getMonthlyReport, isSubmitting } = useAppointments();

    const [activeTab, setActiveTab] = useState('appointments'); // appointments | prescriptions
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(2026);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [reportData, setReportData] = useState(null);
    const { doctors } = useDoctors(); // Retrieve doctors list

    // --- Handlers ---

    const handleGenerateReport = async () => {
        setReportData(null);
        if (activeTab === 'appointments') {
            const data = await getMonthlyReport(month, year, selectedDoctorId);
            if (data) {
                setReportData(data);
            }
        } else {
            // Fetch prescription report as JSON for preview, using same filters
            try {
                const params = { preview: true, month, year };
                if (selectedDoctorId) params.doctorId = selectedDoctorId;

                const response = await api.get('/medical/prescriptions/export/json', { params });
                setReportData(response.data);
            } catch (err) {
                console.error("Error fetching prescription report", err);
            }
        }
    };

    const handleDownloadJson = () => {
        if (!reportData) return;
        const jsonString = JSON.stringify(reportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `report_${activeTab}_${month}_${year}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- Render Helpers ---

    const renderAppointmentTable = () => {
        const list = Array.isArray(reportData) ? reportData : (reportData?.appointments || []);
        if (!list || list.length === 0) return <div className="no-data">{t('no_data_to_display')}</div>;

        return (
            <div className="table-responsive">
                <table className="table-base w-full">
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
                                {/* Day Header Row */}
                                <tr className="bg-slate-100 font-bold">
                                    <td colSpan="7" className="py-2 px-4 text-main-800">
                                        📅 {dayGroup.date}
                                    </td>
                                </tr>
                                {/* Appointments Rows */}
                                {dayGroup.appointments.map((appt, i) => (
                                    <tr key={`${idx}-${i}`} className="hover:bg-slate-50 border-b border-slate-100">
                                        <td className="pl-8 text-gray-500 text-sm">{appt.dia}</td>
                                        <td>{appt.info}</td>
                                        <td className="font-medium">{appt.nombre}</td>
                                        <td className="font-mono text-xs">{appt.hora}</td>
                                        <td>
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase
                                                ${appt.asistencia === 'completed' || appt.asistencia === 'attended' ? 'bg-green-100 text-green-700' :
                                                    appt.asistencia === 'cancelled' ? 'bg-red-100 text-red-700' :
                                                        appt.asistencia === 'absent' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>
                                                {appt.asistencia}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`border px-2 py-0.5 rounded text-xs block mb-1 w-fit
                                                ${appt.pago === 'paid' ? 'border-green-200 text-green-700' :
                                                    appt.pago === 'debt' ? 'border-red-200 text-red-700' : 'border-gray-200 text-gray-500'}`}>
                                                {appt.pago}
                                            </span>
                                            {appt.metodos_pago && (
                                                <span className="text-xs text-gray-500 block">
                                                    {appt.metodos_pago}
                                                </span>
                                            )}
                                        </td>
                                        <td className="font-mono text-sm">
                                            {Number(appt.monto_pagado) > 0 ? `$${appt.monto_pagado}` : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
                {reportData?.withdrawals && reportData.withdrawals.length > 0 && (
                    <div className="mt-8 p-6 bg-rose-50 rounded-2xl border border-rose-100">
                        <h3 className="text-rose-900 font-bold mb-4 flex items-center gap-2">
                            💰 {t('withdrawals_doctor') || 'Retiros a Doctora / Pagos Realizados'}
                        </h3>
                        <div className="space-y-2">
                            {reportData.withdrawals.map((w, idx) => (
                                <div key={idx} className="flex justify-between items-center py-2 border-b border-rose-100 last:border-0 text-sm">
                                    <span className="text-rose-700 font-medium">{w.fecha} - {w.descripcion}</span>
                                    <span className="text-rose-900 font-bold font-mono">-${Number(w.monto).toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-rose-200 text-lg">
                                <span className="font-black text-rose-900 uppercase tracking-tight">Total Entregado / Retirado:</span>
                                <span className="font-black text-rose-900 font-mono">-${reportData.withdrawals.reduce((acc, w) => acc + Number(w.monto || 0), 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderPrescriptionTable = () => {
        const list = reportData?.prescriptions || [];
        if (!list || list.length === 0) return <div className="no-data">{t('no_data_to_display')}</div>;

        return (
            <div className="report-table-container">
                <table className="report-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Tipo</th>
                            <th>Paciente</th>
                            <th>Medicamentos</th>
                            <th>Doctor</th>
                            <th>Estado Pago</th>
                            <th>Monto</th>
                        </tr>
                    </thead>
                    <tbody>
                        {list.map((item, idx) => (
                            <tr key={idx}>
                                <td>{new Date(item.date).toLocaleDateString()}</td>
                                <td>{item.source_type === 'direct' ? 'Directa' : 'Solicitud'}</td>
                                <td>
                                    {item.patient_name} <br />
                                    <span className="text-xs text-gray-500">{item.patient_dni}</span>
                                </td>
                                <td style={{ maxWidth: '200px', fontSize: '0.9em' }}>{item.medications}</td>
                                <td>{item.doctor_name}</td>
                                <td>
                                    {item.payment_status === 'paid' ? 'Pagado' :
                                        item.payment_status === 'debt' ? 'Debe' :
                                            item.payment_status === 'bonified' ? 'Bonificado' : item.payment_status}
                                </td>
                                <td>{Number(item.amount) > 0 ? `$${item.amount}` : '-'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {reportData?.withdrawals && reportData.withdrawals.length > 0 && (
                    <div className="mt-8 p-6 bg-rose-50 rounded-2xl border border-rose-100">
                        <h3 className="text-rose-900 font-bold mb-4 flex items-center gap-2">
                            💰 {t('withdrawals_doctor') || 'Retiros a Doctora / Pagos Realizados'}
                        </h3>
                        <div className="space-y-2">
                            {reportData.withdrawals.map((w, idx) => (
                                <div key={idx} className="flex justify-between items-center py-2 border-b border-rose-100 last:border-0 text-sm">
                                    <span className="text-rose-700 font-medium">{w.fecha} - {w.descripcion}</span>
                                    <span className="text-rose-900 font-bold font-mono">-${Number(w.monto).toLocaleString()}</span>
                                </div>
                            ))}
                            <div className="flex justify-between items-center pt-4 mt-2 border-t-2 border-rose-200 text-lg">
                                <span className="font-black text-rose-900 uppercase tracking-tight">Total Entregado / Retirado:</span>
                                <span className="font-black text-rose-900 font-mono">-${reportData.withdrawals.reduce((acc, w) => acc + Number(w.monto || 0), 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const handlePrint = () => {
        if (!reportData) return;

        try {
            const printWindow = window.open('', '_blank');
            if (!printWindow) return alert("Por favor permita ventanas emergentes para imprimir.");

            const monthName = t('months_array')[month - 1] || 'Mes';
            const pageTitle = activeTab === 'prescriptions' ? 'Reporte de Recetas' : 'Reporte de Turnos';

            let htmlContent = `
                <html>
                <head>
                    <title>${pageTitle} - ${monthName} ${year}</title>
                    <style>
                        body { font-family: 'Courier New', monospace; padding: 20px; max-width: 800px; margin: 0 auto; }
                        h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
                        .day-group { margin-top: 20px; page-break-inside: avoid; }
                        .day-header { font-weight: bold; font-size: 1.2em; margin-bottom: 5px; border-bottom: 1px solid #ccc; }
                        .appointment { display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dotted #eee; }
                        .time { font-weight: bold; margin-right: 15px; }
                        .name { flex: 1; text-transform: uppercase; }
                        .meta { font-size: 0.9em; color: #555; }
                        .amount { font-weight: bold; margin-left: 10px; }
                        .withdrawal { display: flex; justify-content: space-between; color: red; padding: 4px 0; }
                        @media print {
                            .no-print { display: none; }
                            body { padding: 0; }
                        }
                    </style>
                </head>
                <body>
                    <h1>${pageTitle}: ${monthName} ${year}</h1>
            `;

            // Data Preparation
            let list = [];
            let appointmentsList = [];
            let withdrawalsList = (reportData.withdrawals || []);
            let crossIncome = (activeTab === 'prescriptions') ? (reportData.appointment_income || 0) : (reportData.other_income || 0);

            if (activeTab === 'prescriptions') {
                list = reportData.prescriptions || [];
            } else {
                appointmentsList = reportData.appointments || [];
            }

            // Translation Maps
            const statusMap = {
                'confirmed': 'Confirmado', 'pending': 'Pendiente', 'arrived': 'En Sala',
                'completed': 'Completado', 'attended': 'Atendido', 'cancelled': 'Cancelado',
                'absent': 'Ausente', 'suspended': 'Suspendido', 'virtual': 'Virtual', 'external': 'Externo'
            };
            const paymentMap = {
                'paid': 'Pagado', 'pending': 'Pendiente', 'debt': 'Deudor', 'partial': 'Parcial', 'free': 'Bonificado', 'bonified': 'Bonificado'
            };
            const methodMap = {
                'cash': 'Efectivo', 'transfer': 'Transferencia', 'debit': 'Débito', 'credit': 'Crédito', 'other': 'Otro', 'none': '-', 'N/A': '-'
            };

            const translateMethods = (mString) => {
                if (!mString) return '';
                return mString.split(',').map(m => {
                    const trimmed = m.trim().toLowerCase();
                    return methodMap[trimmed] || m.trim();
                }).join(', ');
            };

            // --- HTML Generation Loop ---
            if (activeTab === 'prescriptions') {
                let currentDay = '';
                if (list.length === 0) htmlContent += '<p>No hay datos para mostrar.</p>';

                list.forEach(item => {
                    let itemDate = 'Fecha Inválida';
                    try {
                        if (item.date) itemDate = new Date(item.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
                    } catch (e) { }

                    if (itemDate !== currentDay) {
                        if (currentDay !== '') htmlContent += '</div>';
                        htmlContent += `<div class="day-group"><div class="day-header">${itemDate}</div>`;
                        currentDay = itemDate;
                    }

                    const typeLabel = item.source_type === 'direct' ? 'Receta Directa' : 'Solicitud (Web)';
                    const statusStr = paymentMap[item.payment_status] || item.payment_status || '-';
                    const methodStr = translateMethods(item.payment_method);

                    htmlContent += `
                        <div class="appointment">
                            <span class="time" style="width: 120px;">${typeLabel}</span>
                            <span class="name">
                                ${item.patient_name || 'Paciente'} <br/>
                                <small style="color:#666; text-transform:none;">${item.medications || ''}</small>
                            </span>
                            <span class="meta">
                                <strong>${statusStr}</strong> <span style="color:#777;">${methodStr ? `(${methodStr})` : ''}</span>
                            </span>
                            ${Number(item.amount) > 0 ? `<span class="amount">$${Number(item.amount).toLocaleString()}</span>` : ''}
                        </div>
                    `;
                });
                if (currentDay !== '') htmlContent += '</div>';

                if (withdrawalsList.length > 0) {
                    const totalWithdrawals = withdrawalsList.reduce((acc, w) => acc + Number(w.monto || 0), 0);
                    htmlContent += `
                        <div class="day-group" style="margin-top: 40px; border-top: 2px dashed #000; padding-top: 20px;">
                            <h2>Retiros a Doctora</h2>
                            ${withdrawalsList.map(w => `
                                <div class="withdrawal">
                                    <span>${w.fecha} - ${w.descripcion}</span>
                                    <span style="font-weight: bold;"> - $${w.monto}</span>
                                </div>
                            `).join('')}
                            <div class="withdrawal" style="margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; font-size: 1.1em;">
                                <span style="font-weight: 900;">TOTAL RETIRADO / ENTREGADO:</span>
                                <span style="font-weight: 900;">$${totalWithdrawals.toLocaleString()}</span>
                            </div>
                        </div>
                    `;
                }

            } else {
                // Appointments Report
                appointmentsList.forEach(day => {
                    htmlContent += `
                        <div class="day-group">
                            <div class="day-header">${day.date}</div>
                            ${day.appointments.map(appt => {
                        const statusEs = statusMap[appt.asistencia] || appt.asistencia || '-';
                        const paymentEs = paymentMap[appt.pago] || appt.pago || '-';
                        const methodEs = translateMethods(appt.metodos_pago);

                        return `
                                <div class="appointment">
                                    <span class="time">${appt.hora}</span>
                                    <span class="name">${appt.nombre}</span>
                                    <span class="meta">
                                        ${appt.tipo_atencion === 'virtual' ? '(V) ' : ''} 
                                        <strong>${paymentEs}</strong> <span style="color:#777;">${methodEs ? `(${methodEs})` : ''}</span> / ${statusEs}
                                    </span>
                                    ${Number(appt.monto_pagado) > 0 ? `<span class="amount">$${Number(appt.monto_pagado).toLocaleString()}</span>` : ''}
                                </div>
                            `}).join('')}
                        </div>
                    `;
                });

                if (withdrawalsList.length > 0) {
                    const totalWithdrawals = withdrawalsList.reduce((acc, w) => acc + Number(w.monto || 0), 0);
                    htmlContent += `
                        <div class="day-group" style="margin-top: 40px; border-top: 2px dashed #000; padding-top: 20px;">
                            <h2>Retiros a Doctora</h2>
                            ${withdrawalsList.map(w => `
                                <div class="withdrawal">
                                    <span>${w.fecha} - ${w.descripcion}</span>
                                    <span style="font-weight: bold;"> - $${w.monto}</span>
                                </div>
                            `).join('')}
                            <div class="withdrawal" style="margin-top: 10px; border-top: 1px solid #000; padding-top: 5px; font-size: 1.1em;">
                                <span style="font-weight: 900;">TOTAL RETIRADO / ENTREGADO:</span>
                                <span style="font-weight: 900;">$${totalWithdrawals.toLocaleString()}</span>
                            </div>
                        </div>
                    `;
                }
            }


            // --- Statistics Calculation ---
            let totalItems = 0;
            let virtualCount = 0;
            let faceToFaceCount = 0;
            let undefinedCount = 0;
            let totalAmountVirtual = 0;
            let totalAmountFaceToFace = 0;
            let totalAmountUndefined = 0;
            let totalAmount = 0;
            let totalCash = 0;
            let totalTransfer = 0;
            let totalOther = 0;
            let totalDebt = 0;
            const uniquePatients = new Set();

            // --- Debts List Collection ---
            let debtList = [];

            if (activeTab === 'appointments') {
                appointmentsList.forEach(day => {
                    day.appointments.forEach(appt => {
                        // ... existing logic ...
                        totalItems++;
                        uniquePatients.add(appt.nombre);

                        const status = (appt.asistencia || '').toLowerCase();
                        const payment = Number(appt.monto_pagado || 0);
                        const info = (appt.info || '').toLowerCase();
                        const methods = (appt.metodos_pago || '').toLowerCase();
                        const type = (appt.tipo_atencion || '').toLowerCase();
                        const payStatus = (appt.pago || '').toLowerCase();

                        // Modality
                        let isVirtual = false;
                        let isFaceToFace = false;
                        if (type === 'virtual') isVirtual = true;
                        else if (type === 'consultation') isFaceToFace = true;
                        else if (status === 'virtual' || info.includes('virtual')) isVirtual = true;
                        else if (status === 'arrived' || status === 'completed' || status === 'attended') isFaceToFace = true;

                        if (isVirtual) {
                            virtualCount++;
                            totalAmountVirtual += payment;
                        } else if (isFaceToFace) {
                            faceToFaceCount++;
                            totalAmountFaceToFace += payment;
                        } else {
                            undefinedCount++;
                            totalAmountUndefined += payment;
                        }

                        totalAmount += payment; // Total accumulated paid

                        // Payment Methods
                        if (payment > 0) {
                            if (methods.includes('cash') || methods.includes('efectivo')) totalCash += payment;
                            else if (methods.includes('transfer') || methods.includes('transferencia')) totalTransfer += payment;
                            else totalOther += payment;
                        }

                        // Collect Debt
                        if (payStatus === 'debt' || payStatus === 'debe') {
                            debtList.push({
                                date: day.date,
                                time: appt.hora || '-',
                                patient: appt.nombre,
                                amount: 0 // Appointments might not have debt amount in this report yet, explicit 0 or need update
                            });
                        }
                    });
                });
            } else {
                // Prescriptions Stats
                list.forEach(item => {
                    totalItems++;
                    if (item.patient_name) uniquePatients.add(item.patient_name);

                    const amount = Number(item.amount || 0);
                    const status = (item.payment_status || '').toLowerCase();
                    const method = (item.payment_method || '').toLowerCase();

                    if (status === 'paid' || status === 'pagado') {
                        totalAmount += amount;
                        if (method.includes('cash') || method.includes('efectivo')) totalCash += amount;
                        else if (method.includes('transfer') || method.includes('transferencia')) totalTransfer += amount;
                        else totalOther += amount;
                    } else if (status === 'debt' || status === 'debe') {
                        totalDebt += amount;
                        debtList.push({
                            date: new Date(item.date).toLocaleDateString(),
                            time: '-', // Prescriptions often don't have time in this view
                            patient: item.patient_name,
                            amount: amount
                        });
                    }
                });
            }

            // --- Summary Page ---
            htmlContent += `
                <div style="page-break-before: always;">
                    <h1>Resumen del Mes</h1>
                    <div style="margin-top: 40px;">
                        <h3>Estadísticas Generales</h3>
                        <table style="width: 100%; border-collapse: collapse; font-size: 1.1em;">
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #ccc;">Total ${activeTab === 'appointments' ? 'Turnos' : 'Recetas / Solicitudes'}:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #ccc; font-weight: bold;">${totalItems}</td>
                            </tr>
                            <tr>
                                <td style="padding: 10px; border-bottom: 1px solid #ccc;">Pacientes Únicos:</td>
                                <td style="padding: 10px; border-bottom: 1px solid #ccc; font-weight: bold;">${uniquePatients.size}</td>
                            </tr>
                        </table>

                        ${activeTab === 'appointments' ? `
                        <h3 style="margin-top: 40px;">Detalle por Modalidad</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                            <thead>
                                <tr style="background: #f0f0f0;">
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ccc;">Modalidad</th>
                                    <th style="padding: 10px; text-align: center; border: 1px solid #ccc;">Cantidad</th>
                                    <th style="padding: 10px; text-align: right; border: 1px solid #ccc;">Monto Recaudado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #ccc;">Presencial</td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #ccc;">${faceToFaceCount}</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #ccc;">$${totalAmountFaceToFace}</td>
                                </tr>
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #ccc;">Virtual</td>
                                    <td style="padding: 10px; text-align: center; border: 1px solid #ccc;">${virtualCount}</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #ccc;">$${totalAmountVirtual}</td>
                                </tr>
                            </tbody>
                        </table>
                        ` : ''}

                        <h3 style="margin-top: 40px;">Detalle Financiero</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                            <thead>
                               <tr style="background: #f0f0f0;">
                                    <th style="padding: 10px; text-align: left; border: 1px solid #ccc;">Concepto</th>
                                    <th style="padding: 10px; text-align: right; border: 1px solid #ccc;">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                 <tr style="font-weight: bold; background: #fafafa;">
                                    <td style="padding: 10px; border: 1px solid #ccc;">INGRESOS POR ${activeTab === 'appointments' ? 'TURNOS' : 'RECETAS'} (BRUTO)</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #ccc;">$${totalAmount.toLocaleString()}</td>
                                </tr>
                                ${crossIncome > 0 ? `
                                <tr>
                                    <td style="padding: 10px; border: 1px solid #ccc;">INGRESOS POR ${activeTab === 'appointments' ? 'RECETAS / OTROS' : 'TURNOS'} (BRUTO)</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #ccc;">$${Number(crossIncome).toLocaleString()}</td>
                                </tr>
                                <tr style="font-weight: bold; background: #e0f2fe;">
                                    <td style="padding: 10px; border: 1px solid #ccc;">TOTAL INGRESOS BRUTOS DEL MES</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #ccc;">$${(totalAmount + Number(crossIncome)).toLocaleString()}</td>
                                </tr>
                                ` : ''}
                                ${withdrawalsList.length > 0 ? `
                                <tr style="color: #c2410c;">
                                    <td style="padding: 10px; border: 1px solid #ccc;">Total Entregado / Retirado a Doctora</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #ccc;">-$${withdrawalsList.reduce((acc, w) => acc + Number(w.monto || 0), 0).toLocaleString()}</td>
                                </tr>
                                <tr style="font-weight: 900; background: #fffbeb; font-size: 1.3em;">
                                    <td style="padding: 10px; border: 2px solid #000;">SALDO NETO FINAL EN CAJA</td>
                                    <td style="padding: 10px; text-align: right; border: 2px solid #000;">$${(totalAmount + Number(crossIncome) - withdrawalsList.reduce((acc, w) => acc + Number(w.monto || 0), 0)).toLocaleString()}</td>
                                </tr>
                                ` : ''}
                                 ${activeTab === 'prescriptions' && totalDebt > 0 ? `
                                <tr><td colspan="2" style="border:none; height:20px;"></td></tr>
                                 <tr style="color:red;">
                                    <td style="padding: 10px; border: 1px solid #ccc;">Deuda Pendiente (Recetas)</td>
                                    <td style="padding: 10px; text-align: right; border: 1px solid #ccc;">$${totalDebt.toLocaleString()}</td>
                                </tr>` : ''}
                            </tbody>
                        </table>
                        
                        ${debtList.length > 0 ? `
                        <h3 style="margin-top: 40px; color: #d32f2f;">Detalle de Deudas / Pendientes</h3>
                        <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                            <thead>
                                <tr style="background: #ffebee;">
                                    <th style="padding: 10px; text-align: left; border: 1px solid #faa;">Fecha</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #faa;">Hora</th>
                                    <th style="padding: 10px; text-align: left; border: 1px solid #faa;">Paciente</th>
                                    <th style="padding: 10px; text-align: right; border: 1px solid #faa;">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${debtList.map(item => `
                                <tr>
                                    <td style="padding: 8px; border: 1px solid #faa;">${item.date}</td>
                                    <td style="padding: 8px; border: 1px solid #faa;">${item.time}</td>
                                    <td style="padding: 8px; border: 1px solid #faa;">${item.patient}</td>
                                    <td style="padding: 8px; text-align: right; border: 1px solid #faa;">$${item.amount}</td>
                                </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        ` : ''}

                    </div>
                </div>
            `;

            htmlContent += `
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
                </html>
            `;

            printWindow.document.write(htmlContent);
            printWindow.document.close();

        } catch (error) {
            console.error("Error generating print report:", error);
            alert("Hubo un error al generar la impresión. Revise la consola para mas detalles.");
        }
    };

    return (
        <div className="reports-layout">
            <Sidebar />
            <main className="reports-content">
                <header className="reports-header">
                    <h1 className="reports-header__title">{t('reports_page_title') || 'Reportes y Exportaciones'}</h1>
                    <p className="reports-header__subtitle">{t('reports_page_subtitle') || 'Generación de reportes mensuales de turnos y recetas.'}</p>
                </header>

                {/* Tabs */}
                <div className="reports-tabs">
                    <button
                        className={`reports-tab ${activeTab === 'appointments' ? 'reports-tab--active' : ''}`}
                        onClick={() => { setActiveTab('appointments'); setReportData(null); }}
                    >
                        📅 {t('appointment_reports') || 'Reporte de Turnos'}
                    </button>
                    <button
                        className={`reports-tab ${activeTab === 'prescriptions' ? 'reports-tab--active' : ''}`}
                        onClick={() => { setActiveTab('prescriptions'); setReportData(null); }}
                    >
                        💊 {t('prescription_reports') || 'Reporte de Recetas'}
                    </button>
                </div>

                {/* Filters */}
                <div className="reports-filters">
                    {/* Filters enabled for both tabs */}
                    <>
                        <div className="filter-group">
                            <label className="filter-label">{t('month')}</label>
                            <div className="flex items-center gap-2">
                                <button
                                    className="btn btn-ghost btn-sm p-1 rounded-full hover:bg-slate-100"
                                    onClick={() => {
                                        if (month === 1) {
                                            setMonth(12);
                                            setYear(y => y - 1);
                                        } else {
                                            setMonth(m => m - 1);
                                        }
                                    }}
                                >
                                    ⬅️
                                </button>
                                <select
                                    className="filter-select"
                                    value={month}
                                    onChange={(e) => setMonth(Number(e.target.value))}
                                >
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <option key={i + 1} value={i + 1}>
                                            {t('months_array')[i]}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-ghost btn-sm p-1 rounded-full hover:bg-slate-100"
                                    onClick={() => {
                                        if (month === 12) {
                                            setMonth(1);
                                            setYear(y => y + 1);
                                        } else {
                                            setMonth(m => m + 1);
                                        }
                                    }}
                                >
                                    ➡️
                                </button>
                            </div>
                        </div>
                        <div className="filter-group">
                            <label className="filter-label">{t('year')}</label>
                            <div className="flex items-center gap-2">
                                <button
                                    className="btn btn-ghost btn-sm p-1 rounded-full hover:bg-slate-100"
                                    onClick={() => setYear(y => y - 1)}
                                >
                                    ⬅️
                                </button>
                                <input
                                    type="number"
                                    className="filter-input"
                                    style={{ width: '80px', textAlign: 'center' }}
                                    value={year}
                                    onChange={(e) => setYear(Number(e.target.value))}
                                    min="2020" max="2035"
                                />
                                <button
                                    className="btn btn-ghost btn-sm p-1 rounded-full hover:bg-slate-100"
                                    onClick={() => setYear(y => y + 1)}
                                >
                                    ➡️
                                </button>
                            </div>
                        </div>
                        <div className="filter-group">
                            <label className="filter-label">{t('doctor') || 'Médico'}</label>
                            <select
                                className="filter-select"
                                value={selectedDoctorId}
                                onChange={(e) => setSelectedDoctorId(e.target.value)}
                            >
                                <option value="">{t('all_doctors') || 'Todos los Médicos'}</option>
                                {doctors.map(doc => (
                                    <option key={doc.id} value={doc.id}>
                                        {doc.full_name || doc.username}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </>

                    <button
                        className="btn-generate"
                        onClick={handleGenerateReport}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? '...' : (t('generate_report') || 'Generar Reporte')}
                    </button>

                    {reportData && (
                        <>
                            <button
                                className="btn-generate btn-generate--download"
                                onClick={handleDownloadJson}
                            >
                                💾 {t('download_json') || 'Descargar JSON'}
                            </button>
                            <button
                                className="btn-generate btn-generate--print"
                                onClick={handlePrint}
                                style={{ marginLeft: '10px', backgroundColor: '#6366f1' }}
                            >
                                🖨️ {t('print') || 'Imprimir'}
                            </button>
                        </>
                    )}
                </div>

                {/* Results/Display */}
                <div className="reports-results">
                    {activeTab === 'appointments' ? renderAppointmentTable() : renderPrescriptionTable()}
                </div>

            </main>
        </div>
    );
};

export default Reports;
