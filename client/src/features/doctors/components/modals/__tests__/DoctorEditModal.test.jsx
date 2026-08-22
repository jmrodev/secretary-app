import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DoctorEditModal } from '../DoctorEditModal';
import { LanguageProvider } from '@/context/LanguageProvider';

vi.mock('@/features/doctors/hooks/useDoctorFiscalController', () => ({
    useDoctorFiscalController: () => ({
        generatedCsr: null,
        generatingCsr: false,
        showCsrInfo: false,
        generateCsr: vi.fn(),
        hideCsrInfo: vi.fn(),
        uploading: false,
        uploadCert: vi.fn(),
        connectionStatus: null,
        statusDetails: null,
        testConnection: vi.fn()
    })
}));

const renderWithProvider = (ui) => {
    return render(
        <LanguageProvider>
            {ui}
        </LanguageProvider>
    );
};

describe('DoctorEditModal', () => {
    const defaultProps = {
        isOpen: true,
        onClose: vi.fn(),
        activeTab: 'fiscal',
        onTabChange: vi.fn(),
        data: { id: 1, full_name: 'Dr. Test', afip_cuit: '', afip_pto_vta: '' },
        settings: {},
        onChangeData: vi.fn(),
        onSave: vi.fn(),
        type: 'EDIT',
        schedule: [],
        setSchedule: vi.fn(),
        loadingSchedule: false,
        ScheduleBulkActionsComponent: () => null,
        ScheduleTimeBlockComponent: () => null,
        connected: false,
        onConnectGoogle: vi.fn(),
        onDisconnectGoogle: vi.fn(),
        onVerifyGoogleEvents: vi.fn(),
        onImportContacts: vi.fn(),
        onResetSpreadsheet: vi.fn(),
        UserFormComponent: () => null,
        MessageTemplateEditorComponent: () => null,
        t: (key) => key
    };

    it('renders DoctorFiscalWizard in fiscal tab', () => {
        renderWithProvider(<DoctorEditModal {...defaultProps} />);
        
        // Wizard should be rendered
        expect(screen.getByText('wizard_step1_title')).toBeInTheDocument();
        expect(screen.getByText(/CUIT Facturación/i)).toBeInTheDocument();
    });
});
