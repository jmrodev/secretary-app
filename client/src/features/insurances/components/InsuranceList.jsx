import React from 'react';
import Button from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './InsuranceList.module.css';

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
            <section className={`${styles.empty}`}>
                <p className={`${styles.emptyText}`}>
                    {hasFilter ? t('no_results_found') : t('no_insurances_registered')}
                </p>
            </section>
        );
    }

    return (
        <section className={`${styles.insuranceList}`}>
            <div className={`${styles.grid}`}>
                {insurances.map(ins => (
                    <article key={ins.id} className={`${styles.root}`}>
                        <header className={`${styles.header}`}>
                            <div className={`${styles.avatar}`}>
                                {getInitials(ins.name)}
                            </div>
                            <div className={`${styles.info}`}>
                                <h3 className={`${styles.name}`}>{ins.name}</h3>
                                <p className={`${styles.cuit}`}>CUIT: {ins.cuit || 'N/A'}</p>
                                <Badge variant={ins.status === 'active' ? 'green' : 'gray'} className={`${styles.badge}`}>
                                    {t(ins.status || 'active')}
                                </Badge>
                            </div>
                        </header>

                        <div className={`${styles.body}`}>
                            <div className={`${styles.dataList}`}>
                                <div className={`${styles.dataRow}`}>
                                    <span className={`${styles.dataIcon}`}><Icon name="map" size="1rem" /></span>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ins.address || `${ins.name} Tandil`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`${styles.dataValue} ${styles.link}`}
                                    >
                                        {ins.address || t('search_on_map')}
                                    </a>
                                </div>
                                <div className={`${styles.dataRow}`}>
                                    <span className={`${styles.dataIcon}`}><Icon name="phone" size="1rem" /></span>
                                    <div className={`${styles.dataValue}`}>
                                        {ins.phoneNumbers && ins.phoneNumbers.length > 0 ? (
                                            <div className={`${styles.phones}`}>
                                                {ins.phoneNumbers.reduce((acc, p) => {
                                                    if (p.is_primary) {
                                                        acc.push(
                                                            <a key={p.id} href={`tel:${p.phone_number.replace(/[^0-9+]/g, '')}`} className={`${styles.link}`}>
                                                                {p.phone_number} {p.label && <span className={`${styles.phoneTag}`}>({p.label})</span>}
                                                            </a>
                                                        );
                                                    }
                                                    return acc;
                                                }, [])}
                                                {ins.phoneNumbers.length > 1 && <span className={`${styles.morePhones}`}>+{ins.phoneNumbers.length - 1} {t('more')}</span>}
                                            </div>
                                        ) : (ins.phone ? (
                                            <a href={`tel:${ins.phone.replace(/[^0-9+]/g, '')}`} className={`${styles.link}`}>
                                                {ins.phone}
                                            </a>
                                        ) : t('no_phone'))}
                                    </div>
                                </div>
                                <div className={`${styles.dataRow}`}>
                                    <span className={`${styles.dataIcon}`}><Icon name="mail" size="1rem" /></span>
                                    <div className={`${styles.dataValue}`}>
                                        {ins.email ? (
                                            <a href={`mailto:${ins.email}`} className={`${styles.link}`}>
                                                {ins.email}
                                            </a>
                                        ) : t('no_email')}
                                    </div>
                                </div>
                                {ins.website && (
                                    <div className={`${styles.dataRow}`}>
                                        <span className={`${styles.dataIcon}`}><Icon name="language" size="1rem" /></span>
                                        <a href={ins.website.startsWith('http') ? ins.website : `https://${ins.website}`} target="_blank" rel="noreferrer" className={`${styles.dataValue} ${styles.link}`} title={ins.website}>
                                            {ins.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        <footer className={`${styles.footer}`}>
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
                        </footer>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default React.memo(InsuranceList);
