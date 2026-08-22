import React from 'react';
import { usePublicPrescriptionRequestController } from '@/features/medical_documents/hooks/usePublicPrescriptionRequestController';
import { StatusDisplay } from '@/components/molecules/StatusDisplay';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Loading } from '@/components/atoms/Loading';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './PublicRequestPage.module.css';

/**
 * PublicRequestPage (Orchestrator).
 * Patient-facing portal for requesting prescriptions.
 */
export const PublicRequestPage = () => {
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
    if (success) return <StatusDisplay type="success" title={t('request_sent')} message={t('request_sent_message')} />;

    const selectedMedsSet = new Set(selectedMeds || []);

    return (
        <div className={`${styles.PublicRequestPage__root}`}>
            <div className={`${styles.PublicRequestPage__container}`}>
                <header className={`${styles.PublicRequestPage__header}`}>
                    <div className={`${styles.PublicRequestPage__iconWrapper}`}>
                        <Icon name="PRESCRIPTION" size="2rem" />
                    </div>
                    <h1 className={`${styles.PublicRequestPage__title}`}>{t('prescription_request')}</h1>
                    <p className={`${styles.PublicRequestPage__subtitle}`}>
                        {t('patient')}: <span className={`${styles.PublicRequestPage__patientName}`}>{patientInfo?.patientName}</span>
                    </p>
                </header>

                {error && patientInfo && (
                    <div className={`${styles.PublicRequestPage__errorBanner} `}>
                        <p className={`${styles.PublicRequestPage__errorText}`}>
                            <Icon name="WARNING" /> {error}
                        </p>
                    </div>
                )}

                {patientInfo?.recentMeds?.length > 0 && (
                    <section className={`${styles.PublicRequestPage__section}`}>
                        <h2 className={`${styles.PublicRequestPage__sectionTitle}`}>
                            <Icon name="HISTORY" size="1.2rem" className="mr-2" />
                            {t('recent_medication')}
                        </h2>
                        <div className={`${styles.PublicRequestPage__medChipGrid}`}>
                            {patientInfo.recentMeds.map((med) => (
                                <Button
                                    key={med}
                                    onClick={() => handleToggleMedSelection(med)}
                                    className={`${styles.PublicRequestPage__medChip} ${selectedMedsSet.has(med) ? styles.PublicRequestPage__medChipActive : ''}`}
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
                    <section className={`${styles.PublicRequestPage__section} `}>
                        <h2 className={`${styles.PublicRequestPage__sectionTitle}`}>
                            <Icon name="CHECK" size="1.2rem" className="mr-2" />
                            {t('selected')} ({selectedMeds.length})
                        </h2>
                        <ul className={`${styles.PublicRequestPage__selectedList} list-none`}>
                            {selectedMeds.map((med) => (
                                <li key={med} className={`${styles.PublicRequestPage__selectedItem}`}>
                                    <span className={`${styles.PublicRequestPage__name}`}>{med}</span>
                                    <Button
                                        onClick={() => handleToggleMedSelection(med)}
                                        className={`${styles.PublicRequestPage__remove}`}
                                        title={t('remove')}
                                        unstyled
                                        icon={<Icon name="close" />}
                                        aria-label={t('remove')}
                                    >
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}

                <section className={`${styles.PublicRequestPage__section}`}>
                    <h2 className={`${styles.PublicRequestPage__sectionTitle}`}>
                        <Icon name="SEARCH" size="1.2rem" className="mr-2" />
                        {t('search_other_medication')}
                    </h2>
                    <div className={`${styles.PublicRequestPage__searchWrapper}`}>
                        <label htmlFor="public-request-search" className={`${styles.PublicRequestPage__label}`}>
                            {t('search_medication')}
                        </label>
                        <input
                            id="public-request-search"
                            type="text"
                            placeholder={t('search_medication_placeholder')}
                            className={`${styles.PublicRequestPage__searchInput}`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searching && <Loading variant="inline" size="sm" />}
                    </div>

                    {searchResults.length > 0 && (
                        <div className={`${styles.PublicRequestPage__searchResults} scrollbar-hide`}>
                            {searchResults.map((res) => (
                                <Button
                                    key={res.id}
                                    onClick={() => handleToggleMedSelection(res.full_label)}
                                    className={`${styles.PublicRequestPage__searchResultItem}`}
                                    unstyled
                                >
                                    <span className={`${styles.PublicRequestPage__name}`}>{res.name}</span>
                                    <span className={`${styles.PublicRequestPage__desc}`}>{res.presentation} - {res.drug}</span>
                                </Button>
                            ))}
                        </div>
                    )}

                    {searchTerm.length >= 3 && !searching && searchResults.length === 0 && (
                        <div className={`${styles.PublicRequestPage__emptyState}`}>
                            <p className={`${styles.PublicRequestPage__text}`}>
                                {t('not_found_add_manually')}
                            </p>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={handleAddManualMed}
                                icon={<Icon name="ADD" size="1rem" />}
                            >
                                {t('add')} "{searchTerm}"
                            </Button>
                        </div>
                    )}
                </section>

                <section className={`${styles.PublicRequestPage__section}`}>
                    <h2 className={`${styles.PublicRequestPage__sectionTitle}`}>
                        <Icon name="NOTES" size="1.2rem" className="mr-2" />
                        {t('notes_optional')}
                    </h2>
                    <label htmlFor="public-request-notes" className={`${styles.PublicRequestPage__label}`}>
                        {t('instructions_notes')}
                    </label>
                    <textarea
                        id="public-request-notes"
                        className="public-prescription__notes-field"
                        placeholder={t('notes_placeholder_request')}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                </section>

                <div className={`${styles.PublicRequestPage__footer}`}>
                    <Button
                        variant="primary"
                        size="lg"
                        className={`${styles.PublicRequestPage__btnSubmit} w-full`}
                        disabled={selectedMeds.length === 0 || loading}
                        onClick={handleSubmit}
                        icon={<Icon name="SEND" size="1.2rem" />}
                    >
                        {loading ? (t('sending')) : (t('send_request'))}
                    </Button>
                    <p className={`${styles.PublicRequestPage__brand}`}>
                        {t('secure_medical_system')}
                    </p>
                </div>
            </div>
        </div>
    );
};

