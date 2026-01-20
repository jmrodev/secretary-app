import { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import CurrencyInput from '../components/CurrencyInput';
import Sidebar from '../components/Sidebar';
import PhoneNumbersManager from '../components/PhoneNumbersManager';

const Profile = () => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');

    // Editable fields
    const [fullName, setFullName] = useState('');
    const [phoneNumbers, setPhoneNumbers] = useState([]);
    const [address, setAddress] = useState('');
    const [medicalHistory, setMedicalHistory] = useState('');
    const [dni, setDni] = useState('');
    const [insurance, setInsurance] = useState('');

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get('/users/profile');
                setProfile(res.data);

                // Init fields
                if (res.data) {
                    setFullName(res.data.full_name || '');
                    setPhoneNumbers(res.data.phoneNumbers || (res.data.phone ? [{ phone_number: res.data.phone, is_primary: true, label: 'Celular' }] : []));
                    setAddress(res.data.address || '');
                    setMedicalHistory(res.data.medical_history || '');
                    setDni(res.data.dni || '');
                    setInsurance(res.data.insurance || '');
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
                phoneNumbers: phoneNumbers,
                address,
                medical_history: medicalHistory,
                dni,
                insurance
            });
            setMessage(t('profile_updated'));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setMessage(t('failed_update_profile'));
            console.error(err);
        }
    };

    if (loading) return <div className="app-layout"><div className="p-8">{t('loading')}</div></div>;

    if (user.role === 'admin') {
        return (
            <div className="app-layout">
                <Sidebar />
                <main className="main-content">
                    <div className="header-banner">
                        <div className="flex items-center gap-6 relative z-10">
                            <div className="avatar-xl">
                                {user.username.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                                <div className="badge-glass mb-2">{t('admin')}</div>
                                <h1 className="text-3xl font-bold text-white mb-1" style={{ textShadow: 'none' }}>
                                    {user.username}
                                </h1>
                                <p className="text-blue-100 m-0 opacity-90">
                                    {t('system_admin_account')}
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="card">
                        <div className="section-title">
                            <span>🛡️</span> {t('admin_account_msg')}
                        </div>
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
                {/* Header Banner */}
                <div className="header-banner">
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="avatar-xl">
                            {fullName ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : user.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="badge-glass mb-2">{user.role === 'doctor' ? t('medical_professional') : t('patient_account')}</div>
                            <h1 className="text-3xl font-bold text-white mb-1" style={{ textShadow: 'none' }}>
                                {fullName || user.username}
                            </h1>
                            <p className="text-blue-100 m-0 opacity-90">
                                {user.role === 'doctor' ? t('manage_medical_settings') : t('manage_patient_profile')}
                            </p>
                        </div>
                    </div>
                </div>

                {message && (
                    <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 shadow-sm ${message.includes('Failed') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                        <span className="text-xl">{message.includes('Failed') ? '⚠️' : '✅'}</span>
                        <span className="font-medium">{message}</span>
                    </div>
                )}

                <form onSubmit={handleUpdate}>
                    <div className="item-grid">
                        {/* LEFT COLUMN: Personal Info */}
                        <div className="card h-full">
                            <div className="section-title">
                                <span>👤</span> {t('personal_information')}
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('username')}</label>
                                <input className="form-input" value={user.username} disabled />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('full_name')}</label>
                                <input
                                    className="form-input"
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    placeholder="Juan Perez"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('dni')}</label>
                                <input
                                    className="form-input"
                                    value={dni}
                                    onChange={e => setDni(e.target.value)}
                                    placeholder="12.345.678"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('address')}</label>
                                <input
                                    className="form-input"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="Calle 123, Ciudad"
                                />
                            </div>

                            <div className="mt-4">
                                <PhoneNumbersManager
                                    phoneNumbers={phoneNumbers}
                                    onChange={setPhoneNumbers}
                                />
                            </div>
                        </div>

                        {/* RIGHT COLUMN: Professional / Medical Info */}
                        <div className="card h-full">
                            <div className="section-title">
                                <span>{user.role === 'doctor' ? '🩺' : '📋'}</span>
                                {user.role === 'doctor' ? t('professional_details') : t('medical_data')}
                            </div>

                            {user.role === 'patient' && (
                                <>
                                    <div className="form-group">
                                        <label className="form-label">{t('insurance')}</label>
                                        <input
                                            className="form-input"
                                            value={insurance}
                                            onChange={e => setInsurance(e.target.value)}
                                            placeholder="Example: OSDE, Swiss Medical"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">{t('medical_history')}</label>
                                        <textarea
                                            className="form-input"
                                            rows="6"
                                            value={medicalHistory}
                                            onChange={e => setMedicalHistory(e.target.value)}
                                            placeholder="Allergies, chronic conditions, etc."
                                        />
                                    </div>
                                </>
                            )}

                        </div>


                    </div>

                    <div className="flex justify-end mt-8 mb-12">
                        <button type="submit" className="btn btn-primary">
                            {t('save_changes')}
                        </button>
                    </div>
                </form>
            </main>
        </div>
    );
};

export default Profile;
