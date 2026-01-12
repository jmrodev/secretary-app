import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import CurrencyInput from '../components/CurrencyInput';
import Sidebar from '../components/Sidebar';

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
    const [visitInterval, setVisitInterval] = useState(0);
    const [prescriptionInterval, setPrescriptionInterval] = useState(0);

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
                    setVisitInterval(res.data.default_visit_interval_days || 0);
                    setPrescriptionInterval(res.data.default_prescription_interval_days || 0);
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
                consultation_price: consultationPrice,
                default_visit_interval_days: visitInterval,
                default_prescription_interval_days: prescriptionInterval
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
                <Sidebar />
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
            <Sidebar />
            <main className="main-content">
                <h1 className="title">{t('my_profile')}</h1>

                {message && <div className={`p-4 rounded mb-4 ${message.includes('Failed') ? 'bg-red-100 text-red-900' : 'bg-green-100 text-green-900'}`}>{message}</div>}

                <div className="card">
                    <form onSubmit={handleUpdate}>
                        <div className="input-group">
                            <label className="input-label">{t('username')}</label>
                            <input className="input-field bg-read-only" value={user.username} disabled />
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
                                <div className="grid-2-cols">
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
                                    <CurrencyInput className="input-field" value={consultationPrice} onChange={e => setConsultationPrice(e.target.value)} />
                                </div>

                                <h3 className="text-lg font-medium mt-6 mb-4">{t('follow_up_settings')}</h3>
                                <div className="grid-2-cols">
                                    <div className="input-group">
                                        <label className="input-label">{t('visit_interval_days')}</label>
                                        <input type="number" className="input-field" value={visitInterval} onChange={e => setVisitInterval(e.target.value)} min="0" />
                                    </div>
                                    <div className="input-group">
                                        <label className="input-label">{t('prescription_interval_days')}</label>
                                        <input type="number" className="input-field" value={prescriptionInterval} onChange={e => setPrescriptionInterval(e.target.value)} min="0" />
                                    </div>
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
