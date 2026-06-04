import React from 'react';
import { PatientForm, usePatientFormController } from '@/features/patients';
import StatusDisplay from '@/components/molecules/StatusDisplay';
import { useTempAccessController } from '@/features/users/hooks/useTempAccessController';
import { useLanguage } from '@/hooks/useLanguage';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import styles from './TempAccessPage.module.css';

const TempAccessFormWrapper = ({ initialData, insurances, onSubmit, isEdit }) => {
    const controller = usePatientFormController({
        initialValues: initialData,
        providedInsurances: insurances,
        isEdit: isEdit,
        onSubmitOverride: onSubmit
    });

    return <PatientForm controller={controller} isAdmin={false} />;
};

/**
 * TempAccessPage (Orchestrator).
 * Allows patients to register or update their data via a temporary link.
 */
const TempAccessPage = () => {
    const {
        loading,
        error,
        success,
        isNew,
        initialData,
        insurances,
        handlers
    } = useTempAccessController();
    const { handleSubmit } = handlers;
    const { t } = useLanguage();

    if (loading) {
        return <StatusDisplay type="loading" message="Cargando perfil..." />;
    }

    if (error) {
        return (
            <StatusDisplay
                type="error"
                title="Enlace Inválido"
                message={error}
            />
        );
    }

    if (success) {
        return (
            <StatusDisplay
                type="success"
                title="¡Datos Guardados!"
                message="Gracias por completar tu información. Ya puedes cerrar esta ventana y devolver el dispositivo o esperar a ser llamado."
            />
        );
    }

    return (
        <div className={`${styles.tempAccessOrchestrator}`}>
            <div className={`${styles.container}`}>
                <article className={`${styles.card}`}>
                    <header className={`${styles.header}`}>
                        <h1 className={`${styles.title}`}>
                            {isNew ? 'Registro de Paciente' : 'Actualizar mis Datos'}
                        </h1>
                        <p className={`${styles.subtitle}`}>
                            Por favor completa los siguientes campos para continuar.
                        </p>
                    </header>

                    <section className={`${styles.formSection}`}>
                        <TempAccessFormWrapper
                            initialData={initialData}
                            insurances={insurances}
                            onSubmit={handleSubmit}
                            isEdit={!isNew}
                        />
                    </section>
                </article>

                <aside className={`${styles.downloadCard} animate-fade-in`}>
                    <div className={`${styles.downloadInfo}`}>
                        <h4 className={`${styles.downloadTitle}`}>
                            <Icon name="SMARTPHONE" className="mr-2" />
                            {t('mobile_app')}
                        </h4>
                        <p className={`${styles.downloadText}`}>
                            Descarga nuestra aplicación para gestionar tus turnos y recetas más rápido.
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        className={`${styles.downloadButton}`}
                        icon={<Icon name="DOWNLOAD" size="1.1rem" />}
                        onClick={() => window.open('/uploads/secretary-app.apk', '_blank')}
                    >
                        {t('download_apk')}
                    </Button>
                </aside>
            </div>
        </div>
    );
};

export default TempAccessPage;
