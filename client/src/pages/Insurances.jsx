import React from 'react';
import Sidebar from '../components/organisms/Sidebar';
import Button from '../components/atoms/Button';
import InsuranceList from '../components/organisms/InsuranceList';
import InsuranceFormModal from '../components/organisms/InsuranceFormModal';
import { useInsurancesController } from '../controllers/useInsurancesController';

const Insurances = () => {
    const {
        filteredInsurances,
        loading,
        searchTerm,
        modalOpen,
        editingId,
        formData,
        setSearchTerm,
        setModalOpen,
        setFormData,
        handleOpenCreate,
        handleOpenEdit,
        handleSubmit,
        handleDelete
    } = useInsurancesController();

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">
                <div className="flex-between-center mb-10">
                    <div className="page-header-minimal">
                        <p className="subtitle mb-0">Gestione las obras sociales y prepagas del sistema</p>
                    </div>
                    <Button className="shadow-lg hover:shadow-xl transition-all" onClick={handleOpenCreate}>
                        + Nueva Obra Social
                    </Button>
                </div>

                {/* Search Bar - Standard Style */}
                <div className="search-bar-container mb-10">
                    <div className="search-wrapper">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Buscar por nombre, CUIT o web..."
                            className="search-bar-input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <Button variant="ghost" className="search-clear" onClick={() => setSearchTerm('')}>✕</Button>
                        )}
                    </div>
                </div>

                <InsuranceList
                    insurances={filteredInsurances}
                    loading={loading}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    hasFilter={searchTerm !== ''}
                />

                <InsuranceFormModal
                    isOpen={modalOpen}
                    onClose={() => setModalOpen(false)}
                    onSubmit={handleSubmit}
                    formData={formData}
                    setFormData={setFormData}
                    isEditing={!!editingId}
                />
            </main>
        </div>
    );
};

export default Insurances;
