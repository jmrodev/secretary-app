import React from 'react';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { formatDate } from '@/utils/core/dateUtils';
import styles from './PatientMedicationsTab.module.css';

/**
 * PatientMedicationsTab Organism Component.
 * Displays chronic medications cards and prescription history table.
 */
export const PatientMedicationsTab = ({
    details,
    chronicMeds = [],
    allPrescriptions = [],
    t,
    onAddMedication,
    onEditMedication,
    onNewPrescription,
    onCopyRxLink,
    onSendRxWhatsapp,
    onViewPrescription
}) => {
    return (
        <div className={styles.PatientMedicationsTab__root}>
            {/* Current Medication Section */}
            <section className={styles.PatientMedicationsTab__block}>
                <header className={styles.PatientMedicationsTab__blockHeader}>
                    <h3 className={styles.PatientMedicationsTab__blockTitle}>
                        <Icon name="medication" size="1.2rem" />
                        <span>{t('current_medication')}</span>
                    </h3>
                    <Button
                        size="sm"
                        variant="primary"
                        icon={<Icon name="add" size="1rem" />}
                        onClick={onAddMedication}
                    >
                        {t('add_medication')}
                    </Button>
                </header>

                <div className={styles.PatientMedicationsTab__blockContent}>
                    {chronicMeds.length > 0 ? (
                        <div className={styles.PatientMedicationsTab__medsGrid}>
                            {chronicMeds.map((m) => (
                                <div
                                    key={m.id || `med-${m.name}-${m.dose || ''}`}
                                    className={styles.PatientMedicationsTab__medCard}
                                >
                                    <div className={styles.PatientMedicationsTab__medCardTop}>
                                        <div className={styles.PatientMedicationsTab__medCardHeader}>
                                            <span className={styles.PatientMedicationsTab__iconPrimary}>
                                                <Icon name="medication" size="1.3rem" />
                                            </span>
                                            <div>
                                                <div className={styles.PatientMedicationsTab__medName}>
                                                    {m.medication_name || m.name || '—'}
                                                </div>
                                                {m.monodroga && (
                                                    <small className={styles.PatientMedicationsTab__medMono}>
                                                        {m.monodroga} {m.presentation ? `(${m.presentation})` : ''}
                                                    </small>
                                                )}
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm-compact"
                                            title={t('edit')}
                                            icon={<Icon name="edit" size="0.9rem" />}
                                            onClick={() => onEditMedication(m)}
                                        />
                                    </div>

                                    <div className={styles.PatientMedicationsTab__medTags}>
                                        {m.dose && (
                                            <span className={styles.PatientMedicationsTab__tagDose}>
                                                💊 {m.dose}
                                            </span>
                                        )}
                                        {m.frequency && (
                                            <span className={styles.PatientMedicationsTab__tagFreq}>
                                                ⏱️ {m.frequency}
                                            </span>
                                        )}
                                        {m.boxes_count > 0 && (
                                            <span className={styles.PatientMedicationsTab__tagBoxes}>
                                                📦 {m.boxes_count} {m.boxes_count === 1 ? t('box') : t('boxes_plural')}
                                            </span>
                                        )}
                                    </div>

                                    {m.notes && (
                                        <div className={styles.PatientMedicationsTab__medNotes}>
                                            📝 {m.notes}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className={styles.PatientMedicationsTab__emptyState}>
                            <p className={styles.PatientMedicationsTab__emptyText}>
                                {t('no_current_medications')}
                            </p>
                            <Button
                                size="sm"
                                variant="secondary"
                                icon={<Icon name="add" size="1rem" />}
                                onClick={onAddMedication}
                            >
                                {t('add_first_medication')}
                            </Button>
                        </div>
                    )}
                </div>
            </section>

            {/* Prescriptions Repository Table */}
            <section className={styles.PatientMedicationsTab__block}>
                <header className={styles.PatientMedicationsTab__blockHeader}>
                    <h3 className={styles.PatientMedicationsTab__blockTitle}>
                        <Icon name="folder_open" size="1.2rem" />
                        <span>{t('recent_prescriptions')}</span>
                    </h3>
                    <Button
                        size="sm"
                        variant="primary"
                        icon={<Icon name="add" size="1rem" />}
                        onClick={onNewPrescription}
                    >
                        {t('new_prescription')}
                    </Button>
                </header>

                <div className={styles.PatientMedicationsTab__blockContent}>
                    {allPrescriptions.length > 0 ? (
                        <div className={styles.PatientMedicationsTab__tableResponsive}>
                            <table className={styles.PatientMedicationsTab__table}>
                                <thead>
                                    <tr>
                                        <th>{t('appointment_date')}</th>
                                        <th>{t('appointment_doctor')}</th>
                                        <th>{t('medications')}</th>
                                        <th>{t('status')}</th>
                                        <th className={styles.PatientMedicationsTab__thRight}>{t('actions')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {allPrescriptions.map((r) => {
                                        const isOfficial = Boolean(r.token || r.type === 'official');
                                        const medText = r.request_note || r.medications || r.doctor_note || '—';
                                        return (
                                            <tr key={r.id || `req-${r.doctor_name || r.created_at || ''}`}>
                                                <td className={styles.PatientMedicationsTab__tdDate}>
                                                    {formatDate(r.created_at || r.appointment_date)}
                                                </td>
                                                <td className={styles.PatientMedicationsTab__tdDoctor}>
                                                    {r.doctor_name || '—'}
                                                </td>
                                                <td>
                                                    <div className={styles.PatientMedicationsTab__medText}>
                                                        {medText}
                                                    </div>
                                                    {r.diagnosis && (
                                                        <small className={styles.PatientMedicationsTab__dx}>
                                                            {t('diagnosis')}: {r.diagnosis}
                                                        </small>
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`${styles.PatientMedicationsTab__status} ${isOfficial ? styles.PatientMedicationsTab__statusOfficial : styles.PatientMedicationsTab__statusRequest}`}>
                                                        {isOfficial ? t('official') : t('request')}
                                                    </span>
                                                </td>
                                                <td className={styles.PatientMedicationsTab__thRight}>
                                                    <div className={styles.PatientMedicationsTab__actionsGroup}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            title={t('copy_link')}
                                                            icon={<Icon name="content_copy" size="1rem" />}
                                                            onClick={() => onCopyRxLink(r)}
                                                        />
                                                        {details.phone && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                title={t('send_whatsapp')}
                                                                icon={<Icon name="chat" size="1rem" />}
                                                                onClick={() => onSendRxWhatsapp(r)}
                                                            />
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            icon={<Icon name="visibility" size="1rem" />}
                                                            onClick={() => onViewPrescription(r)}
                                                        >
                                                            {t('view')}
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <p className={styles.PatientMedicationsTab__emptyText}>{t('no_history')}</p>
                    )}
                </div>
            </section>
        </div>
    );
};
