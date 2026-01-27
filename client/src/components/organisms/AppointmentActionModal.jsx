import React, { useState } from 'react';
import Modal from '../molecules/Modal';
import Button from '../atoms/Button';
import Badge from '../atoms/Badge';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { copyToClipboard } from '../../utils/clipboardUtils';
import { useMessage } from '../../context/MessageContext';
import { useModal } from '../../context/ModalContext';
import { useConfig } from '../../context/ConfigContext';
import { usePermissions } from '../../hooks/usePermissions';
import api from '../../api/axios';

const AppointmentActionModal = ({
    isOpen,
    onClose,
    appt,
    doctors,
    onHistory,
    onPrescribe,
    onUpdateStatus,
    onReschedule,
    onCancel,
    onDelete,
    onSync,
    onPay,
    onWhatsApp,
    fetchAppointments
}) => {
    const { t } = useLanguage();
    const { user } = useAuth();
    const { showMessage } = useMessage();
    const { confirm } = useModal();
    const { settings } = useConfig();
    const { canDeletePrescription, canDeleteFile } = usePermissions();
    const [note, setNote] = useState(appt?.reason || '');

    if (!appt) return null;

    const isGoogle = appt.source === 'google' || appt.source === 'google-incomplete';
    const canUnrestricted = settings.enable_secretary_unrestricted_crud === 'true';

    const showMedicalPanel = user.role === 'doctor' || user.role === 'admin' || canDeletePrescription || canDeleteFile;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Appointment: ${appt.patient_name || appt.reason || 'Sincronización requerida'}`}
        >
            <div className="flex flex-col gap-4">
                {/* Header Info */}
                <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                        <p className="text-sm"><strong>{t('patient_label') || 'Paciente'}:</strong> {appt.patient_name || appt.reason || 'Sincronización requerida'}</p>
                        {appt.patient_phone && (
                            <div className="flex items-center gap-2 text-blue-600 mt-1">
                                <strong className="text-sm">{t('phone') || 'Teléfono'}:</strong>
                                <span className="font-mono text-sm">{appt.patient_phone}</span>
                                <div className="flex gap-1 ml-2">
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        className="rounded-full p-1"
                                        onClick={() => copyToClipboard(appt.patient_phone).then(() => showMessage("Teléfono copiado", "success"))}
                                        title="Copiar Número"
                                    >
                                        📋
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        className="rounded-full p-1 text-green-600 hover:bg-green-50 hover:text-green-700"
                                        onClick={() => onWhatsApp(appt, 'reminder')}
                                        title="Enviar Recordatorio WhatsApp"
                                    >
                                        📲
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm-compact"
                                        className="rounded-full p-1 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700"
                                        onClick={() => onWhatsApp(appt, 'confirmation')}
                                        title="Enviar Comprobante WhatsApp"
                                    >
                                        ✨
                                    </Button>
                                </div>
                            </div>
                        )}
                        <p className="text-sm mt-1"><strong>{t('date_label')}:</strong> {new Date(appt.appointment_date).toLocaleString()}</p>
                    </div>

                    <div className="flex gap-2">
                        <Badge variant={appt.status}>
                            {t(appt.status) || appt.status}
                        </Badge>
                        <Badge variant={appt.payment_status === 'paid' ? 'green' : 'red'}>
                            {t(appt.payment_status) || appt.payment_status}
                        </Badge>
                    </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <p className="text-sm text-slate-700"><strong>{t('reason')}:</strong> {appt.reason || t('no_description') || 'No description'}</p>
                </div>

                {/* Medical Panel - Now visible to permitted secretaries too */}
                {showMedicalPanel && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
                        <h4 className="text-xs font-bold text-main-500 mb-3 uppercase tracking-wider flex items-center gap-1">
                            👨‍⚕️ {t('medical_panel') || 'Panel Médico'}
                        </h4>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {(user.role === 'doctor' || user.role === 'admin' || canDeleteFile) && (
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="flex items-center justify-center gap-2"
                                    onClick={() => onHistory(appt)}
                                >
                                    🩺 {t('view_history') || 'Ver H. Clínica'}
                                </Button>
                            )}
                            {(user.role === 'doctor' || user.role === 'admin' || canDeletePrescription) && (
                                <Button
                                    variant="accent"
                                    size="sm"
                                    className="flex items-center justify-center gap-2"
                                    onClick={() => onPrescribe(appt)}
                                >
                                    💊 {t('prescribe') || 'Recetar'}
                                </Button>
                            )}
                            {(user.role === 'doctor' || user.role === 'admin') && (
                                <Button
                                    variant="status"
                                    size="sm"
                                    className="flex items-center justify-center gap-2 col-span-2 bg-green-600 hover:bg-green-700 text-white border-none"
                                    onClick={async () => {
                                        if (await confirm(t('confirm_attended') || 'Mark as Attended/Completed?')) {
                                            onUpdateStatus(appt.id, 'completed');
                                            onClose();
                                        }
                                    }}
                                >
                                    ✅ {t('attended') || 'Atendido'}
                                </Button>
                            )}
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="input-field text-sm py-2 flex-grow"
                                placeholder={t('evolution_note_placeholder') || "Nota de evolución / Razón..."}
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                            />
                            <Button
                                variant="secondary"
                                size="sm"
                                className="px-3"
                                onClick={async () => {
                                    try {
                                        await api.put(`/appointments/${appt.id}`, { reason: note, appointment_date: appt.appointment_date });
                                        showMessage(t('note_saved') || 'Nota actualizada', 'success');
                                        fetchAppointments();
                                    } catch (e) { console.error(e); }
                                }}
                            >
                                💾
                            </Button>
                        </div>
                    </div>
                )}

                {/* Sync Needed */}
                {isGoogle && (
                    <Button
                        variant="accent"
                        className="w-full py-3 mb-2"
                        onClick={() => onSync(appt)}
                        style={{ background: 'linear-gradient(135deg, var(--amber-500) 0%, var(--orange-600) 100%)', border: 'none', color: 'white' }}
                    >
                        ✨ Ingresar Ajuste (Sincronizar BBDD)
                    </Button>
                )}

                {/* Administrative Actions */}
                {(user.role === 'secretary' || user.role === 'admin') && (
                    <div className="flex flex-col gap-3">
                        <div className="grid grid-cols-2 gap-3">
                            {/* Pay Button */}
                            {(appt.payment_status === 'pending' || appt.payment_status === 'debt' || appt.payment_status === 'partial') && !isGoogle && (
                                <Button onClick={() => onPay(appt)}>
                                    💳 {t('pay')}
                                </Button>
                            )}

                            {!isGoogle && (appt.status !== 'completed' || canUnrestricted) && (
                                <>
                                    {appt.status !== 'arrived' && appt.type !== 'virtual' && (
                                        <Button onClick={() => { onUpdateStatus(appt.id, 'arrived'); onClose(); }}>
                                            🏥 {t('patient_arrived') || 'Asistió'}
                                        </Button>
                                    )}
                                    <Button variant="secondary" onClick={() => { onReschedule(appt); onClose(); }} tooltip="Reprogramar fecha/hora">
                                        📅 {t('reschedule')}
                                    </Button>
                                    {(['pending', 'cancelled', 'suspended', 'absent'].includes(appt.status)) && (
                                        <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => { onUpdateStatus(appt.id, 'confirmed'); onClose(); }} tooltip="Confirmar asistencia (Restaurar)">
                                            ✅ {t('confirm')}
                                        </Button>
                                    )}
                                    {(['confirmed', 'pending', 'rescheduled', 'arrived'].includes(appt.status)) && (
                                        <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={() => { onUpdateStatus(appt.id, 'completed'); onClose(); }} tooltip="Marcar como atendido">
                                            🏆 {t('attended') || 'Atendido'}
                                        </Button>
                                    )}
                                    <Button variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => { onUpdateStatus(appt.id, 'suspended'); onClose(); }} tooltip="Suspendido por la oficina. Cancela momentáneamente sin afectar reputación." >
                                        ⏸ {t('suspend')}
                                    </Button>
                                    <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { onUpdateStatus(appt.id, 'absent'); onClose(); }} tooltip="El paciente faltó sin aviso. BAJA reputación (-1).">
                                        🚫 {t('absent')}
                                    </Button>
                                </>
                            )}
                        </div>

                        {!isGoogle && (
                            <div className="mt-4 border-t border-slate-100 pt-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <Button variant="outline-danger" onClick={() => { onCancel(appt.id); onClose(); }} tooltip="Queda en historial como 'Cancelado'. No afecta reputación." >
                                        ❌ {t('cancel')}
                                    </Button>
                                    <Button style={{ background: '#ef4444', color: 'white' }} onClick={() => { onDelete(appt.id, appt.status); onClose(); }} tooltip="Borra permanentemente (Solo errores de carga). No afecta reputación." >
                                        🗑 {t('delete_error')}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </Modal>
    );
};

export default AppointmentActionModal;
