import React, { useState, useEffect } from 'react';
import api from '@/api/axios';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import styles from './WhatsappConfig.module.css';

const BUSINESS_RULES_BASE = `# Identidad y Propósito
Sos "Gemi", la asistente virtual del consultorio de {doctor_name}. Tu misión es ayudar a la secretaria {secretary_name} a responder dudas de forma rápida y amable.

# Datos del Doctor (Variables Automáticas)
- Especialidad: {doctor_specialty}
- Horarios de Atención: {doctor_schedule}
- Días sin atención/Feriados: {holidays}
- Ubicación: {doctor_location}
- Valor de Consulta: {doctor_price}
- Datos de Pago: {doctor_payment}

# Agenda Real (úsala SOLO para turnos)
Fecha actual: {current_datetime}
Turnos disponibles:
{free_slots}

# Reglas de Atención y Cobro
1. DEUDAS: Solo informar o reclamar pagos por turnos PASADOS o del DÍA. Los turnos futuros no generan deuda todavía.
2. RECETAS/ÓRDENES: Tienen una demora de entrega de 48hs hábiles.
3. TURNOS: Ofrecé siempre 2 o 3 opciones concretas con día y horario exacto. Usá SOLO los turnos disponibles de la agenda real.
4. Si el paciente rechaza los turnos ofrecidos o pide algo que no está disponible, decí "Consulto con la secretaría y te confirmo" — NO digas que no hay turno.
5. Si el paciente ACEPTA uno de los turnos que le ofreciste (dice "sí", "si", "dale", "el de las 9", etc.), respondé: "Perfecto, consulto con la Secretaría para agendarlo y le confirmamos a la brevedad."
6. NUNCA inventes horarios ni turnos que no estén en la lista de disponibles.

# Estilo de Comunicación
- Hablá en español rioplatense (usá "vos", "tenés", "estás") de forma educada.
- Sé breve (máximo 40 palabras por respuesta).
- Usá emojis de forma moderada para ser amable (ej: 🩺, 📅, ✅).
- En el primer contacto del día, presentate como Gemi.`;

const QUICK_RESPONSES = [
    { key: 'saludo', label: 'Saludo inicial', text: '¡Hola {patient_name}! 👋 Soy {secretary_name} de Cima Salud. ¿En qué puedo ayudarte hoy?' },
    { key: 'confirmar_turno', label: 'Confirmar turno', text: 'Te confirmamos tu turno con {doctor_name} para el {date} a las {time} hs en {appointment_location}. ¡Te esperamos! 🏥' },
    { key: 'recordatorio', label: 'Recordatorio turno', text: 'Hola {patient_name}, te recordamos tu turno con {doctor_name} el {date} a las {time} hs en {appointment_location}. ¡Te esperamos! 😊' },
    { key: 'reprogramar', label: 'Reprogramar turno', text: 'No hay problema, consulto con la secretaría y te confirmamos un nuevo horario. ¿Qué días y horarios te vienen bien? 📅' },
    { key: 'precio', label: 'Consultar precio', text: 'El valor de la consulta con {doctor_name} es de {price}. Consultorio: {appointment_location}. ¿Querés que te agende un turno? 💰' },
    { key: 'derivar', label: 'Derivar a secretaría', text: 'Consulto con la secretaría y te confirmamos a la brevedad. 🙋‍♀️' },
];

const QR_LABEL_KEYS = {
    saludo: 'wa_qr_saludo',
    confirmar_turno: 'wa_qr_confirmar',
    recordatorio: 'wa_qr_recordatorio',
    reprogramar: 'wa_qr_reprogramar',
    precio: 'wa_qr_precio',
    derivar: 'wa_qr_derivar',
};

const COMMON_VARS = [
    '{patient_name}', '{date}', '{time}', '{doctor_name}',
    '{appointment_location}', '{price}', '{secretary_name}',
    '{cbu}', '{alias}', '{bio}', '{horarios}', '{feriados}'
];

