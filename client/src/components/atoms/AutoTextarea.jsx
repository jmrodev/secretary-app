import React, { useEffect, useRef } from 'react';

const AutoTextarea = ({ value, style, ...props }) => {
    const textareaRef = useRef(null);

    const adjustHeight = () => {
        const el = textareaRef.current;
        if (!el) return;
        el.style.height = 'auto'; // Reset to force re-calc
        el.style.height = el.scrollHeight + 'px';
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
            style={{ ...style, overflow: 'hidden', resize: 'none' }}
        />
    );
};

export default AutoTextarea;
