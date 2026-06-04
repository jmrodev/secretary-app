import React from 'react';
import { useAuth } from '@/features/auth';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './PatientBlocker.module.css';

const PatientBlocker = () => {
    const { logout } = useAuth();

    const handleLogout = () => {
        logout();
        window.location.href = '/';
    };

    return (
        <div className={`${styles.root}`}>
            <div className={`${styles.card}`}>
                <div className={`${styles.iconContainer}`}>
                    <Icon name="check_circle" size="4rem" className={`${styles.iconSuccess}`} />
                </div>
                <h2 className={`${styles.title}`}>Registro Completado</h2>
                <p className={`${styles.message}`}>
                    Tu información ha sido recibida correctamente.
                    <br /><br />
                    Esta sección es de uso administrativo. Si necesitas realizar otra gestión, por favor utiliza el enlace enviado a tu dispositivo o escanea el QR en el consultorio.
                </p>
                <Button
                    variant="secondary"
                    className={`${styles.button}`}
                    onClick={handleLogout}
                >
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );
};

export default PatientBlocker;
