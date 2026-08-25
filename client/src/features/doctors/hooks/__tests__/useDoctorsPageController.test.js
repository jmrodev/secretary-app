import { describe, it, expect } from 'vitest';
import { buildDoctorInitialData } from '@/features/doctors/hooks/useDoctorsPageController';

describe('buildDoctorInitialData', () => {
    it('preserves the edit-modal fields and their defaults', () => {
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
    });
});