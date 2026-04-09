import React from 'react';
import { useAuth } from '@/features/auth';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './PatientBlocker.css';

const PatientBlocker = () => {
    const { logout } = useAuth(); // Assuming logout is in useAuth

    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/';
    };

    return (
        <div className="patient-blocker">
            <div className="patient-blocker__card">
                <div className="patient-blocker__icon-container">
                    <Icon name="check_circle" size="4rem" className="patient-blocker__icon--success" />
                </div>
                <h2 className="patient-blocker__title">Registro Completado</h2>
                <p className="patient-blocker__message">
                    Tu información ha sido recibida correctamente.
                    <br /><br />
                    Esta sección es de uso administrativo. Si necesitas realizar otra gestión, por favor utiliza el enlace enviado a tu dispositivo o escanea el QR en el consultorio.
                </p>
                <Button
                    variant="secondary"
                    className="patient-blocker__button"
                    onClick={handleLogout}
                >
                    Cerrar Sesión
                </Button>
            </div>
        </div>
    );
};

export default PatientBlocker;
