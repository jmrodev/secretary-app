import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button Atom', () => {
    it('renders label children correctly', () => {
        render(<Button>Guardar</Button>);
        expect(screen.getByRole('button', { name: /guardar/i })).toBeInTheDocument();
    });

    it('triggers onClick handler when clicked', () => {
        const handleButtonClick = vi.fn();
        render(<Button onClick={handleButtonClick}>Acción</Button>);
        fireEvent.click(screen.getByRole('button'));
        expect(handleButtonClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onClick when disabled', () => {
        const handleButtonClick = vi.fn();
        render(<Button disabled onClick={handleButtonClick}>Deshabilitado</Button>);
        const btn = screen.getByRole('button');
        expect(btn).toBeDisabled();
        fireEvent.click(btn);
        expect(handleButtonClick).not.toHaveBeenCalled();
    });

    it('displays loading state and prevents click', () => {
        const handleButtonClick = vi.fn();
        render(<Button loading onClick={handleButtonClick}>Cargando</Button>);
        const btn = screen.getByRole('button');
        expect(btn).toHaveClass(/loading/);
        fireEvent.click(btn);
        expect(handleButtonClick).not.toHaveBeenCalled();
    });
});
