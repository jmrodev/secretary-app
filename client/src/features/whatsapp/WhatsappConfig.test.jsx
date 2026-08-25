import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhatsappConfig } from './WhatsappConfig';

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));

vi.mock('@/api/axios', () => ({
    api: { get: mockGet }
}));

const doctor = {
    id: 1,
    full_name: 'Dr. House'
};

// t stub: labels resolve to their keys, so tests assert on stable keys.
const t = (key) => key;

const renderConfig = () => render(<WhatsappConfig t={t} />);

beforeEach(() => {
    mockGet.mockReset();
    mockGet.mockResolvedValue({ data: { success: true, data: [doctor] } });
});

describe('WhatsappConfig quick responses', () => {
    it('loads the doctor selector and shows the quick responses section', async () => {
        renderConfig();
        expect(await screen.findByRole('option', { name: 'Dr. House' })).toBeInTheDocument();
        expect(screen.getByText('wa_config_quick_label')).toBeInTheDocument();
        expect(screen.getByText('wa_qr_saludo')).toBeInTheDocument();
        expect(screen.getByText('wa_qr_derivar')).toBeInTheDocument();
    });

    it('copies a quick response to the clipboard', async () => {
        const writeText = vi.fn().mockResolvedValue();
        Object.assign(navigator, { clipboard: { writeText } });

        renderConfig();
        await screen.findByRole('option', { name: 'Dr. House' });

        fireEvent.click(screen.getAllByRole('button', { name: 'wa_copy_btn' })[0]);

        await waitFor(() => expect(writeText).toHaveBeenCalled());
        expect(await screen.findByText('wa_config_copied')).toBeInTheDocument();
    });
});