import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        fullName: '',
        role: 'patient', // default
        phone: '',
        specialty: '', // for doctor
        cbu: '', // for doctor
        dob: '', // for patient
        address: '', // for patient
        medicalHistory: '' // for patient
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const success = await register(formData);
        if (success) {
            navigate('/dashboard');
        } else {
            setError('Registration failed. Try again.');
        }
    };

    return (
        <div className="auth-page">
            <div className="card auth-card" style={{ maxWidth: '500px' }}>
                <h2 className="title text-center">{t('create_account')}</h2>

                {error && <div className="alert-box alert-error text-center">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">{t('i_am')}</label>
                        <select name="role" className="input-field" value={formData.role} onChange={handleChange}>
                            <option value="patient">{t('patient')}</option>
                            <option value="doctor">{t('doctor')}</option>
                            <option value="secretary">{t('secretary')}</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t('full_name')}</label>
                        <input name="fullName" className="input-field" onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t('dni')}</label>
                        <input name="dni" className="input-field" onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t('username')}</label>
                        <input name="username" className="input-field" onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t('password')}</label>
                        <input type="password" name="password" className="input-field" onChange={handleChange} required />
                    </div>

                    {/* Role specific fields */}
                    {formData.role === 'doctor' && (
                        <>
                            <div className="input-group">
                                <label className="input-label">{t('specialty')}</label>
                                <input name="specialty" className="input-field" onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('cbu')}</label>
                                <input name="cbu" className="input-field" onChange={handleChange} />
                            </div>
                        </>
                    )}

                    {formData.role === 'patient' && (
                        <>
                            <div className="input-group">
                                <label className="input-label">{t('dob')}</label>
                                <input type="date" name="dob" className="input-field" onChange={handleChange} />
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn btn-accent w-full">
                        {t('register')}
                    </button>
                </form>
                <div className="text-center mt-6">
                    <span className="subtitle">{t('already_account')} </span>
                    <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>{t('login')}</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
