import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { useLanguage } from '../../context/LanguageContext';
import './InsuranceList.css';

const InsuranceList = ({ insurances, onEdit, onDelete, hasFilter }) => {
    const { t } = useLanguage();

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    if (insurances.length === 0) {
        return (
            <div className="insurance-list__empty">
                <p className="insurance-list__empty-text">
                    {hasFilter ? t('no_results_found') : t('no_insurances_registered')}
                </p>
            </div>
        );
    }

    return (
        <div className="insurance-list">
            <div className="insurance-list__grid">
                {insurances.map(ins => (
                    <div key={ins.id} className="insurance-card">
                        <div className="insurance-card__header">
                            <div className="insurance-card__avatar">
                                {getInitials(ins.name)}
                            </div>
                            <div className="insurance-card__info">
                                <h3 className="insurance-card__name">{ins.name}</h3>
                                <p className="insurance-card__cuit">CUIT: {ins.cuit || 'N/A'}</p>
                                <Badge variant={ins.status === 'active' ? 'green' : 'gray'} className="insurance-card__badge">
                                    {t(ins.status || 'active')}
                                </Badge>
                            </div>
                        </div>

                        <div className="insurance-card__body">
                            <div className="insurance-card__data-list">
                                <div className="insurance-card__data-row">
                                    <span className="insurance-card__data-icon">📍</span>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ins.address || `${ins.name} Tandil`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="insurance-card__data-value insurance-card__link"
                                    >
                                        {ins.address || t('search_on_map')}
                                    </a>
                                </div>
                                <div className="insurance-card__data-row">
                                    <span className="insurance-card__data-icon">📞</span>
                                    <div className="insurance-card__data-value">
                                        {ins.phoneNumbers && ins.phoneNumbers.length > 0 ? (
                                            <div className="insurance-card__phones">
                                                {ins.phoneNumbers.filter(p => p.is_primary).map(p => (
                                                    <a key={p.id} href={`tel:${p.phone_number.replace(/[^0-9+]/g, '')}`} className="insurance-card__link">
                                                        {p.phone_number} {p.label && <span className="insurance-card__phone-tag">({p.label})</span>}
                                                    </a>
                                                ))}
                                                {ins.phoneNumbers.length > 1 && <span className="insurance-card__more-phones">+{ins.phoneNumbers.length - 1} {t('more')}</span>}
                                            </div>
                                        ) : (ins.phone ? (
                                            <a href={`tel:${ins.phone.replace(/[^0-9+]/g, '')}`} className="insurance-card__link">
                                                {ins.phone}
                                            </a>
                                        ) : t('no_phone'))}
                                    </div>
                                </div>
                                <div className="insurance-card__data-row">
                                    <span className="insurance-card__data-icon">✉️</span>
                                    <div className="insurance-card__data-value">
                                        {ins.email ? (
                                            <a href={`mailto:${ins.email}`} className="insurance-card__link">
                                                {ins.email}
                                            </a>
                                        ) : t('no_email')}
                                    </div>
                                </div>
                                {ins.website && (
                                    <div className="insurance-card__data-row">
                                        <span className="insurance-card__data-icon">🌐</span>
                                        <a href={ins.website.startsWith('http') ? ins.website : `https://${ins.website}`} target="_blank" rel="noreferrer" className="insurance-card__data-value insurance-card__link" title={ins.website}>
                                            {ins.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="insurance-card__footer">
                            <Button
                                variant="secondary"
                                size="sm-compact"
                                onClick={() => onEdit(ins)}
                            >
                                {t('edit')}
                            </Button>
                            <Button
                                variant="danger"
                                size="sm-compact"
                                onClick={() => onDelete(ins.id)}
                            >
                                {t('delete')}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default React.memo(InsuranceList);
