import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { UserForm } from './UserForm';

vi.mock('@/hooks/useLanguage', () => ({
    useLanguage: () => ({ t: (k) => k })
}));

vi.mock('@/components/molecules/PhoneNumbersManager', () => ({
    PhoneNumbersManager: () => null
}));

describe('UserForm - staff profile fields (spec REQ-03)', () => {
    const baseProps = {
        type: 'CREATE',
        formData: {},
        setFormData: vi.fn()
    };

    it('renders first_name, last_name, email and address field labels', () => {
        render(<UserForm {...baseProps} />);
        expect(screen.getByText('first_name')).toBeTruthy();
        expect(screen.getByText('last_name')).toBeTruthy();
        expect(screen.getByText('email')).toBeTruthy();
        expect(screen.getByText('address')).toBeTruthy();
    });

    it('does NOT render a free-text full_name input', () => {
        render(<UserForm {...baseProps} />);
        expect(screen.queryByText('full_name')).toBeNull();
    });
});
