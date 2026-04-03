import React from 'react';
import Button from '../../../components/atoms/Button';
import Icon from '../../../components/atoms/Icon';
import FinanceDoctorFilter from './FinanceDoctorFilter';
import CashBoxSummary from './CashBoxSummary';
import FinanceFilters from './FinanceFilters';
import './FinanceSidebar.css';

/**
 * FinanceSidebar Organism.
 * Encapsulates all sidebar actions, filters, and summaries for the Finance page.
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
            <div className="dashboard-card">
                <div className="finance-sidebar__stack">
                    {isAdminOrSecretary && (
                        <div className="sidebar-section">
                            <label className="sidebar-label">{t('doctor_label')}</label>
                            <FinanceDoctorFilter
                                doctors={doctors}
                                selectedDoctorFilter={selectedDoctorFilter}
                                setSelectedDoctorFilter={onSelectDoctor}
                                t={t}
                            />
                        </div>
                    )}

                    {user.role !== 'patient' && (
                        <div className="sidebar-section">
                            <div className="finance-sidebar__stack--sm">
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className="justify-start w-full"
                                    onClick={onOpenNewTransaction}
                                    icon={<Icon name="add" size="1.1rem" />}
                                >
                                    {t('new_transaction')}
                                </Button>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className="justify-start w-full relative"
                                    onClick={onOpenPendingClosures}
                                    icon={<Icon name="calendar_view_week" size="1.1rem" />}
                                >
                                    {t('deliver_box') || 'Entregar Caja'}
                                    {pendingClosuresCount > 0 && (
                                        <span className="finance-sidebar__badge">
                                            {pendingClosuresCount}
                                        </span>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}

                    {selectedDoctorFilter && (() => {
                        const d = doctors.find(doc => doc.id == selectedDoctorFilter);
                        const balances = calculateBalanceByMethod(selectedDoctorFilter);
                        if (d && balances.cash > 0) {
                            return (
                                <div className="sidebar-section">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="justify-start w-full"
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
            </div>

            {/* Cash Summary Card (Only for Secretary) */}
            {
                user.role === 'secretary' && (
                    <div className="dashboard-card">
                        <CashBoxSummary
                            doctors={doctors}
                            selectedDoctorFilter={selectedDoctorFilter}
                            onSelectDoctor={onSelectDoctor}
                            calculateBalance={calculateBalance}
                            calculateBalanceByMethod={calculateBalanceByMethod}
                            t={t}
                            compact
                        />
                    </div>
                )
            }

            {/* Filters Card */}
            <div className="dashboard-card">
                <FinanceFilters
                    filters={filters}
                    handlers={handlers}
                    t={t}
                />
            </div>
        </aside >
    );
};

export default FinanceSidebar;
