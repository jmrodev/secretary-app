import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MessageComposer } from '../MessageComposer';

describe('MessageComposer', () => {
    const defaultProps = {
        body: '',
        onBodyChange: vi.fn(),
        onGenerateVariants: vi.fn(),
        hasVariants: false,
        showEmptyError: false
    };

    const getGenerateBtn = () => screen.getByRole('button');

    it('should render textarea with placeholder', () => {
        render(<MessageComposer {...defaultProps} />);
        const textarea = screen.getByPlaceholderText('outreach_composer_placeholder');
        expect(textarea).toBeInTheDocument();
    });

    it('should show character count', () => {
        render(<MessageComposer {...defaultProps} body="Hello" />);
        expect(screen.getByText('outreach_composer_char_count')).toBeInTheDocument();
    });

    it('should call onBodyChange when typing', () => {
        const onBodyChange = vi.fn();
        render(<MessageComposer {...defaultProps} onBodyChange={onBodyChange} />);

        const textarea = screen.getByPlaceholderText('outreach_composer_placeholder');
        fireEvent.change(textarea, { target: { value: 'Your appointment is tomorrow' } });
        expect(onBodyChange).toHaveBeenCalledWith('Your appointment is tomorrow');
    });

    it('should show generate button when no variants exist', () => {
        render(<MessageComposer {...defaultProps} body="Hello" />);

        expect(getGenerateBtn()).toBeInTheDocument();
    });

    it('should show regenerate button when variants exist', () => {
        render(<MessageComposer {...defaultProps} body="Hello" hasVariants={true} />);

        expect(getGenerateBtn()).toBeInTheDocument();
    });

    it('should call onGenerateVariants when generate button is clicked', () => {
        const onGenerateVariants = vi.fn();
        render(
            <MessageComposer
                {...defaultProps}
                body="Your appointment is tomorrow"
                onGenerateVariants={onGenerateVariants}
            />
        );

        fireEvent.click(getGenerateBtn());
        expect(onGenerateVariants).toHaveBeenCalledTimes(1);
    });

    it('should show error when showEmptyError is true', () => {
        render(
            <MessageComposer
                {...defaultProps}
                body=""
                showEmptyError={true}
            />
        );

        expect(screen.getByText('outreach_composer_empty_error')).toBeInTheDocument();
    });

    it('should disable generate button when body is empty', () => {
        render(<MessageComposer {...defaultProps} body="" />);

        expect(getGenerateBtn()).toBeDisabled();
    });

    it('should enable generate button when body is not empty', () => {
        render(<MessageComposer {...defaultProps} body="Hello" />);

        expect(getGenerateBtn()).not.toBeDisabled();
    });

    it('should show helper text with patient name hint', () => {
        render(<MessageComposer {...defaultProps} />);

        expect(screen.getByText('outreach_composer_hint')).toBeInTheDocument();
    });
});
