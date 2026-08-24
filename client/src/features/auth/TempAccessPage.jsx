import React from 'react';
import { PatientForm } from '@/features/patients/components/forms/PatientForm';
import { usePatientFormController } from '@/features/patients/hooks/usePatientFormController';
import { StatusDisplay } from '@/components/molecules/StatusDisplay';
import { useTempAccessController } from '@/features/users/hooks/useTempAccessController';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
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
export const TempAccessPage = () => {
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
        return <StatusDisplay type="loading" message={t('loading_profile') || "Cargando perfil..."} />;
    }

    if (error) {
        return (
            <StatusDisplay
                type="error"
                title={t('invalid_link') || "Enlace Inválido"}
                message={error}
            />
        );
    }

    if (success) {
        return (
            <StatusDisplay
                type="success"
                title={t('data_saved_success_title') || "¡Datos Guardados!"}
                message={t('temp_access_success_message') || "Gracias por completar tu información. Ya puedes cerrar esta ventana y devolver el dispositivo o esperar a ser llamado."}
            />
        );
    }

    return (
        <section className={`${styles.TempAccessPage__container}`}>
            <article className={`${styles.TempAccessPage__card}`}>
                    <header className={`${styles.TempAccessPage__header}`}>
                        <h1 className={`${styles.TempAccessPage__title}`}>
                            {isNew ? (t('patient_registration') || 'Registro de Paciente') : (t('update_my_data') || 'Actualizar mis Datos')}
                        </h1>
                        <p className={`${styles.TempAccessPage__subtitle}`}>
                            {t('temp_access_instruction') || 'Por favor completa los siguientes campos para continuar.'}
                        </p>
                    </header>

                    <section className={`${styles.TempAccessPage__formSection}`}>
                        <TempAccessFormWrapper
                            initialData={initialData}
                            insurances={insurances}
                            onSubmit={handleSubmit}
                            isEdit={!isNew}
                        />
                    </section>
                </article>

                <aside className={`${styles.TempAccessPage__downloadCard} `}>
                    <div className={`${styles.TempAccessPage__downloadInfo}`}>
                        <h4 className={`${styles.TempAccessPage__downloadTitle}`}>
                            <Icon name="SMARTPHONE" className="mr-2" />
                            {t('mobile_app')}
                        </h4>
                        <p className={`${styles.TempAccessPage__downloadText}`}>
                            {t('temp_access_download_desc') || 'Descarga nuestra aplicación para gestionar tus turnos y recetas más rápido.'}
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        className={`${styles.TempAccessPage__downloadButton}`}
                        icon={<Icon name="DOWNLOAD" size="1.1rem" />}
                        onClick={() => window.open('/uploads/secretary-app.apk', '_blank')}
                    >
                        {t('download_apk')}
                    </Button>
                </aside>
        </section>
    );
};
