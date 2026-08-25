import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConfigToggle } from './ConfigToggle';

describe('ConfigToggle', () => {
    it('renders label and description correctly', () => {
        render(
            <ConfigToggle
                id="test-toggle"
                label="Enable Feature"
                description="Turn on the awesome feature"
                checked={false}
                onChange={vi.fn()}
            />
        );

        const label = screen.getByText('Enable Feature');
        expect(label).toBeInTheDocument();
        expect(label).toHaveAttribute('for', 'test-toggle');

        expect(screen.getByText('Turn on the awesome feature')).toBeInTheDocument();
    });

    it('triggers onChange with updated boolean value when toggled', () => {
        const handleToggleOption = vi.fn();
        render(
            <ConfigToggle
                id="test-toggle"
                label="Enable Feature"
                checked={false}
                onChange={handleToggleOption}
            />
        );

        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).not.toBeChecked();

        fireEvent.click(checkbox);
        expect(handleToggleOption).toHaveBeenCalledWith(true);
    });

    it('renders correctly when checked is true', () => {
        render(
            <ConfigToggle
                id="test-toggle"
                label="Enable Feature"
                checked={true}
                onChange={vi.fn()}
            />
        );

        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeChecked();
    });

    it('respects disabled state and applies disabled modifier class', () => {
        const { container } = render(
            <ConfigToggle
                id="test-toggle"
                label="Disabled Toggle"
                checked={false}
                onChange={vi.fn()}
                disabled
            />
        );

        const checkbox = screen.getByRole('checkbox');
        expect(checkbox).toBeDisabled();

        const rootElement = container.firstChild;
        expect(rootElement.className).toMatch(/ConfigToggle--disabled/);
    });
});
