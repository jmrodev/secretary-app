import React, { useState } from 'react';
import Modal from '@/components/molecules/Modal';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import { useLanguage } from '@/context/LanguageContext';
import './AdminAuthModal.css';

/**
 * AdminAuthModal Feature Molecule.
 * Security barrier that requires administrator credentials for restricted actions.
 */
const AdminAuthModal = ({ isOpen, onClose, onConfirm }) => {
    const { t } = useLanguage();
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        if (e) e.preventDefault();
        onConfirm(password);
        setPassword('');
    };

    const handleClose = () => {
        setPassword('');
        onClose();
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={handleClose}
            title={
                <div className="admin-auth__title">
                    <Icon name="lock" size="1.2rem" />
                    {t('admin_auth_title')}
                </div>
            }
        >
            <div className="admin-auth__body">
                <p className="admin-auth__instruction">
                    <Icon name="warning" size="1.1rem" color="var(--warning)" className="inline mr-1" />
                    {t('admin_auth_instruction')}
                </p>
<<<<<<< HEAD
                <form onSubmit={handleSubmit} className="admin-auth__form">
                    <div className="admin-auth__input-group">
                        <Input
                            type="password"
                            className="admin-auth__password-input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoFocus
                        />
                    </div>
                    <div className="admin-auth__footer">
                        <Button 
                            type="button" 
                            variant="ghost"
                            onClick={handleClose}
                        >
                            {t('cancel')}
                        </Button>
                        <Button 
                            type="submit" 
                            variant="primary"
                            disabled={!password}
                        >
                            {t('confirm_action')}
                        </Button>
                    </div>
                </form>
            </div>
=======
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
>>>>>>> main
        </Modal>
    );
};

export default AdminAuthModal;
