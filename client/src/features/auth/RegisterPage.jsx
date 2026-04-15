import React from 'react';
import { RegisterForm } from './index';

/**
 * RegisterPage (Orchestrator).
 * Entry point for new user registration.
 */
const RegisterPage = () => {
    return (
        <main className="register-page-orchestrator animate-fadeIn">
            <RegisterForm />
        </main>
    );
};

export default RegisterPage;
