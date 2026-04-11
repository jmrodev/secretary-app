import React, { useState } from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import TabNav from '@/components/molecules/TabNav';
import TabButton from '@/components/atoms/TabButton';
import { copyToClipboard } from '@/utils/clipboardUtils';
import { useMessage } from '@/context/MessageContext';
import './AppointmentAdminPanel.css';

/**
 * AppointmentAdminPanel Molecule (Internal to feature).
 * Orchestrates administrative actions for an appointment using a tabbed interface.
 */
const AppointmentAdminPanel = ({
    appt, user, isGoogle, canUnrestricted, t, onPay, onUpdateStatus, onReschedule, onCancel, onDelete, onClose, onUpdateType, onHardEdit, onBonify, note, onWhatsApp
}) => {
    const [activeTab, setActiveTab] = useState('attendance');
    const { showMessage } = useMessage();

    const isPendingPayment = !appt.bonified && (appt.payment_status === 'pending' || appt.payment_status === 'debt' || appt.payment_status === 'partial');
    const canConfirm = ['pending', 'cancelled', 'suspended', 'absent', 'rescheduled'].includes(appt.status);
    const canArrive = appt.status === 'confirmed' && appt.type !== 'virtual';
    const canAttend = appt.status === 'arrived' || (appt.type === 'virtual' && appt.status === 'confirmed');
    const canSuspend = ['pending', 'confirmed', 'rescheduled'].includes(appt.status);
    const canMarkAbsent = ['pending', 'confirmed', 'rescheduled'].includes(appt.status);
    const showAdminPanel = !isGoogle && (appt.status !== 'completed' || canUnrestricted);
    const canReschedule = appt.status !== 'completed' && appt.status !== 'absent';
    const canPassToVideo = appt.status !== 'completed' && appt.status !== 'absent' && appt.type !== 'virtual';

    const handleCopyPhone = () => {
        copyToClipboard(appt.patient_phone).then(() => showMessage(t('phone_copied'), "success"));
    };

    if (!showAdminPanel && !isPendingPayment) return null;

    const baseClass = 'appointment-admin-panel';

    return (
        <section className={baseClass}>
            {/* Tab Navigation */}
            <TabNav className={`${baseClass}__tabs`}>
                <TabButton
                    isActive={activeTab === 'attendance'}
                    onClick={() => setActiveTab('attendance')}
                    activeColor="green"
                >
                    {t('attendance')}
                </TabButton>
                <TabButton
                    isActive={activeTab === 'management'}
                    onClick={() => setActiveTab('management')}
                    activeColor="blue"
                >
                    {t('management')}
                </TabButton>
                {appt.patient_phone && (
                    <TabButton
                        isActive={activeTab === 'contact'}
                        onClick={() => setActiveTab('contact')}
                        activeColor="blue"
                    >
                        {t('contact')}
                    </TabButton>
                )}
                <TabButton
                    isActive={activeTab === 'status'}
                    onClick={() => setActiveTab('status')}
                    activeColor="amber"
                >
                    {t('status_label')}
                </TabButton>
                <TabButton
                    isActive={activeTab === 'danger'}
                    onClick={() => setActiveTab('danger')}
                    activeColor="purple"
                >
                    {t('more')}
                </TabButton>
            </TabNav>

            <div className={`${baseClass}__content`}>
                {/* ATTENDANCE TAB */}
                {activeTab === 'attendance' && (
                    <article className={`${baseClass}__tab-pane animate-fadeIn`}>
                        {isPendingPayment && !isGoogle && (
                            <section className={`${baseClass}__group ${baseClass}__group--highlight`}>
                                <h4 className={`${baseClass}__group-title`}>{t('pending_payment')}</h4>
                                <div className={`${baseClass}__grid`}>
                                    <Button
                                        variant="success" className={`${baseClass}__action`} onClick={() => { onPay(appt); onClose(); }}
                                        icon={<Icon name="payments" size="1rem" />}
                                    >
                                        {t('pay')}
                                    </Button>
                                    <Button
                                        variant="accent" className={`${baseClass}__action`} onClick={() => { onBonify(appt); onClose(); }}
                                        icon={<Icon name="card_giftcard" size="1rem" />}
                                    >
                                        {t('bonify')}
                                    </Button>
                                </div>
                            </section>
                        )}

                        {showAdminPanel && (
                            <section className={`${baseClass}__group`}>
                                <h4 className={`${baseClass}__group-title`}>{t('attendance_flow')}</h4>
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
                                            {t('patient_arrived')}
                                        </Button>
                                    )}
                                    {canAttend && (
                                        <Button
                                            variant="success" className={`${baseClass}__action`} onClick={() => { onUpdateStatus(appt.id, 'completed'); onClose(); }}
                                            icon={<Icon name="task_alt" size="1rem" />}
                                        >
                                            {t('attended')}
                                        </Button>
                                    )}
                                </div>
                            </section>
                        )}
                    </article>
                )}

                {/* MANAGEMENT TAB */}
                {activeTab === 'management' && showAdminPanel && (
                    <article className={`${baseClass}__tab-pane animate-fadeIn`}>
                        <section className={`${baseClass}__group`}>
                            <h4 className={`${baseClass}__group-title`}>{t('appointment_modification')}</h4>
                            <div className={`${baseClass}__grid`}>
                                <Button
                                    variant="primary" className={`${baseClass}__action`} onClick={() => { onHardEdit(appt); onClose(); }}
                                    icon={<Icon name="edit" size="1rem" />}
                                >
                                    {t('edit')}
                                </Button>
                                {canReschedule && (
                                    <Button
                                        variant="primary" className={`${baseClass}__action`} onClick={() => { onReschedule(appt); onClose(); }}
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
                                        {t('pass_to_video')}
                                    </Button>
                                )}
                            </div>
                        </section>
                    </article>
                )}

                {/* CONTACT TAB */}
                {activeTab === 'contact' && appt.patient_phone && (
                    <article className={`${baseClass}__tab-pane animate-fadeIn`}>
                        <section className={`${baseClass}__group`}>
                            <h4 className={`${baseClass}__group-title`}>{t('patient_contact')}</h4>
                            <div className={`${baseClass}__phone-display`}>
                                <span className={`${baseClass}__phone-number`}>{appt.patient_phone}</span>
                                <Button
                                    variant="secondary" size="sm" onClick={handleCopyPhone}
                                    icon={<Icon name="content_copy" size="1rem" />}
                                />
                            </div>
                            <div className={`${baseClass}__grid`}>
                                    <Button
                                        to={`tel:${appt.patient_phone.replace(/[^0-9+]/g, '')}`}
                                        variant="primary" className={`${baseClass}__action`}
                                        icon={<Icon name="call" size="1rem" />}
                                >
                                    {t('call')}
                                </Button>
                                {appt.status !== 'completed' && (
                                    <>
                                        <Button
                                            variant="success" className={`${baseClass}__action`}
                                            onClick={() => onWhatsApp(appt, 'reminder')}
                                            icon={<Icon name="send" size="1rem" />}
                                        >
                                            {t('reminder')}
                                        </Button>
                                        <Button
                                            variant="accent" className={`${baseClass}__action`}
                                            onClick={() => onWhatsApp(appt, 'confirmation')}
                                            icon={<Icon name="auto_awesome" size="1rem" />}
                                        >
                                            {t('confirm')}
                                        </Button>
                                    </>
                                )}
                            </div>
                        </section>
                    </article>
                )}

                {/* STATUS TAB */}
                {activeTab === 'status' && showAdminPanel && (
                    <article className={`${baseClass}__tab-pane animate-fadeIn`}>
                        <section className={`${baseClass}__group`}>
                            <h4 className={`${baseClass}__group-title`}>{t('exception_status')}</h4>
                            <div className={`${baseClass}__grid`}>
                                {canSuspend && (
                                    <Button
                                        variant="warning" className={`${baseClass}__action`} onClick={() => { onUpdateStatus(appt.id, 'suspended'); onClose(); }}
                                        icon={<Icon name="pause_circle" size="1rem" />}
                                    >
                                        {t('suspend')}
                                    </Button>
                                )}
                                {canMarkAbsent && (
                                    <Button
                                        variant="danger" className={`${baseClass}__action`} onClick={() => { onUpdateStatus(appt.id, 'absent'); onClose(); }}
                                        icon={<Icon name="block" size="1rem" />}
                                    >
                                        {t('absent')}
                                    </Button>
                                )}
                            </div>
                        </section>
                    </article>
                )}

                {/* DANGER/SYSTEM TAB */}
                {activeTab === 'danger' && !isGoogle && (
                    <article className={`${baseClass}__tab-pane animate-fadeIn`}>
                        <section className={`${baseClass}__group ${baseClass}__group--danger`}>
                            <h4 className={`${baseClass}__group-title`}>{t('danger_zone')}</h4>
                            <div className={`${baseClass}__grid`}>
                                <Button
                                    variant="secondary" className={`${baseClass}__action`} onClick={() => { onCancel(appt.id, note); onClose(); }}
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
                        </section>
                    </article>
                )}
            </div>
        </section>
    );
};


export default AppointmentAdminPanel;
