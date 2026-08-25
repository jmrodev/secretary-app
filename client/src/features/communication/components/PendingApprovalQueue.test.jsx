import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageProvider } from '@/context/MessageContext';
import { LanguageProvider } from '@/context/LanguageProvider';
import { PendingApprovalProvider } from '@/context/PendingApprovalContext';
import { PendingApprovalQueue } from './PendingApprovalQueue';

const { mockListPending, mockAcceptPending, mockSuggestAlternative, mockRejectPending } = vi.hoisted(() => ({
    mockListPending: vi.fn(),
    mockAcceptPending: vi.fn(),
    mockSuggestAlternative: vi.fn(),
    mockRejectPending: vi.fn()
}));

const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));
const { mockAxiosGet } = vi.hoisted(() => ({ mockAxiosGet: vi.fn() }));

vi.mock('@/api/pendingBookingApi', () => ({
    listPending: mockListPending,
    acceptPending: mockAcceptPending,
    suggestAlternative: mockSuggestAlternative,
    rejectPending: mockRejectPending
}));

vi.mock('@/features/auth/AuthContext', () => ({
    useAuth: mockUseAuth
}));

vi.mock('@/api/axios', () => ({
    api: { get: mockAxiosGet, post: vi.fn() }
}));

import { PendingBookingBanner } from './PendingBookingBanner';

const pending = (overrides = {}) => ({
    id: 1,
    patient_name: 'Juan Pérez',
    doctor_name: 'Dr. House',
    doctor_id: 3,
    patient_phone: '5491112345678',
    requested_slot_date: '2026-08-03',
    requested_slot_time: '09:00',
    status: 'pending',
    created_at: '2026-08-03T14:30:00.000Z',
    ...overrides
});

const renderQueue = () => render(
    <MessageProvider>
        <LanguageProvider>
            <PendingApprovalProvider>
                <PendingApprovalQueue />
            </PendingApprovalProvider>
        </LanguageProvider>
    </MessageProvider>
);

const expandQueue = async () => {
    const trigger = await screen.findByRole('button', { name: 'Abrir aprobaciones pendientes' });
    fireEvent.click(trigger);
    await screen.findByText('Aprobaciones pendientes');
};

beforeEach(() => {
    mockUseAuth.mockReturnValue({ user: { role: 'secretary', user_id: 1 } });
    mockListPending.mockReset();
    mockAcceptPending.mockReset();
    mockSuggestAlternative.mockReset();
    mockRejectPending.mockReset();
    mockAxiosGet.mockReset();
    mockAxiosGet.mockResolvedValue({ data: { success: true, data: { results: [] } } });
});

describe('PendingApprovalQueue', () => {
    it('lists all pending bookings with patient, doctor and requested slot', async () => {
        mockListPending.mockResolvedValue([
            pending(),
            pending({ id: 2, patient_name: 'María López', requested_slot_time: '11:30' })
        ]);
        renderQueue();
        await expandQueue();

        expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
        expect(screen.getByText('María López')).toBeInTheDocument();
        expect(screen.getAllByText('Dr. House')).toHaveLength(2);
        expect(screen.getByText(/09:00 hs/)).toBeInTheDocument();
        expect(screen.getByText(/11:30 hs/)).toBeInTheDocument();
    });

    it('shows the empty message after the last pending booking is resolved', async () => {
        mockListPending.mockResolvedValueOnce([pending()]);
        mockAcceptPending.mockResolvedValue({ success: true, appointment_id: 456 });
        mockListPending.mockResolvedValueOnce([]);
        renderQueue();
        await expandQueue();

        fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
        expect(await screen.findByText('No hay aprobaciones pendientes')).toBeInTheDocument();
        expect(screen.getByText('Turno aprobado y confirmado ✅')).toBeInTheDocument();
    });

    it('accepts a pending booking through the api', async () => {
        mockListPending.mockResolvedValue([pending()]);
        mockAcceptPending.mockResolvedValue({ success: true, appointment_id: 456 });
        renderQueue();
        await expandQueue();

        fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
        expect(await screen.findByText('Turno aprobado y confirmado ✅')).toBeInTheDocument();
        expect(mockAcceptPending).toHaveBeenCalledWith(1);
    });

    it('shows the taken-conflict message when another secretary won the race', async () => {
        mockListPending.mockResolvedValue([pending()]);
        mockAcceptPending.mockRejectedValue({
            response: { data: { success: false, status: 'taken', message: 'Already accepted' } }
        });
        renderQueue();
        await expandQueue();

        fireEvent.click(screen.getByRole('button', { name: 'Aceptar' }));
        expect(await screen.findByText('Ya fue aprobado por otra persona')).toBeInTheDocument();
    });

    it('rejects a pending booking through the api', async () => {
        mockListPending.mockResolvedValue([pending()]);
        mockRejectPending.mockResolvedValue({ success: true });
        renderQueue();
        await expandQueue();

        fireEvent.click(screen.getByRole('button', { name: 'Rechazar' }));
        expect(await screen.findByText('Pedido rechazado')).toBeInTheDocument();
        expect(mockRejectPending).toHaveBeenCalledWith(1, '');
    });

    it('suggests an alternative slot through the SlotExplorerDropdown picker', async () => {
        mockListPending.mockResolvedValue([pending()]);
        mockSuggestAlternative.mockResolvedValue({ success: true, message: 'Alternative sent to patient' });
        mockAxiosGet.mockResolvedValue({
            data: {
                success: true,
                data: {
                    results: [{
                        date: '2026-08-05',
                        dayName: 'Miércoles',
                        slots: [{ iso: '2026-08-05T10:00:00', time: '10:00', is_out_of_hours: false }]
                    }]
                }
            }
        });
        renderQueue();
        await expandQueue();

        fireEvent.click(screen.getByRole('button', { name: 'Sugerir alternativa' }));
        expect(await screen.findByText('10:00 hs')).toBeInTheDocument();
        fireEvent.click(screen.getByText('10:00 hs'));

        expect(await screen.findByText('Alternativa enviada al paciente')).toBeInTheDocument();
        expect(mockSuggestAlternative).toHaveBeenCalledWith(1, '2026-08-05T10:00:00', '');
    });

    it('shows the waiting status instead of action buttons for alternative_sent items', async () => {
        mockListPending.mockResolvedValue([pending({ status: 'alternative_sent' })]);
        renderQueue();
        await expandQueue();

        expect(screen.getByText('Esperando respuesta del paciente')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Aceptar' })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Sugerir alternativa' })).not.toBeInTheDocument();
    });

    it('collapses the queue when clicking the banner again', async () => {
        mockListPending.mockResolvedValue([pending()]);
        renderQueue();
        const trigger = await screen.findByRole('button', { name: 'Abrir aprobaciones pendientes' });
        fireEvent.click(trigger);
        await screen.findByText('Juan Pérez');

        fireEvent.click(screen.getByRole('button', { name: 'Cerrar aprobaciones pendientes' }));
        expect(screen.queryByText('Juan Pérez')).not.toBeInTheDocument();
    });

    it('keeps the banner mounted as a fixed trigger while collapsed', async () => {
        mockListPending.mockResolvedValue([pending()]);
        renderQueue();
        const trigger = await screen.findByRole('button', { name: 'Abrir aprobaciones pendientes' });
        expect(trigger).toHaveTextContent(/1 aprobación pendiente/);
        expect(PendingBookingBanner).toBeTruthy();
    });
});
