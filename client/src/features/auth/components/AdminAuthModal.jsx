import React, { useState } from 'react';
import Modal from '@/components/molecules/Modal';
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
        </Modal>
    );
};

export default AdminAuthModal;
