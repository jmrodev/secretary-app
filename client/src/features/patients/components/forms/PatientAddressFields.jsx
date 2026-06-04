import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import styles from './PatientAddressFields.module.css';

/**
 * PatientAddressFields Molecule (Sub-Executor).
 * Contains street, city, province, country and notes with Google Maps integration.
 * Optimized for Bento Box layout.
 */
const PatientAddressFields = ({ formData, updatePatientData, t }) => {
    return (
        <article className={`${styles.root}`}>
            <header className={`${styles.header}`}>
                <Icon name="location_on" size="1.25rem" />
                <h3 className={`${styles.title}`}>{t('geographic_identity')}</h3>
            </header>

            <div className={`${styles.bento}`}>
                <div className={`${styles.group} ${styles.groupSpan9}`}>
                    <label className={`${styles.label}`}>{t('street_name')}</label>
                    <Input
                        name="street_name"
                        className="patient-address-fields__field"
                        value={formData.street_name || ''}
                        onChange={updatePatientData}
                        placeholder={t('street_placeholder')}
                    />
                </div>
                <div className={`${styles.group} ${styles.groupSpan3}`}>
                    <label className={`${styles.label}`}>{t('street_number')}</label>
                    <Input
                        name="street_number"
                        className="patient-address-fields__field"
                        value={formData.street_number || ''}
                        onChange={updatePatientData}
                        placeholder="1234"
                    />
                </div>

                <div className={`${styles.group} ${styles.groupSpan4}`}>
                    <label className={`${styles.label}`}>{t('floor')}</label>
                    <Input
                        name="floor"
                        className="patient-address-fields__field"
                        value={formData.floor || ''}
                        onChange={updatePatientData}
                        placeholder="2"
                    />
                </div>
                <div className={`${styles.group} ${styles.groupSpan8}`}>
                    <label className={`${styles.label}`}>{t('apartment')}</label>
                    <Input
                        name="apartment"
                        className="patient-address-fields__field"
                        value={formData.apartment || ''}
                        onChange={updatePatientData}
                        placeholder="B"
                    />
                </div>

                <div className={`${styles.group} ${styles.groupSpan6}`}>
                    <label className={`${styles.label}`}>{t('city')}</label>
                    <Input
                        name="city"
                        className="patient-address-fields__field"
                        value={formData.city || ''}
                        onChange={updatePatientData}
                    />
                </div>
                <div className={`${styles.group} ${styles.groupSpan6}`}>
                    <label className={`${styles.label}`}>{t('province')}</label>
                    <Input
                        name="province"
                        className="patient-address-fields__field"
                        value={formData.province || ''}
                        onChange={updatePatientData}
                    />
                </div>
            </div>

            {formData.street_name && (
                <footer className={`${styles.mapCard}`}>
                    <div className={`${styles.mapInfo}`}>
                        <Icon name="map" size="1.25rem" />
                        <div className={`${styles.mapText}`}>
                            <span className={`${styles.mapLabel}`}>{t('geolocalized_address')}</span>
                            <p className={`${styles.mapAddress}`}>
                                {formData.street_name} {formData.street_number}, {formData.city}
                            </p>
                        </div>
                    </div>
                    <Button
                        to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${formData.street_name || ''} ${formData.street_number || ''}, ${formData.city || ''}, ${formData.province || ''}, ${formData.country || ''}`.trim()
                        )}`}
                        target="_blank"
                        variant="secondary"
                        size="sm"
                        className="patient-address-fields__map-btn"
                        icon={<Icon name="open_in_new" size="0.9rem" />}
                        iconPosition="right"
                    >
                        {t('verify_on_map')}
                    </Button>
                </footer>
            )}
        </article>
    );
};

export default PatientAddressFields;
