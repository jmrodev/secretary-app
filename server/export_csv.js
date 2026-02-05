const { pool } = require('./db');
const fs = require('fs');

async function exportToCSV() {
    let conn;
    try {
        conn = await pool.getConnection();
        const rows = await conn.query(`
            SELECT t.*, 
                   p.full_name as patient_name,
                   a.type as appt_type,
                   r.type as req_type,
                   d.full_name as doctor_name
            FROM transactions t
            LEFT JOIN users u ON t.related_user_id = u.id
            LEFT JOIN patients p ON u.id = p.user_id
            LEFT JOIN appointments a ON t.appointment_id = a.id
            LEFT JOIN medical_requests r ON t.request_id = r.id
            LEFT JOIN doctors d ON t.doctor_id = d.id
            WHERE t.doctor_id = 10
            ORDER BY t.transaction_date ASC
        `);

        const getWeekNumber = (d) => {
            const date = new Date(d.getTime());
            date.setHours(0, 0, 0, 0);
            date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
            const week1 = new Date(date.getFullYear(), 0, 4);
            return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
        };

        const csvRows = [];
        // Header using semicolon
        csvRows.push("Fecha;Hora;Año;Mes;Semana;Paciente/Descripcion;Monto Total;Tipo;Cobrado;Debe;Medico;ID");

        for (const tx of rows) {
            const dateObj = new Date(tx.transaction_date);
            const day = dateObj.toLocaleDateString('es-AR');
            const hour = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false });
            const year = dateObj.getFullYear();
            const month = dateObj.getMonth() + 1;
            const week = getWeekNumber(dateObj);

            let specificType = 'Otro';
            if (tx.appointment_id) specificType = 'Turno';
            else if (tx.request_id) {
                if (tx.req_type === 'prescription') specificType = 'Receta';
                else if (tx.req_type === 'license') specificType = 'Licencia';
                else if (tx.req_type === 'certificate') specificType = 'Certificado';
                else specificType = `Solicitud (${tx.req_type})`;
            }

            // Argentina format: decimal comma
            const formatMoney = (val) => Number(val).toFixed(2).replace('.', ',');

            const amount = formatMoney(tx.amount);
            const cobrado = tx.status === 'paid' ? amount : '0,00';
            const debe = tx.status === 'pending' ? amount : '0,00';

            // Clean name and wrap in quotes
            const patientName = `"${(tx.patient_name || tx.description || 'N/A').replace(/"/g, '""')}"`;

            csvRows.push(`${day};${hour};${year};${month};${week};${patientName};${amount};${specificType};${cobrado};${debe};"${tx.doctor_name || 'N/A'}";${tx.id}`);
        }

        // Add UTF-8 BOM for Excel
        const content = '\ufeff' + csvRows.join('\n');
        fs.writeFileSync('cecilia_finance_export.csv', content, 'utf8');
        console.log("Exported to cecilia_finance_export.csv (Excel Friendly)");
    } catch (err) {
        console.error(err);
    } finally {
        if (conn) conn.release();
        process.exit();
    }
}

exportToCSV();
