import React from 'react';
import { useInstitutionFinances } from '../hooks/useInstitutionFinances';

// Molecules
import InstitutionSummary from '../../../components/molecules/InstitutionSummary';
import InstitutionTransactionsTable from '../../../components/molecules/InstitutionTransactionsTable';
import InstitutionPatientsTable from '../../../components/molecules/InstitutionPatientsTable';
import InstitutionPaymentModal from '../../../components/molecules/InstitutionPaymentModal';
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
    React.useEffect(() => { setSelectedTrs(new Set()); }, [selectedInstId]);

    const isRealDebt = (tr) => {
        const paymentLower = (tr.payment_status || '').toLowerCase();
        const statusLower = (tr.appointment_status || '').toLowerCase();
        const done = ['completed', 'attended', 'arrived', 'absent'].includes(statusLower);
        return paymentLower === 'pending' && (!tr.appointment_id || done);
    };

    const filteredTransactions = report?.transactions.filter(tr =>
        showPendingOnly ? isRealDebt(tr) : true
    ) || [];

    const selectedAmount = React.useMemo(() => {
        if (!report?.transactions) return 0;
        return report.transactions
            .filter(tr => selectedTrs.has(tr.transaction_id))
            .reduce((sum, tr) => sum + Number(tr.amount), 0);
    }, [selectedTrs, report?.transactions]);

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
        const monthKey = t('months_array')[date.getMonth()].toLowerCase();
        const month = t(monthKey);
        const year = date.getFullYear();
        return t('date_format_long')
            .replace('{day}', day)
            .replace('{month}', month)
            .replace('{year}', year);
    };

    if (!selectedInstId) {
        return (
            <div className="inst-finances">
                <div style={{ color: 'var(--text-muted)', padding: '4rem', textAlign: 'center' }}>
                    <span style={{ fontSize: '2.5rem' }}>🏥</span>
                    <p style={{ marginTop: '1rem', fontWeight: 600 }}>Seleccioná una institución del panel izquierdo</p>
                </div>
            </div>
        );
    }

    return (
        <div className="inst-finances">
            {/* View mode toggle: Finanzas / Pacientes */}
            <div className="inst-finances__selector-bar" style={{ justifyContent: 'flex-end' }}>
                <div className="inst-finances__view-toggle">
                    <button
                        className={`inst-finances__toggle-btn ${viewMode === 'transactions' ? 'inst-finances__toggle-btn--active' : ''}`}
                        onClick={() => setViewMode('transactions')}
                    >
                        📊 {t('finances')}
                    </button>
                    <button
                        className={`inst-finances__toggle-btn ${viewMode === 'patients' ? 'inst-finances__toggle-btn--active' : ''}`}
                        onClick={() => setViewMode('patients')}
                    >
                        👥 {t('patients')}
                    </button>
                </div>
            </div>

            {loadingReport && <div className="loading-state">{t('loading_report')}</div>}

            {report && viewMode === 'transactions' && (
                <div className="flex flex-col gap-4 animate-fade-in">
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
                <div className="flex flex-col gap-4 animate-fade-in">
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
