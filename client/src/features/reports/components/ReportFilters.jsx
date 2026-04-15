import React from 'react';
import Button from '@/components/atoms/Button';
import Select from '@/components/atoms/Select';
import Input from '@/components/atoms/Input';
import Icon from '@/components/atoms/Icon';
import { getMonthsOptions } from '@/utils/dateUtils';
import './ReportFilters.css';

const ReportFilters = ({
    month,
    year,
    selectedDoctorId,
    onMonthChange,
    onYearChange,
    onDoctorChange,
    onGenerate,
    onDownload,
    onPrint,
    onStepMonth,
    onStepYear,
    isSubmitting,
    hasData,
    doctors,
    t
}) => {
    // We pass null for allLabelKey because ReportFilters specifically requires a month (no "All Months" option)
    const monthOptions = getMonthsOptions(t, null).map(opt => ({
        ...opt,
        value: Number(opt.value) // ReportFilters uses numeric values
    }));

    return (
        <section className="report-filters">
            <h2 className="visually-hidden">{t('filters') || 'Filtros'}</h2>
            <fieldset className="report-filters__group">
                <legend className="report-filters__label">{t('month')}</legend>
                <div className="report-filters__control-row">
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onStepMonth(-1)}
                        className="report-filters__step-btn"
                    >
                        <Icon name="chevron_left" size="1.2rem" />
                    </Button>
                    <Select
                        value={month}
                        onChange={(e) => onMonthChange(Number(e.target.value))}
                        options={monthOptions}
                        className="report-filters__select"
                    />
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onStepMonth(1)}
                        className="report-filters__step-btn"
                    >
                        <Icon name="chevron_right" size="1.2rem" />
                    </Button>
                </div>
            </fieldset>

            <fieldset className="report-filters__group">
                <legend className="report-filters__label">{t('year')}</legend>
                <div className="report-filters__control-row">
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onStepYear(-1)}
                        className="report-filters__step-btn"
                    >
                        <Icon name="chevron_left" size="1.2rem" />
                    </Button>
                    <Input
                        type="number"
                        value={year}
                        onChange={(e) => onYearChange(Number(e.target.value))}
                        min="2020"
                        max="2035"
                        className="report-filters__input"
                    />
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onStepYear(1)}
                        className="report-filters__step-btn"
                    >
                        <Icon name="chevron_right" size="1.2rem" />
                    </Button>
                </div>
            </fieldset>

            <fieldset className="report-filters__group">
                <legend className="report-filters__label">{t('doctor') || 'Médico'}</legend>
                <Select
                    value={selectedDoctorId}
                    onChange={(e) => onDoctorChange(e.target.value)}
                    options={[
                        { value: '', label: t('all_doctors') || 'Todos los Médicos' },
                        ...doctors.map(doc => ({
                            value: doc.id,
                            label: doc.full_name || doc.username
                        }))
                    ]}
                    className="report-filters__select report-filters__select--doctor"
                />
            </fieldset>

            <footer className="report-filters__actions">
                <Button
                    onClick={onGenerate}
                    disabled={isSubmitting}
                    variant="primary"
                    className="report-filters__btn report-filters__btn--generate"
                >
                    {isSubmitting ? '...' : (t('generate_report') || 'Generar Reporte')}
                </Button>

                {hasData && (
                    <>
                        <Button
                            variant="secondary"
                            onClick={onDownload}
                            className="report-filters__btn"
                        >
                            <Icon name="attachment" size="1.1rem" className="report-filters__btn-icon" />
                            {t('download_json') || 'JSON'}
                        </Button>
                        <Button
                            variant="accent"
                            onClick={onPrint}
                            className="report-filters__btn"
                        >
                            <Icon name="print" size="1.1rem" className="report-filters__btn-icon" />
                            {t('print') || 'Imprimir'}
                        </Button>
                    </>
                )}
            </footer>
        </section>
    );
};

export default ReportFilters;
