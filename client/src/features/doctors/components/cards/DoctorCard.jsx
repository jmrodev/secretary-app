import React from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { formatCurrency } from '@/utils/core/format';
import styles from './DoctorCard.module.css';

const DoctorCard = ({ doctor, currentUser, onEdit, t }) => {
    return (
        <article className={`${styles.root} card animate-fade-in`}>
            <header className={`${styles.header}`}>
                <div className={`${styles.avatar}`}>
                    {doctor.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className={`${styles.info}`}>
                    <h3 className={`${styles.name}`}>
                        {doctor.full_name}
                    </h3>
                    <p className={`${styles.specialty}`}>
                        {doctor.specialty || t('general_physician') || 'Médico General'}
                    </p>
                </div>
            </header>

            <div className={`${styles.details}`}>
                <div className={`${styles.detailItem}`}>
                    <Icon name="phone" size="1rem" className={`${styles.detailIcon}`} />
                    {doctor.phone ? (
                        <a
                            href={`tel:${doctor.phone.replace(/[^0-9+]/g, '')}`}
                            className={`${styles.phoneLink}`}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {doctor.phone}
                        </a>
                    ) : (
                        <span className={`${styles.phoneEmpty}`}>
                            {t('no_phone') || 'Sin teléfono'}
                        </span>
                    )}
                </div>
                <div className={`${styles.detailItem}`}>
                    <Icon name="location_on" size="1rem" className={`${styles.detailIcon}`} />
                    <span className={`${styles.officeLabel}`}>
                        {t('office') || 'Consultorio'}: <span className={`${styles.officeValue}`}>{doctor.office_number || 'N/A'}</span>
                    </span>
                </div>
            </div>

            <div className={`${styles.prices}`}>
                <div className={`${styles.priceBox}`}>
                    <div className={`${styles.priceLabel}`}>
                        {t('consult_abbrev') || 'CONSULTA'}
                    </div>
                    <div className={`${styles.priceValue}`}>{formatCurrency(doctor.consultation_price)}</div>
                </div>
                <div className={`${styles.priceBox}`}>
                    <div className={`${styles.priceLabel}`}>
                        {t('rx_abbrev') || 'RECETA'}
                    </div>
                    <div className={`${styles.priceValue}`}>{formatCurrency(doctor.prescription_price)}</div>
                </div>
            </div>

            {(currentUser.role === 'admin' || currentUser.role === 'secretary' || currentUser.user_id === doctor.user_id) && (
                <footer className={`${styles.footer}`}>
                    <Button
                        variant="secondary"
                        size="sm"
                        className={`${styles.configBtn}`}
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

export default DoctorCard;
