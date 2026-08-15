import React, { useState } from 'react';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import TabButton from '@/components/atoms/TabButton';
import { formatDate, isPast } from '@/utils/core/dateUtils';
import styles from './DashboardReminders.module.css';

/**
 * DashboardReminders Organism (Feature Component).
 * Displays two lists of reminders: Pending and Notified.
 * Follows BEM methodology.
 */
export const DashboardReminders = ({ reminders, t, onWhatsApp, onComplete, onMarkNotified, onViewProfile }) => {
    const [activeSection, setActiveSection] = useState('pending');

    // Flatten reminders into individual tasks
    const allTasks = [];
    reminders.forEach(r => {
        // Visit Reminder
        if (r.next_suggested_visit_date && isPast(r.next_suggested_visit_date)) {
            allTasks.push({
                ...r,
                taskType: 'visit',
                isNotified: !!r.visit_notified,
                label: `${t('visit_overdue')} (${formatDate(r.next_suggested_visit_date)})`,
                badgeClass: 'visit'
            });
        }
        // Prescription Reminder
        if (r.next_suggested_prescription_date && isPast(r.next_suggested_prescription_date)) {
            allTasks.push({
                ...r,
                taskType: 'prescription',
                isNotified: !!r.prescription_notified,
                label: `${t('prescription_overdue')} (${formatDate(r.next_suggested_prescription_date)})`,
                badgeClass: 'prescription'
            });
        }
        // License Reminder
        if (r.license_expiry_date && isPast(r.license_expiry_date)) {
            allTasks.push({
                ...r,
                taskType: 'license',
                isNotified: !!r.license_notified,
                label: `${t('license_expiring')} (${formatDate(r.license_expiry_date)})`,
                badgeClass: 'license'
            });
        }
        // Medication Reminders
        if (r.expiring_meds) {
            allTasks.push({
                ...r,
                taskType: 'medication',
                isNotified: !!r.meds_all_notified_min,
                label: `${t('meds_expiring')}: ${r.expiring_meds}`,
                badgeClass: 'medication'
            });
        }
    });

    const pendingTasks = allTasks.filter(task => !task.isNotified);
    const notifiedTasks = allTasks.filter(task => task.isNotified);

    const currentTasks = activeSection === 'pending' ? pendingTasks : notifiedTasks;

    return (
        <section className={`${styles.DashboardReminders__root}`}>
            <header className={`${styles.DashboardReminders__header}`}>
                <nav className={`${styles.DashboardReminders__tabs}`}>
                    <TabButton
                        isActive={activeSection === 'pending'}
                        onClick={() => setActiveSection('pending')}
                        variant="pill"
                    >
                        {t('pending')}
                        <span className={`${styles.DashboardReminders__count}`}>{pendingTasks.length}</span>
                    </TabButton>
                    <TabButton
                        isActive={activeSection === 'notified'}
                        onClick={() => setActiveSection('notified')}
                        variant="pill"
                    >
                        {t('notified')}
                        <span className={`${styles.DashboardReminders__count}`}>{notifiedTasks.length}</span>
                    </TabButton>
                </nav>
            </header>

            <div className={`${styles.DashboardReminders__list}`}>
                {currentTasks.length === 0 ? (
                    <div className={`${styles.DashboardReminders__empty}`}>
                        <Icon name="info" size="3rem" color="var(--slate-300)" />
                        <p>
                            {activeSection === 'pending'
                                ? t('no_pending_reminders')
                                : t('no_notified_reminders')
                            }
                        </p>
                    </div>
                ) : (
                    currentTasks.map((task) => (
                        <article key={`${task.id}-${task.taskType}`} className={`${styles.DashboardReminders__item} animate-fade-in`}>
                            <div className={`${styles.DashboardReminders__itemInfo}`}>
                                <h4 className={`${styles.DashboardReminders__itemName}`}>{task.full_name}</h4>
                                <div className={`${styles.DashboardReminders__itemDetails}`}>
                                    <span className={`${styles.DashboardReminders__badge} ${styles['DashboardReminders__badge' + task.badgeClass.charAt(0).toUpperCase() + task.badgeClass.slice(1)] || ''}`}>
                                        {task.label}
                                    </span>
                                </div>
                            </div>
                            <div className={`${styles.DashboardReminders__itemActions}`}>
                                <Button
                                    variant="whatsapp"
                                    size="sm-compact"
                                    onClick={() => onWhatsApp(task, task.taskType)}
                                    icon={<Icon name="chat" size="1rem" />}
                                    tooltip={t('notify_via_whatsapp')}
                                >
                                    {t('whatsapp_label')}
                                </Button>

                                {activeSection === 'pending' ? (
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        onClick={() => onMarkNotified(task, task.taskType, true)}
                                        icon={<Icon name="notifications_active" size="1rem" />}
                                        tooltip={t('mark_as_notified')}
                                    >
                                        {t('notified')}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        onClick={() => onMarkNotified(task, task.taskType, false)}
                                        icon={<Icon name="undo" size="1rem" />}
                                        tooltip={t('unmark_notified')}
                                    >
                                        {t('undo')}
                                    </Button>
                                )}

                                <Button
                                    variant="success"
                                    size="sm-compact"
                                    onClick={() => onComplete(task, task.taskType)}
                                    icon={<Icon name="check" size="1rem" />}
                                >
                                    {t('done')}
                                </Button>

                                <Button
                                    variant="outline-accent"
                                    size="sm-compact"
                                    onClick={() => onViewProfile(task.id)}
                                    icon={<Icon name="person" size="1rem" />}
                                >
                                    {t('profile')}
                                </Button>
                            </div>
                        </article>
                    ))
                )}
            </div>
        </section>
    );
};
