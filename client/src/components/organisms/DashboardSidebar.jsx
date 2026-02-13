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
                            label={t('turnos_hoy')}
                            value={stats.appointments_today}
                        />
                        <StatCard
                            size="sm"
                            icon={ICONS.WEEK}
                            label={t('turnos_semana')}
                            value={stats.appointments_week}
                        />
                        <StatCard
                            size="sm"
                            icon={ICONS.MONTH}
                            label={t('turnos_mes')}
                            value={stats.appointments_month}
                        />
                        <StatCard
                            size="sm"
                            icon={ICONS.PATIENTS}
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
                        <Icon name={ICONS.NEW} size="1rem" />
                        {t('new_patients_stat')}
                    </h4>
                    <div className="dashboard-sidebar__grid">
                        <StatCard
                            size="sm"
                            icon={ICONS.FLARE}
                            label={t('this_day')}
                            value={newPatientStats.currentDay}
                            variant="accent"
                        />
                        <StatCard
                            size="sm"
                            icon={ICONS.CALENDAR_TODAY}
                            label={t('this_week')}
                            value={newPatientStats.currentWeek}
                        />
                        <StatCard
                            size="sm"
                            icon={ICONS.BAR_CHART}
                            label={t('this_month')}
                            value={newPatientStats.currentMonth}
                        />
                        <StatCard
                            size="sm"
                            icon={ICONS.GROWTH}
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

