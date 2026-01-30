import React from 'react';
import Button from '../atoms/Button';

const AppointmentMedicalPanel = ({
    appt,
    user,
    permissions,
    t,
    onHistory,
    onPrescribe,
    onUpdateStatus,
    note,
    setNote,
    onSaveNote,
    confirm,
    onClose
}) => {
    const { canDeletePrescription, canDeleteFile } = permissions;
    const showHistory = user.role === 'doctor' || user.role === 'admin' || canDeleteFile;
    const showPrescribe = user.role === 'doctor' || user.role === 'admin' || canDeletePrescription;
    const isDoctorOrAdmin = user.role === 'doctor' || user.role === 'admin';

    return (
        <div className="appointment-modal__medical-panel">
            <h4 className="appointment-modal__section-title">
                👨‍⚕️ {t('medical_panel') || 'Panel Médico'}
            </h4>
            <div className="appointment-modal__medical-actions">
                {showHistory && (
                    <Button
                        variant="primary"
                        size="sm"
                        className="appointment-modal__action-btn"
                        onClick={() => onHistory(appt)}
                    >
                        🩺 {t('view_history') || 'Ver H. Clínica'}
                    </Button>
                )}
                {showPrescribe && (
                    <Button
                        variant="accent"
                        size="sm"
                        className="appointment-modal__action-btn"
                        onClick={() => onPrescribe(appt)}
                    >
                        💊 {t('prescribe') || 'Recetar'}
                    </Button>
                )}
                {isDoctorOrAdmin && (
                    <Button
                        variant="status"
                        size="sm"
                        className="appointment-modal__action-btn appointment-modal__action-btn--full btn--solid-success"
                        onClick={async () => {
                            if (await confirm(t('confirm_attended') || 'Mark as Attended/Completed?')) {
                                onUpdateStatus(appt.id, 'completed');
                                onClose();
                            }
                        }}
                    >
                        ✅ {t('attended') || 'Atendido'}
                    </Button>
                )}
            </div>
            <div className="appointment-modal__note-section">
                <input
                    type="text"
                    className="input-field appointment-modal__note-input"
                    placeholder={t('evolution_note_placeholder') || "Nota de evolución / Razón..."}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                />
                <Button
                    variant="secondary"
                    size="sm"
                    className="appointment-modal__save-note-btn"
                    onClick={onSaveNote}
                >
                    💾
                </Button>
            </div>
        </div>
    );
};

export default AppointmentMedicalPanel;
