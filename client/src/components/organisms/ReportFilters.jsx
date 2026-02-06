
import React from 'react';
import Button from '../atoms/Button';
import Select from '../atoms/Select';
import Input from '../atoms/Input';
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
                        ⬅️
                    </Button>
                    <Select
                        value={month}
                        onChange={(e) => onMonthChange(Number(e.target.value))}
                        options={Array.from({ length: 12 }, (_, i) => ({
                            value: i + 1,
                            label: t('months_array')[i]
                        }))}
                        className="report-filters__select"
                    />
                    <Button
                        variant="ghost"
                        size="sm-compact"
                        onClick={() => onStepMonth(1)}
                        className="report-filters__step-btn"
                    >
                        ➡️
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
                        ⬅️
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
                        ➡️
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
                            💾 {t('download_json') || 'JSON'}
                        </Button>
                        <Button
                            variant="accent"
                            onClick={onPrint}
                            className="report-filters__btn"
                        >
                            🖨️ {t('print') || 'Imprimir'}
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
};

export default ReportFilters;
