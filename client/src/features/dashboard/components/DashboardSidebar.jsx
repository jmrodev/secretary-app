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
            {/* General Statistics Section - Horizontal Bento Card */}
            {stats && (
                <section className="dashboard-sidebar__section animate-fadeIn">
                    <header className="dashboard-sidebar__header">
                        <h4 className="dashboard-sidebar__title">
                            {t('general_stats')}
                        </h4>
                    </header>
                    <div className="dashboard-sidebar__horizontal-card">
                        <div className="horizontal-item">
                            <Icon name="calendar_today" size="0.875rem" className="horizontal-item__icon" />
                            <span className="horizontal-item__value">{stats.appointments_today}</span>
                            <span className="horizontal-item__label">{t('turnos_hoy')}</span>
                        </div>
                        <div className="horizontal-divider"></div>
                        <div className="horizontal-item">
                            <Icon name="view_week" size="0.875rem" className="horizontal-item__icon" />
                            <span className="horizontal-item__value">{stats.appointments_week}</span>
                            <span className="horizontal-item__label">{t('turnos_semana')}</span>
                        </div>
                        <div className="horizontal-divider"></div>
                        <div className="horizontal-item">
                            <Icon name="date_range" size="0.875rem" className="horizontal-item__icon" />
                            <span className="horizontal-item__value">{stats.appointments_month}</span>
                            <span className="horizontal-item__label">{t('turnos_mes')}</span>
                        </div>
                        <div className="horizontal-divider"></div>
                        <div className="horizontal-item">
                            <Icon name="groups" size="0.875rem" className="horizontal-item__icon" />
                            <span className="horizontal-item__value">{stats.total_patients}</span>
                            <span className="horizontal-item__label">{t('pacientes_label')}</span>
                        </div>
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
                    <div className="dashboard-sidebar__horizontal-card">
                        <div className="horizontal-item">
                            <span className="horizontal-item__value">{newPatientStats.currentDay}</span>
                            <span className="horizontal-item__label">{t('this_day')}</span>
                        </div>
                        <div className="horizontal-divider"></div>
                        <div className="horizontal-item">
                            <span className="horizontal-item__value">{newPatientStats.currentWeek}</span>
                            <span className="horizontal-item__label">{t('this_week')}</span>
                        </div>
                        <div className="horizontal-divider"></div>
                        <div className="horizontal-item">
                            <span className="horizontal-item__value">{newPatientStats.currentMonth}</span>
                            <span className="horizontal-item__label">{t('this_month')}</span>
                        </div>
                        <div className="horizontal-divider"></div>
                        <div className="horizontal-item horizontal-item--highlight">
                            <span className="horizontal-item__value">
                                {newPatientStats.currentYear}
                                <Icon name="trending_up" size="0.75rem" className="horizontal-item__trend" />
                            </span>
                            <span className="horizontal-item__label">{t('this_year')}</span>
                        </div>
                    </div>
                </section>
            )}
        </aside>
    );
};

export default DashboardSidebar;
