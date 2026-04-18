
import React from 'react';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import { formatDate } from '@/utils/dateUtils';

// Local Styles
import './PatientInfoBlock.css';

/**
 * PatientInfoBlock (Executor).
 * Renders the basic information table for a patient.
 */
const PatientInfoBlock = ({ details, t, onGeneratePrescriptionLink }) => {
    return (
        <section className="details-block details-block--info">
            <header className="details-block__header">
                <h3 className="details-block__title">
                    <Icon name="PROFILE" size="1.2rem" />
                    {t('patient_info')}
                </h3>
            </header>

            <div className="details-block__content">
                <table className="patient-details__info-table">
                    <tbody>
                        <tr className="patient-details__info-row">
                            <th className="patient-details__info-label">{t('dni')}</th>
                            <td className="patient-details__info-value">{details.dni || 'N/A'}</td>
                        </tr>
                        <tr className="patient-details__info-row">
                            <th className="patient-details__info-label">{t('insurance_short')}</th>
                            <td className="patient-details__info-value">
                                {details.insurance_name || t('particular')}
                                {details.affiliate_number && <span className="patient-details__info-hint">({details.affiliate_number})</span>}
                            </td>
                        </tr>
                        <tr className="patient-details__info-row">
                            <th className="patient-details__info-label">{t('dob') || 'Fecha Nac.'}</th>
                            <td className="patient-details__info-value">
                                {formatDate(details.dob)}
                                {details.dob && (
                                    <span className="patient-details__info-hint">
                                        ({Math.floor((new Date() - new Date(details.dob)) / 31557600000)} {t('years')})
                                    </span>
                                )}
                            </td>
                        </tr>
                        <tr className="patient-details__info-row">
                            <th className="patient-details__info-label">{t('address') || 'Dirección'}</th>
                            <td className="patient-details__info-value">
                                <div className="patient-details__address-box">
                                    {[
                                        details.street_name && `${details.street_name} ${details.street_number || ''}`,
                                        details.floor && `Piso ${details.floor}`,
                                        details.apartment && `Depto ${details.apartment}`,
                                        details.city,
                                        details.province,
                                    ].filter(Boolean).join(', ') || <span className="patient-details__text-empty">{t('no_address_loaded')}</span>}
                                </div>
                                {details.street_name && (
                                    <Button
                                        to={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            `${details.street_name || ''} ${details.street_number || ''}, ${details.city || ''}, ${details.province || ''}, ${details.country || ''}`.trim()
                                        )}`}
                                        variant="link"
                                        size="sm"
                                        className="patient-details__map-link"
                                        icon={<Icon name="map" size="0.9rem" />}
                                    >
                                        {t('view_on_map')}
                                    </Button>
                                )}
                            </td>
                        </tr>
                        <tr className="patient-details__info-row">
                            <th className="patient-details__info-label">{t('contact')}</th>
                            <td className="patient-details__info-value">
                                <div className="patient-details__contact-list">
                                    {details.phoneNumbers && details.phoneNumbers.length > 0 ? (
                                        details.phoneNumbers.map((p, idx) => (
                                            <div key={idx} className="patient-details__contact-item">
                                                <span className={`patient-details__contact-indicator ${p.is_primary ? 'patient-details__contact-indicator--primary' : ''}`}></span>
                                                <Button
                                                    to={`tel:${p.phone_number.replace(/[^0-9+]/g, '')}`}
                                                    variant="phone"
                                                    size="sm"
                                                    className="patient-details__contact-link"
                                                    icon={<Icon name="call" size="0.9rem" />}
                                                >
                                                    {p.phone_number}
                                                </Button>
                                                {p.label && <span className="patient-details__info-hint">({p.label})</span>}
                                            </div>
                                        ))
                                    ) : (
                                        details.phone ? (
                                            <Button
                                                to={`tel:${details.phone.replace(/[^0-9+]/g, '')}`}
                                                variant="phone"
                                                size="sm"
                                                className="patient-details__contact-link"
                                                icon={<Icon name="call" size="0.9rem" />}
                                            >
                                                {details.phone}
                                            </Button>
                                        ) : <span>N/A</span>
                                    )}
                                    {details.email && (
                                        <div className="patient-details__contact-item patient-details__contact-item--email">
                                            <Button
                                                to={`mailto:${details.email}`}
                                                variant="link"
                                                size="sm"
                                                className="patient-details__contact-link patient-details__contact-link--email"
                                                icon={<Icon name="mail" size="0.9rem" />}
                                            >
                                                {details.email}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                        <tr className="patient-details__info-row">
                            <th className="patient-details__info-label">{t('assigned_doctors')}</th>
                            <td className="patient-details__info-value">
                                {details.assignedDoctors && details.assignedDoctors.length > 0
                                    ? details.assignedDoctors.map(d => d.full_name).join(', ')
                                    : <span className="patient-details__text-empty">{t('none')}</span>}
                            </td>
                        </tr>
                        <tr className="patient-details__info-row">
                            <th className="patient-details__info-label">{t('attendance')}</th>
                            <td className="patient-details__info-value">
                                <div className="patient-details__attend-flex">
                                    <span>
                                        <strong>{details.attended_appointments}</strong> {t('attended')}
                                    </span>
                                    <span className="patient-details__info-hint">
                                        / {details.total_appointments} {t('total_appointments')}
                                    </span>
                                </div>
                            </td>
                        </tr>
                        {(details.license_expiry_date || details.next_suggested_visit_date || details.next_suggested_prescription_date) && (
                            <tr className="patient-details__info-row">
                                <th className="patient-details__info-label">{t('important_dates')}</th>
                                <td className="patient-details__info-value">
                                    <div className="patient-details__date-indicators">
                                        {details.license_expiry_date && (
                                            <div className="date-indicator date-indicator--rose">
                                                <span className="date-indicator__label">{t('license_expiry_date')}</span>
                                                <p className="date-indicator__value">{formatDate(details.license_expiry_date)}</p>
                                            </div>
                                        )}
                                        {details.next_suggested_visit_date && (
                                            <div className="date-indicator date-indicator--amber">
                                                <div className="config-flex config-flex--between">
                                                    <div>
                                                        <span className="date-indicator__label">{t('next_visit_suggested')}</span>
                                                        <p className="date-indicator__value">{formatDate(details.next_suggested_visit_date)}</p>
                                                    </div>
                                                    <Button
                                                        size="xs"
                                                        variant="whatsapp"
                                                        className="date-indicator__action"
                                                        icon={<Icon name="chat" size="0.8rem" />}
                                                        onClick={() => {
                                                            const phone = details.phoneNumbers?.find(p => p.is_primary)?.phone_number || details.phone;
                                                            if (!phone) return alert(t('no_phone_available'));
                                                            const msg = `Hola ${details.full_name}, te escribimos de Cima Salud para recordarte que ya es tiempo de tu próximo control sugerido (${formatDate(details.next_suggested_visit_date)}). ¿Te gustaría agendar un turno?`;
                                                            window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                                        }}
                                                    >
                                                        {t('remind')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {details.next_suggested_prescription_date && (
                                            <div className="date-indicator date-indicator--indigo">
                                                <div className="config-flex config-flex--between">
                                                    <div>
                                                        <span className="date-indicator__label">{t('next_prescription_suggested')}</span>
                                                        <p className="date-indicator__value">{formatDate(details.next_suggested_prescription_date)}</p>
                                                    </div>
                                                    <Button
                                                        size="xs"
                                                        variant="ghost"
                                                        className="date-indicator__action"
                                                        icon={<Icon name="description" size="0.8rem" />}
                                                        onClick={() => onGeneratePrescriptionLink(details.id)}
                                                    >
                                                        {t('send_link')}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
};

export default PatientInfoBlock;
