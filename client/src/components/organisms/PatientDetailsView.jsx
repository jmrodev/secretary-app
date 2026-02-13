import React from 'react';
import Button from '../atoms/Button';
import { formatDate, formatTime } from '../../utils/dateUtils';
import Icon from '../atoms/Icon';
import './PatientDetailsView.css';

const PatientDetailsView = ({
    details,
    t,
    user,
    onBack,
    onEdit,
    onDelete,
    onGenerateQR,
    onGeneratePrescriptionLink,
    onToggleNew,
    onPayDebt,
    children
}) => {
    return (
        <div className="patient-details animate-fadeIn">
            <header className="patient-details__header">
                <Button variant="secondary" onClick={onBack}>
                    &larr; {t('back_to_list')}
                </Button>
                <div className="config-flex config-flex--gap-2">
                    {user.role === 'secretary' && (
                        <Button
                            size="sm"
                            variant={details.is_new_patient ? 'primary' : 'secondary'}
                            onClick={() => onToggleNew(details.id)}
                            icon={details.is_new_patient ? <Icon name="NEW" size="1rem" /> : <Icon name="PROFILE" size="1rem" />}
                        >
                            {details.is_new_patient ? t('new_patient') : t('existing_patient')}
                        </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={onEdit} icon={<Icon name="EDIT" size="1rem" />}>{t('edit_info')}</Button>
                </div>
            </header>

            <h1 className="patient-details__title">{details.full_name}</h1>

            <div className="patient-details__grid">
                {/* Main Content Area */}
                <div className="patient-details__main">

                    {/* Information Card */}
                    <article className="card info-card">
                        <header className="card-header card-header--clean">
                            <h3 className="card-header__title">{t('patient_info')}</h3>
                        </header>

                        <div className="card-body info-grid">
                            <div className="info-item">
                                <label className="info-item__label">{t('dni')}</label>
                                <p className="info-item__value">{details.dni || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label className="info-item__label">{t('insurance_short')}</label>
                                <p className="info-item__value">
                                    {details.insurance_name || t('particular')}
                                    {details.affiliate_number && <span className="info-item__hint">({details.affiliate_number})</span>}
                                </p>
                            </div>
                            <div className="info-item">
                                <label className="info-item__label">{t('dob') || 'Fecha Nac.'}</label>
                                <p className="info-item__value">
                                    {formatDate(details.dob)}
                                    {details.dob && <span className="info-item__hint">({Math.floor((new Date() - new Date(details.dob)) / 31557600000)} {t('years')})</span>}
                                </p>
                            </div>
                            <div className="info-item info-grid__full info-item--divider">
                                <label className="info-item__label">{t('address') || 'Dirección'}</label>
                                <p className="info-item__value text-address">
                                    {[
                                        details.street_name && `${details.street_name} ${details.street_number || ''}`,
                                        details.floor && `Piso ${details.floor}`,
                                        details.apartment && `Depto ${details.apartment}`,
                                        details.city,
                                        details.province,
                                        details.address && `(${details.address})`
                                    ].filter(Boolean).join(', ') || <span className="text-empty">{t('no_address_loaded')}</span>}
                                </p>
                                {(details.street_name || details.address) && (
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            `${details.street_name || ''} ${details.street_number || ''}, ${details.city || ''}, ${details.province || ''}, ${details.country || ''} ${details.address || ''}`.trim()
                                        )}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                                    >
                                        {t('view_on_map')} ↗
                                    </a>
                                )}
                            </div>
                            <div className="info-item info-grid__full">
                                <label className="info-item__label">{t('contact')}</label>
                                <div className="contact-list">
                                    {details.phoneNumbers && details.phoneNumbers.length > 0 ? (
                                        details.phoneNumbers.map((p, idx) => (
                                            <div key={idx} className="contact-item">
                                                <span className={`contact-item__indicator ${p.is_primary ? 'contact-item__indicator--primary' : ''}`}></span>
                                                <a
                                                    href={`tel:${p.phone_number.replace(/[^0-9+]/g, '')}`}
                                                    className="contact-item__link"
                                                >
                                                    {p.phone_number}
                                                </a>
                                                {p.label && <span className="info-item__hint">({p.label})</span>}
                                            </div>
                                        ))
                                    ) : (
                                        details.phone ? (
                                            <a
                                                href={`tel:${details.phone.replace(/[^0-9+]/g, '')}`}
                                                className="contact-item__link"
                                            >
                                                {details.phone}
                                            </a>
                                        ) : <span>N/A</span>
                                    )}
                                    {details.email && (
                                        <div className="contact-item contact-item--email">
                                            <a
                                                href={`mailto:${details.email}`}
                                                className="contact-item__link contact-item__link--email"
                                            >
                                                {details.email}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="info-item info-grid__full info-item--divider">
                                <label className="info-item__label">{t('assigned_doctors')}</label>
                                <p className="info-item__value text-doctor-list">
                                    {details.assignedDoctors && details.assignedDoctors.length > 0
                                        ? details.assignedDoctors.map(d => d.full_name).join(', ')
                                        : <span className="text-empty">{t('none')}</span>}
                                </p>
                            </div>
                        </div>
                    </article>

                    {/* Important Dates Section */}
                    {(details.license_expiry_date || details.next_suggested_visit_date || details.next_suggested_prescription_date) && (
                        <div className="config-grid config-grid--3col">
                            {details.license_expiry_date && (
                                <div className="date-indicator date-indicator--rose">
                                    <span className="date-indicator__label">{t('license_expiry_date')}</span>
                                    <p className="date-indicator__value">{formatDate(details.license_expiry_date)}</p>
                                </div>
                            )}
                            {details.next_suggested_visit_date && (
                                <div className="date-indicator date-indicator--amber">
                                    <span className="date-indicator__label">{t('next_visit_suggested')}</span>
                                    <p className="date-indicator__value">{formatDate(details.next_suggested_visit_date)}</p>
                                </div>
                            )}
                            {details.next_suggested_prescription_date && (
                                <div className="date-indicator date-indicator--indigo">
                                    <span className="date-indicator__label">{t('next_prescription_suggested')}</span>
                                    <p className="date-indicator__value">{formatDate(details.next_suggested_prescription_date)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Appointments Table */}
                    <section className="card">
                        <header className="card-header">
                            <h3 className="card-header__title">{t('appointment_history')}</h3>
                        </header>
                        <div className="card-body card-body--nopadding">
                            {details.appointments && details.appointments.length > 0 ? (
                                <div className="table-container table-scroll-container">
                                    <table className="table">
                                        <thead className="table__header-sticky">
                                            <tr>
                                                <th>{t('appointment_date')}</th>
                                                <th>{t('appointment_doctor')}</th>
                                                <th>{t('appointment_status')}</th>
                                                <th>{t('appointment_payment')}</th>
                                                <th>{t('appointment_balance')}</th>
                                                <th>{t('appointment_reason')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {details.appointments.map(app => (
                                                <tr key={app.id}>
                                                    <td className="table__cell-date">
                                                        <div className="table__cell-date-text">{formatDate(app.appointment_date)}</div>
                                                        <div className="config-field__hint table__date-hint">
                                                            {formatTime(app.appointment_date)}
                                                        </div>
                                                    </td>
                                                    <td className="table__cell-nowrap">{app.doctor_name}</td>
                                                    <td>
                                                        <span className={`tag tag-${app.status}`}>
                                                            {t(app.status) || app.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-success table__cell-bold">
                                                        {Number(app.paid_amount) > 0 ? `$${app.paid_amount}` : '-'}
                                                    </td>
                                                    <td className={`table__cell-bold ${Number(app.pending_amount) > 0 ? 'text-danger' : 'text-muted'}`}>
                                                        {Number(app.pending_amount) > 0 ? `$${app.pending_amount}` : '$0'}
                                                        {Number(app.pending_amount) > 0 && (
                                                            <div style={{ marginTop: '0.25rem' }}>
                                                                <Button
                                                                    size="sm-compact"
                                                                    variant="ghost"
                                                                    className="text-primary"
                                                                    style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', height: 'auto', border: '1px solid var(--blue-200)' }}
                                                                    onClick={() => onPayDebt(null, details.id, app.pending_amount)}
                                                                    icon={<Icon name="FINANCES" size="0.8rem" />}
                                                                >
                                                                    {t('pay')}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="table__cell-reason">
                                                        {app.reason}
                                                        <div className="table__cancel-reason">
                                                            <Icon name="REJECT" size="0.8rem" className="mr-1" />
                                                            {app.cancellation_reason}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="history-empty-state">
                                    {t('no_history')}
                                </div>
                            )}
                        </div>
                    </section>

                    {children}
                </div>

                {/* Sidebar Info Area */}
                <aside className="patient-details__sidebar">
                    {/* Financial Status Block */}
                    <div className="card financial-card">
                        <header className="card-header card-header--clean-center">
                            <h4 className="text-financial-title">
                                {t('financial_history_debt')}
                            </h4>
                        </header>
                        <div className="config-flex config-flex--column config-flex--gap-4 financial-card-content">
                            <span className={`financial-card__amount ${Number(details.total_debt) > 0 ? 'financial-card__amount--debt' : 'financial-card__amount--clear'}`}>
                                ${Number(details.total_debt).toFixed(2)}
                            </span>
                            {Number(details.total_debt) > 0 && (
                                <Button
                                    variant="primary"
                                    className="w-full btn-danger-custom"
                                    onClick={(e) => onPayDebt(e, details.id, details.total_debt)}
                                    icon={<Icon name="FINANCES" size="1rem" />}
                                >
                                    {t('pay_debt')}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Quick Tools Block */}
                    <div className="card">
                        <header className="card-header card-header--clean">
                            <h3 className="card-header__title">{t('tools')}</h3>
                        </header>
                        <div className="card-body tools-card-body tools-list">
                            <Button
                                variant="secondary"
                                className="justify-start gap-2"
                                onClick={() => onGenerateQR(details.id)}
                                icon={<Icon name="CHAT" size="1.1rem" />}
                            >
                                {t('generate_qr_access')}
                            </Button>
                            <Button
                                variant="secondary"
                                className="justify-start gap-2"
                                onClick={() => onGeneratePrescriptionLink(details.id)}
                                icon={<Icon name="PRESCRIPTION" size="1.1rem" />}
                            >
                                {t('request_prescription_link')}
                            </Button>
                            {(user.role === 'admin' || user.role === 'secretary') && (
                                <Button
                                    variant="ghost"
                                    className="btn-delete-patient"
                                    onClick={() => onDelete(details)}
                                    icon={<Icon name="DELETE" size="1rem" />}
                                >
                                    {t('delete_patient')}
                                </Button>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </div>
    );
};

export default PatientDetailsView;
