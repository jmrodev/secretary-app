import React, { useState } from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../context/MessageContext';
import { useModal } from '../../context/ModalContext';
import { useConfig } from '../../context/ConfigContext';
import { usePermissions } from '../../hooks/usePermissions';
import AppointmentHeader from '../molecules/AppointmentHeader';
import AppointmentMedicalPanel from '../molecules/AppointmentMedicalPanel';
import AppointmentAdminPanel from '../molecules/AppointmentAdminPanel';
import './AppointmentActionModal.css';

const AppointmentActionModal = ({
    isOpen,
    onClose,
    appt,
    onHistory,
    onPrescribe,
    onUpdateStatus,
    onReschedule,
    onCancel,
    onDelete,
    onSync,
    onPay,
    onWhatsApp,
    onUpdateType,
    onHardEdit,
    onSaveNote,
    fetchAppointments
}) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { confirm } = useModal();
    const { settings } = useConfig();
    const permissions = usePermissions();
    const [note, setNote] = useState(appt?.reason || '');

    if (!appt) return null;

    const isGoogle = appt.source === 'google' || appt.source === 'google-incomplete';
    const canUnrestricted = settings.enable_secretary_unrestricted_crud === 'true';
    // Medical Panel Visibility: 
    // User requested "si es secretaria no necesita panel medico".
    // We enforce this even if permissions are present, for standard secretaries.
    // If we want to allow "super-secretaries" we can stick to permissions, but the user was explicit.
    // We will stick to: Only Doctors and Admins see the full panel unless explicitly enabled via config AND the role allows valid medical acts? 
    // Actually, usually permissions like 'canDeletePrescription' are for specific overrides. 
    // But let's assume if role IS 'secretary', hide it.

    // However, if a secretary has explicit permission to 'canDeletePrescription' (e.g. fixing errors), maybe they should see it?
    // The user said "si es secretaria no necesita panel medico". 
    // We will STRICTLY check for doctor/admin role for the panel.
    const showMedicalPanel = (user.role === 'doctor' || user.role === 'admin');

    // Business Logic moved to onSaveNote prop
    const handleSaveNoteAction = async () => {
        await onSaveNote(appt.id, note, appt.appointment_date);
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`${t('appointment_title') || 'Turno'}: ${appt.patient_name || appt.reason || 'Sincronización requerida'}`}
            className="appointment-modal"
        >
            <div className="appointment-modal__content">
                <AppointmentHeader
                    appt={appt}
                    t={t}
                    onWhatsApp={onWhatsApp}
                />

                <div className="appointment-modal__reason section-card">
                    <p className="appointment-modal__text">
                        <strong className="appointment-modal__strong">{t('reason')}:</strong> {appt.reason || t('no_description') || 'No description'}
                    </p>
                </div>

                {showMedicalPanel && (
                    <AppointmentMedicalPanel
                        appt={appt}
                        user={user}
                        permissions={permissions}
                        t={t}
                        onHistory={onHistory}
                        onPrescribe={onPrescribe}
                        onUpdateStatus={onUpdateStatus}
                        note={note}
                        setNote={setNote}
                        onSaveNote={handleSaveNoteAction}
                        confirm={confirm}
                        onClose={onClose}
                    />
                )}

                {/* Google Sync Button */}
                {isGoogle && (
                    <Button
                        variant="accent"
                        className="appointment-modal__sync-btn"
                        onClick={() => onSync(appt)}
                    >
                        ✨ {t('sync_db') || 'Ingresar Ajuste (Sincronizar BBDD)'}
                    </Button>
                )}

                {(user.role === 'secretary' || user.role === 'admin') && (
                    <AppointmentAdminPanel
                        appt={appt}
                        user={user}
                        isGoogle={isGoogle}
                        canUnrestricted={canUnrestricted}
                        t={t}
                        onPay={onPay}
                        onUpdateStatus={onUpdateStatus}
                        onReschedule={onReschedule}
                        onCancel={onCancel}
                        onDelete={onDelete}
                        onUpdateType={onUpdateType}
                        onHardEdit={onHardEdit}
                        onClose={onClose}
                        note={note}
                    />
                )}
            </div>
        </Modal>
    );
};

export default AppointmentActionModal;
