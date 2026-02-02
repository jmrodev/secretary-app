import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './AppointmentCard.css';

const AppointmentCard = ({ appt, onClick, showActions = false, onWhatsAppAction }) => {
    const { t } = useLanguage();

    const isExternal = appt.source === 'google' || appt.source === 'google-incomplete' || appt.status === 'external';
    const isAnonymous = !appt.patient_id;

    return (
        <div
            className={`appointment-card group status-${appt.status} ${isExternal ? 'status-external' : ''} ${isAnonymous ? 'status-anonymous' : ''}`}
            onClick={onClick}
            style={isExternal ? { borderLeft: '4px solid var(--amber-500)' } : {}}
        >
            {/* Col 1: Time */}
            <div className="appt-time-box">
                <span className="text-sm font-bold text-main-900">
                    {new Date(appt.appointment_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
            </div>

            {/* Col 2: Info */}
            <div className="appt-info">
                <div className="font-bold text-main-800 truncate">
                    {appt.type === 'virtual' && '📹 '}
                    {appt.patient_name || 'S/N'}
                </div>
                {appt.patient_phone && (
                    <div className="text-[10px] text-indigo-600 font-medium">
                        📱 {appt.patient_phone}
                    </div>
                )}
                <div className="flex items-center gap-2 text-[11px] text-muted truncate">
                    <span className="flex items-center gap-1">👨‍⚕️ {appt.doctor_name}</span>
                    {appt.reason && <span className="italic opacity-75 truncate">• {appt.reason}</span>}
                </div>
            </div>

            {/* Col 3: Status & Payment */}
            <div className="appt-status">
                {(() => {
                    const isAttended = ['arrived', 'attended', 'completed'].includes(appt.status);
                    // Transaction-based amounts
                    const paid = Number(appt.paid_amount || 0);
                    const pending = Number(appt.pending_amount || 0);
                    const txTotal = paid + pending;

                    // Fallback to appointment cost if no transactions
                    const cost = Number(appt.cost || 0);

                    const hasTransactions = txTotal > 0;
                    const effectiveTotal = hasTransactions ? txTotal : cost;

                    if (effectiveTotal === 0 && !isAttended) return null;

                    let colorClass = 'text-slate-400';
                    let amountToDisplay = effectiveTotal;
                    let icon = '';

                    if (!isAttended) {
                        colorClass = 'appt-status__amount--pending';
                        amountToDisplay = hasTransactions ? txTotal : cost;
                        icon = '';
                    } else {
                        // Attended
                        if (paid >= effectiveTotal && effectiveTotal > 0) {
                            // Fully paid
                            colorClass = 'appt-status__amount--paid';
                            amountToDisplay = paid;
                            icon = ' ✓';
                        } else if (pending > 0) {
                            // Has recorded debt
                            colorClass = 'appt-status__amount--debt';
                            amountToDisplay = pending;
                            icon = ' ✘';
                        } else if (!hasTransactions && cost > 0) {
                            // No transactions but has cost -> Implicit Debt
                            colorClass = 'appt-status__amount--debt';
                            amountToDisplay = cost;
                            icon = ' ✘';
                        }
                    }

                    if (amountToDisplay === 0) return null;

                    return (
                        <div className="appt-status__col">
                            <div className={`appt-status__text ${colorClass}`}>
                                <span>${amountToDisplay.toLocaleString()}</span>
                                {icon && <span style={{ fontSize: '12px' }}>{icon}</span>}
                            </div>
                            {appt.payment_methods && paid > 0 && (
                                <span className="appt-status__icon-group">
                                    {appt.payment_methods.split(',').map(m =>
                                        m.trim() === 'cash' ? '💵' :
                                            m.trim() === 'transfer' ? '🏦' : '💳'
                                    ).join('')}
                                </span>
                            )}
                        </div>
                    );
                })()}


                <span className={`status-chip-mini status-${appt.status} inline-block mt-1`}>
                    {t(appt.status) || appt.status}
                </span>
            </div>

            {/* Col 4: Actions (Optional) */}
            {
                showActions && (
                    <div className="appt-actions">
                        <button onClick={(e) => {
                            e.stopPropagation();
                            onWhatsAppAction(appt, 'reminder');
                        }}
                            className="p-1.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-600 hover:text-white transition-all shadow-sm border border-green-100"
                            title="Enviar recordatorio"
                        >
                            📲
                        </button>
                        <button onClick={(e) => {
                            e.stopPropagation();
                            onWhatsAppAction(appt, 'confirmation');
                        }}
                            className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm border border-blue-100"
                            title="Enviar comprobante"
                        >
                            ✨
                        </button>
                    </div>
                )
            }
        </div >
    );
};

export default AppointmentCard;
