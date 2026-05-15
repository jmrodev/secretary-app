import React, { useState } from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

/**
 * AdminAuthModal Feature Molecule.
 * Security barrier that requires administrator credentials for restricted actions.
 * Vital for protecting sensitive administrative operations within the auth domain.
 */
import './AdminAuthModal.css';

const AdminAuthModal = ({ isOpen, onClose, onConfirm }) => {
    const [password, setPassword] = useState('');
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        onConfirm(password);
        setPassword('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="admin-auth__title">
                    <Icon name="lock" size="1.2rem" />
                    Autorización de Administrador
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="admin-auth__body">
                <p className="admin-auth__instruction">
                    <Icon name="warning" size="1.1rem" color="var(--warning)" className="inline-icon" />
                    Esta acción está restringida por seguridad. Por favor, ingrese la contraseña maestra de administrador para continuar con el proceso.
                </p>
                <div className="admin-auth__input-group">
                    <input
                        type="password"
                        className="input-field admin-auth__password-input"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        ref={inputRef}
                    />
                </div>
                <div className="admin-auth__footer">
                    <Button
                        type="button" 
                        variant="ghost"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit" 
                        variant="primary"
                        disabled={!password}
                    >
                        Confirmar Acción
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AdminAuthModal;
