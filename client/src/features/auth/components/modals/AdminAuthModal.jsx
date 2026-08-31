import React, { useState } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * AdminAuthModal Feature Molecule.
 * Security barrier that requires administrator credentials for restricted actions.
 * Vital for protecting sensitive administrative operations within the auth domain.
 */
import styles from './AdminAuthModal.module.css';

export const AdminAuthModal = ({ isOpen, onClose, onConfirm }) => {
    const { t } = useLanguage();
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
                <div className={`${styles.AdminAuthModal__title}`}>
                    <Icon name="lock" size="1.2rem" />
                    {t('admin_auth_title')}
                </div>
            }
        >
            <form onSubmit={handleSubmit} className={`${styles.AdminAuthModal__body}`}>
                <p className={`${styles.AdminAuthModal__instruction}`}>
                    <Icon name="warning" size="1.1rem" color="var(--warning)" className="inline-icon" />
                    {t('admin_auth_instruction')}
                </p>
                <div className={`${styles.AdminAuthModal__inputGroup}`}>
                    <label htmlFor="admin-master-password" className={`${styles.AdminAuthModal__label}`}>
                        {t('master_password')}
                    </label>
                    <Input
                        id="admin-master-password"
                        type="password"
                        className={styles.AdminAuthModal__passwordInput}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        ref={inputRef}
                    />
                </div>
                <div className={`${styles.AdminAuthModal__footer}`}>
                    <Button
                        type="button" 
                        variant="ghost"
                        onClick={onClose}
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
        </Modal>
    );
};
