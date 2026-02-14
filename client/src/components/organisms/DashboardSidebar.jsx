import React from 'react';
import StatCard from '../molecules/StatCard';
import Icon from '../atoms/Icon';
import { useNavigate } from 'react-router-dom';
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
                        <Icon name="analytics" size="1rem" />
                        {t('general_stats') || 'Estadísticas Generales'}
                    </h4>
                    <div className="dashboard-sidebar__grid">
                        <StatCard
                            size="sm"
                            icon="calendar_today"
                            label={t('turnos_hoy')}
                            value={stats.appointments_today}
                        />
                        <StatCard
                            size="sm"
                            icon="view_week"
                            label={t('turnos_semana')}
                            value={stats.appointments_week}
                        />
                        <StatCard
                            size="sm"
                            icon="date_range"
                            label={t('turnos_mes')}
                            value={stats.appointments_month}
                        />
                        <StatCard
                            size="sm"
                            icon="groups"
                            label={t('pacientes_label')}
                            value={stats.total_patients}
                        />
                    </div>
                </section>
            )}

            {/* New Patient Growth Section */}
            {newPatientStats && (
                <section className="dashboard-sidebar__section">
                    <h4 className="dashboard-sidebar__title">
                        <Icon name="auto_awesome" size="1rem" />
                        {t('new_patients_stat')}
                    </h4>
                    <div className="dashboard-sidebar__grid">
                        <StatCard
                            size="sm"
                            icon="flare"
                            label={t('this_day')}
                            value={newPatientStats.currentDay}
                            variant="accent"
                        />
                        <StatCard
                            size="sm"
                            icon="calendar_today"
                            label={t('this_week')}
                            value={newPatientStats.currentWeek}
                        />
                        <StatCard
                            size="sm"
                            icon="bar_chart"
                            label={t('this_month')}
                            value={newPatientStats.currentMonth}
                        />
                        <StatCard
                            size="sm"
                            icon="trending_up"
                            label={t('this_year')}
                            value={newPatientStats.currentYear}
                            variant="dark"
                        />
                    </div>
                </section>
            )}

        </aside>
    );
};

export default DashboardSidebar;

