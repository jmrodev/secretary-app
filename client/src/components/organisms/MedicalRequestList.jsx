
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { timeAgo, isToday } from '../../utils/time';
import { formatPrice } from '../../utils/format';
import Button from '../atoms/Button';
import Card from '../atoms/Card';

const MedicalRequestList = ({
    requests,
    filterItem,
    handleDeleteRequest,
    openActionModal,
    setPaymentModal,
    canDelete,
    handleEditRequest
}) => {
    const { user } = useAuth();
    const { t } = useLanguage();

    const filteredRequests = requests.filter(filterItem);

    if (filteredRequests.length === 0) {
        return (
            <div className="card p-12 text-center text-muted border-dashed bg-slate-50/50">
                <span className="text-4xl block mb-2">📋</span>
                {t('no_requests')}
            </div>
        );
    }

    return (
        <Card className="p-0 overflow-hidden shadow-sm border-slate-200">
            <div className="table-responsive">
                <table className="table-base w-full">
                    <thead>
                        <tr>
                            <th className="pl-6">{t('type')}</th>
                            <th>{t('patient')}</th>
                            <th>{t('doctor')}</th>
                            <th className="w-1/4">{t('detail')}</th>
                            <th>{t('status')}</th>
                            <th>{t('payment')}</th>
                            <th className="text-right pr-6">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredRequests.map(r => {
                            const isPending = r.status === 'pending';
                            const isCompleted = r.status === 'completed';
                            const isRejected = r.status === 'rejected';

                            return (
                                <tr key={r.id} className={`hover:bg-slate-50 transition-colors ${!isPending ? 'bg-slate-50/50' : ''}`}>
                                    <td className="pl-6 py-4">
                                        <div className="flex flex-col gap-1 items-start">
                                            <span className={`tag tag-${r.type === 'prescription' ? 'blue' : 'purple'} font-bold`}>
                                                {r.type === 'prescription' ? t('prescription') : (r.type === 'license' ? t('license') : (r.type === 'certificate' ? t('certificate') : r.type))}
                                            </span>
                                            {r.is_patient_submitted && (
                                                <span className="text-[9px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-md uppercase tracking-tighter shadow-sm">
                                                    📱 Paciente
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="font-bold text-main-800">{r.patient_name}</div>
                                    </td>
                                    <td>
                                        <div className="text-sm font-medium text-main-600 truncate max-w-[120px]">
                                            Dr. {r.doctor_name || '---'}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="text-xs text-slate-500 italic line-clamp-2" title={r.request_note}>
                                            {r.request_note}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex flex-col gap-1">
                                            <span className={`tag tag-${isPending ? 'amber' : (isCompleted ? 'completed' : 'rejected')} w-fit shadow-sm`}>
                                                {t(r.status) || r.status}
                                            </span>
                                            {r.doctor_note && (
                                                <div className="text-[10px] bg-green-50 text-green-700 px-2 py-0.5 rounded border border-green-100 max-w-[150px] truncate" title={r.doctor_note}>
                                                    <b>{t('reply')}:</b> {r.doctor_note}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="payment-info flex flex-col gap-1 items-start">
                                            <div className={`payment-info__badge px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm border ${r.payment_status === 'paid'
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : r.payment_status === 'debt'
                                                    ? 'bg-red-50 text-red-700 border-red-200'
                                                    : r.payment_status === 'bonified'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-slate-50 text-slate-500 border-slate-200'
                                                }`}>
                                                <span className="payment-info__status-dot w-1.5 h-1.5 rounded-full bg-current"></span>
                                                {r.payment_status === 'paid' ? t('paid') :
                                                    (r.payment_status === 'debt' ? `${t('debt')} ${formatPrice(r.debt_amount)}` :
                                                        (r.payment_status === 'bonified' ? (t('bonified') || 'Bonificado') : t('pending')))}
                                            </div>

                                            {r.payment_method && (
                                                <div className="payment-info__method flex items-center gap-1 text-[9px] font-bold text-slate-400 px-1 uppercase tracking-tighter">
                                                    <span className="payment-info__method-icon opacity-80">
                                                        {r.payment_method === 'cash' ? '💵' : r.payment_method === 'transfer' ? '🏦' : '💳'}
                                                    </span>
                                                    <span className="payment-info__method-label">{t(r.payment_method) || r.payment_method}</span>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="pr-6 text-right">
                                        <div className="flex justify-end gap-1">
                                            {/* Charge Button */}
                                            {(r.payment_status !== 'paid' && r.payment_status !== 'bonified') && (user.role === 'secretary' || user.role === 'doctor') && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => setPaymentModal({
                                                        open: true,
                                                        initialData: {
                                                            type: 'income_patient',
                                                            amount: r.debt_amount,
                                                            description: `${t('request')}: ${t(r.type) || r.type} - ${r.patient_name}`,
                                                            patientId: r.patient_id, // Important: using patient_id (id in patients table), not user_id
                                                            patientUserId: r.patient_user_id,
                                                            patientName: r.patient_name,
                                                            doctorId: r.doctor_id,
                                                            method: r.payment_method,
                                                            serviceType: r.type === 'license' ? 'medical_license' : (r.type === 'prescription' ? 'prescription' : 'certificate')
                                                        },
                                                        reqId: r.id
                                                    })}
                                                    className="text-blue-500 hover:bg-blue-50"
                                                    title="Cobrar"
                                                    icon="💲"
                                                />
                                            )}

                                            {/* Mark As Done Button */}
                                            {(user.role === 'doctor' || user.role === 'secretary') && isPending && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => openActionModal('completed', r.id)}
                                                    className="text-green-500 hover:bg-green-50"
                                                    title={t('mark_as_done')}
                                                    icon="✅"
                                                />
                                            )}

                                            {/* Reject Button */}
                                            {(user.role === 'doctor' || user.role === 'secretary') && isPending && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => openActionModal('rejected', r.id)}
                                                    className="text-amber-500 hover:bg-amber-50"
                                                    title={t('reject')}
                                                    icon="❌"
                                                />
                                            )}

                                            {/* Edit Button - Only if enabled */}
                                            {(user.role === 'admin' || canDelete) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    onClick={() => handleEditRequest({ ...r, _origin: 'request' })}
                                                    className="text-blue-500 hover:bg-blue-50"
                                                    title={t('edit')}
                                                    icon="✏️"
                                                />
                                            )}

                                            {/* Delete Button */}
                                            {(canDelete || user.role === 'admin' || (user.role === 'doctor' && (isPending || isToday(r.completed_at || r.updated_at)))) && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm-compact"
                                                    className="text-red-400 hover:bg-red-50"
                                                    onClick={() => handleDeleteRequest(r.id, r)}
                                                    title="Eliminar"
                                                    icon="🗑️"
                                                />
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </Card>
    );
};

export default MedicalRequestList;
