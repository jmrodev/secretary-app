import React from 'react';
import { Button } from '@/components/atoms/Button';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import { getMonthsOptions } from '@/utils/core/dateUtils';
import styles from './ReportFilters.module.css';

export const ReportFilters = ({
    month,
    year,
    onMonthChange,
    onYearChange,
    onGenerate,
    onDownload,
    onPrint,
    onStepMonth,
    onStepYear,
    isSubmitting,
    hasData,
    t
}) => {
    const monthOptions = getMonthsOptions(t, null).map(opt => ({
        ...opt,
        value: Number(opt.value)
    }));

    return (
        <div className={styles.reportFilters}>
            <div className={styles.reportFilters__controls}>
                <div className={styles.reportFilters__field}>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onStepMonth(-1)}
                    >
                        <Icon name="chevron_left" size="1.1rem" />
                    </Button>
                    <Select
                        value={month}
                        onChange={(e) => onMonthChange(Number(e.target.value))}
                        options={monthOptions}
                        className={styles.reportFilters__selectMonth}
                    />
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onStepMonth(1)}
                    >
                        <Icon name="chevron_right" size="1.1rem" />
                    </Button>
                </div>

                <div className={styles.reportFilters__field}>
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onStepYear(-1)}
                    >
                        <Icon name="chevron_left" size="1.1rem" />
                    </Button>
                    <Input
                        type="number"
                        value={year}
                        onChange={(e) => onYearChange(Number(e.target.value))}
                        min="2020"
                        max="2035"
                        className={styles.reportFilters__inputYear}
                    />
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onStepYear(1)}
                    >
                        <Icon name="chevron_right" size="1.1rem" />
                    </Button>
                </div>
            </div>

            <div className={styles.reportFilters__actions}>
                <Button
                    onClick={onGenerate}
                    disabled={isSubmitting}
                    variant="primary"
                    size="sm"
                >
                    {isSubmitting ? '...' : t('generate')}
                </Button>

                {hasData && (
                    <div className={styles.reportFilters__exportGroup}>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onDownload}
                            icon={<Icon name="download" size="1.1rem" />}
                            title={t('download_json')}
                        />
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={onPrint}
                            icon={<Icon name="print" size="1.1rem" />}
                            title={t('print')}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};


