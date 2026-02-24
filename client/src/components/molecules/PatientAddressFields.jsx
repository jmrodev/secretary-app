import React from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

/**
 * PatientAddressFields Molecule.
 * Contains street, city, province, country and notes with Google Maps link.
 */
const PatientAddressFields = ({ formData, handleChange, t }) => {
    return (
        <div className="patient-form__address-section">
            <div className="patient-form__section-title">{t('address_details') || 'Detalles de Dirección'}</div>
            <div className="patient-form__row">
                <div className="patient-form__group patient-form__group--expand-3">
                    <label className="patient-form__label">{t('street_name') || 'Nombre de Calle'}</label>
                    <input
                        name="street_name"
                        className="patient-form__field"
                        value={formData.street_name || ''}
                        onChange={handleChange}
                        placeholder="Ej: Av. Rivadavia"
                    />
                </div>
                <div className="patient-form__group patient-form__group--expand-1">
                    <label className="patient-form__label">{t('street_number') || 'Número'}</label>
                    <input
                        name="street_number"
                        className="patient-form__field"
                        value={formData.street_number || ''}
                        onChange={handleChange}
                        placeholder="1234"
                    />
                </div>
            </div>

            <div className="patient-form__row">
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('floor') || 'Piso'}</label>
                    <input
                        name="floor"
                        className="patient-form__field"
                        value={formData.floor || ''}
                        onChange={handleChange}
                        placeholder="2"
                    />
                </div>
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('apartment') || 'Depto/Oficina'}</label>
                    <input
                        name="apartment"
                        className="patient-form__field"
                        value={formData.apartment || ''}
                        onChange={handleChange}
                        placeholder="B"
                    />
                </div>
            </div>

            <div className="patient-form__row">
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('city') || 'Ciudad'}</label>
                    <input
                        name="city"
                        className="patient-form__field"
                        value={formData.city || ''}
                        onChange={handleChange}
                    />
                </div>
                <div className="patient-form__group">
                    <label className="patient-form__label">{t('province') || 'Provincia'}</label>
                    <input
                        name="province"
                        className="patient-form__field"
                        value={formData.province || ''}
                        onChange={handleChange}
                    />
                </div>
            </div>

            <div className="patient-form__group">
                <label className="patient-form__label">{t('country') || 'País'}</label>
                <input
                    name="country"
                    className="patient-form__field"
                    value={formData.country || ''}
                    onChange={handleChange}
                />
            </div>

            {formData.street_name && (
                <Button
                    to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${formData.street_name || ''} ${formData.street_number || ''}, ${formData.city || ''}, ${formData.province || ''}, ${formData.country || ''}`.trim()
                    )}`}
                    target="_blank"
                    variant="link"
                    size="sm"
                    className="mt-1"
                    icon={<Icon name="map" size="1rem" />}
                >
                    {t('view_on_map')}
                </Button>
            )}
        </div>
    );
};

export default PatientAddressFields;
