import React from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import { Button } from '@/components/atoms/Button';
import styles from './SegmentSelector.module.css';

const SEGMENT_OPTIONS = [
    { value: 'this_week', labelKey: 'outreach_segment_this_week' },
    { value: 'date_range', labelKey: 'outreach_segment_date_range' },
    { value: 'this_year', labelKey: 'outreach_segment_this_year' },
    { value: 'since_year_ago', labelKey: 'outreach_segment_since_year_ago' },
    { value: 'upcoming', labelKey: 'outreach_segment_upcoming' },
    { value: 'custom', labelKey: 'outreach_segment_custom' }
];

/**
 * SegmentSelector — Step 1 of the outreach flow.
 *
 * Allows staff to select a patient segment type, optionally specify
 * a date range, and load matching patients.
 */
export const SegmentSelector = ({
    segmentType,
    dateRange = { startDate: '', endDate: '' },
    onSegmentTypeChange,
    onDateRangeChange,
    onLoadPatients,
    loading = false,
    patients = [],
    error = null,
    fetched = false
}) => {
    const { t } = useLanguage();

    const requiresDates = segmentType === 'date_range' || segmentType === 'custom';
    const hasValidDates = dateRange.startDate && dateRange.endDate;
    const canLoad = segmentType && (!requiresDates || hasValidDates);
    const hasPatients = patients.length > 0;

    const mappedOptions = SEGMENT_OPTIONS.map(opt => ({
        value: opt.value,
        label: t(opt.labelKey)
    }));

    return (
        <section className={styles['SegmentSelector__segment-selector']}>
            <h3 className={styles['SegmentSelector__segment-selector__title']}>
                {t('outreach_step_1')}
            </h3>

            <div className={styles['SegmentSelector__segment-selector__form']}>
                <div className={styles['SegmentSelector__segment-selector__field']}>
                    <label
                        className={styles['SegmentSelector__segment-selector__label']}
                        htmlFor="segment-type"
                    >
                        {t('outreach_segment_label')}
                    </label>
                    <Select
                        id="segment-type"
                        value={segmentType}
                        onChange={(e) => onSegmentTypeChange(e.target.value)}
                        options={mappedOptions}
                        placeholder={t('outreach_segment_placeholder')}
                    />
                </div>

                {requiresDates && (
                    <div className={styles['SegmentSelector__segment-selector__date-row']}>
                        <div className={styles['SegmentSelector__segment-selector__field']}>
                            <label
                                className={styles['SegmentSelector__segment-selector__label']}
                                htmlFor="segment-start-date"
                            >
                                {t('outreach_segment_start_date')}
                            </label>
                            <Input
                                id="segment-start-date"
                                type="date"
                                value={dateRange.startDate}
                                onChange={(e) =>
                                    onDateRangeChange(e.target.value, dateRange.endDate)
                                }
                            />
                        </div>
                        <div className={styles['SegmentSelector__segment-selector__field']}>
                            <label
                                className={styles['SegmentSelector__segment-selector__label']}
                                htmlFor="segment-end-date"
                            >
                                {t('outreach_segment_end_date')}
                            </label>
                            <Input
                                id="segment-end-date"
                                type="date"
                                value={dateRange.endDate}
                                onChange={(e) =>
                                    onDateRangeChange(dateRange.startDate, e.target.value)
                                }
                            />
                        </div>
                    </div>
                )}

                <div className={styles['SegmentSelector__segment-selector__actions']}>
                    <Button
                        onClick={onLoadPatients}
                        disabled={!canLoad || loading}
                        loading={loading}
                    >
                        {loading
                            ? t('outreach_segment_loading')
                            : t('outreach_segment_load')
                        }
                    </Button>
                </div>
            </div>

            {error && (
                <div className={styles['SegmentSelector__segment-selector__error']} role="alert">
                    {error}
                </div>
            )}

            {fetched && !hasPatients && !loading && !error && (
                <div className={styles['SegmentSelector__segment-selector__empty']} role="status">
                    {t('outreach_segment_empty')}
                </div>
            )}

            {hasPatients && !loading && (
                <div className={styles['SegmentSelector__segment-selector__count']} role="status" data-count={patients.length}>
                    {t('outreach_segment_count', { count: patients.length })}
                </div>
            )}
        </section>
    );
};
