import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PatientRecycleBin } from '../PatientRecycleBin';

vi.mock('@/hooks/useLanguage', () => ({
    useLanguage: () => ({
        t: (k) => {
            const dict = {
                loading: 'Cargando...',
                recycle_bin_empty: 'La papelera de reciclaje está vacía',
                recycle_bin_retention_hint: 'Los elementos eliminados se conservan temporalmente.',
                patient: 'Paciente',
                contact_info: 'Contacto',
                deleted_date: 'Fecha de eliminación',
                actions: 'Acciones',
                no_name: 'Sin nombre',
                dni: 'DNI',
                no_phone_short: 'Sin teléfono',
                restore: 'Restaurar',
                permanent_delete_warning: 'Los elementos se eliminan permanentemente después de un tiempo.'
            };
            return dict[k] || k;
        }
    })
}));

describe('PatientRecycleBin', () => {
    const mockItems = [
        {
            id: 101,
            first_name: 'María',
            last_name: 'González',
            dni: '23456789',
            phone: '5491199887766',
            email: 'maria@example.com',
            deleted_at: '2026-03-10T14:30:00Z'
        }
    ];

    it('renders loading state when loading is true', () => {
        render(<PatientRecycleBin loading={true} recycleItems={[]} onRestore={vi.fn()} />);
        expect(screen.getByText('Cargando...')).toBeInTheDocument();
    });

    it('renders empty state when recycleItems is empty', () => {
        render(<PatientRecycleBin loading={false} recycleItems={[]} onRestore={vi.fn()} />);
        expect(screen.getByText('La papelera de reciclaje está vacía')).toBeInTheDocument();
    });

    it('renders recycle items table when items are present', () => {
        render(<PatientRecycleBin loading={false} recycleItems={mockItems} onRestore={vi.fn()} />);

        expect(screen.getByText('González, María')).toBeInTheDocument();
        expect(screen.getByText(/23456789/)).toBeInTheDocument();
        expect(screen.getByText('5491199887766')).toBeInTheDocument();
        expect(screen.getByText('maria@example.com')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Restaurar' })).toBeInTheDocument();
    });

    it('calls onRestore when clicking restore button', () => {
        const onRestoreMock = vi.fn();
        render(<PatientRecycleBin loading={false} recycleItems={mockItems} onRestore={onRestoreMock} />);

        const restoreBtn = screen.getByRole('button', { name: 'Restaurar' });
        fireEvent.click(restoreBtn);

        expect(onRestoreMock).toHaveBeenCalledWith(101);
    });
});
