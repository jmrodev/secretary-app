import React, { useState } from 'react';
import Modal from '@/components/molecules/Modal';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { useAuth } from '@/features/auth';
import { useModal } from '@/context/ModalContext';
import { useConfig } from '@/context/ConfigContext';
import { usePermissions } from '@/hooks/usePermissions';
import AppointmentHeader from '../sections/AppointmentHeader.jsx';
import AppointmentMedicalPanel from '../sections/AppointmentMedicalPanel.jsx';
import AppointmentAdminPanel from '../sections/AppointmentAdminPanel.jsx';
import styles from './AppointmentActionModal.module.css';

/**
 * Executor component that renders the action modal for a specific appointment.
 * Shows medical or admin panels based on user role and permissions.
 */
const AppointmentActionModal = ({
    isOpen, onClose, appt, onHistory, onPrescribe, onUpdateStatus, onReschedule,
    onCancel, onDelete, onSync, onPay, onWhatsApp, onUpdateType, onHardEdit,
    onBonify, onSaveNote, fetchAppointments: _fetchAppointments
}) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { confirm } = useModal();
    const { settings } = useConfig();
    const permissions = usePermissions();
    const [note, setNote] = useState(appt?.reason || '');

    if (!appt) return null;

    const isGoogle = appt.source === 'google' || appt.source === 'google-incomplete';
    const canUnrestricted = settings.enable_secretary_unrestricted_crud === 'true';
    const showMedicalPanel = (user.role === 'doctor' || user.role === 'admin');

    const handleSaveNoteAction = async () => {
        await onSaveNote(appt.id, note, appt.appointment_date);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('appointment_details') || 'Detalles del Turno'}: ${appt.patient_name || appt.reason || t('sync_required')}`}
            size="lg"
        >
            <div className={`${styles.content}`}>
                <AppointmentHeader appt={appt} t={t} />

                <div className={`${styles.reason}`}>
                    <p className={`${styles.text}`}>
                        <strong className={`${styles.strong}`}>{t('reason')}:</strong> {appt.reason || t('no_description')}
                    </p>
                </div>

                {showMedicalPanel && (
                    <AppointmentMedicalPanel
                        appt={appt} user={user} permissions={permissions} t={t}
                        onHistory={onHistory} onPrescribe={onPrescribe} onUpdateStatus={onUpdateStatus}
                        note={note} setNote={setNote} onSaveNote={handleSaveNoteAction}
                        confirm={confirm} onClose={onClose}
                    />
                )}

                {isGoogle && (
                    <Button
                        variant="accent"
                        className={`${styles.syncBtn}`}
                        onClick={() => onSync(appt)}
                        icon={<Icon name="auto_awesome" size="1.1rem" />}
                    >
                        {t('sync_db')}
                    </Button>
                )}

                {(user.role === 'secretary' || user.role === 'admin') && (
                    <AppointmentAdminPanel
                        appt={appt} user={user} isGoogle={isGoogle} canUnrestricted={canUnrestricted}
                        t={t} onPay={onPay} onUpdateStatus={onUpdateStatus} onReschedule={onReschedule}
                        onCancel={onCancel} onDelete={onDelete} onUpdateType={onUpdateType}
                        onHardEdit={onHardEdit} onBonify={onBonify} onClose={onClose} note={note}
                        onWhatsApp={onWhatsApp}
                    />
                )}
            </div>
        </Modal>
    );
};

export default AppointmentActionModal;
