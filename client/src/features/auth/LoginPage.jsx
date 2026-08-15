import React from 'react';
import { LoginForm } from '@/features/auth/index';
import styles from './LoginPage.module.css';

/**
 * LoginPage (Orchestrator).
 * Entry point for user authentication.
 */
export const LoginPage = () => {
    return (
        <section className={`${styles.LoginPage__root} ${styles.LoginPage__hero} `}>
            <div className={`${styles.LoginPage__backgroundBlobs}`}>
                <div className={`${styles.LoginPage__blob} ${styles.LoginPage__blobPrimary}`}></div>
                <div className={`${styles.LoginPage__blob} ${styles.LoginPage__blobSecondary}`}></div>
            </div>
            <div className={`${styles.LoginPage__overlay}`} aria-hidden="true"></div>
            <section className={`${styles.LoginPage__content}`}>
                <LoginForm />
            </section>
        </section>
    );
};
