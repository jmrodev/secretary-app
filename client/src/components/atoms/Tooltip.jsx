import React from 'react';
import Icon from './Icon';
import './Tooltip.css';

/**
 * Tooltip Atom.
 * Displays a help icon that shows text on hover.
 */
const Tooltip = ({ text, position = 'top' }) => {
    if (!text) return null;

    return (
        <div className={`tooltip tooltip--${position}`}>
            <Icon name="INFO" size="1.1rem" className="tooltip__icon" />
            <div className="tooltip__content">
                {text}
            </div>
        </div>
    );
};

export default Tooltip;
