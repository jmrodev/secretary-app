import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PatientDetailsView } from '../PatientDetailsView';

vi.mock('@/features/patients/hooks/usePatientDetailsController', () => ({
    usePatientDetailsController: vi.fn(() => ({
        chronicMeds: [
            { id: 1, medication_name: 'Losartan', dose: '50mg', frequency: 'Cada 12hs', boxes_count: 2 }
        ],
        recentRequests: [],
        officialPrescriptions: [
            { id: 10, doctor_name: 'Dr. House', created_at: '2026-09-10', medications: 'Ibuprofeno 600mg' }
        ],
        patientFiles: [
            { id: 5, file_name: 'analisis_sangre.pdf', file_type: 'application/pdf', created_at: '2026-09-01' }
        ],
        loadingFiles: false,
        refetchMedications: vi.fn(),
        refetchFiles: vi.fn()
    }))
}));

vi.mock('@/context/MessageContext', () => ({
    useMessage: () => ({ showMessage: vi.fn() })
}));

describe('PatientDetailsView Coordinator', () => {
    const mockT = vi.fn((key) => {
        const map = {
            general_info: 'Información General',
            medical_history: 'Historial Médico',
            finances: 'Finanzas',
            prescriptions: 'Recetas',
            documents: 'Documentos',
            whatsapp_history: 'Historial WhatsApp',
            back_to_list: 'Volver a la lista',
            print: 'Imprimir',
            edit_info: 'Editar información',
            delete: 'Eliminar',
            particular: 'Particular',
            current_medication: 'Medicación Actual',
            recent_prescriptions: 'Recetas Recientes',
            patient_files: 'Archivos del Paciente',
            appointment_history: 'Historial de Turnos',
            patient_info: 'Datos del Paciente'
        };
        return map[key] || key;
    });

    const mockPatient = {
        id: 42,
        full_name: 'Ana Gomez',
        dni: '44556677',
        dob: '1995-03-20',
        insurance_name: 'Swiss Medical',
        total_debt: 0,
        financial_rating: 5,
        attendance_rating: 5,
        behavior_rating: 5
    };

    it('renders header and defaults to general_info tab', () => {
        render(
            <PatientDetailsView
                details={mockPatient}
                t={mockT}
                user={{ role: 'admin' }}
                onBack={vi.fn()}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onGenerateQR={vi.fn()}
                onGeneratePrescriptionLink={vi.fn()}
                onToggleNew={vi.fn()}
                onPayDebt={vi.fn()}
                onEditRating={vi.fn()}
            />
        );

        expect(screen.getByRole('heading', { name: 'Ana Gomez' })).toBeInTheDocument();
        expect(screen.getByText('Información General')).toBeInTheDocument();
    });

    it('switches to medications tab and renders chronic meds', () => {
        render(
            <PatientDetailsView
                details={mockPatient}
                t={mockT}
                user={{ role: 'admin' }}
                onBack={vi.fn()}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onGenerateQR={vi.fn()}
                onGeneratePrescriptionLink={vi.fn()}
                onToggleNew={vi.fn()}
                onPayDebt={vi.fn()}
                onEditRating={vi.fn()}
            />
        );

        const medsTabBtn = screen.getByRole('button', { name: /Recetas/ });
        fireEvent.click(medsTabBtn);

        expect(screen.getByText('Medicación Actual')).toBeInTheDocument();
        expect(screen.getByText('Losartan')).toBeInTheDocument();
        expect(screen.getByText('Dr. House')).toBeInTheDocument();
    });

    it('switches to documents tab and renders patient files', () => {
        render(
            <PatientDetailsView
                details={mockPatient}
                t={mockT}
                user={{ role: 'admin' }}
                onBack={vi.fn()}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onGenerateQR={vi.fn()}
                onGeneratePrescriptionLink={vi.fn()}
                onToggleNew={vi.fn()}
                onPayDebt={vi.fn()}
                onEditRating={vi.fn()}
            />
        );

        const docsTabBtn = screen.getByRole('button', { name: /Documentos/ });
        fireEvent.click(docsTabBtn);

        expect(screen.getByText('Archivos del Paciente')).toBeInTheDocument();
        expect(screen.getByText('analisis_sangre.pdf')).toBeInTheDocument();
    });
});
