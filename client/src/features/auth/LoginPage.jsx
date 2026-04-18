import React from 'react';
import { LoginForm } from '@/features/auth/index';

/**
 * LoginPage (Orchestrator).
 * Entry point for user authentication.
 */
const LoginPage = () => {
    return (
        <div className="login-page-orchestrator animate-fadeIn">
            <LoginForm />
        </div>
    );
};

export default LoginPage;
