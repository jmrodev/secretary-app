import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhatsappConfig } from './WhatsappConfig';

const { mockGet, mockPut } = vi.hoisted(() => ({ mockGet: vi.fn(), mockPut: vi.fn() }));

vi.mock('@/api/axios', () => ({
    api: { get: mockGet, put: mockPut }
}));

const doctor = {
    id: 1,
    full_name: 'Dr. House',
    gemini_context: 'contexto base',
    gemini_model: 'llama-3.3-70b-versatile',
    gemini_history_limit: 3,
    pending_response_template: 'Esperá un momento, estoy consultando con la secretaría...'
};

// t stub: labels resolve to their keys, so tests assert on stable keys.
const t = (key) => key;

const renderConfig = () => render(<WhatsappConfig t={t} />);

beforeEach(() => {
    mockGet.mockReset();
    mockPut.mockReset();
    mockGet.mockResolvedValue({ data: { success: true, data: [doctor] } });
    mockPut.mockResolvedValue({ data: { success: true } });
});

describe('WhatsappConfig pending_response_template', () => {
    it('loads the pending response template from the selected doctor', async () => {
        renderConfig();
        const textarea = await screen.findByDisplayValue(doctor.pending_response_template);
        expect(textarea).toHaveValue(doctor.pending_response_template);
    });

    it('saves the pending response template with the doctor config', async () => {
        renderConfig();
        // Wait for the initial doctor load before typing, otherwise the
        // doctor-select effect overwrites the edited value.
        const textarea = await screen.findByDisplayValue(doctor.pending_response_template);
        fireEvent.change(textarea, { target: { value: 'Tu pedido sigue en revisión' } });

        fireEvent.click(screen.getByRole('button', { name: 'wa_config_save' }));

        await waitFor(() => expect(mockPut).toHaveBeenCalledWith(
            '/users/doctors/1',
            expect.objectContaining({ pending_response_template: 'Tu pedido sigue en revisión' })
        ));
        expect(await screen.findByText('wa_config_saved')).toBeInTheDocument();
    });
});
