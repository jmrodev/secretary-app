import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PatientDetailsHeader } from '../PatientDetailsHeader';

describe('PatientDetailsHeader Organism', () => {
    const mockT = vi.fn((key, params) => {
        const translations = {
            back_to_list: 'Volver a la lista',
            print: 'Imprimir',
            edit_info: 'Editar información',
            delete: 'Eliminar',
            particular: 'Particular',
            dni: 'DNI',
            years: 'años',
            no_debt: 'Al día',
            rating_financial: 'Financiera',
            rating_attendance: 'Asistencia',
            rating_behavior: 'Conducta',
            rating_conduct: 'Conducta',
            behavior_rating_manual_badge: 'Manual',
            behavior_rating_auto_derived: 'Auto',
            behavior_note_tooltip_prefix: 'Nota:',
            click_to_change: 'Click para modificar',
            rating: 'Calificación'
        };
        return translations[key] || key;
    });

    const basePatient = {
        id: 101,
        full_name: 'Carlos Perez',
        dni: '12345678',
        dob: '1990-05-15',
        insurance_name: 'OSDE',
        affiliate_number: '987654',
        total_debt: 0,
        financial_rating: 5,
        attendance_rating: 4,
        behavior_rating: 4,
        behavior_rating_note: null
    };

    it('renders patient identity information and debt status', () => {
        render(
            <PatientDetailsHeader
                details={basePatient}
                t={mockT}
                user={{ role: 'admin' }}
                onBack={vi.fn()}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onToggleNew={vi.fn()}
                onPrint={vi.fn()}
                onPayDebt={vi.fn()}
                onEditRating={vi.fn()}
            />
        );

        expect(screen.getByText('Carlos Perez')).toBeInTheDocument();
        expect(screen.getByText('12345678')).toBeInTheDocument();
        expect(screen.getByText(/OSDE/)).toBeInTheDocument();
        expect(screen.getByText('Al día')).toBeInTheDocument();
        expect(screen.getByText('Financiera')).toBeInTheDocument();
        expect(screen.getByText('Asistencia')).toBeInTheDocument();
        expect(screen.getByText('Conducta')).toBeInTheDocument();
        expect(screen.getByText('Auto')).toBeInTheDocument();
    });

    it('renders debt button when total_debt > 0 and handles click', () => {
        const onPayDebt = vi.fn();
        const patientWithDebt = { ...basePatient, total_debt: 12500 };

        render(
            <PatientDetailsHeader
                details={patientWithDebt}
                t={mockT}
                user={{ role: 'admin' }}
                onBack={vi.fn()}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onToggleNew={vi.fn()}
                onPrint={vi.fn()}
                onPayDebt={onPayDebt}
                onEditRating={vi.fn()}
            />
        );

        const debtBtn = screen.getByText('$12,500');
        expect(debtBtn).toBeInTheDocument();
        fireEvent.click(debtBtn);
        expect(onPayDebt).toHaveBeenCalledWith(expect.anything(), 101, 12500);
    });

    it('renders manual behavior note and triggers onEditRating when staff clicks it', () => {
        const onEditRating = vi.fn();
        const patientWithManualNote = {
            ...basePatient,
            behavior_rating: 3,
            behavior_rating_note: 'Paciente conflictivo con pagos'
        };

        render(
            <PatientDetailsHeader
                details={patientWithManualNote}
                t={mockT}
                user={{ role: 'admin' }}
                canEditRating={true}
                onBack={vi.fn()}
                onEdit={vi.fn()}
                onDelete={vi.fn()}
                onToggleNew={vi.fn()}
                onPrint={vi.fn()}
                onPayDebt={vi.fn()}
                onEditRating={onEditRating}
            />
        );

        expect(screen.getByText('Manual')).toBeInTheDocument();
        const behaviorCard = screen.getByRole('button', { name: /Nota: Paciente conflictivo con pagos/ });
        fireEvent.click(behaviorCard);
        expect(onEditRating).toHaveBeenCalledWith(expect.anything(), patientWithManualNote);
    });
});
