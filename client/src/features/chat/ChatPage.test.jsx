import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatPage } from './ChatPage';

// Mock the hook
vi.mock('./hooks/useMessagesPageController', () => ({
    useMessagesPageController: vi.fn()
}));

vi.mock('@/components/templates/MainLayout', () => ({
    MainLayout: ({ children }) => <div>{children}</div>
}));

vi.mock('@/features/chat/index', async () => {
    const actual = await vi.importActual('@/features/chat/index');
    return {
        ...actual,
        ChatSidebar: () => <div data-testid="chat-sidebar" />,
        ChatWindow: () => <div data-testid="chat-window" />
    };
});

vi.mock('@/components/molecules/WhatsappPairing', () => ({
    WhatsappPairing: ({ bridgeStatus }) => <div data-testid="pairing-mock">{bridgeStatus.qr_code}</div>
}));

import { useMessagesPageController } from './hooks/useMessagesPageController';
import { useLanguage } from '@/hooks/useLanguage';

vi.mock('@/hooks/useLanguage', () => ({
    useLanguage: vi.fn(() => ({ t: (k) => k }))
}));

describe('ChatPage - Bridge Reconnection (R7)', () => {
    beforeEach(() => vi.clearAllMocks());

    it('renders inline QR and Reconectar when bridge is disconnected with qr_code', () => {
        useMessagesPageController.mockReturnValue({
            user: { id: 1 },
            conversations: [],
            selectedConvo: null, setSelectedConvo: vi.fn(),
            thread: [], recipients: [], unreadCount: 0, loading: false, sending: false,
            searchTerm: '', setSearchTerm: vi.fn(),
            messageText: '', setMessageText: vi.fn(),
            scrollRef: { current: null },
            handleSendMessage: vi.fn(), startNewChat: vi.fn(),
            bridgeStatus: { status: 'disconnected', qr_code: 'test-qr-123', session_expired_since: null },
            bridgeStatusLoading: false, handleRefreshBridge: vi.fn(), fetchBridgeStatus: vi.fn()
        });

        render(<ChatPage />);

        expect(screen.getByTestId('bridge-status')).toBeInTheDocument();
        expect(screen.getByTestId('bridge-qr')).toBeInTheDocument();
        expect(screen.getByTestId('bridge-reconnect')).toBeInTheDocument();
        expect(screen.getByText('bridge_status_disconnected')).toBeInTheDocument();
    });

    it('renders session_expired status distinctly (R8)', () => {
        useMessagesPageController.mockReturnValue({
            user: { id: 1 },
            conversations: [], selectedConvo: null, setSelectedConvo: vi.fn(),
            thread: [], recipients: [], unreadCount: 0, loading: false, sending: false,
            searchTerm: '', setSearchTerm: vi.fn(),
            messageText: '', setMessageText: vi.fn(),
            scrollRef: { current: null },
            handleSendMessage: vi.fn(), startNewChat: vi.fn(),
            bridgeStatus: { status: 'session_expired', qr_code: 'qr-session', session_expired_since: new Date().toISOString() },
            bridgeStatusLoading: false, handleRefreshBridge: vi.fn(), fetchBridgeStatus: vi.fn()
        });

        render(<ChatPage />);

        expect(screen.getByText('bridge_status_session_expired')).toBeInTheDocument();
        expect(screen.getByTestId('bridge-qr')).toBeInTheDocument();
    });

    it('renders awaiting_admin banner (R9)', () => {
        useMessagesPageController.mockReturnValue({
            user: { id: 1 },
            conversations: [], selectedConvo: null, setSelectedConvo: vi.fn(),
            thread: [], recipients: [], unreadCount: 0, loading: false, sending: false,
            searchTerm: '', setSearchTerm: vi.fn(),
            messageText: '', setMessageText: vi.fn(),
            scrollRef: { current: null },
            handleSendMessage: vi.fn(), startNewChat: vi.fn(),
            bridgeStatus: { status: 'awaiting_admin', qr_code: '', session_expired_since: new Date().toISOString() },
            bridgeStatusLoading: false, handleRefreshBridge: vi.fn(), fetchBridgeStatus: vi.fn()
        });

        render(<ChatPage />);

        expect(screen.getByText('bridge_status_awaiting_admin')).toBeInTheDocument();
        expect(screen.getByTestId('bridge-qr')).toBeInTheDocument();
    });
});
