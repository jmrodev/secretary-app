import React, { useState } from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

/**
 * AdminAuthModal Feature Molecule.
 * Security barrier that requires administrator credentials for restricted actions.
 * Vital for protecting sensitive administrative operations within the auth domain.
 */
const AdminAuthModal = ({ isOpen, onClose, onConfirm }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(password);
        setPassword('');
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2 text-accent font-bold">
                    <Icon name="lock" size="1.2rem" />
                    Autorización de Administrador
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="p-2">
                <p className="mb-6 text-sm text-gray-600 leading-relaxed italic">
                    <Icon name="warning" size="1.1rem" color="var(--warning)" className="inline mr-1" />
                    Esta acción está restringida por seguridad. Por favor, ingrese la contraseña maestra de administrador para continuar con el proceso.
                </p>
                <div className="input-group mb-8">
                    <input
                        type="password"
                        className="input-field border-gray-200 focus:border-accent text-center tracking-[0.5em] text-lg font-bold"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                    <Button
                        type="button" 
                        className="btn btn-ghost text-gray-400 hover:text-gray-600 font-bold uppercase tracking-widest text-[10px]" 
                        onClick={onClose}
                        unstyled
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit" 
                        className="btn btn-primary shadow-lg shadow-accent/20 px-8 font-bold uppercase tracking-widest text-[10px]" 
                        disabled={!password}
                        unstyled
                    >
                        Confirmar Acción
                    </Button>
                </div>
            </form>
        </Modal>
    );
};

export default AdminAuthModal;
