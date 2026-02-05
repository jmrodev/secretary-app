
import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import './PatientList.css';

const PatientList = ({
    patients,
    onViewDetails,
    onOpenDebt,
    onToggleRating,
    t,
    calculateFinancialRating,
    calculateAttendanceRating
}) => {

    const renderStars = (rating, colorClass) => {
        return (
            <div className={`rating-item__stars rating-item__stars--${colorClass}`}>
                {[1, 2, 3, 4, 5].map(s => (
                    <span key={s}>{s <= (rating || 5) ? '★' : '☆'}</span>
                ))}
            </div>
        );
    };

    if (patients.length === 0) {
        return (
            <div className="card text-center p-12 border-dashed">
                <p className="text-muted">{t('no_patients_found') || "No patients found"}</p>
            </div>
        );
    }

    return (
        <div className="patient-list-container">
            <table className="patient-table">
                <thead>
                    <tr>
                        <th>{t('patient')}</th>
                        <th>{t('identification')} / OS</th>
                        <th>{t('contact')}</th>
                        <th>{t('ratings')}</th>
                        <th>{t('debt')}</th>
                        <th className="patient-table__actions">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map(p => (
                        <tr
                            key={p.id}
                            onClick={() => onViewDetails(p.id)}
                            className="patient-table__row"
                        >
                            <td>
                                <div className="patient-table__name-cell">
                                    <strong className="patient-table__name">
                                        {p.full_name}
                                    </strong>
                                    {p.is_new_patient === 1 && <Badge variant="blue" size="sm">NEW</Badge>}
                                </div>
                            </td>
                            <td>
                                <div className="patient-table__id-info">
                                    {p.dni && <span><span className="patient-table__id-label">DNI:</span> {p.dni}</span>}
                                    {(p.insurance_name || p.insurance) && <span><span className="patient-table__id-label">OS:</span> {p.insurance_name || p.insurance}</span>}
                                </div>
                            </td>
                            <td>
                                <div className="patient-table__contact-info">
                                    {p.phone ? (
                                        <div className="patient-table__contact-row">
                                            <a
                                                href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="patient-table__whatsapp-link"
                                                onClick={(e) => e.stopPropagation()}
                                                title="WhatsApp"
                                            >
                                                📱
                                            </a>
                                            <a
                                                href={`tel:${p.phone.replace(/[^0-9+]/g, '')}`}
                                                className="patient-table__contact-link patient-table__contact-link--tel"
                                                onClick={(e) => e.stopPropagation()}
                                                title="Llamar"
                                            >
                                                {p.phone}
                                            </a>
                                        </div>
                                    ) : <div className="patient-table__no-contact">{t('no_phone_short')}</div>}

                                    {p.email && (
                                        <a
                                            href={`mailto:${p.email}`}
                                            className="patient-table__contact-link patient-table__contact-link--email"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            ✉️ {p.email}
                                        </a>
                                    )}
                                </div>
                            </td>
                            <td>
                                <div className="rating-group">
                                    <div className="rating-item" title={`${t('rating_financial_tooltip')}\nDeuda Actual: $${p.total_debt}`}>
                                        <span className="rating-item__label">FIN</span>
                                        {renderStars(calculateFinancialRating(Number(p.total_debt)), 'gold')}
                                    </div>
                                    <div className="rating-item" title={`${t('rating_attendance_tooltip')}\nResumen: ${p.total_appointments - p.missed_appointments}/${p.total_appointments}`}>
                                        <span className="rating-item__label">ASIST</span>
                                        {renderStars(calculateAttendanceRating(p.total_appointments, p.missed_appointments), 'blue')}
                                    </div>
                                    <div
                                        className="rating-item rating-item--interactive"
                                        onClick={(e) => onToggleRating(e, p.id, p.behavior_rating)}
                                        title={`${t('rating_behavior_tooltip')}\nCalificación: ${p.behavior_rating || 5}/5 (Click para cambiar)`}
                                    >
                                        <span className="rating-item__label">COND</span>
                                        {renderStars(p.behavior_rating, 'pink')}
                                    </div>
                                </div>
                            </td>
                            <td>
                                {Number(p.total_debt) > 0 ? (
                                    <Button
                                        size="sm-compact"
                                        variant="ghost"
                                        onClick={(e) => onOpenDebt(e, p.id, p.total_debt)}
                                        className="patient-table__debt-badge"
                                    >
                                        💸 ${p.total_debt}
                                    </Button>
                                ) : (
                                    <span className="patient-table__zero-debt">$0.00</span>
                                )}
                            </td>
                            <td className="patient-table__actions">
                                <Button
                                    variant="ghost"
                                    size="sm-compact"
                                    className="patient-table__view-btn"
                                >
                                    🆔 {t('view_details') || 'Ficha'}
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default React.memo(PatientList);
