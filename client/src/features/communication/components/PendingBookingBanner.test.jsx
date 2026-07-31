import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider } from '@/context/LanguageProvider';
import { PendingBookingBanner } from './PendingBookingBanner';

const renderBanner = (props) => render(
    <LanguageProvider>
        <PendingBookingBanner {...props} />
    </LanguageProvider>
);

describe('PendingBookingBanner', () => {
    it('renders nothing when there are no pending bookings and the queue is collapsed', () => {
        renderBanner({ count: 0, expanded: false, onToggle: vi.fn() });
        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows the pending count when bookings exist', () => {
        renderBanner({ count: 2, expanded: false, onToggle: vi.fn() });
        expect(screen.getByRole('button')).toHaveTextContent(/2 aprobaciones pendientes/);
    });

    it('uses the singular label for exactly one pending booking', () => {
        renderBanner({ count: 1, expanded: false, onToggle: vi.fn() });
        expect(screen.getByRole('button')).toHaveTextContent(/1 aprobación pendiente/);
    });

    it('calls onToggle when clicked', () => {
        const onToggle = vi.fn();
        renderBanner({ count: 3, expanded: false, onToggle });
        fireEvent.click(screen.getByRole('button'));
        expect(onToggle).toHaveBeenCalledTimes(1);
    });

    it('reflects the expanded state via aria-expanded', () => {
        renderBanner({ count: 1, expanded: true, onToggle: vi.fn() });
        expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
    });
});
