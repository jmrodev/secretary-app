import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SecretaryPermissionsPanel } from './SecretaryPermissionsPanel';

const t = (key) => key;

const secretaries = [
    { id: 2, username: 'sec1', full_name: 'Secretary One', can_manage_users: 0 },
    { id: 3, username: 'sec2', full_name: 'Secretary Two', can_manage_users: 1 }
];

const baseProps = {
    t,
    secretaries,
    loading: false,
    updating: false,
    selectedIds: [],
    grantToAll: false,
    onToggleSelect: vi.fn(),
    onToggleGrantAll: vi.fn(),
    onGrant: vi.fn(),
    onRevoke: vi.fn()
};

describe('SecretaryPermissionsPanel', () => {
    it('lists every secretary with a checkbox', () => {
        render(<SecretaryPermissionsPanel {...baseProps} />);

        expect(screen.getByText('Secretary One')).toBeTruthy();
        expect(screen.getByText('Secretary Two')).toBeTruthy();
        expect(screen.getAllByRole('checkbox')).toHaveLength(3); // 2 rows + grant-all
    });

    it('marks already-granted secretaries with a badge', () => {
        render(<SecretaryPermissionsPanel {...baseProps} />);

        expect(screen.getByText('user_header')).toBeTruthy();
    });

    it('disables grant/revoke when nothing is selected and grantToAll is off', () => {
        render(<SecretaryPermissionsPanel {...baseProps} />);

        expect(screen.getByText('grant_selected').closest('button').disabled).toBe(true);
        expect(screen.getByText('revoke_selected').closest('button').disabled).toBe(true);
    });

    it('fires onGrant when a selection exists and the grant button is clicked', () => {
        render(<SecretaryPermissionsPanel {...baseProps} selectedIds={[2]} />);

        fireEvent.click(screen.getByText('grant_selected'));
        expect(baseProps.onGrant).toHaveBeenCalledTimes(1);
    });
});