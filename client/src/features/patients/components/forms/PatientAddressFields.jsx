import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Input } from '@/components/atoms/Input';
import styles from './PatientAddressFields.module.css';

/**
 * PatientAddressFields Molecule (Sub-Executor).
 * Contains street, city, province, country and notes with Google Maps integration.
 * Optimized for Bento Box layout.
 */
export const PatientAddressFields = ({ formData, updatePatientData, t }) => {
    return (
        <article className={`${styles.PatientAddressFields__root}`}>
            

            <div className={`${styles.PatientAddressFields__bento}`}>
                <div className={`${styles.PatientAddressFields__group} ${styles.PatientAddressFields__groupSpan6}`}>
                    <label htmlFor="patient-street" className={`${styles.PatientAddressFields__label}`}>{t('street_name')}</label>
                    <Input
                        id="patient-street"
                        name="street_name"
                        className="patient-address-fields__field"
                        value={formData.street_name || ''}
                        onChange={updatePatientData}
                        placeholder={t('street_placeholder')}
                    />
                </div>
                <div className={`${styles.PatientAddressFields__group} ${styles.PatientAddressFields__groupSpan2}`}>
                    <label htmlFor="patient-street-number" className={`${styles.PatientAddressFields__label}`}>{t('street_number')}</label>
                    <Input
                        id="patient-street-number"
                        name="street_number"
                        className="patient-address-fields__field"
                        value={formData.street_number || ''}
                        onChange={updatePatientData}
                        placeholder="1234"
                    />
                </div>

                <div className={`${styles.PatientAddressFields__group} ${styles.PatientAddressFields__groupSpan2}`}>
                    <label htmlFor="patient-floor" className={`${styles.PatientAddressFields__label}`}>{t('floor')}</label>
                    <Input
                        id="patient-floor"
                        name="floor"
                        className="patient-address-fields__field"
                        value={formData.floor || ''}
                        onChange={updatePatientData}
                        placeholder="2"
                    />
                </div>
                <div className={`${styles.PatientAddressFields__group} ${styles.PatientAddressFields__groupSpan2}`}>
                    <label htmlFor="patient-apartment" className={`${styles.PatientAddressFields__label}`}>{t('apartment')}</label>
                    <Input
                        id="patient-apartment"
                        name="apartment"
                        className="patient-address-fields__field"
                        value={formData.apartment || ''}
                        onChange={updatePatientData}
                        placeholder="B"
                    />
                </div>

                <div className={`${styles.PatientAddressFields__group} ${styles.PatientAddressFields__groupSpan3}`}>
                    <label htmlFor="patient-city" className={`${styles.PatientAddressFields__label}`}>{t('city')}</label>
                    <Input
                        id="patient-city"
                        name="city"
                        className="patient-address-fields__field"
                        value={formData.city || ''}
                        onChange={updatePatientData}
                    />
                </div>
                <div className={`${styles.PatientAddressFields__group} ${styles.PatientAddressFields__groupSpan3}`}>
                    <label htmlFor="patient-province" className={`${styles.PatientAddressFields__label}`}>{t('province')}</label>
                    <Input
                        id="patient-province"
                        name="province"
                        className="patient-address-fields__field"
                        value={formData.province || ''}
                        onChange={updatePatientData}
                    />
                </div>
            {formData.street_name && (
                <div className={`${styles.PatientAddressFields__mapCard} ${styles.PatientAddressFields__groupSpan6}`}>
                    <div className={`${styles.PatientAddressFields__mapInfo}`}>
                        <Icon name="map" size="1.25rem" />
                        <div className={`${styles.PatientAddressFields__mapText}`}>
                            <span className={`${styles.PatientAddressFields__mapLabel}`}>{t('geolocalized_address')}</span>
                            <p className={`${styles.PatientAddressFields__mapAddress}`}>
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
                </div>
            )}
            </div>
        </article>
    );
};

