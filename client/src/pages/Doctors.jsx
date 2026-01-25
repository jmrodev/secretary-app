
import React from 'react';
import { useDoctorsPageController } from '../hooks/useDoctorsPageController';

// Atomic Design Components
import Input from '../components/atoms/Input';
import Card from '../components/atoms/Card';
import Sidebar from '../components/organisms/Sidebar';

// New Extracted Components
import DoctorCard from '../components/molecules/DoctorCard';
import DoctorEditModal from '../components/organisms/DoctorEditModal';

const Doctors = () => {
    // 1. Controller Hook manages all state and logic
    const {
        t,
        currentUser,
        loading,
        searchTerm, setSearchTerm,
        filteredDoctors,
        modalState,
        handlers,
        settings // Needed for passing to modal
    } = useDoctorsPageController();

    if (loading) return <div className="p-8 text-center">{t('loading')}</div>;

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="title">{t('doctors_title')}</h1>
                        <p className="text-muted">Administra el personal médico y sus configuraciones.</p>
                    </div>
                </div>

                <Card className="mb-6">
                    <div className="max-w-[400px]">
                        <Input
                            placeholder={t('search_doctors_placeholder')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredDoctors.length === 0 ? (
                        <p className="text-muted col-span-full text-center py-8">{t('no_doctors_found')}</p>
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

                        t={t}
                    />
                )}
            </main>
        </div>
    );
};

export default Doctors;
