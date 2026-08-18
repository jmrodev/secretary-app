import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FormGroup } from './FormGroup';
import { Input } from '@/components/atoms/Input';

describe('FormGroup Molecule', () => {
    it('renders label and input correctly', () => {
        render(
            <FormGroup label="Nombre del Paciente">
                <Input placeholder="Ingrese nombre" />
            </FormGroup>
        );
        expect(screen.getByText('Nombre del Paciente')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ingrese nombre')).toBeInTheDocument();
    });

    it('displays error message when provided', () => {
        render(
            <FormGroup label="Email" error="Email inválido">
                <Input placeholder="email@test.com" />
            </FormGroup>
        );
        expect(screen.getByText('Email inválido')).toBeInTheDocument();
    });
});
