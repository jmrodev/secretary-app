import React from 'react';
import { ConfigField } from '@/features/config/components/ui/ConfigField';
import Icon from '@/components/atoms/Icon';
import { useLanguage } from '@/hooks/useLanguage';
import { AI_PROVIDERS, DEFAULT_AI_MODELS, normalizeGeminiModel } from '@/constants/aiModels';

/**
 * AiSettings Feature Component.
 * Dedicated space for AI-related configurations: primary provider, per-provider
 * models (persisted to system settings) and WhatsApp automation.
 */
export const AiSettings = ({ user, settings, updateSetting }) => {
    const { t } = useLanguage();
    const isAdmin = user?.role === 'admin' || user?.role === 'secretary';

    const providerOptions = AI_PROVIDERS.map((provider) => ({
        value: provider,
        label: t(`ai_provider_option_${provider}`)
    }));

    return (
        <div className="tab-panel animate-fade-in ai-settings">
            {/* AI Provider Priority */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="psychology" size="1.2rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('ai_provider_title')}</h4>
                </div>
                <div className="config-section__body">
                    <p className="config-section__desc">
                        {t('ai_provider_hint')}
                    </p>
                    <div className="config-grid">
                        <ConfigField
                            id="ai-provider"
                            label={t('ai_provider_label')}
                            type="select"
                            value={settings.ai_provider || 'groq'}
                            onChange={(e) => updateSetting('ai_provider', e.target.value)}
                            disabled={!isAdmin}
                            options={providerOptions}
                            hint={t('ai_provider_hint_detail')}
                        />
                    </div>
                </div>
            </div>

            {/* Per-provider models */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="psychology" size="1.2rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('ai_gemini_section_title')}</h4>
                </div>

                <div className="config-section__body">
                    <p className="config-section__desc">
                        {t('ai_gemini_section_desc')}
                    </p>

                    <div className="config-grid">
                        <ConfigField
                            id="ai-ollama-model"
                            label={t('ai_ollama_model_label')}
                            type="text"
                            value={settings.ai_ollama_model || DEFAULT_AI_MODELS.ollama}
                            onChange={(e) => updateSetting('ai_ollama_model', e.target.value)}
                            disabled={!isAdmin}
                            hint={t('ai_ollama_model_hint')}
                        />

                        <ConfigField
                            id="ai-groq-model"
                            label={t('ai_groq_model_label')}
                            type="text"
                            value={settings.ai_groq_model || DEFAULT_AI_MODELS.groq}
                            onChange={(e) => updateSetting('ai_groq_model', e.target.value)}
                            disabled={!isAdmin}
                            hint={t('ai_groq_model_hint')}
                        />

                        <ConfigField
                            id="gemini-global-model"
                            label={t('gemini_global_model_label')}
                            type="text"
                            value={normalizeGeminiModel(settings.gemini_global_model) || DEFAULT_AI_MODELS.gemini}
                            onChange={(e) => updateSetting('gemini_global_model', e.target.value)}
                            disabled={!isAdmin}
                            hint={t('gemini_global_model_hint')}
                        />
                    </div>
                </div>
            </div>

            {/* WhatsApp Automation */}
            <div className="config-section">
                <div className="config-section__header">
                    <Icon name="smart_toy" size="1.2rem" className="config-section__icon" />
                    <h4 className="config-section__title">{t('whatsapp_automation_title')}</h4>
                </div>

                <div className="config-section__body">
                    <div className="config-grid">
                        <ConfigField
                            id="whatsapp-auto-respond-unknown"
                            label={t('whatsapp_auto_respond_unknown_label')}
                            type="checkbox"
                            checked={settings.whatsapp_auto_respond_unknown === '1'}
                            onChange={(e) => updateSetting('whatsapp_auto_respond_unknown', e.target.checked ? '1' : '0')}
                            disabled={!isAdmin}
                            hint={t('whatsapp_auto_respond_unknown_hint')}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

