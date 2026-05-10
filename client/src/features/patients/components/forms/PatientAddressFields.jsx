import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import './PatientAddressFields.css';

/**
 * PatientAddressFields Molecule (Sub-Executor).
 * Contains street, city, province, country and notes with Google Maps integration.
 * Optimized for Bento Box layout.
 */
const PatientAddressFields = ({ formData, handleChange, t }) => {
    return (
        <article className="patient-address-fields">
            <header className="patient-address-fields__header">
                <Icon name="location_on" size="1.25rem" />
                <h3 className="patient-address-fields__title">{t('geographic_identity')}</h3>
            </header>

            <div className="patient-address-fields__bento">
                <div className="patient-address-fields__group patient-address-fields__group--span-9">
                    <label className="patient-address-fields__label">{t('street_name')}</label>
                    <Input
                        name="street_name"
                        className="patient-address-fields__field"
                        value={formData.street_name || ''}
                        onChange={handleChange}
                        placeholder={t('street_placeholder')}
                    />
                </div>
                <div className="patient-address-fields__group patient-address-fields__group--span-3">
                    <label className="patient-address-fields__label">{t('street_number')}</label>
                    <Input
                        name="street_number"
                        className="patient-address-fields__field"
                        value={formData.street_number || ''}
                        onChange={handleChange}
                        placeholder="1234"
                    />
                </div>

                <div className="patient-address-fields__group patient-address-fields__group--span-4">
                    <label className="patient-address-fields__label">{t('floor')}</label>
                    <Input
                        name="floor"
                        className="patient-address-fields__field"
                        value={formData.floor || ''}
                        onChange={handleChange}
                        placeholder="2"
                    />
                </div>
                <div className="patient-address-fields__group patient-address-fields__group--span-8">
                    <label className="patient-address-fields__label">{t('apartment')}</label>
                    <Input
                        name="apartment"
                        className="patient-address-fields__field"
                        value={formData.apartment || ''}
                        onChange={handleChange}
                        placeholder="B"
                    />
                </div>

                <div className="patient-address-fields__group patient-address-fields__group--span-6">
                    <label className="patient-address-fields__label">{t('city')}</label>
                    <Input
                        name="city"
                        className="patient-address-fields__field"
                        value={formData.city || ''}
                        onChange={handleChange}
                    />
                </div>
                <div className="patient-address-fields__group patient-address-fields__group--span-6">
                    <label className="patient-address-fields__label">{t('province')}</label>
                    <Input
                        name="province"
                        className="patient-address-fields__field"
                        value={formData.province || ''}
                        onChange={handleChange}
                    />
                </div>
            </div>

            {formData.street_name && (
                <footer className="patient-address-fields__map-card">
                    <div className="patient-address-fields__map-info">
                        <Icon name="map" size="1.25rem" />
                        <div className="patient-address-fields__map-text">
                            <span className="patient-address-fields__map-label">{t('geolocalized_address')}</span>
                            <p className="patient-address-fields__map-address">
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
