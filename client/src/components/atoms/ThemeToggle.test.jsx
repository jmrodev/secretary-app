import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle Atom', () => {
    beforeEach(() => {
        document.body.removeAttribute('data-theme');
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
        }
    });

    it('renders theme toggle button', () => {
        render(<ThemeToggle />);
        expect(screen.getByRole('button', { name: /change_theme_mode|modo/i })).toBeInTheDocument();
    });

    it('cycles data-theme attribute through dark -> dim -> light -> dark', () => {
        render(<ThemeToggle />);
        const btn = screen.getByRole('button', { name: /change_theme_mode|modo/i });

        // Initial state is dark
        expect(document.body.getAttribute('data-theme')).toBe('dark');

        // Click to switch to dim (Suave)
        fireEvent.click(btn);
        expect(document.body.getAttribute('data-theme')).toBe('dim');

        // Click again to switch to light (Tiza)
        fireEvent.click(btn);
        expect(document.body.getAttribute('data-theme')).toBe('light');

        // Click again to cycle back to dark
        fireEvent.click(btn);
        expect(document.body.getAttribute('data-theme')).toBe('dark');
    });
});
