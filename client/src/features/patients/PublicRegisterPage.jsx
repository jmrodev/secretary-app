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
                <div className={`${styles.PublicRegisterPage__stepField} `}>
                    <label htmlFor="firstName" className={`${styles.PublicRegisterPage__accessibleLabel}`}>¿Cuál es tu NOMBRE?</label>
                    <input
                        id="firstName"
                        name="firstName"
                        className={`${styles.PublicRegisterPage__accessibleInput}`}
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
                <div className={`${styles.PublicRegisterPage__stepField} `}>
                    <label htmlFor="lastName" className={`${styles.PublicRegisterPage__accessibleLabel}`}>¿Cuál es tu APELLIDO?</label>
                    <input
                        id="lastName"
                        name="lastName"
                        className={`${styles.PublicRegisterPage__accessibleInput}`}
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
                <div className={`${styles.PublicRegisterPage__stepField} `}>
                    <label htmlFor="address" className={`${styles.PublicRegisterPage__accessibleLabel}`}>¿Cuál es tu DIRECCIÓN?</label>
                    <input
                        id="address"
                        name="address"
                        className={`${styles.PublicRegisterPage__accessibleInput}`}
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
                <div className={`${styles.PublicRegisterPage__stepField} `}>
                    <label htmlFor="dni" className={`${styles.PublicRegisterPage__accessibleLabel}`}>¿Cuál es tu DNI?</label>
                    <input
                        id="dni"
                        name="dni"
                        type="number"
                        inputMode="numeric"
                        className={`${styles.PublicRegisterPage__accessibleInput}`}
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
                <div className={`${styles.PublicRegisterPage__stepField} `}>
                    <label htmlFor="phone" className={`${styles.PublicRegisterPage__accessibleLabel}`}>Tu TELÉFONO es:</label>
                    <input
                        id="phone"
                        name="phone"
                        className={`${styles.PublicRegisterPage__accessibleInput} ${styles.PublicRegisterPage__accessibleInputDisabled}`}
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

export const PublicRegisterPage = () => {
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
        <div className={`${styles.PublicRegisterPage__publicRegisterPaginated}`}>
            {success ? (
                <div className={`${styles.PublicRegisterPage__successCard} step-card `}>
                    <span className={`${styles.PublicRegisterPage__successEmoji}`}>✅</span>
                    <h1 className={`${styles.PublicRegisterPage__accessibleTitle}`}>¡Todo Listo!</h1>
                    <p className={`${styles.PublicRegisterPage__accessibleText}`}>Tus datos se guardaron correctamente.</p>
                    <p className={`${styles.PublicRegisterPage__accessibleSubtext}`}>Ya podés cerrar esta página y volver al WhatsApp.</p>
                </div>
            ) : (
                <>
                    <div className={`${styles.PublicRegisterPage__stepHeader}`}>
                        <div className={`${styles.PublicRegisterPage__progressText}`}>Paso {step} de {totalSteps}</div>
                        <div className={`${styles.PublicRegisterPage__progressBar}`}>
                            <div className={`${styles.PublicRegisterPage__progressFill}`} style={{ width: `${(step / totalSteps) * 100}%` }}></div>
                        </div>
                    </div>

                    <section className={`${styles.PublicRegisterPage__stepContainer}`}>
                        {error && <div className={`${styles.PublicRegisterPage__accessibleError}`}>{error}</div>}
                        
                        <StepField step={step} formData={formData} onChange={updateRegisterData} inputRef={inputRef} />

                        <footer className={`${styles.PublicRegisterPage__stepFooter}`}>
                            {step > 1 && (
                                <button className={`${styles.PublicRegisterPage__btnHuge} ${styles.PublicRegisterPage__btnHugeSecondary}`} onClick={prevStep} disabled={loading}>
                                    ATRÁS
                                </button>
                            )}
                            
                            {step < totalSteps ? (
                                <button className={`${styles.PublicRegisterPage__btnHuge} ${styles.PublicRegisterPage__btnHugePrimary}`} onClick={nextStep}>
                                    SIGUIENTE
                                </button>
                            ) : (
                                <button className={`${styles.PublicRegisterPage__btnHuge} ${styles.PublicRegisterPage__btnHugeSuccess}`} onClick={handleSubmit} disabled={loading}>
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

