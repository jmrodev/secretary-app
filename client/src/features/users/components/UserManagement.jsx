import React, { useState } from 'react';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useAuth } from '@/features/auth';
import { useLanguage } from '@/hooks/useLanguage';
import { useModal } from '@/context/ModalContext';

// Atoms & Molecules
import { Button } from '@/components/atoms/Button';
import { Card } from '@/components/atoms/Card';
import { Icon } from '@/components/atoms/Icon';
import { Modal } from '@/components/molecules/Modal';

import { UserTable } from '@/features/users/components/UserTable';
import { UserForm } from '@/features/users/components/UserForm';
import { SecretaryPermissionsModal } from '@/features/users/components/SecretaryPermissionsModal';
import sharedStyles from '@/styles/shared.module.css';
import styles from './UserManagement.module.css';

const EMPTY_EXCLUDE = [];

export const UserManagement = ({ excludeRoles = EMPTY_EXCLUDE, role = null }) => {
    const { t } = useLanguage();
    const {
        users,
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        resetPassword,
        loading,
        isSubmitting
    } = useUsers({ role, excludeRoles });
    
    const { user: currentUser } = useAuth();
    
    const { prompt } = useModal();

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSecretaryForPerms, setSelectedSecretaryForPerms] = useState(null);
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null,
        user: null,
        formData: {}
    });

    const loadData = () => fetchUsers();

    // Handlers
    const openModal = (type, u = null) => {
        let initialData = {};
        if (type === 'CREATE') {
            initialData = { username: '', password: '', role: role || 'doctor', first_name: '', last_name: '', email: '', address: '', dni: '', phoneNumbers: [{ phone_number: '+549', label: 'Celular', is_primary: true }], specialty: '', adminPassword: '' };
        } else if (type === 'EDIT') {
            initialData = {
                username: u.username,
                role: u.role,
                first_name: u.first_name || '',
                last_name: u.last_name || '',
                email: u.email || '',
                address: u.address || '',
                full_name: u.full_name || '',
                dni: u.dni || '',
                phoneNumbers: u.phoneNumbers || (u.phone ? [{ phone_number: u.phone, is_primary: true, label: 'Celular' }] : []),
                specialty: u.specialty || ''
            };
        } else if (type === 'DELETE') {
            initialData = { username: u.username, adminPassword: '' };
        } else if (type === 'RESET') {
            initialData = { username: u.username, dni: u.dni, password: u.dni || '' };
        }

        setModalState({
            isOpen: true,
            type: type === 'RESET' ? (u.dni ? 'RESET_DNI' : 'RESET_MANUAL') : type,
            user: u,
            formData: initialData
        });
    };

    const handleConfirm = async () => {
        const { type, user, formData } = modalState;
        const close = () => setModalState(prev => ({ ...prev, isOpen: false }));
        const refresh = () => { loadData(); close(); };

        if (type === 'CREATE') {
            const adminPassword = await prompt(t('enter_your_password'), '', t('confirm_action'), 'password');
            if (!adminPassword) return;
            await createUser({ ...formData, adminPassword }, refresh);
        }
        else if (type === 'EDIT') await updateUser(user.id, formData, refresh);
        else if (type === 'DELETE') {
            const adminPassword = await prompt(t('enter_your_password'), '', t('confirm_action'), 'password');
            if (!adminPassword) return;
            await deleteUser(user.id, user.full_name, { adminPassword, onSuccess: refresh });
        }
        else if (type === 'RESET_DNI' || type === 'RESET_MANUAL') await resetPassword(user.id, formData.password, close);
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`${styles.UserManagement__userManagementOrganism}`}>
            <section className={sharedStyles.ActionBar}>
                <div className={sharedStyles.ActionBar__search}>
                    <div className={sharedStyles.SearchBox__wrapper}>
                        <span className={sharedStyles.SearchBox__icon}><Icon name="search" /></span>
                        <input
                            type="text"
                            placeholder={t('search_users_placeholder')}
                            className={sharedStyles.SearchBox__input}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className={sharedStyles.ActionBar__tools}>
                    <Button 
                        variant="primary" 
                        onClick={() => openModal('CREATE')}
                        icon={<Icon name="add" size="1.1rem" />}
                    >
                        {t('add_user')}
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={loadData}
                        icon={<Icon name="sync" size="1.1rem" />}
                    >
                        {t('refresh')}
                    </Button>
                </div>
            </section>

            <Card className={`${styles.UserManagement__tableContainer}`}>
                {loading ? (
                    <div className={`${styles.UserManagement__loader}`}>{t('loading_users')}</div>
                ) : (
                    <UserTable
                        users={filteredUsers}
                        currentUser={currentUser}
                        onEdit={(u) => openModal('EDIT', u)}
                        onReset={(u) => openModal('RESET', u)}
                        onDelete={(u) => openModal('DELETE', u)}
                        onOpenPermissions={(u) => setSelectedSecretaryForPerms(u)}
                    />
                )}
            </Card>

            <SecretaryPermissionsModal
                isOpen={Boolean(selectedSecretaryForPerms)}
                onClose={() => setSelectedSecretaryForPerms(null)}
                secretary={selectedSecretaryForPerms}
                onSaveSuccess={loadData}
            />

            <Modal
                isOpen={modalState.isOpen}
                onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
                title={
                    modalState.type === 'CREATE' ? t('add_new_user') :
                        (modalState.type === 'EDIT' ? t('edit_user') :
                            (modalState.type === 'DELETE' ? t('delete_user') : t('reset_password')))
                }
                footer={
                    <>
                        <Button variant="secondary" onClick={() => setModalState(prev => ({ ...prev, isOpen: false }))} disabled={isSubmitting}>{t('cancel')}</Button>
                        <Button
                            onClick={handleConfirm}
                            variant={modalState.type === 'DELETE' ? 'danger' : 'primary'}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? t('sending') : t('confirm')}
                        </Button>
                    </>
                }
            >
                <UserForm
                    type={modalState.type}
                    formData={modalState.formData}
                    setFormData={(data) => setModalState(prev => ({ 
                        ...prev, 
                        formData: typeof data === 'function' ? data(prev.formData) : data 
                    }))}
                />
            </Modal>
        </div>
    );
};
