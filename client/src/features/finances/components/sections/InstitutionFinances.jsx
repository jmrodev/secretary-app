import React from 'react';
import { useInstitutionFinances } from '@/features/finances/hooks/useInstitutionFinances';

// Molecules
import InstitutionSummary from '@/features/finances/components/sections/InstitutionSummary';
import InstitutionTransactionsTable from '@/features/finances/components/tables/InstitutionTransactionsTable';
import InstitutionPatientsTable from '@/features/finances/components/tables/InstitutionPatientsTable';
import InstitutionPaymentModal from '@/features/finances/components/modals/InstitutionPaymentModal';

// Atoms
import Button from '@/components/atoms/Button';
import Icon from '@/components/atoms/Icon';

import './InstitutionFinances.css';

/**
 * InstitutionFinances Organism.
 * Orchestrates financial reports and patient data for health insurance institutions.
 * Institution selection is managed by the parent sidebar (Institutions.jsx).
 */
const InstitutionFinances = ({ institutions, selectedInstId, viewMode, setViewMode, t }) => {
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

    React.useEffect(() => {
        if (isPayModalOpen) {
            setPaymentData(p => ({ ...p, amount: selectedAmount.toString(), transaction_ids: Array.from(selectedTrs) }));
        }
    }, [isPayModalOpen, selectedAmount, selectedTrs, setPaymentData]);

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
            const pendingIds = filteredTransactions
                .filter(tr => tr.payment_status === 'pending')
                .map(tr => tr.transaction_id);
            setSelectedTrs(new Set(pendingIds));
        } else {
            setSelectedTrs(new Set());
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        const day = date.getDate();
        const months = t('months_array') || [
            'january', 'february', 'march', 'april', 'may', 'june',
            'july', 'august', 'september', 'october', 'november', 'december'
        ];
        const monthKey = months[date.getMonth()].toLowerCase();
        const month = t(monthKey);
        const year = date.getFullYear();
        return (t('date_format_long') || "{day} {month} {year}")
            .replace('{day}', day)
            .replace('{month}', month)
            .replace('{year}', year);
    };

    if (!selectedInstId) {
        return (
            <div className="institution-finances">
                <div className="institution-finances__empty-state">
                    <span className="institution-finances__empty-icon"><Icon name="local_hospital" size="2rem" /></span>
                    <p className="institution-finances__empty-text">
                        {t('select_institution_desc') || 'Seleccioná una institución del panel izquierdo'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="institution-finances">
            {/* View mode toggle: Finanzas / Pacientes */}
            <div className="institution-finances__selector-bar">
                <div className="institution-finances__view-toggle">
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

            {loadingReport && <div className="institution-finances__loading">{t('loading_report')}</div>}

            {report && viewMode === 'transactions' && (
                <div className="institution-finances__grid">
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
                        onPayClick={() => setIsPayModalOpen(true)}
                        formatDate={formatDate}
                        t={t}
                    />
                </div>
            )}

            {report && viewMode === 'patients' && (
                <div className="institution-finances__grid">
                    <InstitutionPatientsTable
                        patients={patients}
                        formatDate={formatDate}
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

export default InstitutionFinances;
