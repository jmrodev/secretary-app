
import React from 'react';
import MainLayout from '../components/templates/MainLayout';
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
        handleDelete,
        t
    } = useInsurancesController();

    return (
        <MainLayout
            title={t('insurances') || 'Obras Sociales'}
            subtitle={t('insurances_subtitle') || 'Gestione las obras sociales y prepagas del sistema.'}
        >
            <div className="flex justify-between items-center mb-8">
                <div className="action-bar__search flex-1 max-w-lg">
                    <div className="search-box__wrapper">
                        <span className="search-box__icon">🔍</span>
                        <input
                            type="text"
                            placeholder={t('search_insurances_placeholder') || 'Buscar por nombre, CUIT o web...'}
                            className="search-box__input"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button className="search-box__clear" onClick={() => setSearchTerm('')}>✕</button>
                        )}
                    </div>
                </div>
                <div className="page-header__actions ml-4">
                    <Button onClick={handleOpenCreate}>
                        + {t('new_insurance') || 'Nueva Obra Social'}
                    </Button>
                </div>
            </div>

            <div className="tab-content animate-fadeIn">
                <InsuranceList
                    insurances={filteredInsurances}
                    loading={loading}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                    hasFilter={searchTerm !== ''}
                />
            </div>

            <InsuranceFormModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSubmit={handleSubmit}
                formData={formData}
                setFormData={setFormData}
                isEditing={!!editingId}
            />
        </MainLayout>
    );
};

export default Insurances;
