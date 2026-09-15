import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BehaviorRatingModal } from '../BehaviorRatingModal';

describe('BehaviorRatingModal', () => {
    const mockT = (k) => k;
    const mockPatient = {
        id: 42,
        first_name: 'Ana',
        last_name: 'Gomez',
        behavior_rating: 4,
        behavior_rating_note: 'Llega siempre a horario, excelente predisposición'
    };

    it('does not render when isOpen is false', () => {
        const { container } = render(
            <BehaviorRatingModal
                isOpen={false}
                patient={mockPatient}
                onClose={vi.fn()}
                onSave={vi.fn()}
                t={mockT}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('renders modal with patient details, initial stars, and note', () => {
        render(
            <BehaviorRatingModal
                isOpen={true}
                patient={mockPatient}
                onClose={vi.fn()}
                onSave={vi.fn()}
                t={mockT}
            />
        );

        expect(screen.getByText(/edit_behavior_rating/i)).toBeInTheDocument();
        expect(screen.getByText('GOMEZ Ana')).toBeInTheDocument();
        expect(screen.getByText('4 / 5')).toBeInTheDocument();

        const textarea = screen.getByPlaceholderText(/behavior_rating_note_placeholder/i);
        expect(textarea).toHaveValue('Llega siempre a horario, excelente predisposición');
    });

    it('allows changing star rating and entering note, then calls onSave', async () => {
        const onSaveMock = vi.fn().mockResolvedValue();
        render(
            <BehaviorRatingModal
                isOpen={true}
                patient={mockPatient}
                onClose={vi.fn()}
                onSave={onSaveMock}
                t={mockT}
            />
        );

        // Click star 2
        const star2 = screen.getByRole('radio', { name: '2 / 5' });
        fireEvent.click(star2);
        expect(screen.getByText('2 / 5')).toBeInTheDocument();

        // Update note
        const textarea = screen.getByPlaceholderText(/behavior_rating_note_placeholder/i);
        fireEvent.change(textarea, { target: { value: 'Nueva nota explicativa' } });
        expect(textarea).toHaveValue('Nueva nota explicativa');

        // Click save button
        const saveButton = screen.getByRole('button', { name: /save_rating/i });
        fireEvent.click(saveButton);

        expect(onSaveMock).toHaveBeenCalledWith(42, 2, 'Nueva nota explicativa');
    });

    it('calls onClose when cancel button is clicked', () => {
        const onCloseMock = vi.fn();
        render(
            <BehaviorRatingModal
                isOpen={true}
                patient={mockPatient}
                onClose={onCloseMock}
                onSave={vi.fn()}
                t={mockT}
            />
        );

        const cancelButton = screen.getByRole('button', { name: /cancel/i });
        fireEvent.click(cancelButton);

        expect(onCloseMock).toHaveBeenCalledTimes(1);
    });

    it('displays derived calculation from financial and attendance ratings', () => {
        const patientWithScores = {
            ...mockPatient,
            financial_rating: 4,
            attendance_rating: 2
        };
        render(
            <BehaviorRatingModal
                isOpen={true}
                patient={patientWithScores}
                onClose={vi.fn()}
                onSave={vi.fn()}
                t={mockT}
            />
        );

        // (4 + 2) / 2 = 3
        expect(screen.getByText(/3 \/ 5 ★/i)).toBeInTheDocument();
    });

    it('prevents saving when note is empty and shows validation message', async () => {
        const onSaveMock = vi.fn();
        render(
            <BehaviorRatingModal
                isOpen={true}
                patient={{ ...mockPatient, behavior_rating_note: '' }}
                onClose={vi.fn()}
                onSave={onSaveMock}
                t={mockT}
            />
        );

        const saveButton = screen.getByRole('button', { name: /save_rating/i });
        fireEvent.click(saveButton);

        expect(screen.getByText(/behavior_rating_note_required_warning/i)).toBeInTheDocument();
        expect(onSaveMock).not.toHaveBeenCalled();
    });

    it('calls onSave with nulls when reset to auto button is clicked', async () => {
        const onSaveMock = vi.fn().mockResolvedValue();
        render(
            <BehaviorRatingModal
                isOpen={true}
                patient={mockPatient}
                onClose={vi.fn()}
                onSave={onSaveMock}
                t={mockT}
            />
        );

        const resetBtn = screen.getByRole('button', { name: /behavior_rating_reset_auto/i });
        fireEvent.click(resetBtn);

        expect(onSaveMock).toHaveBeenCalledWith(42, null, null);
    });
});
