import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';
import { useLanguage } from '@/context/LanguageContext';

// Atoms & Molecules
import Button from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Card from '@/components/atoms/Card';
import Modal from '@/components/molecules/Modal';

// Feature Components
import UserTable from './UserTable';
import UserForm from './UserForm';
import './UserManagement.css';

const UserManagement = ({ excludeRoles = [], role = null }) => {
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
        <div className="user-management-organism">
            <section className="action-bar">
                <Input
                    placeholder={t('search_users_placeholder')}
                    icon="SEARCH"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="user-management__search-input"
                />
                <div className="action-bar__tools">
                    <Button variant="ghost" onClick={loadData} icon="SYNC" />
                    <Button variant="primary" onClick={() => openModal('CREATE')} icon="ADD">
                        {t('new') || 'Nuevo'}
                    </Button>
                </div>
            </section>

            <Card className="user-management__table-container">
                {loading ? (
                    <div className="user-management__loader">{t('loading_users')}</div>
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
