import React from 'react';
import { useInstitutionFinances } from '../../hooks/useInstitutionFinances';

// Molecules
import InstitutionSelector from '../molecules/InstitutionSelector';
import InstitutionSummary from '../molecules/InstitutionSummary';
import InstitutionTransactionsTable from '../molecules/InstitutionTransactionsTable';
import InstitutionPatientsTable from '../molecules/InstitutionPatientsTable';
import InstitutionPaymentModal from '../molecules/InstitutionPaymentModal';
import './InstitutionFinances.css';

/**
 * InstitutionFinances Organism.
 * Orchestrates financial reports and patient data for health insurance institutions.
 */
const InstitutionFinances = ({ institutions, t }) => {
    const {
        selectedInstId,
        setSelectedInstId,
        report,
        patients,
        loadingReport,
        isPayModalOpen,
        setIsPayModalOpen,
        paymentData,
        setPaymentData,
        handlePaymentSubmit
    } = useInstitutionFinances(institutions);

    const [showPendingOnly, setShowPendingOnly] = React.useState(true);
    const [viewMode, setViewMode] = React.useState('transactions');

    const filteredTransactions = report?.transactions.filter(t =>
        showPendingOnly ? t.payment_status === 'pending' : true
    ) || [];

    /**
     * Helper to format dates using internationalization keys.
     */
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

    return (
        <div className="inst-finances">
            <InstitutionSelector
                institutions={institutions}
                selectedInstId={selectedInstId}
                setSelectedInstId={setSelectedInstId}
                viewMode={viewMode}
                setViewMode={setViewMode}
                t={t}
            />

            {loadingReport && <div className="loading-state">{t('loading_report')}</div>}

            {report && viewMode === 'transactions' && (
                <div className="flex flex-col gap-4 animate-fade-in h-[calc(100vh-200px)]">
                    <InstitutionSummary
                        report={report}
                        showPendingOnly={showPendingOnly}
                        setShowPendingOnly={setShowPendingOnly}
                        onPayClick={() => setIsPayModalOpen(true)}
                        t={t}
                    />

                    <InstitutionTransactionsTable
                        transactions={filteredTransactions}
                        showPendingOnly={showPendingOnly}
                        formatDate={formatDate}
                        t={t}
                    />
                </div>
            )}

            {report && viewMode === 'patients' && (
                <div className="flex flex-col gap-4 animate-fade-in h-[calc(100vh-250px)]">
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
