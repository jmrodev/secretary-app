import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';
import { RatingStars } from '@/components/atoms/RatingStars';
import styles from './PatientList.module.css';

const EMPTY_ARRAY = [];

const InstitutionRow = ({ inst, t }) => {
    if (Number(inst.total_debt) <= 0) return null;
    return (
        <tr className={`${styles.PatientList__row} ${styles.PatientList__rowInstitution}`}>
            <td>
                <div className={styles.PatientList__nameCell}>
                    <Icon name="account_balance" size="1.1rem" className={styles.PatientList__instIcon} />
                    <span className={styles.PatientList__instName}>
                        {t('institution_prefix')}: {inst.name}
                    </span>
                </div>
            </td>
            <td>
                <span className={styles.PatientList__instType}>{t('institution_debt')}</span>
            </td>
            <td></td>
            <td colSpan="3"></td>
            <td>
                <Badge variant="warning">${Number(inst.total_debt).toLocaleString()}</Badge>
            </td>
            <td className={styles.PatientList__actions}>
                <Button
                    size="sm-compact"
                    variant="ghost"
                    to="/institutions"
                    onClick={(e) => e.stopPropagation()}
                    title={t('go')}
                    icon={<Icon name="arrow_forward" size="1rem" />}
                />
            </td>
        </tr>
    );
};

