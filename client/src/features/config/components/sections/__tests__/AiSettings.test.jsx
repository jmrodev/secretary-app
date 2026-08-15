import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AiSettings } from '@/features/config/components/sections/AiSettings';

// No LanguageProvider: useLanguage() falls back to t = (key) => key, so tests
// assert on stable keys and prove no hardcoded literal fallback is rendered.
const admin = { role: 'admin' };

const renderSettings = (settings = {}, updateSetting = vi.fn()) =>
    render(<AiSettings user={admin} settings={settings} updateSetting={updateSetting} />);

beforeEach(() => {
    vi.clearAllMocks();
});

describe('AiSettings provider section', () => {
    it('offers ollama, groq and gemini as provider options', () => {
        renderSettings();
        expect(screen.getByRole('option', { name: 'ai_provider_option_ollama' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'ai_provider_option_groq' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'ai_provider_option_gemini' })).toBeInTheDocument();
    });

    it('persists the selected provider via updateSetting', () => {
        const updateSetting = vi.fn();
        renderSettings({}, updateSetting);

        fireEvent.change(screen.getByLabelText('ai_provider_label'), { target: { value: 'ollama' } });

        expect(updateSetting).toHaveBeenCalledWith('ai_provider', 'ollama');
    });

    it('shows the stored provider as selected', () => {
        renderSettings({ ai_provider: 'gemini' });
        expect(screen.getByLabelText('ai_provider_label')).toHaveValue('gemini');
    });
});

describe('AiSettings per-provider model inputs', () => {
    it('renders one model input per provider with built-in defaults when unset', () => {
        renderSettings({});

        expect(screen.getByLabelText('ai_ollama_model_label')).toHaveValue('llama3.2');
        expect(screen.getByLabelText('ai_groq_model_label')).toHaveValue('llama-3.3-70b-versatile');
        expect(screen.getByLabelText('gemini_global_model_label')).toHaveValue('gemini-3.6-flash');
    });

    it('shows stored per-provider models and persists edits', () => {
        const updateSetting = vi.fn();
        renderSettings({ ai_ollama_model: 'llama3.1' }, updateSetting);

        expect(screen.getByLabelText('ai_ollama_model_label')).toHaveValue('llama3.1');

        fireEvent.change(screen.getByLabelText('ai_groq_model_label'), {
            target: { value: 'llama-3.1-8b-instant' }
        });

        expect(updateSetting).toHaveBeenCalledWith('ai_groq_model', 'llama-3.1-8b-instant');
    });

    it('normalizes a dead stored gemini model at read time without mutating it', () => {
        renderSettings({ gemini_global_model: 'gemini-2.5-flash' });

        expect(screen.getByLabelText('gemini_global_model_label')).toHaveValue('gemini-3.6-flash');
        expect(screen.getByLabelText('gemini_global_model_label')).not.toHaveValue('gemini-2.5-flash');
    });
});

describe('AiSettings cleanup requirements', () => {
    it('does not render the hardcoded connection badge', () => {
        renderSettings();
        expect(screen.queryByText('Conexión con Google Cloud activa')).not.toBeInTheDocument();
    });

    it('renders labels and hints through i18n keys without literal fallbacks', () => {
        renderSettings();

        // All visible section/labels resolve via t(); none falls back to a
        // hardcoded Spanish literal.
        expect(screen.getByText('ai_provider_title')).toBeInTheDocument();
        expect(screen.getByText('ai_provider_hint')).toBeInTheDocument();
        expect(screen.getByText('ai_provider_hint_detail')).toBeInTheDocument();
        expect(screen.getByText('ai_gemini_section_title')).toBeInTheDocument();
        expect(screen.queryByText('Proveedor de IA')).not.toBeInTheDocument();
        expect(screen.queryByText('Modelo Global (Vía ENV)')).not.toBeInTheDocument();
    });
});
