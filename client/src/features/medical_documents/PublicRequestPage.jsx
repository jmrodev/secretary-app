import React from 'react';
import { usePublicPrescriptionRequestController } from '@/features/medical_documents/hooks/usePublicPrescriptionRequestController';
import StatusDisplay from '@/components/molecules/StatusDisplay';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Loading from '@/components/atoms/Loading';
import styles from './PublicRequestPage.module.css';

/**
 * PublicRequestPage (Orchestrator).
 * Patient-facing portal for requesting prescriptions.
 */
const PublicRequestPage = () => {
    const {
        loading,
        error,
        success,
        patientInfo,
        selectedMeds,
        notes,
        searchTerm,
        searchResults,
        searching,
        handlers
    } = usePublicPrescriptionRequestController();
    const {
        setNotes,
        setSearchTerm,
        handleToggleMedSelection,
        handleAddManualMed,
        handleSubmit
    } = handlers;

    if (loading && !patientInfo) return <StatusDisplay type="loading" message="Cargando..." />;
    if (error && !patientInfo) return <StatusDisplay type="error" title="Error" message={error} />;
    if (success) return <StatusDisplay type="success" title="¡Solicitud Enviada!" message="Tu médico recibirá la solicitud. Te notificaremos cuando las recetas estén listas." />;

    return (
        <div className={`${styles.root}`}>
            <div className={`${styles.container}`}>
                <header className={`${styles.header}`}>
                    <div className={`${styles.iconWrapper}`}>
                        <Icon name="PRESCRIPTION" size="2rem" />
                    </div>
                    <h1 className={`${styles.title}`}>Solicitud de Recetas</h1>
                    <p className={`${styles.subtitle}`}>
                        Paciente: <span className={`${styles.patientName}`}>{patientInfo?.patientName}</span>
                    </p>
                </header>

                {error && patientInfo && (
                    <div className={`${styles.errorBanner} `}>
                        <p className={`${styles.errorText}`}>
                            <Icon name="WARNING" className="mr-1" /> {error}
                        </p>
                    </div>
                )}

                {patientInfo?.recentMeds?.length > 0 && (
                    <section className={`${styles.section}`}>
                        <h2 className={`${styles.sectionTitle}`}>
                            <Icon name="HISTORY" size="1.2rem" className="mr-2" />
                            Medicación Reciente
                        </h2>
                        <div className={`${styles.medChipGrid}`}>
                            {patientInfo.recentMeds.map((med) => (
                                <Button
                                    key={med}
                                    onClick={() => handleToggleMedSelection(med)}
                                    className={`${styles.medChip} ${selectedMeds.includes(med) ? styles.medChipActive : ''}`}
                                    title={med}
                                    unstyled
                                >
                                    {med}
                                </Button>
                            ))}
                        </div>
                    </section>
                )}

                {selectedMeds.length > 0 && (
                    <section className={`${styles.section} `}>
                        <h2 className={`${styles.sectionTitle}`}>
                            <Icon name="CHECK" size="1.2rem" className="mr-2" />
                            Seleccionados ({selectedMeds.length})
                        </h2>
                        <ul className={`${styles.selectedList} list-none`}>
                            {selectedMeds.map((med) => (
                                <li key={med} className={`${styles.selectedItem}`}>
                                    <span className={`${styles.name}`}>{med}</span>
                                    <Button
                                        onClick={() => handleToggleMedSelection(med)}
                                        className={`${styles.remove}`}
                                        title="Quitar"
                                        unstyled
                                        icon={<Icon name="close" />}
                                        aria-label="Quitar"
                                    >
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className={`${styles.section}`}>
                    <h2 className={`${styles.sectionTitle}`}>
                        <Icon name="SEARCH" size="1.2rem" className="mr-2" />
                        Buscar otra medicación
                    </h2>
                    <div className={`${styles.searchWrapper}`}>
                        <input
                            type="text"
                            placeholder="Ej: Losartan, Atenolol..."
                            className={`${styles.searchInput}`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searching && <Loading variant="inline" size="sm" />}
                    </div>

                    {searchResults.length > 0 && (
                        <div className={`${styles.searchResults} scrollbar-hide`}>
                            {searchResults.map((res) => (
                                <Button
                                    key={res.id}
                                    onClick={() => handleToggleMedSelection(res.full_label)}
                                    className={`${styles.searchResultItem}`}
                                    unstyled
                                >
                                    <span className={`${styles.name}`}>{res.name}</span>
                                    <span className={`${styles.desc}`}>{res.presentation} - {res.drug}</span>
                                </Button>
                            ))}
                        </div>
                    )}

                    {searchTerm.length >= 3 && !searching && searchResults.length === 0 && (
                        <div className={`${styles.emptyState}`}>
                            <p className={`${styles.text}`}>¿No encuentras lo que buscas? Puedes agregarlo manualmente:</p>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleAddManualMed}
                                icon={<Icon name="ADD" size="1rem" />}
                            >
                                Agregar "{searchTerm}"
                            </Button>
                        </div>
                    )}
                </section>

                <section className={`${styles.section}`}>
                    <h2 className={`${styles.sectionTitle}`}>
                        <Icon name="NOTES" size="1.2rem" className="mr-2" />
                        Notas (Opcional)
                    </h2>
                    <textarea
                        className="public-prescription__notes-field"
                        placeholder="Ej: Retiro por secretaría el miércoles..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                </section>

                <div className={`${styles.footer}`}>
                    <Button
                        variant="primary"
                        size="lg"
                        className={`${styles.btnSubmit} w-full`}
                        disabled={selectedMeds.length === 0 || loading}
                        onClick={handleSubmit}
                        icon={<Icon name="SEND" size="1.2rem" />}
                    >
                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                    </Button>
                    <p className={`${styles.brand}`}>
                        Sistema Seguro de Gestión Médica • CIMA
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PublicRequestPage;
