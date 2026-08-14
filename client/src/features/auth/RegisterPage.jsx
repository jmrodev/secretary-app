import React from 'react';
import { RegisterForm } from '@/features/auth/index';

/**
 * RegisterPage (Orchestrator).
 * Entry point for new user registration.
 */
const RegisterPage = () => {
    return (
        <section>
            <RegisterForm />
        </section>
    );
};

export default RegisterPage;
