import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';

export const useDayScheduleHandlers = ({
    date,
    appointments,
    doctor,
    onDateSelect,
    onSlotClick,
    showCancelled
}) => {
    const { t } = useLanguage();
    const { confirm } = useModal();

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert(t('allow_popups'));

        const dayName = date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const doctorName = doctor ? (doctor.full_name || doctor.username) : '';

        const appsToPrint = appointments
            .filter(appt => {
                const d = new Date(appt.appointment_date);
                return d.getFullYear() === date.getFullYear() &&
                    d.getMonth() === date.getMonth() &&
                    d.getDate() === date.getDate();
            })
            .filter(appt => showCancelled || !['cancelled', 'suspended', 'absent'].includes(appt.status))
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

        const translateStatus = (status) => t(status) || status;

        let htmlContent = `
            <html>
            <head>
                <title>${t('patients')} - ${dayName}</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                    .header { text-align: center; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { margin: 0; color: #4f46e5; font-size: 24px; }
                    .header p { margin: 5px 0 0; color: #666; font-size: 16px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { text-align: left; background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px; font-weight: 600; color: #475569; }
                    td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                    .time { font-weight: bold; color: #1e293b; width: 80px; }
                    .patient { font-weight: 600; color: #1e1e1e; }
                    .status { font-size: 12px; text-transform: uppercase; font-weight: bold; }
                    .cancelled { color: #ef4444; }
                    .confirmed { color: #10b981; }
                    @media print {
                        body { padding: 0; }
                        @page { margin: 1.5cm; }
                        .no-print { display: none; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${t('patient_list')}</h1>
                    <p>${dayName}</p>
                    ${doctorName ? `<p>${t('doctor_label')}: ${doctorName}</p>` : ''}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>${t('time_th')}</th>
                            <th>${t('patient_th')}</th>
                            <th>${t('phone_th')}</th>
                            <th>${t('reason_th')}</th>
                            <th>${t('status_th')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${appsToPrint.length > 0 ? appsToPrint.map(appt => `
                            <tr>
                                <td class="time">${new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                                <td class="patient">${appt.patient_name || 'S/N'}</td>
                                <td>${appt.patient_phone || '-'}</td>
                                <td>${appt.reason || '-'}</td>
                                <td class="status ${appt.status}">${translateStatus(appt.status)}</td>
                            </tr>
                        `).join('') : `<tr><td colspan="5" style="text-align:center;">${t('no_appointments_day')}</td></tr>`}
                    </tbody>
                </table>
                <div style="margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: right;">
                    ${t('generated_at')} ${new Date().toLocaleString()}
                </div>
                <script>
                    window.onload = function() { 
                        window.print(); 
                        setTimeout(() => window.close(), 500);
                    }
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(htmlContent);
        printWindow.document.close();
    };

    const handlePrevDay = () => {
        const prev = new Date(date);
        prev.setDate(date.getDate() - 1);
        onDateSelect(prev);
    };

    const handleNextDay = () => {
        const next = new Date(date);
        next.setDate(date.getDate() + 1);
        onDateSelect(next);
    };

    const handleToday = () => {
        onDateSelect(new Date());
    };

    const handleSlotAction = async (slot) => {
        const isOutOfHours = slot.type === 'closed';
        if (isOutOfHours) {
            const confirmed = await confirm(t('confirm_out_of_hours') || "⚠️ Este horario está marcado como NO LABORABLE. ¿Desea asignar un turno de todas formas?");
            if (confirmed) {
                onSlotClick(slot.time.getHours(), null, slot.time.getMinutes(), true);
            }
        } else {
            onSlotClick(slot.time.getHours(), null, slot.time.getMinutes(), false);
        }
    };

    return {
        handlePrint,
        handlePrevDay,
        handleNextDay,
        handleToday,
        handleSlotAction
    };
};
