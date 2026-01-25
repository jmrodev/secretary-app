import React, { useState, useEffect } from 'react';
import { useUsers } from '../../hooks/useUsers';
import { useLanguage } from '../../context/LanguageContext';

// Atoms & Molecules
import Button from '../atoms/Button';
import Input from '../atoms/Input';
import Card from '../atoms/Card';
import Modal from '../molecules/Modal';

// Organisms
import UserTable from './UserTable';
import UserForm from './UserForm';

const UserManagement = ({ excludeRoles = [], role = null, title, subtitle }) => {
    const { t } = useLanguage();
    const {
        fetchUsers,
        createUser,
        updateUser,
        deleteUser,
        resetPassword,
        loading,
        isSubmitting
    } = useUsers();

    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null,
        user: null,
        formData: {}
    });

    const loadData = async () => {
        const data = await fetchUsers({ role, excludeRoles });
        setUsers(data);
    };

    useEffect(() => {
        loadData();
    }, [role, JSON.stringify(excludeRoles)]);

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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="title">{title}</h1>
                    <p className="text-muted">{subtitle}</p>
                </div>
                <Button onClick={() => openModal('CREATE')}>+ {t('add_user')}</Button>
            </div>

            <Card>
                <div className="mb-6">
                    <Input
                        placeholder={t('search_users_placeholder')}
                        className="max-w-[400px]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {loading ? (
                    <div className="py-12 text-center text-muted animate-pulse">{t('loading_users')}</div>
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
