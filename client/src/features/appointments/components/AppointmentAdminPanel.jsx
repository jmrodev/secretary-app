import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import './AppointmentAdminPanel.css';

/**
 * AppointmentAdminPanel Molecule (Internal to feature).
 */
const AppointmentAdminPanel = ({
    appt, user, isGoogle, canUnrestricted, t, onPay, onUpdateStatus, onReschedule, onCancel, onDelete, onClose, onUpdateType, onHardEdit, onBonify, note
}) => {
    const isPendingPayment = (appt.payment_status === 'pending' || appt.payment_status === 'debt' || appt.payment_status === 'partial');
    const canConfirm = ['pending', 'cancelled', 'suspended', 'absent', 'rescheduled'].includes(appt.status);
    const canArrive = appt.status === 'confirmed' && appt.type !== 'virtual';
    const canAttend = appt.status === 'arrived' || (appt.type === 'virtual' && appt.status === 'confirmed');
    const canSuspend = ['pending', 'confirmed', 'rescheduled'].includes(appt.status);
    const canMarkAbsent = ['pending', 'confirmed', 'rescheduled'].includes(appt.status);
    const showAdminPanel = !isGoogle && (appt.status !== 'completed' || canUnrestricted);
    const canReschedule = appt.status !== 'completed' && appt.status !== 'absent';
    const canPassToVideo = appt.status !== 'completed' && appt.status !== 'absent' && appt.type !== 'virtual';

    if (!showAdminPanel && !isPendingPayment) return null;

    const baseClass = 'appointment-admin-panel';

    return (
        <div className={baseClass}>
            {isPendingPayment && !isGoogle && (
                <div className={`${baseClass}__group ${baseClass}__group--highlight`}>
                    <div className={`${baseClass}__grid`}>
                        <Button
                            variant="primary" className={`${baseClass}__action`} onClick={() => { onPay(appt); onClose(); }}
                            icon={<Icon name="payments" size="1rem" />}
                        >
                            {t('pay')}
                        </Button>
                        <Button
                            variant="secondary" outline className={`${baseClass}__action`} onClick={() => { onBonify(appt); onClose(); }}
                            icon={<Icon name="card_giftcard" size="1rem" />}
                        >
                            {t('bonify') || 'Bonificar'}
                        </Button>
                    </div>
                </div>
            )}

            {showAdminPanel && (
                <>
                    <div className={`${baseClass}__group`}>
                        <h4 className={`${baseClass}__group-title`}>{t('attendance') || 'Asistencia'}</h4>
                        <div className={`${baseClass}__grid`}>
                            {canConfirm && (
                                <Button
                                    variant="success" className={`${baseClass}__action`} onClick={() => { onUpdateStatus(appt.id, 'confirmed'); onClose(); }}
                                    icon={<Icon name="check_circle" size="1rem" />}
                                >
                                    {t('confirm')}
                                </Button>
                            )}
                            {canArrive && (
                                <Button
                                    variant="secondary" className={`${baseClass}__action`} onClick={() => { onUpdateStatus(appt.id, 'arrived'); onClose(); }}
                                    icon={<Icon name="meeting_room" size="1rem" />}
                                >
                                    {t('patient_arrived') || 'En Sala'}
                                </Button>
                            )}
                            {canAttend && (
                                <Button
                                    variant="success" className={`${baseClass}__action`} onClick={() => { onUpdateStatus(appt.id, 'completed'); onClose(); }}
                                    icon={<Icon name="task_alt" size="1rem" />}
                                >
                                    {t('attended') || 'Atendido'}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className={`${baseClass}__group`}>
                        <h4 className={`${baseClass}__group-title`}>{t('management') || 'Gestión'}</h4>
                        <div className={`${baseClass}__grid`}>
                            <Button
                                variant="secondary" outline className={`${baseClass}__action`} onClick={() => { onHardEdit(appt); onClose(); }}
                                icon={<Icon name="edit" size="1rem" />}
                            >
                                {t('edit') || 'Editar'}
                            </Button>
                            {canReschedule && (
                                <Button
                                    variant="primary" outline className={`${baseClass}__action`} onClick={() => { onReschedule(appt); onClose(); }}
                                    icon={<Icon name="calendar_month" size="1rem" />}
                                >
                                    {t('reschedule')}
                                </Button>
                            )}
                            {canPassToVideo && (
                                <Button
                                    variant="accent" className={`${baseClass}__action`} onClick={() => { onUpdateType(appt.id, 'virtual'); onClose(); }}
                                    icon={<Icon name="videocam" size="1rem" />}
                                >
                                    {t('pass_to_video') || 'Pasar a Video'}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className={`${baseClass}__group`}>
                        <h4 className={`${baseClass}__group-title`}>{t('status_label') || 'Estado'}</h4>
                        <div className={`${baseClass}__grid`}>
                            {canSuspend && (
                                <Button
                                    variant="warning" outline className={`${baseClass}__action`} onClick={() => { onUpdateStatus(appt.id, 'suspended'); onClose(); }}
                                    icon={<Icon name="pause_circle" size="1rem" />}
                                >
                                    {t('suspend')}
                                </Button>
                            )}
                            {canMarkAbsent && (
                                <Button
                                    variant="danger" outline className={`${baseClass}__action`} onClick={() => { onUpdateStatus(appt.id, 'absent'); onClose(); }}
                                    icon={<Icon name="block" size="1rem" />}
                                >
                                    {t('absent')}
                                </Button>
                            )}
                        </div>
                    </div>
                </>
            )}

            {!isGoogle && (
                <div className={`${baseClass}__group ${baseClass}__group--danger`}>
                    <h4 className={`${baseClass}__group-title`}>{t('danger_zone') || 'acciones críticas'}</h4>
                    <div className={`${baseClass}__grid`}>
                        <Button
                            variant="danger" outline className={`${baseClass}__action`} onClick={() => { onCancel(appt.id, note); onClose(); }}
                            icon={<Icon name="cancel" size="1rem" />}
                        >
                            {t('cancel')}
                        </Button>
                        <Button
                            variant="danger" className={`${baseClass}__action`} onClick={() => { onDelete(appt.id, appt.status); onClose(); }}
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
