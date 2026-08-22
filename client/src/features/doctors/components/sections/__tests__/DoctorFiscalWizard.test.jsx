import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DoctorFiscalWizard } from '../DoctorFiscalWizard';
import { LanguageProvider } from '@/context/LanguageProvider';

const renderWithProvider = (ui) => {
    return render(
        <LanguageProvider>
            {ui}
        </LanguageProvider>
    );
};

describe('DoctorFiscalWizard', () => {
    const defaultProps = {
        data: { afip_cuit: '', afip_pto_vta: '' },
        onChangeData: vi.fn(),
        onGenerateCsr: vi.fn(),
        onUploadCert: vi.fn(),
        onTestConnection: vi.fn(),
        generatedCsr: null,
        generatingCsr: false,
        uploading: false,
        connectionStatus: null,
        statusDetails: null
    };

    it('starts on step 1 and validates required fields before next', () => {
        renderWithProvider(<DoctorFiscalWizard {...defaultProps} />);
        
        // Initial state is step 1
        expect(screen.getByText('wizard_step1_title')).toHaveClass(/active/);
        
        // Next button is disabled because cuit and pto_vta are empty
        const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
        expect(nextBtn).toBeDisabled();

        // Change data via props simulation isn't direct here, but we can check if it stays disabled
    });

    it('allows moving to next step when fields are provided', () => {
        const props = {
            ...defaultProps,
            data: { afip_cuit: '20123456789', afip_pto_vta: '1' }
        };
        renderWithProvider(<DoctorFiscalWizard {...props} />);
        
        const nextBtn = screen.getByRole('button', { name: /Siguiente/i });
        expect(nextBtn).not.toBeDisabled();

        fireEvent.click(nextBtn);
        
        // Should move to step 2
        expect(screen.getByText('wizard_step2_title')).toHaveClass(/active/);
    });
});
