import React from 'react';
import MainLayout from '../../components/templates/MainLayout';
import Button from '../../components/atoms/Button';
import Loading from '../../components/atoms/Loading';
import Icon from '../../components/atoms/Icon';
import { InstitutionFinances } from '../finances';
import { useInstitutionsController, InstitutionFormModal } from './index';

/**
 * InstitutionsPage (Orchestrator).
 * Manages institutional payers and agreements.
 */
const InstitutionsPage = () => {
    const {
        institutions,
        loading,
        isFormModalOpen,
        editingInstitution,
        formData,
        handlers,
        t
    } = useInstitutionsController();

    const {
        handleOpenFormModal,
        handleCloseFormModal,
        handleFormSubmit,
        handleDelete,
        handleInputChange,
    } = handlers;

    const [selectedInstId, setSelectedInstId] = React.useState('');
    const [viewMode, setViewMode] = React.useState('transactions');

    return (
        <div className="institutions-page-orchestrator">
            <header className="dashboard-header animate-fadeIn">
                <h1 className="dashboard-header__title">{t('institutions') || 'Instituciones'}</h1>
                <p className="dashboard-header__subtitle">{t('institutions_subtitle') || 'Gestiona instituciones pagadoras y convenios.'}</p>
            </header>

            {loading ? (
                <Loading variant="centered" text={t('loading') || "Cargando..."} />
            ) : (
                <div className="dashboard-grid animate-fadeIn">
                    <aside className="dashboard-sidebar">
                        <div className="dashboard-card">
                            <h3 className="dashboard-card__title">
                                <Icon name="build" size="1.2rem" />
                                {t('actions') || 'Acciones'}
                            </h3>
                            <div className="flex flex-col gap-3">
                                <Button
                                    variant="primary"
                                    className="justify-start w-full"
                                    onClick={() => handleOpenFormModal()}
                                    icon={<Icon name="add" size="1.1rem" />}
                                >
                                    {t('new_institution') || 'Nueva Institución'}
                                </Button>

                                {institutions.length > 0 && (
                                    <div className="flex flex-col gap-1" style={{ marginTop: '0.5rem' }}>
                                        <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>
                                            {t('institutions') || 'Instituciones'}
                                        </p>
                                        {institutions.map(inst => (
                                            <div
                                                key={inst.id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    borderRadius: 'var(--radius-sm)',
                                                    border: '1px solid',
                                                    borderColor: selectedInstId === String(inst.id) ? 'var(--accent-color)' : 'var(--border-color)',
                                                    background: selectedInstId === String(inst.id) ? 'var(--blue-50)' : 'white',
                                                    overflow: 'hidden'
                                                }}
                                            >
                                                <button
                                                    onClick={() => setSelectedInstId(String(inst.id))}
                                                    style={{
                                                        flex: 1,
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '0.5rem 0.6rem',
                                                        background: 'none',
                                                        border: 'none',
                                                        color: selectedInstId === String(inst.id) ? 'var(--accent-color)' : 'var(--text-main)',
                                                        fontWeight: selectedInstId === String(inst.id) ? 700 : 500,
                                                        cursor: 'pointer',
                                                        fontSize: '0.82rem',
                                                        textAlign: 'left',
                                                    }}
                                                >
                                                    <span style={{ flex: 1, lineHeight: 1.3, marginRight: '0.4rem' }}>{inst.name}</span>
                                                    {Number(inst.pending_count) > 0 && (
                                                        <span style={{
                                                            background: '#ef4444',
                                                            color: 'white',
                                                            borderRadius: '999px',
                                                            fontSize: '0.65rem',
                                                            fontWeight: 800,
                                                            padding: '0.1rem 0.4rem',
                                                            flexShrink: 0
                                                        }}>
                                                            {inst.pending_count}
                                                        </span>
                                                    )}
                                                </button>
                                                <div style={{ display: 'flex', borderLeft: '1px solid var(--border-color)', flexShrink: 0 }}>
                                                    <button
                                                        onClick={() => handleOpenFormModal(inst)}
                                                        title={t('edit')}
                                                        style={{ padding: '0.4rem 0.45rem', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--blue-500)', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Icon name="edit" size="0.9rem" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(inst.id)}
                                                        title={t('delete')}
                                                        style={{ padding: '0.4rem 0.45rem', cursor: 'pointer', background: 'none', border: 'none', color: 'var(--red-500)', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Icon name="delete" size="0.9rem" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>

                    <main className="dashboard-main">
                        <div className="dashboard-card no-padding">
                            <div className="institutions__content animate-fadeIn">
                                <InstitutionFinances
                                    institutions={institutions}
                                    selectedInstId={selectedInstId}
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    t={t}
                                />
                            </div>
                        </div>
                    </main>
                </div>
            )}

            <InstitutionFormModal
                isOpen={isFormModalOpen}
                onClose={handleCloseFormModal}
                onSubmit={handleFormSubmit}
                formData={formData}
                onChange={handleInputChange}
                isEditing={!!editingInstitution}
                t={t}
            />
        </div>
    );
};

export default InstitutionsPage;
