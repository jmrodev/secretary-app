
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
        handlers,
        t
    } = useInsurancesController();

    const {
        handleOpenCreate,
        handleOpenEdit,
        handleSubmit,
        handleDelete,
    } = handlers;

    return (
        <MainLayout
            title={t('insurances') || 'Obras Sociales'}
            subtitle={t('insurances_subtitle') || 'Gestione las obras sociales y prepagas del sistema.'}
        >
            <section className="action-bar mb-8">
                <div className="action-bar__search">
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
                <div className="action-bar__tools">
                    <Button variant="ghost" onClick={handlers.fetchInsurances || (() => window.location.reload())}>🔄</Button>
                    <Button variant="primary" onClick={handleOpenCreate}>
                        ✨ {t('new_insurance') || 'Nueva Obra Social'}
                    </Button>
                </div>
            </section>

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
