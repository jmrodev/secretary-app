import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserTable } from './UserTable';

vi.mock('@/hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (k) => k })
}));

describe('UserTable - Granular Permissions rendering', () => {
    const mockUsers = [
        {
            id: 1,
            username: 'admin_user',
            full_name: 'Admin Master',
            role: 'admin'
        },
        {
            id: 2,
            username: 'sec_granted',
            full_name: 'Secretary Full',
            role: 'secretary',
            permissions: {
                can_manage_users: true,
                can_crud_appointments: true,
                can_edit_past_appointments: false,
                can_crud_requests: true,
                can_crud_prescriptions: false,
                can_crud_licenses: false,
                can_crud_files: false,
                can_crud_finances: true
            }
        },
        {
            id: 3,
            username: 'sec_none',
            full_name: 'Secretary Restricted',
            role: 'secretary',
            permissions: {}
        },
        {
            id: 4,
            username: 'doc_user',
            full_name: 'Dr. House',
            role: 'doctor'
        }
    ];

    it('renders admin full access badge', () => {
        render(<UserTable users={[mockUsers[0]]} onEdit={vi.fn()} onReset={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText('full_access')).toBeTruthy();
    });

    it('renders granular badges for granted secretary', () => {
        render(<UserTable users={[mockUsers[1]]} onEdit={vi.fn()} onReset={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText('badge_users')).toBeTruthy();
        expect(screen.getByText('badge_appointments')).toBeTruthy();
        expect(screen.getByText('badge_requests')).toBeTruthy();
        expect(screen.getByText('badge_finances')).toBeTruthy();
        expect(screen.queryByText('badge_prescriptions')).toBeNull();
    });

    it('renders empty permission label for restricted secretary', () => {
        render(<UserTable users={[mockUsers[2]]} onEdit={vi.fn()} onReset={vi.fn()} onDelete={vi.fn()} />);
        expect(screen.getByText('no_operational_permissions')).toBeTruthy();
    });

    it('calls onOpenPermissions when permissions button is clicked for secretary', () => {
        const onOpenPermissions = vi.fn();
        render(
            <UserTable
                users={[mockUsers[1]]}
                onEdit={vi.fn()}
                onReset={vi.fn()}
                onDelete={vi.fn()}
                onOpenPermissions={onOpenPermissions}
            />
        );

        const permButton = screen.getByTitle('edit_permissions');
        fireEvent.click(permButton);
        expect(onOpenPermissions).toHaveBeenCalledWith(mockUsers[1]);
    });
});
