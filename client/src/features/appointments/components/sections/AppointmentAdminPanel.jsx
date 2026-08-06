import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import TabNav from '@/components/molecules/TabNav';
import TabButton from '@/components/atoms/TabButton';
import { copyToClipboard } from '@/utils/core/clipboardUtils';
import { useMessage } from '@/context/MessageContext';
import styles from './AppointmentAdminPanel.module.css';

/**
 * AppointmentAdminPanel Molecule (Internal to feature).
 * Orchestrates administrative actions for an appointment using a tabbed interface.
 */
const AppointmentAdminPanel = ({
    appt, user: _user, isGoogle, canUnrestricted, t, onPay, onUpdateStatus, onReschedule, onCancel, onDelete, onClose, onUpdateType, onHardEdit, onBonify, note, onWhatsApp, onWhatsAppConfirmation
}) => {
    const [activeTab, setActiveTab] = useState('attendance');
    const { showMessage } = useMessage();

    const isBonified = appt.bonified === 1 || appt.bonified === true || appt.bonified === 'true';
    const isPendingPayment = !isBonified && (appt.payment_status === 'pending' || appt.payment_status === 'debt' || appt.payment_status === 'partial');
    const canConfirm = ['pending', 'cancelled', 'suspended', 'absent', 'rescheduled'].includes(appt.status);
    const canArrive = appt.status === 'confirmed' && appt.type !== 'virtual';
    const canAttend = appt.status === 'arrived' || (appt.type === 'virtual' && appt.status === 'confirmed');
    const canSuspend = ['pending', 'confirmed', 'rescheduled'].includes(appt.status);
    const canMarkAbsent = ['pending', 'confirmed', 'rescheduled'].includes(appt.status);
    const showAdminPanel = !isGoogle;
    const hasAttendanceActions = canConfirm || canArrive || canAttend;
    const canReschedule = appt.status !== 'completed' && appt.status !== 'absent';
    const canPassToVideo = appt.status !== 'completed' && appt.status !== 'absent' && appt.type !== 'virtual';

    const handleCopyPhone = () => {
        copyToClipboard(appt.patient_phone).then(() => showMessage(t('phone_copied'), "success"));
    };

    if (isGoogle) return null;

    const baseClass = styles.root;

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

            <div className={styles.content}>
                {/* ATTENDANCE TAB */}
                {activeTab === 'attendance' && (
                    <article className="animate-fade-in">
                        <div className={styles.horizontalGroups}>
                            {!isGoogle && !isBonified && appt.payment_status !== 'paid' && (
                                <section className={`${styles.group} ${styles.groupHighlight}`}>
                                    <h4 className={styles.groupTitle}>
                                        {isPendingPayment ? (t('pending_payment') || 'Pago Pendiente') : (t('record_payment') || 'Registrar Pago')}
                                    </h4>
                                    <div className={styles.grid}>
                                        <Button
                                            variant="success" className={styles.action} onClick={() => { onPay(appt); onClose(); }}
                                            icon={<Icon name="payments" size="1.1rem" />}
                                        >
                                            {isPendingPayment ? (t('pay') || 'Pagar') : (t('record_payment') || 'Registrar Pago')}
                                        </Button>
                                        <Button
                                            variant="purple" className={styles.action} onClick={() => onBonify(appt)}
                                            icon={<Icon name="card_giftcard" size="1.1rem" />}
                                        >
                                            {t('bonify') || 'Bonificar'}
                                        </Button>
                                    </div>
                                </section>
                            )}

                            {showAdminPanel && hasAttendanceActions && (
                                <section className={styles.group}>
                                    <h4 className={styles.groupTitle}>{t('attendance_flow')}</h4>
                                    <div className={styles.grid}>
                                        {canConfirm && (
                                            <Button
                                                variant="primary" className={styles.action} onClick={() => { onUpdateStatus(appt.id, 'confirmed'); }}
                                                icon={<Icon name="check_circle" size="1.1rem" />}
                                            >
                                                {t('confirm')}
                                            </Button>
                                        )}
                                        {canArrive && (
                                            <Button
                                                variant="teal" className={styles.action} onClick={() => { onUpdateStatus(appt.id, 'arrived'); }}
                                                icon={<Icon name="meeting_room" size="1.1rem" />}
                                            >
                                                {t('patient_arrived')}
                                            </Button>
                                        )}
                                        {canAttend && (
                                            <Button
                                                variant="success" className={styles.action} onClick={() => { onUpdateStatus(appt.id, 'completed'); onClose(); }}
                                                icon={<Icon name="task_alt" size="1.1rem" />}
                                            >
                                                {t('attended')}
                                            </Button>
                                        )}
                                    </div>
                                </section>
                            )}
                        </div>
                    </article>
                )}

                {/* MANAGEMENT TAB */}
                {activeTab === 'management' && showAdminPanel && (
                    <article className="animate-fade-in">
                        <section className={styles.group}>
                            <h4 className={styles.groupTitle}>{t('appointment_modification')}</h4>
                            <div className={styles.grid}>
                                <Button
                                    variant="info" className={styles.action} onClick={() => { onHardEdit(appt); onClose(); }}
                                    icon={<Icon name="edit" size="1.1rem" />}
                                >
                                    {t('edit')}
                                </Button>
                                {canReschedule && (
                                    <Button
                                        variant="primary" className={styles.action} onClick={() => { onReschedule(appt); onClose(); }}
                                        icon={<Icon name="calendar_month" size="1.1rem" />}
                                    >
                                        {t('reschedule')}
                                    </Button>
                                )}
                                {canPassToVideo && (
                                    <Button
                                        variant="accent" className={styles.action} onClick={() => { onUpdateType(appt.id, 'virtual'); onClose(); }}
                                        icon={<Icon name="videocam" size="1.1rem" />}
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
                    <article className="animate-fade-in">
                        <section className={styles.group}>
                            <h4 className={styles.groupTitle}>{t('patient_contact')}</h4>
                            <div className={styles.phoneDisplay}>
                                <span className={styles.phoneNumber}>{appt.patient_phone}</span>
                                <Button
                                    variant="secondary" size="sm" onClick={handleCopyPhone}
                                    icon={<Icon name="content_copy" size="1rem" />}
                                />
                            </div>
                            <div className={styles.grid}>
                                <Button
                                    to={`tel:${appt.patient_phone.replace(/[^0-9+]/g, '')}`}
                                    variant="primary" className={styles.action}
                                    icon={<Icon name="call" size="1.1rem" />}
                                >
                                    {t('call')}
                                </Button>
                                <Button
                                    variant="success" className={styles.action}
                                    onClick={() => onWhatsApp(appt, 'chat')}
                                    icon={<Icon name="chat" size="1.1rem" />}
                                >
                                    {t('whatsapp_chat') || 'WhatsApp'}
                                </Button>
                                {appt.status !== 'completed' && (
                                    <>
                                        <Button
                                            variant="accent" className={styles.action}
                                            onClick={() => onWhatsApp(appt, 'reminder')}
                                            icon={<Icon name="notifications" size="1.1rem" />}
                                            title="Enviar mensaje de recordatorio al paciente por WhatsApp"
                                        >
                                            {t('reminder') || 'Recordatorio'}
                                        </Button>
                                        <Button
                                            variant="success" className={styles.action}
                                            onClick={() => onWhatsAppConfirmation(appt)}
                                            icon={<Icon name="auto_awesome" size="1.1rem" />}
                                            title="Abrir vista previa del mensaje de confirmación de asistencia"
                                        >
                                            {t('send_whatsapp_confirmation') || 'Confirmación'}
                                        </Button>
                                    </>
                                )}
                            </div>
                            {appt.status !== 'completed' && (
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.35rem' }}>
                                    <Icon name="info" size="1rem" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                                    <span>
                                        <strong>WhatsApp</strong> abre el chat interno (o WhatsApp Web si el bridge está desconectado).
                                        {' '}<strong>Recordatorio</strong> envía el template de recordatorio automáticamente.
                                        {' '}<strong>Confirmación</strong> abre una vista previa del mensaje para que puedas editarlo antes de enviarlo.
                                    </span>
                                </p>
                            )}
                        </section>
                    </article>
                )}

                {/* STATUS TAB */}
                {activeTab === 'status' && showAdminPanel && (
                    <article className="animate-fade-in">
                        <section className={styles.group}>
                            <h4 className={styles.groupTitle}>{t('exception_status')}</h4>
                            <div className={styles.grid}>
                                {canSuspend && (
                                    <Button
                                        variant="warning" className={styles.action} onClick={() => { onUpdateStatus(appt.id, 'suspended'); onClose(); }}
                                        icon={<Icon name="pause_circle" size="1.1rem" />}
                                    >
                                        {t('suspend')}
                                    </Button>
                                )}
                                {canMarkAbsent && (
                                    <Button
                                        variant="darkDanger" className={styles.action} onClick={() => { onUpdateStatus(appt.id, 'absent'); onClose(); }}
                                        icon={<Icon name="block" size="1.1rem" />}
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
                    <article className="animate-fade-in">
                        <section className={`${styles.group} ${styles.groupDanger}`}>
                            <h4 className={styles.groupTitle}>{t('danger_zone')}</h4>
                            <div className={styles.grid}>
                                <Button
                                    variant="warning" className={styles.action} onClick={() => { onCancel(appt.id, note); onClose(); }}
                                    icon={<Icon name="cancel" size="1.1rem" />}
                                >
                                    {t('cancel')}
                                </Button>
                                <Button
                                    variant="danger" className={styles.action} onClick={() => { onDelete(appt.id, appt.status); onClose(); }}
                                    icon={<Icon name="delete_forever" size="1.1rem" />}
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
