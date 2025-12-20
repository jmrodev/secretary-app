import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Editable fields
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [medicalHistory, setMedicalHistory] = useState('');
    const [dni, setDni] = useState('');
    const [insurance, setInsurance] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [cbu, setCbu] = useState('');
    const [consultationPrice, setConsultationPrice] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/profile');
                setProfile(res.data);

                // Init fields
                if (res.data) {
                    setFullName(res.data.full_name || '');
                    setPhone(res.data.phone || '');
                    setAddress(res.data.address || '');
                    setMedicalHistory(res.data.medical_history || '');
                    setDni(res.data.dni || '');
                    setInsurance(res.data.insurance || '');
                    setSpecialty(res.data.specialty || '');
                    setCbu(res.data.cbu || '');
                    setConsultationPrice(res.data.consultation_price || '');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setMessage('');
        try {
            await api.put('/users/profile', {
                full_name: fullName,
                phone,
                address,
                medical_history: medicalHistory,
                dni,
                insurance,
                specialty,
                cbu,
                consultation_price: consultationPrice
            });
            setMessage('Profile updated successfully');
        } catch (err) {
            setMessage('Failed to update profile');
            console.error(err);
        }
    };

    if (loading) return <div>Loading...</div>;

    if (loading) return <div>Loading...</div>;

    if (user.role === 'admin') {
        return (
            <div className="app-layout">
                <aside className="sidebar">
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>MediCare</h2>
                    </div>
                    <nav>
                        <a href="/dashboard" className="sidebar-link">Dashboard</a>
                        <a href="#" className="sidebar-link active">My Profile</a>
                    </nav>
                </aside>
                <main className="main-content">
                    <h1 className="title">My Profile</h1>
                    <div className="card">
                        <p>Administrator accounts are managed directly by the system.</p>
                        <p><strong>Username:</strong> {user.username}</p>
                        <p><strong>Role:</strong> {user.role}</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>MediCare</h2>
                </div>
                <nav>
                    <a href="/dashboard" className="sidebar-link">Dashboard</a>
                    <a href="#" className="sidebar-link active">My Profile</a>
                </nav>
            </aside>
            <main className="main-content">
                <h1 className="title">My Profile</h1>

                {message && <div style={{ padding: '1rem', background: message.includes('Failed') ? '#fee2e2' : '#dcfce7', color: message.includes('Failed') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}

                <div className="card">
                    <form onSubmit={handleUpdate}>
                        <div className="input-group">
                            <label className="input-label">Username</label>
                            <input className="input-field" value={user.username} disabled style={{ background: '#f1f5f9' }} />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Full Name</label>
                            <input className="input-field" value={fullName} onChange={e => setFullName(e.target.value)} required />
                        </div>

                        <div className="input-group">
                            <label className="input-label">Phone</label>
                            <input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>

                        {user.role === 'patient' && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label className="input-label">DNI</label>
                                        <input className="input-field" value={dni} onChange={e => setDni(e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">Insurance</label>
                                        <input className="input-field" value={insurance} onChange={e => setInsurance(e.target.value)} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Address</label>
                                    <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Medical History</label>
                                    <textarea className="input-field" rows="3" value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} />
                                </div>
                            </>
                        )}

                        {user.role === 'doctor' && (
                            <>
                                <div className="input-group">
                                    <label className="input-label">Specialty</label>
                                    <input className="input-field" value={specialty} onChange={e => setSpecialty(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">CBU (for payments)</label>
                                    <input className="input-field" value={cbu} onChange={e => setCbu(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">Consultation Price ($)</label>
                                    <input type="number" className="input-field" value={consultationPrice} onChange={e => setConsultationPrice(e.target.value)} />
                                </div>
                            </>
                        )}

                        <button type="submit" className="btn btn-primary">Save Changes</button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Profile;