const PatientRow = ({
    p,
    onViewDetails,
    onOpenDebt,
    onToggleRating,
    onEditRating,
    canEditRating = true,
    t
}) => {
    const handleRatingClick = (e) => {
        if (!canEditRating) return;
        if (onEditRating) {
            onEditRating(e, p);
        } else if (onToggleRating) {
            onToggleRating(e, p.id, p.behavior_rating);
        }
    };

    const isManualBehavior = Boolean(p.behavior_rating_note && p.behavior_rating_note.trim());
    const behaviorTooltip = [
        t('rating_behavior_tooltip'),
        `${t('rating')}: ${p.behavior_rating || 5}/5 (${isManualBehavior ? t('behavior_rating_manual_badge') : t('behavior_rating_auto_derived')})`,
        p.behavior_rating_note ? `${t('behavior_note_tooltip_prefix')} ${p.behavior_rating_note}` : null,
        canEditRating ? `(${t('click_to_change')})` : null
    ].filter(Boolean).join('\n');
    return (
        <tr className={styles.PatientList__row}>
            <td>
                <div className={styles.PatientList__patientCol}>
                    <div className={styles.PatientList__name}>
                        {p.last_name ? (
                            <>
                                <strong className={styles.PatientList__lastName}>{p.last_name.toUpperCase()}</strong>
                                <span className={styles.PatientList__firstName}>{p.first_name || ''}</span>
                            </>
                        ) : (
                            <strong className={styles.PatientList__lastName}>{p.full_name || t('not_available') || 'N/A'}</strong>
                        )}
                    </div>
                    {((Boolean(p.is_new_patient) || Number(p.is_new_patient) === 1) || Number(p.attended_appointments) > 0) && (
                        <div className={styles.PatientList__badgeRow}>
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
                <div className={styles.PatientList__idInfo}>
                    {p.dni && (
                        <span className={styles.PatientList__idItem}>
                            <span className={styles.PatientList__idLabel}>{t('dni')}:</span> {p.dni}
                        </span>
                    )}
                    {(p.insurance_name || p.insurance) && (
                        <span className={styles.PatientList__idItem}>
                            <span className={styles.PatientList__idLabel}>{t('insurance_short')}:</span> {p.insurance_name || p.insurance}
                        </span>
                    )}
                </div>
            </td>
            <td>
                <div className={styles.PatientList__contactInfo}>
                    {p.phone ? (
                        <div className={styles.PatientList__contactRow}>
                            <Button
                                to={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                variant="action-whatsapp"
                                size="sm-compact"
                                onClick={(e) => e.stopPropagation()}
                                title={t('whatsapp')}
                                icon={<Icon name="chat" size="1rem" />}
                            />
                            <Button
                                to={`tel:${p.phone.replace(/[^0-9+]/g, '')}`}
                                variant="phone"
                                size="sm"
                                className={styles.PatientList__contactLink}
                                onClick={(e) => e.stopPropagation()}
                                title={t('call')}
                                icon={<Icon name="call" size="0.9rem" />}
                            >
                                {p.phone}
                            </Button>
                        </div>
                    ) : (
                        <div className={styles.PatientList__noContact}>
                            <Icon name="phone_disabled" size="0.85rem" />
                            <span>{t('no_phone_short')}</span>
                        </div>
                    )}

                    {p.email && (
                        <Button
                            to={`mailto:${p.email}`}
                            variant="link"
                            size="sm"
                            className={styles.PatientList__contactLinkEmail}
                            onClick={(e) => e.stopPropagation()}
                            icon={<Icon name="mail" size="0.85rem" />}
                        >
                            {p.email}
                        </Button>
                    )}
                </div>
            </td>
            {/* 3 Subcolumnas de Calificaciones */}
            <td
                className={styles.PatientList__subRatingCell}
                title={`${t('rating_financial_tooltip')}\n${t('current_debt')}: $${Number(p.total_debt || 0).toLocaleString()}`}
            >
                <RatingStars rating={p.financial_rating} colorClass="gold" />
            </td>
            <td
                className={styles.PatientList__subRatingCell}
                title={`${t('rating_attendance_tooltip')}\n${t('summary')}: ${Number(p.total_appointments || 0) - Number(p.missed_appointments || 0)}/${Number(p.total_appointments || 0)}`}
            >
                <RatingStars rating={p.attendance_rating} colorClass="blue" />
            </td>
            <td
                className={`${styles.PatientList__subRatingCell} ${canEditRating ? styles.PatientList__ratingItemInteractive : ''}`}
                onClick={handleRatingClick}
                onKeyDown={(e) => {
                    if (canEditRating && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleRatingClick(e);
                    }
                }}
                title={behaviorTooltip}
                role={canEditRating ? 'button' : undefined}
                tabIndex={canEditRating ? 0 : undefined}
                aria-label={behaviorTooltip}
            >
                <div className={styles.PatientList__behaviorWrapper}>
                    <RatingStars rating={p.behavior_rating} colorClass="pink" />
                    {p.behavior_rating_note && (
                        <span
                            className={styles.PatientList__noteBadge}
                            title={`${t('behavior_note_tooltip_prefix')} ${p.behavior_rating_note}`}
                            aria-label={`${t('behavior_note_tooltip_prefix')} ${p.behavior_rating_note}`}
                        >
                            <Icon name="chat_bubble" size="0.75rem" />
                        </span>
                    )}
                    {canEditRating && (
                        <Icon name="edit" size="0.75rem" className={styles.PatientList__ratingEditHint} />
                    )}
                </div>
            </td>
            <td>
                {Number(p.total_debt) > 0 ? (
                    <Button
                        size="sm-compact"
                        variant="warning"
                        onClick={(e) => onOpenDebt(e, p.id, p.total_debt)}
                        className={styles.PatientList__debtBadge}
                        icon={<Icon name="payments" size="0.9rem" />}
                    >
                        ${Number(p.total_debt).toLocaleString()}
                    </Button>
                ) : (
                    <span className={styles.PatientList__zeroDebt}>
                        <Icon name="check" size="0.8rem" />
                        $0.00
                    </span>
                )}
            </td>
            <td className={styles.PatientList__actions}>
                <Button
                    variant="action-view"
                    size="sm-compact"
                    icon={<Icon name="visibility" size="1rem" />}
                    onClick={() => onViewDetails(p.id)}
                    title={t('view_details')}
                    aria-label={t('view_details')}
                />
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
    onEditRating,
    canEditRating = true,
    t
}) => {
    const institutions = Array.isArray(rawInstitutions) ? rawInstitutions : (rawInstitutions?.institutions || EMPTY_ARRAY);

    if (patients.length === 0 && institutions.length === 0) {
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
                        <th rowSpan={2}>{t('patient')}</th>
                        <th rowSpan={2}>{t('identification')} / {t('insurance_short') || 'OS'}</th>
                        <th rowSpan={2}>{t('contact')}</th>
                        <th colSpan={3} className={styles.PatientList__ratingsGroupHeader}>{t('ratings')}</th>
                        <th rowSpan={2}>{t('debt')}</th>
                        <th rowSpan={2} className={styles.PatientList__actions}>{t('actions')}</th>
                    </tr>
                    <tr>
                        <th className={styles.PatientList__subRatingHeader} title={t('rating_financial_tooltip')}>
                            {t('rating_financial')}
                        </th>
                        <th className={styles.PatientList__subRatingHeader} title={t('rating_attendance_tooltip')}>
                            {t('rating_attendance')}
                        </th>
                        <th className={styles.PatientList__subRatingHeader} title={t('rating_behavior_tooltip')}>
                            {t('rating_conduct') || t('rating_behavior')}
                        </th>
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
                            onEditRating={onEditRating}
                            canEditRating={canEditRating}
                            t={t} 
                        />
                    ))}
                </tbody>
            </table>
        </section>
    );
};

export const PatientList = React.memo(PatientListBase);