import React from 'react';
import Sidebar from '../components/organisms/Sidebar';
import Button from '../components/atoms/Button';
import InstitutionList from '../components/organisms/InstitutionList';
import InstitutionFinances from '../components/organisms/InstitutionFinances';
import InstitutionFormModal from '../components/organisms/InstitutionFormModal';
import { useInstitutionsController } from '../hooks/useInstitutionsController';

const Institutions = () => {
    const {
        institutions,
        loading,
        activeTab,
        setActiveTab,
        isFormModalOpen,
        editingInstitution,
        formData,
        handleOpenFormModal,
        handleCloseFormModal,
        handleFormSubmit,
        handleDelete,
        handleInputChange
    } = useInstitutionsController();

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="title">🏢 Instituciones</h1>
                    <div className="flex gap-2 items-center">
                        {/* Tabs */}
                        <div className="bg-slate-200 p-1 rounded-lg flex text-sm shadow-inner">
                            <Button
                                variant="ghost"
                                className={`px-4 py-1 rounded-md transition-all ${activeTab === 'list' ? 'bg-white shadow text-main-800 font-bold' : 'text-main-600 hover:text-main-800'}`}
                                onClick={() => setActiveTab('list')}
                            >
                                Listado
                            </Button>
                            <Button
                                variant="ghost"
                                className={`px-4 py-1 rounded-md transition-all ${activeTab === 'finances' ? 'bg-white shadow text-main-800 font-bold' : 'text-main-600 hover:text-main-800'}`}
                                onClick={() => setActiveTab('finances')}
                            >
                                📊 Finanzas
                            </Button>
                        </div>

                        {activeTab === 'list' && (
                            <Button className="ml-4 shadow-sm" onClick={() => handleOpenFormModal()}>
                                + Nueva Institución
                            </Button>
                        )}
                    </div>
                </div>

                {activeTab === 'list' ? (
                    <InstitutionList
                        institutions={institutions}
                        loading={loading}
                        onEdit={handleOpenFormModal}
                        onDelete={handleDelete}
                    />
                ) : (
                    <InstitutionFinances institutions={institutions} />
                )}

                <InstitutionFormModal
                    isOpen={isFormModalOpen}
                    onClose={handleCloseFormModal}
                    onSubmit={handleFormSubmit}
                    formData={formData}
                    onChange={handleInputChange}
                    isEditing={!!editingInstitution}
                />
            </main>
        </div>
    );
};

export default Institutions;
