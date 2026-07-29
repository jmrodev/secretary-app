// Public API for the Finances Feature
// Exposes only what is needed by pages or other features.

// Hooks
export { useFinancesPageController } from '@/features/finances/hooks/useFinancesPageController';
export { useInstitutionFinances } from '@/features/finances/hooks/useInstitutionFinances';
export { useFinanceHandlers } from '@/features/finances/hooks/useFinanceHandlers';
export { useTransactionForm } from '@/features/finances/hooks/useTransactionForm';

// Components
export { default as FinancesPage } from '@/features/finances/FinancesPage';
export { default as TransactionModal } from '@/features/finances/components/modals/TransactionModal';
export { default as EditTransactionModal } from '@/features/finances/components/modals/EditTransactionModal';
export { default as BalanceFinancialSummary } from '@/features/finances/components/sections/BalanceFinancialSummary';
export { default as FinanceFilters } from '@/features/finances/components/ui/FinanceFilters';
export { default as FinanceStatsCards } from '@/features/finances/components/sections/FinanceStatsCards';
export { default as FinanceSidebar } from '@/features/finances/components/ui/FinanceSidebar';
export { default as InstitutionFinances } from '@/features/finances/components/sections/InstitutionFinances';
export { default as TransactionsTable } from '@/features/finances/components/tables/TransactionsTable';
export { default as CashBoxDeliveryModal } from '@/features/finances/components/modals/CashBoxDeliveryModal';
export { default as PendingClosuresModal } from '@/features/finances/components/modals/PendingClosuresModal';
export { default as BalanceCashFlowTable } from '@/features/finances/components/tables/BalanceCashFlowTable';
export { default as BalanceDebtsTable } from '@/features/finances/components/tables/BalanceDebtsTable';
export { default as CashBoxSummary } from '@/features/finances/components/sections/CashBoxSummary';
export { default as HistoricalWithdrawalModal } from '@/features/finances/components/modals/HistoricalWithdrawalModal';

