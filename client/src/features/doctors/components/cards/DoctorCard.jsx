import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { formatCurrency } from '@/utils/core/format';
import styles from './DoctorCard.module.css';

export const DoctorCard = ({ doctor, currentUser, onEdit, t }) => {
    return (
        <article className={`${styles.DoctorCard__root} card animate-fade-in`}>
            <header className={`${styles.DoctorCard__header}`}>
                <div className={`${styles.DoctorCard__avatar}`}>
                    {doctor.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className={`${styles.DoctorCard__info}`}>
                    <h3 className={`${styles.DoctorCard__name}`}>
                        {doctor.full_name}
                    </h3>
                    <p className={`${styles.DoctorCard__specialty}`}>
                        {doctor.specialty || t('general_physician') || 'Médico General'}
                    </p>
                </div>
            </header>

            <div className={`${styles.DoctorCard__details}`}>
                <div className={`${styles.DoctorCard__detailItem}`}>
                    <Icon name="phone" size="1rem" className={`${styles.DoctorCard__detailIcon}`} />
                    {doctor.phone ? (
                        <a
                            href={`tel:${doctor.phone.replace(/[^0-9+]/g, '')}`}
                            className={`${styles.DoctorCard__phoneLink}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {doctor.phone}
                        </a>
                    ) : (
                        <span className={`${styles.DoctorCard__phoneEmpty}`}>
                            {t('no_phone') || 'Sin teléfono'}
                        </span>
                    )}
                </div>
                <div className={`${styles.DoctorCard__detailItem}`}>
                    <Icon name="location_on" size="1rem" className={`${styles.DoctorCard__detailIcon}`} />
                    <span className={`${styles.DoctorCard__officeLabel}`}>
                        {t('office') || 'Consultorio'}: <span className={`${styles.DoctorCard__officeValue}`}>{doctor.office_number || 'N/A'}</span>
                    </span>
                </div>
                {doctor.dni && (
                    <div className={`${styles.DoctorCard__detailItem}`}>
                        <Icon name="badge" size="1rem" className={`${styles.DoctorCard__detailIcon}`} />
                        <span className={`${styles.DoctorCard__officeValue}`}>DNI: {doctor.dni}</span>
                    </div>
                )}
            </div>

            <div className={`${styles.DoctorCard__prices}`}>
                <div className={`${styles.DoctorCard__priceBox}`}>
                    <div className={`${styles.DoctorCard__priceLabel}`}>
                        {t('consult_abbrev') || 'CONSULTA'}
                    </div>
                    <div className={`${styles.DoctorCard__priceValue}`}>{formatCurrency(doctor.consultation_price)}</div>
                </div>
                <div className={`${styles.DoctorCard__priceBox}`}>
                    <div className={`${styles.DoctorCard__priceLabel}`}>
                        {t('rx_abbrev') || 'RECETA'}
                    </div>
                    <div className={`${styles.DoctorCard__priceValue}`}>{formatCurrency(doctor.prescription_price)}</div>
                </div>
                <div className={`${styles.DoctorCard__priceBox}`}>
                    <div className={`${styles.DoctorCard__priceLabel}`}>
                        {t('virtual_abbrev') || 'VIRTUAL'}
                    </div>
                    <div className={`${styles.DoctorCard__priceValue}`}>{formatCurrency(doctor.virtual_consultation_price)}</div>
                </div>
                <div className={`${styles.DoctorCard__priceBox}`}>
                    <div className={`${styles.DoctorCard__priceLabel}`}>
                        {t('license_abbrev') || 'CM/CERT'}
                    </div>
                    <div className={`${styles.DoctorCard__priceValue}`}>{formatCurrency(doctor.medical_license_price || doctor.certificate_price)}</div>
                </div>
            </div>

            {(currentUser.role === 'admin' || currentUser.role === 'secretary' || currentUser.user_id === doctor.user_id) && (
                <footer className={`${styles.DoctorCard__footer}`}>
                    <Button
                        variant="secondary"
                        size="sm"
                        className={`${styles.DoctorCard__configBtn}`}
                        onClick={() => onEdit(doctor)}
                        icon={<Icon name="settings" size="1rem" />}
                    >
                        {t('configure_doctor') || 'Configurar Médico'}
                    </Button>
                </footer>
            )}
        </article>
    );
};


