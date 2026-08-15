import React from 'react';
import { useInstitutionFinances } from '@/features/finances/hooks/useInstitutionFinances';
import { formatDate } from '@/utils/core/dateUtils';

// Molecules
import { InstitutionSummary } from '@/features/finances/components/sections/InstitutionSummary';
import { InstitutionTransactionsTable } from '@/features/finances/components/tables/InstitutionTransactionsTable';
import { InstitutionPatientsTable } from '@/features/finances/components/tables/InstitutionPatientsTable';
import { InstitutionPaymentModal } from '@/features/finances/components/modals/InstitutionPaymentModal';

// Atoms
import { Button } from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

import styles from './InstitutionFinances.module.css';

/**
 * InstitutionFinances Organism.
 * Orchestrates financial reports and patient data for health insurance institutions.
 * Institution selection is managed by the parent sidebar (Institutions.jsx).
 */
export const InstitutionFinances = ({ institutions, selectedInstId, viewMode, setViewMode, t }) => {
    const {
        report,
        patients,
        loadingReport,
        isPayModalOpen,
        setIsPayModalOpen,
        paymentData,
        setPaymentData,
        handlePaymentSubmit
    } = useInstitutionFinances(institutions, selectedInstId);

    const [showPendingOnly, setShowPendingOnly] = React.useState(true);
    const [selectedTrs, setSelectedTrs] = React.useState(new Set());

    // Reset selection when institution changes
    React.useEffect(() => { queueMicrotask(() => setSelectedTrs(new Set())); }, [selectedInstId]);

    const isRealDebt = (tr) => {
        const paymentLower = (tr.payment_status || '').toLowerCase();
        const statusLower = (tr.appointment_status || '').toLowerCase();
        const done = ['completed', 'attended', 'arrived', 'absent'].includes(statusLower);
        return paymentLower === 'pending' && (!tr.appointment_id || done);
    };

    const filteredTransactions = report?.transactions.filter(tr =>
        showPendingOnly ? isRealDebt(tr) : true
    ) || [];

    const selectedAmount = (() => {
        if (!report?.transactions) return 0;
        return report.transactions
            .filter(tr => selectedTrs.has(tr.transaction_id))
            .reduce((sum, tr) => sum + Number(tr.amount), 0);
    })();



    const handleToggleSelect = (id) => {
        setSelectedTrs(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            const pendingIds = filteredTransactions.reduce((acc, tr) => {
                if (tr.payment_status === 'pending') acc.push(tr.transaction_id);
                return acc;
            }, []);
            setSelectedTrs(new Set(pendingIds));
        } else {
            setSelectedTrs(new Set());
        }
    };

    if (!selectedInstId) {
        return (
            <div className={`${styles.InstitutionFinances__root}`}>
                <div className={`${styles.InstitutionFinances__emptyState}`}>
                    <span className={`${styles.InstitutionFinances__emptyIcon}`}><Icon name="local_hospital" size="2rem" /></span>
                    <p className={`${styles.InstitutionFinances__emptyText}`}>
                        {t('select_institution_desc') || 'Seleccioná una institución del panel izquierdo'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className={`${styles.InstitutionFinances__root}`}>
            {/* View mode toggle: Finanzas / Pacientes */}
            <div className={`${styles.InstitutionFinances__selectorBar}`}>
                <div className={`${styles.InstitutionFinances__viewToggle}`}>
                    <Button
                        variant={viewMode === 'transactions' ? 'primary' : 'ghost'}
                        size="sm-compact"
                        onClick={() => setViewMode('transactions')}
                        icon={<Icon name="analytics" size="1.1rem" />}
                    >
                        {t('finances')}
                    </Button>
                    <Button
                        variant={viewMode === 'patients' ? 'primary' : 'ghost'}
                        size="sm-compact"
                        onClick={() => setViewMode('patients')}
                        icon={<Icon name="group" size="1.1rem" />}
                    >
                        {t('patients')}
                    </Button>
                </div>
            </div>

            {loadingReport && <div className={`${styles.InstitutionFinances__loading}`}>{t('loading_report')}</div>}

            {report && viewMode === 'transactions' && (
                <div className={`${styles.InstitutionFinances__grid}`}>
                    <InstitutionSummary
                        report={report}
                        selectedAmount={selectedAmount}
                        t={t}
                    />
                    <InstitutionTransactionsTable
                        transactions={filteredTransactions}
                        showPendingOnly={showPendingOnly}
                        setShowPendingOnly={setShowPendingOnly}
                        selectedTrs={selectedTrs}
                        onToggleSelect={handleToggleSelect}
                        onSelectAll={handleSelectAll}
                        onPayClick={() => {
                            setPaymentData(p => ({
                                ...p,
                                amount: selectedAmount.toString(),
                                transaction_ids: Array.from(selectedTrs)
                            }));
                            setIsPayModalOpen(true);
                        }}
                        formatDate={(d) => formatDate(d, { monthName: true })}
                        t={t}
                    />
                </div>
            )}

            {report && viewMode === 'patients' && (
                <div className={`${styles.InstitutionFinances__grid}`}>
                    <InstitutionPatientsTable
                        patients={patients}
                        formatDate={(d) => formatDate(d, { monthName: true })}
                        t={t}
                    />
                </div>
            )}

            <InstitutionPaymentModal
                isOpen={isPayModalOpen}
                onClose={() => setIsPayModalOpen(false)}
                paymentData={paymentData}
                setPaymentData={setPaymentData}
                onSubmit={handlePaymentSubmit}
                t={t}
            />
        </div>
    );
};

