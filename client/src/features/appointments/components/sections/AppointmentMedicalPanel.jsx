import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import styles from './AppointmentMedicalPanel.module.css';

/**
 * AppointmentMedicalPanel Molecule (Internal to feature).
 */
const AppointmentMedicalPanel = ({
    appt, user, permissions, t, onHistory, onPrescribe, onUpdateStatus, note, setNote, onSaveNote, confirm, onClose
}) => {
    const { canDeletePrescription, canDeleteFile } = permissions;
    const showHistory = user.role === 'doctor' || user.role === 'admin' || canDeleteFile;
    const showPrescribe = user.role === 'doctor' || user.role === 'admin' || canDeletePrescription;
    const isDoctorOrAdmin = user.role === 'doctor' || user.role === 'admin';

    const baseClass = styles.root;

    return (
        <section className={baseClass}>
            <h4 className={`${baseClass}__title`}>
                <Icon name="medical_services" size="1.1rem" />
                {t('medical_panel')}
            </h4>
            <div className={`${baseClass}__actions`}>
                {showHistory && (
                    <Button
                        variant="primary" className={`${baseClass}__action`}
                        onClick={() => onHistory(appt)}
                        icon={<Icon name="history" size="1rem" />}
                    >
                        {t('view_history')}
                    </Button>
                )}
                {showPrescribe && (
                    <Button
                        variant="accent" className={`${baseClass}__action`}
                        onClick={() => onPrescribe(appt)}
                        icon={<Icon name="medication" size="1rem" />}
                    >
                        {t('prescribe')}
                    </Button>
                )}
                {isDoctorOrAdmin && (appt.status === 'arrived' || (appt.type === 'virtual' && appt.status === 'confirmed')) && (
                    <Button
                        variant="success" className={`${baseClass}__action ${baseClass}__action--full`}
                        onClick={async () => {
                            if (await confirm(t('confirm_attended'))) {
                                onUpdateStatus(appt.id, 'completed');
                                onClose();
                            }
                        }}
                        icon={<Icon name="check_circle" size="1rem" />}
                    >
                        {t('attended')}
                    </Button>
                )}
            </div>
            <div className={`${baseClass}__note-section`}>
                <Input
                    type="text" className={`${baseClass}__note-input`}
                    placeholder={t('evolution_note_placeholder')}
                    value={note} onChange={(e) => setNote(e.target.value)}
                />
                <Button
                    variant="secondary" className={`${baseClass}__save-btn`}
                    onClick={onSaveNote} icon={<Icon name="save" size="1.1rem" />}
                />
            </div>
        </section>
    );
};

export default AppointmentMedicalPanel;
