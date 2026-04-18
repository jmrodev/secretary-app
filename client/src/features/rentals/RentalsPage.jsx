
import React from 'react';
import MainLayout from '@/components/templates/MainLayout';
import Loading from '@/components/atoms/Loading';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Badge from '@/components/atoms/Badge';
import { formatPrice } from '@/utils/format';
import { formatDate } from '@/utils/dateUtils';
<<<<<<< HEAD
import { useRentalsController } from './hooks/useRentalsController';
import './RentalsPage.css';
=======
import { useRentalsController } from '@/features/rentals/hooks/useRentalsController';
>>>>>>> main

/**
 * RentalsPage Orchestrator.
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

    const officeOptions = [
        { value: '', label: `-- ${t('select_office')} --` },
        ...consultorios.map(c => ({
            value: c.id,
            label: `${c.name} - ${t(c.status) || c.status}`
        }))
    ];

    return (
        <MainLayout wide>
            <div className="rentals-page">
                <header className="rentals-page__header animate-fadeIn">
                    <h1 className="rentals-page__title">{t('office_rentals')}</h1>
                    <p className="rentals-page__subtitle">
                        {t('rentals_subtitle') || 'Gestione la disponibilidad y reservas de espacios de trabajo.'}
                    </p>
                </header>

                <div className="rentals-page__summary animate-fadeIn">
                    <Icon name="domain" />
                    {consultorios.length} {t('offices_count')}
                </div>

                {loading ? (
                    <Loading variant="centered" text={t('loading_rentals')} />
                ) : (
                    <div className="rentals-page__grid animate-fadeIn">
                        <aside className="rentals-page__sidebar">
                            {/* Booking Form (Doctors only) */}
                            {user?.role === 'doctor' && (
                                <div className="rentals-page__card">
                                    <div className="rentals-page__card-header">
                                        <h3 className="rentals-page__card-title">
                                            <Icon name="calendar_month" />
                                            {t('book_office')}
                                        </h3>
                                    </div>
                                    <form onSubmit={handleRent} className="rentals-page__booking-form">
                                        <div className="rentals-page__group">
                                            <label className="input-label">{t('select_office')}</label>
                                            <Select
                                                value={selectedOffice}
                                                options={officeOptions}
                                                onChange={(e) => setSelectedOffice(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="rentals-page__group">
                                            <label className="input-label">{t('date')}</label>
                                            <Input
                                                type="date"
                                                value={date}
                                                onChange={(e) => setDate(e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="rentals-page__form-row">
                                            <div className="rentals-page__group">
                                                <label className="input-label">{t('start_time')}</label>
                                                <Input
                                                    type="time"
                                                    value={startTime}
                                                    onChange={(e) => setStartTime(e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="rentals-page__group">
                                                <label className="input-label">{t('end_time')}</label>
                                                <Input
                                                    type="time"
                                                    value={endTime}
                                                    onChange={(e) => setEndTime(e.target.value)}
                                                    required
                                                />
                                            </div>
                                        </div>
                                        <Button type="submit" variant="primary" className="rentals-page__submit">
                                            {t('book_rental_btn')}
                                        </Button>
                                    </form>
                                </div>
                            )}

                            {/* Available Offices List */}
                            <div className="rentals-page__card">
                                <div className="rentals-page__card-header">
                                    <h3 className="rentals-page__card-title">
                                        <Icon name="meeting_room" />
                                        {t('available_offices')}
                                    </h3>
                                </div>
                                <div className="rentals-page__office-list">
                                    {consultorios.map(c => (
                                        <div key={c.id} className="rentals-page__office-item">
                                            <div className="rentals-page__office-info">
                                                <strong className="rentals-page__office-name">{c.name}</strong>
                                                <Badge variant={c.status === 'available' ? 'success' : 'danger'}>
                                                    {t(c.status) || c.status}
                                                </Badge>
                                            </div>
                                            <p className="rentals-page__office-desc">
                                                {c.description || t('no_description')}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </aside>

                        <main className="rentals-page__main">
                             {/* My Rentals List */}
                            {user?.role === 'doctor' && (
                                <div className="rentals-page__card">
                                    <div className="rentals-page__card-header">
                                        <h3 className="rentals-page__card-title">{t('my_rentals')}</h3>
                                    </div>
                                    <div className="rentals-page__table-container">
                                        {rentals.length === 0 ? (
                                            <div className="rentals-page__empty-state">
                                                {t('no_rentals_found') || 'No tienes alquileres registrados.'}
                                            </div>
                                        ) : (
                                            <table className="rentals-page__table">
                                                <thead>
                                                    <tr>
                                                        <th className="rentals-page__th">{t('office')}</th>
                                                        <th className="rentals-page__th">{t('date')}</th>
                                                        <th className="rentals-page__th">{t('time')}</th>
                                                        <th className="rentals-page__th rentals-page__th--right">{t('cost')}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {rentals.map(r => (
                                                        <tr key={r.id} className="rentals-page__tr">
                                                            <td className="rentals-page__td rentals-page__td--bold">
                                                                {r.consultorio_name}
                                                            </td>
                                                            <td className="rentals-page__td">
                                                                {formatDate(r.rental_date)}
                                                            </td>
                                                            <td className="rentals-page__td">
                                                                {r.start_time} - {r.end_time}
                                                            </td>
                                                            <td className="rentals-page__td rentals-page__td--price">
                                                                {formatPrice(r.cost)}
                                                            </td>
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
                                <div className="rentals-page__card">
                                    <div className="rentals-page__staff-placeholder">
                                        <Icon name="payments" size="3rem" />
                                        <h3 className="rentals-page__staff-title">{t('rentals_management_panel')}</h3>
                                        <p className="rentals-page__staff-desc">
                                            {t('rentals_coming_soon') || 'Próximamente podrá ver el resumen de alquileres de todos los médicos.'}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </main>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};


export default RentalsPage;

