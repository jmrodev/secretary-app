import React from 'react';
import StatCard from '@/features/dashboard/components/StatCard';
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
        <aside className="dashboard-sidebar">
            {/* General Statistics Section */}
            {stats && (
                <section className="dashboard-sidebar__section animate-fadeIn">
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
                            variant={stats.appointments_today > 0 ? 'success' : 'default'}
                        />
                        <StatCard
                            size="sm"
                            icon="view_week"
                            label={t('turnos_semana')}
                            value={stats.appointments_week}
                            variant="accent"
                        />
                        <StatCard
                            size="sm"
                            icon="date_range"
                            label={t('turnos_mes')}
                            value={stats.appointments_month}
                            variant="warning"
                        />
                        <StatCard
                            size="sm"
                            icon="groups"
                            label={t('pacientes_label')}
                            value={stats.total_patients}
                            variant="dark"
                        />
                    </div>
                </section>
            )}

            {/* New Patient Growth Section */}
            {newPatientStats && (
                <section className="dashboard-sidebar__section animate-fadeIn" style={{ animationDelay: '0.1s' }}>
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
                            variant={newPatientStats.currentDay > 0 ? 'success' : 'accent'}
                        />
                        <StatCard
                            size="sm"
                            icon="calendar_today"
                            label={t('this_week')}
                            value={newPatientStats.currentWeek}
                            trend={newPatientStats.currentWeek > 0 ? '↑' : ''}
                        />
                        <StatCard
                            size="sm"
                            icon="bar_chart"
                            label={t('this_month')}
                            value={newPatientStats.currentMonth}
                            variant="dark"
                        />
                        <StatCard
                            size="sm"
                            icon="trending_up"
                            label={t('this_year')}
                            value={newPatientStats.currentYear}
                            variant="success"
                            trend="↑"
                            trendLabel="mejora"
                        />
                    </div>
                </section>
            )}
        </aside>
    );
};

export default DashboardSidebar;
