import React from 'react';
import Button from '../../../components/atoms/Button';
import Icon from '../../../components/atoms/Icon';
import { formatPrice } from '../../../utils/format';
import './DoctorCard.css';

const DoctorCard = ({ doctor, currentUser, onEdit, t }) => {
    return (
        <article className="card doctor-card animate-fadeIn">
            <header className="doctor-card__header">
                <div className="doctor-card__avatar">
                    {doctor.full_name?.charAt(0).toUpperCase()}
                </div>
                <div className="doctor-card__info">
                    <h3 className="doctor-card__name">
                        {doctor.full_name}
                    </h3>
                    <p className="doctor-card__specialty">
                        {doctor.specialty || t('general_physician') || 'Médico General'}
                    </p>
                </div>
            </header>

            <div className="doctor-card__details">
                <div className="doctor-card__detail-item">
                    <Icon name="phone" size="1rem" className="doctor-card__detail-icon" />
                    {doctor.phone ? (
                        <a
                            href={`tel:${doctor.phone.replace(/[^0-9+]/g, '')}`}
                            className="doctor-card__phone-link"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {doctor.phone}
                        </a>
                    ) : (
                        <span className="doctor-card__phone-empty">
                            {t('no_phone') || 'Sin teléfono'}
                        </span>
                    )}
                </div>
                <div className="doctor-card__detail-item">
                    <Icon name="location_on" size="1rem" className="doctor-card__detail-icon" />
                    <span className="doctor-card__office-label">
                        {t('office') || 'Consultorio'}: <span className="doctor-card__office-value">{doctor.office_number || 'N/A'}</span>
                    </span>
                </div>
            </div>

            <div className="doctor-card__prices">
                <div className="doctor-card__price-box">
                    <div className="doctor-card__price-label">
                        {t('consult_abbrev') || 'CONSULTA'}
                    </div>
                    <div className="doctor-card__price-value">{formatPrice(doctor.consultation_price)}</div>
                </div>
                <div className="doctor-card__price-box">
                    <div className="doctor-card__price-label">
                        {t('rx_abbrev') || 'RECETA'}
                    </div>
                    <div className="doctor-card__price-value">{formatPrice(doctor.prescription_price)}</div>
                </div>
            </div>

            {(currentUser.role === 'admin' || currentUser.role === 'secretary' || currentUser.user_id === doctor.user_id) && (
                <footer className="doctor-card__footer">
                    <Button
                        variant="secondary"
                        size="sm"
                        className="doctor-card__config-btn"
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
