
import React from 'react';
import Button from '../atoms/Button';
import { formatDate } from '../../utils/format';

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
            <header className="page-header">
                <Button variant="secondary" onClick={onBack} className="flex items-center gap-2">
                    &larr; {t('back_to_list')}
                </Button>
                <div className="flex gap-2">
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

            <h1 className="page-header__title capitalize mb-8">{details.full_name}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 flex flex-col gap-8">

                    {/* Information Card */}
                    <article className="card border-l-4 border-blue-500">
                        <header className="card-header border-none pb-0">
                            <h3 className="card-header__title">{t('patient_info')}</h3>
                        </header>

                        <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="info-group">
                                <label className="info-group__label text-xs uppercase text-slate-400 font-bold">{t('dni')}</label>
                                <p className="info-group__value text-lg font-semibold">{details.dni || 'N/A'}</p>
                            </div>
                            <div className="info-group">
                                <label className="info-group__label text-xs uppercase text-slate-400 font-bold">OS</label>
                                <p className="info-group__value text-lg font-semibold">
                                    {details.insurance_name || 'Particular'}
                                    {details.affiliate_number && <span className="text-sm font-normal text-slate-500 ml-2">({details.affiliate_number})</span>}
                                </p>
                            </div>
                            <div className="info-group">
                                <label className="info-group__label text-xs uppercase text-slate-400 font-bold">{t('dob') || 'Fecha Nac.'}</label>
                                <p className="info-group__value text-lg font-semibold">
                                    {formatDate(details.dob)}
                                    {details.dob && <span className="text-sm font-normal text-slate-500 ml-2">({Math.floor((new Date() - new Date(details.dob)) / 31557600000)} años)</span>}
                                </p>
                            </div>
                            <div className="info-group md:col-span-2 border-t border-slate-100 pt-4">
                                <label className="info-group__label text-xs uppercase text-slate-400 font-bold">{t('address') || 'Dirección'}</label>
                                <p className="info-group__value font-medium text-slate-700">{details.address || <span className="italic text-slate-400">Sin dirección cargada</span>}</p>
                            </div>
                            <div className="info-group md:col-span-2">
                                <label className="info-group__label text-xs uppercase text-slate-400 font-bold">{t('contact')}</label>
                                <div className="info-group__list flex flex-col gap-1 mt-1">
                                    {details.phoneNumbers && details.phoneNumbers.length > 0 ? (
                                        details.phoneNumbers.map((p, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${p.is_primary ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                                <span className="font-mono">{p.phone_number}</span>
                                                {p.label && <span className="text-xs text-slate-400">({p.label})</span>}
                                            </div>
                                        ))
                                    ) : (
                                        <span>{details.phone || 'N/A'}</span>
                                    )}
                                    {details.email && <div className="text-blue-600 font-medium">{details.email}</div>}
                                </div>
                            </div>
                            <div className="info-group md:col-span-2 border-t border-slate-100 pt-4">
                                <label className="info-group__label text-xs uppercase text-slate-400 font-bold">{t('assigned_doctors')}</label>
                                <p className="info-group__value text-main-700">
                                    {details.assignedDoctors && details.assignedDoctors.length > 0
                                        ? details.assignedDoctors.map(d => d.full_name).join(', ')
                                        : <span className="italic text-slate-400">{t('none')}</span>}
                                </p>
                            </div>
                        </div>
                    </article>

                    {/* Important Dates Section (Only if they exist) */}
                    {(details.license_expiry_date || details.next_suggested_visit_date || details.next_suggested_prescription_date) && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {details.license_expiry_date && (
                                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">Venc. Certificado</span>
                                    <p className="text-sm font-bold text-rose-900">{formatDate(details.license_expiry_date)}</p>
                                </div>
                            )}
                            {details.next_suggested_visit_date && (
                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600">Próximo Control</span>
                                    <p className="text-sm font-bold text-amber-900">{formatDate(details.next_suggested_visit_date)}</p>
                                </div>
                            )}
                            {details.next_suggested_prescription_date && (
                                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">Próxima Receta</span>
                                    <p className="text-sm font-bold text-indigo-900">{formatDate(details.next_suggested_prescription_date)}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Appointments Table */}
                    <section className="card">
                        <header className="card-header">
                            <h3 className="card-header__title">{t('appointment_history')}</h3>
                        </header>
                        <div className="card-body p-0">
                            {details.appointments && details.appointments.length > 0 ? (
                                <div className="table-responsive max-h-[400px]">
                                    <table className="table-base w-full">
                                        <thead className="sticky top-0 bg-white">
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
                                                <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="whitespace-nowrap">
                                                        <div className="font-bold">{formatDate(app.appointment_date)}</div>
                                                        <div className="text-xs text-slate-400">
                                                            {new Date(app.appointment_date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap">{app.doctor_name}</td>
                                                    <td>
                                                        <span className={`tag tag-${app.status}`}>
                                                            {t(app.status) || app.status}
                                                        </span>
                                                    </td>
                                                    <td className="text-green-600 font-bold whitespace-nowrap">
                                                        {Number(app.paid_amount) > 0 ? `$${app.paid_amount}` : '-'}
                                                    </td>
                                                    <td className={`font-bold whitespace-nowrap ${Number(app.pending_amount) > 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                                        {Number(app.pending_amount) > 0 ? `$${app.pending_amount}` : '$0'}
                                                    </td>
                                                    <td className="text-xs italic text-slate-500">
                                                        {app.reason}
                                                        {app.cancellation_reason && <div className="text-red-500 font-bold mt-1">🚫 {app.cancellation_reason}</div>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-slate-400 italic">
                                    {t('no_history')}
                                </div>
                            )}
                        </div>
                    </section>

                    {children}
                </div>

                {/* Sidebar Info Area */}
                <aside className="flex flex-col gap-8">
                    {/* Financial Status Block */}
                    <div className="card bg-slate-50 border-slate-200">
                        <header className="card-header border-none pb-2 text-center">
                            <h4 className="text-xs uppercase tracking-widest text-slate-400 font-bold">{t('financial_history_debt')}</h4>
                        </header>
                        <div className="flex flex-col items-center gap-4 p-4">
                            <span className={`text-4xl font-black ${Number(details.total_debt) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                ${Number(details.total_debt).toFixed(2)}
                            </span>
                            {Number(details.total_debt) > 0 && (
                                <Button
                                    variant="primary"
                                    className="w-full bg-red-600 hover:bg-red-700"
                                    onClick={(e) => onPayDebt(e, details.id, details.total_debt)}
                                >
                                    💸 {t('pay_debt')}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Quick Tools Block */}
                    <div className="card">
                        <header className="card-header border-none">
                            <h3 className="card-header__title text-base">{t('tools')}</h3>
                        </header>
                        <div className="card-body flex flex-col gap-3">
                            <Button variant="secondary" className="justify-start gap-3" onClick={() => onGenerateQR(details.id)}>
                                📱 Generar QR Acceso
                            </Button>
                            <Button variant="secondary" className="justify-start gap-3" onClick={() => onGeneratePrescriptionLink(details.id)}>
                                💊 Solicitar Receta (Link)
                            </Button>
                            {(user.role === 'admin' || user.role === 'secretary') && (
                                <Button
                                    variant="ghost"
                                    className="justify-start gap-3 text-red-600 hover:bg-red-50 mt-4"
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
