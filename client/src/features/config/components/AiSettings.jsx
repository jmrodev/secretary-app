import React from 'react';
import ConfigField from '@/features/config/components/ConfigField';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/context/LanguageContext';

/**
 * AiSettings Feature Component.
 * Dedicated space for AI-related configurations like Gemini and WhatsApp Automation.
 */
const AiSettings = ({ user, settings, updateSetting }) => {
    const { t } = useLanguage();
    const isAdmin = user?.role === 'admin' || user?.role === 'secretary';

    return (
        <div className="tab-panel animate-fade-in ai-settings">
            {/* WhatsApp Automation */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="smart_toy" size="1.2rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('whatsapp_automation_title') || 'Automatización de WhatsApp'}</h4>
                </div>

                <div className="config-section__body">
                    <ConfigField
                        id="whatsapp-auto-respond-unknown"
                        label={t('whatsapp_auto_respond_unknown_label') || 'Responder automáticamente a números desconocidos'}
                        type="checkbox"
                        checked={settings.whatsapp_auto_respond_unknown === '1'}
                        onChange={(e) => updateSetting('whatsapp_auto_respond_unknown', e.target.checked ? '1' : '0')}
                        disabled={!isAdmin}
                        hint={t('whatsapp_auto_respond_unknown_hint') || 'Si está activado, la IA enviará automáticamente un mensaje de bienvenida y el link de registro a cualquier número que no esté en la lista de pacientes.'}
                    />
                </div>
            </div>

            {/* Gemini Configuration */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="psychology" size="1.2rem" className="config-section__icon" />
                    <h4 className="config-section__title">Google Gemini (Motor de IA)</h4>
                </div>

                <div className="config-section__body">
                    <p className="config-section__description">
                        Configura el comportamiento global de la inteligencia artificial. Estos valores se usarán como base para todos los médicos del sistema.
                    </p>
                    
                    <ConfigField
                        id="gemini-global-model"
                        label="Modelo Global (Vía ENV)"
                        type="text"
                        value={settings.gemini_global_model || 'gemini-1.5-flash'}
                        onChange={(e) => updateSetting('gemini_global_model', e.target.value)}
                        disabled={!isAdmin}
                        hint="El modelo utilizado para generar sugerencias de respuesta y automatizaciones."
                    />

                    <div className="config-section__divider"></div>

                    <div className="config-section__ai-status">
                        <Icon name="check_circle" size="1rem" style={{ color: 'var(--success-color)' }} />
                        <span>Conexión con Google Cloud activa</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AiSettings;
