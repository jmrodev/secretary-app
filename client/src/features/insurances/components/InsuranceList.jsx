import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './InsuranceList.module.css';

const getInitials = (name) => {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
};

export const InsuranceList = React.memo(({ insurances, onEdit, onDelete, hasFilter }) => {
    const { t } = useLanguage();

    if (insurances.length === 0) {
        return (
            <section className={`${styles.InsuranceList__empty}`}>
                <p className={`${styles.InsuranceList__emptyText}`}>
                    {hasFilter ? t('no_results_found') : t('no_insurances_registered')}
                </p>
            </section>
        );
    }

    return (
        <section className={`${styles.InsuranceList__insuranceList}`}>
            <div className={`${styles.InsuranceList__grid}`}>
                {insurances.map(ins => (
                    <article key={ins.id} className={`${styles.InsuranceList__root}`}>
                        <header className={`${styles.InsuranceList__header}`}>
                            <div className={`${styles.InsuranceList__avatar}`}>
                                {getInitials(ins.name)}
                            </div>
                            <div className={`${styles.InsuranceList__info}`}>
                                <h3 className={`${styles.InsuranceList__name}`}>{ins.name}</h3>
                                <p className={`${styles.InsuranceList__cuit}`}>CUIT: {ins.cuit || 'N/A'}</p>
                                <Badge variant={ins.status === 'active' ? 'green' : 'gray'} className={`${styles.InsuranceList__badge}`}>
                                    {t(ins.status || 'active')}
                                </Badge>
                            </div>
                        </header>

                        <div className={`${styles.InsuranceList__body}`}>
                            <div className={`${styles.InsuranceList__dataList}`}>
                                <div className={`${styles.InsuranceList__dataRow}`}>
                                    <span className={`${styles.InsuranceList__dataIcon}`}><Icon name="map" size="1rem" /></span>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ins.address || `${ins.name} Tandil`)}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className={`${styles.InsuranceList__dataValue} ${styles.InsuranceList__link}`}
                                    >
                                        {ins.address || t('search_on_map')}
                                    </a>
                                </div>
                                <div className={`${styles.InsuranceList__dataRow}`}>
                                    <span className={`${styles.InsuranceList__dataIcon}`}><Icon name="phone" size="1rem" /></span>
                                    <div className={`${styles.InsuranceList__dataValue}`}>
                                        {ins.phoneNumbers && ins.phoneNumbers.length > 0 ? (
                                            <div className={`${styles.InsuranceList__phones}`}>
                                                {ins.phoneNumbers.reduce((acc, p) => {
                                                    if (p.is_primary) {
                                                        acc.push(
                                                            <a key={p.id} href={`tel:${p.phone_number.replace(/[^0-9+]/g, '')}`} className={`${styles.InsuranceList__link}`}>
                                                                {p.phone_number} {p.label && <span className={`${styles.InsuranceList__phoneTag}`}>({p.label})</span>}
                                                            </a>
                                                        );
                                                    }
                                                    return acc;
                                                }, [])}
                                                {ins.phoneNumbers.length > 1 && <span className={`${styles.InsuranceList__morePhones}`}>+{ins.phoneNumbers.length - 1} {t('more')}</span>}
                                            </div>
                                        ) : (ins.phone ? (
                                            <a href={`tel:${ins.phone.replace(/[^0-9+]/g, '')}`} className={`${styles.InsuranceList__link}`}>
                                                {ins.phone}
                                            </a>
                                        ) : t('no_phone'))}
                                    </div>
                                </div>
                                <div className={`${styles.InsuranceList__dataRow}`}>
                                    <span className={`${styles.InsuranceList__dataIcon}`}><Icon name="mail" size="1rem" /></span>
                                    <div className={`${styles.InsuranceList__dataValue}`}>
                                        {ins.email ? (
                                            <a href={`mailto:${ins.email}`} className={`${styles.InsuranceList__link}`}>
                                                {ins.email}
                                            </a>
                                        ) : t('no_email')}
                                    </div>
                                </div>
                                {ins.website && (
                                    <div className={`${styles.InsuranceList__dataRow}`}>
                                        <span className={`${styles.InsuranceList__dataIcon}`}><Icon name="language" size="1rem" /></span>
                                        <a href={ins.website.startsWith('http') ? ins.website : `https://${ins.website}`} target="_blank" rel="noreferrer" className={`${styles.InsuranceList__dataValue} ${styles.InsuranceList__link}`} title={ins.website}>
                                            {ins.website}
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>

                        <footer className={`${styles.InsuranceList__footer}`}>
                            <Button
                                variant="action-edit"
                                size="sm-compact"
                                onClick={() => onEdit(ins)}
                                title={t('edit')}
                                icon={<Icon name="edit" size="1rem" />}
                            />
                            <Button
                                variant="action-delete"
                                size="sm-compact"
                                onClick={() => onDelete(ins.id)}
                                title={t('delete')}
                                icon={<Icon name="delete" size="1rem" />}
                            />
                        </footer>
                    </article>
                ))}
            </div>
        </section>
    );
});
