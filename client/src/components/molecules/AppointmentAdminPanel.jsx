import React from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';

/**
 * AppointmentAdminPanel Molecule.
 * Actions related to administrative flow (Payment, Status, Scheduling).
 */
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
    const canConfirm = ['pending', 'cancelled', 'suspended', 'absent', 'rescheduled'].includes(appt.status);
    const canArrive = ['confirmed', 'rescheduled'].includes(appt.status) && appt.type !== 'virtual';
    const canAttend = ['confirmed', 'rescheduled', 'arrived'].includes(appt.status);

    // Allow reverting if unrestricted or completed
    const canSuspend = ['pending', 'confirmed', 'rescheduled'].includes(appt.status);
    const canMarkAbsent = ['pending', 'confirmed', 'rescheduled'].includes(appt.status);

    const showAdminPanel = !isGoogle && (appt.status !== 'completed' || canUnrestricted);

    if (!showAdminPanel && !isPendingPayment) return null;

    const baseClass = 'appointment-admin-panel';

    return (
        <div className={baseClass}>
            <div className={`${baseClass}__grid`}>
                {/* Pay Button */}
                {isPendingPayment && !isGoogle && (
                    <Button
                        variant="primary"
                        onClick={() => onPay(appt)}
                        icon={<Icon name="payments" size="1rem" />}
                    >
                        {t('pay')}
                    </Button>
                )}

                {showAdminPanel && (
                    <>
                        {/* 1. Confirm (Restaurar) */}
                        {canConfirm && (
                            <Button
                                variant="success"
                                className={`${baseClass}__action`}
                                onClick={() => { onUpdateStatus(appt.id, 'confirmed'); onClose(); }}
                                tooltip="Confirmar asistencia (Restaurar)"
                                icon={<Icon name="check_circle" size="1rem" />}
                            >
                                {t('confirm')}
                            </Button>
                        )}

                        {/* 2. Arrived (Asistió a Sala) - ONLY if Confirmed */}
                        {canArrive && (
                            <Button
                                variant="secondary"
                                className={`${baseClass}__action`}
                                onClick={() => { onUpdateStatus(appt.id, 'arrived'); onClose(); }}
                                icon={<Icon name="meeting_room" size="1rem" />}
                            >
                                {t('patient_arrived') || 'En Sala'}
                            </Button>
                        )}

                        {/* 3. Attended (Completed) - ONLY if Arrived */}
                        {canAttend && (
                            <Button
                                variant="success"
                                className={`${baseClass}__action`}
                                onClick={() => { onUpdateStatus(appt.id, 'completed'); onClose(); }}
                                tooltip="Marcar como atendido"
                                icon={<Icon name="task_alt" size="1rem" />}
                            >
                                {t('attended') || 'Atendido'}
                            </Button>
                        )}

                        {/* [NEW] Switch to Virtual */}
                        {appt.type !== 'virtual' && (
                            <Button
                                variant="accent"
                                className={`${baseClass}__action`}
                                onClick={() => { onUpdateType(appt.id, 'virtual'); onClose(); }}
                                tooltip="Cambiar tipo a Videollamada"
                                icon={<Icon name="videocam" size="1rem" />}
                            >
                                {t('pass_to_video') || 'Pasar a Video'}
                            </Button>
                        )}

                        {/* [NEW] Hard Edit (Always available in Admin Panel) */}
                        <Button
                            variant="secondary"
                            outline
                            className={`${baseClass}__action`}
                            onClick={() => { onHardEdit(appt); onClose(); }}
                            tooltip="Editar detalles del turno"
                            icon={<Icon name="edit" size="1rem" />}
                        >
                            {t('edit') || 'Editar'}
                        </Button>

                        {/* Common Actions */}
                        <Button
                            variant="primary"
                            outline
                            className={`${baseClass}__action`}
                            onClick={() => { onReschedule(appt); onClose(); }}
                            tooltip="Reprogramar fecha/hora"
                            icon={<Icon name="calendar_month" size="1rem" />}
                        >
                            {t('reschedule')}
                        </Button>

                        {canSuspend && (
                            <Button
                                variant="warning"
                                outline
                                className={`${baseClass}__action`}
                                onClick={() => { onUpdateStatus(appt.id, 'suspended'); onClose(); }}
                                tooltip="Suspendido por la oficina. Cancela momentáneamente sin afectar reputación."
                                icon={<Icon name="pause_circle" size="1rem" />}
                            >
                                {t('suspend')}
                            </Button>
                        )}

                        {canMarkAbsent && (
                            <Button
                                variant="danger"
                                outline
                                className={`${baseClass}__action`}
                                onClick={() => { onUpdateStatus(appt.id, 'absent'); onClose(); }}
                                tooltip="El paciente faltó sin aviso. BAJA reputación (-1)."
                                icon={<Icon name="block" size="1rem" />}
                            >
                                {t('absent')}
                            </Button>
                        )}
                    </>
                )}
            </div>

            {!isGoogle && (
                <div className={`${baseClass}__danger-zone`}>
                    <div className={`${baseClass}__grid`}>
                        <Button
                            variant="danger"
                            outline
                            className={`${baseClass}__action`}
                            onClick={() => { onCancel(appt.id, note); onClose(); }}
                            tooltip="Queda en historial como 'Cancelado'. No afecta reputación."
                            icon={<Icon name="cancel" size="1rem" />}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            variant="danger"
                            className={`${baseClass}__action`}
                            onClick={() => { onDelete(appt.id, appt.status); onClose(); }}
                            tooltip="Borra permanentemente (Solo errores de carga). No afecta reputación."
                            icon={<Icon name="delete_forever" size="1rem" />}
                        >
                            {t('delete_error')}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AppointmentAdminPanel;
