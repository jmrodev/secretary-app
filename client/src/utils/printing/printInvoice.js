import QRCode from 'qrcode';
import { getNow, formatDate, getArgentineNowISO } from '../core/dateUtils';

export const printInvoice = async (data) => {
    const formattedNumber = `${String(data.ptoVta).padStart(5, '0')}-${String(data.number).padStart(8, '0')}`;
    const typeLabel = data.cbteTipo === 11 ? 'C' : (data.cbteTipo === 1 ? 'A' : (data.cbteTipo === 6 ? 'B' : 'C'));
    const voucherName = data.cbteTipo === 11 ? 'FACTURA' : 'COMPROBANTE';

    // Correct ARCA QR encoding (Standard v1 2026)
    // Synchronize to Argentina Time (GMT-3) to match ARCA server window
    const nowArg = getArgentineNowISO();
    const qrDateStr = data.fecha || nowArg.split('T')[0];

    const qrData = {
        ver: 1,
        fecha: qrDateStr,
        cuit: parseInt(data.doctorCuit || '27252572592'),
        ptoVta: parseInt(data.ptoVta || 1),
        tipoCmp: parseInt(data.cbteTipo || 11),
        nroCmp: parseInt(data.number),
        importe: parseFloat(parseFloat(data.amount).toFixed(2)), // Precision 13.2
        moneda: "PES",
        ctz: 1,
        tipoDocRec: parseInt(data.patientDni) > 0 ? 96 : 99,
        nroDocRec: parseInt(data.patientDni) > 0 ? parseInt(data.patientDni) : 0,
        tipoCodAut: "E",
        codAut: parseInt(data.cae),
        condicionIVAReceptorId: 5 // RG 5616 Hard Enforcement
    };

    // Base64 encoding for ARCA QR
    const jsonStr = JSON.stringify(qrData);
    const base64 = btoa(unescape(encodeURIComponent(jsonStr)));
    const qrUrl = `https://www.arca.gob.ar/fe/qr/?p=${base64}`;

    // Generate QR locally
    let qrDataUrl = '';
    try {
        qrDataUrl = await QRCode.toDataURL(qrUrl, {
            margin: 1,
            width: 150,
            errorCorrectionLevel: 'M'
        });
    } catch (err) {
        console.error('Error generating local QR:', err);
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
            <head>
                <title>Comprobante ${formattedNumber}</title>
                <style>
                    @media print {
                        .no-print { display: none; }
                        body { margin: 0; padding: 0; }
                    }
                    body {
                        font-family: 'Arial', sans-serif;
                        color: #000;
                        margin: 0;
                        padding: 20px;
                        font-size: 11pt;
                    }
                    .container {
                        max-width: 800px;
                        margin: auto;
                        border: 2px solid #000;
                        padding: 0;
                    }
                    .header {
                        display: flex;
                        border-bottom: 2px solid #000;
                    }
                    .header-left, .header-right {
                        flex: 1;
                        padding: 20px;
                    }
                    .header-center {
                        width: 80px;
                        border-left: 2px solid #000;
                        border-right: 2px solid #000;
                        position: relative;
                        background: #fff;
                    }
                    .type-box {
                        width: 60px;
                        height: 60px;
                        border: 2px solid #000;
                        margin: 10px auto;
                        text-align: center;
                        font-size: 40px;
                        font-weight: bold;
                        line-height: 60px;
                        background: #eee;
                    }
                    .type-code {
                        text-align: center;
                        font-size: 8pt;
                        font-weight: bold;
                    }
                    .voucher-title {
                        font-size: 24pt;
                        font-weight: bold;
                        margin: 0;
                    }
                    .details-box {
                        padding: 15px;
                        border-bottom: 2px solid #000;
                    }
                    .row {
                        display: flex;
                        margin-bottom: 5px;
                    }
                    .label { font-weight: bold; width: 140px; }
                    .table-products {
                        width: 100%;
                        border-collapse: collapse;
                        min-height: 200px;
                    }
                    .table-products th {
                        background: #eee;
                        border-bottom: 2px solid #000;
                        padding: 8px;
                        text-align: left;
                    }
                    .table-products td {
                        padding: 8px;
                        vertical-align: top;
                    }
                    .totals-container {
                        display: flex;
                        justify-content: flex-end;
                        padding: 20px;
                        border-top: 2px solid #000;
                    }
                    .footer {
                        padding: 15px;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-end;
                    }
                    .cae-section { font-weight: bold; font-size: 10pt; }
                </style>
            </head>
            <body>
                <div class="no-print" style="margin-bottom: 20px; text-align: center;">
                    <a href="#" style="display: inline-block; padding: 10px 30px; background: #2563eb; color: #fff; cursor: pointer; border-radius: 5px; text-decoration: none; border: none;" onclick="window.print(); return false;">IMPRIMIR FACTURA</a>
                    <p style="font-size: 9pt; color: #666; margin-top: 5px;">Nota: Comprobante generado localmente.</p>
                </div>

                <div class="container">
                    <div class="header">
                        <div class="header-left">
                            <h1 style="margin: 0; color: #2563eb;">${data.doctor}</h1>
                            <p style="margin: 5px 0; font-size: 14pt;"><strong>CIMA SALUD</strong></p>
                            <p style="font-size: 10pt;">
                                Montiel 1255, CABA<br/>
                                Condición IVA: Responsable Monotributo
                            </p>
                        </div>
                        <div class="header-center">
                            <div class="type-box">${typeLabel}</div>
                            <div class="type-code">Cod. ${String(data.cbteTipo || 11).padStart(2, '0')}</div>
                        </div>
                        <div class="header-right">
                            <h2 class="voucher-title">${voucherName}</h2>
                            <p style="margin: 5px 0; font-size: 14pt;"><strong>Nº ${formattedNumber}</strong></p>
                            <p style="margin: 5px 0;">Fecha: <strong>${formatDate(getNow())}</strong></p>
                            <p style="margin: 5px 0;">CUIT: <strong>${data.doctorCuit || '27252572592'}</strong></p>
                            <p style="margin: 5px 0;">Ingresos Brutos: <strong>${data.doctorCuit || '27252572592'}</strong></p>
                            <p style="margin: 5px 0;">Inicio de Actividades: <strong>01/01/2021</strong></p>
                        </div>
                    </div>

                    <div class="details-box">
                        <div class="row"><span class="label">CUIT / DNI:</span> <span>${data.patientDni || '-'}</span></div>
                        <div class="row"><span class="label">Apellido y Nombre:</span> <span>${data.patient}</span></div>
                        <div class="row"><span class="label">Condición IVA:</span> <span>Consumidor Final</span></div>
                        <div class="row"><span class="label">Condición Pago:</span> <span>Contado</span></div>
                    </div>

                    <table class="table-products">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th style="width: 60%;">Descripción</th>
                                <th>Unidad</th>
                                <th>Precio Unit.</th>
                                <th>Subtotal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>001</td>
                                <td>Consulta Médica / Servicio de Salud - Atención Profesional</td>
                                <td>un</td>
                                <td>$${data.amount}</td>
                                <td>$${data.amount}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="totals-container">
                        <div style="width: 250px;">
                            <div class="row"><span class="label">Subtotal:</span> <span>$${data.amount}</span></div>
                            <div class="row"><span class="label">Importe Otros:</span> <span>$0.00</span></div>
                            <div class="row" style="font-size: 16pt;"><span class="label">TOTAL:</span> <span>$${data.amount}</span></div>
                        </div>
                    </div>

                    <div class="footer">
                        <div class="qr-code">
                            <img src="${qrDataUrl}" alt="QR AFIP" style="width: 130px; height: 130px; border: 1px solid #ccc;"/>
                        </div>
                        <div class="cae-section">
                            <div style="font-size: 14pt;">CAE: ${data.cae}</div>
                            <div>Vto. CAE: ${formatDate(data.vto, { fallback: '-' })}</div>
                            <div style="margin-top: 10px; font-weight: normal; font-size: 8pt; color: #777;">
                                Comprobante autorizado por AFIP.<br/>
                                Representación gráfica simplificada.
                            </div>
                        </div>
                    </div>
                </div>
                <script>
                    window.onload = () => {
                        // Wait for QR to load before printing dialog
                        setTimeout(() => { window.print(); }, 1000);
                    };
                </script>
            </body>
        </html>
    `);

    printWindow.document.close();
};
