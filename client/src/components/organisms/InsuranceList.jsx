import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { useLanguage } from '../../context/LanguageContext';

const InsuranceList = ({ insurances, loading, onEdit, onDelete, hasFilter }) => {
    const { t } = useLanguage();

    const getInitials = (name) => {
        return name
            .split(' ')
            .map(word => word[0])
            .join('')
            .substring(0, 2)
            .toUpperCase();
    };

    if (loading) {
        return (
            <div className="flex-center py-20">
                <div className="loading-spinner"></div>
                <p className="text-muted ml-3">{t('loading')}</p>
            </div>
        );
    }

    if (insurances.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-xl border-dashed border-2 border-slate-200">
                <p className="text-muted text-lg">
                    {hasFilter ? t('no_results_found') : t('no_insurances_registered')}
                </p>
            </div>
        );
    }

    return (
        <div className="item-grid">
            {insurances.map(ins => (
                <div key={ins.id} className="card">
                    <div className="item-header">
                        <div className="avatar-tile" style={{ background: '#3b82f6' }}>
                            {getInitials(ins.name)}
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-main-800 m-0 leading-tight">{ins.name}</h3>
                            <p className="text-sm text-main-500 m-0 mt-1">CUIT: {ins.cuit || 'N/A'}</p>
                            <Badge variant={ins.status === 'active' ? 'green' : 'gray'} className="mt-1">
                                {t(ins.status || 'active')}
                            </Badge>
                        </div>
                    </div>

                    <div className="item-content">
                        <div className="info-list">
                            <div className="info-row">
                                <span className="info-icon">📍</span>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ins.address || `${ins.name} Tandil`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-medium text-main-800 hover:text-blue-600 hover:underline text-sm truncate"
                                >
                                    {ins.address || t('search_on_map')}
                                </a>
                            </div>
                            <div className="info-row">
                                <span className="info-icon">📞</span>
                                <span className="font-medium text-sm">
                                    {ins.phoneNumbers && ins.phoneNumbers.length > 0 ? (
                                        <div className="flex flex-col">
                                            {ins.phoneNumbers.filter(p => p.is_primary).map(p => (
                                                <a key={p.id} href={`tel:${p.phone_number.replace(/[^0-9+]/g, '')}`} className="text-main-800 hover:text-blue-600 hover:underline">
                                                    {p.phone_number} {p.label && <span className="text-[10px] text-muted normal-case font-normal">({p.label})</span>}
                                                </a>
                                            ))}
                                            {ins.phoneNumbers.length > 1 && <span className="text-[10px] text-blue-500">+{ins.phoneNumbers.length - 1} {t('more')}</span>}
                                        </div>
                                    ) : (ins.phone ? (
                                        <a href={`tel:${ins.phone.replace(/[^0-9+]/g, '')}`} className="text-main-800 hover:text-blue-600 hover:underline">
                                            {ins.phone}
                                        </a>
                                    ) : t('no_phone'))}
                                </span>
                            </div>
                            <div className="info-row">
                                <span className="info-icon">✉️</span>
                                <span className="text-sm">
                                    {ins.email ? (
                                        <a href={`mailto:${ins.email}`} className="text-main-600 hover:text-blue-600 hover:underline">
                                            {ins.email}
                                        </a>
                                    ) : t('no_email')}
                                </span>
                            </div>
                            {ins.website && (
                                <div className="info-row">
                                    <span className="info-icon">🌐</span>
                                    <a href={ins.website.startsWith('http') ? ins.website : `https://${ins.website}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm truncate max-w-full">
                                        {ins.website}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="item-footer">
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
    );
};

export default React.memo(InsuranceList);
