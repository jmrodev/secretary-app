import React from 'react';
import { RegisterForm } from '@/features/auth/index';

/**
 * RegisterPage (Orchestrator).
 * Entry point for new user registration.
 */
const RegisterPage = () => {
    return (
        <div className="register-page-orchestrator animate-fadeIn">
            <RegisterForm />
        </div>
    );
};

export default RegisterPage;
