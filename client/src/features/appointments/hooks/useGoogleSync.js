import { useMessage } from '@/context/MessageContext';
import api from '@/api/axios';

/**
 * useGoogleSync (Handler Hook).
 * Manages Google Calendar synchronization for specific days.
 * 
 * @param {Object} doctors - List of doctors for validation or context (optional).
 * @returns {Object} { syncDayToGoogle }
 */
export const useGoogleSync = (doctors) => {
    const { showMessage } = useMessage();

    const syncDayToGoogle = async (doctorId, date) => {
        if (!doctorId) { 
            showMessage("Por favor selecciona un doctor", "error"); 
            return; 
        }
        
        try {
            showMessage("Sincronizando día con Google Calendar...", "info");
            const dateStr = (date instanceof Date ? date.toISOString() : date).split('T')[0];
            const res = await api.post('/google/sync-day', { doctorId: Number(doctorId), date: dateStr });
            const { created, updated, errors, total } = res.data;
            
            if (total === 0) {
                showMessage("No hay turnos para sincronizar en este día", "info");
            } else if (errors > 0) {
                showMessage(`Sincronizado: ${created} creados, ${updated} actualizados, ${errors} errores`, "warning");
            } else {
                showMessage(`Éxito: ${created} creados, ${updated} actualizados`, "success");
            }
        } catch (err) {
            console.error("[useGoogleSync] Sync Error:", err);
            showMessage(err.response?.data?.error || "Error sincronizando con Google Calendar", "error");
        }
    };

    return { syncDayToGoogle };
};
