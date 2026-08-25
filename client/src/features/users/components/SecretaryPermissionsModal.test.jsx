import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SecretaryPermissionsModal } from './SecretaryPermissionsModal';
import { api } from '@/api/axios';

vi.mock('@/api/axios', () => ({
    api: {
        put: vi.fn()
    }
}));

vi.mock('@/context/MessageContext', () => ({
    useMessage: () => ({ showMessage: vi.fn() })
}));

vi.mock('@/hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (k) => k })
}));

describe('SecretaryPermissionsModal', () => {
    const mockSecretary = {
        id: 42,
        username: 'sec_ana',
        full_name: 'Ana Secretaria',
        role: 'secretary',
        permissions: {
            can_manage_users: true,
            can_crud_appointments: true,
            can_edit_past_appointments: false,
            can_crud_requests: false,
            can_crud_prescriptions: true,
            can_crud_licenses: false,
            can_crud_files: true,
            can_crud_finances: false
        }
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not render when isOpen is false', () => {
        const { container } = render(
            <SecretaryPermissionsModal
                isOpen={false}
                onClose={vi.fn()}
                secretary={mockSecretary}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders modal with all 8 permission toggles initialized correctly', () => {
        render(
            <SecretaryPermissionsModal
                isOpen={true}
                onClose={vi.fn()}
                secretary={mockSecretary}
            />
        );

        expect(screen.getByText(/Ana Secretaria/)).toBeTruthy();
        expect(screen.getByLabelText('perm_can_manage_users')).toBeChecked();
        expect(screen.getByLabelText('perm_can_crud_appointments')).toBeChecked();
        expect(screen.getByLabelText('perm_can_edit_past_appointments')).not.toBeChecked();
        expect(screen.getByLabelText('perm_can_crud_finances')).not.toBeChecked();
    });

    it('toggles permission and sends PUT request with updated values upon confirm', async () => {
        api.put.mockResolvedValue({ data: { success: true } });
        const onSaveSuccess = vi.fn();
        const onClose = vi.fn();

        render(
            <SecretaryPermissionsModal
                isOpen={true}
                onClose={onClose}
                secretary={mockSecretary}
                onSaveSuccess={onSaveSuccess}
            />
        );

        const financeToggle = screen.getByLabelText('perm_can_crud_finances');
        expect(financeToggle).not.toBeChecked();
        fireEvent.click(financeToggle);
        expect(financeToggle).toBeChecked();

        const saveButton = screen.getByRole('button', { name: 'confirm' });
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(api.put).toHaveBeenCalledWith('/users/admin/users/42/permissions', {
                can_manage_users: true,
                can_crud_appointments: true,
                can_edit_past_appointments: false,
                can_crud_requests: false,
                can_crud_prescriptions: true,
                can_crud_licenses: false,
                can_crud_files: true,
                can_crud_finances: true
            });
            expect(onSaveSuccess).toHaveBeenCalled();
            expect(onClose).toHaveBeenCalled();
        });
    });

    it('calls onClose and does not dispatch API call when cancel is clicked', () => {
        const onClose = vi.fn();

        render(
            <SecretaryPermissionsModal
                isOpen={true}
                onClose={onClose}
                secretary={mockSecretary}
            />
        );

        const cancelButton = screen.getByRole('button', { name: 'cancel' });
        fireEvent.click(cancelButton);

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(api.put).not.toHaveBeenCalled();
    });
});
