import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Badge from './Badge';

describe('Badge Atom', () => {
    it('renders text badge content', () => {
        render(<Badge variant="success">Confirmado</Badge>);
        expect(screen.getByText('Confirmado')).toBeInTheDocument();
    });

    it('renders notification counter mode', () => {
        render(<Badge count={5} />);
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('caps notification counter at 99+', () => {
        render(<Badge count={150} />);
        expect(screen.getByText('99+')).toBeInTheDocument();
    });

    it('triggers onClick when interactive', () => {
        const handleBadgeClick = vi.fn();
        render(<Badge onClick={handleBadgeClick}>Filtrar</Badge>);
        const btn = screen.getByRole('button');
        fireEvent.click(btn);
        expect(handleBadgeClick).toHaveBeenCalledTimes(1);
    });
});
