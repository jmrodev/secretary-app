import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import AppointmentHeader from '../AppointmentHeader';

// Mocks
vi.mock('@/hooks/useLanguage', () => ({
    useLanguage: () => ({
        t: (key) => key
    })
}));

vi.mock('@/components/atoms/Icon', () => ({
    default: ({ name }) => <span data-testid={`icon-${name}`}>{name}</span>
}));

describe('AppointmentHeader Component', () => {
    const mockApptWithCreated = {
        id: 2368,
        patient_name: 'Juan Marcelo Rodriguez',
        appointment_date: '2026-08-03T09:00:00Z',
        created_at: '2026-07-30T17:20:39Z',
        status: 'pending',
        payment_status: 'debt'
    };

    const mockApptWithoutCreated = {
        id: 2368,
        patient_name: 'Juan Marcelo Rodriguez',
        appointment_date: '2026-08-03T09:00:00Z',
        created_at: null,
        status: 'pending',
        payment_status: 'debt'
    };

    it('renders the Created badge when created_at is present in appt data', () => {
        render(<AppointmentHeader appt={mockApptWithCreated} t={(k) => k} />);
        expect(screen.getByText(/Creado:/i)).toBeInTheDocument();
    });

    it('does NOT render the Created badge when created_at is null/undefined', () => {
        render(<AppointmentHeader appt={mockApptWithoutCreated} t={(k) => k} />);
        expect(screen.queryByText(/Creado:/i)).not.toBeInTheDocument();
    });

    it('renders confirmed_at badge when confirmed_at timestamp exists', () => {
        const apptConfirmed = {
            ...mockApptWithCreated,
            confirmed_at: '2026-07-30T18:00:00Z'
        };
        render(<AppointmentHeader appt={apptConfirmed} t={(k) => k} />);
        expect(screen.getByText(/Confirmado:/i)).toBeInTheDocument();
    });

    it('renders arrived_at badge (En sala) when arrived_at timestamp exists', () => {
        const apptArrived = {
            ...mockApptWithCreated,
            arrived_at: '2026-07-30T18:15:00Z'
        };
        render(<AppointmentHeader appt={apptArrived} t={(k) => k} />);
        expect(screen.getByText(/En sala:/i)).toBeInTheDocument();
    });
});
