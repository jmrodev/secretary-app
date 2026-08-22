import React from 'react';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import { Icon } from '@/components/atoms/Icon';
import { Button } from '@/components/atoms/Button';
import { FormGroup } from '@/components/molecules/FormGroup';
import { getMonthsOptions } from '@/utils/core/dateUtils';
import styles from './FinanceFilters.module.css';

/**
 * FinanceFilters Molecule.
 * Provides search and filtering capabilities for the finance ledger.
 * Refactored to use BEM and Atomic Design components.
 */
export const FinanceFilters = ({
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
        { value: 'all', label: t('all_statuses') },
        { value: 'paid', label: t('paid') },
        { value: 'pending', label: t('pending') },
        { value: 'bonified', label: t('bonified') },
        { value: 'refunded', label: t('refunded') }
    ];

    const typeOptions = [
        { value: 'all', label: t('all_types') },
        ...options.types.map(type => ({
            value: type,
            label: t(type) || type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
        }))
    ];

    const paymentMethodOptions = [
        { value: 'all', label: t('all_methods') },
        ...(options.paymentMethods || []).map(method => ({
            value: method,
            label: t(method) || method.charAt(0).toUpperCase() + method.slice(1)
        }))
    ];

    const hasActiveFilters = searchQuery || statusFilter !== 'all' || typeFilter !== 'all' || 
                             monthFilter !== 'all' || yearFilter !== 'all' || paymentMethodFilter !== 'all';

    return (
        <div className={`${styles.FinanceFilters__root}`}>
            <div className={`${styles.FinanceFilters__searchWrapper}`}>
                <Icon name="SEARCH" className={`${styles.FinanceFilters__searchIcon}`} size="1.2rem" />
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('search_placeholder')}
                    className={`${styles.FinanceFilters__searchInput}`}
                    size="sm"
                />
            </div>

            <div className={`${styles.FinanceFilters__groups}`}>
                <FormGroup label={t('status')} className={`${styles.FinanceFilters__group}`}>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        options={statusOptions}
                        size="sm"
                    />
                </FormGroup>

                <FormGroup label={t('type')} className={`${styles.FinanceFilters__group}`}>
                    <Select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        options={typeOptions}
                        size="sm"
                    />
                </FormGroup>

                <FormGroup label={t('month')} className={`${styles.FinanceFilters__group}`}>
                    <Select
                        value={monthFilter}
                        onChange={(e) => setMonthFilter(e.target.value)}
                        options={monthOptions}
                        size="sm"
                    />
                </FormGroup>

                <FormGroup label={t('year')} className={`${styles.FinanceFilters__group}`}>
                    <Select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        options={yearOptions}
                        size="sm"
                    />
                </FormGroup>

                <FormGroup label={t('payment_method')} className={`${styles.FinanceFilters__group}`}>
                    <Select
                        value={paymentMethodFilter}
                        onChange={(e) => setPaymentMethodFilter(e.target.value)}
                        options={paymentMethodOptions}
                        size="sm"
                    />
                </FormGroup>

                {hasActiveFilters && (
                    <div className={`${styles.FinanceFilters__group} ${styles.FinanceFilters__groupActions}`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className={`${styles.FinanceFilters__clear}`}
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
                            {t('clear_filters')}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

