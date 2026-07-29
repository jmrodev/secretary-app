import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Modal from './Modal';

describe('Modal Molecule', () => {
    it('does not render when isOpen is false', () => {
        render(<Modal isOpen={false} title="Test Modal">Contenido</Modal>);
        expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    });

    it('renders title and children when isOpen is true', () => {
        render(<Modal isOpen={true} title="Nuevo Paciente">Formulario</Modal>);
        expect(screen.getByText('Nuevo Paciente')).toBeInTheDocument();
        expect(screen.getByText('Formulario')).toBeInTheDocument();
    });

    it('calls onClose when backdrop is clicked', () => {
        const handleClose = vi.fn();
        render(<Modal isOpen={true} title="Modal" onClose={handleClose}>Contenido</Modal>);
        const backdrop = screen.getByLabelText('Cerrar modal');
        fireEvent.click(backdrop);
        expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose when Escape key is pressed', () => {
        const handleClose = vi.fn();
        render(<Modal isOpen={true} title="Modal" onClose={handleClose}>Contenido</Modal>);
        fireEvent.keyDown(window, { key: 'Escape' });
        expect(handleClose).toHaveBeenCalledTimes(1);
    });
});
