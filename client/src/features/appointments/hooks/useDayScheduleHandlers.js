import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';

/**
 * useDayScheduleHandlers Hook (Internal to appointments feature).
 * Manages daily navigation, printing, and slot actions.
 */
export const useDayScheduleHandlers = ({ date, appointments, doctor, onDateSelect, onSlotClick, showCancelled }) => {
    const { t } = useLanguage();
    const { confirm } = useModal();

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return alert(t('allow_popups'));

        const dayName = date.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
        const doctorName = doctor ? (doctor.full_name || doctor.username) : '';
        const translateStatus = (status) => t(status) || status;

        const appsToPrint = appointments
            .filter(appt => {
                const d = new Date(appt.appointment_date);
                return d.getFullYear() === date.getFullYear() && d.getMonth() === date.getMonth() && d.getDate() === date.getDate();
            })
            .filter(appt => showCancelled || !['cancelled', 'suspended', 'absent'].includes(appt.status))
            .sort((a, b) => new Date(a.appointment_date) - new Date(b.appointment_date));

        let htmlContent = `
            <html><head><title>${t('patients')} - ${dayName}</title><style>
                body { font-family: sans-serif; padding: 40px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { text-align: left; background: #f8fafc; border-bottom: 2px solid #e2e8f0; padding: 12px; }
                td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
            </style></head><body>
                <h1>${t('patient_list')}</h1><p>${dayName}</p>${doctorName ? `<p>${t('doctor_label')}: ${doctorName}</p>` : ''}
                <table><thead><tr><th>${t('time_th')}</th><th>${t('patient_th')}</th><th>${t('phone_th')}</th><th>${t('reason_th')}</th><th>${t('status_th')}</th></tr></thead><tbody>
                    ${appsToPrint.length > 0 ? appsToPrint.map(appt => `
                        <tr>
                            <td>${new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</td>
                            <td>${appt.patient_name || 'S/N'}</td><td>${appt.patient_phone || '-'}</td><td>${appt.reason || '-'}</td><td>${translateStatus(appt.status)}</td>
                        </tr>`).join('') : `<tr><td colspan="5">${t('no_appointments_day')}</td></tr>`}
                </tbody></table>
                <script>window.onload = () => { window.print(); setTimeout(() => window.close(), 500); }</script>
            </body></html>`;
        printWindow.document.write(htmlContent); printWindow.document.close();
    };

    const handlePrevDay = () => { const prev = new Date(date); prev.setDate(date.getDate() - 1); onDateSelect(prev); };
    const handleNextDay = () => { const next = new Date(date); next.setDate(date.getDate() + 1); onDateSelect(next); };
    const handleToday = () => onDateSelect(new Date());

    const handleSlotAction = async (slot) => {
        const isOutOfHours = slot.type === 'closed';
        if (isOutOfHours) {
            if (await confirm(t('confirm_out_of_hours') || "¿Desea asignar un turno en horario NO LABORABLE?")) {
                onSlotClick(slot.time.getHours(), null, slot.time.getMinutes(), true);
            }
        } else {
            onSlotClick(slot.time.getHours(), null, slot.time.getMinutes(), false);
        }
    };

    return { handlePrint, handlePrevDay, handleNextDay, handleToday, handleSlotAction };
};
