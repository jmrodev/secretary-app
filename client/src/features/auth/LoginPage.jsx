import React from 'react';
<<<<<<< HEAD
import { LoginForm } from './index';
import './LoginPage.css';
=======
import { LoginForm } from '@/features/auth/index';
>>>>>>> main

/**
 * LoginPage (Orchestrator).
 * Entry point for user authentication.
 */
const LoginPage = () => {
    return (
        <main className="login-page login-page--hero animate-fadeIn">
            <div className="login-page__overlay"></div>
            <div className="login-page__content">
                <LoginForm />
            </div>
        </main>
    );
};

export default LoginPage;
