import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import { useLanguage } from '../context/LanguageContext';
import Modal from '../components/Modal';
import Sidebar from '../components/Sidebar';
import PhoneNumbersManager from '../components/PhoneNumbersManager';

const AdminUsers = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { t } = useLanguage();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Unified Modal State: type = 'RESET_DNI' | 'RESET_MANUAL' | 'CREATE' | 'EDIT' | 'DELETE'
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null,
        user: null,
        formData: { username: '', password: '', role: 'patient', full_name: '', dni: '', phoneNumbers: [{ phone_number: '+549', label: 'Celular', is_primary: true }], specialty: '' }
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/admin/users');
            // Double check filtering on frontend
            setUsers(res.data.filter(u => u.role !== 'patient'));
        } catch (err) {
            console.error(err);
            showMessage('Error fetching users', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Modal Handlers ---

    const openCreateModal = () => {
        setModalState({
            isOpen: true,
            type: 'CREATE',
            user: null,
            formData: { username: '', password: '', role: 'patient', full_name: '', dni: '', phoneNumbers: [{ phone_number: '+549', label: 'Celular', is_primary: true }], specialty: '' }
        });
    };

    const openEditModal = (u) => {
        setModalState({
            isOpen: true,
            type: 'EDIT',
            user: u,
            formData: {
                username: u.username,
                password: '', // Password usually left blank on edit unless changing
                role: u.role,
                full_name: u.full_name || '',
                dni: u.dni || '',
                phoneNumbers: u.phoneNumbers || (u.phone ? [{ phone_number: u.phone, is_primary: true, label: 'Celular' }] : []),
                specialty: u.specialty || ''
            }
        });
    };

    const openDeleteModal = (u) => {
        setModalState({ isOpen: true, type: 'DELETE', user: u, formData: {} });
    };

    const openResetModal = (u) => {
        if (u.dni) {
            setModalState({ isOpen: true, type: 'RESET_DNI', user: u, formData: { password: u.dni } });
        } else {
            setModalState({ isOpen: true, type: 'RESET_MANUAL', user: u, formData: { password: '' } });
        }
    };

    const closeModal = () => {
        setModalState({ ...modalState, isOpen: false });
    };

    // --- Actions ---

    const handleCreate = async () => {
        try {
            const { formData } = modalState;
            // Backend expects 'fullName' for create, but 'full_name' for update. Map it here.
            const payload = { ...formData, fullName: formData.full_name };
            await api.post('/users/admin/users', payload);
            showMessage(t('user_created'), 'success');
            fetchUsers();
            closeModal();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data || t('failed_create_user'), 'error');
        }
    };

    const handleUpdate = async () => {
        try {
            const { user, formData } = modalState;
            await api.put(`/users/admin/users/${user.id}`, formData);
            showMessage(t('user_updated'), 'success');
            fetchUsers();
            closeModal();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data || t('failed_update_user'), 'error');
        }
    };

    const handleDelete = async () => {
        try {
            const { user, formData } = modalState;

            if (formData.securityCode !== '1234') {
                showMessage("Invalid Security Code", 'error');
                return;
            }

            await api.delete(`/users/admin/users/${user.id}`);
            showMessage(t('user_deleted'), 'success');
            fetchUsers();
            closeModal();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data || t('failed_delete_user'), 'error');
        }
    };

    const handleResetPassword = async () => {
        try {
            const { user, formData } = modalState;
            await api.post(`/users/admin/reset-password/${user.id}`, { newPassword: formData.password });
            showMessage(`${t('password_reset')} ${user.username}`, 'success');
            closeModal();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data || t('failed_reset_password'), 'error');
        }
    };

    // --- Render Helpers ---

    const renderModalContent = () => {
        const { type, user, formData } = modalState;
        const setFormData = (newData) => setModalState(prev => ({ ...prev, formData: { ...prev.formData, ...newData } }));

        if (type === 'DELETE') {
            return (
                <div>
                    <p>{t('delete_confirmation')} <strong>{user.username}</strong>? {t('action_cannot_undone')}</p>
                    <div className="mt-4">
                        <label className="input-label">Security Code (Safety)</label>
                        <input
                            className="input-field"
                            type="password"
                            placeholder="Enter 1234 to confirm"
                            value={formData.securityCode || ''}
                            onChange={e => setFormData({ securityCode: e.target.value })}
                        />
                    </div>
                </div>
            );
        }

        if (type === 'RESET_DNI') {
            return <p>{t('reset_dni_confirmation')} <strong>{user.username}</strong> {t('to_dni')} (<strong>{user.dni}</strong>)?</p>;
        }

        if (type === 'RESET_MANUAL') {
            return (
                <div>
                    <label className="input-label">{t('new_password')}</label>
                    <input className="input-field" value={formData.password} onChange={e => setFormData({ password: e.target.value })} />
                </div>
            );
        }

        // Create / Edit Form
        return (
            <div className="flex-col gap-4">
                <div className="grid-2-cols">
                    <div>
                        <label className="input-label">{t('username')}</label>
                        <input className="input-field" value={formData.username} onChange={e => setFormData({ username: e.target.value })} />
                    </div>
                    {type === 'CREATE' && (
                        <div>
                            <label className="input-label">{t('password')}</label>
                            <input className="input-field" type="password" value={formData.password} onChange={e => setFormData({ password: e.target.value })} />
                        </div>
                    )}
                </div>

                <div>
                    <label className="input-label">{t('role_header')}</label>
                    <select className="input-field" value={formData.role} onChange={e => setFormData({ role: e.target.value })}>
                        <option value="patient">{t('patient')}</option>
                        <option value="doctor">{t('doctor')}</option>
                        <option value="secretary">{t('secretary')}</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div>
                    <label className="input-label">{t('full_name')}</label>
                    <input className="input-field" value={formData.full_name} onChange={e => setFormData({ full_name: e.target.value })} />
                </div>

                <div>
                    <label className="input-label">{t('dni')}</label>
                    <input className="input-field" value={formData.dni} onChange={e => setFormData({ dni: e.target.value })} />
                </div>

                <div className="mb-4">
                    <PhoneNumbersManager
                        phoneNumbers={formData.phoneNumbers}
                        onChange={(newPhones) => setFormData({ phoneNumbers: newPhones })}
                    />
                </div>

                {formData.role === 'doctor' && (
                    <div>
                        <label className="input-label">{t('specialty')}</label>
                        <input className="input-field" value={formData.specialty} onChange={e => setFormData({ specialty: e.target.value })} />
                    </div>
                )}
            </div>
        );
    };

    const confirmAction = () => {
        const { type } = modalState;
        if (type === 'CREATE') handleCreate();
        if (type === 'EDIT') handleUpdate();
        if (type === 'DELETE') handleDelete();
        if (type === 'RESET_DNI' || type === 'RESET_MANUAL') handleResetPassword();
    };

    const filteredUsers = users.filter(u =>
        u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (u.full_name && u.full_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        u.role.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (user.role !== 'admin') return <div>Access Denied</div>;

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">
                <div className="flex-between-center mb-6">
                    <div>
                        <h1 className="title">{t('user_management')}</h1>
                        <p className="text-muted">{t('manage_users_subtitle')}</p>
                    </div>
                    <button className="btn btn-primary" onClick={openCreateModal}>{t('add_user')}</button>
                </div>

                <div className="card">
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder={t('search_users_placeholder')}
                            className="input-field max-w-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {loading ? <p>{t('loading_users')}</p> : (
                        <table className="transactions-table">
                            <thead>
                                <tr className="text-left bg-slate-50">
                                    <th className="p-3 border-b-2-slate">{t('user_header')}</th>
                                    <th className="p-3 border-b-2-slate">{t('role_header')}</th>
                                    <th className="p-3 border-b-2-slate">{t('name_contact_header')}</th>
                                    <th className="p-3 border-b-2-slate">{t('actions')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.id} className="border-b-divider">
                                        <td className="p-3">
                                            <div className="font-bold">{u.username}</div>
                                            <div className="text-xs-muted">DNI: {u.dni || '-'}</div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`badge-role ${u.role}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="p-3">
                                            <div>{u.full_name || '-'}</div>
                                            <div className="text-xs-muted flex items-center gap-2">
                                                {u.phoneNumbers && u.phoneNumbers.length > 0 ? (
                                                    <>
                                                        {u.phoneNumbers.find(p => p.is_primary)?.phone_number || u.phoneNumbers[0].phone_number}
                                                        {u.phoneNumbers.length > 1 && <span className="text-[10px] bg-blue-50 text-blue-500 px-1 rounded">+{u.phoneNumbers.length - 1}</span>}
                                                    </>
                                                ) : (u.phone || '-')}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <div className="flex gap-2">
                                                <button onClick={() => openEditModal(u)} className="btn btn-secondary text-xs px-2 py-1">{t('edit')}</button>
                                                <button onClick={() => openResetModal(u)} className="btn btn-secondary text-xs px-2 py-1">{t('reset_pwd')}</button>
                                                {u.role !== 'admin' && (
                                                    <button onClick={() => openDeleteModal(u)} className="btn btn-danger text-xs px-2 py-1">{t('delete')}</button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            <Modal
                isOpen={modalState.isOpen}
                onClose={closeModal}
                title={
                    modalState.type === 'CREATE' ? t('add_new_user') :
                        (modalState.type === 'EDIT' ? t('edit_user') :
                            (modalState.type === 'DELETE' ? t('delete_user') : t('reset_password')))
                }
                footer={
                    <>
                        <button onClick={closeModal} className="btn btn-secondary">{t('cancel')}</button>
                        <button onClick={confirmAction} className={`btn ${modalState.type === 'DELETE' ? 'btn-danger' : 'btn-primary'}`}>
                            {t('confirm')}
                        </button>
                    </>
                }
            >
                {renderModalContent()}
            </Modal>
        </div>
    );
};

export default AdminUsers;
