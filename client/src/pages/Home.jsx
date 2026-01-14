import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const Home = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    const copyLink = (path = '') => {
        const url = `${window.location.origin}${path}`;
        navigator.clipboard.writeText(url);
        alert(`¡Enlace copiado!: ${url}`);
    };

    return (
        <div className="home-landing">
            <div className="landing-overlay"></div>

            <div className="landing-content">
                <header className="landing-header">
                    <div className="pulse-logo">🏥</div>
                    <h1>Clínica <span className="highlight">CIMA</span></h1>
                    <p className="tagline">Gestión Médica de Alta Precisión</p>
                </header>

                <div className="landing-grid">
                    {/* Professional Entry */}
                    <div className="landing-card staff-card">
                        <div className="card-click-area" onClick={() => navigate('/login')}>
                            <div className="card-icon">👨‍⚕️</div>
                            <h3>{t('staff_access') || 'Acceso Profesional'}</h3>
                            <p>Ingreso exclusivo para médicos y personal de administración.</p>
                        </div>
                        <div className="card-actions">
                            <button className="btn-glass" onClick={() => navigate('/login')}>Ingresar</button>
                        </div>
                    </div>

                    {/* Patient Entry */}
                    <div className="landing-card patient-card">
                        <div className="card-icon">📱</div>
                        <h3>{t('patient_portal') || 'Portal de Pacientes'}</h3>
                        <p>
                            El acceso al portal es mediante un **enlace directo o código QR** proporcionado por el consultorio.
                            <br /><br />
                            Si ya tienes tu enlace, ábrelo en tu navegador para continuar con tu gestión.
                        </p>
                    </div>
                </div>

                <footer className="landing-footer">
                    <p>&copy; 2026 Clínica CIMA | Tandil, Argentina</p>
                    <div className="version-tag">Premium v1.9.3</div>
                </footer>
            </div>
        </div>
    );
};

export default Home;
