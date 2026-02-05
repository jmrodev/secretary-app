
import React from 'react';
import { useDoctorsPageController } from '../controllers/useDoctorsPageController';
import Card from '../components/atoms/Card';
import Button from '../components/atoms/Button';
import MainLayout from '../components/templates/MainLayout';
import DoctorCard from '../components/molecules/DoctorCard';
import DoctorEditModal from '../components/organisms/DoctorEditModal';

const Doctors = () => {
    const {
        t,
        currentUser,
        loading,
        searchTerm, setSearchTerm,
        filteredDoctors,
        modalState,
        handlers,
        settings
    } = useDoctorsPageController();

    if (loading) return <div className="centered-loader"><div className="status-display__spinner"></div></div>;

    return (
        <MainLayout
            title={t('doctors_title')}
            subtitle={t('doctors_subtitle') || 'Administra el personal médico y sus configuraciones.'}
            actions={null} // Future: Add actions here if needed
        >
            <section className="action-bar">
                <div className="action-bar__search">
                    <div className="search-box__wrapper">
                        <span className="search-box__icon">🔍</span>
                        <input
                            type="text"
                            placeholder={t('search_doctors_placeholder')}
                            className="search-box__input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="action-bar__tools">
                    <Button variant="ghost" onClick={handlers.fetchDoctors}>🔄</Button>
                    <Button variant="primary" onClick={() => handlers.onEditDoctor(null)}>
                        ✨ {t('new') || 'Nuevo'}
                    </Button>
                </div>
            </section>

            <div className="tab-content animate-fadeIn">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredDoctors.length === 0 ? (
                        <div className="col-span-full card p-12 text-center border-dashed">
                            <p className="text-muted">{t('no_doctors_found')}</p>
                        </div>
                    ) : filteredDoctors.map(doctor => (
                        <DoctorCard
                            key={doctor.id}
                            doctor={doctor}
                            currentUser={currentUser}
                            onEdit={handlers.onEditDoctor}
                            t={t}
                        />
                    ))}
                </div>
            </div>

            {modalState.isOpen && (
                <DoctorEditModal
                    isOpen={modalState.isOpen}
                    onClose={handlers.onCloseModal}
                    activeTab={modalState.activeTab}
                    onTabChange={handlers.onTabChange}
                    data={modalState.data}
                    settings={settings}
                    onChangeData={handlers.onFormDataChange}
                    onSave={handlers.onSaveDoctor}

                    schedule={modalState.schedule}
                    setSchedule={handlers.onScheduleChange}
                    loadingSchedule={modalState.loadingSchedule}

                    connected={modalState.connected}
                    onConnectGoogle={handlers.onConnectGoogle}
                    onDisconnectGoogle={handlers.onDisconnectGoogle}
                    onVerifyGoogleEvents={handlers.onVerifyGoogleEvents}
                    onImportContacts={handlers.onImportContacts}
                    onResetSpreadsheet={handlers.onResetSpreadsheet}

                    t={t}
                />
            )}
        </MainLayout>
    );
};

export default Doctors;
