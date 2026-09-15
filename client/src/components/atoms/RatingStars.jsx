import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import styles from './RatingStars.module.css';

/**
 * RatingStars Atom Component.
 * Renders a 5-star rating using icon glyphs.
 *
 * @param {number} rating - Score 0 to 5
 * @param {'gold'|'blue'|'pink'} colorClass - Color variant
 * @param {string} size - Size of star icons (default '13px')
 * @param {string} className - Optional container class
 */
export const RatingStars = ({
    rating = 5,
    colorClass = 'gold',
    size = '13px',
    className = ''
}) => {
    const numericRating = (rating !== null && rating !== undefined && !Number.isNaN(Number(rating)))
        ? Math.max(0, Math.min(5, Number(rating)))
        : 5;

    const colorModifier = styles[`RatingStars--${colorClass}`] || styles['RatingStars--gold'];

    return (
        <div
            className={`${styles.RatingStars__root} ${colorModifier} ${className}`}
            role="img"
            aria-label={`${numericRating} / 5`}
        >
            {[1, 2, 3, 4, 5].map(s => (
                <Icon
                    key={s}
                    name={s <= numericRating ? 'star' : 'star_outline'}
                    size={size}
                />
            ))}
        </div>
    );
};
