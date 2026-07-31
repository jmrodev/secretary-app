import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MessageProvider } from '@/context/MessageContext';
import { LanguageProvider } from '@/context/LanguageProvider';
import { SearchProvider } from '@/context/SearchProvider';
import MainLayout from './MainLayout';

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));
const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('@/api/axios', () => ({
    default: { get: mockGet, post: vi.fn() }
}));

vi.mock('@/features/auth', () => ({
    useAuth: mockUseAuth
}));

vi.mock('@/features/layout', () => ({
    Navbar: () => <nav>Navbar</nav>
}));

vi.mock('@/components/ui/PageHeader', () => ({
    default: () => <header>PageHeader</header>
}));

vi.mock('@/features/doctors', () => ({
    DoctorSelector: () => null
}));

vi.mock('@/components/molecules/CompactHeaderStats', () => ({
    default: () => null
}));

const pendingBooking = {
    id: 1,
    patient_name: 'Juan Pérez',
    doctor_name: 'Dr. House',
    requested_slot_date: '2026-08-03',
    requested_slot_time: '09:00',
    status: 'pending'
};

const renderLayout = () => render(
    <MessageProvider>
        <LanguageProvider>
            <SearchProvider>
                <MainLayout>
                    <p>child content</p>
                </MainLayout>
            </SearchProvider>
        </LanguageProvider>
    </MessageProvider>
);

describe('MainLayout', () => {
    it('mounts the pending approval queue and shows the trigger when a booking is pending', async () => {
        mockUseAuth.mockReturnValue({ user: { role: 'secretary', user_id: 1 } });
        mockGet.mockResolvedValue({ data: { success: true, data: [pendingBooking] } });
        renderLayout();

        expect(screen.getByText('child content')).toBeInTheDocument();

        const trigger = await screen.findByRole('button', { name: 'Abrir aprobaciones pendientes' });
        expect(trigger).toHaveTextContent(/1 aprobación pendiente/);

        fireEvent.click(trigger);
        expect(await screen.findByText('Juan Pérez')).toBeInTheDocument();
    });

    it('does not show the queue trigger when nothing is pending', async () => {
        mockUseAuth.mockReturnValue({ user: { role: 'secretary', user_id: 1 } });
        mockGet.mockResolvedValue({ data: { success: true, data: [] } });
        renderLayout();

        await waitFor(() => expect(mockGet).toHaveBeenCalledWith('/whatsapp/pending-bookings'));
        expect(screen.queryByRole('button', { name: 'Abrir aprobaciones pendientes' })).not.toBeInTheDocument();
    });
});
