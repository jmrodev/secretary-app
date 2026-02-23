import React, { useState } from 'react';
import Button from '../atoms/Button';
import Icon from '../atoms/Icon';
import TabButton from '../atoms/TabButton';
import { formatDate } from '../../utils/dateUtils';
import './DashboardReminders.css';

/**
 * DashboardReminders Organism
 * 
 * Displays two lists of reminders: Pending and Notified.
 * Follows BEM methodology and Project Architecture.
 */
const DashboardReminders = ({ reminders, t, onWhatsApp, onComplete, onMarkNotified, onViewProfile }) => {
    const [activeSection, setActiveSection] = useState('pending');

    // Flatten reminders into individual tasks
    const allTasks = [];
    reminders.forEach(r => {
        // Visit Reminder
        if (r.next_suggested_visit_date && new Date(r.next_suggested_visit_date) <= new Date()) {
            allTasks.push({
                ...r,
                taskType: 'visit',
                isNotified: !!r.visit_notified,
                label: `${t('visit_overdue') || 'Control pendiente'} (${formatDate(r.next_suggested_visit_date)})`,
                badgeClass: 'visit'
            });
        }
        // Prescription Reminder
        if (r.next_suggested_prescription_date && new Date(r.next_suggested_prescription_date) <= new Date()) {
            allTasks.push({
                ...r,
                taskType: 'prescription',
                isNotified: !!r.prescription_notified,
                label: `${t('prescription_overdue') || 'Renovación sugerida'} (${formatDate(r.next_suggested_prescription_date)})`,
                badgeClass: 'prescription'
            });
        }
        // License Reminder
        if (r.license_expiry_date && new Date(r.license_expiry_date) <= new Date()) {
            allTasks.push({
                ...r,
                taskType: 'license',
                isNotified: !!r.license_notified,
                label: `${t('license_expiring') || 'Licencia por vencer'} (${formatDate(r.license_expiry_date)})`,
                badgeClass: 'license'
            });
        }
        // Medication Reminders
        if (r.expiring_meds) {
            allTasks.push({
                ...r,
                taskType: 'medication',
                isNotified: !!r.meds_all_notified_min,
                label: `${t('meds_expiring') || 'Faltan medicamentos'}: ${r.expiring_meds}`,
                badgeClass: 'medication'
            });
        }
    });

    const pendingTasks = allTasks.filter(task => !task.isNotified);
    const notifiedTasks = allTasks.filter(task => task.isNotified);

    const currentTasks = activeSection === 'pending' ? pendingTasks : notifiedTasks;

    return (
        <div className="dashboard-reminders">
            <div className="dashboard-reminders__header">
                <div className="dashboard-reminders__tabs">
                    <TabButton
                        isActive={activeSection === 'pending'}
                        onClick={() => setActiveSection('pending')}
                        variant="pill"
                    >
                        {t('pending') || 'Pendientes'}
                        <span className="dashboard-reminders__count">{pendingTasks.length}</span>
                    </TabButton>
                    <TabButton
                        isActive={activeSection === 'notified'}
                        onClick={() => setActiveSection('notified')}
                        variant="pill"
                    >
                        {t('notified') || 'Avisados'}
                        <span className="dashboard-reminders__count">{notifiedTasks.length}</span>
                    </TabButton>
                </div>
            </div>

            <div className="dashboard-reminders__list">
                {currentTasks.length === 0 ? (
                    <div className="dashboard-reminders__empty">
                        <Icon name="info" size="3rem" color="var(--slate-300)" />
                        <p>
                            {activeSection === 'pending'
                                ? (t('no_pending_reminders') || 'No hay recordatorios pendientes.')
                                : (t('no_notified_reminders') || 'No hay recordatorios marcados como avisados.')
                            }
                        </p>
                    </div>
                ) : (
                    currentTasks.map((task, idx) => (
                        <div key={`${task.id}-${task.taskType}-${idx}`} className="dashboard-reminders__item animate-fadeIn">
                            <div className="dashboard-reminders__item-info">
                                <div className="dashboard-reminders__item-name">{task.full_name}</div>
                                <div className="dashboard-reminders__item-details">
                                    <span className={`dashboard-reminders__badge dashboard-reminders__badge--${task.badgeClass}`}>
                                        {task.label}
                                    </span>
                                </div>
                            </div>
                            <div className="dashboard-reminders__item-actions">
                                <Button
                                    variant="whatsapp"
                                    size="sm-compact"
                                    onClick={() => onWhatsApp(task, task.taskType)}
                                    icon={<Icon name="chat" size="1rem" />}
                                    tooltip={t('notify_via_whatsapp') || 'Avisar por WhatsApp'}
                                >
                                    WhatsApp
                                </Button>

                                {activeSection === 'pending' ? (
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        onClick={() => onMarkNotified(task, task.taskType, true)}
                                        icon={<Icon name="notifications_active" size="1rem" />}
                                        tooltip={t('mark_as_notified') || 'Marcar Avisado'}
                                    >
                                        {t('notified') || 'Avisado'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        onClick={() => onMarkNotified(task, task.taskType, false)}
                                        icon={<Icon name="undo" size="1rem" />}
                                        tooltip={t('unmark_notified') || 'Quitar de Avisados'}
                                    >
                                        {t('undo') || 'Deshacer'}
                                    </Button>
                                )}

                                <Button
                                    variant="success"
                                    size="sm-compact"
                                    onClick={() => onComplete(task, task.taskType)}
                                    icon={<Icon name="check" size="1rem" />}
                                >
                                    {t('done') || 'Realizado'}
                                </Button>

                                <Button
                                    variant="outline-accent"
                                    size="sm-compact"
                                    onClick={() => onViewProfile(task.id)}
                                    icon={<Icon name="person" size="1rem" />}
                                >
                                    {t('profile') || 'Perfil'}
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DashboardReminders;
