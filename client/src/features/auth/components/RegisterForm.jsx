import React from 'react';
import { Link } from 'react-router-dom';
import { useRegisterController } from '../hooks/useRegisterController';
import Button from '../../../components/atoms/Button';
import Input from '../../../components/atoms/Input';
import FormGroup from '../../../components/molecules/FormGroup';
import './RegisterForm.css';

/**
 * RegisterForm - Executor Component.
 * Implements the registration UI and connects it to the useRegisterController.
 */
const RegisterForm = () => {
    const {
        formData,
        error,
        loading,
        handlers,
        t
    } = useRegisterController();
    const { handleChange, handleSubmit } = handlers;

    return (
        <div className="auth-layout auth-layout--hero">
            <div className="auth-layout__overlay"></div>

            <main className="auth-card auth-card--register">
                <header className="auth-card__header">
                    <h1 className="auth-card__title">{t('create_account')}</h1>
                    <p className="auth-card__subtitle">Completa el formulario para unirte.</p>
                </header>

                {error && <div className="auth-card__error">{error}</div>}

                <form className="auth-card__form" onSubmit={handleSubmit}>
                    <FormGroup label={t('i_am')}>
                        <select
                            name="role"
                            className="input"
                            value={formData.role}
                            onChange={handleChange}
                            disabled={loading}
                        >
                            <option value="patient">{t('patient')}</option>
                            <option value="doctor">{t('doctor')}</option>
                            <option value="secretary">{t('secretary')}</option>
                        </select>
                    </FormGroup>

                    <FormGroup label={t('full_name')}>
                        <Input
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            placeholder="Nombre completo"
                            disabled={loading}
                            required
                        />
                    </FormGroup>

                    <FormGroup label={t('dni')}>
                        <Input
                            name="dni"
                            value={formData.dni}
                            onChange={handleChange}
                            placeholder="DNI"
                            disabled={loading}
                            required
                        />
                    </FormGroup>

                    <FormGroup label={t('username')}>
                        <Input
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            placeholder="Usuario"
                            disabled={loading}
                            required
                        />
                    </FormGroup>

                    <FormGroup label={t('password')}>
                        <Input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            placeholder="••••••••"
                            disabled={loading}
                            required
                        />
                    </FormGroup>

                    {/* Role specific fields */}
                    {formData.role === 'doctor' && (
                        <div className="animate-fadeIn">
                            <FormGroup label={t('specialty')}>
                                <Input
                                    name="specialty"
                                    value={formData.specialty}
                                    onChange={handleChange}
                                    placeholder="Especialidad médica"
                                    disabled={loading}
                                />
                            </FormGroup>
                            <FormGroup label={t('cbu')}>
                                <Input
                                    name="cbu"
                                    value={formData.cbu}
                                    onChange={handleChange}
                                    placeholder="CBU para transferencias"
                                    disabled={loading}
                                />
                            </FormGroup>
                        </div>
                    )}

                    {formData.role === 'patient' && (
                        <div className="animate-fadeIn">
                            <FormGroup label={t('dob')}>
                                <Input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </FormGroup>
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        className="auth-card__button--submit"
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

export default RegisterForm;
