import React from 'react';
import Button from '../atoms/Button';

const AppointmentAdminPanel = ({
    appt,
    user,
    isGoogle,
    canUnrestricted,
    t,
    onPay,
    onUpdateStatus,
    onReschedule,
    onCancel,
    onDelete,
    onClose,
    onUpdateType,
    onHardEdit,
    note
}) => {
    const isPendingPayment = (appt.payment_status === 'pending' || appt.payment_status === 'debt' || appt.payment_status === 'partial');

    // Status Logic State Machine
    const canConfirm = ['pending', 'cancelled', 'suspended', 'absent'].includes(appt.status);
    const canArrive = ['confirmed', 'rescheduled'].includes(appt.status) && appt.type !== 'virtual';
    const canAttend = ['confirmed', 'rescheduled', 'arrived'].includes(appt.status);

    // Allow reverting if unrestricted or completed
    const canSuspend = ['pending', 'confirmed', 'rescheduled'].includes(appt.status);
    const canMarkAbsent = ['pending', 'confirmed', 'rescheduled'].includes(appt.status);

    const showAdminPanel = !isGoogle && (appt.status !== 'completed' || canUnrestricted);

    if (!showAdminPanel && !isPendingPayment) return null;

    return (
        <div className="appointment-modal__admin-panel">
            <div className="appointment-modal__admin-grid">
                {/* Pay Button */}
                {isPendingPayment && !isGoogle && (
                    <Button onClick={() => onPay(appt)}>
                        💳 {t('pay')}
                    </Button>
                )}

                {showAdminPanel && (
                    <>
                        {/* 1. Confirm (Restaurar) */}
                        {canConfirm && (
                            <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => { onUpdateStatus(appt.id, 'confirmed'); onClose(); }} tooltip="Confirmar asistencia (Restaurar)">
                                ✅ {t('confirm')}
                            </Button>
                        )}

                        {/* 2. Arrived (Asistió a Sala) - ONLY if Confirmed */}
                        {canArrive && (
                            <Button onClick={() => { onUpdateStatus(appt.id, 'arrived'); onClose(); }}>
                                🏥 {t('patient_arrived') || 'En Sala'}
                            </Button>
                        )}

                        {/* 3. Attended (Completed) - ONLY if Arrived */}
                        {canAttend && (
                            <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => { onUpdateStatus(appt.id, 'completed'); onClose(); }} tooltip="Marcar como atendido">
                                🏆 {t('attended') || 'Atendido'}
                            </Button>
                        )}

                        {/* [NEW] Switch to Virtual */}
                        {appt.type !== 'virtual' && (
                            <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => { onUpdateType(appt.id, 'virtual'); onClose(); }} tooltip="Cambiar tipo a Videollamada">
                                📹 {t('pass_to_video') || 'Pasar a Video'}
                            </Button>
                        )}

                        {/* [NEW] Hard Edit (Always available in Admin Panel) */}
                        <Button variant="outline" className="text-slate-600 border-slate-200 hover:bg-slate-50" onClick={() => { onHardEdit(appt); onClose(); }} tooltip="Editar detalles del turno">
                            ✏️ {t('edit') || 'Editar'}
                        </Button>

                        {/* Common Actions */}
                        <Button variant="secondary" onClick={() => { onReschedule(appt); onClose(); }} tooltip="Reprogramar fecha/hora">
                            📅 {t('reschedule')}
                        </Button>

                        {canSuspend && (
                            <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => { onUpdateStatus(appt.id, 'suspended'); onClose(); }} tooltip="Suspendido por la oficina. Cancela momentáneamente sin afectar reputación." >
                                ⏸ {t('suspend')}
                            </Button>
                        )}

                        {canMarkAbsent && (
                            <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { onUpdateStatus(appt.id, 'absent'); onClose(); }} tooltip="El paciente faltó sin aviso. BAJA reputación (-1).">
                                🚫 {t('absent')}
                            </Button>
                        )}
                    </>
                )}
            </div>

            {!isGoogle && (
                <div className="appointment-modal__danger-zone">
                    <div className="appointment-modal__admin-grid">
                        <Button variant="outline-danger" onClick={() => { onCancel(appt.id, note); onClose(); }} tooltip="Queda en historial como 'Cancelado'. No afecta reputación." >
                            ❌ {t('cancel')}
                        </Button>
                        <Button style={{ background: '#ef4444', color: 'white' }} onClick={() => { onDelete(appt.id, appt.status); onClose(); }} tooltip="Borra permanentemente (Solo errores de carga). No afecta reputación." >
                            🗑 {t('delete_error')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentAdminPanel;
