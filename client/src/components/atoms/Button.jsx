import React from 'react';
import { Link } from 'react-router-dom';
import './Button.css';

/**
 * Button Atom component.
 * Supports various variants, sizes, and navigation via 'to' prop.
 * Automatically styles as icon-only if no children are provided.
 */
const Button = ({
    children,
    onClick,
    to,
    type = 'button',
    variant = 'primary', // primary, secondary, success, danger, outline-danger, accent, warning, info, link, ghost, status
    size = 'md', // sm, sm-compact, md, lg
    disabled = false,
    className = '',
    title = '',
    tooltip = null,
    icon = null,
    iconRight = null,
    active = false,
    unstyled = false,
    outline = false,
    target = '_self',
    rel = 'noopener noreferrer',
    ...rest
}) => {
    const baseClass = 'btn';

    // Construct BEM classes
    const variantClass = variant ? `${baseClass}--${variant}` : '';
    const sizeClass = size && size !== 'md' ? `${baseClass}--${size}` : '';
    const activeClass = active ? `${baseClass}--active` : '';
    const iconOnlyClass = !children && icon ? `${baseClass}--icon-only` : '';

    const combinedClassName = unstyled
        ? className
        : `
            ${baseClass} 
            ${variantClass} 
            ${sizeClass} 
            ${activeClass}
            ${iconOnlyClass}
            ${className}
        `.trim().replace(/\s+/g, ' ');

    const content = (
        <>
            {icon && <span className="btn__icon">{icon}</span>}
            {children && <span className="btn__content">{children}</span>}
            {iconRight && <span className="btn__icon">{iconRight}</span>}
        </>
    );

    // If 'to' prop is provided and it's an external link or a protocol
    const isExternal = to && (to.startsWith('http') || to.startsWith('tel:') || to.startsWith('mailto:') || to.startsWith('whatsapp:'));

    if (to && !isExternal) {
        return (
            <Link
                to={to}
                className={combinedClassName}
                title={title}
                data-tooltip={tooltip}
                onClick={onClick}
                {...rest}
            >
                {content}
            </Link>
        );
    }

    if (to && isExternal) {
        return (
            <a
                href={to}
                className={combinedClassName}
                title={title}
                data-tooltip={tooltip}
                target={target}
                rel={rel}
                onClick={onClick}
                {...rest}
            >
                {content}
            </a>
        );
    }

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={combinedClassName}
            title={title}
            data-tooltip={tooltip}
            {...rest}
        >
            {content}
        </button>
    );
};

export default Button;
