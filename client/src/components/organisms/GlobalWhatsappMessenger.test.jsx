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

    it('renders the collapsed trigger button with accessibility attributes and label', () => {
        render(<GlobalWhatsappMessenger t={mockT} />);

        const triggerButton = screen.getByRole('button', { name: /whatsapp_messenger/i });
        expect(triggerButton).toBeDefined();
        expect(triggerButton.getAttribute('title')).toBe('whatsapp_messenger');
        expect(screen.getByText('whatsapp_messenger')).toBeDefined();
    });

    it('maps session_expired distinctly, shows pairing overlay, and allows closing via close button', async () => {
        api.get.mockResolvedValue({ data: { success: true, status: 'session_expired', qr_code: 'qr-session', session_expired_since: new Date().toISOString() } });

        render(<GlobalWhatsappMessenger t={mockT} />);

        // Open the messenger
        const openBtn = screen.getByText('whatsapp_messenger');
        openBtn.click();

        await waitFor(() => {
            // Pairing overlay should be visible for session_expired (not connected)
            expect(document.body.textContent).toContain('bridge_session_expired_title');
        });

        // Close button in pairing overlay should close the panel
        const closeBtn = screen.getByRole('button', { name: /close/i });
        closeBtn.click();

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /whatsapp_messenger/i })).toBeDefined();
        });
    });

    it('closes the open messenger panel when Escape key is pressed', async () => {
        api.get.mockResolvedValue({ data: { success: true, status: 'connected' } });

        render(<GlobalWhatsappMessenger t={mockT} />);

        // Open the messenger
        const openBtn = screen.getByText('whatsapp_messenger');
        openBtn.click();

        // Simulate Escape key press
        window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

        await waitFor(() => {
            // Trigger button should be back
            expect(screen.getByRole('button', { name: /whatsapp_messenger/i })).toBeDefined();
        });
    });
});
