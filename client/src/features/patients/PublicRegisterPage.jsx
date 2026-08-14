import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFetch } from '@/hooks/useFetch';
import styles from './PublicRegisterPage.module.css';

/**
 * PublicRegisterPage (Orchestrator).
 * Paginated form (one field at a time) for accessibility and mobile ease.
 * Focused on: Name, Surname, Address, DNI, Phone.
 */
const StepField = ({ step, formData, onChange, inputRef }) => {
    switch(step) {
        case 1:
            return (
                <div className={`${styles.stepField} `}>
                    <label htmlFor="firstName" className={`${styles.accessibleLabel}`}>¿Cuál es tu NOMBRE?</label>
                    <input
                        id="firstName"
                        name="firstName"
                        className={`${styles.accessibleInput}`}
                        value={formData.firstName}
                        onChange={onChange}
                        placeholder="Escribí tu nombre..."
                        autoComplete="off"
                        ref={inputRef}
                    />
                </div>
            );
        case 2:
            return (
                <div className={`${styles.stepField} `}>
                    <label htmlFor="lastName" className={`${styles.accessibleLabel}`}>¿Cuál es tu APELLIDO?</label>
                    <input
                        id="lastName"
                        name="lastName"
                        className={`${styles.accessibleInput}`}
                        value={formData.lastName}
                        onChange={onChange}
                        placeholder="Escribí tu apellido..."
                        autoComplete="off"
                        ref={inputRef}
                    />
                </div>
            );
        case 3:
            return (
                <div className={`${styles.stepField} `}>
                    <label htmlFor="address" className={`${styles.accessibleLabel}`}>¿Cuál es tu DIRECCIÓN?</label>
                    <input
                        id="address"
                        name="address"
                        className={`${styles.accessibleInput}`}
                        value={formData.address}
                        onChange={onChange}
                        placeholder="Calle y número..."
                        autoComplete="off"
                        ref={inputRef}
                    />
                </div>
            );
        case 4:
            return (
                <div className={`${styles.stepField} `}>
                    <label htmlFor="dni" className={`${styles.accessibleLabel}`}>¿Cuál es tu DNI?</label>
                    <input
                        id="dni"
                        name="dni"
                        type="number"
                        inputMode="numeric"
                        className={`${styles.accessibleInput}`}
                        value={formData.dni}
                        onChange={onChange}
                        placeholder="Sólo números..."
                        autoComplete="off"
                        ref={inputRef}
                    />
                </div>
            );
        case 5:
            return (
                <div className={`${styles.stepField} `}>
                    <label htmlFor="phone" className={`${styles.accessibleLabel}`}>Tu TELÉFONO es:</label>
                    <input
                        id="phone"
                        name="phone"
                        className={`${styles.accessibleInput} ${styles.accessibleInputDisabled}`}
                        value={formData.phone}
                        readOnly
                        disabled
                    />
                </div>
            );
        default:
            return null;
    }
};

const PublicRegisterPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { request, loading } = useFetch();
    const inputRef = React.useRef(null);
    
    const [step, setStep] = useState(1);

    React.useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [step]);
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        address: '',
        dni: '',
        phone: searchParams.get('phone') || ''
    });
    
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const totalSteps = 5;

    const updateRegisterData = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const nextStep = () => {
        // Validation for each step
        if (step === 1 && !formData.firstName) return;
        if (step === 2 && !formData.lastName) return;
        if (step === 3 && !formData.address) return;
        if (step === 4 && !formData.dni) return;
        setStep(prev => prev + 1);
    };

    const prevStep = () => setStep(prev => prev - 1);

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setError(null);
        
        try {
            const submitData = {
                fullName: `${formData.firstName} ${formData.lastName}`.trim(),
                dni: formData.dni,
                phone: formData.phone,
                street_name: formData.address
            };
            await request('auth/public-register', 'POST', submitData);
            setSuccess(true);
            setTimeout(() => navigate('/'), 5000);
        } catch (err) {
            setError(err.message || 'Error al guardar. Verifique los datos.');
            setStep(4); // Back to DNI on error
        }
    };

    return (
        <div className={`${styles.publicRegisterPaginated}`}>
            {success ? (
                <div className={`${styles.successCard} step-card `}>
                    <span className={`${styles.successEmoji}`}>✅</span>
                    <h1 className={`${styles.accessibleTitle}`}>¡Todo Listo!</h1>
                    <p className={`${styles.accessibleText}`}>Tus datos se guardaron correctamente.</p>
                    <p className={`${styles.accessibleSubtext}`}>Ya podés cerrar esta página y volver al WhatsApp.</p>
                </div>
            ) : (
                <>
                    <div className={`${styles.stepHeader}`}>
                        <div className={`${styles.progressText}`}>Paso {step} de {totalSteps}</div>
                        <div className={`${styles.progressBar}`}>
                            <div className={`${styles.progressFill}`} style={{ width: `${(step / totalSteps) * 100}%` }}></div>
                        </div>
                    </div>

                    <section className={`${styles.stepContainer}`}>
                        {error && <div className={`${styles.accessibleError}`}>{error}</div>}
                        
                        <StepField step={step} formData={formData} onChange={updateRegisterData} inputRef={inputRef} />

                        <footer className={`${styles.stepFooter}`}>
                            {step > 1 && (
                                <button className={`${styles.btnHuge} ${styles.btnHugeSecondary}`} onClick={prevStep} disabled={loading}>
                                    ATRÁS
                                </button>
                            )}
                            
                            {step < totalSteps ? (
                                <button className={`${styles.btnHuge} ${styles.btnHugePrimary}`} onClick={nextStep}>
                                    SIGUIENTE
                                </button>
                            ) : (
                                <button className={`${styles.btnHuge} ${styles.btnHugeSuccess}`} onClick={handleSubmit} disabled={loading}>
                                    {loading ? 'GUARDANDO...' : 'FINALIZAR'}
                                </button>
                            )}
                        </footer>
                    </section>
                </>
            )}
        </div>
    );
};

export default PublicRegisterPage;
