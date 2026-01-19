import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useModal } from '../context/ModalContext';
import { timeAgo, isToday } from '../utils/time';
import { formatPrice } from '../utils/format';

const MedicalRequestList = ({
    requests,
    filterItem,
    handleDeleteRequest,
    openActionModal,
    setPaymentModal
}) => {
    const { user } = useAuth();
    const { t } = useLanguage();

    if (requests.filter(filterItem).length === 0) {
        return <p className="text-muted p-4">{t('no_requests')}</p>;
    }

    return (
        <div className="request-list-container">
            {requests.filter(filterItem).map(r => (
                <div key={r.id} className={`request-card-item p-4 border rounded-xl shadow-sm mb-4 transition-all ${r.status !== 'pending' ? 'opacity-80 bg-slate-50 border-slate-200' : 'bg-white border-blue-100 hover:shadow-md'}`}>
                    {/* Header: Type tag, Patient Name, Status tag */}
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className={`tag ${r.type === 'prescription' ? 'tag-blue' : 'tag-purple'} self-start`}>
                                {r.type === 'prescription' ? t('prescription') : (r.type === 'license' ? t('license') : (r.type === 'certificate' ? t('certificate') : r.type))}
                            </span>
                            <span className="font-bold text-slate-800 text-lg">{r.patient_name}</span>
                        </div>
                        <span className={`tag ${r.status === 'pending' ? 'tag-amber' : (r.status === 'completed' ? 'tag-green' : 'tag-red')}`}>
                            {t(r.status) || r.status}
                        </span>
                    </div>

                    {/* Doctor Info */}
                    <div className="text-sm text-slate-600 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs">👨‍⚕️</span>
                        <span className="font-medium">{r.doctor_name || 'Sin Doctor'}</span>
                    </div>

                    {/* Request Note (e.g. Medications) */}
                    <div className="bg-slate-50 p-3 rounded-lg text-sm text-slate-700 italic border border-slate-100 mb-3 shadow-inner">
                        "{r.request_note}"
                    </div>

                    {/* Doctor's Reply Note */}
                    {r.doctor_note && (
                        <div className="mb-3 text-sm text-emerald-800 bg-emerald-50 p-3 rounded-lg border border-emerald-100 shadow-sm">
                            <strong>{t('doctor_says')}:</strong> {r.doctor_note}
                        </div>
                    )}

                    {/* Footer: Payment Status & Time (Row 1) */}
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                        <div className={`tag font-mono ${r.payment_status === 'paid' ? 'tag-green' : (r.payment_status === 'debt' ? 'tag-red' : 'tag-slate')}`}>
                            {r.payment_status === 'paid' ? `PAID` :
                                (r.payment_status === 'debt' ? `DEBT ${formatPrice(r.debt_amount)}` : 'PENDING')}
                        </div>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                            🕒 {timeAgo(r.created_at)}
                        </span>
                    </div>

                    {/* Footer Actions Row - Unified */}
                    <div className="grid grid-cols-2 gap-3 mt-4">
                        {/* Charge Button */}
                        {(r.payment_status !== 'paid') && (user.role === 'secretary' || user.role === 'doctor') && (
                            <button
                                onClick={() => setPaymentModal({
                                    open: true,
                                    initialData: {
                                        type: 'income_patient',
                                        amount: '',
                                        description: `Request: ${r.type} for ${r.patient_name}`,
                                        patientId: r.patient_user_id,
                                        patientName: r.patient_name,
                                        doctorId: r.doctor_id
                                    },
                                    reqId: r.id
                                })}
                                className="col-span-1 btn btn-sm btn-primary flex justify-center items-center gap-2"
                                title="Charge"
                            >
                                <span>💲</span> Cobrar
                            </button>
                        )}

                        {/* Delete Button */}
                        {(user.role === 'admin' || user.role === 'secretary' || user.role === 'doctor') && (
                            (user.role === 'admin' || r.status === 'pending' || r.status === 'consult' || isToday(r.completed_at || r.updated_at)) ? (
                                <button
                                    className="col-span-1 btn btn-sm btn-outline-danger flex justify-center items-center gap-2"
                                    onClick={() => handleDeleteRequest(r.id, r)}
                                    title="Delete"
                                >
                                    <span>🗑️</span> Eliminar
                                </button>
                            ) : null
                        )}

                        {/* Mark As Done Button */}
                        {(user.role === 'doctor' || user.role === 'secretary') && r.status === 'pending' && (
                            <button
                                onClick={() => openActionModal('completed', r.id)}
                                className="col-span-1 btn btn-sm btn-success flex justify-center items-center gap-2"
                                style={{ background: '#dcfce7', color: '#15803d', border: '1px solid #bbf7d0' }}
                            >
                                ✅ Listo
                            </button>
                        )}

                        {/* Reject Button */}
                        {(user.role === 'doctor' || user.role === 'secretary') && r.status === 'pending' && (
                            <button
                                onClick={() => openActionModal('rejected', r.id)}
                                className="col-span-1 btn btn-sm btn-danger flex justify-center items-center gap-2"
                                style={{ background: '#fee2e2', color: '#b91c1c', border: '1px solid #fecaca' }}
                            >
                                ❌ Rechazar
                            </button>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MedicalRequestList;
