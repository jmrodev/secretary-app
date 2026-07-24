import React from 'react';
import { LoginForm } from '@/features/auth/index';
import styles from './LoginPage.module.css';

/**
 * LoginPage (Orchestrator).
 * Entry point for user authentication.
 */
const LoginPage = () => {
    return (
        <main className={`${styles.root} ${styles.hero} animate-fade-in`}>
            <div className={`${styles.backgroundBlobs}`}>
                <div className={`${styles.blob} ${styles.blobPrimary}`}></div>
                <div className={`${styles.blob} ${styles.blobSecondary}`}></div>
            </div>
            <div className={`${styles.overlay}`} aria-hidden="true"></div>
            <section className={`${styles.content}`}>
                <LoginForm />
            </section>
        </main>
    );
};

export default LoginPage;
