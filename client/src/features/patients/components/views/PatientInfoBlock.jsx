
import React from 'react';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { formatDate, calculateAge } from '@/utils/core/dateUtils';

// Local Styles
import styles from './PatientInfoBlock.module.css';

/**
 * PatientInfoBlock (Executor).
 * Renders the basic information table for a patient.
 */
export const PatientInfoBlock = ({ details, t, onGeneratePrescriptionLink: _onGeneratePrescriptionLink }) => {
    return (
        <section className="patient-details__block patient-details__block--info">
            <header className="patient-details__block-header">
                <h3 className="patient-details__block-title">
                    <Icon name="person" size="1.2rem" />
                    {t('patient_info')}
                </h3>
            </header>

            <div className="patient-details__block-content">
                <table className={`${styles.PatientInfoBlock__infoTable}`}>
                    <tbody>
                        <tr className={`${styles.PatientInfoBlock__infoRow}`}>
                            <th className={`${styles.PatientInfoBlock__infoLabel}`}>{t('full_name')}</th>
                            <td className={`${styles.PatientInfoBlock__infoValue}`}>
                                <span className="patient-details__table-cell-bold">
                                    {details.full_name || `${details.first_name || ''} ${details.last_name || ''}`.trim() || 'N/A'}
                                </span>
                            </td>
                        </tr>
                        <tr className={`${styles.PatientInfoBlock__infoRow}`}>
                            <th className={`${styles.PatientInfoBlock__infoLabel}`}>{t('dni')}</th>
                            <td className={`${styles.PatientInfoBlock__infoValue}`}>{details.dni || 'N/A'}</td>
                        </tr>

                        <tr className={`${styles.PatientInfoBlock__infoRow}`}>
                            <th className={`${styles.PatientInfoBlock__infoLabel}`}>{t('insurance_short')}</th>
                            <td className={`${styles.PatientInfoBlock__infoValue}`}>
                                {details.insurance_name || t('particular')}
                                {details.affiliate_number && <span className={`${styles.PatientInfoBlock__infoHint}`}>({details.affiliate_number})</span>}
                            </td>
                        </tr>
                        <tr className={`${styles.PatientInfoBlock__infoRow}`}>
                            <th className={`${styles.PatientInfoBlock__infoLabel}`}>{t('dob')}</th>
                            <td className={`${styles.PatientInfoBlock__infoValue}`}>
                                {formatDate(details.dob)}
                                {details.dob && (
                                    <span className={`${styles.PatientInfoBlock__infoHint}`}>
                                        ({calculateAge(details.dob)} {t('years')})
                                    </span>
                                )}
                            </td>
                        </tr>
                        <tr className={`${styles.PatientInfoBlock__infoRow}`}>
                            <th className={`${styles.PatientInfoBlock__infoLabel}`}>{t('address')}</th>
                            <td className={`${styles.PatientInfoBlock__infoValue}`}>
                                <div className={`${styles.PatientInfoBlock__addressBox}`}>
                                    {(() => {
                                        const street = details.street_name || details.address;
                                        const hasStreet = Boolean(street && String(street).trim());
                                        const streetPart = hasStreet ? `${street} ${details.street_number || ''}`.trim() : null;
                                        const floorPart = details.floor ? `Piso ${details.floor}` : null;
                                        const aptPart = details.apartment ? `Depto ${details.apartment}` : null;

                                        if (!hasStreet) {
                                            return (
                                                <span className={`${styles.PatientInfoBlock__textEmpty}`}>
                                                    {t('no_address_loaded')}
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
                                        className={`${styles.PatientInfoBlock__mapLink}`}
                                        icon={<Icon name="map" size="0.9rem" />}
                                    >
                                        {t('view_on_map')}
                                    </Button>
                                )}
                            </td>
                        </tr>
                        <tr className={`${styles.PatientInfoBlock__infoRow}`}>
                            <th className={`${styles.PatientInfoBlock__infoLabel}`}>{t('contact')}</th>
                            <td className={`${styles.PatientInfoBlock__infoValue}`}>
                                <div className={`${styles.PatientInfoBlock__contactList}`}>
                                    {(() => {
                                        const validPhones = (details.phoneNumbers || []).filter(p => p && p.phone_number && String(p.phone_number).trim() !== '');
                                        const hasPhone = validPhones.length > 0;
                                        const fallbackPhone = !hasPhone && details.phone && String(details.phone).trim() !== '';

                                        if (hasPhone) {
                                            return validPhones.map((p, idx) => (
                                                <div key={`phone-${p.phone_number}-${p.is_primary}`} className={`${styles.PatientInfoBlock__contactItem}`}>
                                                    <span className={`${styles.PatientInfoBlock__contactIndicator} ${p.is_primary ? styles.PatientInfoBlock__contactIndicatorPrimary : ''}`}></span>
                                                    <Button
                                                        to={`tel:${String(p.phone_number).replace(/[^0-9+]/g, '')}`}
                                                        variant="phone"
                                                        size="sm"
                                                        className={`${styles.PatientInfoBlock__contactLink}`}
                                                        icon={<Icon name="call" size="0.9rem" />}
                                                    >
                                                        {p.phone_number}
                                                    </Button>
                                                    {p.label && <span className={`${styles.PatientInfoBlock__infoHint}`}>({p.label})</span>}
                                                </div>
                                            ));
                                        }

                                        if (fallbackPhone) {
                                            return (
                                                <div className={`${styles.PatientInfoBlock__contactItem}`}>
                                                    <Button
                                                        to={`tel:${String(details.phone).replace(/[^0-9+]/g, '')}`}
                                                        variant="phone"
                                                        size="sm"
                                                        className={`${styles.PatientInfoBlock__contactLink}`}
                                                        icon={<Icon name="call" size="0.9rem" />}
                                                    >
                                                        {details.phone}
                                                    </Button>
                                                </div>
                                            );
                                        }

                                        if (!details.email) {
                                            return <span className={`${styles.PatientInfoBlock__textEmpty}`}>{t('not_available_short')}</span>;
                                        }

                                        return null;
                                    })()}

                                    {details.email && (
                                        <div className={`${styles.PatientInfoBlock__contactItem} patient-details__contact-item--email`}>
                                            <Button
                                                to={`mailto:${details.email}`}
                                                variant="link"
                                                size="sm"
                                                className={`${styles.PatientInfoBlock__contactLink} ${styles.PatientInfoBlock__contactLinkEmail}`}
                                                icon={<Icon name="mail" size="0.9rem" />}
                                            >
                                                {details.email}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                        <tr className={`${styles.PatientInfoBlock__infoRow}`}>
                            <th className={`${styles.PatientInfoBlock__infoLabel}`}>{t('assigned_doctors')}</th>
                            <td className={`${styles.PatientInfoBlock__infoValue}`}>
                                {details.assignedDoctors && details.assignedDoctors.length > 0
                                    ? details.assignedDoctors.map(d => d.full_name).join(', ')
                                    : <span className={`${styles.PatientInfoBlock__textEmpty}`}>{t('none')}</span>}
                            </td>
                        </tr>
                    </tbody>


                </table>
            </div>
        </section>
    );
};

