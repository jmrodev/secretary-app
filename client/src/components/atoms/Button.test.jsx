import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Atom', () => {
    it('renders label children correctly', () => {
        render(<Button>Guardar</Button>);
        expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    });

    it('triggers onClick handler when clicked', () => {
        const handleClick = vi.fn();
        render(<Button onClick={handleClick}>Acción</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onClick when disabled', () => {
        const handleClick = vi.fn();
        render(<Button disabled onClick={handleClick}>Deshabilitado</Button>);
        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        fireEvent.click(btn);
        expect(handleClick).not.toHaveBeenCalled();
    });

    it('displays loading state and prevents click', () => {
        const handleClick = vi.fn();
        render(<Button loading onClick={handleClick}>Cargando</Button>);
        const btn = screen.getByRole('button');
        expect(btn).toHaveClass(/loading/);
        fireEvent.click(btn);
        expect(handleClick).not.toHaveBeenCalled();
    });
});
