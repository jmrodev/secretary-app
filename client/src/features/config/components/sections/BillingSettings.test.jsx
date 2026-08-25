import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BillingSettings } from './BillingSettings';

// Mock api
const mockGet = vi.fn();
const mockPut = vi.fn();
const mockPost = vi.fn();
vi.mock('@/api/axios', () => ({
    api: {
        get: (...args) => mockGet(...args),
        put: (...args) => mockPut(...args),
        post: (...args) => mockPost(...args)
    }
}));

// Mock useMessage
const mockShowMessage = vi.fn();
vi.mock('@/context/MessageContext', () => ({
    useMessage: () => ({ showMessage: mockShowMessage })
}));

// Mock useLanguage
vi.mock('@/hooks/useLanguage', () => ({
    useLanguage: () => ({
        t: (key) => key
    })
}));

// Mock useFetch
const mockUseFetch = vi.fn();
vi.mock('@/hooks/useFetch', () => ({
    useFetch: (...args) => mockUseFetch(...args)
}));

// Mock DoctorEditModal to test interaction
vi.mock('@/features/doctors/components/modals/DoctorEditModal', () => ({
    DoctorEditModal: ({ isOpen, data, activeTab, onClose, onSave }) => (
        isOpen ? (
            <div data-testid="doctor-edit-modal">
                <span data-testid="modal-active-tab">{activeTab}</span>
                <span data-testid="modal-doctor-cuit">{data.afip_cuit}</span>
                <button type="button" onClick={onClose}>Close Modal</button>
                <button type="button" onClick={onSave}>Save Doctor</button>
            </div>
        ) : null
    )
}));

describe('BillingSettings', () => {
    const defaultUser = { role: 'admin' };
    const defaultSettings = { afip_environment: 'testing' };
    const mockUpdateSetting = vi.fn();

    const sampleDoctors = [
        {
            id: '1',
            full_name: 'Dr. Gregory House',
            specialty: 'Diagnóstico',
            afip_cuit: '20123456789',
            afip_pto_vta: 1,
            afipCrt: 'CERT_DATA',
            afipKey: 'KEY_DATA',
            has_certificate: true
        },
        {
            id: '2',
            full_name: 'Dr. John Watson',
            specialty: 'Medicina General',
            afip_cuit: '',
            afip_pto_vta: null,
            afipCrt: null,
            afipKey: null,
            has_certificate: false
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockUseFetch.mockReturnValue({
            data: { data: { doctors: sampleDoctors, totalCount: 2 } },
            loading: false,
            refetch: vi.fn()
        });
    });

    it('renders global environment selector and doctor fiscal matrix', () => {
        render(
            <BillingSettings
                user={defaultUser}
                settings={defaultSettings}
                updateSetting={mockUpdateSetting}
            />
        );

        expect(screen.getByText('billing_settings_title')).toBeInTheDocument();
        expect(screen.getByText('doctor_fiscal_status_title')).toBeInTheDocument();
        expect(screen.getByText('Dr. Gregory House')).toBeInTheDocument();
        expect(screen.getByText('Dr. John Watson')).toBeInTheDocument();
    });

    it('triggers updateSetting when environment is changed', () => {
        render(
            <BillingSettings
                user={defaultUser}
                settings={defaultSettings}
                updateSetting={mockUpdateSetting}
            />
        );

        const select = screen.getByDisplayValue('afip_env_testing');
        fireEvent.change(select, { target: { value: 'production' } });

        expect(mockUpdateSetting).toHaveBeenCalledWith('afip_environment', 'production');
        expect(mockShowMessage).toHaveBeenCalledWith('environment_updated_success', 'success');
    });

    it('handles AFIP health check successfully', async () => {
        mockGet.mockResolvedValueOnce({
            data: {
                environment: 'testing',
                afip_status: {
                    AppServer: 'OK',
                    DbServer: 'OK',
                    AuthServer: 'OK'
                }
            }
        });

        render(
            <BillingSettings
                user={defaultUser}
                settings={defaultSettings}
                updateSetting={mockUpdateSetting}
            />
        );

        const checkBtn = screen.getByText('verify_afip_connection');
        fireEvent.click(checkBtn);

        await waitFor(() => {
            expect(mockGet).toHaveBeenCalledWith('/billing/status');
            expect(screen.getByText(/afip_status_connected/)).toBeInTheDocument();
            expect(mockShowMessage).toHaveBeenCalledWith('afip_validated', 'success');
        });
    });

    it('handles AFIP health check error', async () => {
        mockGet.mockRejectedValueOnce({
            response: { data: { error: 'Service Unavailable' } }
        });

        render(
            <BillingSettings
                user={defaultUser}
                settings={defaultSettings}
                updateSetting={mockUpdateSetting}
            />
        );

        const checkBtn = screen.getByText('verify_afip_connection');
        fireEvent.click(checkBtn);

        await waitFor(() => {
            expect(mockGet).toHaveBeenCalledWith('/billing/status');
            expect(screen.getByText(/Service Unavailable/)).toBeInTheDocument();
            expect(mockShowMessage).toHaveBeenCalledWith('afip_connection_failed', 'error');
        });
    });

    it('renders ready status badge for complete doctor and incomplete for missing cert/cuit', () => {
        render(
            <BillingSettings
                user={defaultUser}
                settings={defaultSettings}
                updateSetting={mockUpdateSetting}
            />
        );

        expect(screen.getByText('fiscal_status_ready')).toBeInTheDocument();
        expect(screen.getByText('fiscal_status_incomplete')).toBeInTheDocument();
        expect(screen.getByText('fiscal_cuit_missing')).toBeInTheDocument();
        expect(screen.getByText('fiscal_cert_missing')).toBeInTheDocument();
    });

    it('opens DoctorEditModal pre-selected to fiscal tab when clicking edit action', async () => {
        render(
            <BillingSettings
                user={defaultUser}
                settings={defaultSettings}
                updateSetting={mockUpdateSetting}
            />
        );

        const editButtons = screen.getAllByRole('button', { name: /view_action/i });
        fireEvent.click(editButtons[0]);

        expect(screen.getByTestId('doctor-edit-modal')).toBeInTheDocument();
        expect(screen.getByTestId('modal-active-tab')).toHaveTextContent('fiscal');
        expect(screen.getByTestId('modal-doctor-cuit')).toHaveTextContent('20123456789');
    });

    it('saves doctor fiscal changes via API put and refreshes doctor list', async () => {
        const mockRefetch = vi.fn();
        mockUseFetch.mockReturnValue({
            data: { data: { doctors: sampleDoctors, totalCount: 2 } },
            loading: false,
            refetch: mockRefetch
        });
        mockPut.mockResolvedValueOnce({ data: { success: true } });

        render(
            <BillingSettings
                user={defaultUser}
                settings={defaultSettings}
                updateSetting={mockUpdateSetting}
            />
        );

        const editButtons = screen.getAllByRole('button', { name: /view_action/i });
        fireEvent.click(editButtons[0]);

        const saveBtn = screen.getByText('Save Doctor');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(mockPut).toHaveBeenCalledWith('/users/doctors/1', expect.objectContaining({
                afip_cuit: '20123456789'
            }));
            expect(mockShowMessage).toHaveBeenCalledWith('doctor_updated', 'success');
            expect(mockRefetch).toHaveBeenCalled();
        });
    });
});
