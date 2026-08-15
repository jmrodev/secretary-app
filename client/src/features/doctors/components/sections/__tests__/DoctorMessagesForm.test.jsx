import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DoctorMessagesForm } from '@/features/doctors/components/sections/DoctorMessagesForm';

// t stub: labels resolve to their keys, so tests assert on stable keys and
// prove the form renders no hardcoded literals.
const t = (key) => key;

// The templates/confirmation subtabs render the injected editor; the AI subtab
// tests only need a harmless stub.
const MessageTemplateEditorComponent = () => null;

const openAiTab = () => {
    fireEvent.click(screen.getByRole('button', { name: 'ai_tab' }));
};

const renderForm = (data = {}, onChange = vi.fn()) =>
    render(
        <DoctorMessagesForm
            data={data}
            onChange={onChange}
            settings={{}}
            t={t}
            MessageTemplateEditorComponent={MessageTemplateEditorComponent}
        />
    );

beforeEach(() => {
    vi.clearAllMocks();
});

describe('DoctorMessagesForm AI subtab', () => {
    it('renders the AI section through i18n keys', () => {
        renderForm();
        openAiTab();

        expect(screen.getByText('gemini_config_title')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'load_base_rules' })).toBeInTheDocument();
    });

    it('offers only valid Gemini model options (no dead 1.5/2.0/2.5 models)', () => {
        renderForm();
        openAiTab();

        expect(screen.getByRole('option', { name: 'gemini-3.6-flash' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'gemini-3.5-flash' })).toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'gemini-2.5-flash' })).not.toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'gemini-2.0-flash' })).not.toBeInTheDocument();
        expect(screen.queryByRole('option', { name: 'gemini-1.5-flash' })).not.toBeInTheDocument();
    });

    it('offers the v1/v1beta API version options through i18n labels', () => {
        renderForm();
        openAiTab();

        expect(screen.getByRole('option', { name: 'gemini_api_version_option_v1' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'gemini_api_version_option_v1beta' })).toBeInTheDocument();
    });

    it('shows the stored gemini_model and gemini_api_version without defaults', () => {
        renderForm({ gemini_model: 'gemini-3.6-flash', gemini_api_version: 'v1' });
        openAiTab();

        expect(screen.getByRole('option', { name: 'gemini-3.6-flash' }).selected).toBe(true);
        expect(screen.getByRole('option', { name: 'gemini_api_version_option_v1' }).selected).toBe(true);
    });

    it('falls back to valid defaults when no model or version is stored', () => {
        renderForm({});
        openAiTab();

        expect(screen.getByRole('option', { name: 'gemini-3.6-flash' }).selected).toBe(true);
        expect(screen.getByRole('option', { name: 'gemini_api_version_option_v1beta' }).selected).toBe(true);
    });

    it('normalizes a dead stored gemini_model at read time without mutating it', () => {
        renderForm({ gemini_model: 'gemini-2.5-flash' });
        openAiTab();

        expect(screen.getByRole('option', { name: 'gemini-3.6-flash' }).selected).toBe(true);
        expect(screen.queryByDisplayValue('gemini-2.5-flash')).not.toBeInTheDocument();
    });

    it('persists model and api version changes through onChange', () => {
        const onChange = vi.fn();
        renderForm({ gemini_model: 'gemini-3.6-flash', gemini_api_version: 'v1beta' }, onChange);
        openAiTab();

        fireEvent.change(screen.getByDisplayValue('gemini-3.6-flash'), {
            target: { value: 'gemini-3.5-flash' }
        });
        fireEvent.change(screen.getByDisplayValue('gemini_api_version_option_v1beta'), {
            target: { value: 'v1' }
        });

        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ gemini_model: 'gemini-3.5-flash' }));
        expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ gemini_api_version: 'v1' }));
    });
});
