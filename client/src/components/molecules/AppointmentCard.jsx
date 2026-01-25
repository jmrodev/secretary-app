import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const AppointmentCard = ({ appt, onClick, showActions = false, onWhatsAppAction }) => {
    const { t } = useLanguage();

    const isExternal = appt.source === 'google' || appt.source === 'google-incomplete' || appt.status === 'external';

    return (
        <div
            className={`appointment-card group status-${appt.status} ${isExternal ? 'status-external' : ''}`}
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

            {/* Col 3: Status */}
            <div className="appt-status">
                {appt.payment_status === 'paid' && <span title="Paid" className="text-emerald-500 font-bold text-xs">$✓</span>}
                {appt.payment_status === 'debt' && <span title="Debt" className="text-rose-500 font-bold text-xs">$!</span>}

                <span className={`status-chip-mini status-${appt.status} inline-block`}>
                    {t(appt.status) || appt.status}
                </span>
            </div>

            {/* Col 4: Actions (Optional) */}
            {showActions && (
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
            )}
        </div>
    );
};

export default AppointmentCard;
