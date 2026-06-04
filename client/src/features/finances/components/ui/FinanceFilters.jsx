import React from 'react';
import Input from '@/components/atoms/Input';
import Select from '@/components/atoms/Select';
import Icon from '@/components/atoms/Icon';
import Button from '@/components/atoms/Button';
import FormGroup from '@/components/molecules/FormGroup';
import { getMonthsOptions } from '@/utils/core/dateUtils';
import styles from './FinanceFilters.module.css';

/**
 * FinanceFilters Molecule.
 * Provides search and filtering capabilities for the finance ledger.
 * Refactored to use BEM and Atomic Design components.
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

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || 
                             monthFilter !== 'all' || yearFilter !== 'all' || paymentMethodFilter !== 'all';

    return (
        <div className={`${styles.root}`}>
            <div className={`${styles.searchWrapper}`}>
                <Icon name="SEARCH" className={`${styles.searchIcon}`} size="1.2rem" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('search_placeholder') || "Buscar por paciente, descripción o monto..."}
                    className={`${styles.searchInput}`}
                    size="sm"
                />
            </div>

            <div className={`${styles.groups}`}>
                <FormGroup label={t('status')} className={`${styles.group}`}>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={statusOptions}
                        size="sm"
                    />
                </FormGroup>

                <FormGroup label={t('type')} className={`${styles.group}`}>
                    <Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        options={typeOptions}
                        size="sm"
                    />
                </FormGroup>

                <FormGroup label={t('month')} className={`${styles.group}`}>
                    <Select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        options={monthOptions}
                        size="sm"
                    />
                </FormGroup>

                <FormGroup label={t('year')} className={`${styles.group}`}>
                    <Select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        options={yearOptions}
                        size="sm"
                    />
                </FormGroup>

                <FormGroup label={t('payment_method') || 'Método de pago'} className={`${styles.group}`}>
                    <Select
                        value={paymentMethodFilter}
                        onChange={(e) => setPaymentMethodFilter(e.target.value)}
                        options={paymentMethodOptions}
                        size="sm"
                    />
                </FormGroup>

                {hasActiveFilters && (
                    <div className={`${styles.group} ${styles.groupActions}`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`${styles.clear}`}
                            onClick={() => {
                                setSearchQuery('');
                                setStatusFilter('all');
                                setTypeFilter('all');
                                setMonthFilter('all');
                                setYearFilter('all');
                                setPaymentMethodFilter('all');
                            }}
                            icon={<Icon name="CANCEL" size="1.1rem" />}
                        >
                            {t('clear_filters') || 'Limpiar'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinanceFilters;
