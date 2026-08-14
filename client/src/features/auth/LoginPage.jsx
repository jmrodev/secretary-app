import React from 'react';
import { LoginForm } from '@/features/auth/index';
import styles from './LoginPage.module.css';

/**
 * LoginPage (Orchestrator).
 * Entry point for user authentication.
 */
const LoginPage = () => {
    return (
        <section className={`${styles.root} ${styles.hero} `}>
            <div className={`${styles.backgroundBlobs}`}>
                <div className={`${styles.blob} ${styles.blobPrimary}`}></div>
                <div className={`${styles.blob} ${styles.blobSecondary}`}></div>
            </div>
            <div className={`${styles.overlay}`} aria-hidden="true"></div>
            <section className={`${styles.content}`}>
                <LoginForm />
            </section>
        </section>
    );
};

export default LoginPage;
