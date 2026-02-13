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
                    {/* Block 1: Personal Info & Dates */}
                    <section className="details-block details-block--info">
                        <header className="details-block__header">
                            <h3 className="details-block__title">
                                <Icon name="PROFILE" size="1.2rem" />
                                {t('patient_info')}
                            </h3>
                        </header>

                        <div className="details-block__content">
                            <table className="patient-details__info-table">
                                <tbody>
                                    <tr className="patient-details__info-row">
                                        <th className="patient-details__info-label">{t('dni')}</th>
                                        <td className="patient-details__info-value">{details.dni || 'N/A'}</td>
                                    </tr>
                                    <tr className="patient-details__info-row">
                                        <th className="patient-details__info-label">{t('insurance_short')}</th>
                                        <td className="patient-details__info-value">
                                            {details.insurance_name || t('particular')}
                                            {details.affiliate_number && <span className="patient-details__info-hint">({details.affiliate_number})</span>}
                                        </td>
                                    </tr>
                                    <tr className="patient-details__info-row">
                                        <th className="patient-details__info-label">{t('dob') || 'Fecha Nac.'}</th>
                                        <td className="patient-details__info-value">
                                            {formatDate(details.dob)}
                                            {details.dob && <span className="patient-details__info-hint">({Math.floor((new Date() - new Date(details.dob)) / 31557600000)} {t('years')})</span>}
                                        </td>
                                    </tr>
                                    <tr className="patient-details__info-row">
                                        <th className="patient-details__info-label">{t('address') || 'Dirección'}</th>
                                        <td className="patient-details__info-value">
                                            <div className="patient-details__address-box">
                                                {[
                                                    details.street_name && `${details.street_name} ${details.street_number || ''}`,
                                                    details.floor && `Piso ${details.floor}`,
                                                    details.apartment && `Depto ${details.apartment}`,
                                                    details.city,
                                                    details.province,
                                                    details.address && `(${details.address})`
                                                ].filter(Boolean).join(', ') || <span className="patient-details__text-empty">{t('no_address_loaded')}</span>}
                                            </div>
                                            {(details.street_name || details.address) && (
                                                <a
                                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                        `${details.street_name || ''} ${details.street_number || ''}, ${details.city || ''}, ${details.province || ''}, ${details.country || ''} ${details.address || ''}`.trim()
                                                    )}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="patient-details__map-link"
                                                >
                                                    {t('view_on_map')} ↗
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                    <tr className="patient-details__info-row">
                                        <th className="patient-details__info-label">{t('contact')}</th>
                                        <td className="patient-details__info-value">
                                            <div className="patient-details__contact-list">
                                                {details.phoneNumbers && details.phoneNumbers.length > 0 ? (
                                                    details.phoneNumbers.map((p, idx) => (
                                                        <div key={idx} className="patient-details__contact-item">
                                                            <span className={`patient-details__contact-indicator ${p.is_primary ? 'patient-details__contact-indicator--primary' : ''}`}></span>
                                                            <a
                                                                href={`tel:${p.phone_number.replace(/[^0-9+]/g, '')}`}
                                                                className="patient-details__contact-link"
                                                            >
                                                                {p.phone_number}
                                                            </a>
                                                            {p.label && <span className="patient-details__info-hint">({p.label})</span>}
                                                        </div>
                                                    ))
                                                ) : (
                                                    details.phone ? (
                                                        <a
                                                            href={`tel:${details.phone.replace(/[^0-9+]/g, '')}`}
                                                            className="patient-details__contact-link"
                                                        >
                                                            {details.phone}
                                                        </a>
                                                    ) : <span>N/A</span>
                                                )}
                                                {details.email && (
                                                    <div className="patient-details__contact-item patient-details__contact-item--email">
                                                        <a
                                                            href={`mailto:${details.email}`}
                                                            className="patient-details__contact-link patient-details__contact-link--email"
                                                        >
                                                            {details.email}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                    <tr className="patient-details__info-row">
                                        <th className="patient-details__info-label">{t('assigned_doctors')}</th>
                                        <td className="patient-details__info-value">
                                            {details.assignedDoctors && details.assignedDoctors.length > 0
                                                ? details.assignedDoctors.map(d => d.full_name).join(', ')
                                                : <span className="patient-details__text-empty">{t('none')}</span>}
                                        </td>
                                    </tr>
                                    {(details.license_expiry_date || details.next_suggested_visit_date || details.next_suggested_prescription_date) && (
                                        <tr className="patient-details__info-row">
                                            <th className="patient-details__info-label">{t('important_dates') || 'Plazos y Seguimiento'}</th>
                                            <td className="patient-details__info-value">
                                                <div className="patient-details__date-indicators">
                                                    {details.license_expiry_date && (
                                                        <div className="date-indicator date-indicator--rose">
                                                            <span className="date-indicator__label">{t('license_expiry_date')}</span>
                                                            <p className="date-indicator__value">{formatDate(details.license_expiry_date)}</p>
                                                        </div>
                                                    )}
                                                    {details.next_suggested_visit_date && (
                                                        <div className="date-indicator date-indicator--amber">
                                                            <div className="config-flex config-flex--between">
                                                                <div>
                                                                    <span className="date-indicator__label">{t('next_visit_suggested')}</span>
                                                                    <p className="date-indicator__value">{formatDate(details.next_suggested_visit_date)}</p>
                                                                </div>
                                                                <Button
                                                                    size="xs"
                                                                    variant="ghost"
                                                                    className="date-indicator__action"
                                                                    icon={<Icon name="CHAT" size="0.8rem" />}
                                                                    onClick={() => {
                                                                        const phone = details.phoneNumbers?.find(p => p.is_primary)?.phone_number || details.phone;
                                                                        if (!phone) return alert(t('no_phone_available'));
                                                                        const msg = `Hola ${details.full_name}, te escribimos de Cima Salud para recordarte que ya es tiempo de tu próximo control sugerido (${formatDate(details.next_suggested_visit_date)}). ¿Te gustaría agendar un turno?`;
                                                                        window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                                                    }}
                                                                >
                                                                    {t('remind')}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                    {details.next_suggested_prescription_date && (
                                                        <div className="date-indicator date-indicator--indigo">
                                                            <div className="config-flex config-flex--between">
                                                                <div>
                                                                    <span className="date-indicator__label">{t('next_prescription_suggested')}</span>
                                                                    <p className="date-indicator__value">{formatDate(details.next_suggested_prescription_date)}</p>
                                                                </div>
                                                                <Button
                                                                    size="xs"
                                                                    variant="ghost"
                                                                    className="date-indicator__action"
                                                                    icon={<Icon name="PRESCRIPTION" size="0.8rem" />}
                                                                    onClick={() => onGeneratePrescriptionLink(details.id)}
                                                                >
                                                                    {t('send_link')}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Block 2: Historical Appointments */}
                    <section className="details-block details-block--history">
                        <header className="details-block__header">
                            <h3 className="details-block__title">
                                <Icon name="CALENDAR" size="1.2rem" />
                                {t('appointment_history')}
                            </h3>
                        </header>
                        <div className="details-block__content">
                            {details.appointments && details.appointments.length > 0 ? (
                                <div className="patient-details__history-container">
                                    <table className="patient-details__history-table">
                                        <thead className="patient-details__history-header">
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
                                                <tr key={app.id} className="patient-details__history-row">
                                                    <td className="patient-details__history-cell">
                                                        <div className="patient-details__table-cell-date-box">
                                                            <div className="patient-details__table-cell-date-main">{formatDate(app.appointment_date)}</div>
                                                            <div className="patient-details__table-cell-date-sub">
                                                                {formatTime(app.appointment_date)}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="patient-details__history-cell">{app.doctor_name}</td>
                                                    <td className="patient-details__history-cell">
                                                        <span className={`tag tag-${app.status}`}>
                                                            {t(app.status) || app.status}
                                                        </span>
                                                    </td>
                                                    <td className="patient-details__history-cell text-success patient-details__table-cell-bold">
                                                        {Number(app.paid_amount) > 0 ? `$${app.paid_amount}` : '-'}
                                                    </td>
                                                    <td className="patient-details__history-cell">
                                                        <div className={`patient-details__table-cell-bold ${Number(app.pending_amount) > 0 ? 'text-danger' : 'text-muted'}`}>
                                                            {Number(app.pending_amount) > 0 ? `$${app.pending_amount}` : '$0'}
                                                            {Number(app.pending_amount) > 0 && (
                                                                <div className="patient-details__pay-action">
                                                                    <Button
                                                                        size="sm-compact"
                                                                        variant="ghost"
                                                                        className="patient-details__pay-btn-mini"
                                                                        onClick={() => onPayDebt(null, details.id, app.pending_amount)}
                                                                        icon={<Icon name="FINANCES" size="0.8rem" />}
                                                                    >
                                                                        {t('pay')}
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="patient-details__history-cell">
                                                        <div className="patient-details__table-cell-reason">
                                                            {app.reason}
                                                            {app.cancellation_reason && (
                                                                <div className="patient-details__cancel-reason">
                                                                    <Icon name="REJECT" size="0.8rem" className="mr-1" />
                                                                    {app.cancellation_reason}
                                                                </div>
                                                            )}
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
                    {/* Sidebar Block 1: Financial Status */}
                    <div className="patient-details__financial-card">
                        <header className="patient-details__financial-header">
                            <h4 className="details-block__title" style={{ color: 'rgba(255,255,255,0.6)', justifyContent: 'center' }}>
                                {t('financial_history_debt')}
                            </h4>
                        </header>
                        <div className="patient-details__financial-content" style={{ padding: '2rem' }}>
                            <span className={`patient-details__financial-amount ${Number(details.total_debt) > 0 ? 'patient-details__financial-amount--debt' : 'patient-details__financial-amount--clear'}`}>
                                ${Number(details.total_debt).toFixed(2)}
                            </span>
                            {Number(details.total_debt) > 0 && (
                                <div className="config-flex config-flex--column config-flex--gap-1">
                                    <Button
                                        variant="primary"
                                        className="patient-details__pay-debt-btn"
                                        onClick={(e) => onPayDebt(e, details.id, details.total_debt)}
                                        icon={<Icon name="FINANCES" size="1rem" />}
                                    >
                                        {t('pay_debt')}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="patient-details__remind-debt-btn"
                                        style={{ color: 'var(--red-300)', opacity: 0.8 }}
                                        icon={<Icon name="CHAT" size="1rem" />}
                                        onClick={() => {
                                            const phone = details.phoneNumbers?.find(p => p.is_primary)?.phone_number || details.phone;
                                            if (!phone) return alert(t('no_phone_available'));
                                            const msg = `Hola ${details.full_name}, te escribimos de Cima Salud para informarte que figura un saldo pendiente de $${details.total_debt} en tu cuenta. ¿Podrías confirmarnos cuándo podrías regularizarlo? ¡Gracias!`;
                                            window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                                        }}
                                    >
                                        {t('remind_debt') || 'Recordar Deuda'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar Block 2: Quick Tools */}
                    <div className="details-block details-block--sidebar details-block--tools">
                        <header className="details-block__header">
                            <h3 className="details-block__title">
                                <Icon name="CONFIG" size="1rem" />
                                {t('tools')}
                            </h3>
                        </header>
                        <div className="details-block__content patient-details__tools-list">
                            <Button
                                variant="secondary"
                                className="patient-details__tool-btn"
                                onClick={() => onGenerateQR(details.id)}
                                icon={<Icon name="CHAT" size="1.1rem" />}
                            >
                                {t('generate_qr_access')}
                            </Button>
                            <Button
                                variant="secondary"
                                className="patient-details__tool-btn"
                                onClick={() => onGeneratePrescriptionLink(details.id)}
                                icon={<Icon name="PRESCRIPTION" size="1.1rem" />}
                            >
                                {t('request_prescription_link')}
                            </Button>
                            {(user.role === 'admin' || user.role === 'secretary') && (
                                <Button
                                    variant="ghost"
                                    className="patient-details__delete-btn"
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
