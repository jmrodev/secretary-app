import React from 'react';
import PatientForm from '../components/organisms/PatientForm';
import StatusDisplay from '../components/molecules/StatusDisplay';
import { useTempAccessController } from '../controllers/useTempAccessController';
import { usePatientFormController } from '../controllers/usePatientFormController';

const TempAccessFormWrapper = ({ initialData, insurances, onSubmit, isEdit }) => {
    const controller = usePatientFormController({
        initialValues: initialData,
        providedInsurances: insurances,
        isEdit: isEdit,
        onUpdate: onSubmit // Redirect update to the page handler
    });

    return <PatientForm controller={controller} isAdmin={false} />;
};

/**
 * TempAccess Page Component.
 * Allows patients to register or update their data via a temporary link.
 * Follows Atomic Design and BEM conventions.
 */
const TempAccess = () => {
    const {
        loading,
        error,
        success,
        isNew,
        initialData,
        insurances,
        handleSubmit
    } = useTempAccessController();

    // Render logic for different states
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

    // Main form view
    return (
        <div className="temp-access">
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
            </div>
        </div>
    );
};

export default TempAccess;
