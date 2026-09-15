import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Icon } from '@/components/atoms/Icon';
import { RatingStars } from '@/components/atoms/RatingStars';
import { calculateAge } from '@/utils/core/dateUtils';
import styles from './PatientDetailsHeader.module.css';

/**
 * PatientDetailsHeader Organism.
 * Renders patient identity, ratings (Financial, Attendance, Behavior), debt status, and actions.
 */
export const PatientDetailsHeader = ({
    details,
    t,
    user,
    canEditRating = false,
    onBack,
    onEdit,
    onDelete,
    onToggleNew,
    onPrint,
    onPayDebt,
    onEditRating
}) => {
    if (!details) return null;

    const isManualBehavior = Boolean(details.behavior_rating_note && details.behavior_rating_note.trim());
    const behaviorTooltip = [
        t('rating_behavior_tooltip'),
        `${t('rating')}: ${details.behavior_rating || 5}/5 (${isManualBehavior ? t('behavior_rating_manual_badge') : t('behavior_rating_auto_derived')})`,
        details.behavior_rating_note ? `${t('behavior_note_tooltip_prefix')} ${details.behavior_rating_note}` : null,
        canEditRating ? `(${t('click_to_change')})` : null
    ].filter(Boolean).join('\n');

    const handleBehaviorClick = (e) => {
        if (!canEditRating || !onEditRating) return;
        onEditRating(e, details);
    };

    const hasDebt = Number(details.total_debt) > 0;
    const patientAge = details.dob ? calculateAge(details.dob) : null;

    return (
        <header className={styles.PatientDetailsHeader__root}>
            {/* Top Navigation & Actions Bar */}
            <div className={styles.PatientDetailsHeader__topBar}>
                <Button variant="secondary" size="sm" onClick={onBack} icon={<Icon name="arrow_back" size="1rem" />}>
                    {t('back_to_list')}
                </Button>

                <div className={styles.PatientDetailsHeader__actions}>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={onPrint}
                        icon={<Icon name="print" size="1rem" />}
                        className="no-print"
                    >
                        {t('print')}
                    </Button>

                    {user?.role === 'secretary' && (
                        <Button
                            size="sm"
                            variant={details.is_new_patient ? 'primary' : 'secondary'}
                            onClick={() => onToggleNew(details.id)}
                            icon={details.is_new_patient ? <Icon name="person_add" size="1rem" /> : <Icon name="person" size="1rem" />}
                        >
                            {details.is_new_patient ? t('new_patient') : t('existing_patient')}
                        </Button>
                    )}

                    <Button size="sm" variant="secondary" onClick={onEdit} icon={<Icon name="edit" size="1rem" />}>
                        {t('edit_info')}
                    </Button>

                    {(user?.role === 'admin' || user?.role === 'secretary') && (
                        <Button
                            size="sm"
                            variant="ghost"
                            className={styles.PatientDetailsHeader__deleteBtn}
                            onClick={() => onDelete(details)}
                            icon={<Icon name="delete" size="1rem" />}
                        >
                            {t('delete')}
                        </Button>
                    )}
                </div>
            </div>

            {/* Patient Identity & Overview Card */}
            <div className={styles.PatientDetailsHeader__identityCard}>
                <div className={styles.PatientDetailsHeader__mainInfo}>
                    <h1 className={styles.PatientDetailsHeader__title}>
                        {details.full_name || `${details.first_name || ''} ${details.last_name || ''}`.trim() || 'N/A'}
                    </h1>

                    <div className={styles.PatientDetailsHeader__chipsRow}>
                        {details.dni && (
                            <span className={styles.PatientDetailsHeader__chip}>
                                <Icon name="badge" size="0.9rem" />
                                <span>{t('dni')}: <strong>{details.dni}</strong></span>
                            </span>
                        )}

                        <span className={styles.PatientDetailsHeader__chip}>
                            <Icon name="health_and_safety" size="0.9rem" />
                            <span>
                                {details.insurance_name || t('particular')}
                                {details.affiliate_number && <small> ({details.affiliate_number})</small>}
                            </span>
                        </span>

                        {patientAge !== null && (
                            <span className={styles.PatientDetailsHeader__chip}>
                                <Icon name="cake" size="0.9rem" />
                                <span>{patientAge} {t('years')}</span>
                            </span>
                        )}

                        {hasDebt ? (
                            <Button
                                size="sm-compact"
                                variant="warning"
                                onClick={(e) => onPayDebt && onPayDebt(e, details.id, details.total_debt)}
                                className={styles.PatientDetailsHeader__debtBtn}
                                icon={<Icon name="payments" size="0.9rem" />}
                                title={t('pay_debt')}
                            >
                                ${Number(details.total_debt).toLocaleString()}
                            </Button>
                        ) : (
                            <Badge variant="success" size="sm">
                                {t('no_debt') || 'Al día'}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Ratings Cards Section */}
                <div className={styles.PatientDetailsHeader__ratingsGrid}>
                    {/* Financial Rating */}
                    <div
                        className={styles.PatientDetailsHeader__ratingCard}
                        title={`${t('rating_financial_tooltip') || t('rating_financial')}\n${t('rating')}: ${details.financial_rating || 5}/5`}
                    >
                        <span className={styles.PatientDetailsHeader__ratingLabel}>
                            {t('rating_financial') || 'Financiera'}
                        </span>
                        <RatingStars rating={details.financial_rating} colorClass="gold" size="14px" />
                    </div>

                    {/* Attendance Rating */}
                    <div
                        className={styles.PatientDetailsHeader__ratingCard}
                        title={`${t('rating_attendance_tooltip') || t('rating_attendance')}\n${t('rating')}: ${details.attendance_rating || 5}/5`}
                    >
                        <span className={styles.PatientDetailsHeader__ratingLabel}>
                            {t('rating_attendance') || 'Asistencia'}
                        </span>
                        <RatingStars rating={details.attendance_rating} colorClass="blue" size="14px" />
                    </div>

                    {/* Behavior Rating (Interactive for staff) */}
                    <div
                        className={`${styles.PatientDetailsHeader__ratingCard} ${styles.PatientDetailsHeader__ratingCardBehavior} ${canEditRating ? styles.PatientDetailsHeader__ratingCardInteractive : ''}`}
                        onClick={handleBehaviorClick}
                        onKeyDown={(e) => {
                            if (canEditRating && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                handleBehaviorClick(e);
                            }
                        }}
                        title={behaviorTooltip}
                        role={canEditRating ? 'button' : undefined}
                        tabIndex={canEditRating ? 0 : undefined}
                        aria-label={behaviorTooltip}
                    >
                        <div className={styles.PatientDetailsHeader__behaviorHeader}>
                            <span className={styles.PatientDetailsHeader__ratingLabel}>
                                {t('rating_conduct') !== 'rating_conduct' ? t('rating_conduct') : (t('rating_behavior') !== 'rating_behavior' ? t('rating_behavior') : 'Conducta')}
                            </span>
                            <span className={`${styles.PatientDetailsHeader__badge} ${isManualBehavior ? styles.PatientDetailsHeader__badgeManual : styles.PatientDetailsHeader__badgeAuto}`}>
                                {isManualBehavior ? t('behavior_rating_manual_badge') : t('behavior_rating_auto_derived')}
                            </span>
                        </div>

                        <div className={styles.PatientDetailsHeader__behaviorRow}>
                            <RatingStars rating={details.behavior_rating} colorClass="pink" size="14px" />
                            {details.behavior_rating_note && (
                                <span
                                    className={styles.PatientDetailsHeader__noteBadge}
                                    title={`${t('behavior_note_tooltip_prefix')} ${details.behavior_rating_note}`}
                                    aria-label={`${t('behavior_note_tooltip_prefix')} ${details.behavior_rating_note}`}
                                >
                                    <Icon name="chat_bubble" size="0.8rem" />
                                </span>
                            )}
                            {canEditRating && (
                                <Icon name="edit" size="0.8rem" className={styles.PatientDetailsHeader__editHint} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};
