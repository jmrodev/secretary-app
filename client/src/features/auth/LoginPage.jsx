import React from 'react';
import { LoginForm } from './index';
import './LoginPage.css';

/**
 * LoginPage (Orchestrator).
 * Entry point for user authentication.
 */
const LoginPage = () => {
    return (
        <div className="login-page login-page--hero animate-fadeIn">
            <div className="login-page__overlay"></div>
            <div className="login-page__content">
                <LoginForm />
            </div>
        </div>
    );
};

export default LoginPage;
