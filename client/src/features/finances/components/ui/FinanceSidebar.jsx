import React from 'react';
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';
import Card from '@/components/atoms/Card';
import Badge from '@/components/atoms/Badge';
import CashBoxSummary from '@/features/finances/components/sections/CashBoxSummary';
import FinanceFilters from '@/features/finances/components/ui/FinanceFilters';
import styles from './FinanceSidebar.module.css';

/**
 * FinanceSidebar Organism.
 * Encapsulates all sidebar actions, filters, and summaries for the Finance page.
 * Refactored to follow BEM and Atomic Design standards.
 */
const FinanceSidebar = ({
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
        <aside className={`${styles.root} dashboard-layout__sidebar`}>
            {/* Main Action & Doctor Filter Card */}
            <Card className={`${styles.card}`}>
                <div className={`${styles.stack}`}>
                    {user.role !== 'patient' && (
                        <div className={`${styles.section}`}>
                            <div className={`${styles.actions}`}>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    className={`${styles.actionBtn}`}
                                    onClick={onOpenNewTransaction}
                                    icon={<Icon name="add" size="1.1rem" />}
                                >
                                    {t('new_transaction')}
                                </Button>

                                <Button
                                    variant="secondary"
                                    size="sm"
                                    className={`${styles.actionBtn} ${styles.actionBtnBadge}`}
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
                                <div className={`${styles.section}`}>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className={`${styles.actionBtn}`}
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
                    <Card className={`${styles.card}`}>
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
            <Card className={`${styles.card}`}>
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


