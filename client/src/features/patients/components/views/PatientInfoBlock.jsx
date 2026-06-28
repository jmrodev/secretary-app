
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
                                    {[
                                        details.street_name && `${details.street_name} ${details.street_number || ''}`,
                                        details.floor && `Piso ${details.floor}`,
                                        details.apartment && `Depto ${details.apartment}`,
                                        details.city,
                                        details.province,
                                    ].filter(Boolean).join(', ') || <span className={`${styles.textEmpty}`}>{t('no_address_loaded')}</span>}
                                </div>
                                {details.street_name && (
                                    <Button
                                        to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            `${details.street_name || ''} ${details.street_number || ''}, ${details.city || ''}, ${details.province || ''}, ${details.country || ''}`.trim()
                                        )}`}
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
                                    {details.phoneNumbers && details.phoneNumbers.length > 0 ? (
                                        details.phoneNumbers.map((p) => (
                                            <div key={p.phone_number} className={`${styles.contactItem}`}>
                                                <span className={`${styles.contactIndicator} ${p.is_primary ? styles.contactIndicatorPrimary : ''}`}></span>
                                                <Button
                                                    to={`tel:${p.phone_number.replace(/[^0-9+]/g, '')}`}
                                                    variant="phone"
                                                    size="sm"
                                                    className={`${styles.contactLink}`}
                                                    icon={<Icon name="call" size="0.9rem" />}
                                                >
                                                    {p.phone_number}
                                                </Button>
                                                {p.label && <span className={`${styles.infoHint}`}>({p.label})</span>}
                                            </div>
                                        ))
                                    ) : (
                                        details.phone ? (
                                            <Button
                                                to={`tel:${details.phone.replace(/[^0-9+]/g, '')}`}
                                                variant="phone"
                                                size="sm"
                                                className={`${styles.contactLink}`}
                                                icon={<Icon name="call" size="0.9rem" />}
                                            >
                                                {details.phone}
                                            </Button>
                                        ) : <span>N/A</span>
                                    )}
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
