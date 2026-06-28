import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import Loading from '@/components/atoms/Loading';
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Badge from '@/components/atoms/Badge';
import { formatCurrency } from '@/utils/core/format';
import { formatDate } from '@/utils/core/dateUtils';
import { useRentalsController } from '@/features/rentals/hooks/useRentalsController';
import styles from './RentalsPage.module.css';

import FeatureToolbar from '@/components/organisms/FeatureToolbar';

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
                    <FeatureToolbar
                        className="rentals-page-orchestrator__top-actions"
                        actions={
                            <div className="rentals-page__toolbar-actions">
                                <div className="rentals-page__status-info">
                                    <Icon name="domain" size="1.2rem" />
                                    <span>{consultorios.length} {t('offices_count') || 'Consultorios disponibles'}</span>
                                </div>
                            </div>
                        }
                    />

                    {loading ? (
                        <Loading variant="centered" text={t('loading_rentals')} />
                    ) : (
                        <main className="rentals-page__content">
                            <div className="dashboard-layout__grid dashboard-layout__grid--full">
                                {/* Booking Area */}
                                {user && user.role === 'doctor' && (
                                    <section className="rentals-page__booking-section">
                                        <article className="dashboard-card">
                                            <h3 className="dashboard-card__title">
                                                <Icon name="calendar_month" size="1.2rem" />
                                                {t('book_office') || 'Nueva Reserva'}
                                            </h3>
                                            <form onSubmit={handleRent} className="rentals-page__form">
                                                <div className="rentals-page__form-grid">
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
                                                    <div className="input-group">
                                                        <label className="input-label">{t('start_time')}</label>
                                                        <input type="time" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                                                    </div>
                                                    <div className="input-group">
                                                        <label className="input-label">{t('end_time')}</label>
                                                        <input type="time" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                                                    </div>
                                                </div>
                                                <div className="rentals-page__form-actions">
                                                    <Button type="submit" variant="primary">
                                                        {t('book_rental_btn') || 'Confirmar Reserva'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </article>

                                        {/* Available Offices List */}
                                        <article className="dashboard-card">
                                            <h3 className="dashboard-card__title">
                                                <Icon name="meeting_room" size="1.2rem" />
                                                {t('available_offices') || 'Espacios Disponibles'}
                                            </h3>
                                            <div className="rentals-page__offices-list">
                                                {consultorios.map(c => (
                                                    <div key={c.id} className={`${styles.officeItem}`}>
                                                        <div className="rentals-page__office-header">
                                                            <strong className={`${styles.officeName}`}>{c.name}</strong>
                                                            <span className={`rentals-page__status-badge rentals-page__status-badge--${c.status}`}>
                                                                {t(c.status) || c.status}
                                                            </span>
                                                        </div>
                                                        <p className={`${styles.officeDesc}`}>{c.description || 'Sin descripción'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </article>
                                    </section>
                                )}

                                {/* My Rentals List */}
                                {user && user.role === 'doctor' && (
                                    <article className="dashboard-card no-padding">
                                        <div className="dashboard-card__header">
                                            <h3 className="dashboard-card__title">{t('my_rentals') || 'Mis Alquileres'}</h3>
                                        </div>
                                        <div className="table-responsive">
                                            {rentals.length === 0 ? (
                                                <div className="empty-state">
                                                    <p className="empty-state__text">No tienes alquileres registrados.</p>
                                                </div>
                                            ) : (
                                                <table className="table-base">
                                                    <thead>
                                                        <tr>
                                                            <th>{t('office')}</th>
                                                            <th>{t('date')}</th>
                                                            <th>{t('time')}</th>
                                                            <th className="text-right">{t('cost')}</th>
                                                            <th className="text-center">{t('status') || 'Estado'}</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {rentals.map(r => (
                                                            <tr key={r.id}>
                                                                <td className="font-bold">{r.consultorio_name}</td>
                                                                <td>{formatDate(r.rental_date)}</td>
                                                                <td>{r.start_time} - {r.end_time}</td>
                                                                <td className="text-right font-mono font-bold text-success">{formatCurrency(r.cost)}</td>
                                                                <td className="text-center">
                                                                    <Badge variant={r.is_paid ? 'success' : 'danger'}>
                                                                        {r.is_paid ? (t('paid') || 'Pagado') : (t('pending') || 'Impago')}
                                                                    </Badge>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            )}
                                        </div>
                                    </article>
                                )}

                                {/* Staff View (Secretary/Admin) */}
                                {user && (user.role === 'secretary' || user.role === 'admin') && (
                                    <section className="rentals-page__staff-view">
                                        <article className="dashboard-card">
                                            <div className="empty-state">
                                                <Icon name="payments" size="3rem" className="empty-state__icon" />
                                                <h3 className="empty-state__title">Panel de Gestión de Alquileres</h3>
                                                <p className="empty-state__text">
                                                    Próximamente podrá ver el resumen de alquileres de todos los médicos.
                                                </p>
                                            </div>
                                        </article>
                                    </section>
                                )}
                            </div>
                        </main>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};

export default RentalsPage;
