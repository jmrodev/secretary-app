import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Input from './Input';

describe('Input Atom', () => {
    it('renders text input correctly', () => {
        render(<Input placeholder="Nombre" value="Juan" onChange={() => {}} />);
        const input = screen.getByPlaceholderText('Nombre');
        expect(input).toBeInTheDocument();
        expect(input.value).toBe('Juan');
    });

    it('handles typing and onChange events', () => {
        const handleInputChange = vi.fn();
        render(<Input placeholder="Email" onChange={handleInputChange} />);
        const input = screen.getByPlaceholderText('Email');
        fireEvent.change(input, { target: { value: 'test@clinic.com' } });
        expect(handleInputChange).toHaveBeenCalledTimes(1);
    });

    it('renders textarea when type="textarea"', () => {
        render(<Input type="textarea" placeholder="Observaciones" rows={4} onChange={() => {}} />);
        const textarea = screen.getByPlaceholderText('Observaciones');
        expect(textarea.tagName).toBe('TEXTAREA');
        expect(textarea).toHaveAttribute('rows', '4');
    });

    it('handles disabled state correctly', () => {
        render(<Input placeholder="Bloqueado" disabled onChange={() => {}} />);
        const input = screen.getByPlaceholderText('Bloqueado');
        expect(input).toBeDisabled();
    });
});
