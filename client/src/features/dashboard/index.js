
// Public API for the Dashboard Feature
// Centralized hub for statistics, reminders and orchestration

// Controllers & Hooks
export { useDashboardController } from '@/features/dashboard/hooks/useDashboardController';

// Components
export { default as DashboardPage } from '@/features/dashboard/DashboardPage';
export { default as DashboardSidebar } from '@/features/dashboard/components/DashboardSidebar';
export { default as DashboardReminders } from '@/features/dashboard/components/DashboardReminders';
export { default as QuickActions } from '@/features/dashboard/components/QuickActions';
export { default as DashboardLayout } from '@/features/dashboard/components/DashboardLayout';
