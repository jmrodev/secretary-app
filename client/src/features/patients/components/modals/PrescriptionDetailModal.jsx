import React from 'react';
import { Modal } from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { formatDate } from '@/utils/core/dateUtils';
import styles from './PrescriptionDetailModal.module.css';

/**
 * PrescriptionDetailModal Molecule Component.
 * Displays details of a prescription request, including dosages, diagnosis, and sharing actions.
 */
export const PrescriptionDetailModal = ({
    isOpen,
    onClose,
    prescription,
    patient,
    t,
    onCopyLink,
    onSendWhatsapp
}) => {
    if (!isOpen || !prescription) return null;

    const medLines = (prescription.request_note || prescription.medications || prescription.doctor_note || '—')
        .split('\n')
        .map(l => l.trim())
        .filter(Boolean);

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={t('prescription_details')}
            size="lg"
        >
            <div className={styles.PrescriptionDetailModal__body}>
                <div className={styles.PrescriptionDetailModal__header}>
                    <h3 className={styles.PrescriptionDetailModal__name}>
                        <Icon name="person" size="1.1rem" />
                        <span>{patient?.full_name || 'N/A'}</span>
                        <span className={styles.PrescriptionDetailModal__dni}>
                            ({t('dni')}: {patient?.dni || '—'})
                        </span>
                    </h3>
                    <div className={styles.PrescriptionDetailModal__meta}>
                        <div>
                            <Icon name="calendar_month" size="0.9rem" />
                            <strong>{t('appointment_date')}:</strong> {formatDate(prescription.created_at || prescription.appointment_date)}
                        </div>
                        <div>
                            <Icon name="stethoscope" size="0.9rem" />
                            <strong>{t('appointment_doctor')}:</strong> {prescription.doctor_name || '—'}
                        </div>
                        <div>
                            <Icon name="label" size="0.9rem" />
                            <strong>{t('status')}:</strong> {prescription.status || 'Completada'}
                        </div>
                    </div>
                </div>

                <div>
                    <h4 className={styles.PrescriptionDetailModal__subtitle}>
                        <Icon name="medication" size="1rem" />
                        <span>{t('medications')}:</span>
                    </h4>
                    <div className={styles.PrescriptionDetailModal__medsList}>
                        {medLines.map((line) => (
                            <div key={line} className={styles.PrescriptionDetailModal__medLine}>
                                • {line}
                            </div>
                        ))}
                    </div>
                </div>

                {prescription.diagnosis && (
                    <div>
                        <h4 className={styles.PrescriptionDetailModal__diagTitle}>
                            <Icon name="notes" size="1rem" />
                            <span>{t('diagnosis')}:</span>
                        </h4>
                        <div className={styles.PrescriptionDetailModal__diagContent}>
                            {prescription.diagnosis}
                        </div>
                    </div>
                )}

                <div className={styles.PrescriptionDetailModal__footer}>
                    <Button
                        variant="secondary"
                        onClick={() => onCopyLink && onCopyLink(prescription)}
                        icon={<Icon name="content_copy" size="1rem" />}
                    >
                        {t('copy_link')}
                    </Button>
                    {patient?.phone && (
                        <Button
                            variant="primary"
                            onClick={() => onSendWhatsapp && onSendWhatsapp(prescription)}
                            icon={<Icon name="chat" size="1rem" />}
                        >
                            {t('send_whatsapp')}
                        </Button>
                    )}
                </div>
            </div>
        </Modal>
    );
};
