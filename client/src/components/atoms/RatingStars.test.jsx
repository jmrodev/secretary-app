import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RatingStars } from './RatingStars';

describe('RatingStars Atom', () => {
    it('renders with accessibility attributes', () => {
        render(<RatingStars rating={4} colorClass="gold" />);
        const el = screen.getByRole('img', { name: '4 / 5' });
        expect(el).toBeInTheDocument();
    });

    it('clamps rating between 0 and 5', () => {
        render(<RatingStars rating={10} colorClass="blue" />);
        expect(screen.getByRole('img', { name: '5 / 5' })).toBeInTheDocument();
    });

    it('defaults to 5 if rating is null or NaN', () => {
        render(<RatingStars rating={null} colorClass="pink" />);
        expect(screen.getByRole('img', { name: '5 / 5' })).toBeInTheDocument();
    });
});
