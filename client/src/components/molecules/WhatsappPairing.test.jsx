import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WhatsappPairing } from './WhatsappPairing';

describe('WhatsappPairing Component (TDD)', () => {
    const mockT = (key) => key;
    const mockRefresh = vi.fn();

    it('renders QR code when bridgeStatus has a qr_code', () => {
        const bridgeStatus = { status: 'disconnected', qr_code: '2@test-qr-code-data' };
        render(
            <WhatsappPairing 
                bridgeStatus={bridgeStatus} 
                onRefresh={mockRefresh} 
                statusLoading={false} 
                t={mockT} 
            />
        );

        expect(screen.getByText('whatsapp_pairing_required')).toBeInTheDocument();
        const svg = document.querySelector('svg');
        expect(svg).toBeInTheDocument();
    });

    it('renders loading placeholder when disconnected but qr_code is empty', () => {
        const bridgeStatus = { status: 'disconnected', qr_code: '' };
        render(
            <WhatsappPairing 
                bridgeStatus={bridgeStatus} 
                onRefresh={mockRefresh} 
                statusLoading={false} 
                t={mockT} 
            />
        );

        expect(screen.getByText('generating_qr')).toBeInTheDocument();
    });

    it('triggers onRefresh when refresh button is clicked', () => {
        const bridgeStatus = { status: 'disconnected', qr_code: '2@test-qr' };
        render(
            <WhatsappPairing 
                bridgeStatus={bridgeStatus} 
                onRefresh={mockRefresh} 
                statusLoading={false} 
                t={mockT} 
            />
        );

        const refreshBtn = screen.getByText('whatsapp_refresh');
        fireEvent.click(refreshBtn);
        expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    it('renders session_expired distinctly with QR (R8)', () => {
        const bridgeStatus = { status: 'session_expired', qr_code: 'session-qr' };
        render(
            <WhatsappPairing bridgeStatus={bridgeStatus} onRefresh={mockRefresh} statusLoading={false} t={mockT} />
        );
        expect(screen.getByText('bridge_session_expired_title')).toBeInTheDocument();
        expect(screen.getByText('bridge_session_expired_desc')).toBeInTheDocument();
        expect(document.querySelector('svg')).toBeInTheDocument();
    });

    it('renders awaiting_admin banner with guidance (R9)', () => {
        const bridgeStatus = { status: 'awaiting_admin', qr_code: '' };
        render(
            <WhatsappPairing bridgeStatus={bridgeStatus} onRefresh={mockRefresh} statusLoading={false} t={mockT} />
        );
        expect(screen.getByText('bridge_awaiting_admin_title')).toBeInTheDocument();
        expect(screen.getByText('bridge_awaiting_admin_desc')).toBeInTheDocument();
    });
});
