import React, { useState } from 'react';
import Modal from './Modal';

const AdminAuthModal = ({ isOpen, onClose, onConfirm }) => {
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(password);
        setPassword('');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="🔒 Autorización de Administrador">
            <form onSubmit={handleSubmit}>
                <p className="mb-4 text-slate-600">
                    Esta acción está restringida. Por favor, ingrese la contraseña de administrador para continuar.
                </p>
                <div className="input-group">
                    <input
                        type="password"
                        className="input-field"
                        placeholder="Contraseña de Admin"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-2 mt-4">
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
                    <button type="submit" className="btn btn-primary" disabled={!password}>Confirmar</button>
                </div>
            </form>
        </Modal>
    );
};

export default AdminAuthModal;
