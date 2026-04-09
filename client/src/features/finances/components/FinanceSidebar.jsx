import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import FinanceDoctorFilter from './FinanceDoctorFilter';
import CashBoxSummary from './CashBoxSummary';
import FinanceFilters from './FinanceFilters';
import './FinanceSidebar.css';

/**
 * FinanceSidebar Organism.
 * Encapsulates all sidebar actions, filters, and summaries for the Finance page.
 * Refactored to follow BEM and Atomic Design standards.
 */
const FinanceSidebar = ({
    isAdminOrSecretary,
    user,
    doctors,
    selectedDoctorFilter,
    pendingClosuresCount,
    onOpenNewTransaction,
    onOpenPendingClosures,
    onSelectDoctor,
    onOpenCloseBox,
    calculateBalance,
    calculateBalanceByMethod,
    filters,
    handlers,
    t
}) => {
    return (
        <aside className="finance-sidebar">
            {/* Main Action & Doctor Filter Card */}
            <Card className="finance-sidebar__card">
                <div className="finance-sidebar__stack">
                    {isAdminOrSecretary && (
                        <div className="finance-sidebar__section">
                            <label className="finance-sidebar__label">{t('doctor_label')}</label>
                            <FinanceDoctorFilter
                                doctors={doctors}
                                selectedDoctorFilter={selectedDoctorFilter}
                                setSelectedDoctorFilter={onSelectDoctor}
                                t={t}
                                className="finance-sidebar__doctor-filter"
                            />
                        </div>
                    )}

                    {user.role !== 'patient' && (
                        <div className="finance-sidebar__section">
                            <div className="finance-sidebar__actions">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="finance-sidebar__action-btn"
                                    onClick={onOpenNewTransaction}
                                    icon={<Icon name="add" size="1.1rem" />}
                                >
                                    {t('new_transaction')}
                                </Button>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="finance-sidebar__action-btn finance-sidebar__action-btn--badge"
                                    onClick={onOpenPendingClosures}
                                    icon={<Icon name="calendar_view_week" size="1.1rem" />}
                                >
                                    {t('deliver_box') || 'Entregar Caja'}
                                    <Badge 
                                        count={pendingClosuresCount} 
                                        position="top-right" 
                                        variant="danger" 
                                    />
                                </Button>
                            </div>
                        </div>
                    )}

                    {selectedDoctorFilter && (() => {
                        const d = doctors.find(doc => doc.id == selectedDoctorFilter);
                        const balances = calculateBalanceByMethod(selectedDoctorFilter);
                        if (d && balances.cash > 0) {
                            return (
                                <div className="finance-sidebar__section">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="finance-sidebar__action-btn"
                                        onClick={() => onOpenCloseBox(d, balances.cash)}
                                        icon={<Icon name="payments" size="1rem" />}
                                    >
                                        {t('deliver')} a {d.full_name?.split(' ')[0]}
                                    </Button>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            </Card>

            {/* Cash Summary Card (Only for Secretary) */}
            {
                user.role === 'secretary' && (
                    <Card className="finance-sidebar__card">
                        <CashBoxSummary
                            doctors={doctors}
                            selectedDoctorFilter={selectedDoctorFilter}
                            onSelectDoctor={onSelectDoctor}
                            calculateBalance={calculateBalance}
                            calculateBalanceByMethod={calculateBalanceByMethod}
                            t={t}
                            compact
                        />
                    </Card>
                )
            }

            {/* Filters Card */}
            <Card className="finance-sidebar__card">
                <FinanceFilters
                    filters={filters}
                    handlers={handlers}
                    t={t}
                />
            </Card>
        </aside >
    );
};

export default FinanceSidebar;


