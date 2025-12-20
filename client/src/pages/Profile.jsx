import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Profile = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
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
            setMessage(t('profile_updated'));
        } catch (err) {
            setMessage(t('failed_update_profile'));
            console.error(err);
        }
    };

    if (loading) return <div>{t('loading')}</div>;

    if (user.role === 'admin') {
        return (
            <div className="app-layout">
                <aside className="sidebar">
                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('app_name')}</h2>
                    </div>
                    <nav>
                        <a href="/dashboard" className="sidebar-link">{t('dashboard')}</a>
                        <a href="#" className="sidebar-link active">{t('my_profile')}</a>
                    </nav>
                </aside>
                <main className="main-content">
                    <h1 className="title">{t('my_profile')}</h1>
                    <div className="card">
                        <p>{t('admin_account_msg')}</p>
                        <p><strong>{t('username')}:</strong> {user.username}</p>
                        <p><strong>{t('role_header')}:</strong> {user.role}</p>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div style={{ marginBottom: '2rem' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{t('app_name')}</h2>
                </div>
                <nav>
                    <a href="/dashboard" className="sidebar-link">{t('dashboard')}</a>
                    <a href="#" className="sidebar-link active">{t('my_profile')}</a>
                </nav>
            </aside>
            <main className="main-content">
                <h1 className="title">{t('my_profile')}</h1>

                {message && <div style={{ padding: '1rem', background: message.includes('Failed') ? '#fee2e2' : '#dcfce7', color: message.includes('Failed') ? '#991b1b' : '#166534', borderRadius: '8px', marginBottom: '1rem' }}>{message}</div>}

                <div className="card">
                    <form onSubmit={handleUpdate}>
                        <div className="input-group">
                            <label className="input-label">{t('username')}</label>
                            <input className="input-field" value={user.username} disabled style={{ background: '#f1f5f9' }} />
                        </div>

                        <div className="input-group">
                            <label className="input-label">{t('full_name')}</label>
                            <input className="input-field" value={fullName} onChange={e => setFullName(e.target.value)} required />
                        </div>

                        <div className="input-group">
                            <label className="input-label">{t('phone') || 'Phone'}</label>
                            <input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
                        </div>

                        {user.role === 'patient' && (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label className="input-label">{t('dni')}</label>
                                        <input className="input-field" value={dni} onChange={e => setDni(e.target.value)} />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('insurance')}</label>
                                        <input className="input-field" value={insurance} onChange={e => setInsurance(e.target.value)} />
                                    </div>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('address')}</label>
                                    <input className="input-field" value={address} onChange={e => setAddress(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('medical_history')}</label>
                                    <textarea className="input-field" rows="3" value={medicalHistory} onChange={e => setMedicalHistory(e.target.value)} />
                                </div>
                            </>
                        )}

                        {user.role === 'doctor' && (
                            <>
                                <div className="input-group">
                                    <label className="input-label">{t('specialty')}</label>
                                    <input className="input-field" value={specialty} onChange={e => setSpecialty(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('cbu')}</label>
                                    <input className="input-field" value={cbu} onChange={e => setCbu(e.target.value)} />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">{t('consultation_price')}</label>
                                    <input type="number" className="input-field" value={consultationPrice} onChange={e => setConsultationPrice(e.target.value)} />
                                </div>
                            </>
                        )}

                        <button type="submit" className="btn btn-primary">{t('save_changes')}</button>
                    </form>
                </div>
            </main>
        </div>
    );
};

export default Profile;
