
import React from 'react';
import Icon from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { formatDate, calculateAge } from '@/utils/core/dateUtils';

// Local Styles
import styles from './PatientInfoBlock.module.css';

/**
 * PatientInfoBlock (Executor).
 * Renders the basic information table for a patient.
 */
const PatientInfoBlock = ({ details, t, onGeneratePrescriptionLink: _onGeneratePrescriptionLink }) => {
    return (
        <section className="patient-details__block patient-details__block--info">
            <header className="patient-details__block-header">
                <h3 className="patient-details__block-title">
                    <Icon name="person" size="1.2rem" />
                    {t('patient_info')}
                </h3>
            </header>

            <div className="patient-details__block-content">
                <table className={`${styles.infoTable}`}>
                    <tbody>
                        <tr className={`${styles.infoRow}`}>
                            <th className={`${styles.infoLabel}`}>{t('full_name')}</th>
                            <td className={`${styles.infoValue}`}>
                                <span className="patient-details__table-cell-bold">
                                    {details.full_name || `${details.first_name || ''} ${details.last_name || ''}`.trim() || 'N/A'}
                                </span>
                            </td>
                        </tr>
                        <tr className={`${styles.infoRow}`}>
                            <th className={`${styles.infoLabel}`}>{t('dni')}</th>
                            <td className={`${styles.infoValue}`}>{details.dni || 'N/A'}</td>
                        </tr>

                        <tr className={`${styles.infoRow}`}>
                            <th className={`${styles.infoLabel}`}>{t('insurance_short')}</th>
                            <td className={`${styles.infoValue}`}>
                                {details.insurance_name || t('particular')}
                                {details.affiliate_number && <span className={`${styles.infoHint}`}>({details.affiliate_number})</span>}
                            </td>
                        </tr>
                        <tr className={`${styles.infoRow}`}>
                            <th className={`${styles.infoLabel}`}>{t('dob') || 'Fecha Nac.'}</th>
                            <td className={`${styles.infoValue}`}>
                                {formatDate(details.dob)}
                                {details.dob && (
                                    <span className={`${styles.infoHint}`}>
                                        ({calculateAge(details.dob)} {t('years')})
                                    </span>
                                )}
                            </td>
                        </tr>
                        <tr className={`${styles.infoRow}`}>
                            <th className={`${styles.infoLabel}`}>{t('address') || 'Dirección'}</th>
                            <td className={`${styles.infoValue}`}>
                                <div className={`${styles.addressBox}`}>
                                    {(() => {
                                        const street = details.street_name || details.address;
                                        const hasStreet = Boolean(street && String(street).trim());
                                        const streetPart = hasStreet ? `${street} ${details.street_number || ''}`.trim() : null;
                                        const floorPart = details.floor ? `Piso ${details.floor}` : null;
                                        const aptPart = details.apartment ? `Depto ${details.apartment}` : null;

                                        if (!hasStreet) {
                                            return (
                                                <span className={`${styles.textEmpty}`}>
                                                    {t('no_address_loaded') || 'Sin calle ni altura cargada'}
                                                    {(details.city || details.province) ? ` (${[details.city, details.province].filter(Boolean).join(', ')})` : ''}
                                                </span>
                                            );
                                        }

                                        return [streetPart, floorPart, aptPart, details.city, details.province].filter(Boolean).join(', ');
                                    })()}
                                </div>
                                {(details.street_name || details.address) && (
                                    <Button
                                        to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            `${details.street_name || details.address || ''} ${details.street_number || ''}, ${details.city || ''}, ${details.province || ''}, ${details.country || ''}`.trim()
                                        )}`}
                                        target="_blank"
                                        variant="link"
                                        size="sm"
                                        className={`${styles.mapLink}`}
                                        icon={<Icon name="map" size="0.9rem" />}
                                    >
                                        {t('view_on_map')}
                                    </Button>
                                )}
                            </td>
                        </tr>
                        <tr className={`${styles.infoRow}`}>
                            <th className={`${styles.infoLabel}`}>{t('contact')}</th>
                            <td className={`${styles.infoValue}`}>
                                <div className={`${styles.contactList}`}>
                                    {(() => {
                                        const validPhones = (details.phoneNumbers || []).filter(p => p && p.phone_number && String(p.phone_number).trim() !== '');
                                        const hasPhone = validPhones.length > 0;
                                        const fallbackPhone = !hasPhone && details.phone && String(details.phone).trim() !== '';

                                        if (hasPhone) {
                                            return validPhones.map((p, idx) => (
                                                <div key={p.phone_number || `phone-${idx}`} className={`${styles.contactItem}`}>
                                                    <span className={`${styles.contactIndicator} ${p.is_primary ? styles.contactIndicatorPrimary : ''}`}></span>
                                                    <Button
                                                        to={`tel:${String(p.phone_number).replace(/[^0-9+]/g, '')}`}
                                                        variant="phone"
                                                        size="sm"
                                                        className={`${styles.contactLink}`}
                                                        icon={<Icon name="call" size="0.9rem" />}
                                                    >
                                                        {p.phone_number}
                                                    </Button>
                                                    {p.label && <span className={`${styles.infoHint}`}>({p.label})</span>}
                                                </div>
                                            ));
                                        }

                                        if (fallbackPhone) {
                                            return (
                                                <div className={`${styles.contactItem}`}>
                                                    <Button
                                                        to={`tel:${String(details.phone).replace(/[^0-9+]/g, '')}`}
                                                        variant="phone"
                                                        size="sm"
                                                        className={`${styles.contactLink}`}
                                                        icon={<Icon name="call" size="0.9rem" />}
                                                    >
                                                        {details.phone}
                                                    </Button>
                                                </div>
                                            );
                                        }

                                        if (!details.email) {
                                            return <span className={`${styles.textEmpty}`}>N/A</span>;
                                        }

                                        return null;
                                    })()}

                                    {details.email && (
                                        <div className={`${styles.contactItem} patient-details__contact-item--email`}>
                                            <Button
                                                to={`mailto:${details.email}`}
                                                variant="link"
                                                size="sm"
                                                className={`${styles.contactLink} ${styles.contactLinkEmail}`}
                                                icon={<Icon name="mail" size="0.9rem" />}
                                            >
                                                {details.email}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                        <tr className={`${styles.infoRow}`}>
                            <th className={`${styles.infoLabel}`}>{t('assigned_doctors')}</th>
                            <td className={`${styles.infoValue}`}>
                                {details.assignedDoctors && details.assignedDoctors.length > 0
                                    ? details.assignedDoctors.map(d => d.full_name).join(', ')
                                    : <span className={`${styles.textEmpty}`}>{t('none')}</span>}
                            </td>
                        </tr>
                    </tbody>


                </table>
            </div>
        </section>
    );
};

export default PatientInfoBlock;
