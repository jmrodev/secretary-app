import React, { useState, useEffect } from 'react';
import { useUsers } from '@/features/users/hooks/useUsers';
import { useLanguage } from '@/hooks/useLanguage';

// Atoms & Molecules
import Button from '@/components/atoms/Button';
import Card from '@/components/atoms/Card';
import Icon from '@/components/atoms/Icon';
import Modal from '@/components/molecules/Modal';

// Feature Components
import UserTable from '@/features/users/components/UserTable';
import UserForm from '@/features/users/components/UserForm';

const EMPTY_EXCLUDE = [];

const UserManagement = ({ excludeRoles = EMPTY_EXCLUDE, role = null }) => {
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

    const [searchTerm, setSearchTerm] = useState('');
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
            initialData = { username: '', password: '', role: role || 'doctor', full_name: '', dni: '', phoneNumbers: [{ phone_number: '+549', label: 'Celular', is_primary: true }], specialty: '' };
        } else if (type === 'EDIT') {
            initialData = {
                username: u.username,
                role: u.role,
                full_name: u.full_name || '',
                dni: u.dni || '',
                phoneNumbers: u.phoneNumbers || (u.phone ? [{ phone_number: u.phone, is_primary: true, label: 'Celular' }] : []),
                specialty: u.specialty || ''
            };
        } else if (type === 'DELETE') {
            initialData = { username: u.username, securityCode: '' };
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

        if (type === 'CREATE') await createUser(formData, refresh);
        else if (type === 'EDIT') await updateUser(user.id, formData, refresh);
        else if (type === 'DELETE') await deleteUser(user.id, user.full_name, { securityCode: formData.securityCode, onSuccess: refresh });
        else if (type === 'RESET_DNI' || type === 'RESET_MANUAL') await resetPassword(user.id, formData.password, close);
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className={`${styles.userManagementOrganism}`}>
            <section className="action-bar">
                <div className="action-bar__search">
                    <div className="search-box__wrapper">
                        <span className="search-box__icon"><Icon name="search" /></span>
                        <input
                            type="text"
                            placeholder={t('search_users_placeholder')}
                            className="search-box__input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="action-bar__tools">
                    <Button variant="ghost" onClick={loadData} icon={<Icon name="sync" />} />
                    <Button variant="primary" onClick={() => openModal('CREATE')}>
                        <Icon name="auto_awesome" size="1rem" /> {t('new') || 'Nuevo'}
                    </Button>
                </div>
            </section>

            <Card className={`${styles.tableContainer}`}>
                {loading ? (
                    <div className={`${styles.loader}`}>{t('loading_users')}</div>
                ) : (
                    <UserTable
                        users={filteredUsers}
                        onEdit={(u) => openModal('EDIT', u)}
                        onReset={(u) => openModal('RESET', u)}
                        onDelete={(u) => openModal('DELETE', u)}
                    />
                )}
            </Card>

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
                    setFormData={(data) => setModalState(prev => ({ ...prev, formData: data }))}
                />
            </Modal>
        </div>
    );
};

export default UserManagement;
