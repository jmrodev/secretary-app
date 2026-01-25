import React from 'react';
import StatCard from '../molecules/StatCard';
import { useNavigate } from 'react-router-dom';

const DashboardSidebar = ({ stats, newPatientStats, reminders, user, t }) => {
    const navigate = useNavigate();

    return (
        <aside className="dashboard-side-col">
            {/* General Statistics Section */}
            {stats && (
                <div className="flex flex-col gap-3">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">
                        {t('general_stats') || 'Estadísticas Generales'}
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                        <StatCard
                            icon="📅"
                            label={t('turnos_hoy') || 'Hoy'}
                            value={stats.appointments_today}
                            hoverColorClass="group-hover:text-indigo-600"
                        />
                        <StatCard
                            icon="📊"
                            label={t('turnos_semana') || 'Semana'}
                            value={stats.appointments_week}
                            hoverColorClass="group-hover:text-emerald-600"
                        />
                        <StatCard
                            icon="📈"
                            label={t('turnos_mes') || 'Mes'}
                            value={stats.appointments_month}
                            hoverColorClass="group-hover:text-indigo-600"
                        />
                        <StatCard
                            icon="👥"
                            label={t('pacientes_label') || 'Pacientes'}
                            value={stats.total_patients}
                            hoverColorClass="group-hover:text-slate-600"
                        />
                    </div>
                </div>
            )}

            {/* New Patient Growth Section */}
            {newPatientStats && (
                <div className="flex flex-col gap-3 mt-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 px-1">
                        ✨ {t('new_patients_stat') || 'Crecimiento de Pacientes'}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        <StatCard
                            icon="✨"
                            label={t('this_day') || 'Hoy'}
                            value={newPatientStats.currentDay}
                            bgClass="bg-indigo-600"
                            borderClass="border-indigo-500"
                            textClass="text-white italic"
                            hoverColorClass=""
                        />
                        <StatCard
                            icon="📅"
                            label={t('this_week') || 'Esta Sem.'}
                            value={newPatientStats.currentWeek}
                            bgClass="bg-slate-50"
                            textClass="text-slate-800"
                        />
                        <StatCard
                            icon="📊"
                            label={t('this_month') || 'Este Mes'}
                            value={newPatientStats.currentMonth}
                            bgClass="bg-slate-50"
                            textClass="text-slate-800"
                        />
                        <StatCard
                            icon="📈"
                            label={t('this_year') || 'Este Año'}
                            value={newPatientStats.currentYear}
                            bgClass="bg-indigo-900"
                            borderClass="border-indigo-800"
                            textClass="text-white italic"
                            hoverColorClass=""
                        />
                    </div>
                </div>
            )}

            {user.role !== 'admin' && reminders.length > 0 && (
                <div className="card p-4 border-l-4 border-amber-400 bg-amber-50/20 mt-4 shadow-sm">
                    <h4 className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <span>🔔</span> {t('reminders')}
                    </h4>
                    <div className="flex flex-col gap-2">
                        {reminders.slice(0, 3).map(r => (
                            <div key={r.id} className="text-sm p-2 bg-white/80 rounded-lg border border-amber-100 cursor-pointer hover:bg-white hover:shadow-md transition-all" onClick={() => navigate('/nodes/patients', { state: { selectedPatientId: r.id } })}>
                                {/* Updated route to nodes/patients if that is what was intended, keeping original /patients for now but noticed user has file system structure implying otherwise? No, user path is /client/src/pages/Patients.jsx probably mapped to /patients. Keeping /patients */}
                                <div className="font-bold text-main-800 truncate text-[11px]">{r.full_name}</div>
                                <div className="text-[10px] text-amber-700 mt-1">
                                    {r.medical_history_evolution && <div className="truncate italic opacity-75">"{r.medical_history_evolution}"</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </aside>
    );
};

export default DashboardSidebar;
