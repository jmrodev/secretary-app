import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';
import styles from './PatientList.module.css';

const EMPTY_ARRAY = [];

const RatingStars = ({ rating, colorClass }) => {
    return (
        <div className={`${styles.PatientList__stars} patient-list__stars--${colorClass}`}>
            {[1, 2, 3, 4, 5].map(s => (
                <Icon
                    key={s}
                    name={s <= (rating || 5) ? 'star' : 'star_outline'}
                    size="12px"
                />
            ))}
        </div>
    );
};

const InstitutionRow = ({ inst, t }) => {
    if (Number(inst.total_debt) <= 0) return null;
    return (
        <tr className={`${styles.PatientList__row} ${styles.PatientList__rowInstitution}`}>
            <td>
                <div className={`${styles.nameCell}`}>
                    <Icon name="account_balance" size="1.1rem" className={`${styles.PatientList__instIcon}`} />
                    <span className={`${styles.PatientList__instName}`}>
                        {t('institution_prefix')}: {inst.name}
                    </span>
                </div>
            </td>
            <td>
                <span className="patient-list__inst-type">{t('institution_debt')}</span>
            </td>
            <td></td>
            <td></td>
            <td>
                <Badge variant="warning">${Number(inst.total_debt).toLocaleString()}</Badge>
            </td>
            <td className={`${styles.PatientList__actions}`}>
                <Button
                    size="sm-compact"
                    variant="link"
                    to={`/institutions`}
                    onClick={(e) => e.stopPropagation()}
                    icon={<Icon name="arrow_forward" size="1rem" />}
                >
                    {t('go')}
                </Button>
            </td>
        </tr>
    );
};

