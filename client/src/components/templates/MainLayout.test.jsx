import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MessageProvider } from '@/context/MessageContext';
import { LanguageProvider } from '@/context/LanguageProvider';
import { SearchProvider } from '@/context/SearchProvider';
import { MainLayout } from './MainLayout';

const { mockGet } = vi.hoisted(() => ({ mockGet: vi.fn() }));
const { mockUseAuth } = vi.hoisted(() => ({ mockUseAuth: vi.fn() }));

vi.mock('@/api/axios', () => ({
    api: { get: mockGet, post: vi.fn() }
}));

vi.mock('@/features/auth', () => ({
    useAuth: mockUseAuth
}));

vi.mock('@/features/layout', () => ({
    Navbar: () => <nav>Navbar</nav>
}));

vi.mock('@/components/ui/PageHeader', () => ({
    PageHeader: () => <header>PageHeader</header>
}));

vi.mock('@/features/doctors', () => ({
    DoctorSelector: () => null
}));

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
    it('renders navbar and children correctly without auto-booking polling banner', () => {
        mockUseAuth.mockReturnValue({ user: { role: 'secretary', user_id: 1 } });
        renderLayout();

        expect(screen.getByText('Navbar')).toBeInTheDocument();
        expect(screen.getByText('child content')).toBeInTheDocument();
    });
});
