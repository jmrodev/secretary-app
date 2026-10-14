import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { PatientList } from '../PatientList';

describe('PatientList', () => {
    const mockT = (k) => {
        const dict = {
            patient: 'Paciente',
            identification: 'Identificación',
            contact: 'Contacto',
            ratings: 'Calificaciones',
            rating_financial: 'Financiera',
            rating_attendance: 'Asistencia',
            rating_conduct: 'Conducta',
            rating_financial_tooltip: 'Salud Financiera',
            rating_attendance_tooltip: 'Asistencia',
            rating_behavior_tooltip: 'Conducta',
            debt: 'Deuda',
            actions: 'Acciones',
            no_patients_found: 'No se encontraron pacientes',
            rating: 'Calificación',
            click_to_change: 'Clic para editar',
            behavior_note_tooltip_prefix: 'Motivo:',
            institution_prefix: 'Institución',
            institution_debt: 'Deuda Institucional',
            go: 'Ir',
            view_details: 'Ver detalles',
            current_debt: 'Deuda actual',
            summary: 'Resumen'
        };
        return dict[k] || k;
    };

    const mockPatients = [
        {
            id: 1,
            first_name: 'Carlos',
            last_name: 'Perez',
            dni: '12345678',
            phone: '5491122334455',
            email: 'carlos@example.com',
            financial_rating: 5,
            attendance_rating: 4,
            behavior_rating: 3,
            behavior_rating_note: 'Llega 15 minutos tarde recurrentemente',
            total_debt: 0,
            total_appointments: 10,
            missed_appointments: 2
        }
    ];

    it('renders empty state when there are no patients', () => {
        render(
            <MemoryRouter>
                <PatientList patients={[]} t={mockT} />
            </MemoryRouter>
        );

        expect(screen.getByText('No se encontraron pacientes')).toBeInTheDocument();
    });

    it('renders table with 2-row headers: Calificaciones group and 3 subcolumns (Financiera, Asistencia, Conducta)', () => {
        render(
            <MemoryRouter>
                <PatientList patients={mockPatients} t={mockT} />
            </MemoryRouter>
        );

        // Header row 1: Calificaciones group header with colSpan=3
        const ratingsHeader = screen.getByRole('columnheader', { name: 'Calificaciones' });
        expect(ratingsHeader).toBeInTheDocument();
        expect(ratingsHeader).toHaveAttribute('colspan', '3');

        // Header row 2: Three sub-column headers
        expect(screen.getByRole('columnheader', { name: 'Financiera' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Asistencia' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: 'Conducta' })).toBeInTheDocument();
    });

    it('renders patient with 3 rating subcolumn cells and note indicator', () => {
        render(
            <MemoryRouter>
                <PatientList
                    patients={mockPatients}
                    t={mockT}
                    onViewDetails={vi.fn()}
                    onOpenDebt={vi.fn()}
                    onEditRating={vi.fn()}
                />
            </MemoryRouter>
        );

        expect(screen.getByText('PEREZ')).toBeInTheDocument();
        expect(screen.getByText('Carlos')).toBeInTheDocument();

        // Conducta cell should include the tooltip with the behavior note
        const conductaCell = screen.getByRole('button', { name: /Llega 15 minutos tarde recurrentemente/i });
        expect(conductaCell).toBeInTheDocument();
        expect(conductaCell.getAttribute('title')).toContain('Motivo: Llega 15 minutos tarde recurrentemente');
    });

    it('triggers onEditRating when Conducta cell is clicked', () => {
        const onEditRatingMock = vi.fn();
        render(
            <MemoryRouter>
                <PatientList
                    patients={mockPatients}
                    t={mockT}
                    onViewDetails={vi.fn()}
                    onOpenDebt={vi.fn()}
                    onEditRating={onEditRatingMock}
                    canEditRating={true}
                />
            </MemoryRouter>
        );

        const conductaCell = screen.getByRole('button', { name: /Llega 15 minutos tarde recurrentemente/i });
        fireEvent.click(conductaCell);

        expect(onEditRatingMock).toHaveBeenCalledTimes(1);
        expect(onEditRatingMock.mock.calls[0][1]).toEqual(mockPatients[0]);
    });

    it('renders institution row with colSpan=3 for ratings columns', () => {
        const mockInstitutions = [
            { id: 99, name: 'Clínica Central', total_debt: 25000 }
        ];

        render(
            <MemoryRouter>
                <PatientList
                    patients={[]}
                    institutions={mockInstitutions}
                    t={mockT}
                />
            </MemoryRouter>
        );

        expect(screen.getByText('Institución: Clínica Central')).toBeInTheDocument();
        expect(screen.getByText('$25,000')).toBeInTheDocument();
    });

    it('sorts by patient description (name) A-Z and Z-A on click', () => {
        const testPatients = [
            { id: 1, first_name: 'Carlos', last_name: 'Perez', total_debt: 100 },
            { id: 2, first_name: 'Ana', last_name: 'Alvarez', total_debt: 200 },
            { id: 3, first_name: 'Zoe', last_name: 'Zabaleta', total_debt: 300 }
        ];

        render(
            <MemoryRouter>
                <PatientList patients={testPatients} t={mockT} />
            </MemoryRouter>
        );

        const patientHeader = screen.getByRole('columnheader', { name: 'Paciente' });

        // First click: ASC (Alvarez -> Perez -> Zabaleta)
        fireEvent.click(patientHeader);
        let names = screen.getAllByRole('strong').map(el => el.textContent);
        expect(names).toEqual(['ALVAREZ', 'PEREZ', 'ZABALETA']);

        // Second click: DESC (Zabaleta -> Perez -> Alvarez)
        fireEvent.click(patientHeader);
        names = screen.getAllByRole('strong').map(el => el.textContent);
        expect(names).toEqual(['ZABALETA', 'PEREZ', 'ALVAREZ']);
    });

    it('sorts by debt mayor a menor on first click and menor a mayor on second click', () => {
        const testPatients = [
            { id: 1, first_name: 'Carlos', last_name: 'Perez', total_debt: 5000 },
            { id: 2, first_name: 'Ana', last_name: 'Alvarez', total_debt: 0 },
            { id: 3, first_name: 'Zoe', last_name: 'Zabaleta', total_debt: 25000 }
        ];

        render(
            <MemoryRouter>
                <PatientList patients={testPatients} t={mockT} onOpenDebt={vi.fn()} />
            </MemoryRouter>
        );

        const debtHeader = screen.getByRole('columnheader', { name: 'Deuda' });

        // First click: mayor a menor (DESC: 25000 -> 5000 -> 0)
        fireEvent.click(debtHeader);
        let names = screen.getAllByRole('strong').map(el => el.textContent);
        expect(names).toEqual(['ZABALETA', 'PEREZ', 'ALVAREZ']);

        // Second click: menor a mayor (ASC: 0 -> 5000 -> 25000)
        fireEvent.click(debtHeader);
        names = screen.getAllByRole('strong').map(el => el.textContent);
        expect(names).toEqual(['ALVAREZ', 'PEREZ', 'ZABALETA']);
    });

    it('sorts by ratings menor a mayor on first click and mayor a menor on second click', () => {
        const testPatients = [
            { id: 1, first_name: 'Carlos', last_name: 'Perez', financial_rating: 2, behavior_rating: 1 },
            { id: 2, first_name: 'Ana', last_name: 'Alvarez', financial_rating: 5, behavior_rating: 4 },
            { id: 3, first_name: 'Zoe', last_name: 'Zabaleta', financial_rating: 4, behavior_rating: 5 }
        ];

        render(
            <MemoryRouter>
                <PatientList patients={testPatients} t={mockT} />
            </MemoryRouter>
        );

        const finHeader = screen.getByRole('columnheader', { name: 'Financiera' });

        // First click on rating: menor a mayor (ASC: Perez (2) -> Zabaleta (4) -> Alvarez (5))
        fireEvent.click(finHeader);
        let names = screen.getAllByRole('strong').map(el => el.textContent);
        expect(names).toEqual(['PEREZ', 'ZABALETA', 'ALVAREZ']);

        // Second click on rating: mayor a menor (DESC: Alvarez (5) -> Zabaleta (4) -> Perez (2))
        fireEvent.click(finHeader);
        names = screen.getAllByRole('strong').map(el => el.textContent);
        expect(names).toEqual(['ALVAREZ', 'ZABALETA', 'PEREZ']);

        // Now test conduct/behavior rating
        const conductHeader = screen.getByRole('columnheader', { name: 'Conducta' });

        // First click: menor a mayor (ASC: Perez (1) -> Alvarez (4) -> Zabaleta (5))
        fireEvent.click(conductHeader);
        names = screen.getAllByRole('strong').map(el => el.textContent);
        expect(names).toEqual(['PEREZ', 'ALVAREZ', 'ZABALETA']);

        // Second click: mayor a menor (DESC: Zabaleta (5) -> Alvarez (4) -> Perez (1))
        fireEvent.click(conductHeader);
        names = screen.getAllByRole('strong').map(el => el.textContent);
        expect(names).toEqual(['ZABALETA', 'ALVAREZ', 'PEREZ']);
    });

    it('delegates sorting to onSort handler when operating in controlled mode', () => {
        const onSortMock = vi.fn();
        const testPatients = [
            { id: 1, first_name: 'Carlos', last_name: 'Perez', total_debt: 5000 },
            { id: 2, first_name: 'Ana', last_name: 'Alvarez', total_debt: 0 }
        ];

        render(
            <MemoryRouter>
                <PatientList
                    patients={testPatients}
                    t={mockT}
                    sortConfig={{ key: 'debt', direction: 'desc' }}
                    onSort={onSortMock}
                />
            </MemoryRouter>
        );

        const debtHeader = screen.getByRole('columnheader', { name: 'Deuda' });
        expect(debtHeader).toHaveAttribute('aria-sort', 'descending');

        fireEvent.click(debtHeader);
        expect(onSortMock).toHaveBeenCalledWith('debt', 'desc');

        const patientHeader = screen.getByRole('columnheader', { name: 'Paciente' });
        fireEvent.click(patientHeader);
        expect(onSortMock).toHaveBeenCalledWith('patient', 'asc');
    });
});

