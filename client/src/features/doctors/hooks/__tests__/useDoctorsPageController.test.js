import { describe, it, expect } from 'vitest';
import { buildDoctorInitialData } from '@/features/doctors/hooks/useDoctorsPageController';

describe('buildDoctorInitialData', () => {
    it('seeds gemini_model and gemini_api_version from the doctor record', () => {
        const doc = {
            id: 7,
            specialty: 'Cardiología',
            gemini_model: 'gemini-3.6-flash',
            gemini_api_version: 'v1'
        };

        const initialData = buildDoctorInitialData(doc);

        expect(initialData.gemini_model).toBe('gemini-3.6-flash');
        expect(initialData.gemini_api_version).toBe('v1');
    });

    it('applies defaults for missing AI fields so the modal never drops them', () => {
        const initialData = buildDoctorInitialData({ id: 1 });

        expect(initialData.gemini_model).toBe('');
        expect(initialData.gemini_api_version).toBe('v1beta');
    });

    it('preserves the other edit-modal fields and their defaults', () => {
        const initialData = buildDoctorInitialData({
            id: 3,
            specialty: 'Clínica',
            consultation_price: 15000,
            force_hour_alignment: 1
        });

        expect(initialData.specialty).toBe('Clínica');
        expect(initialData.consultation_price).toBe(15000);
        expect(initialData.appointment_duration).toBe(60);
        expect(initialData.force_hour_alignment).toBe(true);
        expect(initialData.gemini_history_limit).toBe(3);
    });
});
