import React, { useState } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DoctorScheduleSettings } from '../DoctorScheduleSettings';

function Harness({ onChange, ...props }) {
    const [schedule, setSchedule] = useState([]);
    const handle = (updaterOrValue) => {
        const next = typeof updaterOrValue === 'function' ? updaterOrValue(schedule) : updaterOrValue;
        setSchedule(next);
        onChange && onChange(next);
    };
    return <DoctorScheduleSettings doctorId={1} schedule={schedule} setSchedule={handle} loading={false} {...props} />;
}

function HarnessNoSetSchedule({ onChange, ...props }) {
    const [schedule, setSchedule] = useState([]);
    return <DoctorScheduleSettings doctorId={1} schedule={schedule} loading={false} {...props} />;
}

describe('DoctorScheduleSettings functional flows', () => {
    it('renders 7 day toggles and toggling Lunes adds a day block + marks active', () => {
        const onChange = vi.fn();
        const { container } = render(<Harness onChange={onChange} />);

        const dayChecks = screen.getAllByRole('checkbox');
        expect(dayChecks.length).toBe(7);

        fireEvent.click(dayChecks[0]);
        expect(onChange).toHaveBeenCalled();
        const last = onChange.mock.calls.at(-1)[0];
        expect(last).toEqual(expect.arrayContaining([expect.objectContaining({ day_of_week: 1 })]));

        const activeArticle = container.querySelector('article[class*="scheduleDay--active"]');
        expect(activeArticle).not.toBeNull();
    });

    it('add block button appends another time block for the active day', () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);

        fireEvent.click(screen.getAllByRole('checkbox')[0]);
        onChange.mockClear();

        fireEvent.click(screen.getByText('add_extra_block'));
        expect(onChange).toHaveBeenCalled();
        const last = onChange.mock.calls.at(-1)[0];
        const lunBlocks = last.filter((b) => b.day_of_week === 1);
        expect(lunBlocks.length).toBe(2);
    });

    it('remove block decreases the day block count', () => {
        const onChange = vi.fn();
        render(<Harness onChange={onChange} />);

        fireEvent.click(screen.getAllByRole('checkbox')[0]);
        fireEvent.click(screen.getByText('add_extra_block'));
        onChange.mockClear();

        fireEvent.click(screen.getAllByTitle('remove_time_slot')[0]);
        expect(onChange).toHaveBeenCalled();
        const last = onChange.mock.calls.at(-1)[0];
        const lunBlocks = last.filter((b) => b.day_of_week === 1);
        expect(lunBlocks.length).toBe(1);
    });

    it('editing a time input fires onChange with the new value (block input, not bulk)', () => {
        const onChange = vi.fn();
        const { container } = render(<Harness onChange={onChange} />);

        fireEvent.click(screen.getAllByRole('checkbox')[0]);
        onChange.mockClear();

        const blockTimeInput = container.querySelector('article input[type="time"]');
        expect(blockTimeInput).not.toBeNull();
        fireEvent.change(blockTimeInput, { target: { value: '09:30' } });
        expect(onChange).toHaveBeenCalled();
        const last = onChange.mock.calls.at(-1)[0];
        const lunBlocks = last.filter((b) => b.day_of_week === 1);
        expect(lunBlocks[0].start_time).toBe('09:30');
    });

    describe('Defensive guards', () => {
        it('renders without setSchedule prop (7 day toggles) and does not throw on mount', () => {
            const { container } = render(<HarnessNoSetSchedule />);
            const dayChecks = screen.getAllByRole('checkbox');
            expect(dayChecks.length).toBe(7);
            expect(container.querySelector('section')).not.toBeNull();
        });

        it('toggling a day without setSchedule does not throw (graceful no-op)', () => {
            render(<HarnessNoSetSchedule />);
            const dayChecks = screen.getAllByRole('checkbox');

            // When setSchedule is omitted the component degrades to a no-op
            // instead of throwing "setSchedule is not a function".
            expect(() => {
                fireEvent.click(dayChecks[0]);
            }).not.toThrow();
        });
    });
});
