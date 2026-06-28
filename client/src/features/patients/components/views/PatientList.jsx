import React from 'react';
import { Button } from '@/components/atoms/Button';
import Badge from '@/components/atoms/Badge';
import Icon from '@/components/atoms/Icon';
import styles from './PatientList.module.css';

const EMPTY_ARRAY = [];

const RatingStars = ({ rating, colorClass }) => {
    return (
        <div className={`${styles.stars} patient-list__stars--${colorClass}`}>
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
        <tr className={`${styles.row} ${styles.rowInstitution}`}>
            <td>
                <div className={`${styles.nameCell}`}>
                    <Icon name="account_balance" size="1.1rem" className={`${styles.instIcon}`} />
                    <span className={`${styles.instName}`}>
                        [INSTITUCIÓN] {inst.name}
                    </span>
                </div>
            </td>
            <td>
                <span className="patient-list__inst-type">{t('institution_debt') || 'Deuda Institucional'}</span>
            </td>
            <td></td>
            <td></td>
            <td>
                <Badge variant="warning">${Number(inst.total_debt).toLocaleString()}</Badge>
            </td>
            <td className={`${styles.actions}`}>
                <Button
                    size="sm-compact"
                    variant="link"
                    to={`/institutions`}
                    onClick={(e) => e.stopPropagation()}
                    icon={<Icon name="arrow_forward" size="1rem" />}
                >
                    {t('go') || 'Ir'}
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
            className={`${styles.row}`}
            role="button"
            tabIndex={0}
        >
            <td>
                <div className={`${styles.nameCell}`}>
                    <strong className={`${styles.name}`}>
                        {p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'N/A'}
                    </strong>
                    {p.is_new_patient === 1 && <Badge variant="blue" size="sm">NEW</Badge>}

                    {p.attended_appointments > 0 && (
                        <Badge variant="success" size="sm" title={`${t('attended_appointments') || 'Visitas'}: ${p.attended_appointments}`}>
                            <Icon name="history" size="0.8rem" /> {p.attended_appointments}
                        </Badge>
                    )}
                </div>
            </td>
            <td>
                <div className={`${styles.idInfo}`}>
                    {p.dni && <span><span className={`${styles.idLabel}`}>DNI:</span> {p.dni}</span>}
                    {(p.insurance_name || p.insurance) && <span><span className={`${styles.idLabel}`}>OS:</span> {p.insurance_name || p.insurance}</span>}
                </div>
            </td>
            <td>
                <div className={`${styles.contactInfo}`}>
                    {p.phone ? (
                        <div className={`${styles.contactRow}`}>
                            <Button
                                to={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                variant="whatsapp"
                                size="sm-compact"
                                onClick={(e) => e.stopPropagation()}
                                title="WhatsApp"
                                icon={<Icon name="send" size="1.1rem" />}
                            />
                            <Button
                                to={`tel:${p.phone.replace(/[^0-9+]/g, '')}`}
                                variant="phone"
                                size="sm"
                                className={`${styles.contactLink}`}
                                onClick={(e) => e.stopPropagation()}
                                title="Llamar"
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
                <div className={`${styles.ratingGroup}`}>
                    <div className={`${styles.ratingItem}`} title={`${t('rating_financial_tooltip')}\nDeuda Actual: $${p.total_debt}`}>
                        <span className={`${styles.ratingLabel}`}>FIN</span>
                        <RatingStars rating={p.financial_rating} colorClass="gold" />
                    </div>
                    <div className={`${styles.ratingItem}`} title={`${t('rating_attendance_tooltip')}\nResumen: ${p.total_appointments - p.missed_appointments}/${p.total_appointments}`}>
                        <span className={`${styles.ratingLabel}`}>ASIST</span>
                        <RatingStars rating={p.attendance_rating} colorClass="blue" />
                    </div>
                    <div
                        className={`${styles.ratingItem} patient-list__rating-item--interactive`}
                        onClick={(e) => onToggleRating(e, p.id, p.behavior_rating)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onToggleRating(e, p.id, p.behavior_rating);
                            }
                        }}
                        title={`${t('rating_behavior_tooltip')}\nCalificación: ${p.behavior_rating || 5}/5 (Click para cambiar)`}
                        role="button"
                        tabIndex={0}
                    >
                        <span className={`${styles.ratingLabel}`}>COND</span>
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
                        className={`${styles.debtBadge}`}
                        icon={<Icon name="payments" size="1rem" />}
                    >
                        ${p.total_debt}
                    </Button>
                ) : (
                    <span className={`${styles.zeroDebt}`}>$0.00</span>
                )}
            </td>
            <td className={`${styles.actions}`}>
                <Button
                    variant="info"
                    size="sm-compact"
                    className={`${styles.viewBtn}`}
                    icon={<Icon name="badge" />}
                >
                    {t('view_details') || 'Ficha'}
                </Button>
            </td>
        </tr>
    );
};

/**
 * PatientList (Executor).
 * Renders a tabular list of patients with search filtering and actions.
 */
const PatientList = ({
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
            <section className={`${styles.empty}`}>
                <h2 className="visually-hidden">{t('patient_list')}</h2>
                <p className={`${styles.emptyText}`}>{t('no_patients_found')}</p>
            </section>
        );
    }

    return (
        <section className={`${styles.root}`}>
            <h2 className="visually-hidden">{t('patient_list')}</h2>
            <table className={`${styles.table}`}>
                <thead>
                    <tr>
                        <th>{t('patient')}</th>
                        <th>{t('identification')} / OS</th>
                        <th>{t('contact')}</th>
                        <th>{t('ratings')}</th>
                        <th>{t('debt')}</th>
                        <th className={`${styles.actions}`}>{t('actions')}</th>
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

export default React.memo(PatientList);
