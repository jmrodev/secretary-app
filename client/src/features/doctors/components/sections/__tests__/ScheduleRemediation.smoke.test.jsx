import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { DoctorScheduleSettings } from '../DoctorScheduleSettings';
import { ScheduleTimeBlock } from '@/features/appointments/components/schedule/ScheduleTimeBlock';
import { ScheduleBulkActions } from '@/features/appointments/components/schedule/ScheduleBulkActions';

import stylesD from '../DoctorScheduleSettings.module.css';
import stylesT from '@/features/appointments/components/schedule/ScheduleTimeBlock.module.css';
import stylesB from '@/features/appointments/components/schedule/ScheduleBulkActions.module.css';

const t = (k) => k;

describe('Schedule tab remediation (css-schedule-tab-remediation)', () => {
    it('CSS module -- modifier keys resolve (JSX bracket refs are valid)', () => {
        // Vite keeps the original -- key; the JSX uses styles['...--modifier']
        expect(stylesD['DoctorScheduleSettings__scheduleDay--active']).toBeTruthy();
        expect(stylesT['ScheduleTimeBlock__typeSelect--virtual']).toBeTruthy();
        expect(stylesB['ScheduleBulkActions__root']).toBeTruthy();
        expect(stylesB['ScheduleBulkActions__actions']).toBeTruthy();
    });

    it('DoctorScheduleSettings active day renders the --active modifier', () => {
        const { container } = render(
            <DoctorScheduleSettings
                schedule={[{ day_of_week: 1, start_time: '08:00', end_time: '20:00', is_break: 0, default_type: 'consultation' }]}
                setSchedule={() => { }}
                loading={false}
                t={t}
            />
        );
        const article = container.querySelector('article');
        expect(article.className).toMatch(/scheduleDay--active/);
        expect(container.innerHTML).not.toMatch(/undefined/);
    });

    it('ScheduleTimeBlock virtual type renders the --virtual modifier', () => {
        const { container } = render(
            <ScheduleTimeBlock
                block={{ default_type: 'virtual', start_time: '08:00', end_time: '20:00', force_hour_alignment: 0, originalIndex: 0 }}
                onFocus={() => { }} onBlur={() => { }} onChange={() => { }} onRemove={() => { }} t={t}
            />
        );
        expect(container.innerHTML).toMatch(/typeSelect--virtual/);
        expect(container.innerHTML).not.toMatch(/undefined/);
    });

    it('ScheduleBulkActions applies bulk to Mon-Fri via onApplyBulk', () => {
        const onApplyBulk = vi.fn();
        render(
            <ScheduleBulkActions
                bulkStart="08:00" setBulkStart={() => { }} bulkEnd="20:00" setBulkEnd={() => { }}
                onApplyBulk={onApplyBulk} t={t}
            />
        );
        fireEvent.click(document.querySelector('button'));
        expect(onApplyBulk).toHaveBeenCalledWith([1, 2, 3, 4, 5]);
    });
});
