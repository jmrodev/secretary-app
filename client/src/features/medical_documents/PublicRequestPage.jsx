import React from 'react';
import { usePublicPrescriptionRequestController } from '../../controllers/usePublicPrescriptionRequestController';
import StatusDisplay from '../../components/molecules/StatusDisplay';
import Button from '../../components/atoms/Button';
import Icon from '../../components/atoms/Icon';
import './PublicRequestPage.css';

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
        <div className="public-prescription">
            <div className="public-prescription__container">
                <header className="public-prescription__header">
                    <div className="public-prescription__icon-wrapper">
                        <Icon name="PRESCRIPTION" size="2rem" />
                    </div>
                    <h1 className="public-prescription__title">Solicitud de Recetas</h1>
                    <p className="public-prescription__subtitle">
                        Paciente: <span className="public-prescription__patient-name">{patientInfo?.patientName}</span>
                    </p>
                </header>

                {error && patientInfo && (
                    <div className="public-prescription__error-banner animate-fadeIn">
                        <p className="public-prescription__error-text">
                            <Icon name="WARNING" className="mr-1" /> {error}
                        </p>
                    </div>
                )}

                {patientInfo?.recentMeds?.length > 0 && (
                    <section className="public-prescription__section">
                        <h2 className="public-prescription__section-title">
                            <Icon name="HISTORY" size="1.2rem" className="mr-2" />
                            Medicación Reciente
                        </h2>
                        <div className="med-chip-grid">
                            {patientInfo.recentMeds.map((med, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => handleToggleMedSelection(med)}
                                    className={`med-chip ${selectedMeds.includes(med) ? 'med-chip--active' : ''}`}
                                    title={med}
                                >
                                    {med}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {selectedMeds.length > 0 && (
                    <section className="public-prescription__section animate-fadeIn">
                        <h2 className="public-prescription__section-title">
                            <Icon name="CHECK" size="1.2rem" className="mr-2" />
                            Seleccionados ({selectedMeds.length})
                        </h2>
                        <ul className="selected-list list-none">
                            {selectedMeds.map((med, idx) => (
                                <li key={idx} className="selected-item">
                                    <span className="selected-item__name">{med}</span>
                                    <button
                                        onClick={() => handleToggleMedSelection(med)}
                                        className="selected-item__remove"
                                        title="Quitar"
                                    >
                                        ✕
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="public-prescription__section">
                    <h2 className="public-prescription__section-title">
                        <Icon name="SEARCH" size="1.2rem" className="mr-2" />
                        Buscar otra medicación
                    </h2>
                    <div className="search-wrapper">
                        <input
                            type="text"
                            placeholder="Ej: Losartan, Atenolol..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searching && <div className="search-spinner"></div>}
                    </div>

                    {searchResults.length > 0 && (
                        <div className="search-results scrollbar-hide">
                            {searchResults.map((res) => (
                                <button
                                    key={res.id}
                                    onClick={() => handleToggleMedSelection(res.full_label)}
                                    className="search-result-item"
                                >
                                    <span className="search-result-item__name">{res.name}</span>
                                    <span className="search-result-item__desc">{res.presentation} - {res.drug}</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {searchTerm.length >= 3 && !searching && searchResults.length === 0 && (
                        <div className="empty-state">
                            <p className="empty-state__text">¿No encuentras lo que buscas? Puedes agregarlo manualmente:</p>
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

                <section className="public-prescription__section">
                    <h2 className="public-prescription__section-title">
                        <Icon name="NOTES" size="1.2rem" className="mr-2" />
                        Notas (Opcional)
                    </h2>
                    <textarea
                        className="input-field"
                        style={{ minHeight: '120px' }}
                        placeholder="Ej: Retiro por secretaría el miércoles..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                </section>

                <div className="public-prescription__footer">
                    <Button
                        variant="primary"
                        size="lg"
                        className="w-full btn--submit"
                        disabled={selectedMeds.length === 0 || loading}
                        onClick={handleSubmit}
                        icon={<Icon name="SEND" size="1.2rem" />}
                    >
                        {loading ? 'Enviando...' : 'Enviar Solicitud'}
                    </Button>
                    <p className="public-prescription__brand">
                        Sistema Seguro de Gestión Médica • CIMA
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PublicRequestPage;
