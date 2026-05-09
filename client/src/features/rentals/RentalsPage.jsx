import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import Loading from '@/components/atoms/Loading';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import { formatPrice } from '@/utils/format';
import { formatDate } from '@/utils/dateUtils';
import { useRentalsController } from '@/features/rentals/hooks/useRentalsController';

/**
 * RentalsPage (Orchestrator).
 * Interface for doctors to book offices and for staff to manage availability.
 */
const RentalsPage = () => {
    const {
        user,
        t,
        consultorios,
        rentals,
        loading,
        selectedOffice,
        setSelectedOffice,
        date,
        setDate,
        startTime,
        setStartTime,
        endTime,
        setEndTime,
        handleRent
    } = useRentalsController();

    return (
        <MainLayout wide flush title={t('office_rentals') || 'Alquiler de Consultorios'}>
            <div className="rentals-page-orchestrator">
                <div className="layout-content-area animate-fade-in">
                    <div className="dashboard-nav-bar">
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                            <Icon name="domain" size="1.2rem" />
                            {consultorios.length} {t('offices_count') || 'Consultorios disponibles'}
                        </div>
                    </div>

                    {loading ? (
                        <Loading variant="centered" text={t('loading_rentals')} />
                    ) : (
                        <div className="dashboard-layout__grid">
                            <aside className="dashboard-layout__sidebar">
                                {/* Booking Form (Doctors only) */}
                                {user && user.role === 'doctor' && (
                                    <div className="dashboard-card">
                                        <h3 className="dashboard-card__title">
                                            <Icon name="calendar_month" size="1.2rem" />
                                            {t('book_office') || 'Nueva Reserva'}
                                        </h3>
                                        <form onSubmit={handleRent} className="flex flex-col gap-4 mt-2">
                                            <div className="input-group">
                                                <label className="input-label">{t('select_office')}</label>
                                                <select className="input-field" value={selectedOffice} onChange={(e) => setSelectedOffice(e.target.value)} required>
                                                    <option value="">-- {t('select_office')} --</option>
                                                    {consultorios.map(c => (
                                                        <option key={c.id} value={c.id}>{c.name} - {t(c.status) || c.status}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="input-group">
                                                <label className="input-label">{t('date')}</label>
                                                <input type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} required />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="input-group">
                                                    <label className="input-label">{t('start_time')}</label>
                                                    <input type="time" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                                                </div>
                                                <div className="input-group">
                                                    <label className="input-label">{t('end_time')}</label>
                                                    <input type="time" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                                                </div>
                                            </div>
                                            <Button type="submit" variant="primary" className="w-full mt-2">
                                                {t('book_rental_btn') || 'Confirmar Reserva'}
                                            </Button>
                                        </form>
                                    </div>
                                )}

                                {/* Available Offices List */}
                                <div className="dashboard-card">
                                    <h3 className="dashboard-card__title">
                                        <Icon name="meeting_room" size="1.2rem" />
                                        {t('available_offices') || 'Espacios Disponibles'}
                                    </h3>
                                    <div className="flex flex-col gap-3">
                                        {consultorios.map(c => (
                                            <div key={c.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                                                <div className="flex justify-between items-start">
                                                    <strong className="text-slate-800 text-sm">{c.name}</strong>
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ${c.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                        {t(c.status) || c.status}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{c.description || 'Sin descripción'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </aside>

                            <main className="dashboard-layout__main">
                                 {/* My Rentals List */}
                                {user && user.role === 'doctor' && (
                                    <div className="dashboard-card no-padding">
                                        <div className="p-5 border-b border-border-color">
                                            <h3 className="text-lg font-bold text-slate-800 m-0">{t('my_rentals') || 'Mis Alquileres'}</h3>
                                        </div>
                                        <div className="table-responsive">
                                            {rentals.length === 0 ? (
                                                <div className="py-20 text-center text-slate-400 italic">
                                                    No tienes alquileres registrados.
                                                </div>
                                            ) : (
                                                <table className="table-base w-full">
                                                    <thead>
                                                        <tr>
                                                            <th className="pl-6">{t('office')}</th>
                                                            <th>{t('date')}</th>
                                                            <th>{t('time')}</th>
                                                            <th className="pr-6 text-right">{t('cost')}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {rentals.map(r => (
                                                            <tr key={r.id}>
                                                                <td className="pl-6 font-bold text-slate-800">{r.consultorio_name}</td>
                                                                <td>{formatDate(r.rental_date)}</td>
                                                                <td>{r.start_time} - {r.end_time}</td>
                                                                <td className="pr-6 text-right font-mono text-green-600 font-bold">{formatPrice(r.cost)}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Staff View (Secretary/Admin) */}
                                {user && (user.role === 'secretary' || user.role === 'admin') && (
                                    <div className="dashboard-card">
                                        <div className="py-20 text-center">
                                            <Icon name="payments" size="3rem" className="text-slate-200 mb-4 mx-auto" />
                                            <h3 className="text-slate-400 font-medium">Panel de Gestión de Alquileres</h3>
                                            <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2 italic">
                                                Próximamente podrá ver el resumen de alquileres de todos los médicos.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </main>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default RentalsPage;
