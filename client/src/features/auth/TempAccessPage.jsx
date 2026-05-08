import React from 'react';
import { PatientForm, usePatientFormController } from '@/features/patients';
import StatusDisplay from '@/components/molecules/StatusDisplay';
import { useTempAccessController } from '@/controllers/useTempAccessController';
import { useLanguage } from '@/context/LanguageContext';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './TempAccessPage.css';

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
        <div className="temp-access-orchestrator">
            <div className="temp-access__container">
                <article className="temp-access__card">
                    <header className="temp-access__header">
                        <h1 className="temp-access__title">
                            {isNew ? 'Registro de Paciente' : 'Actualizar mis Datos'}
                        </h1>
                        <p className="temp-access__subtitle">
                            Por favor completa los siguientes campos para continuar.
                        </p>
                    </header>

                    <section className="temp-access__form-section">
                        <TempAccessFormWrapper
                            initialData={initialData}
                            insurances={insurances}
                            onSubmit={handleSubmit}
                            isEdit={!isNew}
                        />
                    </section>
                </article>

                <aside className="temp-access__download-card animate-fade-in">
                    <div className="temp-access__download-info">
                        <h4 className="temp-access__download-title">
                            <Icon name="SMARTPHONE" className="mr-2" />
                            {t('mobile_app')}
                        </h4>
                        <p className="temp-access__download-text">
                            Descarga nuestra aplicación para gestionar tus turnos y recetas más rápido.
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        className="temp-access__download-button"
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
