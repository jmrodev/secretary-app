import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import './PatientAddressFields.css';

/**
 * PatientAddressFields Molecule (Sub-Executor).
 * Contains street, city, province, country and notes with Google Maps integration.
 */
const PatientAddressFields = ({ formData, handleChange, t }) => {
    return (
        <div className="patient-address-fields">
            <div className="patient-address-fields__section-title">
                {t('address_details') || 'Detalles de Dirección'}
            </div>
            
            <div className="patient-address-fields__row">
                <div className="patient-address-fields__group patient-address-fields__group--expand-3">
                    <label className="patient-address-fields__label">{t('street_name') || 'Nombre de Calle'}</label>
                    <Input
                        name="street_name"
                        className="patient-address-fields__field"
                        value={formData.street_name || ''}
                        onChange={handleChange}
                        placeholder="Ej: Av. Rivadavia"
                    />
                </div>
                <div className="patient-address-fields__group patient-address-fields__group--expand-1">
                    <label className="patient-address-fields__label">{t('street_number') || 'Número'}</label>
                    <Input
                        name="street_number"
                        className="patient-address-fields__field"
                        value={formData.street_number || ''}
                        onChange={handleChange}
                        placeholder="1234"
                    />
                </div>
            </div>

            <div className="patient-address-fields__row">
                <div className="patient-address-fields__group">
                    <label className="patient-address-fields__label">{t('floor') || 'Piso'}</label>
                    <Input
                        name="floor"
                        className="patient-address-fields__field"
                        value={formData.floor || ''}
                        onChange={handleChange}
                        placeholder="2"
                    />
                </div>
                <div className="patient-address-fields__group">
                    <label className="patient-address-fields__label">{t('apartment') || 'Depto/Oficina'}</label>
                    <Input
                        name="apartment"
                        className="patient-address-fields__field"
                        value={formData.apartment || ''}
                        onChange={handleChange}
                        placeholder="B"
                    />
                </div>
            </div>

            <div className="patient-address-fields__row">
                <div className="patient-address-fields__group">
                    <label className="patient-address-fields__label">{t('city') || 'Ciudad'}</label>
                    <Input
                        name="city"
                        className="patient-address-fields__field"
                        value={formData.city || ''}
                        onChange={handleChange}
                    />
                </div>
                <div className="patient-address-fields__group">
                    <label className="patient-address-fields__label">{t('province') || 'Provincia'}</label>
                    <Input
                        name="province"
                        className="patient-address-fields__field"
                        value={formData.province || ''}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="patient-address-fields__group">
                <label className="patient-address-fields__label">{t('country') || 'País'}</label>
                <Input
                    name="country"
                    className="patient-address-fields__field"
                    value={formData.country || ''}
                    onChange={handleChange}
                />
            </div>

            {formData.street_name && (
                <div className="patient-address-fields__map-action">
                    <Button
                        to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${formData.street_name || ''} ${formData.street_number || ''}, ${formData.city || ''}, ${formData.province || ''}, ${formData.country || ''}`.trim()
                        )}`}
                        target="_blank"
                        variant="link"
                        size="sm"
                        className="patient-address-fields__map-btn"
                        icon={<Icon name="map" size="1rem" />}
                    >
                        {t('view_on_map')}
                    </Button>
                </div>
            )}
        </div>
    );
};

export default PatientAddressFields;
