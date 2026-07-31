import { describe, it, expect } from 'vitest';
import { translations } from '@/constants/translations';

/**
 * Keys the AI configuration UI renders through t(). Both locales must provide
 * a non-empty value for each, otherwise the UI falls back to the raw key
 * (spec: "no raw key or `||` fallback literal is visible").
 */
const REQUIRED_AI_KEYS = [
    // AiSettings provider section (whatsapp_automation.js)
    'ai_provider_title',
    'ai_provider_hint',
    'ai_provider_label',
    'ai_provider_hint_detail',
    'ai_provider_option_ollama',
    'ai_provider_option_groq',
    'ai_provider_option_gemini',
    'ai_ollama_model_label',
    'ai_ollama_model_hint',
    'ai_groq_model_label',
    'ai_groq_model_hint',
    'gemini_global_model_label',
    'gemini_global_model_hint',
    'ai_gemini_section_title',
    'ai_gemini_section_desc',
    // DoctorMessagesForm AI subtab (doctors.js)
    'reminders_tab',
    'confirmations_tab',
    'ai_tab',
    'load_base_rules',
    'gemini_config_title',
    'gemini_context_label',
    'gemini_context_placeholder',
    'gemini_context_hint',
    'gemini_model_label',
    'gemini_api_version_label',
    'gemini_api_version_option_v1',
    'gemini_api_version_option_v1beta',
    'gemini_history_limit_label',
    'gemini_history_limit_hint'
];

describe('AI configuration i18n keys', () => {
    it.each(REQUIRED_AI_KEYS)('resolves %s to a non-empty value in es and en', (key) => {
        expect(translations.es[key]).toBeTruthy();
        expect(translations.en[key]).toBeTruthy();
    });
});
