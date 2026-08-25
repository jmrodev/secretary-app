import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigField } from './ConfigField';

describe('ConfigField', () => {
    it('renders label linked to input and displays placeholder', () => {
        render(
            <ConfigField
                id="test-field"
                label="Test Label"
                placeholder="Enter value..."
            />
        );

        const label = screen.getByText('Test Label');
        expect(label).toBeInTheDocument();
        expect(label).toHaveAttribute('for', 'test-field');

        const input = screen.getByPlaceholderText('Enter value...');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('id', 'test-field');
    });

    it('triggers onChange when value changes', () => {
        const handleFieldValueChange = vi.fn();
        render(
            <ConfigField
                id="test-field"
                label="Field Label"
                value="Initial"
                onChange={handleFieldValueChange}
            />
        );

        const input = screen.getByDisplayValue('Initial');
        fireEvent.change(input, { target: { value: 'New Value' } });

        expect(handleFieldValueChange).toHaveBeenCalledTimes(1);
    });

    it('renders hint text when provided', () => {
        render(
            <ConfigField
                id="test-field"
                label="Field Label"
                hint="This is a helpful hint"
            />
        );

        expect(screen.getByText('This is a helpful hint')).toBeInTheDocument();
    });

    it('applies monospace variant class when variant="monospace"', () => {
        const { container } = render(
            <ConfigField
                id="test-mono"
                label="Monospace Field"
                variant="monospace"
            />
        );

        const rootElement = container.firstChild;
        expect(rootElement.className).toMatch(/ConfigField--monospace/);
    });

    it('renders select component when type="select"', () => {
        const handleSelectOption = vi.fn();
        const options = [
            { value: 'opt1', label: 'Option 1' },
            { value: 'opt2', label: 'Option 2' }
        ];

        render(
            <ConfigField
                id="test-select"
                label="Select Field"
                type="select"
                value="opt1"
                options={options}
                onChange={handleSelectOption}
            />
        );

        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
        fireEvent.change(select, { target: { value: 'opt2' } });
        expect(handleSelectOption).toHaveBeenCalledTimes(1);
    });

    it('respects disabled state', () => {
        render(
            <ConfigField
                id="test-disabled"
                label="Disabled Field"
                disabled
            />
        );

        const input = screen.getByRole('textbox');
        expect(input).toBeDisabled();
    });
});
