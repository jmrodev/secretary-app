import React from 'react';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white',
                padding: '1.5rem',
                borderRadius: '8px',
                width: '90%',
                maxWidth: '500px',
                maxHeight: '90vh', // [NEW] Limit height
                display: 'flex', // [NEW] Flex layout
                flexDirection: 'column', // [NEW] Stack children
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <div style={{ marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{title}</h3>
                </div>

                <div style={{ marginBottom: '1.5rem', overflowY: 'auto', flex: 1 }}> {/* [NEW] Scrollable content */}
                    {children}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: 'auto' }}>
                    {footer}
                </div>
            </div>
        </div>
    );
};

export default Modal;
