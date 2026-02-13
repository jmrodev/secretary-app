import React from 'react';
import StatCard from '../molecules/StatCard';
import Icon from '../atoms/Icon';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../../constants/icons';
import './DashboardSidebar.css';

/**
 * DashboardSidebar Organism.
 * Displays stats and reminders using a BEM structure.
 */
const DashboardSidebar = ({ stats, newPatientStats, reminders, user, t }) => {
    const navigate = useNavigate();

    return (
        <aside className="dashboard-sidebar">
            {/* General Statistics Section */}
            {stats && (
                <section className="dashboard-sidebar__section">
                    <h4 className="dashboard-sidebar__title">
                        <Icon name={ICONS.STATS} size="1rem" />
                        {t('general_stats') || 'Estadísticas Generales'}
                    </h4>
                    <div className="dashboard-sidebar__grid">
                        <StatCard
                            size="sm"
                            icon={ICONS.TODAY}
                            label={t('turnos_hoy') || 'Hoy'}
                            value={stats.appointments_today}
                        />
                        <StatCard
                            size="sm"
                            icon={ICONS.WEEK}
                            label={t('turnos_semana') || 'Semana'}
                            value={stats.appointments_week}
                        />
                        <StatCard
                            size="sm"
                            icon={ICONS.MONTH}
                            label={t('turnos_mes') || 'Mes'}
                            value={stats.appointments_month}
                        />
                        <StatCard
                            size="sm"
                            icon={ICONS.PATIENTS}
                            label={t('pacientes_label') || 'Pacientes'}
                            value={stats.total_patients}
                        />
                    </div>
                </section>
            )}

            {/* New Patient Growth Section */}
            {newPatientStats && (
                <section className="dashboard-sidebar__section">
                    <h4 className="dashboard-sidebar__title">
                        <Icon name={ICONS.NEW} size="1rem" />
                        {t('new_patients_stat') || 'Nuevos Pacientes'}
                    </h4>
                    <div className="dashboard-sidebar__grid">
                        <StatCard
                            size="sm"
                            icon={ICONS.FLARE}
                            label={t('this_day') || 'Hoy'}
                            value={newPatientStats.currentDay}
                            variant="accent"
                        />
                        <StatCard
                            size="sm"
                            icon={ICONS.CALENDAR_TODAY}
                            label={t('this_week') || 'Esta Sem.'}
                            value={newPatientStats.currentWeek}
                        />
                        <StatCard
                            size="sm"
                            icon={ICONS.BAR_CHART}
                            label={t('this_month') || 'Este Mes'}
                            value={newPatientStats.currentMonth}
                        />
                        <StatCard
                            size="sm"
                            icon={ICONS.GROWTH}
                            label={t('this_year') || 'Este Año'}
                            value={newPatientStats.currentYear}
                            variant="dark"
                        />
                    </div>
                </section>
            )}

            {/* Reminders Section */}
            {user.role !== 'admin' && reminders.length > 0 && (
                <section className="dashboard-sidebar__section dashboard-sidebar__section--reminders">
                    <h4 className="dashboard-sidebar__title">
                        <Icon name={ICONS.NOTIFICATIONS} size="1rem" />
                        {t('reminders')}
                    </h4>
                    <div className="dashboard-sidebar__reminders">
                        {reminders.slice(0, 3).map(r => (
                            <div
                                key={r.id}
                                className="dashboard-sidebar__reminder"
                                onClick={() => navigate('/patients', { state: { selectedPatientId: r.id } })}
                            >
                                <div className="dashboard-sidebar__reminder-name">{r.full_name}</div>
                                {r.medical_history_evolution && (
                                    <div className="dashboard-sidebar__reminder-evolution">
                                        "{r.medical_history_evolution}"
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </aside>
    );
};

export default DashboardSidebar;

