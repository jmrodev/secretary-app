import React from 'react';
import Button from '../atoms/Button';

const PatientDetailsView = ({
    details,
    t,
    user,
    onBack,
    onEdit,
    onDelete,
    onGenerateQR,
    onToggleNew,
    onPayDebt,
    children // children can be med list etc
}) => {
    return (
        <div className="max-w-4xl mx-auto animate-fade-in-up">
            <Button variant="secondary" onClick={onBack} className="mb-4 flex items-center gap-2">
                &larr; {t('back_to_list')}
            </Button>

            <h1 className="title capitalize text-3xl mb-6">{details.full_name}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Info Card */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="card border-l-4 border-blue-500">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-lg font-bold text-main-800">{t('patient_info')}</h3>
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
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mt-2">
                            <div>
                                <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">{t('dni')}</p>
                                <p className="font-medium text-main-900 text-base">{details.dni || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">OS</p>
                                <p className="font-medium text-main-900 text-base">{details.insurance_name || 'N/A'}</p>
                            </div>
                            <div className="col-span-2">
                                <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">{t('contact')}</p>
                                <div className="flex flex-col gap-1">
                                    {details.phoneNumbers && details.phoneNumbers.length > 0 ? (
                                        details.phoneNumbers.map((p, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${p.is_primary ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                                                <span className="font-mono text-main-800">{p.phone_number}</span>
                                                {p.label && <span className="text-xs text-slate-400">({p.label})</span>}
                                            </div>
                                        ))
                                    ) : (
                                        <span>{details.phone || 'N/A'}</span>
                                    )}
                                    {details.email && <div className="text-blue-600">{details.email}</div>}
                                </div>
                            </div>
                            <div className="col-span-2 border-t border-slate-100 pt-3 mt-1">
                                <p className="text-slate-500 text-xs uppercase tracking-wider font-bold mb-1">{t('assigned_doctors')}</p>
                                <p className="text-main-700">
                                    {details.assignedDoctors && details.assignedDoctors.length > 0
                                        ? details.assignedDoctors.map(d => d.full_name).join(', ')
                                        : <span className="italic text-slate-400">{t('none')}</span>}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Appointment History */}
                    <div className="card">
                        <h3 className="mb-4 text-lg font-bold text-main-800">{t('appointment_history') || 'Historial de Turnos'}</h3>
                        {details.appointments && details.appointments.length > 0 ? (
                            <div className="overflow-x-auto max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                <table className="w-full text-sm text-left">
                                    <thead className="sticky top-0 bg-white shadow-sm z-10">
                                        <tr className="border-b text-slate-400 font-bold text-xs uppercase tracking-wider">
                                            <th className="py-2 pl-2">Fecha</th>
                                            <th>Doctor</th>
                                            <th>Estado</th>
                                            <th>Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {details.appointments.map(app => (
                                            <tr key={app.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                                                <td className="py-3 pl-2 font-medium text-main-700 whitespace-nowrap">
                                                    {new Date(app.appointment_date).toLocaleDateString()}
                                                    <span className="text-xs text-slate-400 block">
                                                        {new Date(app.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap">{app.doctor_name}</td>
                                                <td>
                                                    <span className={`status-chip status-${app.status} text-[10px]`}>
                                                        {t(app.status) || app.status}
                                                    </span>
                                                </td>
                                                <td className="text-xs text-slate-500 italic truncate max-w-[200px]">
                                                    {app.reason}
                                                    {app.cancellation_reason && <div className="text-red-500 font-bold mt-1">🚫 {app.cancellation_reason}</div>}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-slate-400 italic text-sm p-8 bg-slate-50 rounded border border-dashed text-center">
                                {t('no_history') || 'No hay turnos registrados.'}
                            </p>
                        )}
                    </div>

                    {/* Injected Content (Medications usually) */}
                    {children}

                </div>

                {/* Right Column Actions & Debt */}
                <div className="flex flex-col gap-6">
                    {/* Financial Status */}
                    <div className="card bg-slate-50 border-slate-200">
                        <h3 className="text-base font-bold text-slate-700 mb-3">{t('financial_history_debt')}</h3>
                        <div className="flex flex-col gap-4 items-center p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
                            <div className="text-xs text-slate-500 uppercase tracking-widest font-bold">Deuda Total</div>
                            <div className={`text-4xl font-black ${Number(details.total_debt) > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                ${Number(details.total_debt).toFixed(2)}
                            </div>
                            {Number(details.total_debt) > 0 && (
                                <Button
                                    className="w-full shadow-md bg-red-600 hover:bg-red-700 text-white border-none animate-pulse-slow"
                                    onClick={(e) => onPayDebt(e, details.id, details.total_debt)}
                                >
                                    💸 {t('pay_debt')}
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Quick Tools */}
                    <div className="card">
                        <h3 className="text-base font-bold text-slate-700 mb-3">Herramientas</h3>
                        <div className="flex flex-col gap-2">
                            <Button variant="secondary" className="justify-start" onClick={() => onGenerateQR(details.id)}>
                                📱 Generar QR Acceso
                            </Button>
                            {(user.role === 'admin' || user.role === 'secretary') && (
                                <Button
                                    variant="outline-danger"
                                    className="justify-start mt-4"
                                    onClick={() => onDelete(details)}
                                >
                                    🗑️ Eliminar Paciente
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PatientDetailsView;
