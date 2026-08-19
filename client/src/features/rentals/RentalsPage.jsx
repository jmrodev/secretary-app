import React from 'react';
import { MainLayout } from '@/components/templates/MainLayout';
import { Loading } from '@/components/atoms/Loading';
import { Button } from '@/components/atoms/Button';
import { Icon } from '@/components/atoms/Icon';
import { Badge } from '@/components/atoms/Badge';
import { formatCurrency } from '@/utils/core/format';
import { formatDate } from '@/utils/core/dateUtils';
import { useRentalsController } from '@/features/rentals/hooks/useRentalsController';
import styles from './RentalsPage.module.css';

import { FeatureToolbar } from '@/components/organisms/FeatureToolbar';

/**
 * RentalsPage (Orchestrator).
 * Interface for doctors to book offices and for staff to manage availability.
 */
export const RentalsPage = () => {
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
            <div>
                <div>
                    <FeatureToolbar
                        
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
                        <section className="rentals-page__content">
                                <div className={`${styles.RentalsPage__grid}`}>
                                {/* Booking Area */}
                                {user && user.role === 'doctor' && (
                                    <section className={`${styles.RentalsPage__sidebar}`}>
                                        <article className={`${styles.RentalsPage__card}`}>
                                            <div className={`${styles.RentalsPage__cardHeader}`}>
                                                <h3 className={`${styles.RentalsPage__cardTitle}`}>
                                                    <Icon name="calendar_month" size="1.2rem" />
                                                    {t('book_office') || 'Nueva Reserva'}
                                                </h3>
                                            </div>
                                            <form onSubmit={handleRent} className={`${styles.RentalsPage__bookingForm}`}>
                                                <div className={`${styles.RentalsPage__formRow}`}>
                                                    <div className="input-group">
                                                        <label htmlFor="rental-office" className="input-label">{t('select_office')}</label>
                                                        <select id="rental-office" className="input-field" value={selectedOffice} onChange={(e) => setSelectedOffice(e.target.value)} required>
                                                            <option value="">-- {t('select_office')} --</option>
                                                            {consultorios.map(c => (
                                                                <option key={c.id} value={c.id}>{c.name} - {t(c.status) || c.status}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div className="input-group">
                                                        <label htmlFor="rental-date" className="input-label">{t('date')}</label>
                                                        <input id="rental-date" type="date" className="input-field" value={date} onChange={(e) => setDate(e.target.value)} required />
                                                    </div>
                                                </div>
                                                <div className={`${styles.RentalsPage__formRow}`}>
                                                    <div className="input-group">
                                                        <label htmlFor="rental-start-time" className="input-label">{t('start_time')}</label>
                                                        <input id="rental-start-time" type="time" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
                                                    </div>
                                                    <div className="input-group">
                                                        <label htmlFor="rental-end-time" className="input-label">{t('end_time')}</label>
                                                        <input id="rental-end-time" type="time" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
                                                    </div>
                                                </div>
                                                <div>
                                                    <Button type="submit" variant="primary">
                                                        {t('book_rental_btn') || 'Confirmar Reserva'}
                                                    </Button>
                                                </div>
                                            </form>
                                        </article>

                                        {/* Available Offices List */}
                                        <article className={`${styles.RentalsPage__card}`}>
                                            <div className={`${styles.RentalsPage__cardHeader}`}>
                                                <h3 className={`${styles.RentalsPage__cardTitle}`}>
                                                    <Icon name="meeting_room" size="1.2rem" />
                                                    {t('available_offices') || 'Espacios Disponibles'}
                                                </h3>
                                            </div>
                                            <div className={`${styles.RentalsPage__officeList}`}>
                                                {consultorios.map(c => (
                                                    <div key={c.id} className={`${styles.RentalsPage__officeItem}`}>
                                                        <div className={`${styles.RentalsPage__officeInfo}`}>
                                                            <strong className={`${styles.RentalsPage__officeName}`}>{c.name}</strong>
                                                            <Badge variant={c.status === 'available' ? 'success' : 'warning'}>
                                                                {t(c.status) || c.status}
                                                            </Badge>
                                                        </div>
                                                        <p className={`${styles.RentalsPage__officeDesc}`}>{c.description || 'Sin descripción'}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </article>
                                    </section>
                                )}

                                {/* My Rentals List */}
                                {user && user.role === 'doctor' && (
                                    <section className={`${styles.RentalsPage__main}`}>
                                        <article className={`${styles.RentalsPage__card}`}>
                                            <div className={`${styles.RentalsPage__cardHeader}`}>
                                                <h3 className={`${styles.RentalsPage__cardTitle}`}>{t('my_rentals') || 'Mis Alquileres'}</h3>
                                            </div>
                                            <div className={`${styles.RentalsPage__tableContainer}`}>
                                                {rentals.length === 0 ? (
                                                    <div className={`${styles.RentalsPage__emptyState}`}>
                                                        <p>No tienes alquileres registrados.</p>
                                                    </div>
                                                ) : (
                                                    <table className={`${styles.RentalsPage__table}`}>
                                                        <thead>
                                                            <tr>
                                                                <th className={`${styles.RentalsPage__th}`}>{t('office')}</th>
                                                                <th className={`${styles.RentalsPage__th}`}>{t('date')}</th>
                                                                <th className={`${styles.RentalsPage__th}`}>{t('time')}</th>
                                                                <th className={`${styles.RentalsPage__th} ${styles.RentalsPage__thRight}`}>{t('cost')}</th>
                                                                <th className={`${styles.RentalsPage__th}`}>{t('status') || 'Estado'}</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {rentals.map(r => (
                                                                <tr key={r.id} className={`${styles.RentalsPage__tr}`}>
                                                                    <td className={`${styles.RentalsPage__td} ${styles.RentalsPage__tdBold}`}>{r.consultorio_name}</td>
                                                                    <td className={`${styles.RentalsPage__td}`}>{formatDate(r.rental_date)}</td>
                                                                    <td className={`${styles.RentalsPage__td}`}>{r.start_time} - {r.end_time}</td>
                                                                    <td className={`${styles.RentalsPage__td} ${styles.RentalsPage__tdPrice}`}>{formatCurrency(r.cost)}</td>
                                                                    <td className={`${styles.RentalsPage__td}`}>
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
                                    </section>
                                )}

                                {/* Staff View (Secretary/Admin) */}
                                {user && (user.role === 'secretary' || user.role === 'admin') && (
                                    <section className={`${styles.RentalsPage__main}`}>
                                        <article className={`${styles.RentalsPage__card}`}>
                                            <div className={`${styles.RentalsPage__staffPlaceholder}`}>
                                                <Icon name="payments" size="3rem" />
                                                <h3>Panel de Gestión de Alquileres</h3>
                                                <p>Próximamente podrá ver el resumen de alquileres de todos los médicos.</p>
                                            </div>
                                        </article>
                                    </section>
                                )}
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </MainLayout>
    );
};
