import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../context/MessageContext';
import Modal from '../components/Modal';

const AdminUsers = () => {
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Unified Modal State: type = 'RESET_DNI' | 'RESET_MANUAL' | 'CREATE' | 'EDIT' | 'DELETE'
    const [modalState, setModalState] = useState({
        isOpen: false,
        type: null,
        user: null,
        formData: { username: '', password: '', role: 'patient', full_name: '', dni: '', phone: '', specialty: '' }
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/admin/users');
            setUsers(res.data);
        } catch (err) {
            console.error(err);
            showMessage("Failed to load users", 'error');
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
            formData: { username: '', password: '', role: 'patient', full_name: '', dni: '', phone: '', specialty: '' }
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
                phone: u.phone || '',
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
            await api.post('/users/admin/users', formData);
            showMessage("User created successfully", 'success');
            fetchUsers();
            closeModal();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data || "Failed to create user", 'error');
        }
    };

    const handleUpdate = async () => {
        try {
            const { user, formData } = modalState;
            await api.put(`/users/admin/users/${user.id}`, formData);
            showMessage("User updated successfully", 'success');
            fetchUsers();
            closeModal();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data || "Failed to update user", 'error');
        }
    };

    const handleDelete = async () => {
        try {
            const { user } = modalState;
            await api.delete(`/users/admin/users/${user.id}`);
            showMessage("User deleted successfully", 'success');
            fetchUsers();
            closeModal();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data || "Failed to delete user", 'error');
        }
    };

    const handleResetPassword = async () => {
        try {
            const { user, formData } = modalState;
            await api.post(`/users/admin/reset-password/${user.id}`, { newPassword: formData.password });
            showMessage(`Password reset for ${user.username}`, 'success');
            closeModal();
        } catch (err) {
            console.error(err);
            showMessage(err.response?.data || "Failed to reset password", 'error');
        }
    };

    // --- Render Helpers ---

    const renderModalContent = () => {
        const { type, user, formData } = modalState;
        const setFormData = (newData) => setModalState(prev => ({ ...prev, formData: { ...prev.formData, ...newData } }));

        if (type === 'DELETE') {
            return <p>Are you sure you want to delete user <strong>{user.username}</strong>? This action cannot be undone.</p>;
        }

        if (type === 'RESET_DNI') {
            return <p>Reset password for <strong>{user.username}</strong> to DNI (<strong>{user.dni}</strong>)?</p>;
        }

        if (type === 'RESET_MANUAL') {
            return (
                <div>
                    <label className="input-label">New Password</label>
                    <input className="input-field" value={formData.password} onChange={e => setFormData({ password: e.target.value })} />
                </div>
            );
        }

        // Create / Edit Form
        return (
            <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label className="input-label">Username</label>
                        <input className="input-field" value={formData.username} onChange={e => setFormData({ username: e.target.value })} />
                    </div>
                    {type === 'CREATE' && (
                        <div>
                            <label className="input-label">Password</label>
                            <input className="input-field" type="password" value={formData.password} onChange={e => setFormData({ password: e.target.value })} />
                        </div>
                    )}
                </div>

                <div>
                    <label className="input-label">Role</label>
                    <select className="input-field" value={formData.role} onChange={e => setFormData({ role: e.target.value })}>
                        <option value="patient">Patient</option>
                        <option value="doctor">Doctor</option>
                        <option value="secretary">Secretary</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>

                <div>
                    <label className="input-label">Full Name</label>
                    <input className="input-field" value={formData.full_name} onChange={e => setFormData({ full_name: e.target.value })} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label className="input-label">DNI</label>
                        <input className="input-field" value={formData.dni} onChange={e => setFormData({ dni: e.target.value })} />
                    </div>
                    <div>
                        <label className="input-label">Phone</label>
                        <input className="input-field" value={formData.phone} onChange={e => setFormData({ phone: e.target.value })} />
                    </div>
                </div>

                {formData.role === 'doctor' && (
                    <div>
                        <label className="input-label">Specialty</label>
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
            <aside className="sidebar">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>MediCare</h2>
                    <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Admin Console</div>
                </div>
                <nav>
                    <a href="/dashboard" className="sidebar-link">Dashboard</a>
                    <a href="/logs" className="sidebar-link">Audit Logs</a>
                    <a href="#" className="sidebar-link active">User Management</a>
                </nav>
            </aside>

            <main className="main-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <div>
                        <h1 className="title">User Management</h1>
                        <p style={{ color: '#64748b' }}>Manage system access and recover user accounts.</p>
                    </div>
                    <button className="btn btn-primary" onClick={openCreateModal}>+ Add User</button>
                </div>

                <div className="card">
                    <div style={{ marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            placeholder="Search by username, name or role..."
                            className="input-field"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ maxWidth: '400px' }}
                        />
                    </div>

                    {loading ? <p>Loading users...</p> : (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f8fafc', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>User</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>Role</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>Name / Contact</th>
                                    <th style={{ padding: '0.75rem', borderBottom: '2px solid #e2e8f0' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ fontWeight: 'bold' }}>{u.username}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>DNI: {u.dni || '-'}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{
                                                padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem',
                                                background: u.role === 'admin' ? '#1e293b' : (u.role === 'doctor' ? '#3b82f6' : (u.role === 'secretary' ? '#8b5cf6' : '#22c55e')),
                                                color: '#fff'
                                            }}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div>{u.full_name || '-'}</div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.phone}</div>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button onClick={() => openEditModal(u)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>Edit</button>
                                                <button onClick={() => openResetModal(u)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem' }}>Reset PWD</button>
                                                {u.role !== 'admin' && (
                                                    <button onClick={() => openDeleteModal(u)} className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', background: '#fee2e2', color: '#991b1b', border: 'none' }}>Del</button>
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
                    modalState.type === 'CREATE' ? 'Add New User' :
                        (modalState.type === 'EDIT' ? 'Edit User' :
                            (modalState.type === 'DELETE' ? 'Delete User' : 'Reset Password'))
                }
                footer={
                    <>
                        <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
                        <button onClick={confirmAction} className={`btn ${modalState.type === 'DELETE' ? 'btn-danger' : 'btn-primary'}`}
                            style={modalState.type === 'DELETE' ? { background: '#ef4444', color: 'white' } : {}}
                        >
                            Confirm
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
