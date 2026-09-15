import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SearchBar } from './SearchBar';

describe('SearchBar Molecule', () => {
    it('renders input with placeholder', () => {
        render(<SearchBar value="" onChange={vi.fn()} placeholder="Buscar pacientes..." />);
        const input = screen.getByRole('searchbox');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('placeholder', 'Buscar pacientes...');
    });

    it('calls onChange when user types', () => {
        const handleSearchInputChange = vi.fn();
        render(<SearchBar value="" onChange={handleSearchInputChange} />);
        const input = screen.getByRole('searchbox');
        fireEvent.change(input, { target: { value: 'Gomez' } });
        expect(handleSearchInputChange).toHaveBeenCalled();
    });

    it('shows clear button only when value is present and triggers onClear', () => {
        const handleClearSearch = vi.fn();
        const { rerender } = render(<SearchBar value="" onChange={vi.fn()} onClear={handleClearSearch} />);
        
        expect(screen.queryByRole('button', { name: /clear/i })).not.toBeInTheDocument();

        rerender(<SearchBar value="Gomez" onChange={vi.fn()} onClear={handleClearSearch} />);
        const clearBtn = screen.getByRole('button', { name: /clear/i });
        expect(clearBtn).toBeInTheDocument();

        fireEvent.click(clearBtn);
        expect(handleClearSearch).toHaveBeenCalledTimes(1);
    });

    it('triggers onKeyDown on Enter press', () => {
        const handleSearchKeyDown = vi.fn();
        render(<SearchBar value="Perez" onChange={vi.fn()} onKeyDown={handleSearchKeyDown} />);
        const input = screen.getByRole('searchbox');

        fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
        expect(handleSearchKeyDown).toHaveBeenCalledTimes(1);
    });

    it('renders suggestions dropdown and handles selection', () => {
        const handleSelectPatientSuggestion = vi.fn();
        const suggestions = [
            { id: 1, type: 'patient', label: 'Carlos Perez', sublabel: 'DNI: 12345678' }
        ];

        render(
            <SearchBar
                value=""
                onChange={vi.fn()}
                suggestions={suggestions}
                showSuggestions={true}
                onSelect={handleSelectPatientSuggestion}
            />
        );

        expect(screen.getByText('Carlos Perez')).toBeInTheDocument();
        expect(screen.getByText('DNI: 12345678')).toBeInTheDocument();

        fireEvent.click(screen.getByText('Carlos Perez'));
        expect(handleSelectPatientSuggestion).toHaveBeenCalledWith(suggestions[0]);
    });
});
