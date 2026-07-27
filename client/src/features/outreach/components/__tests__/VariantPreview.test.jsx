import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VariantPreview } from '../VariantPreview';

describe('VariantPreview', () => {
    const mockVariants = [
        { header: 'Hola Juan!', body: 'Your appointment is tomorrow', footer: 'Saludos' },
        { header: 'Estimado/a Juan', body: 'Your appointment is tomorrow', footer: 'Atentamente' },
        { header: 'Juan, te recordamos', body: 'Your appointment is tomorrow', footer: 'Gracias' }
    ];

    const defaultProps = {
        variants: mockVariants,
        patients: [{ id: 1 }, { id: 2 }, { id: 3 }],
        onSend: vi.fn(),
        sending: false,
        sendResult: null
    };

    it('should show preview header', () => {
        render(<VariantPreview {...defaultProps} />);
        expect(screen.getByText('outreach_step_3')).toBeInTheDocument();
    });

    it('should render 3 variant cards', () => {
        render(<VariantPreview {...defaultProps} />);
        const cards = screen.getAllByRole('article');
        expect(cards).toHaveLength(3);
    });

    it('should display variant header in each card', () => {
        render(<VariantPreview {...defaultProps} />);
        expect(screen.getByText('Hola Juan!')).toBeInTheDocument();
        expect(screen.getByText('Estimado/a Juan')).toBeInTheDocument();
        expect(screen.getByText('Juan, te recordamos')).toBeInTheDocument();
    });

    it('should display variant body in each card', () => {
        render(<VariantPreview {...defaultProps} />);
        const bodyEls = screen.getAllByText('Your appointment is tomorrow');
        expect(bodyEls).toHaveLength(3);
    });

    it('should display variant footer in each card', () => {
        render(<VariantPreview {...defaultProps} />);
        expect(screen.getByText('Saludos')).toBeInTheDocument();
        expect(screen.getByText('Atentamente')).toBeInTheDocument();
        expect(screen.getByText('Gracias')).toBeInTheDocument();
    });

    it('should show send button with patient count', () => {
        render(<VariantPreview {...defaultProps} />);
        expect(screen.getByText('outreach_variant_send')).toBeInTheDocument();
    });

    it('should call onSend when send button is clicked', () => {
        const onSend = vi.fn();
        render(<VariantPreview {...defaultProps} onSend={onSend} />);

        fireEvent.click(screen.getByRole('button'));
        expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('should show sending state on button', () => {
        render(<VariantPreview {...defaultProps} sending={true} />);

        expect(screen.getByText('outreach_variant_sending')).toBeInTheDocument();
    });

    it('should show send result when completed', () => {
        render(
            <VariantPreview
                {...defaultProps}
                sendResult={{ total_sent: 3, total_failed: 0 }}
            />
        );

        expect(screen.getByText('outreach_variant_sent')).toBeInTheDocument();
        expect(screen.getByText('outreach_variant_sent_detail')).toBeInTheDocument();
    });

    it('should show empty state when no variants', () => {
        render(
            <VariantPreview
                {...defaultProps}
                variants={[]}
            />
        );

        expect(screen.getByText('outreach_variant_preview_header')).toBeInTheDocument();
    });

    it('should show no patients message when patients array is empty', () => {
        render(
            <VariantPreview
                {...defaultProps}
                patients={[]}
            />
        );

        expect(screen.getByText('outreach_variant_no_patients')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should not render send button when there are no variants', () => {
        render(
            <VariantPreview
                {...defaultProps}
                variants={[]}
            />
        );

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
