/**
 * Utility functions for medication data extraction and validation.
 */

export const extractMedicationDetails = (req) => {
    let meds = [];
    let notes = '';

    // Try structured data
    if (req.raw_medication_data) {
        try {
            const parsed = typeof req.raw_medication_data === 'string'
                ? JSON.parse(req.raw_medication_data)
                : req.raw_medication_data;

            // Normalize to objects
            if (Array.isArray(parsed)) {
                meds = parsed.map(item => {
                    if (typeof item === 'string') return { name: item, dose: '', frequency: '', quantity: '' };
                    return item;
                });
            }
        } catch (e) {
            console.error("Error parsing raw_medication_data", e);
        }
    }

    let noteContent = req.request_note || '';
    const isPublic = noteContent.includes('[Solicitud Paciente]');

    if (isPublic) {
        const content = noteContent.replace('[Solicitud Paciente]', '').trim();
        const parts = content.split(/\n?Notas:\s?/i);
        const medsPart = parts[0].trim();
        if (parts.length > 1) {
            notes = parts.slice(1).join('Notas: ').trim();
        }
        if (!meds || meds.length === 0) {
            if (medsPart) meds = medsPart.split(',').map(m => m.trim()).filter(Boolean);
        }
    } else {
        notes = noteContent;
    }

    // Final normalization to ensure everything is an object
    if (Array.isArray(meds)) {
        meds = meds.map(item => {
            if (!item) return { name: 'Desconocido', dose: '', frequency: '', quantity: '' };
            if (typeof item === 'string') return { name: item, dose: '', frequency: '', quantity: '' };
            return item;
        });
    } else {
        meds = [];
    }

    return { meds: meds || [], notes: notes || '' };
};

export const calculateDuration = (qty, freq) => {
    if (!qty || !freq) return null;
    const q = parseInt(qty, 10);
    if (isNaN(q)) return null;

    // Try to parse frequency
    // Case: "1 cada 8 hs" or "1/8h"
    const hourlyMatch = freq.match(/(\d+)?\s*(?:cada|\/)\s*(\d+)\s*(?:hs|h|horas)/i);
    if (hourlyMatch) {
        const amount = hourlyMatch[1] ? parseInt(hourlyMatch[1], 10) : 1;
        const hours = parseInt(hourlyMatch[2], 10);
        if (hours > 0) {
            const daily = (24 / hours) * amount;
            return Math.round(q / daily);
        }
    }
    // Case: "3 al día" or "3 daily"
    const dailyMatch = freq.match(/(\d+)\s*(?:al día|por día|daily|xdia)/i);
    if (dailyMatch) {
        const daily = parseInt(dailyMatch[1], 10);
        return daily > 0 ? Math.round(q / daily) : null;
    }

    return null;
};
