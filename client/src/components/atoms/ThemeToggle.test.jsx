import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from './ThemeToggle';

describe('ThemeToggle Atom', () => {
    beforeEach(() => {
        document.body.removeAttribute('data-theme');
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.clear();
        }
    });

    it('renders theme toggle button', () => {
        render(<ThemeToggle />);
        expect(screen.getByRole('button', { name: /modo/i })).toBeInTheDocument();
    });

    it('toggles data-theme attribute on document.body from dark to light on click', () => {
        render(<ThemeToggle />);
        const btn = screen.getByRole('button', { name: /modo/i });
        
        // Initial state is dark (no light theme)
        expect(document.body.getAttribute('data-theme')).not.toBe('light');

        // Click to switch to light theme (Tiza)
        fireEvent.click(btn);
        expect(document.body.getAttribute('data-theme')).toBe('light');

        // Click again to switch back to dark theme
        fireEvent.click(btn);
        expect(document.body.getAttribute('data-theme')).toBe('dark');
    });
});
