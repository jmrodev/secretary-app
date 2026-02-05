import React from 'react';
import Button from '../atoms/Button';
import { formatDate } from '../../utils/format';
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
                        >
                            {details.is_new_patient ? '✨ NUEVO' : '👤 EXISTENTE'}
                        </Button>
                    )}
                    <Button size="sm" variant="secondary" onClick={onEdit}>✏️ {t('edit_info')}</Button>
                </div>
            </header>

            <h1 className="patient-details__title">{details.full_name}</h1>

            <div className="patient-details__grid">
                {/* Main Content Area */}
                <div className="patient-details__main">

                    {/* Information Card */}
                    <article className="card info-card">
                        <header className="card-header" style={{ border: 'none', paddingBottom: 0 }}>
                            <h3 className="card-header__title">{t('patient_info')}</h3>
                        </header>

                        <div className="card-body info-grid">
                            <div className="info-item">
                                <label className="info-item__label">{t('dni')}</label>
                                <p className="info-item__value">{details.dni || 'N/A'}</p>
                            </div>
                            <div className="info-item">
                                <label className="info-item__label">OS</label>
                                <p className="info-item__value">
                                    {details.insurance_name || 'Particular'}
                                    {details.affiliate_number && <span className="info-item__hint">({details.affiliate_number})</span>}
                                </p>
                            </div>
                            <div className="info-item">
                                <label className="info-item__label">{t('dob') || 'Fecha Nac.'}</label>
                                <p className="info-item__value">
                                    {formatDate(details.dob)}
                                    {details.dob && <span className="info-item__hint">({Math.floor((new Date() - new Date(details.dob)) / 31557600000)} años)</span>}
                                </p>
                            </div>
                            <div className="info-item info-grid__full info-item--divider">
                                <label className="info-item__label">{t('address') || 'Dirección'}</label>
                                <p className="info-item__value" style={{ fontWeight: 500, color: 'var(--slate-700)' }}>
                                    {[
                                        details.street_name && `${details.street_name} ${details.street_number || ''}`,
                                        details.floor && `Piso ${details.floor}`,
                                        details.apartment && `Depto ${details.apartment}`,
                                        details.city,
                                        details.province,
                                        details.address && `(${details.address})`
                                    ].filter(Boolean).join(', ') || <span style={{ fontStyle: 'italic', color: 'var(--slate-400)' }}>{t('no_address_loaded')}</span>}
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
                                <p className="info-item__value" style={{ fontWeight: 400 }}>
                                    {details.assignedDoctors && details.assignedDoctors.length > 0
                                        ? details.assignedDoctors.map(d => d.full_name).join(', ')
                                        : <span style={{ fontStyle: 'italic', color: 'var(--slate-400)' }}>{t('none')}</span>}
                                </p>
                            </div>
                        </div>
                    </article>

                    {/* Important Dates Section */}
                    {(details.license_expiry_date || details.next_suggested_visit_date || details.next_suggested_prescription_date) && (
                        <div className="config-grid config-grid--3col">
                            {details.license_expiry_date && (
                                <div className="date-indicator date-indicator--rose">
                                    <span className="date-indicator__label">Venc. Certificado</span>
                                    <p className="date-indicator__value">{formatDate(details.license_expiry_date)}</p>
                                </div>
                            )}
                            {details.next_suggested_visit_date && (
                                <div className="date-indicator date-indicator--amber">
                                    <span className="date-indicator__label">Próximo Control</span>
                                    <p className="date-indicator__value">{formatDate(details.next_suggested_visit_date)}</p>
                                </div>
                            )}
                            {details.next_suggested_prescription_date && (
                                <div className="date-indicator date-indicator--indigo">
                                    <span className="date-indicator__label">Próxima Receta</span>
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
                        <div className="card-body" style={{ padding: 0 }}>
                            {details.appointments && details.appointments.length > 0 ? (
                                <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    <table className="table">
                                        <thead style={{ position: 'sticky', top: 0, background: 'white', zIndex: 1 }}>
                                            <tr>
                                                <th>Fecha</th>
                                                <th>Doctor</th>
                                                <th>Estado</th>
                                                <th>Pago</th>
                                                <th>Saldo</th>
                                                <th>Motivo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {details.appointments.map(app => (
                                                <tr key={app.id}>
                                                    <td style={{ whiteSpace: 'nowrap' }}>
                                                        <div style={{ fontWeight: 700 }}>{formatDate(app.appointment_date)}</div>
                                                        <div className="config-field__hint" style={{ fontSize: '0.75rem' }}>
                                                            {new Date(app.appointment_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td style={{ whiteSpace: 'nowrap' }}>{app.doctor_name}</td>
                                                    <td>
                                                        <span className={`tag tag-${app.status}`}>
                                                            {t(app.status) || app.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-success" style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                                                        {Number(app.paid_amount) > 0 ? `$${app.paid_amount}` : '-'}
                                                    </td>
                                                    <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }} className={Number(app.pending_amount) > 0 ? 'text-danger' : 'text-muted'}>
                                                        {Number(app.pending_amount) > 0 ? `$${app.pending_amount}` : '$0'}
                                                    </td>
                                                    <td style={{ fontSize: '0.75rem', fontStyle: 'italic', color: 'var(--slate-500)' }}>
                                                        {app.reason}
                                                        {app.cancellation_reason && (
                                                            <div className="text-danger" style={{ fontWeight: 700, marginTop: '0.25rem' }}>🚫 {app.cancellation_reason}</div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--slate-400)', fontStyle: 'italic' }}>
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
                        <header className="card-header" style={{ border: 'none', paddingBottom: '0.5rem', textAlign: 'center' }}>
                            <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--slate-400)', fontWeight: 700, margin: 0 }}>
                                {t('financial_history_debt')}
                            </h4>
                        </header>
                        <div className="config-flex config-flex--column config-flex--gap-4" style={{ alignItems: 'center', padding: '1rem' }}>
                            <span className={`financial-card__amount ${Number(details.total_debt) > 0 ? 'financial-card__amount--debt' : 'financial-card__amount--clear'}`}>
                                ${Number(details.total_debt).toFixed(2)}
                            </span>
                            {Number(details.total_debt) > 0 && (
                                <Button
                                    variant="primary"
                                    className="w-full"
                                    style={{ backgroundColor: 'var(--red-600)' }}
                                    onClick={(e) => onPayDebt(e, details.id, details.total_debt)}
                                >
                                    💸 {t('pay_debt')}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Quick Tools Block */}
                    <div className="card">
                        <header className="card-header" style={{ border: 'none' }}>
                            <h3 className="card-header__title" style={{ fontSize: '1rem' }}>{t('tools')}</h3>
                        </header>
                        <div className="card-body tools-list" style={{ padding: '1.25rem' }}>
                            <Button variant="secondary" style={{ justifyContent: 'flex-start', gap: '0.75rem' }} onClick={() => onGenerateQR(details.id)}>
                                📱 Generar QR Acceso
                            </Button>
                            <Button variant="secondary" style={{ justifyContent: 'flex-start', gap: '0.75rem' }} onClick={() => onGeneratePrescriptionLink(details.id)}>
                                💊 Solicitar Receta (Link)
                            </Button>
                            {(user.role === 'admin' || user.role === 'secretary') && (
                                <Button
                                    variant="ghost"
                                    className="text-danger"
                                    style={{ justifyContent: 'flex-start', gap: '0.75rem', marginTop: '1rem' }}
                                    onClick={() => onDelete(details)}
                                >
                                    🗑️ Eliminar Paciente
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
