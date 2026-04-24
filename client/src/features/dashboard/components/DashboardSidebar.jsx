import React from 'react';
import StatCard from '@/features/dashboard/components/StatCard';
import Icon from '@/components/atoms/Icon';
import './DashboardSidebar.css';

/**
 * DashboardSidebar Organism (Feature Component).
 * Displays stats and patient growth using a BEM structure.
 */
const DashboardSidebar = ({ stats, newPatientStats, user, t }) => {
    return (
        <aside className="dashboard-sidebar-stats">
            {/* General Statistics Section - 2x2 Bento Grid */}
            {stats && (
                <section className="dashboard-sidebar__section animate-fadeIn">
                    <header className="dashboard-sidebar__header">
                        <h4 className="dashboard-sidebar__title">
                            {t('general_stats')}
                        </h4>
                    </header>
                    <div className="dashboard-sidebar__grid">
                        <StatCard
                            size="sm"
                            icon="calendar_today"
                            label={t('turnos_hoy')}
                            value={stats.appointments_today}
                            className="stat-card--bento"
                        />
                        <StatCard
                            size="sm"
                            icon="view_week"
                            label={t('turnos_semana')}
                            value={stats.appointments_week}
                            className="stat-card--bento"
                        />
                        <StatCard
                            size="sm"
                            icon="date_range"
                            label={t('turnos_mes')}
                            value={stats.appointments_month}
                            className="stat-card--bento"
                        />
                        <StatCard
                            size="sm"
                            icon="groups"
                            label={t('pacientes_label')}
                            value={stats.total_patients}
                            className="stat-card--bento"
                        />
                    </div>
                </section>
            )}

            {/* New Patient Growth Section - Sparkline Bento Layout */}
            {newPatientStats && (
                <section className="dashboard-sidebar__section dashboard-sidebar__section--growth animate-fadeIn">
                    <header className="dashboard-sidebar__header">
                        <h4 className="dashboard-sidebar__title">
                            {t('new_patients_stat')}
                        </h4>
                    </header>
                    <div className="dashboard-sidebar__sparkline-card">
                        <div className="sparkline-item">
                            <span className="sparkline-item__label">{t('this_day')}</span>
                            <span className="sparkline-item__value">{newPatientStats.currentDay}</span>
                        </div>
                        <div className="sparkline-divider"></div>
                        <div className="sparkline-item">
                            <span className="sparkline-item__label">{t('this_week')}</span>
                            <span className="sparkline-item__value">{newPatientStats.currentWeek}</span>
                        </div>
                        <div className="sparkline-divider"></div>
                        <div className="sparkline-item">
                            <span className="sparkline-item__label">{t('this_month')}</span>
                            <span className="sparkline-item__value">{newPatientStats.currentMonth}</span>
                        </div>
                        <div className="sparkline-divider"></div>
                        <div className="sparkline-item sparkline-item--highlight">
                            <span className="sparkline-item__label">{t('this_year')}</span>
                            <span className="sparkline-item__value">
                                {newPatientStats.currentYear}
                                <Icon name="trending_up" size="0.75rem" className="sparkline-item__trend" />
                            </span>
                        </div>
                    </div>
                </section>
            )}
        </aside>
    );
};

export default DashboardSidebar;
