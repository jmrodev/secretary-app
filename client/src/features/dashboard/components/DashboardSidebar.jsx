import React from 'react';
import StatCard from './StatCard';
import Icon from '@/components/atoms/Icon';
import { useNavigate } from 'react-router-dom';
import './DashboardSidebar.css';

/**
 * DashboardSidebar Organism (Feature Component).
 * Displays stats and patient growth using a BEM structure.
 */
const DashboardSidebar = ({ stats, newPatientStats, user, t }) => {
    const navigate = useNavigate();

    return (
        <aside className="dashboard-sidebar-stats">
            {/* General Statistics Section */}
            {stats && (
                <section className="dashboard-sidebar__section animate-fadeIn">
                    <h4 className="dashboard-sidebar__title">
                        <Icon name="analytics" size="1rem" />
                        {t('general_stats') || 'Estadísticas Generales'}
                    </h4>
                    <div className="dashboard-sidebar__list">
                        <StatCard
                            layout="list"
                            icon="calendar_today"
                            label={t('turnos_hoy')}
                            value={stats.appointments_today}
                        />
                        <StatCard
                            layout="list"
                            icon="view_week"
                            label={t('turnos_semana')}
                            value={stats.appointments_week}
                        />
                        <StatCard
                            layout="list"
                            icon="date_range"
                            label={t('turnos_mes')}
                            value={stats.appointments_month}
                        />
                        <StatCard
                            layout="list"
                            icon="groups"
                            label={t('pacientes_label')}
                            value={stats.total_patients}
                        />
                    </div>
                </section>
            )}

            {/* New Patient Growth Section */}
            {newPatientStats && (
                <section className="dashboard-sidebar__section dashboard-sidebar__section--delayed animate-fadeIn">
                    <h4 className="dashboard-sidebar__title">
                        <Icon name="auto_awesome" size="1rem" />
                        {t('new_patients_stat') || 'Crecimiento de Pacientes'}
                    </h4>
                    <div className="dashboard-sidebar__list">
                        <StatCard
                            layout="list"
                            icon="flare"
                            label={t('this_day')}
                            value={newPatientStats.currentDay}
                        />
                        <StatCard
                            layout="list"
                            icon="calendar_today"
                            label={t('this_week')}
                            value={newPatientStats.currentWeek}
                        />
                        <StatCard
                            layout="list"
                            icon="bar_chart"
                            label={t('this_month')}
                            value={newPatientStats.currentMonth}
                        />
                        <StatCard
                            layout="list"
                            icon="trending_up"
                            label={t('this_year')}
                            value={newPatientStats.currentYear}
                            trend="↑"
                        />
                    </div>
                </section>
            )}
        </aside>
    );
};

export default DashboardSidebar;
