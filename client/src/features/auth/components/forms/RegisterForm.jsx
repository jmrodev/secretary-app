import React from 'react';
import { Link } from 'react-router-dom';
import { useRegisterController } from '@/features/auth/hooks/useRegisterController';
import { Button } from '@/components/atoms/Button';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import FormGroup from '@/components/molecules/FormGroup';
import styles from './RegisterForm.module.css';

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
    const { updateRegisterData, handleSubmit } = handlers;

    return (
        <div className={`${styles.authLayout} ${styles.authLayoutHero}`}>
            <div className={`${styles.overlay}`}></div>

            <main className={`${styles.root} ${styles.register}`}>
                <header className={`${styles.header}`}>
                    <h1 className={`${styles.title}`}>{t('create_account')}</h1>
                    <p className={`${styles.subtitle}`}>Completa el formulario para unirte.</p>
                </header>

                {error && <div className={`${styles.error}`}>{error}</div>}

                <form className={`${styles.form}`} onSubmit={handleSubmit}>
                    <FormGroup label={t('i_am')}>
                        <Select
                            name="role"
                            value={formData.role}
                            onChange={updateRegisterData}
                            disabled={loading}
                            options={[
                                { value: 'patient', label: t('patient') },
                                { value: 'doctor', label: t('doctor') },
                                { value: 'secretary', label: t('secretary') }
                            ]}
                        />
                    </FormGroup>

                    <FormGroup label={t('full_name')}>
                        <Input
                            name="fullName"
                            value={formData.fullName}
                            onChange={updateRegisterData}
                            placeholder="Nombre completo"
                            disabled={loading}
                            required
                        />
                    </FormGroup>

                    <FormGroup label={t('dni')}>
                        <Input
                            name="dni"
                            value={formData.dni}
                            onChange={updateRegisterData}
                            placeholder="DNI"
                            disabled={loading}
                            required
                        />
                    </FormGroup>

                    <FormGroup label={t('username')}>
                        <Input
                            name="username"
                            value={formData.username}
                            onChange={updateRegisterData}
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
                            onChange={updateRegisterData}
                            placeholder="••••••••"
                            disabled={loading}
                            required
                        />
                    </FormGroup>

                    {/* Role specific fields */}
                    {formData.role === 'doctor' && (
                        <div className={`${styles.animateFadeIn}`}>
                            <FormGroup label={t('specialty')}>
                                <Input
                                    name="specialty"
                                    value={formData.specialty}
                                    onChange={updateRegisterData}
                                    placeholder="Especialidad médica"
                                    disabled={loading}
                                />
                            </FormGroup>
                            <FormGroup label={t('cbu')}>
                                <Input
                                    name="cbu"
                                    value={formData.cbu}
                                    onChange={updateRegisterData}
                                    placeholder="CBU para transferencias"
                                    disabled={loading}
                                />
                            </FormGroup>
                        </div>
                    )}

                    {formData.role === 'patient' && (
                        <div className={`${styles.animateFadeIn}`}>
                            <FormGroup label={t('dob')}>
                                <Input
                                    type="date"
                                    name="dob"
                                    value={formData.dob}
                                    onChange={updateRegisterData}
                                    disabled={loading}
                                />
                            </FormGroup>
                        </div>
                    )}

                    <Button
                        type="submit"
                        variant="primary"
                        className={`${styles.buttonSubmit}`}
                        disabled={loading}
                    >
                        {loading ? 'Preparando todo...' : t('register')}
                    </Button>
                </form>

                <footer className={`${styles.footer}`}>
                    <p className={`${styles.footerText}`}>
                        {t('already_account')}
                        <Link to="/" className={`${styles.link}`}>{t('login')}</Link>
                    </p>
                </footer>
            </main>
        </div>
    );
};

export default RegisterForm;
