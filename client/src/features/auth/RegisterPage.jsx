import React from 'react';
import { RegisterForm } from '@/features/auth/index';

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
