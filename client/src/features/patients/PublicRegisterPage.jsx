import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useFetch } from '@/hooks/useFetch';
import './PublicRegisterPage.css';

/**
 * PublicRegisterPage (Orchestrator).
 * Paginated form (one field at a time) for accessibility and mobile ease.
 * Focused on: Name, Surname, Address, DNI, Phone.
 */
const PublicRegisterPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { request, loading } = useFetch();
    
    const [step, setStep] = useState(1);
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

    const handleChange = (e) => {
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

    if (success) {
        return (
            <div className="public-register-paginated">
                <div className="step-card success-card animate-fadeIn">
                    <span className="success-emoji">✅</span>
                    <h1 className="accessible-title">¡Todo Listo!</h1>
                    <p className="accessible-text">Tus datos se guardaron correctamente.</p>
                    <p className="accessible-subtext">Ya podés cerrar esta página y volver al WhatsApp.</p>
                </div>
            </div>
        );
    }

    const renderStep = () => {
        switch(step) {
            case 1:
                return (
                    <div className="step-field animate-fadeIn">
                        <label className="accessible-label">¿Cuál es tu NOMBRE?</label>
                        <input
                            name="firstName"
                            className="accessible-input"
                            value={formData.firstName}
                            onChange={handleChange}
                            placeholder="Escribí tu nombre..."
                            autoFocus
                            autoComplete="off"
                        />
                    </div>
                );
            case 2:
                return (
                    <div className="step-field animate-fadeIn">
                        <label className="accessible-label">¿Cuál es tu APELLIDO?</label>
                        <input
                            name="lastName"
                            className="accessible-input"
                            value={formData.lastName}
                            onChange={handleChange}
                            placeholder="Escribí tu apellido..."
                            autoComplete="off"
                        />
                    </div>
                );
            case 3:
                return (
                    <div className="step-field animate-fadeIn">
                        <label className="accessible-label">¿Cuál es tu DIRECCIÓN?</label>
                        <input
                            name="address"
                            className="accessible-input"
                            value={formData.address}
                            onChange={handleChange}
                            placeholder="Calle y número..."
                            autoComplete="off"
                        />
                    </div>
                );
            case 4:
                return (
                    <div className="step-field animate-fadeIn">
                        <label className="accessible-label">¿Cuál es tu DNI?</label>
                        <input
                            name="dni"
                            type="number"
                            inputMode="numeric"
                            className="accessible-input"
                            value={formData.dni}
                            onChange={handleChange}
                            placeholder="Sólo números..."
                            autoComplete="off"
                        />
                    </div>
                );
            case 5:
                return (
                    <div className="step-field animate-fadeIn">
                        <label className="accessible-label">Tu TELÉFONO es:</label>
                        <input
                            name="phone"
                            className="accessible-input accessible-input--disabled"
                            value={formData.phone}
                            disabled
                        />
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="public-register-paginated">
            <div className="step-header">
                <div className="progress-text">Paso {step} de {totalSteps}</div>
                <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${(step / totalSteps) * 100}%` }}></div>
                </div>
            </div>

            <main className="step-container">
                {error && <div className="accessible-error">{error}</div>}
                
                {renderStep()}

                <footer className="step-footer">
                    {step > 1 && (
                        <button className="btn-huge btn-huge--secondary" onClick={prevStep} disabled={loading}>
                            ATRÁS
                        </button>
                    )}
                    
                    {step < totalSteps ? (
                        <button className="btn-huge btn-huge--primary" onClick={nextStep}>
                            SIGUIENTE
                        </button>
                    ) : (
                        <button className="btn-huge btn-huge--success" onClick={handleSubmit} disabled={loading}>
                            {loading ? 'GUARDANDO...' : 'FINALIZAR'}
                        </button>
                    )}
                </footer>
            </main>
        </div>
    );
};

export default PublicRegisterPage;
