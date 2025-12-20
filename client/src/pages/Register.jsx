import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Register = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
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
                <h2 className="title" style={{ textAlign: 'center' }}>Create Account</h2>

                {error && <div style={{ color: 'var(--error)', marginBottom: '1rem', textAlign: 'center' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">I am a...</label>
                        <select name="role" className="input-field" value={formData.role} onChange={handleChange}>
                            <option value="patient">Patient</option>
                            <option value="doctor">Doctor</option>
                            <option value="secretary">Secretary</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">Full Name</label>
                        <input name="fullName" className="input-field" onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label className="input-label">DNI (Identity Number)</label>
                        <input name="dni" className="input-field" onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Username</label>
                        <input name="username" className="input-field" onChange={handleChange} required />
                    </div>

                    <div className="input-group">
                        <label className="input-label">Password</label>
                        <input type="password" name="password" className="input-field" onChange={handleChange} required />
                    </div>

                    {/* Role specific fields */}
                    {formData.role === 'doctor' && (
                        <>
                            <div className="input-group">
                                <label className="input-label">Specialty</label>
                                <input name="specialty" className="input-field" onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label className="input-label">CBU (for payments)</label>
                                <input name="cbu" className="input-field" onChange={handleChange} />
                            </div>
                        </>
                    )}

                    {formData.role === 'patient' && (
                        <>
                            <div className="input-group">
                                <label className="input-label">Date of Birth</label>
                                <input type="date" name="dob" className="input-field" onChange={handleChange} />
                            </div>
                        </>
                    )}

                    <button type="submit" className="btn btn-accent" style={{ width: '100%' }}>
                        Register
                    </button>
                </form>
                <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
                    <span className="subtitle">Already have an account? </span>
                    <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>Login</Link>
                </div>
            </div>
        </div>
    );
};

export default Register;