const PatientRow = ({ p, onViewDetails, onOpenDebt, onToggleRating, t }) => {
    return (
        <tr
            onClick={() => onViewDetails(p.id)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onViewDetails(p.id);
                }
            }}
            className={`${styles.PatientList__row}`}
        >
            <td>
                <div className={`${styles.PatientList__patientCol}`}>
                    <strong className={`${styles.PatientList__name}`}>
                        {p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'N/A'}
                    </strong>
                    {((Boolean(p.is_new_patient) || Number(p.is_new_patient) === 1) || Number(p.attended_appointments) > 0) && (
                        <div className={`${styles.PatientList__badgeRow}`}>
                            {(Boolean(p.is_new_patient) || Number(p.is_new_patient) === 1) && (
                                <Badge variant="blue" size="sm">{t('new_patient_badge')}</Badge>
                            )}

                            {Number(p.attended_appointments) > 0 && (
                                <Badge variant="success" size="sm" title={`${t('attended_appointments')}: ${p.attended_appointments}`}>
                                    <Icon name="history" size="0.75rem" /> {p.attended_appointments} {p.attended_appointments === 1 ? (t('visit')) : (t('visits'))}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </td>
            <td>
                <div className={`${styles.PatientList__idInfo}`}>
                    {p.dni && <span><span className={`${styles.PatientList__idLabel}`}>{t('dni')}:</span> {p.dni}</span>}
                    {(p.insurance_name || p.insurance) && <span><span className={`${styles.PatientList__idLabel}`}>{t('insurance_short')}:</span> {p.insurance_name || p.insurance}</span>}
                </div>
            </td>
            <td>
                <div className={`${styles.PatientList__contactInfo}`}>
                    {p.phone ? (
                        <div className={`${styles.PatientList__contactRow}`}>
                            <Button
                                to={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                variant="whatsapp"
                                size="sm-compact"
                                onClick={(e) => e.stopPropagation()}
                                title={t('whatsapp')}
                                icon={<Icon name="send" size="1.1rem" />}
                            />
                            <Button
                                to={`tel:${p.phone.replace(/[^0-9+]/g, '')}`}
                                variant="phone"
                                size="sm"
                                className={`${styles.PatientList__contactLink}`}
                                onClick={(e) => e.stopPropagation()}
                                title={t('call')}
                                icon={<Icon name="call" size="0.9rem" />}
                            >
                                {p.phone}
                            </Button>
                        </div>
                    ) : <div className="patient-list__no-contact">{t('no_phone_short')}</div>}

                    {p.email && (
                        <Button
                            to={`mailto:${p.email}`}
                            variant="link"
                            size="sm"
                            className="patient-list__contact-link--email"
                            onClick={(e) => e.stopPropagation()}
                            icon={<Icon name="mail" size="0.9rem" />}
                        >
                            {p.email}
                        </Button>
                    )}
                </div>
            </td>
            <td>
                <div className={`${styles.PatientList__ratingGroup}`}>
                    <div className={`${styles.PatientList__ratingItem}`} title={`${t('rating_financial_tooltip')}\n${t('current_debt')}: $${p.total_debt}`}>
                        <span className={`${styles.PatientList__ratingLabel}`}>{t('financial_rating_short')}</span>
                        <RatingStars rating={p.financial_rating} colorClass="gold" />
                    </div>
                    <div className={`${styles.PatientList__ratingItem}`} title={`${t('rating_attendance_tooltip')}\n${t('summary')}: ${p.total_appointments - p.missed_appointments}/${p.total_appointments}`}>
                        <span className={`${styles.PatientList__ratingLabel}`}>{t('attendance_rating_short')}</span>
                        <RatingStars rating={p.attendance_rating} colorClass="blue" />
                    </div>
                    <div
                        className={`${styles.PatientList__ratingItem} patient-list__rating-item--interactive`}
                        onClick={(e) => onToggleRating(e, p.id, p.behavior_rating)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onToggleRating(e, p.id, p.behavior_rating);
                            }
                        }}
                        title={`${t('rating_behavior_tooltip')}\n${t('rating')}: ${p.behavior_rating || 5}/5 (${t('click_to_change')})`}
                        role="button"
                        tabIndex={0}
                    >
                        <span className={`${styles.PatientList__ratingLabel}`}>{t('behavior_rating_short')}</span>
                        <RatingStars rating={p.behavior_rating} colorClass="pink" />
                    </div>
                </div>
            </td>
            <td>
                {Number(p.total_debt) > 0 ? (
                    <Button
                        size="sm-compact"
                        variant="warning"
                        onClick={(e) => onOpenDebt(e, p.id, p.total_debt)}
                        className={`${styles.PatientList__debtBadge}`}
                        icon={<Icon name="payments" size="0.9rem" />}
                    >
                        ${Number(p.total_debt).toLocaleString()}
                    </Button>
                ) : (
                    <span className={`${styles.PatientList__zeroDebt}`}>$0.00</span>
                )}
            </td>
            <td className={`${styles.PatientList__actions}`}>
                <Button
                    variant="info"
                    size="sm-compact"
                    className={`${styles.PatientList__viewBtn}`}
                    icon={<Icon name="badge" />}
                    onClick={(e) => { e.stopPropagation(); onViewDetails(p.id); }}
                >
                    {t('view_details')}
                </Button>
            </td>
        </tr>
    );
};

/**
 * PatientList (Executor).
 * Renders a tabular list of patients with search filtering and actions.
 */
const PatientListBase = ({
    patients,
    institutions: rawInstitutions = EMPTY_ARRAY,
    onViewDetails,
    onOpenDebt,
    onToggleRating,
    t
}) => {
    const institutions = Array.isArray(rawInstitutions) ? rawInstitutions : (rawInstitutions?.institutions || EMPTY_ARRAY);

    if (patients.length === 0) {
        return (
            <section className={`${styles.PatientList__empty}`}>
                <p className={`${styles.PatientList__emptyText}`}>{t('no_patients_found')}</p>
            </section>
        );
    }

    return (
        <section className={`${styles.PatientList__root}`}>
            <table className={`${styles.PatientList__table}`}>
                <thead>
                    <tr>
                        <th>{t('patient')}</th>
                        <th>{t('identification')} / OS</th>
                        <th>{t('contact')}</th>
                        <th>{t('ratings')}</th>
                        <th>{t('debt')}</th>
                        <th className={`${styles.PatientList__actions}`}>{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {institutions.map(inst => (
                        <InstitutionRow key={`inst-${inst.id}`} inst={inst} t={t} />
                    ))}

                    {patients.map(p => (
                        <PatientRow 
                            key={p.id} 
                            p={p} 
                            onViewDetails={onViewDetails} 
                            onOpenDebt={onOpenDebt} 
                            onToggleRating={onToggleRating} 
                            t={t} 
                        />
                    ))}
                </tbody>
            </table>
        </section>
    );
};

export const PatientList = React.memo(PatientListBase);