import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DoctorMessagesForm } from '@/features/doctors/components/sections/DoctorMessagesForm';

vi.mock('@/features/config/components/forms/MessageTemplateEditor', () => ({
    MessageTemplateEditor: ({ id, label }) => (
        <div data-testid="template-editor">{`${id}:${label}`}</div>
    )
}));

// t stub: labels resolve to their keys, so tests assert on stable keys and
// prove the form renders no hardcoded literals.
const t = (key) => key;

// The templates/confirmation subtabs render the injected editor.
const MessageTemplateEditorComponent = ({ id, label }) => (
    <div data-testid="template-editor">{`${id}:${label}`}</div>
);

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

describe('DoctorMessagesForm', () => {
    it('renders the templates and confirmation tabs through i18n keys', () => {
        renderForm();

        expect(screen.getByRole('button', { name: 'reminders_tab' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'confirmations_tab' })).toBeInTheDocument();
    });

    it('renders the reminder template editors by default', () => {
        renderForm();

        expect(screen.getByText('doctor-reminder-template:presential_reminder_label')).toBeInTheDocument();
        expect(screen.getByText('doctor-reminder-virtual-template:virtual_reminder_label')).toBeInTheDocument();
    });
});