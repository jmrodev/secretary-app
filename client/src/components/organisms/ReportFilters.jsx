
import React from 'react';
import Button from '../atoms/Button';
import Select from '../atoms/Select';
import Input from '../atoms/Input';
import Icon from '../atoms/Icon';
import { getMonthsOptions } from '../../utils/dateUtils';
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
        <div className="report-filters">
            <div className="report-filters__group">
                <label className="report-filters__label">{t('month')}</label>
                <div className="report-filters__control-row">
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onStepMonth(-1)}
                        className="report-filters__step-btn"
                    >
                        <Icon name="ARROW_BACK" size="1.2rem" />
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
                        <Icon name="ARROW_FORWARD" size="1.2rem" />
                    </Button>
                </div>
            </div>

            <div className="report-filters__group">
                <label className="report-filters__label">{t('year')}</label>
                <div className="report-filters__control-row">
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onStepYear(-1)}
                        className="report-filters__step-btn"
                    >
                        <Icon name="ARROW_BACK" size="1.2rem" />
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
                        <Icon name="ARROW_FORWARD" size="1.2rem" />
                    </Button>
                </div>
            </div>

            <div className="report-filters__group">
                <label className="report-filters__label">{t('doctor') || 'Médico'}</label>
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
            </div>

            <div className="report-filters__actions">
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
                            <Icon name="DOCUMENTS" size="1.1rem" className="mr-1" />
                            {t('download_json') || 'JSON'}
                        </Button>
                        <Button
                            variant="accent"
                            onClick={onPrint}
                            className="report-filters__btn"
                        >
                            <Icon name="FINANCES" size="1.1rem" className="mr-1" />
                            {t('print') || 'Imprimir'}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportFilters;
