import React from 'react';
import { Link } from 'react-router-dom';
import { useRegisterController } from '../controllers/useRegisterController';
import Button from '../components/atoms/Button';

/**
 * Register Page Component.
 * Refactored to follow BEM methodology and Atomic Design.
 */
const Register = () => {
    const {
        formData,
        handleChange,
        handleSubmit,
        error,
        loading,
        t
    } = useRegisterController();

    return (
        <div className="auth-layout auth-layout--hero">
            <div className="auth-layout__overlay"></div>

            <main className="auth-card">
                <header className="auth-card__header">
                    <h1 className="auth-card__title">{t('create_account')}</h1>
                    <p className="auth-card__subtitle">Completa el formulario para unirte.</p>
                </header>

                {error && <div className="auth-card__error">{error}</div>}

                <form className="auth-card__form" onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label className="input-label">{t('i_am')}</label>
                        <select
                            name="role"
                            className="input-field"
                            value={formData.role}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value="patient">{t('patient')}</option>
                            <option value="doctor">{t('doctor')}</option>
                            <option value="secretary">{t('secretary')}</option>
                        </select>
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t('full_name')}</label>
                        <input
                            name="fullName"
                            className="input-field"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Nombre completo"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t('dni')}</label>
                        <input
                            name="dni"
                            className="input-field"
                            value={formData.dni}
                            onChange={handleChange}
                            placeholder="DNI"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t('username')}</label>
                        <input
                            name="username"
                            className="input-field"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Usuario"
                            disabled={loading}
                            required
                        />
                    </div>

                    <div className="input-group">
                        <label className="input-label">{t('password')}</label>
                        <input
                            type="password"
                            name="password"
                            className="input-field"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            disabled={loading}
                            required
                        />
                    </div>

                    {/* Role specific fields */}
                    {formData.role === 'doctor' && (
                        <div className="animate-fadeIn">
                            <div className="input-group">
                                <label className="input-label">{t('specialty')}</label>
                                <input
                                    name="specialty"
                                    className="input-field"
                                    value={formData.specialty}
                                    onChange={handleChange}
                                    placeholder="Especialidad médica"
                                    disabled={loading}
                                />
                            </div>
                            <div className="input-group">
                                <label className="input-label">{t('cbu')}</label>
                                <input
                                    name="cbu"
                                    className="input-field"
                                    value={formData.cbu}
                                    onChange={handleChange}
                                    placeholder="CBU para transferencias"
                                    disabled={loading}
                                />
                            </div>
                        </div>
                    )}

                    {formData.role === 'patient' && (
                        <div className="input-group animate-fadeIn">
                            <label className="input-label">{t('dob')}</label>
                            <input
                                type="date"
                                name="dob"
                                className="input-field"
                                value={formData.dob}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full mt-4"
                        disabled={loading}
                    >
                        {loading ? 'Preparando todo...' : t('register')}
                    </Button>
                </form>

                <footer className="auth-card__footer">
                    <p className="auth-card__footer-text">
                        {t('already_account')}
                        <Link to="/login" className="auth-card__link">{t('login')}</Link>
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default Register;