export const WhatsappConfig = ({ t }) => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [aiContext, setAiContext] = useState('');
    const [aiModel, setAiModel] = useState('llama-3.3-70b-versatile');
    const [historyLimit, setHistoryLimit] = useState(3);
    const [pendingTemplate, setPendingTemplate] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        api.get('/doctors').then(res => {
            if (res.data.success) {
                setDoctors(res.data.data);
                if (res.data.data.length > 0) {
                    setSelectedDoctorId(String(res.data.data[0].id));
                }
            }
        }).catch(err => console.error("Error fetching doctors", err));
    }, []);

    useEffect(() => {
        if (!selectedDoctorId) return;
        const doctor = doctors.find(d => String(d.id) === selectedDoctorId);
        if (doctor) {
            setAiContext(doctor.gemini_context || BUSINESS_RULES_BASE);
            setAiModel(doctor.gemini_model || 'llama-3.3-70b-versatile');
            setHistoryLimit(doctor.gemini_history_limit || 3);
            setPendingTemplate(doctor.pending_response_template || '');
        }
    }, [selectedDoctorId, doctors]);

    const handleSave = async () => {
        if (!selectedDoctorId) return;
        setSaving(true);
        setMessage(null);
        try {
            const res = await api.put(`/users/doctors/${selectedDoctorId}`, {
                gemini_context: aiContext,
                gemini_model: aiModel,
                gemini_history_limit: historyLimit,
                pending_response_template: pendingTemplate,
            });
            if (res.data.success) {
                setMessage({ type: 'success', text: t('wa_config_saved') });
            } else {
                setMessage({ type: 'error', text: t('wa_config_error') });
            }
        } catch {
            setMessage({ type: 'error', text: t('wa_config_connection_error') });
        } finally {
            setSaving(false);
        }
    };

    const insertVariable = (variable) => {
        const textarea = document.getElementById('ai-context-textarea');
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const before = aiContext.substring(0, start);
        const after = aiContext.substring(end);
        setAiContext(before + variable + after);
        setTimeout(() => {
            textarea.focus();
            textarea.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    };

    const copyResponse = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setMessage({ type: 'success', text: t('wa_config_copied') });
            setTimeout(() => setMessage(null), 2000);
        });
    };

    return (
        <div className="tab-panel animate-fade-in">
            {message && (
                <div className={`${styles.message} ${styles[message.type === 'success' ? 'message--success' : 'message--error']}`}>
                    {message.text}
                </div>
            )}

            {/* Doctor selector */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="person" size="1.2rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('wa_config_doctor')}</h4>
                </div>
                <div className="config-section__body">
                    <select
                        className={styles['var-btn']}
                        value={selectedDoctorId}
                        onChange={e => setSelectedDoctorId(e.target.value)}
                    >
                        {doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.full_name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="config-section__divider"></div>

            {/* AI Prompt */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="psychology" size="1.2rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('wa_config_prompt_label')}</h4>
                </div>
                <div className="config-section__body">
                    <p className="config-section__description" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #94a3b8)', margin: 0 }}>
                        {t('wa_config_prompt_hint')}
                    </p>
                    <div className={styles.vars}>
                        {COMMON_VARS.map(v => (
                            <button
                                key={v}
                                type="button"
                                className={styles['var-btn']}
                                onClick={() => insertVariable(v)}
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                    <textarea
                        id="ai-context-textarea"
                        className={styles.textarea}
                        value={aiContext}
                        onChange={e => setAiContext(e.target.value)}
                        rows={12}
                    />
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setAiContext(BUSINESS_RULES_BASE)}
                        className={styles['small-btn']}
                    >
                        <Icon name="sync" size="0.9rem" />
                        {t('wa_config_prompt_restore')}
                    </Button>
                </div>
            </div>

            <div className="config-section__divider"></div>

            {/* Pending-state response template */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="NOTIFICATIONS" size="1.2rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('wa_config_pending_template_label')}</h4>
                </div>
                <div className="config-section__body">
                    <p className="config-section__description" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #94a3b8)', margin: 0 }}>
                        {t('wa_config_pending_template_hint')}
                    </p>
                    <textarea
                        className={styles.textarea}
                        value={pendingTemplate}
                        onChange={e => setPendingTemplate(e.target.value)}
                        rows={4}
                        placeholder={t('wa_config_pending_template_placeholder')}
                        aria-label={t('wa_config_pending_template_label')}
                    />
                </div>
            </div>

            <div className="config-section__divider"></div>

            {/* Model config */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="tune" size="1.2rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('wa_config_model_label')}</h4>
                </div>
                <div className="config-section__body">
                    <div className={styles.row}>
                        <div className={styles.field}>
                            <label className={styles['field-label']}>{t('wa_config_model')}</label>
                            <select
                                className={styles['var-btn']}
                                value={aiModel}
                                onChange={e => setAiModel(e.target.value)}
                            >
                                <option value="llama-3.3-70b-versatile">Llama 3.3 70B (Groq)</option>
                                <option value="llama-3.1-8b-instant">Llama 3.1 8B (Groq - rápido)</option>
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                            </select>
                        </div>
                        <div className={styles.field}>
                            <label className={styles['field-label']}>{t('wa_config_history')}</label>
                            <input
                                type="number"
                                min="1"
                                max="20"
                                className={styles['var-btn']}
                                value={historyLimit}
                                onChange={e => setHistoryLimit(parseInt(e.target.value) || 3)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="config-section__divider"></div>

            {/* Quick responses */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="quickreply" size="1.2rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('wa_config_quick_label')}</h4>
                </div>
                <div className="config-section__body">
                    <p className="config-section__description" style={{ fontSize: '0.85rem', color: 'var(--color-text-muted, #94a3b8)', margin: 0 }}>
                        {t('wa_config_quick_hint')}
                    </p>
                    <div className={styles.responses}>
                        {QUICK_RESPONSES.map(qr => (
                            <div key={qr.key} className={styles['response-card']}>
                                <strong>{t(QR_LABEL_KEYS[qr.key])}</strong>
                                <p>{qr.text}</p>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => copyResponse(qr.text)}
                                >
                                    <Icon name="content_copy" size="0.9rem" />
                                    {t('wa_copy_btn')}
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="config-section__divider"></div>

            <div className="config-actions config-actions--right">
                <Button
                    variant="primary"
                    onClick={handleSave}
                    loading={saving}
                >
                    {t('wa_config_save')}
                </Button>
            </div>
        </div>
    );
};