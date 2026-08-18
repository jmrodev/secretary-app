import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HeaderStatPill } from '../HeaderStatPill';
import styles from '../HeaderStatPill.module.css';

describe('HeaderStatPill Atom', () => {
    it('renders the icon wrapper with the tone modifier and the metric value', () => {
        const { container } = render(
            <HeaderStatPill icon="CALENDAR_TODAY" value={7} title="Today" tone="appointments" />
        );

        const iconWrapper = container.querySelector(`.${styles.HeaderStatPill__iconWrapper}`);
        expect(iconWrapper).not.toBeNull();
        expect(iconWrapper).toHaveClass(styles['HeaderStatPill__iconWrapper--appointments']);
        // The icon wrapper actually renders an icon (Icon renders aria-hidden)
        expect(iconWrapper.querySelector('[aria-hidden="true"]')).not.toBeNull();
        expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('exposes the title as a native tooltip attribute', () => {
        render(
            <HeaderStatPill icon="VIEW_WEEK" value={12} title="Week total" tone="week" />
        );

        expect(screen.getByTitle('Week total')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('applies the tone modifier per prop and renders a falsy value', () => {
        const { container, rerender } = render(
            <HeaderStatPill icon="GROUPS" value={0} title="Patients" tone="patients" />
        );

        const iconWrapper = container.querySelector(`.${styles.HeaderStatPill__iconWrapper}`);
        expect(iconWrapper).toHaveClass(styles['HeaderStatPill__iconWrapper--patients']);
        expect(screen.getByText('0')).toBeInTheDocument();

        rerender(<HeaderStatPill icon="TRENDING_UP" value={5} title="Growth" tone="growth" />);
        expect(container.querySelector(`.${styles.HeaderStatPill__iconWrapper}`)).toHaveClass(
            styles['HeaderStatPill__iconWrapper--growth']
        );
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.queryByText('0')).not.toBeInTheDocument();
    });

    it('renders only the passed props with no hook or data dependency', () => {
        // Rendered outside any provider/context with no mocks: if the atom
        // depended on a hook or data source, this render would throw or need it.
        const { rerender } = render(
            <HeaderStatPill icon="DATE_RANGE" value={3} title="Month total" tone="month" />
        );

        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByTitle('Month total')).toBeInTheDocument();

        rerender(<HeaderStatPill icon="DATE_RANGE" value={9} title="Month total" tone="month" />);
        expect(screen.getByText('9')).toBeInTheDocument();
        expect(screen.queryByText('3')).not.toBeInTheDocument();
    });
});