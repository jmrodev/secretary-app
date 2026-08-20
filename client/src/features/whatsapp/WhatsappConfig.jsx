import React, { useState, useEffect } from 'react';
import { api } from '@/api/axios';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import styles from './WhatsappConfig.module.css';

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

export const WhatsappConfig = ({ t }) => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
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

    const copyResponse = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setMessage({ type: 'success', text: t('wa_config_copied') });
            setTimeout(() => setMessage(null), 2000);
        });
    };

    return (
        <div className="tab-panel animate-fade-in">
            {message && (
                <div className={`${styles.WhatsappConfig__message} ${styles[message.type === 'success' ? 'message--success' : 'message--error']}`}>
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
                        className={styles['WhatsappConfig__var-btn']}
                        value={selectedDoctorId}
                        onChange={e => setSelectedDoctorId(e.target.value)}
                        aria-label={t('wa_config_doctor') || 'Doctor'}
                    >
                        {doctors.map(d => (
                            <option key={d.id} value={d.id}>{d.full_name}</option>
                        ))}
                    </select>
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
                    <div className={styles.WhatsappConfig__responses}>
                        {QUICK_RESPONSES.map(qr => (
                            <div key={qr.key} className={styles['WhatsappConfig__response-card']}>
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
        </div>
    );
};