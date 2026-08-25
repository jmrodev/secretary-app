import React from 'react';
import { RegisterForm } from '@/features/auth/components/forms/RegisterForm';

/**
 * RegisterPage (Orchestrator).
 * Entry point for new user registration.
 */
export const RegisterPage = () => {
    return (
        <section>
            <RegisterForm />
        </section>
    );
};
