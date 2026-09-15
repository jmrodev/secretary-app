import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import styles from './BehaviorRatingModal.module.css';

/**
 * BehaviorRatingModal (Molecule).
 * Allows staff to edit patient behavior rating (1-5 stars) and enter an explanatory note.
 */
export const BehaviorRatingModal = ({
    isOpen,
    patient,
    onClose,
    onSave,
    t
}) => {
    const fin = Number(patient?.financial_rating) || 5;
    const att = Number(patient?.attendance_rating) || 5;
    const derivedRating = Math.round((fin + att) / 2);
    const isCurrentlyManual = Boolean(patient?.behavior_rating_note && patient.behavior_rating_note.trim());

    const [rating, setRating] = useState(5);
    const [hoverRating, setHoverRating] = useState(0);
    const [note, setNote] = useState('');
    const [validationError, setValidationError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen && patient) {
            setRating(Number(patient.behavior_rating) || derivedRating);
            setNote(patient.behavior_rating_note || '');
            setHoverRating(0);
            setValidationError('');
            setSubmitting(false);
        }
    }, [isOpen, patient, derivedRating]);

    if (!isOpen || !patient) return null;

    const activeRating = hoverRating || rating;

    const handleConfirm = async () => {
        if (submitting) return;
        const trimmedNote = note.trim();
        if (!trimmedNote) {
            setValidationError(t('behavior_rating_note_required_warning'));
            return;
        }
        setValidationError('');
        setSubmitting(true);
        try {
            await onSave(patient.id, rating, trimmedNote);
        } finally {
            setSubmitting(false);
        }
    };

    const handleResetAuto = async () => {
        if (submitting) return;
        setSubmitting(true);
        try {
            await onSave(patient.id, null, null);
        } finally {
            setSubmitting(false);
        }
    };

    const patientDisplayName = patient.last_name
        ? `${patient.last_name.toUpperCase()} ${patient.first_name || ''}`.trim()
        : (patient.full_name || 'N/A');

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('edit_behavior_rating')}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={submitting}>
                        {t('cancel')}
                    </Button>
                    {isCurrentlyManual && (
                        <Button
                            variant="ghost"
                            onClick={handleResetAuto}
                            disabled={submitting}
                            icon={<Icon name="restart_alt" size="1rem" />}
                            title={t('behavior_rating_reset_auto')}
                        >
                            {t('behavior_rating_reset_auto')}
                        </Button>
                    )}
                    <Button
                        variant="primary"
                        onClick={handleConfirm}
                        disabled={submitting}
                        icon={<Icon name="save" size="1rem" />}
                    >
                        {t('save_rating')}
                    </Button>
                </>
            }
        >
            <div className={styles.BehaviorRatingModal__root}>
                <div className={styles.BehaviorRatingModal__patientInfo}>
                    <Icon name="person" size="1.2rem" />
                    <span className={styles.BehaviorRatingModal__patientLabel}>{t('patient')}:</span>
                    <strong className={styles.BehaviorRatingModal__patientName}>{patientDisplayName}</strong>
                </div>

                {/* Auto Calculation Summary Box */}
                <div className={styles.BehaviorRatingModal__derivedBox}>
                    <div className={styles.BehaviorRatingModal__derivedHeader}>
                        <div className={styles.BehaviorRatingModal__derivedTitle}>
                            <Icon name="auto_awesome" size="1rem" color="var(--primary-color)" />
                            <span>
                                {t('behavior_rating_auto')}: {derivedRating} / 5 ★
                            </span>
                        </div>
                        <span className={isCurrentlyManual ? styles.BehaviorRatingModal__badgeManual : styles.BehaviorRatingModal__badgeAuto}>
                            {isCurrentlyManual ? t('behavior_rating_manual_badge') : t('behavior_rating_auto')}
                        </span>
                    </div>
                    <span className={styles.BehaviorRatingModal__derivedDetails}>
                        {t('rating_financial')}: {fin}★ | {t('rating_attendance')}: {att}★ ({t('behavior_rating_auto_derived')})
                    </span>
                </div>

                <div className={styles.BehaviorRatingModal__field}>
                    <span id="behavior-rating-select-label" className={styles.BehaviorRatingModal__label}>
                        {t('behavior_rating_select_label')}
                    </span>
                    <div className={styles.BehaviorRatingModal__ratingSelector}>
                        <div
                            className={styles.BehaviorRatingModal__starsRow}
                            onMouseLeave={() => setHoverRating(0)}
                            role="radiogroup"
                            aria-labelledby="behavior-rating-select-label"
                        >
                            {[1, 2, 3, 4, 5].map((starVal) => {
                                const isFilled = starVal <= activeRating;
                                return (
                                    <button
                                        key={starVal}
                                        type="button"
                                        role="radio"
                                        aria-checked={rating === starVal}
                                        aria-label={`${starVal} / 5`}
                                        className={`${styles.BehaviorRatingModal__starBtn} ${!isFilled ? styles['BehaviorRatingModal__starBtn--empty'] : ''}`}
                                        onClick={() => {
                                            setRating(starVal);
                                            setValidationError('');
                                        }}
                                        onMouseEnter={() => setHoverRating(starVal)}
                                    >
                                        <Icon
                                            name={isFilled ? 'star' : 'star_outline'}
                                            size="1.6rem"
                                        />
                                    </button>
                                );
                            })}
                        </div>
                        <span className={styles.BehaviorRatingModal__ratingScore}>
                            {activeRating} / 5
                        </span>
                    </div>
                </div>

                <div className={styles.BehaviorRatingModal__field}>
                    <label htmlFor="behavior-rating-note" className={styles.BehaviorRatingModal__label}>
                        {t('behavior_rating_note_label')} *
                    </label>
                    <textarea
                        id="behavior-rating-note"
                        className={styles.BehaviorRatingModal__textarea}
                        value={note}
                        onChange={(e) => {
                            setNote(e.target.value);
                            if (validationError) setValidationError('');
                        }}
                        placeholder={t('behavior_rating_note_placeholder')}
                        rows={3}
                    />
                    {validationError ? (
                        <span className={styles.BehaviorRatingModal__errorText}>
                            <Icon name="error" size="0.85rem" />
                            {validationError}
                        </span>
                    ) : (
                        <span className={styles.BehaviorRatingModal__help}>
                            {t('behavior_rating_note_help')}
                        </span>
                    )}
                </div>
            </div>
        </Modal>
    );
};
