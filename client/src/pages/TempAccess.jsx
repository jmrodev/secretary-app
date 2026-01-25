import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import PatientForm from '../components/organisms/PatientForm';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';

const TempAccess = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const { alert } = useModal();

    const [loading, setLoading] = useState(true);
    const [isValid, setIsValid] = useState(false);
    const [isNew, setIsNew] = useState(false);
    const [initialData, setInitialData] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [insurances, setInsurances] = useState([]);

    useEffect(() => {
        const verify = async () => {
            try {
                const [resVerify, resInsurances] = await Promise.all([
                    api.get(`/temp-access/verify/${token}`),
                    api.get('/insurances')
                ]);

                setIsValid(resVerify.data.valid);
                setIsNew(resVerify.data.isNew);
                if (resVerify.data.patient) {
                    setInitialData(resVerify.data.patient);
                }
                setInsurances(resInsurances.data);
            } catch (err) {
                console.error(err);
                setError('El enlace es inválido o ha expirado.');
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [token]);

    const handleSubmit = async (formData) => {
        try {
            await api.post(`/temp-access/complete/${token}`, formData);
            setSuccess(true);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.error || "Error al guardar los datos.");
        }
    };

    if (loading) return <div className="p-4 text-center">Cargando...</div>;
    if (error) return <div className="p-4 text-center text-red-600 font-bold">{error}</div>;

    if (success) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="card max-w-md w-full text-center p-8">
                    <div className="text-5xl mb-4">✅</div>
                    <h2 className="title text-xl mb-2">¡Datos Guardados!</h2>
                    <p className="text-main-600">
                        Gracias por completar tu información.
                        Ya puedes cerrar esta ventana y devolver el dispositivo o esperar a ser llamado.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 p-4">
            <div className="max-w-xl mx-auto">
                <div className="card bg-white shadow-lg">
                    <div className="text-center mb-6 pt-4">
                        <h1 className="title text-xl text-primary-600">
                            {isNew ? 'Registro de Paciente' : 'Actualizar mis Datos'}
                        </h1>
                        <p className="text-sm text-main-500">
                            Por favor completa los siguientes campos.
                        </p>
                    </div>

                    <PatientForm
                        initialValues={initialData}
                        onSubmit={handleSubmit}
                        isEdit={!isNew}
                        isAdmin={false}
                        insurances={insurances}
                    />
                </div>
            </div>
        </div>
    );
};

export default TempAccess;

