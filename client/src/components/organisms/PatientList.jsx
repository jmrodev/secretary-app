
import React from 'react';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';

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
        <div className="table-responsive card p-0 overflow-hidden shadow-sm">
            <table className="table-base w-full">
                <thead>
                    <tr>
                        <th className="pl-6">{t('patient')}</th>
                        <th>{t('identification')} / OS</th>
                        <th>{t('contact')}</th>
                        <th>{t('ratings')}</th>
                        <th>{t('debt')}</th>
                        <th className="text-right pr-6">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {patients.map(p => (
                        <tr
                            key={p.id}
                            onClick={() => onViewDetails(p.id)}
                            className="hover:bg-slate-50 transition-colors cursor-pointer group"
                        >
                            <td className="pl-6 py-4">
                                <div className="flex items-center gap-2">
                                    <strong className="text-main-800 capitalize leading-tight text-base group-hover:text-blue-700 transition-colors">
                                        {p.full_name}
                                    </strong>
                                    {p.is_new_patient === 1 && <Badge variant="purple" size="sm">✨ NEW</Badge>}
                                </div>
                            </td>
                            <td>
                                <div className="flex flex-col text-xs gap-1 text-slate-600">
                                    {p.dni && <span><span className="font-semibold text-slate-400 w-8 inline-block">DNI:</span> {p.dni}</span>}
                                    {(p.insurance_name || p.insurance) && <span><span className="font-semibold text-slate-400 w-8 inline-block">OS:</span> {p.insurance_name || p.insurance}</span>}
                                </div>
                            </td>
                            <td>
                                {p.phone ? (
                                    <a
                                        href={`https://wa.me/${p.phone.replace(/[^0-9]/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-blue-600 font-bold hover:underline py-1 px-2 rounded hover:bg-blue-50 inline-block"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        📱 {p.phone}
                                    </a>
                                ) : <span className="text-muted text-sm px-2">N/A</span>}
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
                                        className="rating-item cursor-pointer hover:bg-slate-100 p-1 rounded transition-colors"
                                        onClick={(e) => { e.stopPropagation(); onToggleRating(p.id, ((p.behavior_rating || 5) % 5) + 1); }}
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
                                        className="bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 font-bold"
                                    >
                                        💸 ${p.total_debt}
                                    </Button>
                                ) : (
                                    <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-1 rounded border border-green-100">$0.00</span>
                                )}
                            </td>
                            <td className="text-right pr-6">
                                <Button
                                    variant="ghost"
                                    size="sm-compact"
                                    className="text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100"
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
