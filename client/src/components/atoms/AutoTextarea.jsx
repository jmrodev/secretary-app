import React, { useEffect, useRef } from 'react';
import './AutoTextarea.css';

/**
 * AutoTextarea Atom follows Atomic Design & BEM.
 * Automatically adjusts height based on content.
 * Reuses standard input styles from design system.
 */
const AutoTextarea = ({
    value,
    className = '',
    size = 'md',
    variant = 'default',
    ...props
}) => {
    const textareaRef = useRef(null);

    const baseClass = 'input';
    const typeClass = `${baseClass}--textarea`;
    const autoHeightClass = `${baseClass}--auto-height`;
    const variantClass = variant !== 'default' ? `${baseClass}--${variant}` : '';
    const sizeClass = size !== 'md' ? `${baseClass}--${size}` : '';

    const combinedClassName = `${baseClass} ${typeClass} ${autoHeightClass} ${variantClass} ${sizeClass} ${className}`.trim();

    const adjustHeight = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto';
        const nextHeight = el.scrollHeight;
        el.style.height = `${nextHeight}px`;
    };

    useEffect(() => {
        adjustHeight();
    }, [value]);

    return (
        <textarea
            {...props}
            ref={textareaRef}
            value={value}
            onInput={adjustHeight}
            className={combinedClassName}
        />
    );
};

export default AutoTextarea;
