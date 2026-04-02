import React from 'react';
import Input from '../../../components/atoms/Input';
import Select from '../../../components/atoms/Select';
import Icon from '../../../components/atoms/Icon';
import { getMonthsOptions } from '../../../utils/dateUtils';
import './FinanceFilters.css';

/**
 * FinanceFilters Molecule.
 * Provides search and filtering capabilities for the finance ledger.
 */
const FinanceFilters = ({
    filters,
    handlers,
    t
}) => {
    const {
        searchQuery,
        statusFilter,
        typeFilter,
        monthFilter,
        yearFilter,
        paymentMethodFilter,
        options
    } = filters;

    const {
        setSearchQuery,
        setStatusFilter,
        setTypeFilter,
        setMonthFilter,
        setYearFilter,
        setPaymentMethodFilter
    } = handlers;

    const monthOptions = getMonthsOptions(t);

    const yearOptions = [
        { value: 'all', label: t('all_years') },
        ...options.years.map(year => ({ value: year, label: year }))
    ];

    const statusOptions = [
        { value: 'all', label: t('all_statuses') || 'Todos los estados' },
        { value: 'paid', label: t('paid') || 'Pagado' },
        { value: 'pending', label: t('pending') || 'Pendiente' },
        { value: 'bonified', label: t('bonified') || 'Bonificado' },
        { value: 'refunded', label: t('refunded') || 'Reembolsado' }
    ];

    const typeOptions = [
        { value: 'all', label: t('all_types') || 'Todos los tipos' },
        ...options.types.map(type => ({
            value: type,
            label: t(type) || type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
        }))
    ];

    const paymentMethodOptions = [
        { value: 'all', label: t('all_methods') || 'Todos los métodos' },
        ...(options.paymentMethods || []).map(method => ({
            value: method,
            label: t(method) || method.charAt(0).toUpperCase() + method.slice(1)
        }))
    ];

    return (
        <div className="finance-filters">
            <div className="finance-filters__search-wrapper">
                <Icon name="SEARCH" className="finance-filters__search-icon" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('search_placeholder') || "Buscar por paciente, descripción o monto..."}
                    className="finance-filters__search-input"
                    size="sm"
                />
            </div>

            <div className="finance-filters__groups">
                <div className="finance-filters__group">
                    <label className="finance-filters__label">{t('status')}</label>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={statusOptions}
                        size="sm"
                    />
                </div>

                <div className="finance-filters__group">
                    <label className="finance-filters__label">{t('type')}</label>
                    <Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        options={typeOptions}
                        size="sm"
                    />
                </div>

                <div className="finance-filters__group">
                    <label className="finance-filters__label">{t('month')}</label>
                    <Select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        options={monthOptions}
                        size="sm"
                    />
                </div>

                <div className="finance-filters__group">
                    <label className="finance-filters__label">{t('year')}</label>
                    <Select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        options={yearOptions}
                        size="sm"
                    />
                </div>

                <div className="finance-filters__group">
                    <label className="finance-filters__label">{t('payment_method') || 'Método de pago'}</label>
                    <Select
                        value={paymentMethodFilter}
                        onChange={(e) => setPaymentMethodFilter(e.target.value)}
                        options={paymentMethodOptions}
                        size="sm"
                    />
                </div>

                {(searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || monthFilter !== 'all' || yearFilter !== 'all' || paymentMethodFilter !== 'all') && (
                    <button
                        className="finance-filters__clear"
                        onClick={() => {
                            setSearchQuery('');
                            setStatusFilter('all');
                            setTypeFilter('all');
                            setMonthFilter('all');
                            setYearFilter('all');
                            setPaymentMethodFilter('all');
                        }}
                    >
                        <Icon name="CANCEL" size="1.1rem" />
                        {t('clear_filters') || 'Limpiar'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default FinanceFilters;
