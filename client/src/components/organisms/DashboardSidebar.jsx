import React from 'react';
import StatCard from '../molecules/StatCard';
import { useNavigate } from 'react-router-dom';
import './DashboardSidebar.css';

const DashboardSidebar = ({ stats, newPatientStats, reminders, user, t }) => {
    const navigate = useNavigate();

    return (
        <aside className="dashboard-sidebar-panels">
            {/* General Statistics Section */}
            {stats && (
                <section className="dashboard-sidebar-section">
                    <h4 className="dashboard-sidebar-section__title">
                        {t('general_stats') || 'Estadísticas Generales'}
                    </h4>
                    <div className="dashboard-sidebar-section__grid">
                        <StatCard
                            icon="📅"
                            label={t('turnos_hoy') || 'Hoy'}
                            value={stats.appointments_today}
                        />
                        <StatCard
                            icon="📊"
                            label={t('turnos_semana') || 'Semana'}
                            value={stats.appointments_week}
                        />
                        <StatCard
                            icon="📈"
                            label={t('turnos_mes') || 'Mes'}
                            value={stats.appointments_month}
                        />
                        <StatCard
                            icon="👥"
                            label={t('pacientes_label') || 'Pacientes'}
                            value={stats.total_patients}
                        />
                    </div>
                </section>
            )}

            {/* New Patient Growth Section */}
            {newPatientStats && (
                <section className="dashboard-sidebar-section">
                    <h4 className="dashboard-sidebar-section__title">
                        ✨ {t('new_patients_stat') || 'Crecimiento de Pacientes'}
                    </h4>
                    <div className="dashboard-sidebar-section__grid">
                        <StatCard
                            icon="✨"
                            label={t('this_day') || 'Hoy'}
                            value={newPatientStats.currentDay}
                            variant="accent"
                        />
                        <StatCard
                            icon="📅"
                            label={t('this_week') || 'Esta Sem.'}
                            value={newPatientStats.currentWeek}
                        />
                        <StatCard
                            icon="📊"
                            label={t('this_month') || 'Este Mes'}
                            value={newPatientStats.currentMonth}
                        />
                        <StatCard
                            icon="📈"
                            label={t('this_year') || 'Este Año'}
                            value={newPatientStats.currentYear}
                            variant="dark"
                        />
                    </div>
                </section>
            )}

            {user.role !== 'admin' && reminders.length > 0 && (
                <section className="dashboard-sidebar-section dashboard-sidebar-section--reminders">
                    <h4 className="dashboard-sidebar-section__title">
                        <span>🔔</span> {t('reminders')}
                    </h4>
                    <div className="reminders-list">
                        {reminders.slice(0, 3).map(r => (
                            <div
                                key={r.id}
                                className="reminder-item"
                                onClick={() => navigate('/pages/Patients', { state: { selectedPatientId: r.id } })}
                            >
                                <div className="reminder-item__name">{r.full_name}</div>
                                {r.medical_history_evolution && (
                                    <div className="reminder-item__evolution">
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

