import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
// Deliberate exception to the CSS Modules rule: App.css is a root-level global
// stylesheet (layout scaffolding + dev-mode indicator). All component styles
// live in *.module.css; only this root file and index.css are global on purpose.
import './App.css';

// Routing Orchestrator
import { AppRouter } from '@/routes/AppRouter';

// Global UI Components
// Moved to ProtectedRoute to prevent them from showing on public pages
import { ErrorBoundary } from '@/components/molecules/ErrorBoundary';

/**
 * Main Application Orchestrator.
 * Pure orchestrator component that coordinates global UI and routing.
 */
export const App = () => {
  useEffect(() => {
    // Visual indicator for Development Mode
    if (import.meta.env.DEV) {
      document.body.classList.add('dev-mode');
    } else {
      document.body.classList.remove('dev-mode');
    }
  }, []);

  return (
    <ErrorBoundary>
      <Toaster position="top-right" containerClassName="app__toaster-container" />
      <AppRouter />
    </ErrorBoundary>
  );
};
