import React from 'react';
import { LoginForm } from '@/features/auth/index';
import './LoginPage.css';

/**
 * LoginPage (Orchestrator).
 * Entry point for user authentication.
 */
const LoginPage = () => {
    return (
        <main className="login-page login-page--hero animate-fadeIn">
            <div className="login-page__overlay" aria-hidden="true"></div>
            <section className="login-page__content">
                <LoginForm />
            </section>
        </main>
    );
};

export default LoginPage;
