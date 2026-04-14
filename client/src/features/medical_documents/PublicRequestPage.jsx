import React from 'react';
import { usePublicPrescriptionRequestController } from '@/controllers/usePublicPrescriptionRequestController';
import StatusDisplay from '@/components/molecules/StatusDisplay';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './PublicRequestPage.css';

/**
 * PublicRequestPage (Orchestrator).
 * Patient-facing portal for requesting prescriptions.
 */
const PublicRequestPage = () => {
    const { t } = useLanguage();
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

    if (loading && !patientInfo) return <StatusDisplay type="loading" message={t('loading')} />;
    if (error && !patientInfo) return <StatusDisplay type="error" title={t('error')} message={error} />;
    if (success) return <StatusDisplay type="success" title={t('request_sent_title')} message={t('request_sent_message')} />;

    return (
        <div className="public-prescription">
            <div className="public-prescription__container">
                <header className="public-prescription__header">
                    <div className="public-prescription__icon-wrapper">
                        <Icon name="prescriptions" size="2rem" />
                    </div>
                    <h1 className="public-prescription__title">{t('prescription_request_title')}</h1>
                    <p className="public-prescription__subtitle">
                        {t('patient')}: <span className="public-prescription__patient-name">{patientInfo?.patientName}</span>
                    </p>
                </header>

                {error && patientInfo && (
                    <div className="public-prescription__error-banner animate-fadeIn">
                        <p className="public-prescription__error-text">
                            <Icon name="warning" className="mr-1" /> {error}
                        </p>
                    </div>
                )}

                {patientInfo?.recentMeds?.length > 0 && (
                    <section className="public-prescription__section">
                        <h2 className="public-prescription__section-title">
                            <Icon name="history" size="1.2rem" className="mr-2" />
                            {t('recent_medication')}
                        </h2>
                        <div className="med-chip-grid">
                            {patientInfo.recentMeds.map((med, idx) => (
                                <Button
                                    key={idx}
                                    variant="ghost"
                                    onClick={() => handleToggleMedSelection(med)}
                                    className={`med-chip ${selectedMeds.includes(med) ? 'med-chip--active' : ''}`}
                                    title={med}
                                >
                                    {med}
                                </Button>
                            ))}
                        </div>
                    </section>
                )}

                {selectedMeds.length > 0 && (
                    <section className="public-prescription__section animate-fadeIn">
                        <h2 className="public-prescription__section-title">
                            <Icon name="check" size="1.2rem" className="mr-2" />
                            {t('selected_items')} ({selectedMeds.length})
                        </h2>
                        <ul className="selected-list list-none">
                            {selectedMeds.map((med, idx) => (
                                <li key={idx} className="selected-item">
                                    <span className="selected-item__name">{med}</span>
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        onClick={() => handleToggleMedSelection(med)}
                                        className="selected-item__remove"
                                        title={t('remove')}
                                        icon={<Icon name="close" size="1.2rem" />}
                                    />
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className="public-prescription__section">
                    <h2 className="public-prescription__section-title">
                        <Icon name="search" size="1.2rem" className="mr-2" />
                        {t('search_other_medication')}
                    </h2>
                    <div className="search-wrapper">
                        <input
                            type="text"
                            placeholder={t('search_medication_placeholder')}
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searching && <div className="search-spinner"></div>}
                    </div>

                    {searchResults.length > 0 && (
                        <div className="search-results scrollbar-hide">
                            {searchResults.map((res) => (
                                <Button
                                    key={res.id}
                                    variant="ghost"
                                    onClick={() => handleToggleMedSelection(res.full_label)}
                                    className="search-result-item"
                                >
                                    <span className="search-result-item__name">{res.name}</span>
                                    <span className="search-result-item__desc">{res.presentation} - {res.drug}</span>
                                </Button>
                            ))}
                        </div>
                    )}

                    {searchTerm.length >= 3 && !searching && searchResults.length === 0 && (
                        <div className="empty-state">
                            <p className="empty-state__text">{t('medication_not_found_manual')}</p>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleAddManualMed}
                                icon={<Icon name="add" size="1rem" />}
                            >
                                {t('add_manual')} "{searchTerm}"
                            </Button>
                        </div>
                    )}
                </section>

                <section className="public-prescription__section">
                    <h2 className="public-prescription__section-title">
                        <Icon name="notes" size="1.2rem" className="mr-2" />
                        {t('notes_optional')}
                    </h2>
                    <textarea
                        className="input-field public-prescription__notes"
                        placeholder={t('prescription_notes_placeholder')}
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
                        icon={<Icon name="send" size="1.2rem" />}
                    >
                        {loading ? t('sending') : t('send_request')}
                    </Button>
                    <p className="public-prescription__brand">
                        {t('secure_system_footer')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PublicRequestPage;
