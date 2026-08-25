import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GlobalWhatsappMessenger } from './GlobalWhatsappMessenger';

vi.mock('@/api/axios', () => ({
    api: { get: vi.fn(), post: vi.fn() }
}));

vi.mock('@/context/DoctorContextDefinition', () => ({
    useDoctors: () => ({ doctors: [] })
}));

vi.mock('@/features/patients/components/views/WhatsappChatHistory', () => ({
    WhatsappChatHistory: () => <div data-testid="chat-history" />
}));

vi.mock('../molecules/WhatsappInbox', () => ({
    WhatsappInbox: () => <div data-testid="inbox" />
}));

vi.mock('../molecules/WhatsappBroadcast', () => ({
    WhatsappBroadcast: () => <div data-testid="broadcast" />
}));

vi.mock('../molecules/WhatsappChatPlaceholder', () => ({
    WhatsappChatPlaceholder: () => <div data-testid="placeholder" />
}));

import { api } from '@/api/axios';

describe('GlobalWhatsappMessenger - session_expired mapping (R8)', () => {
    const mockT = (k) => k;

    beforeEach(() => vi.clearAllMocks());

    it('maps session_expired distinctly and shows pairing overlay', async () => {
        api.get.mockResolvedValue({ data: { success: true, status: 'session_expired', qr_code: 'qr-session', session_expired_since: new Date().toISOString() } });

        render(<GlobalWhatsappMessenger t={mockT} />);

        // Open the messenger
        const openBtn = screen.getByText('whatsapp_messenger');
        openBtn.click();

        await waitFor(() => {
            // Pairing overlay should be visible for session_expired (not connected)
            expect(document.body.textContent).toContain('bridge_session_expired_title');
        });
    });
});
