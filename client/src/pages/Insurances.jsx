
import React from 'react';
import MainLayout from '../components/templates/MainLayout';
import Button from '../components/atoms/Button';
import Loading from '../components/atoms/Loading';
import SearchBar from '../components/molecules/SearchBar';
import InsuranceList from '../components/organisms/InsuranceList';
import InsuranceFormModal from '../components/organisms/InsuranceFormModal';
import { useInsurancesController } from '../controllers/useInsurancesController';
import './Insurances.css';

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
            {loading ? (
                <Loading variant="centered" text={t('loading') || "Cargando..."} />
            ) : (
                <>
                    <section className="insurances__action-bar">
                        <div className="insurances__search-container">
                            <SearchBar
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                placeholder={t('search_insurances_placeholder') || 'Buscar por nombre, CUIT...'}
                                className="insurances__search-bar"
                            />
                        </div>
                        <div className="insurances__actions">
                            <Button variant="ghost" onClick={handlers.fetchInsurances || (() => window.location.reload())}>🔄</Button>
                            <Button variant="primary" onClick={handleOpenCreate}>
                                ✨ {t('new_insurance') || 'Nueva Obra Social'}
                            </Button>
                        </div>
                    </section>

                    <div className="insurances__content animate-fadeIn">
                        <InsuranceList
                            insurances={filteredInsurances}
                            onEdit={handleOpenEdit}
                            onDelete={handleDelete}
                            hasFilter={searchTerm !== ''}
                        />
                    </div>
                </>
            )}

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
