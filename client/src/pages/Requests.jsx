import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import RequirementsList from '../components/RequirementsList';
import Sidebar from '../components/Sidebar';

const Requests = () => {
    const { user, logout } = useAuth();
    const { t, toggleLanguage, language } = useLanguage();

    return (
        <div className="app-layout">
            <Sidebar />

            <main className="main-content">
                <header className="mb-8">
                    <h1 className="title">{t('requests_workflow')}</h1>
                </header>

                <div className="card">
                    <RequirementsList user={user} />
                </div>
            </main>
        </div>
    );
};

export default Requests;
