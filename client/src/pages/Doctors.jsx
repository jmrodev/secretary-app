import React from 'react';
import { useDoctorsPageController } from '../controllers/useDoctorsPageController';
import Button from '../components/atoms/Button';
import Loading from '../components/atoms/Loading';
import Icon from '../components/atoms/Icon';
import MainLayout from '../components/templates/MainLayout';
import DoctorCard from '../components/molecules/DoctorCard';
import DoctorEditModal from '../components/organisms/DoctorEditModal';
import SearchBar from '../components/molecules/SearchBar';
import './Doctors.css';

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

    return (
        <MainLayout wide>
            <div className="doctors-page">
                <header className="page-header">
                    <div className="page-header__info">
                        <h1 className="page-header__title">{t('doctors_title')}</h1>
                        <p className="page-header__subtitle">{t('doctors_subtitle') || 'Administra el personal médico y sus configuraciones.'}</p>
                    </div>
                </header>

                {loading ? (
                    <Loading variant="centered" text={t('loading_doctors') || "Cargando médicos..."} />
                ) : (
                    <>
                        <section className="action-bar">
                            <div className="action-bar__search">
                                <SearchBar
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder={t('search_doctors_placeholder')}
                                />
                            </div>
                            <div className="action-bar__tools">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={handlers.fetchDoctors}
                                    icon={<Icon name="SYNC" size="1.2rem" />}
                                >
                                    {t('refresh') || 'Actualizar'}
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => handlers.onEditDoctor(null)}
                                    icon={<Icon name="ADD" size="1.2rem" />}
                                >
                                    {t('new') || 'Nuevo'}
                                </Button>
                            </div>
                        </section>

                        <div className="doctors-page__content animate-fadeIn">
                            <div className="doctors-page__grid">
                                {filteredDoctors.length === 0 ? (
                                    <div className="doctors-page__empty-state">
                                        <div className="doctors-page__empty-icon">
                                            <Icon name="DOCTOR" size="3rem" />
                                        </div>
                                        <p className="doctors-page__empty-text">{t('no_doctors_found')}</p>
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
                    </>
                )}

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
            </div>
        </MainLayout>
    );
};

export default Doctors;
